import type { Metadata } from "next";
import { CAFE_NAME } from "@/lib/config";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = {
  title: `Checkout · ${CAFE_NAME}`,
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
