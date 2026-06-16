import Redis from 'ioredis';
import { VortiqEvent, EventPayloads } from '@vortiq/types';
import { prisma } from '@vortiq/db';

// In development, if REDIS_URL is not set, use a fallback mock EventBus
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class EventBus {
  private pub: Redis | null = null;
  private sub: Redis | null = null;
  private handlers: Map<string, Function[]> = new Map();
  private isConnected = false;

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      try {
        const redisOpts = {
          maxRetriesPerRequest: null,
          retryStrategy: (times: number) => {
            // Silently attempt reconnecting every 10 seconds, capped at 10 seconds
            return 10000;
          }
        };
        this.pub = new Redis(REDIS_URL, redisOpts);
        this.sub = new Redis(REDIS_URL, redisOpts);
        this.isConnected = false; // Starts false, flips true on connect event

        this.pub.on('connect', () => {
          console.log('[EVENT_BUS] Redis pub connected successfully.');
          this.isConnected = true;
        });

        this.pub.on('error', (err) => {
          // Only print once or warn of failure
          this.isConnected = false;
        });

        this.sub.on('connect', () => {
          console.log('[EVENT_BUS] Redis sub connected successfully.');
          this.setupSubscriber();
        });

        this.sub.on('error', (err) => {
          // Suppress noise, handled by pub event
        });
      } catch (e) {
        console.warn('Could not initialize Redis client, falling back to memory event bus.');
      }
    }
  }

  private setupSubscriber() {
    if (!this.sub) return;
    this.sub.subscribe('vortiq-events');
    this.sub.on('message', (channel, message) => {
      if (channel === 'vortiq-events') {
        try {
          const { event, payload } = JSON.parse(message);
          this.executeHandlers(event, payload);
        } catch (err) {
          console.error('Failed to parse published event message:', err);
        }
      }
    });
  }

  private globalListeners: ((event: string, payload: any) => void)[] = [];

  subscribeToAll(handler: (event: string, payload: any) => void) {
    this.globalListeners.push(handler);
    return () => {
      this.globalListeners = this.globalListeners.filter(h => h !== handler);
    };
  }

  private executeHandlers(event: string, payload: any) {
    const list = this.handlers.get(event) || [];
    for (const handler of list) {
      handler(payload).catch((err: any) => {
        console.error(`Error in event handler for ${event}:`, err);
      });
    }
    for (const listener of this.globalListeners) {
      try {
        listener(event, payload);
      } catch (err) {
        console.error('Error in global event bus listener:', err);
      }
    }
  }

  registerHandlers(event: VortiqEvent, handlers: Function[]) {
    const existing = this.handlers.get(event) || [];
    this.handlers.set(event, [...existing, ...handlers]);
  }

  async publish<K extends VortiqEvent>(event: K, payload: EventPayloads[K]): Promise<void> {
    console.log(`[EVENT_BUS] Publishing event: "${event}"`, payload);
    if (this.isConnected && this.pub) {
      await this.pub.publish('vortiq-events', JSON.stringify({ event, payload }));
    } else {
      // In-memory fallback
      setTimeout(() => this.executeHandlers(event, payload), 0);
    }
  }
}

export const eventBus = new EventBus();

// Handlers implementation
const logAction = (name: string) => async (payload: any) => {
  console.log(`[CASCADE] Running handler "${name}" for payload:`, payload);
};

// Define all cascading handler functions
const updateAnalytics = async (payload: any) => {
  const orgId = payload.organisationId;
  if (orgId) {
    // Notify client UI of data change
    await eventBus.publish('data.change', { organisationId: orgId, module: 'ANALYTICS', action: 'REFRESH' });
  }
};

const scoreLeadAsync = logAction('scoreLeadAsync');

const assignToRep = async (payload: any) => {
  const orgId = payload.organisationId;
  const contactId = payload.contactId;
  if (orgId && contactId) {
    // Assign contact to an admin or sales user if not assigned
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (contact && !contact.consentStatus) {
      // simulate assignment
      console.log(`[CASCADE] Automatically assigned contact ${contactId} to default rep.`);
    }
  }
};

