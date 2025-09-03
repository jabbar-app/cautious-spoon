// src/common/types/pagination.ts
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  nextCursor?: string | null;
}

export function isPaginatedShape(v: any): v is PaginatedResult<any> {
  return (
    v &&
    typeof v === 'object' &&
    Array.isArray(v.items) &&
    typeof v.page === 'number' &&
    typeof v.perPage === 'number' &&
    typeof v.total === 'number' &&
    typeof v.totalPages === 'number'
  );
}
