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
    }),

  syncUser: publicProcedure
    .input(z.object({
      clerkId: z.string(),
      email: z.string().email(),
      name: z.string(),
      orgName: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      let user = await prisma.user.findUnique({
        where: { clerkId: input.clerkId },
        include: { organisation: true }
      });

      if (!user) {
        const domain = input.email.split('@')[1] || 'vortiq-user';
        let org = await prisma.organisation.findFirst({
          where: { slug: domain }
        });

        if (!org) {
          const orgName = input.orgName || (input.name.split(' ')[0] + "'s Org");
          org = await prisma.organisation.create({
            data: {
              name: orgName,
              slug: domain + '-' + Math.floor(Math.random() * 10000),
              plan: 'STARTER'
            }
          });
        }

        user = await prisma.user.create({
          data: {
            clerkId: input.clerkId,
            email: input.email,
            name: input.name,
            organisationId: org.id,
            role: 'ADMIN'
          },
          include: { organisation: true }
        });
      }

      return {
        userId: user.id,
        orgId: user.organisationId,
        plan: user.organisation.plan
      };
    })
});
