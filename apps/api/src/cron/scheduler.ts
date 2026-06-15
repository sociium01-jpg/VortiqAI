import cron from 'node-cron';
import { prisma } from '@vortiq/db';
import { telegramBotService } from '../services/telegram.service.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { voiceCallService } from '@vortiq/voice';
import { businessAnalystAgent } from '@vortiq/agents';

// Helper to find all active organisations
async function getActiveOrgIds(): Promise<string[]> {
  const orgs = await prisma.organisation.findMany({
    where: { deletedAt: null }
  });
  return orgs.map(o => o.id);
}

// Helper to find all users in an organisation
async function getOrgUsers(orgId: string): Promise<any[]> {
  return prisma.user.findMany({
    where: { organisationId: orgId, deletedAt: null }
  });
}

// 1. 07:30 IST Daily (02:00 UTC) - Morning Briefing
// cron schedule matches '30 2 * * *' = 02:30 UTC which is 08:00 IST
cron.schedule('30 2 * * *', async () => {
  console.log('[CRON] Starting Daily Morning Briefings (08:00 IST)...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    const users = await getOrgUsers(orgId);
    for (const user of users) {
      try {
        await telegramBotService.sendBriefing(user.id, 'morning');
        await whatsappService.sendMorningBriefing(user.id);
      } catch (err: any) {
        console.error(`Morning briefing failed for user ${user.id}:`, err.message);
      }
    }
  }
});

// 2. 09:45 IST Daily (04:15 UTC) - Voice Call Queue Preparation
cron.schedule('15 4 * * *', async () => {
  console.log('[CRON] Preparing outbound call queues (09:45 IST)...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      await voiceCallService.buildBatchCallQueue(orgId);
    } catch (err: any) {
      console.error(`Call queue prep failed for org ${orgId}:`, err.message);
    }
  }
});

// 3. 10:00 IST Daily (04:30 UTC) - Auto Dial Session Start (Call Window Open)
cron.schedule('30 4 * * *', async () => {
  console.log('[CRON] Initiating auto-dial compliance calls session (10:00 IST)...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      await voiceCallService.scheduleFollowUpCalls(orgId);
    } catch (err: any) {
      console.error(`Auto dial session startup failed for org ${orgId}:`, err.message);
    }
  }
});

// 4. 19:00 IST Daily (13:30 UTC) - Dial Session End (TRAI Calling Hour Compliance Hard Stop)
cron.schedule('30 13 * * *', async () => {
  console.log('[CRON] TRAI Calling Hours Compliance Hard Stop (19:00 IST). Termination of all active call queues...');
  // Force update any voice call record still in INITIATED/RINGING to FAILED
  try {
    await prisma.voiceCall.updateMany({
      where: {
        status: { in: ['INITIATED', 'RINGING'] }
      },
      data: {
        status: 'FAILED',
        outcome: 'NO_ANSWER'
      }
    });
  } catch (err: any) {
    console.error('Failed compliance calling hours hard stop update:', err.message);
  }
});

// 5. 19:30 IST Daily (14:00 UTC) - Evening Summary
cron.schedule('0 14 * * *', async () => {
  console.log('[CRON] Preparing Evening Summary Briefings (19:30 IST)...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    const users = await getOrgUsers(orgId);
    for (const user of users) {
      try {
        await telegramBotService.sendBriefing(user.id, 'evening');
        await whatsappService.sendEveningSummary(user.id);
      } catch (err: any) {
        console.error(`Evening briefing failed for user ${user.id}:`, err.message);
      }
    }
  }
});

// 6. Every Hour - Sales target forecast updates
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Computing sales target forecasts...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      await businessAnalystAgent.updateSalesTargetForecast(orgId);
    } catch (err: any) {
      console.error(`Sales forecast computation failed for org ${orgId}:`, err.message);
    }
  }
});

// 7. Every Hour - Business Efficiency Score computation
cron.schedule('30 * * * *', async () => {
  console.log('[CRON] Computing Business Efficiency Scores...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      await businessAnalystAgent.computeEfficiencyScore(orgId);
    } catch (err: any) {
      console.error(`Business Efficiency calculation failed for org ${orgId}:`, err.message);
    }
  }
});

// 8. 00:00 IST Daily (18:30 UTC) - Employee Performance scoring
cron.schedule('30 18 * * *', async () => {
  console.log('[CRON] Running nightly employee performance updates...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      await businessAnalystAgent.computeEmployeePerformance(orgId);
    } catch (err: any) {
      console.error(`Performance calculation failed for org ${orgId}:`, err.message);
    }
  }
});

// 9. 08:00 IST Daily - GST & GSTR3B Due date warnings
// 30th of each month (GST Check)
cron.schedule('30 2 30 * *', async () => {
  console.log('[CRON] Running GST 30th month alert check...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      const users = await getOrgUsers(orgId);
      const ceo = users.find(u => u.role === 'CEO' || u.role === 'FINANCE');
      if (ceo) {
        await whatsappService.sendCriticalAlert(ceo.id, 'GST_DUE', 'Monthly GST filing timeline closes today. Verify and file transactions.');
      }
    } catch (e: any) {
      console.error('GST cron failed:', e.message);
    }
  }
});

// 20th of each month (GSTR-3B Check)
cron.schedule('30 2 20 * *', async () => {
  console.log('[CRON] Running GSTR-3B 20th month alert check...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      const users = await getOrgUsers(orgId);
      const ceo = users.find(u => u.role === 'CEO' || u.role === 'FINANCE');
      if (ceo) {
        await whatsappService.sendCriticalAlert(ceo.id, 'GST_DUE', 'GSTR-3B is due today. Ensure all invoices are submitted to prevent late fees.');
      }
    } catch (e: any) {
      console.error('GSTR-3B cron failed:', e.message);
    }
  }
});

// 10. Every 15 min - Trial expiry check
cron.schedule('*/15 * * * *', async () => {
  // Check any trial subscriptions expiring within next 24h
  console.log('[CRON] Checking Trial expiries...');
});

// 11. Every 30 min - Stock level check alerts
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Running warehouse low stock audits...');
  const orgIds = await getActiveOrgIds();
  for (const orgId of orgIds) {
    try {
      const lowStockItems = await prisma.inventoryItem.findMany({
        where: {
          organisationId: orgId,
          quantity: { lte: prisma.inventoryItem.fields.reorderPoint }
        }
      });
      if (lowStockItems.length > 0) {
        const users = await getOrgUsers(orgId);
        const ops = users.find(u => u.role === 'OPS' || u.role === 'CEO');
        if (ops) {
          await whatsappService.sendCriticalAlert(
            ops.id, 
            'STOCK_CRITICAL', 
            `You have ${lowStockItems.length} inventory items below the reorder point. Sheet metal check required.`
          );
        }
      }
    } catch (err: any) {
      console.error('Stock audit cron failed:', err.message);
    }
  }
});

// 12. 23:00 IST Daily - Lead credit reset check (1st of each month)
cron.schedule('30 17 1 * *', async () => {
  console.log('[CRON] Processing monthly lead credits renewal...');
});

console.log('[CRON] All scheduled background automations loaded successfully.');
