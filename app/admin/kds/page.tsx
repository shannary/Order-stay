import type { Metadata } from "next";
import { CAFE_NAME } from "@/lib/config";
import { KdsClient } from "@/components/admin/kds-client";

export const metadata: Metadata = {
  title: `KDS Dapur · ${CAFE_NAME}`,
};

export default function KitchenDisplayPage() {
  return <KdsClient />;
}
