import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const tasksRouter = router({
  tasksList: protectedProcedure
    .query(async ({ ctx }) => {
      return prisma.task.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null },
        orderBy: { createdAt: 'desc' }
      });
    }),

  tasksCreate: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
      priority: z.nativeEnum(TaskPriority).default(TaskPriority.P3),
      dueAt: z.coerce.date().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      return prisma.task.create({
        data: {
          organisationId: orgId,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          dueAt: input.dueAt,
          createdByUserId: ctx.user!.id
        }
      });
    }),

  tasksUpdateStage: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.nativeEnum(TaskStatus)
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.task.update({
        where: { id: input.id, organisationId: ctx.org!.id },
        data: {
          status: input.status,
          completedAt: input.status === TaskStatus.DONE ? new Date() : null
        }
      });
    }),

  tasksDelete: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.task.update({
        where: { id: input.id, organisationId: ctx.org!.id },
        data: {
          deletedAt: new Date()
        }
      });
    })
});
