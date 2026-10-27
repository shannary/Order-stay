import type { Metadata } from "next";
import { CAFE_NAME } from "@/lib/config";
import { PosClient } from "@/components/admin/pos-client";

export const metadata: Metadata = {
  title: `Kasir · ${CAFE_NAME}`,
};

export default function PosDashboardPage() {
  return <PosClient />;
}
