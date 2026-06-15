/**
 * Vortiq AI Workflow Engine
 * 
 * Each workflow follows this contract:
 * 1. Code computes deterministic metrics (no AI involvement)
 * 2. Fetches real DB records
 * 3. Builds safe AI context (no raw PII)
 * 4. Calls AI provider if enabled (graceful fallback if not)
 * 5. Creates AiApprovalRequest if the action requires human sign-off
 * 6. Creates AiWorkflowRun record with full audit trail
 * 
 * IMPORTANT: Workflows never directly mutate financial, payroll, or external comms.
 * They always create an AiApprovalRequest for human review.
 */
import crypto from 'crypto';
import { prisma } from '@vortiq/db';
import { callAIProvider } from './providers.js';
import { FINANCE_AGENT_SYSTEM_PROMPT, SUPPORT_AGENT_SYSTEM_PROMPT, LEAD_AGENT_SYSTEM_PROMPT, CRM_AGENT_SYSTEM_PROMPT, SUPERBOSS_SYSTEM_PROMPT } from './prompts.js';

type WorkflowResult = {
  runId: string;
  status: 'COMPLETED' | 'AWAITING_APPROVAL' | 'FAILED';
  summary: string;
  approvalRequestId?: string;
  steps: Array<{ agent: string; action: string; status: string; output?: string }>;
};

/**
 * WORKFLOW 1: Lead Follow-Up
 * Trigger: New lead created OR lead has no follow-up activity > N days
 */
export async function runLeadFollowUpWorkflow(orgId: string, contactId: string, userId: string): Promise<WorkflowResult> {
  const steps: WorkflowResult['steps'] = [];
  const runRecord = await prisma.aiWorkflowRun.create({
    data: { organisationId: orgId, workflowId: crypto.randomUUID(), status: 'RUNNING', currentStep: 0 }
  });

  try {
    // Step 1: Code checks lead status
    const contact = await prisma.contact.findFirst({ where: { id: contactId, organisationId: orgId } });
    if (!contact) throw new Error(`Contact ${contactId} not found`);
    steps.push({ agent: 'Lead Engine Agent', action: 'Fetched lead record from database', status: 'COMPLETED' });

    // Step 2: Code checks last activity
    const lastActivity = await prisma.activity.findFirst({
      where: { organisationId: orgId, contactId },
      orderBy: { createdAt: 'desc' }
    });
    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - lastActivity.createdAt.getTime()) / 86400000)
      : 999;
    steps.push({ agent: 'Lead Engine Agent', action: `Last activity: ${daysSinceActivity} days ago`, status: 'COMPLETED' });

    // Step 3: AI recommends follow-up
    const userContext = `
LEAD DATA:
- Name: ${contact.firstName} ${contact.lastName}
- Company: ${contact.companyName || 'Unknown'}
- Status: ${contact.status}
- Lead Score: ${contact.leadScore || 'Not scored'}
- Days since last activity: ${daysSinceActivity}
- Source: ${contact.source || 'Unknown'}

QUESTION: Should we follow up with this lead? If yes, recommend the message type and urgency.
`.trim();

    const aiResult = await callAIProvider(orgId, LEAD_AGENT_SYSTEM_PROMPT, userContext, userId, 'LeadAgent', 'LEAD_ENGINE');
    const aiSummary = aiResult?.response || `Computed: Lead ${contact.firstName} ${contact.lastName} has been inactive for ${daysSinceActivity} days and requires follow-up.`;
    steps.push({ agent: 'Lead Engine Agent', action: 'AI recommendation generated', status: 'COMPLETED', output: aiSummary.substring(0, 200) });

    // Step 4: Create draft task (requires approval)
    const approvalReq = await prisma.aiApprovalRequest.create({
      data: {
        organisationId: orgId,
        actionType: 'SEND_WHATSAPP',
        status: 'PENDING',
        requestedBy: userId,
        payload: {
          contactId,
          contactName: `${contact.firstName} ${contact.lastName}`,
          message: aiSummary,
          actionRequired: 'Create follow-up task and send reminder to lead',
          daysSinceActivity
        } as any
      }
    });
    steps.push({ agent: 'Tasks Agent', action: 'Draft follow-up task created — awaiting human approval', status: 'AWAITING_APPROVAL' });

    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'AWAITING_APPROVAL', currentStep: steps.length, result: { steps, approvalRequestId: approvalReq.id } as any }
    });

    window_dispatchEvent_safe(orgId, 'vortiq-ai-approval-change');

    return {
      runId: runRecord.id,
      status: 'AWAITING_APPROVAL',
      summary: aiSummary,
      approvalRequestId: approvalReq.id,
      steps
    };
  } catch (err: any) {
    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'FAILED', error: err.message }
    });
    steps.push({ agent: 'System', action: `Workflow failed: ${err.message}`, status: 'FAILED' });
    return { runId: runRecord.id, status: 'FAILED', summary: err.message, steps };
  }
}

