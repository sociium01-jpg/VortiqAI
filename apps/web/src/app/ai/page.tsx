'use client';
import React, { useState, useEffect, useCallback } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import SuperbossPanel from '../components/ai/SuperbossPanel';
import AIApprovalQueue from '../components/ai/AIApprovalQueue';
import AIMemoryViewer from '../components/ai/AIMemoryViewer';
import AIAuditLogViewer from '../components/ai/AIAuditLogViewer';
import AIWorkflowTimeline from '../components/ai/AIWorkflowTimeline';
import {
  Brain, Cpu, BarChart3, Database, FileText, GitBranch, ShieldAlert,
  Zap, Activity, RefreshCw, Play, MessageSquare, Settings
} from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

function AICommandCenterContent() {
  const [activeTab, setActiveTab] = useState<'superboss' | 'approvals' | 'workflows' | 'memory' | 'logs' | 'agents' | 'usage'>('superboss');
  const [agents, setAgents] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [commandPrompt, setCommandPrompt] = useState('');
  const [commandResult, setCommandResult] = useState<any>(null);
  const [runningCommand, setRunningCommand] = useState(false);
  const [aiMode, setAiMode] = useState<'manual' | 'ai-assisted'>('ai-assisted');

  useEffect(() => {
    const stored = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
    if (stored) setAiMode(stored);

    Promise.all([
      vortiqClient.callQuery('ai.getAIAgents').then(d => { setAgents(d || []); setLoadingAgents(false); }).catch(() => setLoadingAgents(false)),
      vortiqClient.callQuery('ai.getAIUsageSummary').then(d => setUsage(d)).catch(() => {})
    ]);
  }, []);

  const handleRunCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandPrompt.trim() || aiMode === 'manual') return;
    setRunningCommand(true);
    setCommandResult(null);
    try {
      const result = await vortiqClient.callMutation('ai.runAIWorkflow', {
        workflowType: 'CUSTOM',
        prompt: commandPrompt
      });
      setCommandResult(result);
      setCommandPrompt('');
      window.dispatchEvent(new Event('vortiq-ai-approval-change'));
    } catch (err: any) {
      setCommandResult({ status: 'FAILED', summary: err.message, steps: [] });
    } finally {
      setRunningCommand(false);
    }
  };

  const tabs = [
    { id: 'superboss', label: 'Superboss AI', icon: Brain },
    { id: 'approvals', label: 'Approvals', icon: ShieldAlert },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'agents', label: 'Agent Registry', icon: Cpu },
    { id: 'memory', label: 'AI Memory', icon: Database },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
    { id: 'usage', label: 'Usage', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Command Center</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold ml-12">Superboss AI · 11 Module Agents · Real-time intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          {aiMode === 'manual' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Manual Mode Active
            </div>
          )}
          <a href="/settings?tab=ai-safety" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <Settings className="w-3.5 h-3.5" />
            AI Settings
          </a>
        </div>
      </div>

      {/* AI Command Box */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-violet-950/20 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Superboss Command Interface</span>
        </div>
        <form onSubmit={handleRunCommand} className="flex gap-3">
          <div className="relative flex-1">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={commandPrompt}
              onChange={e => setCommandPrompt(e.target.value)}
              placeholder={aiMode === 'manual' ? 'AI disabled in Manual Mode...' : 'e.g. "Check overdue invoices and draft reminders" or "Summarize today\'s business health"'}
              disabled={aiMode === 'manual'}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-indigo-500/20 rounded-xl text-sm font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 disabled:opacity-50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!commandPrompt.trim() || runningCommand || aiMode === 'manual'}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            {runningCommand ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {runningCommand ? 'Running...' : 'Execute'}
          </button>
        </form>

        {/* Command Result */}
        {commandResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            commandResult.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/15' :
            commandResult.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/5 border-amber-500/15' :
            'bg-rose-500/5 border-rose-500/15'
          }`}>
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${
                commandResult.status === 'COMPLETED' ? 'text-emerald-400' :
                commandResult.status === 'AWAITING_APPROVAL' ? 'text-amber-400' : 'text-rose-400'
              }`} />
              <span className={`font-black text-[10px] uppercase ${
                commandResult.status === 'COMPLETED' ? 'text-emerald-400' :
                commandResult.status === 'AWAITING_APPROVAL' ? 'text-amber-400' : 'text-rose-400'
              }`}>{commandResult.status?.replace(/_/g, ' ')}</span>
            </div>
            {commandResult.steps?.length > 0 && (
              <div className="space-y-1.5 pl-3 border-l border-slate-700">
                {commandResult.steps.map((step: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${step.status === 'COMPLETED' ? 'bg-emerald-500' : step.status === 'AWAITING_APPROVAL' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                    <div>
                      <span className="text-[9px] text-indigo-400 font-black uppercase">{step.agent}: </span>
                      <span className="text-slate-400 font-semibold">{step.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {commandResult.summary && (
              <p className="text-slate-300 font-medium leading-relaxed">{commandResult.summary.substring(0, 400)}</p>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">

        {/* Superboss AI */}
        {activeTab === 'superboss' && <SuperbossPanel compact={false} />}

        {/* Approval Queue */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <AIApprovalQueue compact={false} />
          </div>
        )}

        {/* Workflow Timeline */}
        {activeTab === 'workflows' && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <AIWorkflowTimeline />
          </div>
        )}

        {/* Agent Registry */}
        {activeTab === 'agents' && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Active AI Agent Registry</h3>
            </div>
            {loadingAgents ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-900" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs">
                      {agent.role.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{agent.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{agent.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${agent.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="text-[9px] font-black text-slate-400 uppercase">{agent.isEnabled ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Memory */}
        {activeTab === 'memory' && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <AIMemoryViewer />
          </div>
        )}

        {/* Audit Logs */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <AIAuditLogViewer />
          </div>
        )}

        {/* Usage Stats */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            {usage ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total AI Actions', value: usage.totalActions, color: 'text-indigo-500' },
                    { label: 'Approved', value: usage.totalApprovals, color: 'text-emerald-500' },
                    { label: 'Rejected', value: usage.totalRejections, color: 'text-rose-500' },
                    { label: 'Errors', value: usage.totalErrors, color: usage.totalErrors > 0 ? 'text-rose-500' : 'text-slate-400' }
                  ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Provider', value: usage.provider, sub: usage.model },
                    { label: 'Tokens Used', value: usage.totalTokensUsed.toLocaleString(), sub: 'cumulative' },
                    { label: 'AI Enabled', value: usage.isEnabled ? 'Yes' : 'No', sub: `$${(usage.totalCostUsd || 0).toFixed(4)} est. cost` }
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">{item.value}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">Loading usage data...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AICommandCenterPage() {
  return (
    <ConsoleLayout>
      <AICommandCenterContent />
    </ConsoleLayout>
  );
}