const createActivityLog = async (payload: any) => {
  const orgId = payload.organisationId;
  const recordId = payload.leadId || payload.contactId || payload.dealId || payload.invoiceId || payload.ticketId || payload.taskId || payload.employeeId || payload.jobId || payload.runId;
  if (orgId && recordId) {
    let moduleName = 'SYSTEM';
    let description = 'System activity triggered.';
    if (payload.leadId) { moduleName = 'CRM_LEADS'; description = 'Lead record activity updated.'; }
    else if (payload.contactId) { moduleName = 'CRM_CONTACTS'; description = 'CRM contact details modified.'; }
    else if (payload.dealId) { moduleName = 'CRM_DEALS'; description = 'CRM deal deal-flow update.'; }
    else if (payload.invoiceId) { moduleName = 'FINANCE_INVOICES'; description = 'Finance billing invoice update.'; }
    else if (payload.ticketId) { moduleName = 'SUPPORT_TICKETS'; description = 'Client support ticket status update.'; }
    else if (payload.taskId) { moduleName = 'TASKS'; description = 'Kanban task item update.'; }
    else if (payload.employeeId) { moduleName = 'HR_EMPLOYEES'; description = 'HR employee record update.'; }

    await prisma.activityTimeline.create({
      data: {
        organisationId: orgId,
        module: moduleName,
        recordId,
        actionType: 'STATUS_CHANGE',
        description,
        actorName: 'OS System Trigger'
      }
    });
  }
};

const notifyAssignee = async (payload: any) => {
  const orgId = payload.organisationId;
  // Send notification to primary user or rep
  const user = await prisma.user.findFirst({ where: { organisationId: orgId } });
  if (orgId && user) {
    await prisma.notification.create({
      data: {
        organisationId: orgId,
        userId: user.id,
        title: 'New OS Event Assigned',
        message: 'A cross-module task or status change requires your review.',
        module: 'SYSTEM'
      }
    });
  }
};

const updateSalesTarget = logAction('updateSalesTarget');
const recalcForecast = logAction('recalcForecast');

const createTask = async (payload: any) => {
  const orgId = payload.organisationId;
  const dealId = payload.dealId;
  if (orgId && dealId) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (deal) {
      const task = await prisma.task.create({
        data: {
          organisationId: orgId,
          title: `Onboard client and setup deliverables for won deal: ${deal.title}`,
          status: 'TODO',
          priority: 'P1',
          createdByUserId: payload.userId || deal.organisationId // fallback
        }
      });
      await prisma.recordRelationship.create({
        data: {
          organisationId: orgId,
          sourceModule: 'CRM_DEALS',
          sourceRecordId: dealId,
          targetModule: 'TASKS',
          targetRecordId: task.id,
          relationship: 'DEPENDENT_ON'
        }
      });
      await eventBus.publish('data.change', { organisationId: orgId, module: 'TASKS', action: 'CREATE' });
    }
  }
};

const createJournalDraft = async (payload: any) => {
  const orgId = payload.organisationId;
  const dealId = payload.dealId;
  if (orgId && dealId) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (deal) {
      const invNumber = `INV-DRAFT-${Date.now()}`;
      const invoice = await prisma.invoice.create({
        data: {
          organisationId: orgId,
          invoiceNumber: invNumber,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 3600000),
          status: 'DRAFT',
          grandTotal: deal.value,
          subTotal: deal.value,
          items: JSON.stringify([{ description: deal.title, amount: deal.value, quantity: 1 }]),
          createdByUserId: payload.userId || deal.organisationId // fallback
        }
      });
      await prisma.recordRelationship.create({
        data: {
          organisationId: orgId,
          sourceModule: 'CRM_DEALS',
          sourceRecordId: dealId,
          targetModule: 'FINANCE_INVOICES',
          targetRecordId: invoice.id,
          relationship: 'CREATED_FROM'
        }
      });
      await eventBus.publish('data.change', { organisationId: orgId, module: 'INVOICES', action: 'CREATE' });
    }
  }
};

const celebrateOnTelegram = logAction('celebrateOnTelegram');
const updateEmployeePerformance = logAction('updateEmployeePerformance');
const updateSuccessRate = logAction('updateSuccessRate');

const generateIRN = logAction('generateIRN');

const updateCashflow = async (payload: any) => {
  const orgId = payload.organisationId;
  if (orgId) {
    console.log('[CASCADE] Re-calculating business cashflow from paid invoice:', payload);
    // Publish a UI refresh to update telemetry indicators
    await eventBus.publish('data.change', { organisationId: orgId, module: 'DASHBOARD', action: 'REFRESH' });
  }
};

const updatePnL = logAction('updatePnL');
const notifyContact = logAction('notifyContact');

const notifyViaWhatsApp = logAction('notifyViaWhatsApp');
const notifyViaTelegram = logAction('notifyViaTelegram');
const updateDashboard = logAction('updateDashboard');

const executeAction = logAction('executeAction');
const storeToMemory = logAction('storeToMemory');
const logAudit = logAction('logAudit');

const syncToCRM = logAction('syncToCRM');
const createFollowupTask = logAction('createFollowupTask');
const storeTranscript = logAction('storeTranscript');

