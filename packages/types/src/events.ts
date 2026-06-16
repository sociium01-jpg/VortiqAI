export type VortiqEvent =
  | 'contact.created'
  | 'contact.updated'
  | 'lead.created'
  | 'lead.updated'
  | 'lead.converted'
  | 'client.created'
  | 'client.updated'
  | 'deal.stage_changed'
  | 'deal.won'
  | 'invoice.created'
  | 'invoice.approved'
  | 'invoice.paid'
  | 'payment.failed'
  | 'stock.added'
  | 'stock.subtracted'
  | 'stock.below_reorder'
  | 'ticket.created'
  | 'ticket.escalated'
  | 'ticket.resolved'
  | 'task.completed'
  | 'task.overdue'
  | 'employee.added'
  | 'employee.updated'
  | 'subscription.expiring'
  | 'subscription.renewed'
  | 'subscription.trial_ending'
  | 'subscription.trial_expired'
  | 'import.completed'
  | 'export.created'
  | 'ai.workflow.completed'
  | 'agent_job.awaiting_approval'
  | 'agent_job.approved'
  | 'voice_call.completed'
  | 'lead_search.completed'
  | 'sales_target.at_risk'
  | 'data.change';

export interface EventPayloads {
  'contact.created': { contactId: string; organisationId: string };
  'contact.updated': { contactId: string; organisationId: string };
  'lead.created': { leadId: string; organisationId: string };
  'lead.updated': { leadId: string; organisationId: string };
  'lead.converted': { leadId: string; contactId: string; organisationId: string };
  'client.created': { clientId: string; organisationId: string };
  'client.updated': { clientId: string; organisationId: string };
  'deal.stage_changed': { dealId: string; oldStage: string; newStage: string; organisationId: string };
  'deal.won': { dealId: string; organisationId: string; userId?: string };
  'invoice.created': { invoiceId: string; organisationId: string };
  'invoice.approved': { invoiceId: string; organisationId: string };
  'invoice.paid': { invoiceId: string; organisationId: string; amount: number };
  'payment.failed': { invoiceId: string; organisationId: string; amount: number };
  'stock.added': { itemId: string; sku: string; quantity: number; organisationId: string };
  'stock.subtracted': { itemId: string; sku: string; quantity: number; organisationId: string };
  'stock.below_reorder': { itemId: string; sku: string; name: string; quantity: number; reorderPoint: number; organisationId: string };
  'ticket.created': { ticketId: string; organisationId: string };
  'ticket.escalated': { ticketId: string; organisationId: string };
  'ticket.resolved': { ticketId: string; organisationId: string };
  'task.completed': { taskId: string; organisationId: string };
  'task.overdue': { taskId: string; organisationId: string };
  'employee.added': { employeeId: string; organisationId: string };
  'employee.updated': { employeeId: string; organisationId: string };
  'subscription.expiring': { organisationId: string; daysRemaining: number };
  'subscription.renewed': { organisationId: string };
  'subscription.trial_ending': { organisationId: string; daysRemaining: number };
  'subscription.trial_expired': { organisationId: string };
  'import.completed': { jobId: string; organisationId: string };
  'export.created': { jobId: string; organisationId: string };
  'ai.workflow.completed': { runId: string; organisationId: string };
  'agent_job.awaiting_approval': { jobId: string; organisationId: string; agentType: string };
  'agent_job.approved': { jobId: string; organisationId: string; agentType: string };
  'voice_call.completed': { callId: string; contactId: string; organisationId: string; duration: number; outcome: string };
  'lead_search.completed': { query: string; resultsCount: number; organisationId: string };
  'sales_target.at_risk': { targetId: string; forecastAmount: number; targetAmount: number; organisationId: string };
  'data.change': { organisationId: string; module: string; action: string; recordId?: string };
}
