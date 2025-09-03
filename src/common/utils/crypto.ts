// src/common/utils/crypto.ts
import * as bcrypt from 'bcrypt';

// Used only if env isn't provided. Any valid bcrypt hash works.
const DEFAULT_DUMMY = bcrypt.hashSync('TIMING_NOISE_DO_NOT_USE', 10);

/**
 * Always call bcrypt.compare() with defined strings to avoid "data and hash arguments required".
 * If the real hash is missing, we still compare against a dummy hash to equalize timing,
 * then force a failure.
 */
export async function safeBcryptCompare(
  plain: string | null | undefined,
  hash: string | null | undefined,
  dummyHash?: string,
): Promise<boolean> {
  const p = plain ?? '';
  const h = hash ?? '';
  const d = (dummyHash && dummyHash.trim().length > 0) ? dummyHash : DEFAULT_DUMMY;

  const ok = await bcrypt.compare(p, h || d);
  if (!h) return false; // don't ever succeed if the real hash is missing
  return ok;
}
