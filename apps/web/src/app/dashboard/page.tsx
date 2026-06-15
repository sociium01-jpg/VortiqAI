'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  DollarSign, Users, CheckSquare, Brain, Target, ShieldAlert, 
  Send, UserCheck, Flame, Layers, Play, Check, X, AlertTriangle, 
  Package, Calendar, Plus, Sparkles, HelpCircle, ArrowRight, TrendingUp, Filter, Settings, RefreshCw, MessageSquare,
  LayoutDashboard, ShieldCheck, Clock, Cpu
} from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';
import dynamic from 'next/dynamic';
const SuperbossPanel = dynamic(() => import('../components/ai/SuperbossPanel'), { ssr: false });


function DashboardContent() {
  const { user, isLoaded } = useUser();
  const [isDemo, setIsDemo] = useState(false);

  // simulated metrics
  const [metrics, setMetrics] = useState({
    healthScore: 88,
    revenue: 1245000,
    targetAmount: 1500000,
    leadsToday: 42,
    tasksCompleted: 14,
    activeAgents: 8,
    efficiencyScore: 91.5,
    openTickets: 3,
    activeCampaigns: 4,
    briefingsSent: 8,
    receivables: 450000,
    payoutsDone: 180000,
    attendancePresent: 12,
    attendanceTotal: 15,
    adClicks: 1420
  });

  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [formRevenue, setFormRevenue] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formLeads, setFormLeads] = useState('');
  const [formReceivables, setFormReceivables] = useState('');
  const [formPayouts, setFormPayouts] = useState('');
  const [formStaffPresent, setFormStaffPresent] = useState('');
  const [formStaffTotal, setFormStaffTotal] = useState('');
  const [formAdClicks, setFormAdClicks] = useState('');
  const [formTickets, setFormTickets] = useState('');

  // Sync form inputs when metrics are updated
  useEffect(() => {
    setFormRevenue(metrics.revenue.toString());
    setFormTarget(metrics.targetAmount.toString());
    setFormLeads(metrics.leadsToday.toString());
    setFormReceivables(metrics.receivables.toString());
    setFormPayouts(metrics.payoutsDone.toString());
    setFormStaffPresent((metrics.attendancePresent || 0).toString());
    setFormStaffTotal((metrics.attendanceTotal || 0).toString());
    setFormAdClicks((metrics.adClicks || 0).toString());
    setFormTickets(metrics.openTickets.toString());
  }, [metrics]);

  const handleTelemetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...metrics,
      revenue: Number(formRevenue) || 0,
      targetAmount: Number(formTarget) || 0,
      leadsToday: Number(formLeads) || 0,
      receivables: Number(formReceivables) || 0,
      payoutsDone: Number(formPayouts) || 0,
      attendancePresent: Number(formStaffPresent) || 0,
      attendanceTotal: Number(formStaffTotal) || 0,
      adClicks: Number(formAdClicks) || 0,
      openTickets: Number(formTickets) || 0
    };
    setMetrics(updated);
    localStorage.setItem('vortiq-user-metrics', JSON.stringify(updated));
    alert('Telemetry metrics updated successfully!');
  };

  const [loadingDb, setLoadingDb] = useState(false);

  const refreshProductionData = () => {
    if (isDemo) return;
    setLoadingDb(true);
    
    // Fetch metrics
    vortiqClient.callQuery('ai.computeBusinessMetrics')
      .then(dbMetrics => {
        if (dbMetrics) {
          setMetrics(dbMetrics as any);
          
          // Generate a dynamic dashboard summary text based on real metrics
          let insight = `Superboss Command AI: Workspace telemetry audit complete. Health score is stable at ${dbMetrics.healthScore}%. `;
          if (dbMetrics.lowStockAlerts > 0) {
            insight += `OpsAgent flags ${dbMetrics.lowStockAlerts} low stock items requiring restock PO. `;
          }
          if (dbMetrics.finance.overdueInvoices > 0) {
            insight += `FinanceAgent notes ${dbMetrics.finance.overdueInvoices} overdue invoices. `;
          }
          if (dbMetrics.support.supportTicketVolume > 0) {
            insight += `SupportAgent reports ${dbMetrics.support.supportTicketVolume} open tickets. `;
          }
          if (dbMetrics.delayedTasks > 0) {
            insight += `TasksAgent notes ${dbMetrics.delayedTasks} delayed tasks. `;
          }
          if (insight === `Superboss Command AI: Workspace telemetry audit complete. Health score is stable at ${dbMetrics.healthScore}%. `) {
            insight += "All systems operating normally. Database ledger in sync.";
          }
          setAiInsightText(insight);
        }
      })
      .catch(e => console.error('Error fetching business metrics:', e));

    // Fetch recommendations
    vortiqClient.callQuery('ai.getAIRecommendations')
      .then(recs => {
        if (recs) {
          setAiRecommendations(recs as any);

          // Build dynamic internal logs matching recommendations
          const logs: any[] = [];
          recs.forEach((rec: any, idx: number) => {
            logs.push({
              time: `${idx * 5 + 2}m ago`,
              source: rec.agent.replace(' ', ''),
              dest: 'SuperbossAgent',
              msg: `Detected ${rec.type.toLowerCase()} event. Sent to approval queue: "${rec.message}"`
            });
          });

          // Add baseline logs
          logs.push(
            { time: 'Just now', source: 'LeadEngineAgent', dest: 'SalesAgent', msg: 'Lead scoring heuristics active. CRM leads synchronized.' },
            { time: '10m ago', source: 'FinanceAgent', dest: 'SuperbossAgent', msg: 'Checked journal entries. Double-entry ledger is in balance.' },
            { time: '30m ago', source: 'OpsAgent', dest: 'SuperbossAgent', msg: 'Running inventory reorder scans. Stock counts active.' }
          );

          setAgentLogs(logs);
        }
      })
      .catch(e => console.error('Error fetching recommendations:', e))
      .finally(() => {
        setLoadingDb(false);
      });
  };

  useEffect(() => {
    let handleMetricsChange: () => void;
    if (typeof window !== 'undefined') {
      const clerkDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';
      const localDemo = localStorage.getItem('vortiq-demo-logged-in') === 'true';
      const resolvedDemo = clerkDemo || localDemo;
      setIsDemo(resolvedDemo);

      if (isLoaded && !resolvedDemo) {
        // Load initial data from production DB
        refreshProductionData();
      }

      handleMetricsChange = () => {
        if (!resolvedDemo) {
          refreshProductionData();
        }
      };
      window.addEventListener('vortiq-user-metrics-change', handleMetricsChange);
    }

    return () => {
      if (typeof window !== 'undefined' && handleMetricsChange) {
        window.removeEventListener('vortiq-user-metrics-change', handleMetricsChange);
      }
    };
  }, [isLoaded, user, isDemo]);

  // Hook for vortiq-data-change reload
  useEffect(() => {
    if (isDemo) return;
    const handleDataChange = () => {
      refreshProductionData();
    };
    window.addEventListener('vortiq-data-change', handleDataChange);
    return () => {
      window.removeEventListener('vortiq-data-change', handleDataChange);
    };
  }, [isDemo]);

  const searchParams = useSearchParams();
  const demoMode = searchParams.get('demo') || 'saas';

  // Global filters
  const [dateRange, setDateRange] = useState('MTD');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [aiMode, setAiMode] = useState<'manual' | 'ai-assisted'>('ai-assisted');

  // Load and sync AI mode
  useEffect(() => {
    const stored = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
    if (stored) setAiMode(stored);

    const handleStorage = () => {
      const current = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
      if (current) setAiMode(current);
    };
    window.addEventListener('vortiq-ai-mode-change', handleStorage);
    return () => window.removeEventListener('vortiq-ai-mode-change', handleStorage);
  }, []);

  // Adjust metrics based on persona
  useEffect(() => {
    if (!isDemo) return; // Only adjust if in demo mode!
    if (demoMode === 'manufacturing') {
      setMetrics({
        healthScore: 86,
        revenue: 2840000,
        targetAmount: 3500000,
        leadsToday: 18,
        tasksCompleted: 9,
        activeAgents: 9,
        efficiencyScore: 88.2,
        openTickets: 5,
        activeCampaigns: 2,
        briefingsSent: 12,
        receivables: 1250000,
        payoutsDone: 620000,
        attendancePresent: 14,
        attendanceTotal: 16,
        adClicks: 840
      });
    } else if (demoMode === 'd2c') {
      setMetrics({
        healthScore: 94,
        revenue: 4120000,
        targetAmount: 5000000,
        leadsToday: 450,
        tasksCompleted: 38,
        activeAgents: 11,
        efficiencyScore: 94.8,
        openTickets: 12,
        activeCampaigns: 8,
        briefingsSent: 24,
        receivables: 150000,
        payoutsDone: 950000,
        attendancePresent: 18,
        attendanceTotal: 20,
        adClicks: 8430
      });
    } else {
      setMetrics({
        healthScore: 91,
        revenue: 1245000,
        targetAmount: 1500000,
        leadsToday: 42,
        tasksCompleted: 14,
        activeAgents: 8,
        efficiencyScore: 91.5,
        openTickets: 3,
        activeCampaigns: 4,
        briefingsSent: 8,
        receivables: 450000,
        payoutsDone: 180000,
        attendancePresent: 12,
        attendanceTotal: 15,
        adClicks: 1420
      });
    }
  }, [demoMode, isDemo]);

  // AI Consolidated Business Analyst insights state
  const [aiInsightText, setAiInsightText] = useState('');
  const [generatingInsight, setGeneratingInsight] = useState(false);

  // Superboss AI Agent Recommendation Queue
  const [aiRecommendations, setAiRecommendations] = useState([
    { id: 'rec-01', agent: 'Ops Agent', type: 'INVENTORY', message: 'Draft purchase order PO-902 for Jindal Steel (Rs 3,50,000) to restock steel sheets (below reorder trigger).', details: 'Steel sheet stock is 80 units (Min threshold: 100). Vendor lead time: 7 days.' },
    { id: 'rec-02', agent: 'Finance Agent', type: 'PAYMENTS', message: 'Send WhatsApp payment reminders & GSTR draft check to Tata Motors for overdue invoice INV-101 (Rs 4,50,000).', details: 'Invoice was due 5 days ago. Client has high health rating.' },
    { id: 'rec-03', agent: 'Support Agent', type: 'TICKETS', message: 'Escalate support ticket #TC-902 to manager as SLA limit is under 2 hours.', details: 'Assigned agent Rahul has high workload (8 tasks).' }
  ]);

  // Agent-to-agent internal communications feed
  const [agentLogs, setAgentLogs] = useState([
    { time: 'Just now', source: 'LeadEngineAgent', dest: 'SalesAgent', msg: 'Lead priya@tata.com scored 88 (HOT). Assigned follow-up tasks to Rahul.' },
    { time: '5m ago', source: 'FinanceAgent', dest: 'SuperbossAgent', msg: 'Detected invoice INV-101 overdue by 5 days. Sent to approval queue.' },
    { time: '10m ago', source: 'OpsAgent', dest: 'SuperbossAgent', msg: 'Stock SKU-STEEL-V4 below safety reorder. Drafted purchase order PO-902.' },
    { time: '1h ago', source: 'SupportAgent', dest: 'SuperbossAgent', msg: 'Ticket #TC-902 SLA limit risk detected. Drafted manager notice.' }
  ]);

  const generateAIInsight = () => {
    setGeneratingInsight(true);
    setTimeout(() => {
      if (demoMode === 'manufacturing') {
        setAiInsightText(
          "Superboss Command AI: Manufacturing health remains stable at 86/100. OpsAgent flags reorder triggers on steel stock. FinanceAgent queued draft PO-902 (Rs 3.5L) for steel restock. VoiceAgent reports outgoing compliance checks active."
        );
      } else if (demoMode === 'd2c') {
        setAiInsightText(
          "Superboss Command AI: D2C health is strong at 94/100. Sales velocity: Rs 4.12M. MarketingAgent reports 12% CPL reduction. SupportAgent reports refund query logs. Suggested FAQ template updates have been saved to local memory."
        );
      } else {
        setAiInsightText(
          "Superboss Command AI: Operations are active at 91/100. FinanceAgent flagged a potential duplicate invoice drafted for Reliance Retail (Rs 12L) which was blocked. LeadEngineAgent scored 5 B2B targets above 85 fit."
        );
      }
      setGeneratingInsight(false);
    }, 600);
  };

  useEffect(() => {
    if (isDemo) {
      generateAIInsight();
    }
  }, [demoMode, aiMode, isDemo]);

  const handleApproveRec = (id: string) => {
    if (isDemo) {
      setAiRecommendations(prev => prev.filter(r => r.id !== id));
      const rec = aiRecommendations.find(r => r.id === id);
      if (rec) {
        setAgentLogs(prev => [
          { time: 'Just now', source: 'SuperbossAgent', dest: rec.agent.replace(' ', ''), msg: `Approved: ${rec.message} (Action executed)` },
          ...prev
        ]);
      }
      return;
    }

    vortiqClient.callMutation('ai.approveAIAction', { id })
      .then(res => {
        alert(res.message);
        refreshProductionData();
      })
      .catch(err => alert(err.message));
  };

  const handleRejectRec = (id: string) => {
    if (isDemo) {
      setAiRecommendations(prev => prev.filter(r => r.id !== id));
      return;
    }

    vortiqClient.callMutation('ai.rejectAIAction', { id })
      .then(res => {
        alert(res.message);
        refreshProductionData();
      })
      .catch(err => alert(err.message));
  };

  const handleSyncTelemetry = () => {
    if (isDemo) {
      generateAIInsight();
    } else {
      refreshProductionData();
    }
  };

  return (
    <ConsoleLayout>
      
      {/* Global Filters and Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400" /> Business Command Center
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Real-time consolidated telemetry and control panel for all modules.</p>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] text-slate-700 dark:text-slate-300 font-bold"
            >
              <option value="TODAY">Today</option>
              <option value="7D">Last 7 Days</option>
              <option value="MTD">Month-to-Date</option>
              <option value="QTD">Quarter-to-Date</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] text-slate-700 dark:text-slate-300 font-bold"
            >
              <option value="ALL">All Departments</option>
              <option value="SALES">Sales</option>
              <option value="MARKETING">Marketing</option>
              <option value="FINANCE">Finance</option>
              <option value="HR">HR</option>
              <option value="SUPPORT">Support</option>
              <option value="OPS">Operations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dual Mode Alert / Superboss Command Banner */}
      {aiMode === 'manual' ? (
        <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <ShieldAlert className="w-5 h-5 text-slate-500" />
            <h3 className="text-xs font-black uppercase tracking-widest">Manual Mode Active</h3>
          </div>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            AI telemetry and agent-to-agent messaging are suspended. All operational parameters, customer assignments, 
            invoice drafts, and stock adjustments must be processed manually inside their respective modules.
          </p>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-teal-800 dark:text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="w-4.5 h-4.5 text-teal-600 dark:text-teal-500 animate-pulse" />
              Level 2: Superboss Agent (AI Consolidated Command Center)
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSyncTelemetry}
                disabled={generatingInsight || loadingDb}
                className="text-[10px] text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 font-bold"
              >
                <RefreshCw className={`w-3 h-3 ${generatingInsight || loadingDb ? 'animate-spin' : ''}`} /> Sync Telemetry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            {/* Health score circle */}
            <div className="col-span-1 flex items-center justify-center gap-4 bg-white/40 dark:bg-slate-900/30 p-4 rounded-2xl border border-teal-500/10">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" className="dark:stroke-slate-800" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#0d9488" 
                    strokeWidth="8" 
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * metrics.healthScore) / 100}
                    strokeLinecap="round"
                    className="dark:stroke-teal-500"
                  />
                </svg>
                <span className="absolute text-base font-black text-slate-800 dark:text-teal-500">{metrics.healthScore}%</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">Business Health</p>
                <p className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-0.5">
                  {metrics.healthScore > 90 ? 'All Systems Stable' : 'Alerts Active'}
                </p>
              </div>
            </div>

            {/* AI Insights summary */}
            <div className="col-span-1 lg:col-span-3">
              {generatingInsight ? (
                <div className="space-y-2">
                  <div className="h-3 bg-teal-500/10 dark:bg-slate-900 rounded w-full animate-pulse" />
                  <div className="h-3 bg-teal-500/10 dark:bg-slate-900 rounded w-5/6 animate-pulse" />
                </div>
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  {aiInsightText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Month Revenue</p>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{formatINR(metrics.revenue)}</h3>
          </div>
          <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Leads Sourced</p>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{metrics.leadsToday}</h3>
          </div>
          <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Attendance Present</p>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{metrics.attendancePresent} / {metrics.attendanceTotal}</h3>
          </div>
          <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Active Ad Clicks</p>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{metrics.adClicks.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Telemetry Input Panel (Only for non-demo users to input data) */}
      {!isDemo && (
        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsTelemetryOpen(!isTelemetryOpen)}>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-4.5 h-4.5 text-teal-600" />
              Manual Telemetry Data Input (Workspace Setup)
            </h3>
            <span className="text-xs text-teal-600 font-bold hover:underline">
              {isTelemetryOpen ? 'Collapse Panel' : 'Expand Panel'}
            </span>
          </div>

          {isTelemetryOpen && (
            <form onSubmit={handleTelemetrySubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 text-xs animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Monthly Revenue (Rs)</label>
                <input 
                  type="number" 
                  value={formRevenue} 
                  onChange={(e) => setFormRevenue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Target Revenue (Rs)</label>
                <input 
                  type="number" 
                  value={formTarget} 
                  onChange={(e) => setFormTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Leads Today</label>
                <input 
                  type="number" 
                  value={formLeads} 
                  onChange={(e) => setFormLeads(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Receivables (Rs)</label>
                <input 
                  type="number" 
                  value={formReceivables} 
                  onChange={(e) => setFormReceivables(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Payouts Done (Rs)</label>
                <input 
                  type="number" 
                  value={formPayouts} 
                  onChange={(e) => setFormPayouts(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Staff Present</label>
                <input 
                  type="number" 
                  value={formStaffPresent} 
                  onChange={(e) => setFormStaffPresent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Staff Total</label>
                <input 
                  type="number" 
                  value={formStaffTotal} 
                  onChange={(e) => setFormStaffTotal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Ad Clicks</label>
                <input 
                  type="number" 
                  value={formAdClicks} 
                  onChange={(e) => setFormAdClicks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">Open Tickets</label>
                <input 
                  type="number" 
                  value={formTickets} 
                  onChange={(e) => setFormTickets(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500" 
                  placeholder="0"
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl transition-all shadow-sm text-xs text-center"
                >
                  Save Telemetry
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Superboss Approval & Action Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-500" /> Sensitive Actions Awaiting Human Review
          </h3>

          {aiMode === 'manual' ? (
            <div className="p-6 text-center border rounded-3xl bg-white dark:bg-slate-900/20 text-xs text-slate-400 font-semibold">
              AI recommendations and approval queue are disabled in Manual Mode. All operations must be verified manually.
            </div>
          ) : aiRecommendations.length === 0 ? (
            <div className="p-6 text-center border rounded-3xl bg-white dark:bg-slate-900/20 text-xs text-teal-600 dark:text-teal-500 font-black flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> All queued AI workflows approved or processed.
            </div>
          ) : (
            <div className="space-y-3">
              {aiRecommendations.map(rec => (
                <div key={rec.id} className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {rec.agent}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{rec.type}</span>
                    </div>
                    <p className="font-extrabold text-slate-900 dark:text-white leading-relaxed">{rec.message}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{rec.details}</p>
                  </div>

                  <div className="flex gap-2 self-end md:self-center">
                    <button 
                      onClick={() => handleApproveRec(rec.id)}
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-500 text-slate-950 font-extrabold rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button 
                      onClick={() => handleRejectRec(rec.id)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 rounded-lg border dark:border-slate-700 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WIDGET: Agent-to-Agent Communications Feed */}
        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-teal-600" /> Internal Agent Communication Log
          </h3>

          {aiMode === 'manual' ? (
            <div className="py-6 text-center text-xs text-slate-400 font-semibold leading-relaxed">
              No communication logs. Agent message bus is offline.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {agentLogs.map((log, idx) => (
                <div key={idx} className="text-[11px] font-semibold border-b border-slate-100 dark:border-slate-900 pb-2 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase">
                    <span className="text-indigo-600 dark:text-indigo-400">{log.source} ➔ {log.dest}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {log.time}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-normal">{log.msg}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDGET: Sales target progress */}
        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
            <Target className="w-4 h-4 text-teal-600" /> Revenue Target Progress
          </h3>

          <div className="flex items-center justify-around gap-4 py-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" className="dark:stroke-slate-800" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#14b8a6" 
                  strokeWidth="8" 
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * Math.min(metrics.revenue, metrics.targetAmount)) / metrics.targetAmount}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {Math.round((metrics.revenue / metrics.targetAmount) * 100)}%
                </span>
                <span className="text-[8px] text-slate-500 font-semibold uppercase">Goal</span>
              </div>
            </div>

            <div className="space-y-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p>Target Goal</p>
                <p className="font-extrabold text-slate-800 dark:text-white mt-0.5">{formatINR(metrics.targetAmount)}</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p>Achieved</p>
                <p className="font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">{formatINR(metrics.revenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET: Cash flow */}
        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-teal-600" /> Cash Flow Overview
          </h3>
          <div className="space-y-3 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
              <span>Outstanding Receivables:</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold">{formatINR(metrics.receivables)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
              <span>Vendor Payouts Pending:</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold">{formatINR(metrics.payoutsDone)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
              <span>Net Cash Impact:</span>
              <span className="text-teal-600 dark:text-teal-400 font-extrabold">{formatINR(metrics.receivables - metrics.payoutsDone)}</span>
            </div>
          </div>
        </div>

        {/* WIDGET: Support Ticket SLA */}
        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-teal-600" /> Support SLA Telemetry
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Open Tickets</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{metrics.openTickets}</span>
              <span className="text-[9px] text-slate-500 mt-1 block font-bold">2 Awaiting SLA</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">WhatsApp Updates</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{metrics.briefingsSent}</span>
              <span className="text-[9px] text-slate-500 mt-1 block font-bold">Briefing bots online</span>
            </div>
          </div>
        </div>

      </div>

      {/* Warnings & alerts */}
      <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500" /> Operational Alerts & Manual Fallbacks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="p-3.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 text-red-700 dark:text-red-400 rounded-2xl flex items-start gap-2.5">
            <Package className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">OpsAgent: Low stock warning</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                SKU-STEEL-V4 stock is below safety levels. AI has prepared a Purchase Order draft. If AI is disabled, generate PO manually in Inventory.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 text-indigo-700 dark:text-indigo-400 rounded-2xl flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">BriefingAgent: WhatsApp schedule status</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Morning briefings successfully generated. If Meta integration is disabled, copy dashboard highlights manually to forward to team.
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Superboss AI Panel — Live Business Intelligence */}
        <div className="mt-6">
          <SuperbossPanel compact={true} />
        </div>

    </ConsoleLayout>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-bold">Loading dashboard...</div>}>
      <DashboardContent />
    </React.Suspense>
  );
}
