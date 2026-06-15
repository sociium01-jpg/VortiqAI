import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const marketingRouter = router({
  campaignsList: protectedProcedure
    .meta({ requiredFeature: 'marketing_social' })
    .query(async ({ ctx }) => {
      return prisma.campaign.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null },
        orderBy: { createdAt: 'desc' }
      });
    }),

  campaignsGet: protectedProcedure
    .meta({ requiredFeature: 'marketing_social' })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const campaign = await prisma.campaign.findFirst({
        where: { id: input.id, organisationId: ctx.org!.id, deletedAt: null }
      });
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
      }
      return campaign;
    }),

  campaignsCreate: protectedProcedure
    .meta({ requiredFeature: 'marketing_social' })
    .input(z.object({
      name: z.string().min(1),
      type: z.enum(['EMAIL', 'SOCIAL', 'AD', 'SMS', 'WHATSAPP']),
      subject: z.string().optional(),
      previewText: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      return prisma.campaign.create({
        data: {
          organisationId: orgId,
          ...input,
          status: 'DRAFT',
          createdByUserId: ctx.user!.id
        }
      });
    }),

  campaignsDraftWithAi: protectedProcedure
    .meta({ requiredFeature: 'marketing_social' })
    .input(z.object({
      campaignId: z.string().uuid(),
      briefPrompt: z.string().min(10)
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const job = await prisma.agentJob.create({
        data: {
          organisationId: orgId,
          agentType: 'MARKETING',
          status: 'AWAITING_APPROVAL',
          description: `Draft campaign content for: ${input.briefPrompt}`,
          trigger: { campaignId: input.campaignId }
        }
      });
      return job;
    }),

  campaignsApprove: protectedProcedure
    .meta({ requiredFeature: 'marketing_social' })
    .input(z.object({
      campaignId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      return prisma.campaign.update({
        where: { id: input.campaignId, organisationId: orgId },
        data: {
          status: 'SCHEDULED',
          humanApprovedByUserId: ctx.user!.id,
          humanApprovedAt: new Date()
        }
      });
    }),

  socialPostsDraftWithAi: protectedProcedure
    .meta({ requiredFeature: 'marketing_social' })
    .input(z.object({
      content: z.string().min(5),
      platforms: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const post = await prisma.socialPost.create({
        data: {
          organisationId: orgId,
          content: input.content,
          platforms: input.platforms,
          status: 'PENDING_APPROVAL',
          aiDrafted: true
        }
      });

      await prisma.agentJob.create({
        data: {
          organisationId: orgId,
          agentType: 'MARKETING',
          status: 'AWAITING_APPROVAL',
          description: `Approve social post for platform: ${input.platforms.join(', ')}`,
          trigger: { postId: post.id }
        }
      });

      return post;
    }),

  adsGetDashboard: protectedProcedure
    .meta({ requiredFeature: 'marketing_ads' })
    .query(async ({ ctx }) => {
      return prisma.adPlatformData.findMany({
        where: { organisationId: ctx.org!.id },
        orderBy: { period: 'desc' }
      });
    })
});
