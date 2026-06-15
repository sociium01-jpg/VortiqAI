import Redis from 'ioredis';
import { VortiqEvent, EventPayloads } from '@vortiq/types';

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

// Handlers implementation place-holders (will link to relevant agent actions)
const logAction = (name: string) => async (payload: any) => {
  console.log(`[CASCADE] Running handler "${name}" for payload:`, payload);
};

// Define all cascading handler functions
const updateAnalytics = logAction('updateAnalytics');
const scoreLeadAsync = logAction('scoreLeadAsync');
const assignToRep = logAction('assignToRep');
const createActivityLog = logAction('createActivityLog');
const notifyAssignee = logAction('notifyAssignee');

const updateSalesTarget = logAction('updateSalesTarget');
const recalcForecast = logAction('recalcForecast');
const createTask = logAction('createTask');

const createJournalDraft = logAction('createJournalDraft');
const celebrateOnTelegram = logAction('celebrateOnTelegram');
const updateEmployeePerformance = logAction('updateEmployeePerformance');
const updateSuccessRate = logAction('updateSuccessRate');

const generateIRN = logAction('generateIRN');
const updateCashflow = logAction('updateCashflow');
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

const queueOpsAgent = logAction('queueOpsAgent');
const createAlert = logAction('createAlert');
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
  'deal.stage_changed': [updateSalesTarget, recalcForecast, createTask, updateAnalytics],
  'deal.won': [createJournalDraft, celebrateOnTelegram, updateEmployeePerformance, updateSuccessRate],
  'invoice.approved': [generateIRN, updateCashflow, updatePnL, notifyContact],
  'agent_job.awaiting_approval': [notifyViaWhatsApp, notifyViaTelegram, updateDashboard],
  'agent_job.approved': [executeAction, storeToMemory, updateDashboard, logAudit],
  'voice_call.completed': [syncToCRM, createFollowupTask, updateSalesTarget, storeTranscript],
  'stock.below_reorder': [queueOpsAgent, createAlert, notifyOnTelegram],
  'lead_search.completed': [notifyOnTelegram, updateLeadCredits, refreshUI],
  'sales_target.at_risk': [notifyOnWhatsApp, notifyOnTelegram, queueAnalystUpdate],
  'subscription.trial_ending': [sendWhatsAppWarning, sendTelegramWarning, sendEmail],
  'subscription.trial_expired': [downgradeToStarter, lockFeatures, showUpgradePage],
  'data.change': []
};

// Register all cascades into eventBus
for (const [event, handlers] of Object.entries(EVENT_CASCADES)) {
  eventBus.registerHandlers(event as VortiqEvent, handlers);
}
