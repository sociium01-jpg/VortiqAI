import { prisma } from '@vortiq/db';

export interface SkillRequest {
  intent: string;
  parameters: any;
  organisationId: string;
  userId: string;
}

export async function executeVortiqSkill(req: SkillRequest): Promise<any> {
  const { intent, parameters, organisationId, userId } = req;
  
  // Log execution
  const execution = await prisma.openClawSkillExecution.create({
    data: {
      organisationId,
      userId,
      telegramUserId: parameters.telegramUserId || 'unknown',
      command: parameters.rawQuery || intent,
      parsedIntent: intent,
      tRPCProcedure: `openclaw.${intent}`,
      parameters: parameters || {},
    }
  });

  const startTime = Date.now();

  try {
    let result: any = null;
    switch (intent) {
      case 'query_metrics': {
        const contactsCount = await prisma.contact.count({ where: { organisationId, deletedAt: null } });
        const dealsCount = await prisma.deal.count({ where: { organisationId, deletedAt: null } });
        const tasksCount = await prisma.task.count({ where: { organisationId, deletedAt: null } });
        const efficiency = await prisma.businessEfficiencyScore.findFirst({
          where: { organisationId },
          orderBy: { date: 'desc' }
        });
        result = { contactsCount, dealsCount, tasksCount, efficiencyScore: efficiency?.overallScore || 78.5 };
        break;
      }

      case 'query_leads': {
        const leads = await prisma.contact.findMany({
          where: { organisationId, deletedAt: null },
          take: 5,
          orderBy: { leadScore: 'desc' }
        });
        result = { leads };
        break;
      }

      case 'query_deals': {
        const deals = await prisma.deal.findMany({
          where: { organisationId, deletedAt: null },
          take: 5,
          orderBy: { value: 'desc' }
        });
        result = { deals };
        break;
      }

      case 'query_tasks': {
        const tasks = await prisma.task.findMany({
          where: { organisationId, deletedAt: null, status: { not: 'DONE' } },
          take: 10,
          orderBy: { dueAt: 'asc' }
        });
        result = { tasks };
        break;
      }

      case 'query_finance': {
        const unpaidInvoices = await prisma.invoice.findMany({
          where: { organisationId, deletedAt: null, status: 'PENDING' }
        });
        const totalUnpaid = unpaidInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        
        const taxRecords = await prisma.taxRecord.findMany({
          where: { organisationId, status: 'PENDING' }
        });
        
        result = { totalUnpaid, invoiceCount: unpaidInvoices.length, pendingTaxes: taxRecords };
        break;
      }

      case 'query_inventory': {
        const allItems = await prisma.inventoryItem.findMany({
          where: {
            organisationId,
            deletedAt: null
          }
        });
        const lowStock = allItems.filter(item => item.quantity <= item.reorderPoint);
        result = { lowStock };
        break;
      }

      case 'query_employees': {
        const absentees = await prisma.attendanceRecord.findMany({
          where: {
            organisationId,
            deletedAt: null,
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
            status: 'ABSENT'
          },
          include: {
            employee: true
          }
        });
        result = { absentees: absentees.map((a: any) => a.employee) };
        break;
      }

      case 'approve_job': {
        const approvedJob = await prisma.agentJob.update({
          where: { id: parameters.jobId, organisationId },
          data: { status: 'APPROVED', approvedByUserId: userId, approvedAt: new Date() }
        });
        result = { success: true, job: approvedJob };
        break;
      }

      case 'reject_job': {
        const rejectedJob = await prisma.agentJob.update({
          where: { id: parameters.jobId, organisationId },
          data: { status: 'REJECTED', rejectedByUserId: userId, rejectedAt: new Date(), rejectionReason: parameters.reason }
        });
        result = { success: true, job: rejectedJob };
        break;
      }

      case 'list_approvals': {
        const pendingJobs = await prisma.agentJob.findMany({
          where: { organisationId, status: 'AWAITING_APPROVAL' }
        });
        result = { pendingJobs };
        break;
      }

      case 'get_forecast': {
        const targets = await prisma.salesTarget.findMany({
          where: { organisationId, deletedAt: null },
          orderBy: { endDate: 'asc' }
        });
        result = { targets };
        break;
      }

      case 'create_contact': {
        const contact = await prisma.contact.create({
          data: {
            organisationId,
            firstName: parameters.firstName,
            lastName: parameters.lastName || '',
            phone: parameters.phone,
            email: parameters.email || null,
            source: 'MANUAL',
            leadScore: 50
          }
        });
        result = { success: true, contact };
        break;
      }

      case 'create_task': {
        const defaultUser = await prisma.user.findFirst({ where: { organisationId } });
        const task = await prisma.task.create({
          data: {
            organisationId,
            title: parameters.title,
            description: parameters.description || null,
            dueAt: parameters.dueDate ? new Date(parameters.dueDate) : null,
            status: 'TODO',
            createdByUserId: defaultUser?.id || userId
          }
        });
        result = { success: true, task };
        break;
      }

      default:
        throw new Error(`Intent ${intent} is not supported by Vortiq OpenClaw Skill.`);
    }

    const responseTime = Date.now() - startTime;
    await prisma.openClawSkillExecution.update({
      where: { id: execution.id },
      data: { result, responseTime }
    });

    return result;
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    await prisma.openClawSkillExecution.update({
      where: { id: execution.id },
      data: { error: err.message || 'Unknown error', responseTime }
    });
    throw err;
  }
}
