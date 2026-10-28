"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin/pos";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, pin }),
      });
      const data = await res.json() as { error?: string; hint?: string };
      if (!res.ok) {
        setError(data.error ?? "Email atau kata sandi salah");
        setHint(data.hint ?? null);
        return;
      }
      // Session cookie di-set layanan server → proxy.ts langsung mengizinkan
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FBFBFA] px-4">
      <form
        onSubmit={login}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
      >
        <div className="text-center">
          <h1 className="text-lg font-bold text-[#18181B]">Admin Kasir</h1>
          <p className="text-xs text-zinc-500">
            Masuk untuk mengelola pesanan & meja
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sagecafe.id"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold">
            Kata Sandi
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pin" className="text-xs font-semibold">
            PIN Admin
          </Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="•••"
            required
          />
          <p className="text-[11px] text-zinc-400">
            Kode kedua dikeluarkan oleh pemilik akun — selain email &amp; sandi.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="space-y-1 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100"
          >
            <p>{error}</p>
            {hint && (
              <p className="rounded-lg bg-red-100/60 px-2 py-1.5 text-[11px] leading-relaxed text-red-800">
                {hint}
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full gap-2 rounded-xl bg-[#4A5D4E] text-sm font-semibold text-[#FBFBFA] hover:bg-[#4A5D4E]/90"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LogIn className="size-4" aria-hidden />
          )}
          Masuk
        </Button>
      </form>
    </div>
  );
}
