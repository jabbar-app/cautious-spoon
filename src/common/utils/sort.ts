// src/common/utils/sort.ts
export function parseSort(sort?: string): Array<Record<string, 'asc' | 'desc'>> | undefined {
  if (!sort) return undefined;
  const parts = sort.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return undefined;
  return parts.map((p) => {
    if (p.startsWith('-')) return { [p.slice(1)]: 'desc' as const };
    return { [p]: 'asc' as const };
  });
}
