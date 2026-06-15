import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { formatINR } from '../services/telegram.service.js';

export const salesRouter = router({
  dashboardGet: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.org!.id;
    const userId = ctx.user!.id;

    // Filters by user role
    const isSales = ctx.user!.role === 'SALES';
    const filter = isSales ? { ownerId: userId } : {};

    const openDealsCount = await prisma.deal.count({
      where: { organisationId: orgId, deletedAt: null, stage: { isWon: false, isLost: false } }
    });

    const wonDeals = await prisma.deal.findMany({
      where: { organisationId: orgId, stage: { isWon: true }, ...filter }
    });

    const pipelineValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

    return {
      openDealsCount,
      pipelineValue,
      pipelineFormatted: formatINR(pipelineValue)
    };
  }),

  targetsList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.salesTarget.findMany({
      where: { organisationId: ctx.org!.id, deletedAt: null },
      orderBy: { endDate: 'asc' }
    });
  }),

  targetsSet: protectedProcedure
    .input(z.object({
      targetAmount: z.number().min(1000),
      period: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      userId: z.string().uuid().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      return prisma.salesTarget.create({
        data: {
          organisationId: orgId,
          ...input
        }
      });
    }),

  activitiesLog: protectedProcedure
    .input(z.object({
      type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK']),
      title: z.string().min(1),
      description: z.string().optional(),
      contactId: z.string().uuid().optional(),
      dealId: z.string().uuid().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      return prisma.activity.create({
        data: {
          organisationId: orgId,
          ...input,
          userId: ctx.user!.id
        }
      });
    }),

  leaderboardGet: protectedProcedure.query(async ({ ctx }) => {
    return prisma.employeePerformance.findMany({
      where: { organisationId: ctx.org!.id, deletedAt: null },
      include: { employee: true },
      orderBy: { score: 'desc' }
    });
  })
});
