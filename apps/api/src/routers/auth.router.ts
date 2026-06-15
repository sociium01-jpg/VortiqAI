import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { isFeatureAllowed, PlanTier } from '@vortiq/types';

export const authRouter = router({
  getSession: publicProcedure.query(async ({ ctx }) => {
    return { user: ctx.user };
  }),

  getOrganisation: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organisation.findUnique({
      where: { id: ctx.org!.id }
    });
    return org;
  }),

  updateOrganisation: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      gstin: z.string().optional(),
      website: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.organisation.update({
        where: { id: ctx.org!.id },
        data: input
      });
      return updated;
    }),

  switchPlan: protectedProcedure
    .input(z.object({
      plan: z.enum(['TRIAL', 'STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE'])
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.organisation.update({
        where: { id: ctx.org!.id },
        data: { plan: input.plan as PlanTier }
      });
      return updated;
    }),

  checkFeatureAccess: protectedProcedure
    .input(z.object({
      feature: z.string()
    }))
    .query(({ ctx, input }) => {
      const result = isFeatureAllowed(ctx.org!.plan, input.feature);
      return result;
    })
});
