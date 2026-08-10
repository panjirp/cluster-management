"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Scanner QR lewat kamera (jsQR). Berjalan di canvas via requestAnimationFrame;
 * hanya memanggil onScan sekali per kode agar tidak spam.
 */
export function GateQrScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCode = useRef<string>("");
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    lastCode.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActive(true);
        scanLoop();
      }
    } catch {
      setError("Kamera tidak dapat diakses. Gunakan input kode manual di bawah.");
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }

  function scanLoop() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(img.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
      if (found?.data) {
        if (found.data !== lastCode.current) {
          lastCode.current = found.data;
          // Payload bisa JSON {type: BC_GUEST_PASS, code} atau kode polos.
          let code = found.data;
          try {
            const parsed = JSON.parse(found.data) as { code?: string };
            if (parsed.code) code = parsed.code;
          } catch {
            /* payload bukan JSON — pakai mentah */
          }
          onScan(code);
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-black/80">
        <video ref={videoRef} className="mx-auto aspect-video w-full max-w-md object-cover" playsInline muted />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={active ? stop : start}>
        {active ? (
          <>
            <CameraOff className="size-4" /> Matikan Kamera
          </>
        ) : (
          <>
            <Camera className="size-4" /> Aktifkan Kamera / Scan QR
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
