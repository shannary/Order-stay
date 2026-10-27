"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Coffee,
  ScanLine,
  ShoppingBag,
  Banknote,
  QrCode,
  UtensilsCrossed,
  Sparkles,
  ArrowDownRight,
  ArrowRight,
} from "lucide-react";
import { CAFE_NAME, CAFE_TAGLINE } from "@/lib/config";

const FEATURES = [
  {
    Icon: ScanLine,
    title: "Scan & Duduk",
    desc: "Tidak antre di kasir. QR di meja sudah menyertakan nomor meja — cukup bijak diterima.",
  },
  {
    Icon: ShoppingBag,
    title: "Pesan dalam 3 langkah",
    desc: "Pilih menu, kustomisasi (sugar & ice level), lanjut checkout. Semuanya dari ponselmu.",
  },
  {
    Icon: Banknote,
    title: "Bayar fleksibel",
    desc: "Tunai di kasir atau langsung QRIS. Status pesanan mengalir realtime ke ponselmu.",
  },
  {
    Icon: UtensilsCrossed,
    title: "Anti salah pengantar",
    desc: "Pesanan terkait nomor meja & catatan khusus — dapur melihat detail lengkap tanpa salah ucap.",
  },
];

const MENU_HIGHLIGHTS = [
  { name: "Signature Latte", note: "House blend · 24K", emoji: "☕" },
  { name: "Matcha Latte", note: "Ceremonial grade · 28K", emoji: "🍵" },
  { name: "Truffle Carbonara", note: "Black truffle · 48K", emoji: "🍝" },
  { name: "Butter Croissant", note: "Panggang sa-tiap dipesan · 16K", emoji: "🥐" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function Landing() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#FBFBFA] text-[#18181B]">
      {/* ============ NAV ============ */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <motion.span
            initial={{ rotate: -12, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex size-9 items-center justify-center rounded-xl bg-[#4A5D4E]"
          >
            <Coffee className="size-4.5 text-[#FBFBFA]" aria-hidden />
          </motion.span>
          <span className="text-base font-bold tracking-tight">
            {CAFE_NAME}
          </span>
        </div>
        <nav className="hidden items-center gap-7 text-sm text-zinc-600 md:flex">
          <a href="#fitur" className="transition-colors hover:text-[#18181B]">Fitur</a>
          <a href="#menu" className="transition-colors hover:text-[#18181B]">Menu</a>
        </nav>
        <a
          href="/table/meja-1"
          className="flex items-center gap-1.5 rounded-full bg-[#18181B] px-4 py-2 text-sm font-semibold text-[#FBFBFA] transition-transform hover:scale-[1.03] active:scale-95"
        >
          Mulai Pesan
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-16">
        {/* blob dekoratif */}
        <div aria-hidden className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-[#4A5D4E]/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 top-40 size-64 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative grid items-center gap-12 md:grid-cols-2">
          <div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4A5D4E] shadow-sm ring-1 ring-zinc-200"
            >
              <Sparkles className="size-3.5" aria-hidden />
              {CAFE_TAGLINE}
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, delay: 0.06 }}
              className="text-5xl font-black leading-[1.04] tracking-tight md:text-6xl"
            >
              Kopi terbaik,
              <br />
              <span className="bg-gradient-to-r from-[#4A5D4E] via-[#6B7F71] to-amber-700 bg-clip-text text-transparent">
                pesan dari meja.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-md text-base leading-relaxed text-zinc-600"
            >
              {CAFE_NAME} membawa pengalaman cafe premium ke QR code — tanpa antre,
              tanpa salah meja. Scan, pilih, dan biarkan kopi kita menemukanmu.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="/admin/login"
                className="flex items-center gap-2 rounded-full bg-[#4A5D4E] px-6 py-3 text-sm font-semibold text-[#FBFBFA] shadow-lg shadow-[#4A5D4E]/25 transition-transform hover:scale-[1.03] active:scale-95"
              >
                <QrCode className="size-4" aria-hidden />
                Login Kasir & Dapur
              </a>
              <a
                href="#fitur"
                className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition-colors hover:text-[#18181B]"
              >
                Pelajari alur
                <ArrowDownRight className="size-4" aria-hidden />
              </a>
            </motion.div>
          </div>

          {/* mock kartu meja melayang */}
          <div className="relative mx-auto w-full max-w-xs">
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="rounded-3xl bg-white p-5 shadow-2xl shadow-zinc-900/10 ring-1 ring-zinc-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{CAFE_NAME}</span>
                <span className="rounded-full bg-[#4A5D4E]/10 px-2.5 py-1 text-[10px] font-bold text-[#4A5D4E]">
                  MEJA 07
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.13 }}
                    className="flex items-center gap-3 rounded-2xl bg-[#FBFBFA] p-2.5 ring-1 ring-zinc-100"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-zinc-100 text-lg">
                      {MENU_HIGHLIGHTS[i]?.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {MENU_HIGHLIGHTS[i]?.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {MENU_HIGHLIGHTS[i]?.note}
                      </p>
                    </div>
                    <span className="ml-auto grid size-7 place-items-center rounded-full bg-[#4A5D4E] text-[#FBFBFA]">
                      +
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#18181B] p-3.5">
                <p className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>3 item</span>
                  <span>Subtotal</span>
                </p>
                <p className="mt-0.5 flex items-center justify-between text-sm font-bold text-[#FBFBFA]">
                  <span>Rp 52.000</span>
                  <span className="flex items-center gap-1">
                    Checkout
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </p>
              </div>
            </motion.div>

            {/* chip mengambang */}
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-4 top-24 hidden rounded-full bg-white px-3.5 py-2 text-[11px] font-bold text-[#18181B] shadow-lg ring-1 ring-zinc-200 md:block"
            >
              🔥 Pesanan #ORD-… dimasak
            </motion.span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.8 }}
              className="absolute -left-6 bottom-16 hidden rounded-full bg-[#4A5D4E] px-3.5 py-2 text-[11px] font-bold text-[#FBFBFA] shadow-lg md:block"
            >
              ✅ Lunas — selesai siap sajian
            </motion.span>
          </div>
        </div>
      </section>

      {/* ============ FITUR ============ */}
      <section id="fitur" className="mx-auto max-w-6xl px-6 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-3xl font-black tracking-tight"
        >
          Sistem yang bekerja
          <span className="text-[#4A5D4E]"> syinch rapi</span>
        </motion.h2>
        <p className="mt-2 max-w-lg text-sm text-zinc-600">
          Dari scan QR di meja hingga dapur, semuanya terhubung supaya
          pelayanan terasa lancar — bukan informasi tergulat.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-[#4A5D4E]/10">
                <Icon className="size-5 text-[#4A5D4E]" aria-hidden />
              </span>
              <h3 className="mt-4 text-sm font-bold">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ MENU PANDUAN ============ */}
      <section id="menu" className="mx-auto max-w-6xl px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-[#18181B] px-8 py-10 text-[#FBFBFA] md:px-12"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Menu favorit hari ini
              </h2>
              <p className="mt-2 max-w-md text-sm text-zinc-400">
                Geser piringan digital — mari kenalan dulu lewat beberapa yang
                paling sering diulang. Semua ada di katalog meja.
              </p>
            </div>
            <a
              href="/table/meja-1"
              className="flex items-center gap-1.5 rounded-full bg-[#FBFBFA] px-5 py-2.5 text-sm font-semibold text-[#18181B] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Buka Katalog
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {MENU_HIGHLIGHTS.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl bg-zinc-900/70 p-5 ring-1 ring-zinc-700/70"
              >
                <span className="text-3xl">{item.emoji}</span>
                <p className="mt-3 text-sm font-bold">{item.name}</p>
                <p className="text-[11px] text-zinc-400">{item.note}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-zinc-500 sm:flex-row">
          <p className="flex items-center gap-2 font-semibold text-[#18181B]">
            <Coffee className="size-3.5 text-[#4A5D4E]" aria-hidden />
            {CAFE_NAME}
          </p>
          <p>
            {CAFE_TAGLINE}
            {year ? ` · © ${year}` : ""}
          </p>
        </div>
      </footer>
    </div>
  );
}
