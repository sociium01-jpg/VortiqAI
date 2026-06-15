import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export interface SecurityContext {
  userId?: string;
  isAgent?: boolean;
}

export const securityStorage = new AsyncLocalStorage<SecurityContext>();

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    invoice: {
      async $allOperations({ operation, args, query }: { operation: string; args: any; query: (args: any) => Promise<any> }) {
        if (['create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(operation)) {
          const ctx = securityStorage.getStore();
          if (!ctx || ctx.isAgent || !ctx.userId) {
            throw new Error("FINANCE_WRITE_BLOCKED: Financial transactions (Invoice) can only be written by a human user context. AI agents are restricted.");
          }
        }
        return query(args);
      }
    },
    purchaseOrder: {
      async $allOperations({ operation, args, query }: { operation: string; args: any; query: (args: any) => Promise<any> }) {
        if (['create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(operation)) {
          const ctx = securityStorage.getStore();
          if (!ctx || ctx.isAgent || !ctx.userId) {
            throw new Error("FINANCE_WRITE_BLOCKED: Financial transactions (PurchaseOrder) can only be written by a human user context. AI agents are restricted.");
          }
        }
        return query(args);
      }
    },
    taxRecord: {
      async $allOperations({ operation, args, query }: { operation: string; args: any; query: (args: any) => Promise<any> }) {
        if (['create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(operation)) {
          const ctx = securityStorage.getStore();
          if (!ctx || ctx.isAgent || !ctx.userId) {
            throw new Error("FINANCE_WRITE_BLOCKED: Financial transactions (TaxRecord) can only be written by a human user context. AI agents are restricted.");
          }
        }
        return query(args);
      }
    },
    journalEntry: {
      async $allOperations({ operation, args, query }: { operation: string; args: any; query: (args: any) => Promise<any> }) {
        if (['create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(operation)) {
          const ctx = securityStorage.getStore();
          if (!ctx || ctx.isAgent || !ctx.userId) {
            throw new Error("FINANCE_WRITE_BLOCKED: Financial transactions (JournalEntry) can only be written by a human user context. AI agents are restricted.");
          }
        }
        return query(args);
      }
    }
  }
});

export type ExtendedPrismaClient = typeof prisma;
export { basePrisma };
