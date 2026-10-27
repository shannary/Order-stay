"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type QrCameraProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Pemindai QR memakai kamera belakang handphone (getUserMedia).
 * Hasil scan yang ber-format /m/{token} → diarahkan ke halaman meja.
 * Browser tanpa kamera/ditolak izin → pesan + fallback isi token manual.
 */
export function QrCamera({ open, onClose }: QrCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const router = useRouter();

  // mencegah dobel-navigasi dari satu QR
  const navigated = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleDecode = useCallback(
    (token: string) => {
      if (navigated.current) return;
      navigated.current = true;
      stopCamera();
      router.push(`/m/${encodeURIComponent(token)}`);
    },
    [router, stopCamera]
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, w, h);
        const image = ctx?.getImageData(0, 0, w, h);
        if (image) {
          const code = jsQR(image.data, w, h);
          if (code?.data) {
            // terima bentuk penuh URL (https://.../m/xxx) atau token telanjang
            const match = code.data.match(/\/m\/([^/?#]+)/);
            const token = match?.[1] ?? (code.data as string).trim();
            if (token) {
              handleDecode(token);
              return;
            }
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [handleDecode]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // kamera belakang
        audio: false,
      });
      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError(
        "Kamera tidak dapat dibuka — izin kamera situs ini pada pengaturan browser, atau isi token di bawah secara manual."
      );
    }
  }, [tick]);

  useEffect(() => {
    if (!open) return;
    navigated.current = false;
    void startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-[#18181B]/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto flex h-full max-w-md flex-col p-4">
        <div className="flex items-center justify-between text-[#FBFBFA]">
          <p className="text-sm font-bold">Arahkan kamera ke QR meja</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kamera"
            className="rounded-full bg-white/10 p-2"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl bg-[#18181B] ring-1 ring-white/10">
          <video
            ref={videoRef}
            playsInline
            muted
            className="size-full object-cover"
          />
          {/* frame panduan */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white/50"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 w-2/3 -translate-x-1/2 -translate-y-1/2 self-center rounded bg-[#4A5D4E] opacity-70 [animation:none]"
          />
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-400/90 px-3 py-2 text-xs font-semibold text-amber-950">
            <CameraOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {/* fallback manual */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualToken.trim()) handleDecode(manualToken.trim());
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="atau isi token manual: t_xxxxx"
            className="min-w-0 flex-1 rounded-full bg-white/95 px-4 py-2.5 text-xs text-[#18181B] outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-[#4A5D4E] px-4 py-2.5 text-xs font-semibold text-[#FBFBFA]"
          >
            <Camera className="size-3.5" aria-hidden />
            Buka
          </button>
        </form>
      </div>
    </div>
  );
}
