"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, ReceiptText, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navigasi khas admin — pill minimalis, tampil di setiap layar admin
 * sehingga semua fitur bisa diakses dari mana saja (Kasir ↔ Dapur ↔ Meja).
 */
export function AdminNav() {
  const pathname = usePathname();

  const items = [
    {
      href: "/admin/pos",
      label: "Kasir",
      Icon: ReceiptText,
      active: pathname.startsWith("/admin/pos"),
    },
    {
      href: "/admin/kds",
      label: "Dapur",
      Icon: Flame,
      active: pathname.startsWith("/admin/kds"),
    },
    {
      href: "/admin/tables",
      label: "Meja",
      Icon: Table2,
      active: pathname.startsWith("/admin/tables"),
    },
  ] as const;

  return (
    <nav
      aria-label="Navigasi admin"
      className="mx-auto mb-4 flex w-fit gap-1 rounded-full bg-zinc-200/60 p-1"
    >
      {items.map(({ href, label, Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            active ? "bg-white text-[#18181B] shadow-sm" : "text-zinc-500"
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
