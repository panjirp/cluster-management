"use client";

import { useEffect, useState } from "react";
import { ReceiptPrinter } from "@/components/shared/receipt-printer";

export type ReceiptData = {
  amount: number;
  monthLabel: string;
  houseBlock: string;
  name: string;
  date: string;
  refCode: string;
};

type Stage = "processing" | "printing" | "complete";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

/**
 * Animasi struk pembayaran — tampil setelah upload bukti pembayaran berhasil.
 * Drives: processing → printing → complete (sekitar 2.3 detik).
 */
export function PaymentReceipt({ data }: { data: ReceiptData }) {
  const [stage, setStage] = useState<Stage>("processing");

  useEffect(() => {
    // Timing lebih pelan, seperti mesin cetak sungguhan
    const t2 = setTimeout(() => setStage("printing"), 1000);
    const t3 = setTimeout(() => setStage("complete"), 4600);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [data]);

  return (
    <div className="flex w-full justify-center py-4">
      <ReceiptPrinter.Root stage={stage} className="w-full">
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Barcelona Cove — Portal Warga
            </p>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            {/* Header struk */}
            <div className="mb-3 border-b border-dashed pb-3 text-center">
              <p className="text-sm font-bold">BARCELONA COVE</p>
              <p className="text-[10px]">Kwitansi Pembayaran Kas</p>
            </div>

            {/* Detail */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Nominal</span>
                <span className="font-bold">{rupiah(data.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Periode</span>
                <span>{data.monthLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rumah</span>
                <span>{data.houseBlock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Atas Nama</span>
                <span>{data.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tanggal</span>
                <span>{data.date}</span>
              </div>
            </div>

            <div className="my-3 border-t border-dashed" />

            <div className="flex justify-between text-[10px]">
              <span>Kode Ref</span>
              <span className="font-mono">{data.refCode}</span>
            </div>
            <p className="mt-3 text-center text-[10px] italic text-neutral-500">
              Terima kasih, pembayaran berhasil diterima!
            </p>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>
    </div>
  );
}

export function formatMonth(year: number, month: number) {
  return `${MONTHS[month - 1]} ${year}`;
}
