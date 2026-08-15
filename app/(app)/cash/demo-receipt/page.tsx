import type { Metadata } from "next";
import { PaymentReceipt } from "@/components/cash/payment-receipt";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Preview Struk" };

export default async function DemoReceiptPage() {
  await requireUser();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6">
      <PaymentReceipt
        data={{
          amount: 20000,
          monthLabel: "Agustus 2026",
          houseBlock: "BC3-22",
          name: "Muhammad Jiaul Arif",
          date: "14 Agustus 2026",
          refCode: "BC-ABC123",
        }}
      />
    </div>
  );
}
