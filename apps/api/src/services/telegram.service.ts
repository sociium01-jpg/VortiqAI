import { Telegraf, Context, Markup } from 'telegraf';
import { prisma } from '@vortiq/db';
import { executeVortiqSkill } from '@vortiq/agents/src/openclaw/index.js';

// Global cache for pairing codes: maps 6-digit code -> { telegramUserId, telegramUsername }
export const pairingCodes = new Map<string, { telegramUserId: string; telegramUsername?: string }>();

// Format INR Helper (Rs 1,00,000)
export function formatINR(num: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
  return formatter.format(num).replace('INR', 'Rs');
}

// Format Date Helper (DD/MM/YYYY)
export function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export class TelegramBotService {
  private bot: Telegraf | null = null;
  private static instance: TelegramBotService;

  private constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      this.bot = new Telegraf(token);
      this.setupHandlers();
    } else {
      console.warn('TELEGRAM_BOT_TOKEN not found. Telegram bot integration is disabled.');
    }
  }

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  public async start(): Promise<void> {
    if (!this.bot) return;
    this.bot.launch().catch(err => {
      console.error('Failed to launch Telegram Bot:', err);
    });
    console.log('[TELEGRAM_BOT] Bot launched successfully.');
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Command: /start
    this.bot.command('start', async (ctx) => {
      const tgId = String(ctx.from.id);
      const session = await prisma.telegramSession.findUnique({
        where: { telegramUserId: tgId },
        include: { user: { include: { organisation: true } } }
      });

      if (session && session.isActive) {
        return ctx.reply(
          `Welcome back ${session.user.name}! 🚀\n` +
          `Connected to *${session.user.organisation.name}* (${session.user.role}).\n\n` +
          `Try typing a command like "Show my tasks" or "What's our revenue this month?"`,
          { parse_mode: 'Markdown' }
        );
      }

      // Generate pairing code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      pairingCodes.set(code, { telegramUserId: tgId, telegramUsername: ctx.from.username });
      
      // Delete pairing code after 10 minutes
      setTimeout(() => pairingCodes.delete(code), 10 * 60 * 1000);

      return ctx.reply(
        `Welcome to VORTIQ Business OS Bot! 🇮🇳\n\n` +
        `To pair your account, please follow these steps:\n` +
        `1. Log in to your Vortiq dashboard at https://app.vortiq.in\n` +
        `2. Go to Settings ⚙️ -> Telegram\n` +
        `3. Enter this pairing code: *${code}*\n\n` +
        `Note: This code expires in 10 minutes.`,
        { parse_mode: 'Markdown' }
      );
    });

    // Command: /status
    this.bot.command('status', async (ctx) => {
      const user = await this.authenticate(ctx);
      if (!user) return;
      
      const counts = await prisma.agentJob.count({
        where: { organisationId: user.organisationId, status: 'AWAITING_APPROVAL' }
      });

      ctx.reply(
        `✅ Connection Active\n` +
        `👤 User: ${user.name} (${user.role})\n` +
        `🏢 Org: ${user.organisation.name}\n` +
        `⏳ Pending approvals: ${counts}`
      );
    });

    // Command: /briefing
    this.bot.command('briefing', async (ctx) => {
      const user = await this.authenticate(ctx);
      if (!user) return;
      await this.sendBriefing(user.id, 'morning');
    });

    // Callback queries
    this.bot.on('callback_query', async (ctx) => {
      const user = await this.authenticate(ctx);
      if (!user) return;

      const data = (ctx.callbackQuery as any).data;
      if (!data) return;

      const [action, jobId] = data.split(':');
      if (action === 'approve') {
        try {
          await executeVortiqSkill({
            intent: 'approve_job',
            parameters: { jobId },
            organisationId: user.organisationId,
            userId: user.id
          });
          await ctx.answerCbQuery('Job Approved! 🎉');
          await ctx.editMessageText(`✅ Job ${jobId.substring(0, 8)} approved and scheduled for execution by ${user.name}.`);
        } catch (e: any) {
          await ctx.answerCbQuery(`Error: ${e.message}`);
        }
      } else if (action === 'reject') {
        try {
          await executeVortiqSkill({
            intent: 'reject_job',
            parameters: { jobId, reason: 'Rejected via Telegram' },
            organisationId: user.organisationId,
            userId: user.id
          });
          await ctx.answerCbQuery('Job Rejected. ❌');
          await ctx.editMessageText(`❌ Job ${jobId.substring(0, 8)} was rejected by ${user.name}.`);
        } catch (e: any) {
          await ctx.answerCbQuery(`Error: ${e.message}`);
        }
      }
    });

    // Normal Text parsing via NLP Intent Routing
    this.bot.on('text', async (ctx) => {
      const user = await this.authenticate(ctx);
      if (!user) return;

      const text = ctx.message.text;
      const intent = this.classifyIntent(text);

      if (!intent) {
        return ctx.reply("I couldn't understand that command. Try saying 'Show my tasks', 'Revenue this month', or '/status'.");
      }

      ctx.reply(`Processing command via Vortiq Agent... ⚡`);

      try {
        const result = await executeVortiqSkill({
          intent,
          parameters: { rawQuery: text, telegramUserId: String(ctx.from.id) },
          organisationId: user.organisationId,
          userId: user.id
        });

        // Format and reply based on intent
        let reply = '';
        if (intent === 'query_metrics') {
          reply = `📊 *Vortiq Business Scorecard* (${formatDate(new Date())})\n\n` +
                  `👥 Contacts (CRM): *${result.contactsCount}*\n` +
                  `🤝 Active Deals: *${result.dealsCount}*\n` +
                  `✅ Open Tasks: *${result.tasksCount}*\n` +
                  `⚡ AI Business Efficiency: *${result.efficiencyScore.toFixed(1)}/100*`;
        } else if (intent === 'query_finance') {
          reply = `💰 *Financial Summary*\n\n` +
                  `Outstanding Invoices: *${result.invoiceCount}*\n` +
                  `Total Accounts Receivable: *${formatINR(result.totalUnpaid)}*\n\n` +
                  `📅 Pending Tax Filings:\n` +
                  (result.pendingTaxes.length 
                    ? result.pendingTaxes.map((t: any) => `• ${t.taxType} (${t.period}) - Due: ${formatDate(t.dueDate)}`).join('\n')
                    : '• No pending GST/TDS returns due! 🎉');
        } else if (intent === 'query_tasks') {
          reply = `📅 *Your Active Tasks:*\n\n` +
                  (result.tasks.length
                    ? result.tasks.map((t: any) => `[ ] ${t.title} ${t.dueDate ? `(Due ${formatDate(t.dueDate)})` : ''}`).join('\n')
                    : '🎉 All caught up! No active tasks.');
        } else if (intent === 'query_leads') {
          reply = `👥 *Top CRM Leads:*\n\n` +
                  (result.leads.length
                    ? result.leads.map((l: any) => `• *${l.firstName} ${l.lastName}* - score: ${l.leadScore}/100 - ${l.phone}`).join('\n')
                    : 'No leads found.');
        } else if (intent === 'list_approvals') {
          if (!result.pendingJobs.length) {
            return ctx.reply('No pending agent actions requiring approval. 🙌');
          }
          for (const job of result.pendingJobs) {
            await ctx.reply(
              `🤖 *Agent: ${job.agentType}*\n` +
              `Description: ${job.description}\n` +
              `Status: Awaiting Human approval`,
              Markup.inlineKeyboard([
                Markup.button.callback('👍 Approve', `approve:${job.id}`),
                Markup.button.callback('👎 Reject', `reject:${job.id}`)
              ])
            );
          }
          return;
        } else if (intent === 'query_inventory') {
          reply = `📦 *Low Stock Alert:*\n\n` +
                  (result.lowStock.length
                    ? result.lowStock.map((i: any) => `• ${i.name} (SKU: ${i.sku}) - Qty: ${i.quantity} (Reorder point: ${i.reorderPoint})`).join('\n')
                    : '• All stock levels healthy! ✅');
        } else if (intent === 'query_employees') {
          reply = `👥 *Employee Attendance Absentees Today:*\n\n` +
                  (result.absentees.length
                    ? result.absentees.map((e: any) => `• ${e.name} (${e.role})`).join('\n')
                    : '• Everyone present! 🤝');
        } else if (intent === 'get_forecast') {
          reply = `📈 *Sales Target & AI Forecasts:*\n\n` +
                  (result.targets.length
                    ? result.targets.map((t: any) => 
                        `• Target: *${formatINR(t.targetAmount)}*\n` +
                        `  Achieved: ${formatINR(t.achievedAmount)} (${Math.round((t.achievedAmount / t.targetAmount) * 100)}%)\n` +
                        `  AI Forecast: ${formatINR(t.forecastAmount)} (${Math.round(t.successProbability * 100)}% probability)\n` +
                        `  Status: *${t.status}*\n` +
                        `  AI Insight: _${t.aiInsight || 'No insight yet'}_`
                      ).join('\n\n')
                    : 'No sales targets configured.');
        } else {
          reply = `Command processed successfully. Result:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
        }

        ctx.reply(reply, { parse_mode: 'Markdown' });
      } catch (err: any) {
        ctx.reply(`❌ Operation failed: ${err.message}`);
      }
    });
  }

  private async authenticate(ctx: Context): Promise<any> {
    const tgId = String(ctx.from?.id);
    const session = await prisma.telegramSession.findUnique({
      where: { telegramUserId: tgId },
      include: { user: { include: { organisation: true } } }
    });

    if (!session || !session.isActive) {
      ctx.reply("❌ Your Telegram account is not paired with a Vortiq user. Please use /start to receive a pairing code.");
      return null;
    }
    return session.user;
  }

  private classifyIntent(text: string): string | null {
    const t = text.toLowerCase();
    if (t.includes('metric') || t.includes('score') || t.includes('dashboard')) return 'query_metrics';
    if (t.includes('lead') || t.includes('contact') || t.includes('outreach')) return 'query_leads';
    if (t.includes('deal') || t.includes('opportunity')) return 'query_deals';
    if (t.includes('task') || t.includes('todo')) return 'query_tasks';
    if (t.includes('revenue') || t.includes('finance') || t.includes('invoice') || t.includes('money') || t.includes('gst')) return 'query_finance';
    if (t.includes('stock') || t.includes('inventory') || t.includes('warehouse')) return 'query_inventory';
    if (t.includes('absent') || t.includes('attendance') || t.includes('employee')) return 'query_employees';
    if (t.includes('target') || t.includes('forecast') || t.includes('projection')) return 'get_forecast';
    if (t.includes('approval') || t.includes('pending')) return 'list_approvals';
    return null;
  }

  public async sendBriefing(userId: string, type: 'morning' | 'evening'): Promise<void> {
    const session = await prisma.telegramSession.findFirst({
      where: { userId, isActive: true }
    });
    if (!session || !this.bot) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organisation: true }
    });
    if (!user) return;

    // Mock briefing generator logic
    let content = '';
    if (type === 'morning') {
      content = `🌅 *Good Morning ${user.name}!*\n` +
                `Here is your morning briefing for *${user.organisation.name}*:\n\n` +
                `📈 Daily Target Status: *ON_TRACK*\n` +
                `👥 Team Attendance: 98% present\n` +
                `📦 Low stock warnings: None\n` +
                `💼 Pending Approvals: 2 actions\n\n` +
                `Have a productive day! 🚀`;
    } else {
      content = `🌌 *Evening Summary ${user.name}!*\n` +
                `Here is what was accomplished today:\n\n` +
                `✅ Tasks Completed: 12\n` +
                `📞 Calls Made: 48\n` +
                `🤝 Deals Won: 3 (Totaling ${formatINR(450000)})\n` +
                `💰 Payments Collected: ${formatINR(120000)}`;
    }

    await this.bot.telegram.sendMessage(session.telegramUserId, content, { parse_mode: 'Markdown' });
  }

  public async notifyApproval(job: any, userId: string): Promise<void> {
    const session = await prisma.telegramSession.findFirst({
      where: { userId, isActive: true }
    });
    if (!session || !this.bot) return;

    await this.bot.telegram.sendMessage(
      session.telegramUserId,
      `🤖 *Agent: ${job.agentType}* has drafted an action:\n\n` +
      `*Action:* ${job.description}\n\n` +
      `Please review and approve this action.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('👍 Approve', `approve:${job.id}`),
          Markup.button.callback('👎 Reject', `reject:${job.id}`)
        ])
      }
    );
  }

  public async broadcastToOrg(orgId: string, message: string): Promise<void> {
    if (!this.bot) return;
    const sessions = await prisma.telegramSession.findMany({
      where: { organisationId: orgId, isActive: true }
    });

    for (const session of sessions) {
      await this.bot.telegram.sendMessage(session.telegramUserId, message, { parse_mode: 'Markdown' }).catch(err => {
        console.error(`Failed to broadcast message to user ${session.userId}:`, err);
      });
    }
  }

  public async sendChart(userId: string, chartData: any, title: string): Promise<void> {
    const session = await prisma.telegramSession.findFirst({
      where: { userId, isActive: true }
    });
    if (!session || !this.bot) return;

    // Send text placeholder for chart in mockup context
    await this.bot.telegram.sendMessage(
      session.telegramUserId,
      `📊 *${title}*\n` +
      `[Chart Visualisation]\n` +
      `Data: ${JSON.stringify(chartData)}`,
      { parse_mode: 'Markdown' }
    );
  }

  public async sendDocument(userId: string, buffer: Buffer, filename: string): Promise<void> {
    const session = await prisma.telegramSession.findFirst({
      where: { userId, isActive: true }
    });
    if (!session || !this.bot) return;

    await this.bot.telegram.sendDocument(session.telegramUserId, {
      source: buffer,
      filename: filename
    }, {
      caption: `📁 Document: ${filename}`
    });
  }
}
export const telegramBotService = TelegramBotService.getInstance();
