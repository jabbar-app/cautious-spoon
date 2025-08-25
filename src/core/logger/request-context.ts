import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId?: string;
  userId?: string | null;
  prisma: Array<{ model?: string | null; action: string; ms: number; changed: string[]; where?: any }>;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function initRequestContext(store: Partial<RequestContextStore> = {}) {
  const base: RequestContextStore = { prisma: [], userId: null, ...store };
  return base;
}
