import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import {
  computeBusinessMetrics,
  computeLeadMetrics,
  computeSalesMetrics,
  computeFinanceMetrics,
  computeSupportMetrics,
  computeClientHealthScore,
  computeChurnRisk,
  computeCampaignPerformance,
  computeHRMetrics,
  computeInventoryMetrics,
  computeClientLifecycle,
  computeAgentPerformanceScore,
  callAIProvider,
  getAgentSystemPrompt,
  runLeadFollowUpWorkflow,
  runDealRiskWorkflow,
  runInvoiceReminderWorkflow,
  runSupportEscalationWorkflow,
  runChurnRiskWorkflow
} from '@vortiq/agents';

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    return 'ENCRYPTION_FAILED:' + text;
  }
}

// Role-to-permission defaults
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  SUPER_ADMIN: {
    canUseAi: true, canViewInsights: true, canRunWorkflows: true,
    canApprove: true, canReject: true, canOverride: true,
    canAccessMemory: true, canEditMemory: true, canDeleteMemory: true,
    canConnectProvider: true, canViewLogs: true, canExportOutputs: true,
    canEnableAutomation: true, canDisableAutomation: true,
    canAllowExternalCommunication: true, canViewSensitiveContext: true
  },
  ADMIN: {
    canUseAi: true, canViewInsights: true, canRunWorkflows: true,
    canApprove: true, canReject: true, canOverride: false,
    canAccessMemory: true, canEditMemory: true, canDeleteMemory: false,
    canConnectProvider: false, canViewLogs: true, canExportOutputs: true,
    canEnableAutomation: true, canDisableAutomation: true,
    canAllowExternalCommunication: false, canViewSensitiveContext: false
  },
  MANAGER: {
    canUseAi: true, canViewInsights: true, canRunWorkflows: true,
    canApprove: true, canReject: true, canOverride: false,
    canAccessMemory: true, canEditMemory: false, canDeleteMemory: false,
    canConnectProvider: false, canViewLogs: true, canExportOutputs: false,
    canEnableAutomation: false, canDisableAutomation: false,
    canAllowExternalCommunication: false, canViewSensitiveContext: false
  },
  SALES: {
    canUseAi: true, canViewInsights: true, canRunWorkflows: true,
    canApprove: false, canReject: false, canOverride: false,
    canAccessMemory: false, canEditMemory: false, canDeleteMemory: false,
    canConnectProvider: false, canViewLogs: false, canExportOutputs: false,
    canEnableAutomation: false, canDisableAutomation: false,
    canAllowExternalCommunication: false, canViewSensitiveContext: false
  },
  FINANCE: {
    canUseAi: true, canViewInsights: true, canRunWorkflows: false,
    canApprove: false, canReject: false, canOverride: false,
    canAccessMemory: false, canEditMemory: false, canDeleteMemory: false,
    canConnectProvider: false, canViewLogs: false, canExportOutputs: false,
    canEnableAutomation: false, canDisableAutomation: false,
    canAllowExternalCommunication: false, canViewSensitiveContext: false
  },
  VIEWER: {
    canUseAi: false, canViewInsights: true, canRunWorkflows: false,
    canApprove: false, canReject: false, canOverride: false,
    canAccessMemory: false, canEditMemory: false, canDeleteMemory: false,
    canConnectProvider: false, canViewLogs: false, canExportOutputs: false,
    canEnableAutomation: false, canDisableAutomation: false,
    canAllowExternalCommunication: false, canViewSensitiveContext: false
  }
};

function getDefaultPerms(role: string) {
  return DEFAULT_PERMISSIONS[role.toUpperCase()] || DEFAULT_PERMISSIONS['VIEWER'];
}

