/**
 * Format angka ke Rupiah: 20000 => "Rp 20.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}
