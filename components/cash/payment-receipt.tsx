"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react/dist/ssr";

export type ReceiptData = {
  amount: number;
  monthLabel: string;
  houseBlock: string;
  name: string;
  date: string;
  refCode: string;
};

type Stage = "processing" | "printing" | "complete";

function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

/**
 * Struk pembayaran kas — tampil setelah upload bukti berhasil.
 * Desain polos: kertas struk putih di atas latar hijau dashboard,
 * dengan animasi muncul perlahan (seperti keluar dari printer).
 */
export function PaymentReceipt({ data }: { data: ReceiptData }) {
  const [stage, setStage] = useState<Stage>("processing");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("printing"), 400);
    const t2 = setTimeout(() => setStage("complete"), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [data]);

  const isComplete = stage === "complete";

  return (
    <div className="flex w-full flex-col items-center gap-3 py-4">
      {/* Status */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {isComplete ? (
          <>
            <CheckCircle size={18} weight="fill" className="text-green-600" />
            Pembayaran berhasil!
          </>
        ) : (
          <>
            <CircleNotch size={18} weight="bold" className="animate-spin" />
            {stage === "processing" ? "Memproses pembayaran..." : "Mencetak struk..."}
          </>
        )}
      </div>

      {/* Struk */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full rounded-xl bg-white text-neutral-900 shadow-sm"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 96% 100%, 88% calc(100% - 10px), 80% 100%, 72% calc(100% - 10px), 64% 100%, 56% calc(100% - 10px), 48% 100%, 40% calc(100% - 10px), 32% 100%, 24% calc(100% - 10px), 16% 100%, 8% calc(100% - 10px), 0 100%)",
        }}
      >
        <div className="px-6 pb-10 pt-6 font-mono">
          {/* Header */}
          <div className="mb-3 border-b border-dashed border-neutral-300 pb-3 text-center">
            <p className="text-sm font-bold">BARCELONA COVE</p>
            <p className="text-[10px] text-neutral-500">Kwitansi Pembayaran Kas</p>
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

          <div className="my-3 border-t border-dashed border-neutral-300" />

          <div className="flex justify-between text-[10px]">
            <span className="text-neutral-500">Kode Ref</span>
            <span>{data.refCode}</span>
          </div>
          <p className="mt-3 text-center text-[10px] italic text-neutral-500">
            Terima kasih, pembayaran berhasil diterima!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