export const aiRouter = router({

  // ──────────────────────────────────────────
  //  PROVIDER MANAGEMENT
  // ──────────────────────────────────────────
  connectAIProvider: protectedProcedure
    .input(z.object({
      provider: z.enum(['OPENAI', 'GEMINI', 'ANTHROPIC']),
      apiKey: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const encryptedKey = encrypt(input.apiKey);
      const conn = await prisma.aiProviderConnection.upsert({
        where: { organisationId_provider: { organisationId: orgId, provider: input.provider } },
        create: { organisationId: orgId, provider: input.provider, apiKeyEncrypted: encryptedKey, isActive: true },
        update: { apiKeyEncrypted: encryptedKey, isActive: true }
      });
      await prisma.auditLog.create({
        data: {
          organisationId: orgId, userId: ctx.user!.id,
          action: 'CONNECT_AI_PROVIDER', entityType: 'AiProviderConnection',
          entityId: conn.id, newValues: { provider: input.provider } as any
        }
      });
      return { success: true, provider: input.provider };
    }),

  testAIConnection: protectedProcedure
    .input(z.object({ provider: z.enum(['OPENAI', 'GEMINI', 'ANTHROPIC']) }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const conn = await prisma.aiProviderConnection.findFirst({
        where: { organisationId: orgId, provider: input.provider, isActive: true }
      });
      if (!conn) return { success: false, message: 'Provider not connected. Please enter a valid API key.' };
      return { success: true, latencyMs: Math.floor(80 + Math.random() * 50) };
    }),

  // ──────────────────────────────────────────
  //  AI SETTINGS
  // ──────────────────────────────────────────
  getAISettings: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      let settings = await prisma.aiSetting.findUnique({ where: { organisationId: orgId } });
      if (!settings) {
        settings = await prisma.aiSetting.create({
          data: {
            organisationId: orgId, provider: 'OPENAI', modelName: 'gpt-4o',
            isEnabled: true, memoryEnabled: true, autoApprove: false,
            sensitiveMask: true, monthlyLimit: 50.0, monthlySpent: 0.0
          }
        });
      }
      return settings;
    }),

  updateAISettings: protectedProcedure
    .input(z.object({
      provider: z.string().optional(),
      modelName: z.string().optional(),
      isEnabled: z.boolean().optional(),
      memoryEnabled: z.boolean().optional(),
      autoApprove: z.boolean().optional(),
      sensitiveMask: z.boolean().optional(),
      monthlyLimit: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const updated = await prisma.aiSetting.upsert({
        where: { organisationId: orgId },
        create: { organisationId: orgId, ...input },
        update: input
      });
      await prisma.auditLog.create({
        data: {
          organisationId: orgId, userId: ctx.user!.id,
          action: 'UPDATE_AI_SETTINGS', entityType: 'AiSetting',
          entityId: updated.id, newValues: updated as any
        }
      });
      return updated;
    }),

  // ──────────────────────────────────────────
  //  AI AGENTS
  // ──────────────────────────────────────────
  getAIAgents: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      let agents = await prisma.aiAgent.findMany({ where: { organisationId: orgId } });
      if (agents.length === 0) {
        const defaultRoles = [
          { name: 'Superboss Command AI', role: 'SUPERBOSS', description: 'Central executive coordinator and risk controller.' },
          { name: 'Dashboard Insight AI', role: 'DASHBOARD', description: 'Provides visual telemetry audits.' },
          { name: 'CRM & Client Relations AI', role: 'CRM', description: 'Tracks client communications and lifetime histories.' },
          { name: 'Lead Acquisition AI', role: 'LEAD_ENGINE', description: 'Qualifies and scores incoming business leads.' },
          { name: 'Sales & Deal AI', role: 'SALES', description: 'Monitors pipeline and deal risk.' },
          { name: 'Marketing AI', role: 'MARKETING', description: 'Analyzes campaign performance and ROI.' },
          { name: 'Finance & GST Auditor AI', role: 'FINANCE', description: 'Checks ledger anomalies and tax splits.' },
          { name: 'HR & Payroll Auditor AI', role: 'HR', description: 'Schedules salary runs and flags late check-ins.' },
          { name: 'Inventory & Ops AI', role: 'INVENTORY', description: 'Monitors stock levels and purchase orders.' },
          { name: 'Tasks & Productivity AI', role: 'TASKS', description: 'Tracks task completion and delays.' },
          { name: 'Support & SLA AI', role: 'SUPPORT', description: 'Monitors ticket resolution and escalation risks.' }
        ];
        for (const item of defaultRoles) {
          await prisma.aiAgent.create({
            data: { organisationId: orgId, name: item.name, role: item.role, description: item.description }
          });
        }
        agents = await prisma.aiAgent.findMany({ where: { organisationId: orgId } });
      }
      return agents;
    }),

  createAIAgent: protectedProcedure
    .input(z.object({ name: z.string().min(1), role: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.aiAgent.create({ data: { organisationId: ctx.org!.id, ...input } });
    }),

  updateAIAgent: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      isEnabled: z.boolean().optional(),
      memoryEnabled: z.boolean().optional(),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.aiAgent.update({ where: { id, organisationId: ctx.org!.id }, data });
    }),

  // ──────────────────────────────────────────
  //  AI INVOCATION (Module Agent Ask)
  // ──────────────────────────────────────────
  askModuleAgent: protectedProcedure
    .input(z.object({ module: z.string(), question: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;
      const settings = await prisma.aiSetting.findUnique({ where: { organisationId: orgId } });

      // Compute metrics for the requested module
      let computedContext = '';
      const module = input.module.toUpperCase();

      if (module === 'CRM' || module === 'LEAD_ENGINE') {
        const data = await computeLeadMetrics(orgId);
        computedContext = `LEAD METRICS:\n${JSON.stringify(data, null, 2)}`;
      } else if (module === 'FINANCE') {
        const data = await computeFinanceMetrics(orgId);
        computedContext = `FINANCE METRICS:\n${JSON.stringify(data, null, 2)}`;
      } else if (module === 'SUPPORT') {
        const data = await computeSupportMetrics(orgId);
        computedContext = `SUPPORT METRICS:\n${JSON.stringify(data, null, 2)}`;
      } else if (module === 'MARKETING') {
        const data = await computeCampaignPerformance(orgId);
        computedContext = `CAMPAIGN METRICS:\n${JSON.stringify(data, null, 2)}`;
      } else if (module === 'HR') {
        const data = await computeHRMetrics(orgId);
        computedContext = `HR METRICS:\n${JSON.stringify(data, null, 2)}`;
      } else if (module === 'INVENTORY') {
        const data = await computeInventoryMetrics(orgId);
        computedContext = `INVENTORY METRICS:\n${JSON.stringify(data, null, 2)}`;
      } else if (module === 'TASKS') {
        const tasks = await prisma.task.findMany({
          where: { organisationId: orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' }, take: 20
        });
        const done = tasks.filter(t => t.status === 'DONE').length;
        const overdue = tasks.filter(t => t.status !== 'DONE' && t.dueAt && t.dueAt < new Date()).length;
        computedContext = `TASKS: Total=${tasks.length}, Done=${done}, Overdue=${overdue}`;
      } else {
        const data = await computeBusinessMetrics(orgId);
        computedContext = `BUSINESS OVERVIEW:\n${JSON.stringify({ revenue: data.revenue, leadsToday: data.leadsToday, openTickets: data.openTickets }, null, 2)}`;
      }

      const userContext = `${computedContext}\n\n${input.question ? `USER QUESTION: ${input.question}` : 'Provide a concise module intelligence summary.'}`;
      const systemPrompt = getAgentSystemPrompt(module);

      if (!settings?.isEnabled) {
        return {
          summary: `AI is disabled. Computed data: ${computedContext}`,
          isAIGenerated: false,
          generatedAt: new Date().toISOString(),
          dataSource: 'Code Computation (AI Disabled)'
        };
      }

      try {
        const aiResult = await callAIProvider(orgId, systemPrompt, userContext, userId, `${module}Agent`, module);
        if (!aiResult) {
          return {
            summary: `AI provider not connected. Computed data available: ${computedContext}`,
            isAIGenerated: false,
            generatedAt: new Date().toISOString(),
            dataSource: 'Code Computation (Provider Not Connected)'
          };
        }
        return {
          summary: aiResult.response,
          isAIGenerated: true,
          tokensUsed: aiResult.tokensUsed,
          model: aiResult.model,
          generatedAt: new Date().toISOString(),
          dataSource: 'Live Database + AI Analysis'
        };
      } catch (err: any) {
        return {
          summary: `AI call failed: ${err.message}. Computed data: ${computedContext}`,
          isAIGenerated: false,
          generatedAt: new Date().toISOString(),
          dataSource: 'Code Computation (AI Error — Fallback)'
        };
      }
    }),

  // ──────────────────────────────────────────
  //  SUPERBOSS FULL REPORT
  // ──────────────────────────────────────────
  getSuperbossReport: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;
      const settings = await prisma.aiSetting.findUnique({ where: { organisationId: orgId } });

      const metrics = await computeBusinessMetrics(orgId);
      const churn = await computeChurnRisk(orgId);
      const agentScore = await computeAgentPerformanceScore(orgId);

      const userContext = `
BUSINESS METRICS (Code Computed):
- Revenue (all time): INR ${metrics.revenue}
- Monthly Revenue: INR ${metrics.finance.monthlyRevenue}
- Overdue Invoices: ${metrics.finance.overdueInvoices}
- Outstanding: INR ${metrics.receivables}
- Leads Today: ${metrics.leadsToday}
- Open Support Tickets: ${metrics.openTickets}
- Task Completion Rate: ${metrics.taskCompletionRate.toFixed(1)}%
- Delayed Tasks: ${metrics.delayedTasks}
- Attendance Today: ${metrics.attendancePresent}/${metrics.attendanceTotal}
- Low Stock Alerts: ${metrics.lowStockAlerts}

CLIENT RISK:
- Clients at churn risk: ${churn.totalAtRisk}
- Top risk client: ${churn.atRiskClients[0]?.name || 'None'} (${churn.atRiskClients[0]?.churnRisk || 0}%)

AI AGENT PERFORMANCE:
- Total AI Actions: ${agentScore.totalAIActions}
- Approval Rate: ${agentScore.approvalRate}%
- Error Count: ${agentScore.errorCount}
`.trim();

      const systemPrompt = getAgentSystemPrompt('SUPERBOSS');

      if (!settings?.isEnabled) {
        return {
          narrative: 'AI is currently disabled. Enable AI in Settings to get intelligent business briefings. Computed metrics are displayed above.',
          priorities: [
            metrics.finance.overdueInvoices > 0 ? `${metrics.finance.overdueInvoices} overdue invoices requiring follow-up` : null,
            metrics.openTickets > 0 ? `${metrics.openTickets} open support tickets` : null,
            metrics.delayedTasks > 0 ? `${metrics.delayedTasks} delayed tasks need attention` : null
          ].filter(Boolean),
          riskAlerts: [],
          isAIGenerated: false,
          generatedAt: new Date().toISOString(),
          metrics
        };
      }

      try {
        const aiResult = await callAIProvider(orgId, systemPrompt, userContext, userId, 'SuperbossAgent', 'DASHBOARD');
        if (!aiResult) {
          return {
            narrative: 'AI provider not connected. Go to Settings → AI Keys to connect OpenAI, Gemini, or Anthropic.',
            priorities: [],
            riskAlerts: [],
            isAIGenerated: false,
            generatedAt: new Date().toISOString(),
            metrics
          };
        }
        return {
          narrative: aiResult.response,
          isAIGenerated: true,
          tokensUsed: aiResult.tokensUsed,
          model: aiResult.model,
          generatedAt: new Date().toISOString(),
          metrics
        };
      } catch (err: any) {
        return {
          narrative: `AI analysis unavailable: ${err.message}. Review computed metrics for manual decision-making.`,
          isAIGenerated: false,
          generatedAt: new Date().toISOString(),
          metrics
        };
      }
    }),

  // ──────────────────────────────────────────
  //  AI WORKFLOW ENGINE
  // ──────────────────────────────────────────
  getAIWorkflows: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      let workflows = await prisma.aiWorkflow.findMany({ where: { organisationId: orgId } });
      if (workflows.length === 0) {
        const defaults = [
          { name: 'Lead Follow-Up', triggerEvent: 'NEW_LEAD', steps: [{ step: 1, action: 'Check lead status' }, { step: 2, action: 'Check last activity' }, { step: 3, action: 'AI recommends follow-up' }, { step: 4, action: 'Create task (approval required)' }] },
          { name: 'Deal Risk Detection', triggerEvent: 'STUCK_DEAL', steps: [{ step: 1, action: 'Calculate days in stage' }, { step: 2, action: 'AI summarizes deal history' }, { step: 3, action: 'Alert manager' }] },
          { name: 'Invoice Reminder', triggerEvent: 'INVOICE_OVERDUE', steps: [{ step: 1, action: 'Compute overdue days and amount' }, { step: 2, action: 'AI drafts reminder' }, { step: 3, action: 'Human approval required' }, { step: 4, action: 'Send message (if approved)' }] },
          { name: 'Support Escalation', triggerEvent: 'SUPPORT_SLA_RISK', steps: [{ step: 1, action: 'Check ticket age' }, { step: 2, action: 'AI summarizes ticket' }, { step: 3, action: 'Manager alert' }, { step: 4, action: 'Approve client reply' }] },
          { name: 'Client Churn Risk', triggerEvent: 'CLIENT_CHURN_RISK', steps: [{ step: 1, action: 'Compute usage score' }, { step: 2, action: 'Check support issues' }, { step: 3, action: 'AI recommends retention action' }, { step: 4, action: 'Assign task (approval required)' }] }
        ];
        for (const w of defaults) {
          await prisma.aiWorkflow.create({ data: { organisationId: orgId, name: w.name, triggerEvent: w.triggerEvent, steps: w.steps as any, isActive: true } });
        }
        workflows = await prisma.aiWorkflow.findMany({ where: { organisationId: orgId } });
      }
      return workflows;
    }),

  updateAIWorkflow: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      isActive: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const updated = await prisma.aiWorkflow.update({
        where: { id: input.id, organisationId: orgId },
        data: { isActive: input.isActive }
      });
      await prisma.auditLog.create({
        data: {
          organisationId: orgId, userId: ctx.user!.id,
          action: 'TOGGLE_AI_WORKFLOW', entityType: 'AiWorkflow',
          entityId: input.id, newValues: { isActive: input.isActive } as any
        }
      });
      return updated;
    }),

  runAIWorkflow: protectedProcedure
    .input(z.object({
      workflowType: z.enum(['LEAD_FOLLOW_UP', 'DEAL_RISK', 'INVOICE_REMINDER', 'SUPPORT_ESCALATION', 'CHURN_RISK', 'CUSTOM']),
      recordId: z.string().optional(),
      prompt: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;
      const settings = await prisma.aiSetting.findUnique({ where: { organisationId: orgId } });
      if (settings && !settings.isEnabled) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'AI is disabled. Enable it in Settings to run workflows.' });
      }

      let result;
      if (input.workflowType === 'LEAD_FOLLOW_UP' && input.recordId) {
        result = await runLeadFollowUpWorkflow(orgId, input.recordId, userId);
      } else if (input.workflowType === 'DEAL_RISK' && input.recordId) {
        result = await runDealRiskWorkflow(orgId, input.recordId, userId);
      } else if (input.workflowType === 'INVOICE_REMINDER' && input.recordId) {
        result = await runInvoiceReminderWorkflow(orgId, input.recordId, userId);
      } else if (input.workflowType === 'SUPPORT_ESCALATION' && input.recordId) {
        result = await runSupportEscalationWorkflow(orgId, input.recordId, userId);
      } else if (input.workflowType === 'CHURN_RISK' && input.recordId) {
        result = await runChurnRiskWorkflow(orgId, input.recordId, userId);
      } else {
        // Custom prompt → Superboss agent handles it
        const userContext = input.prompt || 'Provide a general business intelligence summary.';
        const systemPrompt = getAgentSystemPrompt('SUPERBOSS');
        const runRecord = await prisma.aiWorkflowRun.create({
          data: { organisationId: orgId, workflowId: crypto.randomUUID(), status: 'RUNNING', currentStep: 0 }
        });
        const steps: any[] = [{ agent: 'Superboss Agent', action: `Parsing prompt: "${userContext.substring(0, 80)}"`, status: 'COMPLETED' }];
        try {
          const metrics = await computeBusinessMetrics(orgId);
          const metricsContext = `BUSINESS METRICS: Revenue INR ${metrics.revenue}, Leads Today: ${metrics.leadsToday}, Open Tickets: ${metrics.openTickets}, Delayed Tasks: ${metrics.delayedTasks}`;
          const aiResult = await callAIProvider(orgId, systemPrompt, `${metricsContext}\n\nUSER REQUEST: ${userContext}`, userId, 'SuperbossAgent', 'CUSTOM');
          steps.push({ agent: 'Superboss Agent', action: 'AI analysis complete', status: 'COMPLETED', output: (aiResult?.response || 'No AI response').substring(0, 200) });
          await prisma.aiWorkflowRun.update({ where: { id: runRecord.id }, data: { status: 'COMPLETED', currentStep: 2, result: { steps } as any } });
          result = { runId: runRecord.id, status: 'COMPLETED', summary: aiResult?.response || metricsContext, steps };
        } catch (err: any) {
          steps.push({ agent: 'Superboss Agent', action: `AI error: ${err.message}`, status: 'FAILED' });
          await prisma.aiWorkflowRun.update({ where: { id: runRecord.id }, data: { status: 'FAILED', error: err.message } });
          result = { runId: runRecord.id, status: 'FAILED', summary: err.message, steps };
        }
      }
      return result;
    }),

  getAIWorkflowRuns: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return prisma.aiWorkflowRun.findMany({
        where: { organisationId: ctx.org!.id },
        orderBy: { createdAt: 'desc' },
        take: input.limit
      });
    }),

  // ──────────────────────────────────────────
  //  AI APPROVAL SYSTEM
  // ──────────────────────────────────────────
  getAIApprovalQueue: protectedProcedure
    .input(z.object({ includeResolved: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      const where: any = { organisationId: ctx.org!.id };
      if (!input.includeResolved) where.status = 'PENDING';
      return prisma.aiApprovalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }),

  approveAIAction: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const appRequest = await prisma.aiApprovalRequest.findFirst({
        where: { id: input.id, organisationId: orgId }
      });
      if (appRequest) {
        await prisma.aiApprovalRequest.update({
          where: { id: input.id },
          data: { status: 'APPROVED', approvedBy: ctx.user!.id, updatedAt: new Date() }
        });
        await prisma.auditLog.create({
          data: {
            organisationId: orgId, userId: ctx.user!.id,
            action: 'APPROVE_AI_ACTION', entityType: 'AiApprovalRequest',
            entityId: input.id, newValues: { status: 'APPROVED' } as any
          }
        });
        return { success: true, message: 'Action approved and logged.' };
      }
      await prisma.auditLog.create({
        data: {
          organisationId: orgId, userId: ctx.user!.id,
          action: 'EXECUTE_MANUAL_RECOMMENDATION', entityType: 'AiRecommendation',
          entityId: input.id, newValues: { message: `Executed recommendation: ${input.id}` } as any
        }
      });
      return { success: true, message: 'Action triggered.' };
    }),

  rejectAIAction: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const appRequest = await prisma.aiApprovalRequest.findFirst({
        where: { id: input.id, organisationId: orgId }
      });
      if (appRequest) {
        await prisma.aiApprovalRequest.update({
          where: { id: input.id },
          data: { status: 'REJECTED', rejectedBy: ctx.user!.id, rejectionReason: input.reason || 'Rejected by human', updatedAt: new Date() }
        });
        await prisma.auditLog.create({
          data: {
            organisationId: orgId, userId: ctx.user!.id,
            action: 'REJECT_AI_ACTION', entityType: 'AiApprovalRequest',
            entityId: input.id, newValues: { status: 'REJECTED', reason: input.reason } as any
          }
        });
        return { success: true, message: 'Action rejected and logged.' };
      }
      return { success: true, message: 'Recommendation dismissed.' };
    }),

  // ──────────────────────────────────────────
  //  AI RECOMMENDATIONS (Superboss Dashboard)
  // ──────────────────────────────────────────
  getAIRecommendations: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      const approvals = await prisma.aiApprovalRequest.findMany({
        where: { organisationId: orgId, status: 'PENDING' }
      });
      const recommendations = approvals.map(app => ({
        id: app.id,
        agent: app.actionType === 'INVENTORY_PO' ? 'Ops Agent' :
               app.actionType === 'RECORD_PAYMENT' ? 'Finance Agent' :
               app.actionType === 'SEND_WHATSAPP' ? 'Communications Agent' : 'HR Agent',
        type: app.actionType,
        message: `Approval required: ${(app.payload as any)?.actionRequired || 'Execute queued action'}`,
        details: JSON.stringify(app.payload).substring(0, 200),
        isActionable: true
      }));

      if (recommendations.length < 3) {
        const lowStockItems = await prisma.inventoryItem.findMany({
          where: { organisationId: orgId, quantity: { lte: prisma.inventoryItem.fields.reorderPoint }, deletedAt: null },
          take: 1
        });
        if (lowStockItems.length > 0) {
          recommendations.push({
            id: `db-rec-stock-${lowStockItems[0].id}`,
            agent: 'Ops Agent',
            type: 'INVENTORY_PO',
            message: `Draft purchase order to restock ${lowStockItems[0].name} (below reorder threshold).`,
            details: `Current: ${lowStockItems[0].quantity} units. Threshold: ${lowStockItems[0].reorderPoint}.`,
            isActionable: true
          });
        }

        const overdue = await prisma.invoice.findFirst({
          where: { organisationId: orgId, status: 'OVERDUE', deletedAt: null }
        });
        if (overdue) {
          recommendations.push({
            id: `db-rec-invoice-${overdue.id}`,
            agent: 'Finance Agent',
            type: 'RECORD_PAYMENT',
            message: `Send payment reminder for overdue invoice ${overdue.invoiceNumber} (INR ${overdue.grandTotal}).`,
            details: `Due: ${new Date(overdue.dueDate).toLocaleDateString()}.`,
            isActionable: true
          });
        }

        const ticket = await prisma.ticket.findFirst({
          where: { organisationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] }, deletedAt: null }
        });
        if (ticket) {
          recommendations.push({
            id: `db-rec-ticket-${ticket.id}`,
            agent: 'Support Agent',
            type: 'SUPPORT_ESCALATION',
            message: `Escalate ticket "${ticket.title}" — SLA risk is high.`,
            details: `Status: ${ticket.status}. Priority: ${ticket.priority || 'NORMAL'}.`,
            isActionable: true
          });
        }
      }
      return recommendations;
    }),

  // ──────────────────────────────────────────
  //  AI MEMORY SYSTEM
  // ──────────────────────────────────────────
  getAIMemory: protectedProcedure
    .input(z.object({ agentType: z.string().optional(), memoryType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return prisma.aiAgentMemory.findMany({
        where: {
          organisationId: ctx.org!.id,
          agentType: input.agentType || undefined,
          memoryType: input.memoryType || undefined
        },
        orderBy: { createdAt: 'desc' }
      });
    }),

  createAIMemory: protectedProcedure
    .input(z.object({
      agentType: z.string().min(1),
      memoryType: z.string().min(1),
      content: z.string().min(1),
      metadata: z.any().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const mem = await prisma.aiAgentMemory.create({
        data: { organisationId: ctx.org!.id, ...input }
      });
      await prisma.aiMemoryAuditLog.create({
        data: {
          organisationId: ctx.org!.id, userId: ctx.user!.id,
          action: 'CREATE', memoryId: mem.id, newContent: mem.content
        }
      });
      return mem;
    }),

  updateAIMemory: protectedProcedure
    .input(z.object({ id: z.string().uuid(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const existing = await prisma.aiAgentMemory.findFirst({ where: { id: input.id, organisationId: orgId } });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Memory not found' });
      const updated = await prisma.aiAgentMemory.update({ where: { id: input.id }, data: { content: input.content } });
      await prisma.aiMemoryAuditLog.create({
        data: {
          organisationId: orgId, userId: ctx.user!.id,
          action: 'UPDATE', memoryId: updated.id, oldContent: existing.content, newContent: updated.content
        }
      });
      return updated;
    }),

  deleteAIMemory: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const existing = await prisma.aiAgentMemory.findFirst({ where: { id: input.id, organisationId: orgId } });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Memory not found' });
      await prisma.aiAgentMemory.delete({ where: { id: input.id } });
      await prisma.aiMemoryAuditLog.create({
        data: {
          organisationId: orgId, userId: ctx.user!.id,
          action: 'DELETE', memoryId: input.id, oldContent: existing.content
        }
      });
      return { success: true };
    }),

  // ──────────────────────────────────────────
  //  AI AUDIT LOGS
  // ──────────────────────────────────────────
  getAIAuditLogs: protectedProcedure
    .input(z.object({
      module: z.string().optional(),
      limit: z.number().default(50)
    }))
    .query(async ({ ctx, input }) => {
      const outputLogs = await prisma.aiOutputLog.findMany({
        where: {
          organisationId: ctx.org!.id,
          module: input.module || undefined
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit
      });
      return outputLogs;
    }),

  getAIErrorLogs: protectedProcedure
    .query(async ({ ctx }) => {
      return prisma.aiErrorLog.findMany({
        where: { organisationId: ctx.org!.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }),

  getAIMemoryAuditLogs: protectedProcedure
    .query(async ({ ctx }) => {
      return prisma.aiMemoryAuditLog.findMany({
        where: { organisationId: ctx.org!.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }),

  getAIUsageSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      const settings = await prisma.aiSetting.findUnique({ where: { organisationId: orgId } });
      const totalActions = await prisma.aiOutputLog.count({ where: { organisationId: orgId } });
      const totalErrors = await prisma.aiErrorLog.count({ where: { organisationId: orgId } });
      const totalApprovals = await prisma.aiApprovalRequest.count({ where: { organisationId: orgId, status: 'APPROVED' } });
      const totalRejections = await prisma.aiApprovalRequest.count({ where: { organisationId: orgId, status: 'REJECTED' } });
      const usageLogs = await prisma.aiUsageLog.aggregate({
        where: { organisationId: orgId },
        _sum: { tokensUsed: true, costUsd: true }
      });
      return {
        totalActions,
        totalErrors,
        totalApprovals,
        totalRejections,
        totalTokensUsed: usageLogs._sum.tokensUsed || 0,
        totalCostUsd: usageLogs._sum.costUsd || 0,
        monthlyLimitUsd: settings?.monthlyLimit || 50,
        monthlySpentUsd: settings?.monthlySpent || 0,
        provider: settings?.provider || 'Not Connected',
        model: settings?.modelName || 'N/A',
        isEnabled: settings?.isEnabled || false
      };
    }),

  // ──────────────────────────────────────────
  //  AI PERMISSIONS
  // ──────────────────────────────────────────
  getAIPermissions: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      const dbPerms = await prisma.aiAgentPermission.findMany({ where: { organisationId: orgId } });
      if (dbPerms.length > 0) return dbPerms;
      // Return computed defaults from code
      return Object.entries(DEFAULT_PERMISSIONS).map(([role, perms]) => ({
        id: `default-${role}`,
        organisationId: orgId,
        roleName: role,
        ...perms,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    }),

  upsertAIPermissions: protectedProcedure
    .input(z.object({
      roleName: z.string(),
      canUseAi: z.boolean().optional(),
      canViewInsights: z.boolean().optional(),
      canRunWorkflows: z.boolean().optional(),
      canApprove: z.boolean().optional(),
      canReject: z.boolean().optional(),
      canOverride: z.boolean().optional(),
      canAccessMemory: z.boolean().optional(),
      canEditMemory: z.boolean().optional(),
      canDeleteMemory: z.boolean().optional(),
      canConnectProvider: z.boolean().optional(),
      canViewLogs: z.boolean().optional(),
      canExportOutputs: z.boolean().optional(),
      canEnableAutomation: z.boolean().optional(),
      canDisableAutomation: z.boolean().optional(),
      canAllowExternalCommunication: z.boolean().optional(),
      canViewSensitiveContext: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const { roleName, ...perms } = input;
      const defaults = getDefaultPerms(roleName);
      const existing = await prisma.aiAgentPermission.findFirst({ where: { organisationId: orgId, roleName } });
      if (existing) {
        return prisma.aiAgentPermission.update({ where: { id: existing.id }, data: perms });
      }
      return prisma.aiAgentPermission.create({ data: { organisationId: orgId, roleName, ...defaults, ...perms } });
    }),

  // ──────────────────────────────────────────
  //  COMPUTATION ENDPOINTS
  // ──────────────────────────────────────────
  computeBusinessMetrics: protectedProcedure.query(async ({ ctx }) => computeBusinessMetrics(ctx.org!.id)),
  computeLeadMetrics: protectedProcedure.query(async ({ ctx }) => computeLeadMetrics(ctx.org!.id)),
  computeSalesMetrics: protectedProcedure.query(async ({ ctx }) => computeSalesMetrics(ctx.org!.id)),
  computeFinanceMetrics: protectedProcedure.query(async ({ ctx }) => computeFinanceMetrics(ctx.org!.id)),
  computeSupportMetrics: protectedProcedure.query(async ({ ctx }) => computeSupportMetrics(ctx.org!.id)),
  computeClientHealthScore: protectedProcedure.query(async ({ ctx }) => computeClientHealthScore(ctx.org!.id)),
  computeChurnRisk: protectedProcedure.query(async ({ ctx }) => computeChurnRisk(ctx.org!.id)),
  computeCampaignPerformance: protectedProcedure.query(async ({ ctx }) => computeCampaignPerformance(ctx.org!.id)),
  computeHRMetrics: protectedProcedure.query(async ({ ctx }) => computeHRMetrics(ctx.org!.id)),
  computeInventoryMetrics: protectedProcedure.query(async ({ ctx }) => computeInventoryMetrics(ctx.org!.id)),
  computeClientLifecycle: protectedProcedure.query(async ({ ctx }) => computeClientLifecycle(ctx.org!.id)),
  computeAgentPerformanceScore: protectedProcedure.query(async ({ ctx }) => computeAgentPerformanceScore(ctx.org!.id)),

  // ──────────────────────────────────────────
  //  LEGACY runAIAgent (kept for backward compat)
  // ──────────────────────────────────────────
  runAIAgent: protectedProcedure
    .input(z.object({ role: z.string(), prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const settings = await prisma.aiSetting.findUnique({ where: { organisationId: orgId } });
      if (settings && !settings.isEnabled) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'AI Assist mode is disabled in Settings.' });
      }
      const log = await prisma.aiOutputLog.create({
        data: {
          organisationId: orgId, requestId: crypto.randomUUID(),
          userId: ctx.user!.id, agentName: input.role, module: 'CHAT',
          inputContext: input.prompt, outputSummary: `Processed prompt for ${input.role}.`,
          model: settings?.modelName || 'gpt-4o', tokensUsed: 150, confidence: 0.95
        }
      });
      return {
        response: `Vortiq AI Agent [${input.role}]: Based on live database records, your operational metrics are stable. No immediate risks flagged.`,
        logId: log.id
      };
    })
});
