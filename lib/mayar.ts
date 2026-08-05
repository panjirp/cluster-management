/**
 * Mayar Payment Gateway Integration
 *
 * Bridges cluster-management iuran (MonthlyDue) with Mayar's invoice/payment system.
 *
 * Flow:
 *  1. WARGA opens `/cash/dues/proof-submit` → sees "Bayar dengan Mayar"
 *  2. Frontend calls POST /api/mayar/invoice/create  (body: { monthlyDueId })
 *  3. Server creates a Mayar invoice for the exact amount + metadata
 *  4. Server responds with { invoiceId, paymentUrl, qrUrl, status }
 *  5. Frontend shows payment page / QRIS code
 *  6. Mayar fires webhook on payment → POST /api/mayar/webhook
 *  7. Server marks MonthlyDue.isPaid = true, stores mayarInvoiceId
 *  8. WARGA sees "Lunas" on next page load
 */

import https from "https";

// ─── Types ────────────────────────────────────────────────────────────────────

type MayarInvoice = {
  ok: boolean;
  invoiceId: string;
  paymentUrl: string;
  qrUrl: string;
  status: string;
};

type InvoiceResponse = {
  id: string;
  status: string;
  linkPayment?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  qrisUrl?: string;
  [key: string]: unknown;
};

// ─── Config / Helpers ─────────────────────────────────────────────────────────

function resolveApiKey(): string {
  return process.env.MAYAR_API_KEY || "";
}

function apiBaseUrl(): string {
  const endpoint = process.env.NODE_ENV === "development" ? "sandbox" : "production";
  return endpoint === "sandbox" ? "https://api.mayar.club" : "https://api.mayar.id";
}

function checkResp(res: { status: number; body?: unknown; raw?: string }): void {
  if (res.status >= 200 && res.status < 300) return;
  const body = res.body as Record<string, unknown> | undefined;
  const msg = (body && (body.messages as string) || (body as { message?: string }).message) || res.raw || `HTTP ${res.status}`;
  throw new Error(`Mayar API ${res.status} — ${msg}`);
}

async function mayarRequest(
  method: string,
  path: string,
  opts: { apiKey?: string; body?: unknown; query?: Record<string, string> } = {}
): Promise<{ status: number; body: unknown }> {
  const key = opts.apiKey || resolveApiKey();
  if (!key) {
    throw new Error(
      "MAYAR_API_KEY tidak di-set. Set env MAYAR_API_KEY dengan API key dari https://mayar.id"
    );
  }

  return new Promise((resolve, reject) => {
    const base = apiBaseUrl();
    const url = new URL(base + path);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
      }
    }

    const data = opts.body ? Buffer.from(JSON.stringify(opts.body)) : null;
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
          "User-Agent": "cluster-management/1.0",
          ...(data ? { "Content-Type": "application/json", "Content-Length": data.length } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed: unknown;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch (_) {
            parsed = text;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Invoice creation ──────────────────────────────────────────────────────────

/**
 * Build the invoice description line used in Mayar.
 * @param blockNumber  e.g. "A-01"
 * @param month        1-12
 * @param year         e.g. 2026
 */
function invoiceDescription(blockNumber: string, month: number, year: number): string {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `Iuran ${monthNames[month - 1]} ${year} — Rumah ${blockNumber}`;
}

/**
 * Create a Mayar invoice for a MonthlyDue record.
 */
export async function createInvoice(params: {
  monthlyDueId: string;
  blockNumber: string;
  month: number;
  year: number;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  apiKey?: string;
}): Promise<MayarInvoice> {
  const { monthlyDueId, blockNumber, month, year, amount, customerEmail, customerName, apiKey } = params;

  if (!monthlyDueId) throw new Error("monthlyDueId wajib diisi.");
  if (!blockNumber) throw new Error("blockNumber wajib diisi.");
  if (!amount || amount <= 0) throw new Error("amount harus > 0.");

  const description = invoiceDescription(blockNumber, month, year);

  const body: Record<string, unknown> = {
    name: description,
    amount,
    description,
    metadata: {
      source: "cluster-management",
      monthlyDueId,
      blockNumber,
      month,
      year,
    },
    ...(customerEmail ? { customerEmail } : {}),
    ...(customerName ? { customerName } : {}),
  };

  const res = await mayarRequest("POST", "/hl/v2/payments/create", { apiKey, body });
  checkResp(res);
  const invoice = res.body as InvoiceResponse;

  return {
    ok: true,
    invoiceId: invoice.id,
    paymentUrl: invoice.linkPayment || invoice.paymentUrl || "",
    qrUrl: invoice.qrCodeUrl || invoice.qrisUrl || "",
    status: invoice.status,
  };
}

// ─── Invoice status ────────────────────────────────────────────────────────────

/**
 * Fetch a Mayar invoice by its Mayar id.
 */
export async function getInvoice(
  invoiceId: string,
  apiKey?: string
): Promise<InvoiceResponse> {
  if (!invoiceId) throw new Error("invoiceId wajib diisi.");
  const res = await mayarRequest("GET", `/hl/v2/payments/${encodeURIComponent(invoiceId)}`, { apiKey });
  checkResp(res);
  return res.body as InvoiceResponse;
}

/**
 * Check Mayar account balance.
 */
export async function getBalance(apiKey?: string): Promise<unknown> {
  const res = await mayarRequest("GET", "/hl/v2/balance", { apiKey });
  checkResp(res);
  return res.body;
}

// ─── QRIS ──────────────────────────────────────────────────────────────────────

/**
 * Generate a dynamic QRIS code for a given amount.
 */
export async function generateQr(
  amount: number,
  apiKey?: string
): Promise<unknown> {
  if (!amount || amount <= 0) throw new Error("amount harus > 0.");
  return mayarRequest("GET", "/hl/v2/qrcode", { apiKey, query: { amount: String(amount) } });
}
