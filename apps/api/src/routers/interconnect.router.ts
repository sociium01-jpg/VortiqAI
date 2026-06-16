import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eventBus } from '@vortiq/agents';

// Helper to check user permission constraints on cross-module visibility
function verifyModuleAccess(role: string, targetModule: string) {
  const isFinance = ['FINANCE', 'ADMIN', 'SUPER_ADMIN'].includes(role);
  const isHR = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(role);
  const isSupport = ['SUPPORT', 'ADMIN', 'SUPER_ADMIN', 'VIEWER'].includes(role);
  
  if (targetModule.startsWith('FINANCE') && !isFinance) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access Denied: You do not have permissions to view financial billing data.'
    });
  }
  if (targetModule.startsWith('HR') && !isHR) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access Denied: You do not have permissions to view HR personnel data.'
    });
  }
}

export const interconnectRouter = router({
  // Fetch all related records for a specific entity
  getRelatedRecords: protectedProcedure
    .input(z.object({
      module: z.string(),
      recordId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userRole = ctx.user!.role;

      // 1. Fetch relationships from RecordRelationship table
      const relations = await prisma.recordRelationship.findMany({
        where: {
          organisationId: orgId,
          OR: [
            { sourceRecordId: input.recordId },
            { targetRecordId: input.recordId }
          ]
        }
      });

      // Map and filter by permissions
      const results = [];
      for (const rel of relations) {
        const isSource = rel.sourceRecordId === input.recordId;
        const relModule = isSource ? rel.targetModule : rel.sourceModule;
        const relId = isSource ? rel.targetRecordId : rel.sourceRecordId;

        try {
          verifyModuleAccess(userRole, relModule);

          // Attempt to find basic details of the related record to show in summary cards
          let details: any = { id: relId, module: relModule, relationship: rel.relationship };
          
          if (relModule === 'CRM_DEALS') {
            const deal = await prisma.deal.findUnique({ where: { id: relId } });
            if (deal) {
              details.title = deal.title;
              details.subtitle = `Amount: Rs. ${deal.value}`;
              details.status = 'ACTIVE';
            }
          } else if (relModule === 'FINANCE_INVOICES') {
            const inv = await prisma.invoice.findUnique({ where: { id: relId } });
            if (inv) {
              details.title = inv.invoiceNumber;
              details.subtitle = `Total: Rs. ${inv.grandTotal}`;
              details.status = inv.status;
            }
          } else if (relModule === 'TASKS') {
            const task = await prisma.task.findUnique({ where: { id: relId } });
            if (task) {
              details.title = task.title;
              details.subtitle = `Priority: ${task.priority}`;
              details.status = task.status;
            }
          } else if (relModule === 'SUPPORT_TICKETS') {
            const tck = await prisma.ticket.findUnique({ where: { id: relId } });
            if (tck) {
              details.title = tck.title;
              details.subtitle = `Priority: ${tck.priority}`;
              details.status = tck.status;
            }
          } else if (relModule === 'CRM_CONTACTS') {
            const contact = await prisma.contact.findUnique({ where: { id: relId } });
            if (contact) {
              details.title = `${contact.firstName} ${contact.lastName}`;
              details.subtitle = contact.email || contact.phone || '';
              details.status = contact.status;
            }
          } else if (relModule === 'HR_EMPLOYEES') {
            const emp = await prisma.employee.findUnique({ where: { id: relId } });
            if (emp) {
              details.title = `${emp.firstName} ${emp.lastName}`;
              details.subtitle = emp.email || emp.phone || '';
              details.status = emp.isActive ? 'ACTIVE' : 'INACTIVE';
            }
          } else if (relModule === 'INVENTORY_SKUS') {
            const sku = await prisma.sKU.findUnique({ where: { id: relId } });
            if (sku) {
              details.title = sku.name;
              details.subtitle = `Code: ${sku.skuCode} | Stock: ${sku.minStockLevel}`;
              details.status = sku.isActive ? 'ACTIVE' : 'INACTIVE';
            }
          }

          results.push(details);
        } catch (e) {
          // Skip records that user doesn't have permissions to see
          console.warn(`Filtering related record ${relId} due to permission constraint.`);
        }
      }

      return results;
    }),

  // Create an explicit connection between two modules
  createRelationship: protectedProcedure
    .input(z.object({
      sourceModule: z.string(),
      sourceRecordId: z.string().uuid(),
      targetModule: z.string(),
      targetRecordId: z.string().uuid(),
      relationship: z.string().default('LINKED_TO')
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      
      const newRelation = await prisma.recordRelationship.create({
        data: {
          organisationId: orgId,
          ...input
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'CREATE_RELATIONSHIP',
          entityType: 'RecordRelationship',
          entityId: newRelation.id,
          newValues: newRelation as any
        }
      });

      // Trigger UI sync update
      await eventBus.publish('data.change', {
        organisationId: orgId,
        module: input.sourceModule,
        action: 'RELATE',
        recordId: input.sourceRecordId
      });

      return newRelation;
    }),

  // Delete a relationship link
  deleteRelationship: protectedProcedure
    .input(z.object({
      relationshipId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const rel = await prisma.recordRelationship.findFirst({
        where: { id: input.relationshipId, organisationId: orgId }
      });
      if (!rel) throw new TRPCError({ code: 'NOT_FOUND', message: 'Relationship not found' });

      await prisma.recordRelationship.delete({ where: { id: input.relationshipId } });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'DELETE_RELATIONSHIP',
          entityType: 'RecordRelationship',
          entityId: input.relationshipId,
          oldValues: rel as any
        }
      });

      // Trigger UI refresh
      await eventBus.publish('data.change', {
        organisationId: orgId,
        module: rel.sourceModule,
        action: 'UNRELATE',
        recordId: rel.sourceRecordId
      });

      return { success: true };
    }),

  // Soft delete a business record
  softDeleteRecord: protectedProcedure
    .input(z.object({
      module: z.string(),
      recordId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      // Find target record inside DB
      let originalRecord: any = null;
      if (input.module === 'CRM_CONTACTS') {
        originalRecord = await prisma.contact.findFirst({ where: { id: input.recordId, organisationId: orgId } });
      } else if (input.module === 'CRM_DEALS') {
        originalRecord = await prisma.deal.findFirst({ where: { id: input.recordId, organisationId: orgId } });
      } else if (input.module === 'TASKS') {
        originalRecord = await prisma.task.findFirst({ where: { id: input.recordId, organisationId: orgId } });
      } else if (input.module === 'SUPPORT_TICKETS') {
        originalRecord = await prisma.ticket.findFirst({ where: { id: input.recordId, organisationId: orgId } });
      } else if (input.module === 'HR_EMPLOYEES') {
        originalRecord = await prisma.employee.findFirst({ where: { id: input.recordId, organisationId: orgId } });
      } else if (input.module === 'FINANCE_INVOICES') {
        originalRecord = await prisma.invoice.findFirst({ where: { id: input.recordId, organisationId: orgId } });
      } else if (input.module === 'INVENTORY_SKUS') {
        originalRecord = await prisma.sKU.findFirst({ where: { id: input.recordId, organisationId: orgId } });
      }

      if (!originalRecord) throw new TRPCError({ code: 'NOT_FOUND', message: 'Record not found' });

      // Write to SoftDeletedRecord table
      const softDelete = await prisma.softDeletedRecord.create({
        data: {
          organisationId: orgId,
          module: input.module,
          recordId: input.recordId,
          originalValues: JSON.stringify(originalRecord),
          deletedById: ctx.user!.id
        }
      });

      // Execute soft-delete update flag or delete record cleanly depending on tables
      if (input.module === 'CRM_CONTACTS') {
        await prisma.contact.update({ where: { id: input.recordId }, data: { deletedAt: new Date() } });
      } else if (input.module === 'CRM_DEALS') {
        await prisma.deal.update({ where: { id: input.recordId }, data: { deletedAt: new Date() } });
      } else if (input.module === 'TASKS') {
        await prisma.task.update({ where: { id: input.recordId }, data: { deletedAt: new Date() } });
      } else if (input.module === 'SUPPORT_TICKETS') {
        await prisma.ticket.update({ where: { id: input.recordId }, data: { deletedAt: new Date() } });
      } else if (input.module === 'HR_EMPLOYEES') {
        await prisma.employee.update({ where: { id: input.recordId }, data: { deletedAt: new Date() } });
      } else if (input.module === 'FINANCE_INVOICES') {
        await prisma.invoice.update({ where: { id: input.recordId }, data: { deletedAt: new Date() } });
      } else if (input.module === 'INVENTORY_SKUS') {
        await prisma.sKU.update({ where: { id: input.recordId }, data: { deletedAt: new Date() } });
      }

      // Add to audit timeline
      await prisma.activityTimeline.create({
        data: {
          organisationId: orgId,
          module: input.module,
          recordId: input.recordId,
          actionType: 'DELETE',
          description: `Soft deleted record from ${input.module}.`,
          actorName: ctx.user!.email
        }
      });

      // Audit log entry
      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'SOFT_DELETE',
          entityType: input.module,
          entityId: input.recordId,
          oldValues: originalRecord
        }
      });

      // Trigger global live sync UI
      await eventBus.publish('data.change', {
        organisationId: orgId,
        module: input.module,
        action: 'DELETE',
        recordId: input.recordId
      });

      return { success: true, softDeleteId: softDelete.id };
    }),

  // Restore a soft-deleted record
  restoreRecord: protectedProcedure
    .input(z.object({
      softDeleteId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const softDelete = await prisma.softDeletedRecord.findFirst({
        where: { id: input.softDeleteId, organisationId: orgId }
      });
      if (!softDelete) throw new TRPCError({ code: 'NOT_FOUND', message: 'Soft deleted record details not found' });

      // Restore based on module
      const originalValues = JSON.parse(softDelete.originalValues as string);
      
      if (softDelete.module === 'CRM_CONTACTS') {
        await prisma.contact.update({ where: { id: softDelete.recordId }, data: { deletedAt: null } });
      } else if (softDelete.module === 'CRM_DEALS') {
        await prisma.deal.update({ where: { id: softDelete.recordId }, data: { deletedAt: null } });
      } else if (softDelete.module === 'TASKS') {
        await prisma.task.update({ where: { id: softDelete.recordId }, data: { deletedAt: null } });
      } else if (softDelete.module === 'SUPPORT_TICKETS') {
        await prisma.ticket.update({ where: { id: softDelete.recordId }, data: { deletedAt: null } });
      } else if (softDelete.module === 'HR_EMPLOYEES') {
        await prisma.employee.update({ where: { id: softDelete.recordId }, data: { deletedAt: null } });
      } else if (softDelete.module === 'FINANCE_INVOICES') {
        await prisma.invoice.update({ where: { id: softDelete.recordId }, data: { deletedAt: null } });
      } else if (softDelete.module === 'INVENTORY_SKUS') {
        await prisma.sKU.update({ where: { id: softDelete.recordId }, data: { deletedAt: null } });
      }

      await prisma.softDeletedRecord.update({
        where: { id: input.softDeleteId },
        data: { restoredAt: new Date() }
      });

      // Add timeline event
      await prisma.activityTimeline.create({
        data: {
          organisationId: orgId,
          module: softDelete.module,
          recordId: softDelete.recordId,
          actionType: 'RESTORE',
          description: `Restored record in ${softDelete.module}.`,
          actorName: ctx.user!.email
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'RESTORE_RECORD',
          entityType: softDelete.module,
          entityId: softDelete.recordId,
          newValues: originalValues
        }
      });

      // UI Live trigger sync
      await eventBus.publish('data.change', {
        organisationId: orgId,
        module: softDelete.module,
        action: 'RESTORE',
        recordId: softDelete.recordId
      });

      return { success: true };
    }),

  // Get in-app notifications
  getNotifications: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      return prisma.notification.findMany({
        where: { organisationId: orgId, userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 30
      });
    }),

  // Mark in-app notification as read
  markNotificationRead: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      const notif = await prisma.notification.findFirst({
        where: { id: input.id, organisationId: orgId, userId }
      });
      if (!notif) throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });

      await prisma.notification.update({
        where: { id: input.id },
        data: { isRead: true }
      });

      // Refresh notifications UI
      await eventBus.publish('data.change', { organisationId: orgId, module: 'NOTIFICATIONS', action: 'UPDATE' });

      return { success: true };
    }),

  // Fetch audit log & versions for a specific record
  getAuditHistory: protectedProcedure
    .input(z.object({
      module: z.string(),
      recordId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const timeline = await prisma.activityTimeline.findMany({
        where: { organisationId: orgId, module: input.module, recordId: input.recordId },
        orderBy: { createdAt: 'desc' }
      });

      const auditLogs = await prisma.auditLog.findMany({
        where: { organisationId: orgId, entityType: input.module, entityId: input.recordId },
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      });

      return {
        timeline,
        auditLogs: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          oldValues: log.oldValues,
          newValues: log.newValues,
          createdAt: log.createdAt,
          user: log.user ? log.user.name : 'System'
        }))
      };
    })
});
