"use client";

import { useState } from "react";
import { CheckCircle2, ShieldQuestion, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GateQrScanner } from "@/components/gate/gate-qr-scanner";

type VerifyResult = {
  found: boolean;
  usable: boolean;
  reason: string | null;
  pass?: {
    code: string;
    guestName: string;
    vehicleType: string;
    plateNumber: string | null;
    purpose: string;
    validUntil: string;
    hostName: string;
    houseBlock: string | null;
    status: string;
  };
};

const vehicleLabels: Record<string, string> = { MOBIL: "Mobil", MOTOR: "Motor", LAINNYA: "LainNYA".toLowerCase() };

/**
 * Halaman verifikasi gerbang — dipakai satpam dari perangkat bersama.
 * Tanpa login; otentikasi memakai PIN gerbang yang diatur admin.
 */
export default function GatePage() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  async function verify(targetCode?: string) {
    const c = (targetCode ?? code).trim().toUpperCase();
    if (!c) return;
    if (!pin.trim()) {
      setResult({ found: false, usable: false, reason: "Masukkan PIN gerbang dulu." });
      return;
    }
    setBusy(true);
    setCheckedIn(false);
    try {
      const res = await fetch("/api/guest-passes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, pin: pin.trim() }),
      });
      const data = (await res.json()) as VerifyResult & { error?: string };
      if (!res.ok) {
        setResult({ found: false, usable: false, reason: data.error ?? "Verifikasi gagal." });
        return;
      }
      setResult(data);
    } catch {
      setResult({ found: false, usable: false, reason: "Gagal menghubungi server." });
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    if (!result?.pass) return;
    setBusy(true);
    const res = await fetch(`/api/guest-passes/${result.pass.code}/check-in`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pin.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setCheckedIn(true);
      setResult((r) => (r ? { ...r, pass: r.pass ? { ...r.pass, status: "USED" } : r.pass, usable: false } : r));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
            <ShieldQuestion className="size-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Verifikasi Tamu — Pos Satpam</h1>
          <p className="text-sm text-muted-foreground">Barcelona Cove · scan QR atau ketik kode pass</p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gate-pin">PIN Gerbang</Label>
              <Input
                id="gate-pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                autoComplete="off"
              />
            </div>

            <GateQrScanner onScan={(c) => verify(c)} />

            <div className="flex flex-col gap-2">
              <Label htmlFor="gate-code">Kode Pass (manual)</Label>
              <div className="flex gap-2">
                <Input
                  id="gate-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="BC-XXXX"
                  className="font-mono tracking-widest"
                />
                <Button type="button" onClick={() => verify()} disabled={busy}>
                  {busy ? "..." : "Cek"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card
            className={
              checkedIn
                ? "border-green-500/50"
                : result.usable
                  ? "border-green-500/50"
                  : "border-red-500/40"
            }
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                {checkedIn ? (
                  <>
                    <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                    <p className="font-semibold text-green-700 dark:text-green-400">Tamu sudah masuk</p>
                  </>
                ) : result.usable ? (
                  <>
                    <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                    <p className="font-semibold text-green-700 dark:text-green-400">VALID — izinkan masuk</p>
                  </>
                ) : (
                  <>
                    <XCircle className="size-5 text-red-500" />
                    <p className="font-semibold text-red-600 dark:text-red-400">{result.reason ?? "TIDAK VALID"}</p>
                  </>
                )}
              </div>

              {result.pass && (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Tamu:</span>{" "}
                    <span className="font-semibold">{result.pass.guestName}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Kendaraan:</span>{" "}
                    {(vehicleLabels[result.pass.vehicleType] ?? result.pass.vehicleType)}
                    {result.pass.plateNumber ? ` · ${result.pass.plateNumber}` : ""}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Keperluan:</span> {result.pass.purpose}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Tuan rumah:</span>{" "}
                    {result.pass.hostName}
                    {result.pass.houseBlock ? ` (${result.pass.houseBlock})` : ""}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Berlaku s/d:</span>{" "}
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(result.pass.validUntil)
                    )}
                  </p>
                </div>
              )}

              {result.usable && !checkedIn && result.pass && (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={checkIn} disabled={busy}>
                  <CheckCircle2 className="size-4" /> Tandai Masuk
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
