'use client';
import React, { useState, useEffect, useCallback } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import SuperbossPanel from '../components/ai/SuperbossPanel';
import AIApprovalQueue from '../components/ai/AIApprovalQueue';
import AIMemoryViewer from '../components/ai/AIMemoryViewer';
import AIAuditLogViewer from '../components/ai/AIAuditLogViewer';
import AIWorkflowTimeline from '../components/ai/AIWorkflowTimeline';
import {
  Brain, Cpu, BarChart3, Database, FileText, GitBranch, ShieldAlert, ShieldCheck,
  Zap, Activity, RefreshCw, Play, MessageSquare, Settings
} from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

function AICommandCenterContent() {
  const [activeTab, setActiveTab] = useState<'superboss' | 'approvals' | 'workflows' | 'memory' | 'logs' | 'agents' | 'usage' | 'deploy'>('superboss');
  const [agents, setAgents] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [commandPrompt, setCommandPrompt] = useState('');
  const [commandResult, setCommandResult] = useState<any>(null);
  const [runningCommand, setRunningCommand] = useState(false);
  const [aiMode, setAiMode] = useState<'manual' | 'ai-assisted'>('ai-assisted');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  // Pipeline deployment states
  const [selectedPipeline, setSelectedPipeline] = useState<string>('lead_follow_up');
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [byokProvider, setByokProvider] = useState<'GEMINI' | 'OPENAI' | 'ANTHROPIC'>('GEMINI');
  const [byokApiKey, setByokApiKey] = useState('');
  const [byokSaving, setByokSaving] = useState(false);
  const [deployingPipeline, setDeployingPipeline] = useState(false);

  const pipelines = [
    {
      id: 'lead_follow_up',
      name: 'Lead Follow-Up Agent Pipeline',
      trigger: 'NEW_LEAD',
      description: 'Checks lead status, retrieves last touchpoints, queries LLM to check fit, and drafts a WhatsApp outreach campaign message.',
      role: 'LEAD_ENGINE',
      steps: [
        { title: 'Telemetry Check', desc: 'Code verifies lead status and time elapsed since last phone/email contact.' },
        { title: 'AI Score Evaluation', desc: 'AI reviews company description and B2B fit.' },
        { title: 'Outreach Composition', desc: 'AI drafts personalized follow-up message customized for the rep.' },
        { title: 'Approval Hold', desc: 'Saves message to Review Queue; requires owner approval before sending.' }
      ],
      safetyRules: [
        'DPDP compliance: Checks and enforces opt-out tokens.',
        'NCPR compliance: Restricts calls to legal hours (10:00 AM - 7:00 PM).'
      ]
    },
    {
      id: 'deal_risk',
      name: 'Deal Risk Detector Agent Pipeline',
      trigger: 'STUCK_DEAL',
      description: 'Monitors deals stuck in pipeline stages, computes days in stage, summarizes timeline history, and posts real-time alerts.',
      role: 'SALES',
      steps: [
        { title: 'Stage Age Check', desc: 'Code calculates days in current deal stage.' },
        { title: 'Context Construction', desc: 'Collects last activities, meeting notes, and deal value.' },
        { title: 'Risk Grading', desc: 'AI analyzes likelihood of deal loss and suggests corrective action.' },
        { title: 'Dashboard Posting', desc: 'Publishes a risk alert on the executive command board.' }
      ],
      safetyRules: [
        'Read-only database checks: Never updates deal parameters automatically.'
      ]
    },
    {
      id: 'invoice_reminder',
      name: 'Overdue Invoice Recovery Agent Pipeline',
      trigger: 'INVOICE_OVERDUE',
      description: 'Tracks unpaid invoices, computes days overdue, drafts professional reminder copies, and schedules them for sending.',
      role: 'FINANCE',
      steps: [
        { title: 'Due Date Telemetry', desc: 'Code scans invoice dates and filters overdue items.' },
        { title: 'Amount Assessment', desc: 'Computes grand total and matches customer contact details.' },
        { title: 'Reminder Generation', desc: 'AI drafts polite yet firm payment reminders.' },
        { title: 'Approval Queue', desc: 'Requires manager approval before releasing WhatsApp/Email reminders.' }
      ],
      safetyRules: [
        'Safe ledger writes: Never marks invoices as paid autonomously.',
        'No direct payment links sent without explicit manager approval.'
      ]
    },
    {
      id: 'ticket_escalation',
      name: 'SLA Ticket Escalation Agent Pipeline',
      trigger: 'SUPPORT_SLA_RISK',
      description: 'Tracks ticket age, evaluates SLA deadlines, summaries issue logs, drafts resolution emails, and escalates to managers.',
      role: 'SUPPORT',
      steps: [
        { title: 'SLA Check', desc: 'Code evaluates ticket priority and elapsed resolution hours.' },
        { title: 'Summarization', desc: 'AI extracts core issue description from client logs.' },
        { title: 'Drafting Reply', desc: 'AI drafts a priority support email reply to the client.' },
        { title: 'Sign-off Check', desc: 'Awaits manager review to approve the response before releasing.' }
      ],
      safetyRules: [
        'Strict feedback loop: Customer is never replied to automatically.'
      ]
    }
  ];

  const activePipeline = pipelines.find(p => p.id === selectedPipeline) || pipelines[0];

  const handleConnectProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!byokApiKey.trim()) return;
    setByokSaving(true);
    try {
      await vortiqClient.callMutation('ai.connectAIProvider', {
        provider: byokProvider,
        apiKey: byokApiKey
      });
      await vortiqClient.callMutation('ai.updateAISettings', {
        provider: byokProvider,
        isEnabled: true
      });
      const updated = await vortiqClient.callQuery('ai.getConnectedProviders');
      setConnectedProviders(updated || []);
      setByokApiKey('');
      alert(`API Key connected and saved for ${byokProvider}!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setByokSaving(false);
    }
  };

  const handleDeployPipeline = async () => {
    if (connectedProviders.length === 0) {
      alert('Please connect an AI provider first.');
      return;
    }
    if (!permissionChecked) {
      alert('Please check the safety authorization consent box.');
      return;
    }
    setDeployingPipeline(true);
    try {
      let triggerEvent = 'NEW_LEAD';
      let agentRole = 'LEAD_ENGINE';
      
      if (selectedPipeline === 'deal_risk') {
        triggerEvent = 'STUCK_DEAL';
        agentRole = 'SALES';
      } else if (selectedPipeline === 'invoice_reminder') {
        triggerEvent = 'INVOICE_OVERDUE';
        agentRole = 'FINANCE';
      } else if (selectedPipeline === 'ticket_escalation') {
        triggerEvent = 'SUPPORT_SLA_RISK';
        agentRole = 'SUPPORT';
      }

      const allWorkflows = await vortiqClient.callQuery('ai.getAIWorkflows');
      const matched = allWorkflows?.find((w: any) => w.triggerEvent === triggerEvent);
      if (matched) {
        await vortiqClient.callMutation('ai.updateAIWorkflow', {
          id: matched.id,
          isActive: true
        });
      }

      const allAgents = await vortiqClient.callQuery('ai.getAIAgents');
      const agentMatched = allAgents?.find((a: any) => a.role === agentRole);
      if (agentMatched) {
        await vortiqClient.callMutation('ai.updateAIAgent', {
          id: agentMatched.id,
          isEnabled: true
        });
      }

      const updatedAgents = await vortiqClient.callQuery('ai.getAIAgents');
      setAgents(updatedAgents || []);

      alert(`Agent Pipeline [${activePipeline.name}] deployed successfully! The agent is now monitoring live telemetry.`);
      setPermissionChecked(false);
    } catch (err: any) {
      alert(`Deployment failed: ${err.message}`);
    } finally {
      setDeployingPipeline(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
    if (stored) setAiMode(stored);

    Promise.all([
      vortiqClient.callQuery('ai.getAIAgents').then(d => { setAgents(d || []); setLoadingAgents(false); }).catch(() => setLoadingAgents(false)),
      vortiqClient.callQuery('ai.getAIUsageSummary').then(d => setUsage(d)).catch(() => {}),
      vortiqClient.callQuery('ai.getConnectedProviders').then(d => setConnectedProviders(d || [])).catch(() => {})
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
    { id: 'deploy', label: 'Deploy Pipelines', icon: Zap },
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

        {/* Deploy Pipelines (Agent Deployment Center) */}
        {activeTab === 'deploy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* Left: Pipeline Selector */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Select Preloaded Pipeline</span>
              {pipelines.map(p => {
                const isSelected = selectedPipeline === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPipeline(p.id); setPermissionChecked(false); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-900 dark:text-white' 
                        : 'bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-805 text-slate-550 hover:border-slate-350 dark:hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black border uppercase ${
                        isSelected ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                        Trigger: {p.trigger}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-205">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Right: Deployment Console */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white dark:bg-slate-900/25 border border-slate-200 dark:border-slate-900 p-6 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    {activePipeline.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{activePipeline.description}</p>
                </div>

                {/* API Key Gate */}
                {connectedProviders.length === 0 ? (
                  <div className="p-5 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Bring Your Own Key (BYOK) Required</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                          To deploy this autonomous agent pipeline, you must link your AI provider account. Enter your API key below. Keys are stored securely and encrypted.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleConnectProvider} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      <div className="sm:col-span-4">
                        <select
                          value={byokProvider}
                          onChange={(e) => setByokProvider(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none"
                        >
                          <option value="GEMINI">Google Gemini</option>
                          <option value="OPENAI">OpenAI GPT-4o</option>
                          <option value="ANTHROPIC">Anthropic Claude</option>
                        </select>
                      </div>
                      <div className="sm:col-span-5 relative">
                        <input
                          type="password"
                          placeholder="Enter Provider API Key..."
                          value={byokApiKey}
                          onChange={(e) => setByokApiKey(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          disabled={byokSaving || !byokApiKey.trim()}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          {byokSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          Connect
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 border border-teal-500/20 bg-teal-500/5 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-teal-650 dark:text-teal-400" />
                      <div>
                        <p className="text-teal-700 dark:text-teal-400 font-extrabold">BYOK AI Integration Active</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Active Providers: {connectedProviders.join(', ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25 font-black rounded-full">Connected</span>
                  </div>
                )}

                {/* Planned execution steps */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Planned Pipeline Execution Steps</span>
                  <div className="relative pl-4 border-l-2 border-indigo-500/20 space-y-4">
                    {activePipeline.steps.map((step, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[23px] top-0 w-4 h-4 rounded-full bg-indigo-650 text-white flex items-center justify-center text-[9px] font-black">
                          {idx + 1}
                        </div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-205">{step.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety & Compliance rules details */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-2 text-[10px] font-semibold text-slate-550 dark:text-slate-400 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-teal-650" />
                    Safety & Compliance Guardrails
                  </div>
                  {activePipeline.safetyRules.map((rule, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-teal-650 font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-850 flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      id="consent-check"
                      checked={permissionChecked}
                      onChange={(e) => setPermissionChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <label htmlFor="consent-check" className="cursor-pointer font-bold leading-tight">
                      I authorize the Vortiq AI agents to deploy and execute this pipeline. All transactional actions (messages, drafts, and disbursals) will be queued for my manual approval.
                    </label>
                  </div>
                </div>

                {/* Deploy Button */}
                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleDeployPipeline}
                    disabled={deployingPipeline || !permissionChecked || connectedProviders.length === 0}
                    className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    {deployingPipeline ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                    Deploy Agent Pipeline
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

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
