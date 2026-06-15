import { prisma } from '@vortiq/db';
import { isFeatureAllowed } from '@vortiq/types';

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;

  private constructor() {}

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  /**
   * Dispatches a job to an agent, checking feature gates and execution limits.
   */
  public async dispatch(params: {
    organisationId: string;
    agentType: string;
    description: string;
    actionDraft?: any;
    bypassApproval?: boolean;
  }): Promise<any> {
    const { organisationId, agentType, description, actionDraft, bypassApproval } = params;

    // 1. Fetch Organisation Plan
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId }
    });
    if (!org) {
      throw new Error("Organisation not found.");
    }

    // 2. Enforce Feature Gating
    // Map agent types to features
    let requiredFeature = 'contacts';
    if (['finance'].includes(agentType)) requiredFeature = 'financial_anomaly_detection';
    else if (['hiring'].includes(agentType)) requiredFeature = 'hiring_agent';
    else if (['voice_call'].includes(agentType)) requiredFeature = 'voice_agent';
    else if (['briefing'].includes(agentType)) requiredFeature = 'briefings';
    else if (['business_analyst'].includes(agentType)) requiredFeature = 'analytics';

    const gateResult = isFeatureAllowed(org.plan as any, requiredFeature);
    if (!gateResult.allowed) {
      throw new Error(
        JSON.stringify({
          code: 'PLAN_LIMIT',
          feature: requiredFeature,
          requiredPlan: gateResult.requiredPlan
        })
      );
    }

    // 3. Concurrency Checks: Max 5 concurrent jobs
    const activeJobs = await prisma.agentJob.count({
      where: {
        organisationId,
        status: { in: ['RUNNING', 'APPROVED'] }
      }
    });

    if (activeJobs >= 5) {
      throw new Error("CONCURRENCY_LIMIT: Maximum of 5 concurrent agent operations are currently running. Please wait for them to finish.");
    }

    // 4. Create Job Record
    // Finance writes must always be human-approved (AWAITING_APPROVAL status)
    const requiresHumanApproval = ['finance', 'legal'].includes(agentType) || !bypassApproval;
    const initialStatus = requiresHumanApproval ? 'AWAITING_APPROVAL' : 'APPROVED';

    const job = await prisma.agentJob.create({
      data: {
        organisationId,
        agentType,
        status: initialStatus,
        description,
        draftAction: actionDraft || {}
      }
    });

    console.log(`[ORCHESTRATOR] Dispatched ${agentType} job ${job.id}. Status: ${initialStatus}`);

    // If job was automatically approved, run execution asynchronously
    if (initialStatus === 'APPROVED') {
      this.executeJob(job.id).catch(err => {
        console.error(`Failed executing approved job ${job.id}:`, err);
      });
    }

    return job;
  }

  /**
   * Executes an approved job and marks it completed.
   */
  public async executeJob(jobId: string): Promise<void> {
    const job = await prisma.agentJob.findUnique({
      where: { id: jobId }
    });
    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') return;

    await prisma.agentJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING' }
    });

    try {
      console.log(`[ORCHESTRATOR] Executing job ${jobId} for agent ${job.agentType}...`);
      
      // Simulating job processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      await prisma.agentJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' }
      });
      
      console.log(`[ORCHESTRATOR] Job ${jobId} completed successfully.`);
    } catch (err: any) {
      await prisma.agentJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: err.message || 'Unknown execution error' }
      });
      console.error(`[ORCHESTRATOR] Job ${jobId} failed:`, err.message);
    }
  }
}

export const agentOrchestrator = AgentOrchestrator.getInstance();
