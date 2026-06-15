'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, DollarSign, Cpu, ShieldAlert, ChevronDown, ChevronUp, Sparkles, WifiOff } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

interface SuperbossPanelProps {
  compact?: boolean;
}

export default function SuperbossPanel({ compact = false }: SuperbossPanelProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await vortiqClient.callQuery('ai.getSuperbossReport');
      setReport(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load Superboss report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchReport, 5 * 60 * 1000);
    // Listen for data change events
    const handleChange = () => fetchReport();
    window.addEventListener('vortiq-data-change', handleChange);
    window.addEventListener('vortiq-ai-approval-change', handleChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vortiq-data-change', handleChange);
      window.removeEventListener('vortiq-ai-approval-change', handleChange);
    };
  }, [fetchReport]);

  const metrics = report?.metrics;

  if (loading && !report) {
    return (
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-5 space-y-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20" />
          <div className="h-4 bg-indigo-500/20 rounded w-40" />
        </div>
        <div className="h-16 bg-indigo-500/10 rounded-xl" />
        <div className="h-4 bg-indigo-500/10 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-violet-950/20 to-slate-900/40 backdrop-blur-sm overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Superboss AI
              {report?.isAIGenerated && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20 font-bold uppercase tracking-wider">AI</span>
              )}
              {!report?.isAIGenerated && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/20 font-bold uppercase tracking-wider">Computed</span>
              )}
            </h3>
            <p className="text-[10px] text-indigo-300/60 font-semibold">Central Intelligence Layer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={refreshing}
            className="p-1.5 hover:bg-indigo-500/10 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {compact && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-indigo-500/10 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Metric Strip */}
      {metrics && (
        <div className="grid grid-cols-4 divide-x divide-indigo-500/10 border-b border-indigo-500/10">
          {[
            { label: 'Revenue', value: `₹${(metrics.revenue / 100000).toFixed(1)}L`, icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Leads Today', value: metrics.leadsToday, icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Tickets', value: metrics.openTickets, icon: Users, color: metrics.openTickets > 5 ? 'text-amber-400' : 'text-teal-400' },
            { label: 'Tasks Done', value: metrics.tasksCompleted, icon: CheckCircle, color: 'text-violet-400' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className={`text-base font-black ${item.color}`}>{item.value}</span>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Expandable body */}
      {(expanded || !compact) && (
        <div className="p-5 space-y-4">
          
          {/* Error state */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* AI disabled / not connected */}
          {report && !report.isAIGenerated && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{report.narrative?.includes('disabled') ? 'AI is disabled' : 'AI provider not connected'} — showing computed metrics only. Go to Settings → AI Keys.</span>
            </div>
          )}

          {/* AI Narrative */}
          {report?.narrative && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {report.isAIGenerated ? 'AI Intelligence Briefing' : 'Computed Summary'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                {report.narrative}
              </div>
            </div>
          )}

          {/* Risk Alerts from metrics */}
          {metrics && (
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Risk Alerts
              </span>
              <div className="space-y-1.5">
                {metrics.finance?.overdueInvoices > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 text-xs text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">{metrics.finance.overdueInvoices} overdue invoice{metrics.finance.overdueInvoices > 1 ? 's' : ''} — action required</span>
                  </div>
                )}
                {metrics.delayedTasks > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/15 text-xs text-amber-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">{metrics.delayedTasks} delayed task{metrics.delayedTasks > 1 ? 's' : ''} — past due date</span>
                  </div>
                )}
                {metrics.lowStockAlerts > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/15 text-xs text-orange-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">{metrics.lowStockAlerts} inventory SKU{metrics.lowStockAlerts > 1 ? 's' : ''} below reorder point</span>
                  </div>
                )}
                {metrics.openTickets > 5 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/15 text-xs text-yellow-400">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">{metrics.openTickets} open support tickets — SLA risk</span>
                  </div>
                )}
                {metrics.finance?.overdueInvoices === 0 && metrics.delayedTasks === 0 && metrics.lowStockAlerts === 0 && metrics.openTickets <= 5 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-xs text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">No critical alerts detected — business operations look healthy</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer metadata */}
          {report?.generatedAt && (
            <div className="flex items-center justify-between text-[9px] text-slate-600 font-semibold pt-2 border-t border-indigo-500/10">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Data source: Live Database
                {report.isAIGenerated && ` · ${report.model}`}
              </span>
              <span>Generated {new Date(report.generatedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