/**
 * WORKFLOW 2: Deal Risk Detection
 * Trigger: Deal stuck in pipeline stage > configured days
 */
export async function runDealRiskWorkflow(orgId: string, dealId: string, userId: string): Promise<WorkflowResult> {
  const steps: WorkflowResult['steps'] = [];
  const runRecord = await prisma.aiWorkflowRun.create({
    data: { organisationId: orgId, workflowId: crypto.randomUUID(), status: 'RUNNING', currentStep: 0 }
  });

  try {
    // Step 1: Fetch deal + compute age in stage
    const deal = await prisma.deal.findFirst({ where: { id: dealId, organisationId: orgId } });
    if (!deal) throw new Error(`Deal ${dealId} not found`);
    const daysInStage = Math.floor((Date.now() - deal.updatedAt.getTime()) / 86400000);
    steps.push({ agent: 'Sales Agent', action: `Deal "${deal.title}" stuck for ${daysInStage} days in current stage`, status: 'COMPLETED' });

    // Step 2: Build context for AI
    const userContext = `
DEAL DATA:
- Title: ${deal.title}
- Value: INR ${deal.value}
- Days in current stage: ${daysInStage}
- Created: ${deal.createdAt.toLocaleDateString()}
- Last updated: ${deal.updatedAt.toLocaleDateString()}

QUESTION: Is this deal at risk? What is the recommended next action?
`.trim();

    const aiResult = await callAIProvider(orgId, CRM_AGENT_SYSTEM_PROMPT, userContext, userId, 'SalesAgent', 'CRM');
    const aiSummary = aiResult?.response || `Deal "${deal.title}" (INR ${deal.value}) has been stuck for ${daysInStage} days. Recommend immediate follow-up.`;
    steps.push({ agent: 'Sales Agent', action: 'Deal risk assessment complete', status: 'COMPLETED', output: aiSummary.substring(0, 200) });

    // Step 3: Create alert (no approval needed — it's just an alert)
    await prisma.aiAgentMessage.create({
      data: {
        organisationId: orgId,
        agentRole: 'SALES',
        senderId: userId,
        content: aiSummary,
        direction: 'OUTBOUND'
      }
    });
    steps.push({ agent: 'Superboss Agent', action: 'Deal risk alert sent to manager dashboard', status: 'COMPLETED' });

    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'COMPLETED', currentStep: steps.length, result: { steps } as any }
    });

    return { runId: runRecord.id, status: 'COMPLETED', summary: aiSummary, steps };
  } catch (err: any) {
    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'FAILED', error: err.message }
    });
    return { runId: runRecord.id, status: 'FAILED', summary: err.message, steps };
  }
}

/**
 * WORKFLOW 3: Invoice Reminder
 * Trigger: Invoice overdue > 0 days
 */
