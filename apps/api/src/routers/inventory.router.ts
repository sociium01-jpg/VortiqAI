import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const inventoryRouter = router({
  productsList: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .query(async ({ ctx }) => {
      return prisma.product.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null }
      });
    }),

  productsCreate: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .input(z.object({
      name: z.string().min(1),
      category: z.string().optional(),
      brand: z.string().optional(),
      gstRate: z.number().default(18.0)
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.product.create({
        data: {
          organisationId: ctx.org!.id,
          ...input
        }
      });
    }),

  skusList: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .query(async ({ ctx }) => {
      return prisma.sKU.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null },
        include: { product: true, stockEntries: true }
      });
    }),

  skusCreate: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .input(z.object({
      productId: z.string().uuid(),
      skuCode: z.string().min(3),
      name: z.string().min(1),
      costPrice: z.number().min(0),
      sellingPrice: z.number().min(0),
      reorderPoint: z.number().default(10),
      attributes: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.sKU.create({
        data: {
          organisationId: ctx.org!.id,
          ...input
        }
      });
    }),

  stockGet: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .query(async ({ ctx }) => {
      return prisma.stockEntry.findMany({
        where: { organisationId: ctx.org!.id }
      });
    }),

  stockAdjust: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .input(z.object({
      skuId: z.string().uuid(),
      quantity: z.number(),
      reason: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const entry = await prisma.stockEntry.findFirst({
        where: { organisationId: orgId, skuId: input.skuId }
      });

      if (entry) {
        return prisma.stockEntry.update({
          where: { id: entry.id },
          data: {
            quantity: entry.quantity + input.quantity,
            availableQuantity: entry.availableQuantity + input.quantity
          }
        });
      } else {
        return prisma.stockEntry.create({
          data: {
            organisationId: orgId,
            skuId: input.skuId,
            quantity: input.quantity,
            availableQuantity: input.quantity
          }
        });
      }
    }),

  stockGetLowAlerts: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .query(async ({ ctx }) => {
      const skus = await prisma.sKU.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null }
      });
      const lowStockAlerts = [];
      for (const sku of skus) {
        const entry = await prisma.stockEntry.findFirst({
          where: { skuId: sku.id }
        });
        const qty = entry?.quantity || 0;
        if (qty <= sku.reorderPoint) {
          lowStockAlerts.push({
            skuCode: sku.skuCode,
            name: sku.name,
            qty,
            reorderPoint: sku.reorderPoint
          });
        }
      }
      return lowStockAlerts;
    }),

  dispatchList: protectedProcedure
    .meta({ requiredFeature: 'inventory' })
    .query(async ({ ctx }) => {
      return prisma.dispatchOrder.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null }
      });
    })
});
