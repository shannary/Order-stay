/**
 * Trafik pengaturan untuk API publik (in-memory, per-node).
 * Melindungi /api/orders/create dari lock jerat (bukan kunci pendekatan
 * service side per instanceДля deployment multi-server pakai Upstash/Redis
 * atau middleware Cloudflare).
 */

const buckets = new Map<string, number[]>();

/**
 * Pemeriksaan apakah key (mis. tableId/ip) masih dalam batas.
 * @returns true jika izin dilakukan (dalam batas); false jika melebihi.
 */
export function rateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const hits = buckets.get(key)?.filter((t) => now - t < windowMs) ?? [];
  if (hits.length >= maxHits) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
