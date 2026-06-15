'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

export default function AIRiskAlerts() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await vortiqClient.callQuery('ai.computeBusinessMetrics');
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to compute risk metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30 * 1000); // Poll every 30s
    
    // Listen for data updates
    const handleChange = () => fetchMetrics();
    window.addEventListener('vortiq-data-change', handleChange);
    window.addEventListener('vortiq-ai-approval-change', handleChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('vortiq-data-change', handleChange);
      window.removeEventListener('vortiq-ai-approval-change', handleChange);
    };
  }, [fetchMetrics]);

  if (loading && !metrics) {
    return (
      <div className="p-4 bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse space-y-3">
        <div className="h-4 bg-slate-350 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-10 bg-slate-350 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  const overdueInvoices = metrics?.finance?.overdueInvoices || 0;
  const delayedTasks = metrics?.delayedTasks || 0;
  const lowStockAlerts = metrics?.lowStockAlerts || 0;
  const openTickets = metrics?.openTickets || 0;

  const totalRisks = (overdueInvoices > 0 ? 1 : 0) + 
                     (delayedTasks > 0 ? 1 : 0) + 
                     (lowStockAlerts > 0 ? 1 : 0) + 
                     (openTickets > 5 ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Operational Risk Telemetry</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Real-time anomaly & threshold detection</p>
          </div>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={refreshing}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3.5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {overdueInvoices > 0 && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-xs text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            <div>
              <span className="font-extrabold block">Outstanding Receivables Risk</span>
              <span className="text-[10px] mt-0.5 block text-slate-500 dark:text-rose-300/60 font-semibold">
                {overdueInvoices} invoice{overdueInvoices > 1 ? 's are' : ' is'} past the due date. Immediate payment reminders are recommended.
              </span>
            </div>
          </div>
        )}

        {delayedTasks > 0 && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-xs text-amber-700 dark:text-amber-400">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <div>
              <span className="font-extrabold block">SLA Task Delays</span>
              <span className="text-[10px] mt-0.5 block text-slate-500 dark:text-amber-300/60 font-semibold">
                {delayedTasks} critical task{delayedTasks > 1 ? 's are' : ' is'} past due. Re-assignment or sprint escalation required.
              </span>
            </div>
          </div>
        )}

        {lowStockAlerts > 0 && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/25 text-xs text-orange-700 dark:text-orange-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
            <div>
              <span className="font-extrabold block">Inventory Stockout Risk</span>
              <span className="text-[10px] mt-0.5 block text-slate-500 dark:text-orange-300/60 font-semibold">
                {lowStockAlerts} SKU{lowStockAlerts > 1 ? 's are' : ' is'} below their safety reorder thresholds. Auto-draft purchase orders.
              </span>
            </div>
          </div>
        )}

        {openTickets > 5 && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-250 dark:border-yellow-500/25 text-xs text-yellow-750 dark:text-yellow-400">
            <Layers className="w-4 h-4 mt-0.5 shrink-0 text-yellow-550" />
            <div>
              <span className="font-extrabold block">Support Backlog Threat</span>
              <span className="text-[10px] mt-0.5 block text-slate-500 dark:text-yellow-350/65 font-semibold">
                {openTickets} unresolved customer tickets. Queue SLA breaching probability is high.
              </span>
            </div>
          </div>
        )}

        {totalRisks === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-extrabold">All Operations Secure</span>
              <span className="text-[10px] mt-0.5 block text-slate-500 dark:text-emerald-350/65 font-semibold">
                Zero threshold breaches detected across active accounting, tasks, stock, and ticket channels.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
