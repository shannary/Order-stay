import { Suspense } from "react";
import { SplashFallbackInner } from "@/components/catalog/splash-fallback";
import { LoginForm } from "@/components/admin/login-form";

/** Login admin (kasir/dapur) — dilindungi rate-limit pada API-nya. */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<SplashFallbackInner />}>
      <LoginForm />
    </Suspense>
  );
}
