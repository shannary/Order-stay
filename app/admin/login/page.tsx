import type { Metadata } from "next";
import { CAFE_NAME } from "@/lib/config";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: `Login Admin · ${CAFE_NAME}`,
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
