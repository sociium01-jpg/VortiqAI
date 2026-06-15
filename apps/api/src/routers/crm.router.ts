import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eventBus } from '@vortiq/agents';

// Zod validation schemas
const phoneRegex = /^\+91[6-9]\d{9}$/;

export const crmRouter = router({
  contactsList: protectedProcedure
    .input(z.object({
      cursor: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED', 'BLACKLISTED']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const contacts = await prisma.contact.findMany({
        where: {
          organisationId: orgId,
          deletedAt: null,
          status: input.status,
          OR: input.search ? [
            { firstName: { contains: input.search, mode: 'insensitive' } },
            { lastName: { contains: input.search, mode: 'insensitive' } },
            { email: { contains: input.search, mode: 'insensitive' } },
            { phone: { contains: input.search, mode: 'insensitive' } }
          ] : undefined
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' }
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (contacts.length > input.limit) {
        const nextItem = contacts.pop();
        nextCursor = nextItem!.id;
      }

      return { contacts, nextCursor };
    }),

  contactsGet: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const contact = await prisma.contact.findUnique({
        where: { id: input.id, organisationId: ctx.org!.id },
        include: { company: true, activities: true, tasks: true }
      });
      if (!contact) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
      }
      return contact;
    }),

  contactsCreate: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().regex(phoneRegex, 'Must be a valid Indian phone starting with +91'),
      status: z.enum(['LEAD', 'QUALIFIED', 'CUSTOMER']),
      consentStatus: z.enum(['PENDING', 'GIVEN', 'WITHDRAWN']).default('GIVEN')
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      
      // Check duplicate
      const duplicate = await prisma.contact.findFirst({
        where: { organisationId: orgId, phone: input.phone, deletedAt: null }
      });
      if (duplicate) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Contact with this phone number already exists.' });
      }

      const contact = await prisma.contact.create({
        data: {
          organisationId: orgId,
          ...input,
          consentGivenAt: input.consentStatus === 'GIVEN' ? new Date() : null,
          dataSource: 'MANUAL',
          source: 'MANUAL'
        }
      });

      // Audit log creation
      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'CREATE_CONTACT',
          entityType: 'Contact',
          entityId: contact.id,
          newValues: contact as any
        }
      });

      await eventBus.publish('contact.created', { contactId: contact.id, organisationId: orgId });

      return contact;
    }),

  contactsUpdate: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().regex(phoneRegex).optional(),
      status: z.enum(['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED', 'BLACKLISTED']).optional(),
      consentStatus: z.enum(['PENDING', 'GIVEN', 'WITHDRAWN']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const orgId = ctx.org!.id;

      const existing = await prisma.contact.findUnique({ where: { id, organisationId: orgId } });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
      }

      const consentGivenAt = data.consentStatus === 'GIVEN' ? new Date() : undefined;
      const consentWithdrawnAt = data.consentStatus === 'WITHDRAWN' ? new Date() : undefined;

      const updated = await prisma.contact.update({
        where: { id, organisationId: orgId },
        data: {
          ...data,
          consentGivenAt,
          consentWithdrawnAt
        }
      });

      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'UPDATE_CONTACT',
          entityType: 'Contact',
          entityId: id,
          oldValues: existing as any,
          newValues: updated as any
        }
      });

      return updated;
    }),

  contactsDelete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.contact.update({
        where: { id: input.id, organisationId: ctx.org!.id },
        data: { deletedAt: new Date() }
      });
      return { success: true, id: updated.id };
    }),

  dealsMove: protectedProcedure
    .input(z.object({
      dealId: z.string().uuid(),
      stageId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const deal = await prisma.deal.findUnique({
        where: { id: input.dealId, organisationId: orgId }
      });
      if (!deal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }

      const updated = await prisma.deal.update({
        where: { id: input.dealId, organisationId: orgId },
        data: { stageId: input.stageId }
      });

      await prisma.activity.create({
        data: {
          organisationId: orgId,
          type: 'STAGE_CHANGE',
          title: 'Deal Stage Changed',
          description: `Deal "${deal.title}" moved to new stage.`,
          dealId: deal.id
        }
      });

      await eventBus.publish('deal.stage_changed', {
        dealId: deal.id,
        oldStage: deal.stageId,
        newStage: input.stageId,
        organisationId: orgId
      });

      if (updated.stageId === 'won-stage-id') { // simplified won identification
        await eventBus.publish('deal.won', { dealId: deal.id, organisationId: orgId, userId: ctx.user!.id });
      }

      return updated;
    }),

  pipelineGetStages: protectedProcedure.query(async ({ ctx }) => {
    return prisma.dealStage.findMany({
      where: { organisationId: ctx.org!.id },
      orderBy: { order: 'asc' }
    });
  }),

  companiesList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.company.findMany({
      where: { organisationId: ctx.org!.id, deletedAt: null },
      orderBy: { name: 'asc' }
    });
  }),

  companiesCreate: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      industry: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.company.create({
        data: {
          organisationId: ctx.org!.id,
          name: input.name,
          industry: input.industry
        }
      });
    }),

  dealsList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.deal.findMany({
      where: { organisationId: ctx.org!.id, deletedAt: null },
      include: { stage: true },
      orderBy: { createdAt: 'desc' }
    });
  }),

  dealsCreate: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      value: z.number().min(0),
      stageId: z.string().uuid(),
      contactId: z.string().uuid().optional(),
      companyId: z.string().uuid().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.deal.create({
        data: {
          organisationId: ctx.org!.id,
          title: input.title,
          value: input.value,
          stageId: input.stageId,
          contactId: input.contactId,
          companyId: input.companyId
        }
      });
    }),

  meetingsList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.activity.findMany({
      where: {
        organisationId: ctx.org!.id,
        type: 'MEETING'
      },
      orderBy: { createdAt: 'desc' }
    });
  }),

  meetingsCreate: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      contactId: z.string().uuid().optional(),
      dealId: z.string().uuid().optional(),
      dueAt: z.coerce.date().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.activity.create({
        data: {
          organisationId: ctx.org!.id,
          type: 'MEETING',
          title: input.title,
          description: input.description,
          contactId: input.contactId,
          dealId: input.dealId,
          dueAt: input.dueAt
        }
      });
    })
});