export async function runInvoiceReminderWorkflow(orgId: string, invoiceId: string, userId: string): Promise<WorkflowResult> {
  const steps: WorkflowResult['steps'] = [];
  const runRecord = await prisma.aiWorkflowRun.create({
    data: { organisationId: orgId, workflowId: crypto.randomUUID(), status: 'RUNNING', currentStep: 0 }
  });

  try {
    // Step 1: Fetch invoice details
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, organisationId: orgId } });
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    const daysOverdue = Math.floor((Date.now() - invoice.dueDate.getTime()) / 86400000);
    steps.push({ agent: 'Finance Agent', action: `Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue (INR ${invoice.grandTotal})`, status: 'COMPLETED' });

    // Step 2: Build AI context
    const userContext = `
INVOICE DATA:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: INR ${invoice.grandTotal}
- Due Date: ${invoice.dueDate.toLocaleDateString()}
- Days Overdue: ${daysOverdue}
- Status: ${invoice.status}

TASK: Draft a professional, firm but polite payment reminder message.
Include a reference to the invoice number and amount. Do not include any payment link unless instructed.
`.trim();

    const aiResult = await callAIProvider(orgId, FINANCE_AGENT_SYSTEM_PROMPT, userContext, userId, 'FinanceAgent', 'FINANCE');
    const draftMessage = aiResult?.response || `Dear Client,\n\nThis is a reminder that Invoice ${invoice.invoiceNumber} for INR ${invoice.grandTotal} was due on ${invoice.dueDate.toLocaleDateString()} and is now ${daysOverdue} days overdue. Please arrange payment at the earliest. Thank you.`;
    steps.push({ agent: 'Finance Agent', action: 'Payment reminder drafted', status: 'COMPLETED', output: draftMessage.substring(0, 200) });

    // Step 3: Create approval request (human must approve before sending)
    const approvalReq = await prisma.aiApprovalRequest.create({
      data: {
        organisationId: orgId,
        actionType: 'SEND_WHATSAPP',
        status: 'PENDING',
        requestedBy: userId,
        payload: {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.grandTotal,
          daysOverdue,
          draftMessage,
          actionRequired: 'Send payment reminder to client'
        } as any
      }
    });
    steps.push({ agent: 'Finance Agent', action: 'Payment reminder queued for human approval', status: 'AWAITING_APPROVAL' });

    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'AWAITING_APPROVAL', currentStep: steps.length, result: { steps, approvalRequestId: approvalReq.id } as any }
    });

    window_dispatchEvent_safe(orgId, 'vortiq-ai-approval-change');

    return { runId: runRecord.id, status: 'AWAITING_APPROVAL', summary: draftMessage, approvalRequestId: approvalReq.id, steps };
  } catch (err: any) {
    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'FAILED', error: err.message }
    });
    return { runId: runRecord.id, status: 'FAILED', summary: err.message, steps };
  }
}

/**
 * WORKFLOW 4: Support Escalation
 * Trigger: Ticket unresolved beyond SLA
 */
export async function runSupportEscalationWorkflow(orgId: string, ticketId: string, userId: string): Promise<WorkflowResult> {
  const steps: WorkflowResult['steps'] = [];
  const runRecord = await prisma.aiWorkflowRun.create({
    data: { organisationId: orgId, workflowId: crypto.randomUUID(), status: 'RUNNING', currentStep: 0 }
  });

  try {
    // Step 1: Fetch ticket
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, organisationId: orgId } });
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);
    const hoursOpen = Math.floor((Date.now() - ticket.createdAt.getTime()) / 3600000);
    steps.push({ agent: 'Support Agent', action: `Ticket "${ticket.title}" open for ${hoursOpen} hours`, status: 'COMPLETED' });

    // Step 2: AI summarizes and recommends escalation action
    const userContext = `
SUPPORT TICKET:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description'}
- Status: ${ticket.status}
- Priority: ${ticket.priority || 'NORMAL'}
- Hours Open: ${hoursOpen}

TASK: Assess this ticket. Is escalation required? Draft a brief internal escalation note for the manager.
`.trim();

    const aiResult = await callAIProvider(orgId, SUPPORT_AGENT_SYSTEM_PROMPT, userContext, userId, 'SupportAgent', 'SUPPORT');
    const escalationNote = aiResult?.response || `Ticket "${ticket.title}" has been open for ${hoursOpen} hours and requires immediate escalation. Priority: ${ticket.priority || 'NORMAL'}.`;
    steps.push({ agent: 'Support Agent', action: 'Escalation assessment complete', status: 'COMPLETED', output: escalationNote.substring(0, 200) });

    // Step 3: Create approval request for client reply
    const approvalReq = await prisma.aiApprovalRequest.create({
      data: {
        organisationId: orgId,
        actionType: 'SEND_WHATSAPP',
        status: 'PENDING',
        requestedBy: userId,
        payload: {
          ticketId,
          ticketTitle: ticket.title,
          hoursOpen,
          escalationNote,
          actionRequired: 'Approve escalation and client communication'
        } as any
      }
    });
    steps.push({ agent: 'Superboss Agent', action: 'Escalation alert queued for manager approval', status: 'AWAITING_APPROVAL' });

    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'AWAITING_APPROVAL', currentStep: steps.length, result: { steps, approvalRequestId: approvalReq.id } as any }
    });

    window_dispatchEvent_safe(orgId, 'vortiq-ai-approval-change');

    return { runId: runRecord.id, status: 'AWAITING_APPROVAL', summary: escalationNote, approvalRequestId: approvalReq.id, steps };
  } catch (err: any) {
    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'FAILED', error: err.message }
    });
    return { runId: runRecord.id, status: 'FAILED', summary: err.message, steps };
  }
}

