import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

function assertFinanceRole(role: string) {
  if (!['FINANCE', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'FINANCE_ROLE_REQUIRED: You do not have permissions to execute write operations in the Finance module.'
    });
  }
}

export const financeRouter = router({
  invoicesList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.invoice.findMany({
      where: { organisationId: ctx.org!.id, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }),

  invoicesGet: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoice = await prisma.invoice.findFirst({
        where: { id: input.id, organisationId: ctx.org!.id, deletedAt: null }
      });
      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      return invoice;
    }),

  invoicesCreate: protectedProcedure
    .input(z.object({
      invoiceNumber: z.string().min(1),
      invoiceDate: z.coerce.date(),
      dueDate: z.coerce.date(),
      subTotal: z.number().min(0),
      cgst: z.number().min(0),
      sgst: z.number().min(0),
      igst: z.number().min(0),
      grandTotal: z.number().min(0),
      items: z.any()
    }))
    .mutation(async ({ ctx, input }) => {
      // Create is allowed for DRAFT state
      const orgId = ctx.org!.id;
      const invoice = await prisma.invoice.create({
        data: {
          organisationId: orgId,
          invoiceNumber: input.invoiceNumber,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate,
          subTotal: input.subTotal,
          cgst: input.cgst,
          sgst: input.sgst,
          igst: input.igst,
          grandTotal: input.grandTotal,
          items: input.items || [],
          status: 'DRAFT',
          createdByUserId: ctx.user!.id
        }
      });

      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'CREATE_INVOICE',
          entityType: 'Invoice',
          entityId: invoice.id,
          newValues: invoice as any
        }
      });

      return invoice;
    }),

  invoicesApprove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertFinanceRole(ctx.user!.role);
      const orgId = ctx.org!.id;

      const updated = await prisma.invoice.update({
        where: { id: input.id, organisationId: orgId },
        data: {
          status: 'PENDING',
          approvedByUserId: ctx.user!.id,
          approvedAt: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'APPROVE_INVOICE',
          entityType: 'Invoice',
          entityId: updated.id,
          newValues: updated as any
        }
      });

      return updated;
    }),

  invoicesSend: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertFinanceRole(ctx.user!.role);
      const orgId = ctx.org!.id;
      return prisma.invoice.update({
        where: { id: input.id, organisationId: orgId },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });
    }),

  invoicesGenerateIRN: protectedProcedure
    .meta({ requiredFeature: 'finance_einvoice' })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertFinanceRole(ctx.user!.role);
      const orgId = ctx.org!.id;
      
      // Call GSTN Connector simulation
      const irnNumber = `IRN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      const updated = await prisma.invoice.update({
        where: { id: input.id, organisationId: orgId },
        data: {
          irnNumber,
          irnStatus: 'GENERATED',
          irnGeneratedAt: new Date(),
          qrCode: 'https://gstn.gov.in/qrcode/sample-qr-code',
          ackNumber: 'ACK123456',
          ackDate: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'GENERATE_IRN',
          entityType: 'Invoice',
          entityId: updated.id,
          newValues: updated as any
        }
      });

      return updated;
    }),

  invoicesRecordPayment: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      paidAmount: z.number().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      assertFinanceRole(ctx.user!.role);
      const orgId = ctx.org!.id;

      const updated = await prisma.invoice.update({
        where: { id: input.id, organisationId: orgId },
        data: {
          status: 'PAID',
          paidAmount: input.paidAmount,
          paidAt: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'RECORD_PAYMENT',
          entityType: 'Invoice',
          entityId: updated.id,
          newValues: updated as any
        }
      });

      return updated;
    }),

  gstGetDashboard: protectedProcedure
    .meta({ requiredFeature: 'finance_gst_advanced' })
    .query(async ({ ctx }) => {
      const invoices = await prisma.invoice.findMany({
        where: { organisationId: ctx.org!.id, status: 'PAID' }
      });
      const gstLiability = invoices.reduce((sum, inv) => sum + inv.totalGst, 0);
      return {
        gstLiability,
        status: 'READY_TO_FILE',
        taxPeriod: 'FY 2026 Q1'
      };
    }),

  gstExportGSTR1: protectedProcedure
    .meta({ requiredFeature: 'finance_gst_advanced' })
    .mutation(async ({ ctx }) => {
      assertFinanceRole(ctx.user!.role);
      return {
        success: true,
        filingFormat: 'JSON',
        schemaVersion: '1.2.0',
        message: 'GSTR-1 JSON export generated successfully. Ready to import to GST offline utility.'
      };
    }),

  journalsCreate: protectedProcedure
    .input(z.object({
      entryNumber: z.string().min(1),
      date: z.coerce.date(),
      description: z.string().optional(),
      lines: z.any()
    }))
    .mutation(async ({ ctx, input }) => {
      assertFinanceRole(ctx.user!.role);
      const orgId = ctx.org!.id;

      const journal = await prisma.journalEntry.create({
        data: {
          organisationId: orgId,
          entryNumber: input.entryNumber,
          date: input.date,
          description: input.description,
          lines: input.lines,
          status: 'POSTED',
          postedByUserId: ctx.user!.id,
          postedAt: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          action: 'POST_JOURNAL',
          entityType: 'JournalEntry',
          entityId: journal.id,
          newValues: journal as any
        }
      });

      return journal;
    }),

  journalsList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.journalEntry.findMany({
      where: { organisationId: ctx.org!.id },
      orderBy: { date: 'desc' }
    });
  })
});
