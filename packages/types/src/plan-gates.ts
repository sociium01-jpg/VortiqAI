export type PlanTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface PlanLimit {
  maxUsers: number;
  maxLeadsPerMonth: number;
  maxVoiceMinutesPerMonth: number;
  maxAgentJobsPerMonth: number;
  features: string[];
}

export const PLAN_GATES: Record<PlanTier, PlanLimit> = {
  STARTER: {
    maxUsers: 3,
    maxLeadsPerMonth: 100,
    maxVoiceMinutesPerMonth: 0,
    maxAgentJobsPerMonth: 10,
    features: ['contacts', 'deals', 'tasks']
  },
  GROWTH: {
    maxUsers: 15,
    maxLeadsPerMonth: 1000,
    maxVoiceMinutesPerMonth: 200,
    maxAgentJobsPerMonth: 150,
    features: [
      'contacts',
      'deals',
      'tasks',
      'voice_agent',
      'telegram_integration',
      'whatsapp_integration',
      'briefings',
      'analytics'
    ]
  },
  ENTERPRISE: {
    maxUsers: 9999,
    maxLeadsPerMonth: 99999,
    maxVoiceMinutesPerMonth: 5000,
    maxAgentJobsPerMonth: 99999,
    features: [
      'contacts',
      'deals',
      'tasks',
      'voice_agent',
      'telegram_integration',
      'whatsapp_integration',
      'briefings',
      'analytics',
      'custom_connectors',
      'hiring_agent',
      'financial_anomaly_detection'
    ]
  }
};

export function isFeatureAllowed(tier: PlanTier, feature: string): { allowed: boolean; requiredPlan?: PlanTier } {
  if (PLAN_GATES[tier].features.includes(feature)) {
    return { allowed: true };
  }
  
  // Find which tier offers the feature
  if (PLAN_GATES.GROWTH.features.includes(feature)) {
    return { allowed: false, requiredPlan: 'GROWTH' };
  }
  if (PLAN_GATES.ENTERPRISE.features.includes(feature)) {
    return { allowed: false, requiredPlan: 'ENTERPRISE' };
  }
  
  return { allowed: false, requiredPlan: 'ENTERPRISE' };
}
