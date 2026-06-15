import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const supportRouter = router({
  ticketsList: protectedProcedure
    .input(z.object({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED']).optional(),
      aiResolvedOnly: z.boolean().default(false)
    }))
    .query(async ({ ctx, input }) => {
      return prisma.ticket.findMany({
        where: {
          organisationId: ctx.org!.id,
          status: input.status,
          aiResolved: input.aiResolvedOnly ? true : undefined,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
      });
    }),

  ticketsGet: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const ticket = await prisma.ticket.findFirst({
        where: { id: input.id, organisationId: ctx.org!.id, deletedAt: null }
      });
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
      return ticket;
    }),

  ticketsCreate: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      contactId: z.string().uuid().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
    }))
    .mutation(async ({ ctx, input }) => {
      const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      return prisma.ticket.create({
        data: {
          organisationId: ctx.org!.id,
          ticketNumber,
          ...input,
          status: 'OPEN'
        }
      });
    }),

  ticketsReply: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      message: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const ticket = await prisma.ticket.findUnique({
        where: { id: input.id, organisationId: orgId }
      });
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });

      const messages: any[] = (ticket.messages as any[]) || [];
      const updatedMessages = [
        ...messages,
        { sender: 'HUMAN', text: input.message, timestamp: new Date() }
      ];

      return prisma.ticket.update({
        where: { id: input.id, organisationId: orgId },
        data: {
          messages: updatedMessages,
          status: 'IN_PROGRESS'
        }
      });
    }),

  ticketsResolve: protectedProcedure
    .input(z.object({ id: z.string().uuid(), csat: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.ticket.update({
        where: { id: input.id, organisationId: ctx.org!.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          csat: input.csat,
          csatSubmittedAt: input.csat ? new Date() : null
        }
      });
    }),

  ticketsEscalate: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return prisma.ticket.update({
        where: { id: input.id, organisationId: ctx.org!.id },
        data: {
          status: 'ESCALATED',
          escalationReason: input.reason
        }
      });
    }),

  ticketsQueueAiResolution: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      // Queues SupportAgent Job
      const job = await prisma.agentJob.create({
        data: {
          organisationId: orgId,
          agentType: 'SUPPORT',
          status: 'QUEUED',
          description: `Queue AI auto-resolution check for ticket: ${input.id}`,
          trigger: { ticketId: input.id }
        }
      });
      return job;
    })
});