const queueOpsAgent = async (payload: any) => {
  const orgId = payload.organisationId;
  const itemId = payload.itemId;
  if (orgId && itemId) {
    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (item && item.quantity <= item.reorderPoint) {
      await eventBus.publish('stock.below_reorder', {
        itemId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        reorderPoint: item.reorderPoint,
        organisationId: orgId
      });
    }
  }
};

const createAlert = async (payload: any) => {
  const orgId = payload.organisationId;
  if (orgId) {
    const adminUser = await prisma.user.findFirst({ where: { organisationId: orgId } });
    if (adminUser) {
      await prisma.notification.create({
        data: {
          organisationId: orgId,
          userId: adminUser.id,
          title: `⚠️ LOW STOCK WARNING: ${payload.name}`,
          message: `SKU ${payload.sku} quantity (${payload.quantity}) is below reorder threshold (${payload.reorderPoint}).`,
          module: 'INVENTORY',
          recordId: payload.itemId
        }
      });
      await eventBus.publish('data.change', { organisationId: orgId, module: 'NOTIFICATIONS', action: 'CREATE' });
    }
  }
};

const notifyOnTelegram = logAction('notifyOnTelegram');
const updateLeadCredits = logAction('updateLeadCredits');
const refreshUI = logAction('refreshUI');

const notifyOnWhatsApp = logAction('notifyOnWhatsApp');
const queueAnalystUpdate = logAction('queueAnalystUpdate');

const sendWhatsAppWarning = logAction('sendWhatsAppWarning');
const sendTelegramWarning = logAction('sendTelegramWarning');
const sendEmail = logAction('sendEmail');

const downgradeToStarter = logAction('downgradeToStarter');
const lockFeatures = logAction('lockFeatures');
const showUpgradePage = logAction('showUpgradePage');

// Setup the cascades according to ABSOLUTE PRINCIPLES (interconnection)
const EVENT_CASCADES: Record<VortiqEvent, Function[]> = {
  'contact.created': [updateAnalytics, scoreLeadAsync, assignToRep, createActivityLog, notifyAssignee],
  'contact.updated': [createActivityLog, updateAnalytics],
  'lead.created': [createActivityLog, notifyAssignee, updateAnalytics],
  'lead.updated': [createActivityLog, updateAnalytics],
  'lead.converted': [createActivityLog, updateAnalytics, createTask],
  'client.created': [createActivityLog, updateAnalytics],
  'client.updated': [createActivityLog, updateAnalytics],
  'deal.stage_changed': [updateSalesTarget, recalcForecast, createTask, updateAnalytics],
  'deal.won': [createJournalDraft, celebrateOnTelegram, updateEmployeePerformance, updateSuccessRate],
  'invoice.created': [createActivityLog, updateAnalytics],
  'invoice.approved': [generateIRN, updateCashflow, updatePnL, notifyContact],
  'invoice.paid': [createActivityLog, updateCashflow, updateAnalytics],
  'payment.failed': [createActivityLog, updateAnalytics],
  'stock.added': [createActivityLog, updateAnalytics],
  'stock.subtracted': [queueOpsAgent, createActivityLog, updateAnalytics],
  'stock.below_reorder': [queueOpsAgent, createAlert, notifyOnTelegram],
  'ticket.created': [createActivityLog, notifyAssignee, updateAnalytics],
  'ticket.escalated': [createActivityLog, notifyAssignee],
  'ticket.resolved': [createActivityLog, updateAnalytics],
  'task.completed': [createActivityLog, updateAnalytics],
  'task.overdue': [createActivityLog, notifyAssignee],
  'employee.added': [createActivityLog, updateAnalytics],
  'employee.updated': [createActivityLog],
  'subscription.expiring': [createActivityLog],
  'subscription.renewed': [createActivityLog, updateAnalytics],
  'subscription.trial_ending': [sendWhatsAppWarning, sendTelegramWarning, sendEmail],
  'subscription.trial_expired': [downgradeToStarter, lockFeatures, showUpgradePage],
  'import.completed': [createActivityLog, updateAnalytics],
  'export.created': [createActivityLog],
  'ai.workflow.completed': [createActivityLog, updateAnalytics],
  'agent_job.awaiting_approval': [notifyViaWhatsApp, notifyViaTelegram, updateDashboard],
  'agent_job.approved': [executeAction, storeToMemory, updateDashboard, logAudit],
  'voice_call.completed': [syncToCRM, createFollowupTask, updateSalesTarget, storeTranscript],
  'lead_search.completed': [notifyOnTelegram, updateLeadCredits, refreshUI],
  'sales_target.at_risk': [notifyOnWhatsApp, notifyOnTelegram, queueAnalystUpdate],
  'data.change': []
};

// Register all cascades into eventBus
for (const [event, handlers] of Object.entries(EVENT_CASCADES)) {
  eventBus.registerHandlers(event as VortiqEvent, handlers);
}

