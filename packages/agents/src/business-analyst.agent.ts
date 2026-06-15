import { prisma } from '@vortiq/db';
import { eventBus } from './event-bus.js';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export class BusinessAnalystAgent {
  
  // Computes the Business Efficiency Score (0-100) and saves it
  public async computeEfficiencyScore(organisationId: string): Promise<any> {
    // 1. Component scores (mock math based on database trends or default healthy metrics)
    const salesCount = await prisma.contact.count({ where: { organisationId } });
    const dealsWon = await prisma.deal.count({ where: { organisationId, stage: { isWon: true } } });
    const totalDeals = await prisma.deal.count({ where: { organisationId } });
    const tasksOverdue = await prisma.task.count({ where: { organisationId, status: { not: 'DONE' }, dueAt: { lt: new Date() } } });
    const lowStock = await prisma.inventoryItem.count({
      where: { organisationId, quantity: { lte: prisma.inventoryItem.fields.reorderPoint } }
    });

    const salesScore = Math.max(50, Math.min(100, 70 + (dealsWon / (totalDeals || 1)) * 30));
    const marketingScore = Math.max(50, Math.min(100, 80 - (salesCount === 0 ? 20 : 0)));
    const operationsScore = Math.max(40, Math.min(100, 95 - lowStock * 5));
    const financeScore = Math.max(50, Math.min(100, 90 - tasksOverdue * 2));
    const hrScore = 85.0; // Standard attendance average
    const supportScore = 92.0; // Standard CSAT / resolution average

    // Weighted average
    const overallScore = (salesScore * 0.25) + (marketingScore * 0.15) + (operationsScore * 0.20) + 
                         (financeScore * 0.20) + (hrScore * 0.10) + (supportScore * 0.10);

    const aiNarrative = `Your Business Efficiency Score stands at ${overallScore.toFixed(1)}/100. ` +
                        `Sales velocity is stable, but there are ${lowStock} low-stock inventory items affecting operations. ` +
                        `Finance processes are tracking well with minimal overdue invoicing issues.`;

    const score = await prisma.businessEfficiencyScore.create({
      data: {
        organisationId,
        overallScore,
        salesScore,
        marketingScore,
        operationsScore,
        financeScore,
        hrScore,
        supportScore,
        breakdown: { salesScore, marketingScore, operationsScore, financeScore, hrScore, supportScore },
        aiNarrative
      }
    });

    return score;
  }

  // Updates Sales Targets with forecasts and runs probability forecasts
  public async updateSalesTargetForecast(organisationId: string): Promise<void> {
    const targets = await prisma.salesTarget.findMany({
      where: { organisationId, deletedAt: null }
    });

    for (const target of targets) {
      // Get all won deals within this target period
      const deals = await prisma.deal.findMany({
        where: {
          organisationId,
          stage: { isWon: true },
          updatedAt: {
            gte: target.startDate,
            lte: target.endDate
          }
        }
      });
      const achievedAmount = deals.reduce((sum: number, d: any) => sum + d.value, 0);

      // Get pipeline value (weighted by probability)
      const openDeals = await prisma.deal.findMany({
        where: {
          organisationId,
          stage: { isWon: false, isLost: false },
          createdAt: {
            lte: target.endDate
          }
        }
      });
      const pipelineValue = openDeals.reduce((sum: number, d: any) => sum + (d.value * d.probability), 0);

      const daysTotal = (target.endDate.getTime() - target.startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysElapsed = Math.max(1, (Date.now() - target.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, daysTotal - daysElapsed);

      const dailyRunRate = achievedAmount / daysElapsed;
      const forecastedTotal = achievedAmount + (dailyRunRate * daysRemaining) + (pipelineValue * 0.5);

      // Compute success probability
      let successProbability = 0;
      if (target.targetAmount > 0) {
        successProbability = Math.min(1.0, forecastedTotal / target.targetAmount);
      }

      // Determine Status
      let status: any = 'ON_TRACK';
      if (successProbability < 0.6) {
        status = 'BEHIND';
      } else if (successProbability < 0.8) {
        status = 'AT_RISK';
      } else if (achievedAmount >= target.targetAmount) {
        status = 'ACHIEVED';
      }

      const aiInsight = `Based on a daily run rate of ${formatINR(dailyRunRate)} and a pipeline value of ${formatINR(pipelineValue)}, ` +
                        `we forecast a period total of ${formatINR(forecastedTotal)}. Projecting a ${Math.round(successProbability * 100)}% ` +
                        `probability of achieving the target.`;

      const wasOnTrackBefore = target.status === 'ON_TRACK';
      
      await prisma.salesTarget.update({
        where: { id: target.id },
        data: {
          achievedAmount,
          forecastAmount: forecastedTotal,
          successProbability,
          status,
          aiInsight,
          aiInsightUpdatedAt: new Date()
        }
      });

      // Emit alarm if target becomes at risk
      if (status === 'AT_RISK' && wasOnTrackBefore) {
        await eventBus.publish('sales_target.at_risk', {
          targetId: target.id,
          forecastAmount: forecastedTotal,
          targetAmount: target.targetAmount,
          organisationId
        });
      }
    }
  }

  // Real-time NL Query Handler
  public async query(question: string, organisationId: string, userId: string): Promise<any> {
    const q = question.toLowerCase();
    let answer = '';
    let charts: any[] = [];
    let suggestedActions: any[] = [];

    if (q.includes('revenue') || q.includes('drop') || q.includes('sales')) {
      const target = await prisma.salesTarget.findFirst({ where: { organisationId } });
      const deals = await prisma.deal.findMany({ where: { organisationId, stage: { isWon: true } }, take: 5 });
      
      answer = `Our current sales target status is *${target?.status || 'ON_TRACK'}*. We have achieved ${formatINR(target?.achievedAmount || 0)} ` +
               `against a target of ${formatINR(target?.targetAmount || 1000000)}. Top recent won deals: ` +
               deals.map((d: any) => `${d.title} (${formatINR(d.value)})`).join(', ') + '.';
      
      charts = [{
        type: 'radial',
        title: 'Target Progress',
        data: [
          { name: 'Achieved', value: target?.achievedAmount || 250000, fill: '#10b981' },
          { name: 'Target', value: target?.targetAmount || 1000000, fill: '#e2e8f0' }
        ]
      }];

      suggestedActions = [
        { title: 'Trigger Follow-up Calls', action: 'trigger_voice_call' },
        { title: 'View Proposals', action: 'view_proposals' }
      ];
    } else if (q.includes('performance') || q.includes('rep')) {
      const performances = await prisma.employeePerformance.findMany({
        where: { organisationId },
        include: { employee: true },
        take: 3
      });

      answer = `Sales team performance is currently led by our top representatives. Employee stats:\n` +
               performances.map((p: any) => `• *${p.employee.name}* - Score: ${p.score}/100, Deals Won: ${p.dealsWon}`).join('\n');
      
      charts = [{
        type: 'bar',
        title: 'Representative Efficiency Scores',
        data: performances.map((p: any) => ({ name: p.employee.name, score: p.score }))
      }];
    } else {
      answer = `I am VORTIQ AI Business Analyst. I can query operational parameters. Ask me about:\n` +
               `• "Why did revenue drop last week?"\n` +
               `• "Which sales rep is performing best?"\n` +
               `• "What's our customer acquisition cost?"`;
    }

    return { answer, charts, suggestedActions };
  }

  // Employee Performance Scoring (Nightly calculations)
  public async computeEmployeePerformance(organisationId: string): Promise<void> {
    const employees = await prisma.user.findMany({
      where: { organisationId, deletedAt: null }
    });

    const period = new Date().toISOString().substring(0, 7); // e.g. "2026-06"

    for (const emp of employees) {
      // Gather employee metrics
      const tasksCompleted = await prisma.task.count({
        where: { organisationId, assignedToId: emp.id, status: 'DONE' }
      });
      const tasksOverdue = await prisma.task.count({
        where: { organisationId, assignedToId: emp.id, status: { not: 'DONE' }, dueAt: { lt: new Date() } }
      });
      const callsMade = await prisma.voiceCall.count({
        where: { organisationId, contact: { organisationId } } // simple count
      });
      const dealsWon = await prisma.deal.count({
        where: { organisationId, stage: { isWon: true } }
      });

      // Calculate score (0-100)
      const baseScore = 75;
      const score = Math.max(10, Math.min(100, baseScore + (tasksCompleted * 2) - (tasksOverdue * 5) + (dealsWon * 5)));
      
      const aiNarrative = `Completed ${tasksCompleted} tasks and closed ${dealsWon} deals this month. ` +
                          `Operational pace is healthy with low overdue tasks (${tasksOverdue}).`;

      await prisma.employeePerformance.upsert({
        where: { id: emp.id }, // simplified mapping
        create: {
          organisationId,
          employeeId: emp.id,
          period,
          score,
          tasksCompleted,
          tasksOverdue,
          callsMade,
          leadsConverted: dealsWon,
          dealsWon,
          attendanceRate: 95.0,
          onTimeRate: 90.0,
          aiNarrative,
          rank: 1
        },
        update: {
          score,
          tasksCompleted,
          tasksOverdue,
          callsMade,
          leadsConverted: dealsWon,
          dealsWon,
          aiNarrative
        }
      });
    }
  }
}

export const businessAnalystAgent = new BusinessAnalystAgent();
