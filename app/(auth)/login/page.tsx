"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { CopyrightFooter } from "@/components/layout/copyright-footer";
import { GrassBackground, GRASS_ACCENT_LIME } from "@/components/shared/grass-background";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email atau password salah.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070b07] p-4 text-foreground">
      {/* Background animasi partikel (konsisten dengan halaman lain) */}
      <GrassBackground accentOverride={GRASS_ACCENT_LIME} />
      {/* Ambient green glows (Grass-style background) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70rem 70rem at 50% -10%, rgba(171,246,0,0.12), transparent 60%), radial-gradient(50rem 50rem at 85% 110%, rgba(46,160,30,0.12), transparent 60%), radial-gradient(40rem 40rem at 10% 100%, rgba(0,0,0,0.6), transparent 60%)",
        }}
      />
      {/* Subtle vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-5">
        {/* Brand / logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="grid size-16 place-items-center overflow-hidden rounded-2xl shadow-[0_0_40px_-8px_rgba(171,246,0,0.55)] ring-1 ring-white/10">
            <Image
              src="/icons/icon-512.png"
              alt="Logo Barcelona Cove"
              width={512}
              height={512}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold tracking-tight text-white">
              Barcelona Cove
            </div>
            <div className="mt-1 text-sm text-white/50">
              Masuk ke portal warga cluster
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-white/70"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@barcelonacove.local"
                className="h-11 rounded-xl border-white/10 bg-white/5 px-3.5 text-[0.95rem] text-white placeholder:text-white/35 focus-visible:border-[#abf600]/60 focus-visible:ring-[#abf600]/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-white/70"
                >
                  Password
                </Label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-white/40 transition-colors hover:text-[#abf600]"
                >
                  Lupa password?
                </a>
              </div>
              <PasswordInput
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-white/10 bg-white/5 px-3.5 text-[0.95rem] text-white placeholder:text-white/35 focus-visible:border-[#abf600]/60 focus-visible:ring-[#abf600]/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-[#abf600] text-[0.95rem] font-semibold text-[#0b1a05] shadow-[0_10px_30px_-10px_rgba(171,246,0,0.7)] transition-all hover:bg-[#baff2b] hover:shadow-[0_10px_34px_-8px_rgba(171,246,0,0.85)] active:translate-y-px disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <CopyrightFooter />
      </div>
    </div>
  );
}
