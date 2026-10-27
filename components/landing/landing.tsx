"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Coffee,
  ScanLine,
  ShoppingBag,
  Banknote,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  LogIn,
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
        <a
          href="/admin/login"
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18181B] shadow-sm ring-1 ring-zinc-200 transition-transform hover:scale-[1.03] active:scale-95"
        >
          <LogIn className="size-3.5" aria-hidden />
          Login
        </a>
      </header>

      {/* ============ HERO (MOBILE-FIRST) ============ */}
      <section className="relative mx-auto max-w-md px-6 pb-16 pt-6 text-center">
        {/* blob dekoratif */}
        <div aria-hidden className="pointer-events-none absolute -left-20 top-16 size-64 rounded-full bg-[#4A5D4E]/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-44 size-48 rounded-full bg-amber-200/40 blur-3xl" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4A5D4E] shadow-sm ring-1 ring-zinc-200"
        >
          <Sparkles className="size-3.5" aria-hidden />
          {CAFE_TAGLINE}
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, delay: 0.06 }}
          className="text-4xl font-black leading-[1.08] tracking-tight"
        >
          Selamat datang di{" "}
          <span className="bg-gradient-to-r from-[#4A5D4E] via-[#6B7F71] to-amber-700 bg-clip-text text-transparent">
            {CAFE_NAME}
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-600"
        >
          Scan QR di meja, pesan dari ponselmu, dan biarkan kopi yang menemukanmu.
        </motion.p>

        {/* ===== TOMBOL QR SCAN BESAR DI TENGAH ===== */}
        <motion.a
          href="/table/meja-1"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 16 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Scan QR untuk mulai pesan"
          className="group relative mx-auto mt-10 flex size-56 items-center justify-center rounded-full bg-[#4A5D4E] shadow-2xl shadow-[#4A5D4E]/30 ring-8 ring-[#4A5D4E]/10"
        >
          {/* halo berdenyut */}
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-[#4A5D4E]/20 [animation-duration:2.5s]"
          />
          <span className="relative flex flex-col items-center gap-2">
            <ScanLine className="size-16 text-[#FBFBFA] transition-transform duration-300 group-hover:scale-110" aria-hidden />
            <span className="text-sm font-bold text-[#FBFBFA]">
              Scan QR Meja
            </span>
            <span className="text-[10px] text-[#FBFBFA]/70">
              mulai pesan di sini
            </span>
          </span>
        </motion.a>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-8 max-w-xs rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-zinc-200"
        >
          <p className="text-xs font-bold text-[#18181B]">Belum di meja?</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">
            Datang ke kasir atau pilih meja favorit, scan QR yang terdempel
            menggelar di meja — katalog menu otomatis terbuka di ponsel yang sama.
          </p>
        </motion.div>
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
