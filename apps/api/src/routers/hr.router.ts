import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

function assertHRAdminRole(role: string) {
  if (!['HR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'HR_ADMIN_ROLE_REQUIRED: Operations require HR or ADMIN permissions.'
    });
  }
}

export const hrRouter = router({
  employeesList: protectedProcedure
    .meta({ requiredFeature: 'hr_payroll' })
    .query(async ({ ctx }) => {
      return prisma.employee.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null }
      });
    }),

  employeesCreate: protectedProcedure
    .meta({ requiredFeature: 'hr_payroll' })
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      employeeCode: z.string().min(1),
      dateOfJoining: z.coerce.date()
    }))
    .mutation(async ({ ctx, input }) => {
      assertHRAdminRole(ctx.user!.role);
      return prisma.employee.create({
        data: {
          organisationId: ctx.org!.id,
          ...input
        }
      });
    }),

  attendanceGet: protectedProcedure
    .meta({ requiredFeature: 'hr_payroll' })
    .query(async ({ ctx }) => {
      return prisma.attendanceRecord.findMany({
        where: { organisationId: ctx.org!.id, deletedAt: null }
      });
    }),

  attendanceMark: protectedProcedure
    .meta({ requiredFeature: 'hr_payroll' })
    .input(z.object({
      date: z.coerce.date(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'])
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const employee = await prisma.employee.findFirst({
        where: { organisationId: orgId, email: ctx.user!.email }
      });
      if (!employee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee file not found' });
      }

      return prisma.attendanceRecord.create({
        data: {
          organisationId: orgId,
          userId: ctx.user!.id,
          date: input.date,
          status: input.status,
          checkIn: new Date()
        }
      });
    }),

  payrollRun: protectedProcedure
    .meta({ requiredFeature: 'hr_payroll' })
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2020)
    }))
    .mutation(async ({ ctx, input }) => {
      assertHRAdminRole(ctx.user!.role);
      const orgId = ctx.org!.id;

      // Compute salary metrics mock
      const employeesCount = await prisma.employee.count({
        where: { organisationId: orgId, isActive: true }
      });

      const totalGross = employeesCount * 45000;
      const totalPf = totalGross * 0.12; // 12% standard PF
      const totalEsi = totalGross * 0.0075; // 0.75% standard ESI
      const totalPt = employeesCount * 200; // Rs 200 standard PT
      const totalTds = totalGross * 0.05; // 5% avg TDS
      const totalNet = totalGross - totalPf - totalEsi - totalPt - totalTds;

      const payroll = await prisma.payrollRun.create({
        data: {
          organisationId: orgId,
          month: input.month,
          year: input.year,
          status: 'DRAFT',
          entries: {},
          totalGross,
          totalPf,
          totalEsi,
          totalPt,
          totalTds,
          totalNet
        }
      });

      return payroll;
    }),

  payrollApprove: protectedProcedure
    .meta({ requiredFeature: 'hr_payroll' })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user!.role !== 'ADMIN' && ctx.user!.role !== 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only ADMIN accounts can approve payroll runs.' });
      }

      return prisma.payrollRun.update({
        where: { id: input.id, organisationId: ctx.org!.id },
        data: {
          status: 'APPROVED',
          approvedByUserId: ctx.user!.id,
          approvedAt: new Date()
        }
      });
    }),

  payrollComputePFESI: protectedProcedure
    .meta({ requiredFeature: 'hr_payroll' })
    .input(z.object({ grossSalary: z.number() }))
    .query(({ input }) => {
      const pfEmployee = input.grossSalary * 0.12;
      const pfEmployer = input.grossSalary * 0.12;
      const esiEmployee = input.grossSalary * 0.0075;
      const esiEmployer = input.grossSalary * 0.0325;

      return {
        pf: { employeeContribution: pfEmployee, employerContribution: pfEmployer, total: pfEmployee + pfEmployer },
        esi: { employeeContribution: esiEmployee, employerContribution: esiEmployer, total: esiEmployee + esiEmployer }
      };
    })
});
