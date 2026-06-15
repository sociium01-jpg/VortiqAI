import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eventBus } from '@vortiq/agents';

export const leadEngineRouter = router({
  searchesCreate: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .input(z.object({
      name: z.string().min(1),
      icpPrompt: z.string().min(5),
      targetCount: z.number().min(1).max(500).default(50)
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      // Verify active subscription has enough lead credits
      const sub = await prisma.subscription.findFirst({
        where: { organisationId: orgId, status: 'active' }
      });

      // 1 credit per lead
      const usageCount = await prisma.leadRecord.count({
        where: { organisationId: orgId, status: 'IMPORTED' } // or check count of this month
      });

      const maxLeads = sub?.plan === 'GROWTH' ? 50 : sub?.plan === 'BUSINESS' ? 500 : 999999;
      if (usageCount >= maxLeads && sub?.plan !== 'ENTERPRISE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: JSON.stringify({ code: 'CREDIT_LIMIT_EXCEEDED', message: 'You have exceeded your monthly lead search credits. Please top-up.' })
        });
      }

      const job = await prisma.leadSearchJob.create({
        data: {
          organisationId: orgId,
          name: input.name,
          icpPrompt: input.icpPrompt,
          targetCount: input.targetCount,
          status: 'PENDING',
          createdByUserId: userId
        }
      });

      // Simulating Queueing of BullMQ background agent job
      // In production: await leadEngineQueue.add('search-lead', { jobId: job.id, orgId });
      console.log(`[LEAD_ENGINE] Queued LeadSearchJob: ${job.id}`);

      return job;
    }),

  searchesList: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .query(async ({ ctx }) => {
      return prisma.leadSearchJob.findMany({
        where: { organisationId: ctx.org!.id },
        orderBy: { createdAt: 'desc' }
      });
    }),

  searchesGet: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const job = await prisma.leadSearchJob.findFirst({
        where: { id: input.id, organisationId: ctx.org!.id },
        include: { records: true }
      });
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }
      return job;
    }),

  recordsList: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return prisma.leadRecord.findMany({
        where: { jobId: input.jobId, organisationId: ctx.org!.id },
        orderBy: { aiScore: 'desc' }
      });
    }),

  recordsImportToCRM: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .input(z.object({
      recordIds: z.array(z.string().uuid())
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const imported: string[] = [];

      for (const recordId of input.recordIds) {
        const record = await prisma.leadRecord.findFirst({
          where: { id: recordId, organisationId: orgId, status: 'RAW' }
        });

        if (!record) continue;

        // Dedup against existing contacts
        const duplicate = await prisma.contact.findFirst({
          where: {
            organisationId: orgId,
            OR: [
              record.email ? { email: record.email } : {},
              record.phone ? { phone: record.phone } : {}
            ].filter(o => Object.keys(o).length > 0) as any
          }
        });

        if (duplicate) {
          await prisma.leadRecord.update({
            where: { id: recordId },
            data: { status: 'DUPLICATE' }
          });
          continue;
        }

        // Create CRM contact
        const contact = await prisma.contact.create({
          data: {
            organisationId: orgId,
            firstName: record.firstName,
            lastName: record.lastName,
            email: record.email,
            phone: record.phone || '+919876543210',
            companyName: record.companyName,
            jobTitle: record.jobTitle,
            leadScore: record.aiScore,
            status: 'LEAD',
            consentStatus: 'PENDING',
            dataSource: 'LEAD_ENGINE',
            source: 'LEAD_ENGINE'
          }
        });

        await prisma.leadRecord.update({
          where: { id: recordId },
          data: {
            status: 'IMPORTED',
            importedContactId: contact.id
          }
        });

        imported.push(contact.id);
        await eventBus.publish('contact.created', { contactId: contact.id, organisationId: orgId });
      }

      return { success: true, count: imported.length };
    }),

  recordsReject: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .input(z.object({
      recordId: z.string().uuid(),
      reason: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.leadRecord.update({
        where: { id: input.recordId, organisationId: ctx.org!.id },
        data: {
          status: 'REJECTED',
          rejectionReason: input.reason
        }
      });
    }),

  icpParser: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .input(z.object({
      prompt: z.string().min(5)
    }))
    .mutation(async ({ ctx, input }) => {
      // Mock BYOK LLM parser response
      return {
        industries: ['Real Estate', 'Construction'],
        subIndustries: ['Residential Developers'],
        jobTitles: ['Procurement Manager', 'VP Purchase'],
        seniorities: ['Manager', 'VP', 'Director'],
        locations: { cities: ['Pune', 'Mumbai'], states: ['Maharashtra'], countries: ['India'] },
        companySizes: { min: 20, max: 200 },
        keywords: ['cement', 'steel', 'raw materials'],
        limit: 100
      };
    }),

  creditsGetBalance: protectedProcedure
    .meta({ requiredFeature: 'lead_engine' })
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      const sub = await prisma.subscription.findFirst({
        where: { organisationId: orgId }
      });
      const maxLeads = sub?.plan === 'GROWTH' ? 50 : sub?.plan === 'BUSINESS' ? 500 : 999999;
      const usage = await prisma.leadRecord.count({
        where: { organisationId: orgId, status: 'IMPORTED' }
      });
      return {
        used: usage,
        total: maxLeads,
        remaining: Math.max(0, maxLeads - usage)
      };
    })
});
