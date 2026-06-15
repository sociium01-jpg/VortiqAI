'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, RefreshCw, CheckCircle, Clock, AlertCircle, Loader2, ShieldAlert, Play } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

export default function AIWorkflowTimeline() {
  const [runs, setRuns] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [runsData, wfData] = await Promise.all([
        vortiqClient.callQuery('ai.getAIWorkflowRuns', { limit: 20 }),
        vortiqClient.callQuery('ai.getAIWorkflows')
      ]);
      setRuns(runsData || []);
      setWorkflows(wfData || []);
    } catch (err) {
      console.error('Failed to fetch workflow data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const handleChange = () => fetchData();
    window.addEventListener('vortiq-ai-approval-change', handleChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vortiq-ai-approval-change', handleChange);
    };
  }, [fetchData]);

  const getStatusIcon = (status: string) => {
    if (status === 'COMPLETED') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'FAILED') return <AlertCircle className="w-4 h-4 text-rose-500" />;
    if (status === 'AWAITING_APPROVAL') return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    if (status === 'RUNNING') return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getStatusStyle = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/15';
    if (status === 'FAILED') return 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/15';
    if (status === 'AWAITING_APPROVAL') return 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/15';
    if (status === 'RUNNING') return 'bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/15';
    return 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">AI Workflow Runs</h3>
            <p className="text-[10px] text-slate-500 font-semibold">{runs.length} recent workflow executions</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Available Workflows */}
      {workflows.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Workflows</p>
          <div className="grid grid-cols-1 gap-2">
            {workflows.map((wf) => (
              <div key={wf.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${wf.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{wf.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-semibold uppercase">{wf.triggerEvent?.replace(/_/g, ' ')}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${wf.isActive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {wf.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run Timeline */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />)}
        </div>
      ) : runs.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <Play className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">No workflow runs yet</p>
          <p className="text-[10px] text-slate-500">Workflows run when AI detects trigger conditions (overdue invoice, stuck deal, etc.)</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Executions</p>
          {runs.map((run) => {
            const steps = (run.result as any)?.steps || [];
            return (
              <div key={run.id} className={`rounded-2xl border p-3.5 space-y-3 text-xs ${getStatusStyle(run.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.status)}
                    <span className="font-black text-slate-700 dark:text-slate-300">Run #{run.id.substring(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 font-semibold">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      run.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      run.status === 'FAILED' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                      run.status === 'AWAITING_APPROVAL' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>{run.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Step Timeline */}
                {steps.length > 0 && (
                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                    {steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 -ml-px">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          step.status === 'COMPLETED' ? 'bg-emerald-500' :
                          step.status === 'AWAITING_APPROVAL' ? 'bg-amber-500' :
                          step.status === 'FAILED' ? 'bg-rose-500' : 'bg-slate-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase">{step.agent}</span>
                          <p className="text-slate-600 dark:text-slate-400 font-semibold text-[10px] truncate">{step.action}</p>
                          {step.output && (
                            <p className="text-slate-500 text-[9px] italic mt-0.5 line-clamp-1">{step.output}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {run.error && (
                  <p className="text-rose-600 dark:text-rose-400 font-semibold text-[10px]">Error: {run.error}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
