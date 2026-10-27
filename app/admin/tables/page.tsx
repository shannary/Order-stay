import type { Metadata } from "next";
import { CAFE_NAME } from "@/lib/config";
import { TablesAdminClient } from "@/components/admin/tables-admin-client";

export const metadata: Metadata = {
  title: `Admin Meja · ${CAFE_NAME}`,
};

export default function AdminTablesPage() {
  return <TablesAdminClient />;
}
