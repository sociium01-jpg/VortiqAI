export type VortiqEvent =
  | 'contact.created'
  | 'deal.stage_changed'
  | 'deal.won'
  | 'invoice.approved'
  | 'agent_job.awaiting_approval'
  | 'agent_job.approved'
  | 'voice_call.completed'
  | 'stock.below_reorder'
  | 'lead_search.completed'
  | 'sales_target.at_risk'
  | 'subscription.trial_ending'
  | 'subscription.trial_expired';

export interface EventPayloads {
  'contact.created': { contactId: string; organisationId: string };
  'deal.stage_changed': { dealId: string; oldStage: string; newStage: string; organisationId: string };
  'deal.won': { dealId: string; organisationId: string; userId?: string };
  'invoice.approved': { invoiceId: string; organisationId: string };
  'agent_job.awaiting_approval': { jobId: string; organisationId: string; agentType: string };
  'agent_job.approved': { jobId: string; organisationId: string; agentType: string };
  'voice_call.completed': { callId: string; contactId: string; organisationId: string; duration: number; outcome: string };
  'stock.below_reorder': { itemId: string; sku: string; name: string; quantity: number; reorderPoint: number; organisationId: string };
  'lead_search.completed': { query: string; resultsCount: number; organisationId: string };
  'sales_target.at_risk': { targetId: string; forecastAmount: number; targetAmount: number; organisationId: string };
  'subscription.trial_ending': { organisationId: string; daysRemaining: number };
  'subscription.trial_expired': { organisationId: string };
}
