// src/common/utils/serialize.ts
/* Deeply serialize outbound data:
 * - bigint  -> string (to keep precision and avoid JSON crash)
 * - Date    -> ISO string
 * - Buffer  -> base64 string (optional but safe)
 */
export function deepSerialize<T = unknown>(value: T): any {
  if (value === null || value === undefined) return value;
  const t = typeof value;

  if (t === 'bigint') return (value as unknown as bigint).toString();

  if (t !== 'object') return value;

  // Dates as ISO
  if (value instanceof Date) return value.toISOString();

  // Buffers as base64 (avoid sending raw binary)
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return (value as unknown as Buffer).toString('base64');
  }

  if (Array.isArray(value)) return value.map((v) => deepSerialize(v));

  // Plain object
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value as Record<string, any>)) {
    out[k] = deepSerialize(v);
  }
  return out;
}