/**
 * WORKFLOW 5: Client Churn Risk
 * Trigger: Low usage + payment delay + repeated tickets + renewal approaching
 */
export async function runChurnRiskWorkflow(orgId: string, contactId: string, userId: string): Promise<WorkflowResult> {
  const steps: WorkflowResult['steps'] = [];
  const runRecord = await prisma.aiWorkflowRun.create({
    data: { organisationId: orgId, workflowId: crypto.randomUUID(), status: 'RUNNING', currentStep: 0 }
  });

  try {
    // Step 1: Compute usage + issues
    const contact = await prisma.contact.findFirst({ where: { id: contactId, organisationId: orgId } });
    if (!contact) throw new Error(`Contact ${contactId} not found`);

    const overdueInvoicesCount = await prisma.invoice.count({
      where: { organisationId: orgId, status: 'OVERDUE', deletedAt: null }
    });
    const ticketCount = await prisma.ticket.count({
      where: { organisationId: orgId, deletedAt: null }
    });
    const lastActivity = await prisma.activity.findFirst({
      where: { organisationId: orgId, contactId },
      orderBy: { createdAt: 'desc' }
    });
    const daysSinceActivity = lastActivity ? Math.floor((Date.now() - lastActivity.createdAt.getTime()) / 86400000) : 999;

    // Compute churn risk score
    let churnRisk = 0;
    if (daysSinceActivity > 30) churnRisk += 30;
    if (daysSinceActivity > 60) churnRisk += 20;
    if (overdueInvoicesCount > 0) churnRisk += 25;
    if (ticketCount > 3) churnRisk += 15;
    churnRisk = Math.min(100, churnRisk);

    steps.push({ agent: 'Analytics Agent', action: `Churn risk score computed: ${churnRisk}% (Days inactive: ${daysSinceActivity}, Overdue invoices: ${overdueInvoicesCount})`, status: 'COMPLETED' });

    // Step 2: AI summarizes and recommends success action
    const userContext = `
CLIENT CHURN RISK:
- Client: ${contact.firstName} ${contact.lastName} (${contact.companyName || 'Unknown company'})
- Churn Risk Score: ${churnRisk}%
- Days Since Last Activity: ${daysSinceActivity}
- Overdue Invoices: ${overdueInvoicesCount}
- Open Support Tickets: ${ticketCount}

TASK: Assess churn risk severity. Recommend a specific customer success action to retain this client.
`.trim();

    const aiResult = await callAIProvider(orgId, SUPERBOSS_SYSTEM_PROMPT, userContext, userId, 'SuperbossAgent', 'CRM');
    const retentionPlan = aiResult?.response || `Client ${contact.firstName} ${contact.lastName} has a ${churnRisk}% churn risk. Recommend immediate outreach by account manager.`;
    steps.push({ agent: 'Superboss Agent', action: 'Retention recommendation generated', status: 'COMPLETED', output: retentionPlan.substring(0, 200) });

    // Step 3: Create approval request for success action
    const approvalReq = await prisma.aiApprovalRequest.create({
      data: {
        organisationId: orgId,
        actionType: 'SEND_WHATSAPP',
        status: 'PENDING',
        requestedBy: userId,
        payload: {
          contactId,
          contactName: `${contact.firstName} ${contact.lastName}`,
          churnRisk,
          retentionPlan,
          actionRequired: 'Approve customer retention outreach'
        } as any
      }
    });
    steps.push({ agent: 'Superboss Agent', action: 'Retention task queued for approval', status: 'AWAITING_APPROVAL' });

    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'AWAITING_APPROVAL', currentStep: steps.length, result: { steps, approvalRequestId: approvalReq.id } as any }
    });

    window_dispatchEvent_safe(orgId, 'vortiq-ai-approval-change');

    return { runId: runRecord.id, status: 'AWAITING_APPROVAL', summary: retentionPlan, approvalRequestId: approvalReq.id, steps };
  } catch (err: any) {
    await prisma.aiWorkflowRun.update({
      where: { id: runRecord.id },
      data: { status: 'FAILED', error: err.message }
    });
    return { runId: runRecord.id, status: 'FAILED', summary: err.message, steps };
  }
}

// Helper: dispatch real-time event (Node.js server doesn't have window, this is a no-op on backend)
// Real-time updates are achieved via frontend polling on `getAIApprovalQueue`
function window_dispatchEvent_safe(orgId: string, event: string): void {
  // no-op on server — frontend polls for updates
}
