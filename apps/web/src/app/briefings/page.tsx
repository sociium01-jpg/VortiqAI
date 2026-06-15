'use client';

import React, { useState } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  Mail, MessageSquare, Send, CheckCircle2, AlertCircle, Clock, Settings,
  Brain, RefreshCw, X, Play, ShieldAlert, Sparkles, ChevronRight, Phone, Plus
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

interface BriefingRule {
  id: string;
  name: string;
  recipientRole: 'CEO' | 'CFO' | 'Sales Manager' | 'Ops Coordinator';
  targetPhone: string;
  deliveryTime: string;
  templateType: 'Finance Summary' | 'Sales Pipeline' | 'Ops & Stock' | 'Combined Scorecard';
  modulesIncluded: string[];
  isActive: boolean;
}

interface BroadcastLog {
  id: string;
  timestamp: string;
  recipient: string;
  role: string;
  template: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  payloadSummary: string;
}

export default function BriefingsPage() {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'logs' | 'sandbox'>('scheduler');

  // Scheduled Briefings
  const [rules, setRules] = useState<BriefingRule[]>(
    [
      { id: 'BRF-001', name: 'CEO Morning Briefing Scorecard', recipientRole: 'CEO', targetPhone: '+91 98765 43210', deliveryTime: '07:30 AM', templateType: 'Combined Scorecard', modulesIncluded: ['Finance', 'Sales', 'HR', 'Support'], isActive: true },
      { id: 'BRF-002', name: 'CFO Ledger Alert Trigger', recipientRole: 'CFO', targetPhone: '+91 95601 22334', deliveryTime: '07:30 PM', templateType: 'Finance Summary', modulesIncluded: ['Finance'], isActive: true },
      { id: 'BRF-003', name: 'Ops Stock Depletion Daily Update', recipientRole: 'Ops Coordinator', targetPhone: '+91 98110 44556', deliveryTime: '08:00 AM', templateType: 'Ops & Stock', modulesIncluded: ['Inventory'], isActive: false }
    ]
  );

  // Broadcast log history
  const [logs, setLogs] = useState<BroadcastLog[]>([
    { id: 'LOG-991', timestamp: 'Today, 07:30 AM', recipient: 'Manoj CEO', role: 'CEO', template: 'Combined Scorecard', status: 'DELIVERED', payloadSummary: 'Gross: Rs 18.5L, Low SKU count: 1, Tickets pending: 2.' },
    { id: 'LOG-992', timestamp: 'Yesterday, 07:30 PM', recipient: 'Shruti CFO', role: 'CFO', template: 'Finance Summary', status: 'DELIVERED', payloadSummary: 'Taxable subtotal: Rs 12.0L, SGST/CGST: Rs 30,780.' },
    { id: 'LOG-993', timestamp: '14 Jun, 08:00 AM', recipient: 'Manoj CEO', role: 'CEO', template: 'Combined Scorecard', status: 'FAILED', payloadSummary: 'Network timeout (cloud api webhook connection failure)' }
  ]);

  // Form states - Add schedule
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'CEO' | 'CFO' | 'Sales Manager' | 'Ops Coordinator'>('CEO');
  const [newPhone, setNewPhone] = useState('');
  const [newTime, setNewTime] = useState('08:00 AM');
  const [newTemplate, setNewTemplate] = useState<'Finance Summary' | 'Sales Pipeline' | 'Ops & Stock' | 'Combined Scorecard'>('Combined Scorecard');
  const [selectedModules, setSelectedModules] = useState<string[]>(['Finance', 'Sales']);

  // Sandbox states
  const [testText, setTestText] = useState('Morning Briefing: June Revenues hit Rs 18.5L. Tata Motors PO awaiting CFO verification.');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);

  const [aiWorking, setAiWorking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('BriefingAgent: Morning scorecards compiled for CEO Manoj. Next scheduled update CFO Ledger (07:30 PM). Cloud API sandbox channels verified.');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newRule: BriefingRule = {
      id: `BRF-00${rules.length + 1}`,
      name: newName,
      recipientRole: newRole,
      targetPhone: newPhone.startsWith('+91') ? newPhone : `+91 ${newPhone}`,
      deliveryTime: newTime,
      templateType: newTemplate,
      modulesIncluded: selectedModules,
      isActive: true
    };

    setRules([...rules, newRule]);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleTestWhatsAppTrigger = () => {
    setAiWorking(true);
    setSandboxResponse(null);
    setTimeout(() => {
      setAiWorking(false);
      setSandboxResponse(`JSON response payload:\n{\n  "status": "success",\n  "message_id": "wa_msg_90123849182",\n  "channel": "WHATSAPP_CLOUD_API",\n  "recipient": "+91 98765 43210",\n  "delivered_at": "2026-06-15T15:25:00Z"\n}`);
      
      // Append success log
      const testLog: BroadcastLog = {
        id: `LOG-${Date.now().toString().slice(-3)}`,
        timestamp: 'Just now',
        recipient: 'Sandbox Test User',
        role: 'CEO',
        template: 'Sandbox Trigger',
        status: 'DELIVERED',
        payloadSummary: testText
      };
      setLogs([testLog, ...logs]);
    }, 1200);
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const handleToggleModuleSelection = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter(m => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const handleTriggerBriefingAudit = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAiAnalysis('Updated Briefing Audit: Re-rendered Morning scorecard parameters. Verified all receiver cell carriers are active.');
    }, 1200);
  };

  const briefingsMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('whatsapp') || lower.includes('trigger') || lower.includes('send')) {
      return {
        answer: "Briefing Agent: Simulated WhatsApp cloud dispatch trigger. Recipient: Manoj CEO. Status: DELIVERED (message_id: wa_msg_90123849182). Payload summary contains gross revenues and pending tickets count.",
        logs: "Logged sandbox WhatsApp trigger event."
      };
    }
    if (lower.includes('schedule') || lower.includes('rule') || lower.includes('time')) {
      return {
        answer: "Briefing Agent: Scheduled morning scorecard rendering active for CEO (07:30 AM) and evening updates for CFO (07:30 PM). 1 rule (Ops Coordinator) currently suspended.",
        logs: "Audited active cloud scheduler cron settings."
      };
    }
    return {
      answer: "Briefing Agent: Active and tracking scheduled scorecards. Ask me to 'trigger WhatsApp sandbox' or 'list scheduled briefings'.",
      logs: "Checked scheduled receiver cell carrier connectivity."
    };
  };

  return (
    <ConsoleLayout>
      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5.5 h-5.5 text-teal-655 text-teal-600 dark:text-teal-400" />
              WhatsApp & Telegram Scorecard Briefings
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Configure scheduled executive briefings, review outgoing payload content, and execute test Cloud API notifications.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsAdding(true);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Schedule
            </button>
          </div>
        </div>

        {/* Briefing Agent AI Panel */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  BriefingAgent Dispatch
                  <Clock className="w-3.5 h-3.5 text-teal-650" />
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">Cloud Scheduler</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleTriggerBriefingAudit}
            disabled={aiWorking}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-355 border border-slate-200 dark:border-slate-880 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Refresh Scheduler
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 overflow-x-auto">
          {[
            { id: 'scheduler', label: 'Briefings Scheduler', icon: Settings },
            { id: 'logs', label: 'Broadcast History Logs', icon: MessageSquare },
            { id: 'sandbox', label: 'WhatsApp Sandbox Playground', icon: Play }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  active 
                    ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Briefing Creation Form */}
        {isAdding && (
          <form onSubmit={handleCreateRule} className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl animate-fadeIn shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Register Auto Briefing Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Schedule Name</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. CEO Morning Scorecard Update"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Phone Number (+91 prefix)</label>
                <input 
                  type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recipient Role</label>
                <select 
                  value={newRole} onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="CEO">CEO</option>
                  <option value="CFO">CFO</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Ops Coordinator">Ops Coordinator</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Daily Delivery Time</label>
                <select 
                  value={newTime} onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="07:30 AM">07:30 AM IST</option>
                  <option value="08:00 AM">08:00 AM IST</option>
                  <option value="07:30 PM">07:30 PM IST</option>
                  <option value="08:00 PM">08:00 PM IST</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Template Package</label>
                <select 
                  value={newTemplate} onChange={(e) => setNewTemplate(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-850"
                >
                  <option value="Combined Scorecard">Combined Scorecard</option>
                  <option value="Finance Summary">Finance Summary</option>
                  <option value="Sales Pipeline">Sales Pipeline</option>
                  <option value="Ops & Stock">Ops & Stock</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Modules to Include</label>
              <div className="flex flex-wrap gap-2">
                {['Finance', 'Sales', 'HR', 'Support', 'Inventory'].map(mod => {
                  const selected = selectedModules.includes(mod);
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => handleToggleModuleSelection(mod)}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                        selected 
                          ? 'bg-teal-50 border-teal-200 text-teal-650' 
                          : 'bg-slate-50 border-slate-200 text-slate-450 hover:bg-slate-100'
                      }`}
                    >
                      {mod}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all">
                Save Schedule
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tab 1: Briefing Scheduler */}
        {activeTab === 'scheduler' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Active Dispatch Schedules</h3>
              <span className="text-[10px] text-slate-500 font-semibold">{rules.length} configurations</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Schedule ID</th>
                    <th className="p-4">Briefing Name</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">WhatsApp Phone</th>
                    <th className="p-4">Scheduled Time</th>
                    <th className="p-4">Data Template</th>
                    <th className="p-4">Target Modules</th>
                    <th className="p-4 text-right">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-350">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{rule.id}</td>
                      <td className="p-4 font-bold text-slate-850">{rule.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-black border border-indigo-100 dark:border-indigo-950">
                          {rule.recipientRole}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">{rule.targetPhone}</td>
                      <td className="p-4 font-semibold text-slate-600">{rule.deliveryTime} IST</td>
                      <td className="p-4">{rule.templateType}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {rule.modulesIncluded.map(m => (
                            <span key={m} className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] rounded font-semibold text-slate-500">
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleRule(rule.id)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                            rule.isActive 
                              ? 'bg-teal-50 border-teal-200 text-teal-650' 
                              : 'bg-slate-105 border-slate-200 text-slate-400 bg-slate-100'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Broadcast logs */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Broadcast Log History</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Log ID</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Receiver</th>
                    <th className="p-4">Template Sourced</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payload Summary Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-350">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{log.id}</td>
                      <td className="p-4 text-slate-400">{log.timestamp}</td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{log.recipient} ({log.role})</td>
                      <td className="p-4">{log.template}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          log.status === 'DELIVERED' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' :
                          log.status === 'SENT' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-950' :
                          'bg-red-50 dark:bg-red-950/40 text-red-655 dark:text-red-400 border-red-100 dark:border-red-950'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 italic max-w-xs truncate" title={log.payloadSummary}>"{log.payloadSummary}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Sandbox Playground */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Playground */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-4 animate-fadeIn">
              <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-650" /> Test Cloud API Webhook
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sandbox Message Payload</label>
                  <textarea 
                    rows={4} 
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-3 text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Phone</label>
                    <input type="text" defaultValue="+91 98765 43210" disabled className="w-full bg-slate-100 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Channel</label>
                    <input type="text" defaultValue="WhatsApp Cloud API" disabled className="w-full bg-slate-100 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs" />
                  </div>
                </div>

                <button 
                  onClick={handleTestWhatsAppTrigger}
                  disabled={aiWorking}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute Webhook Trigger
                </button>
              </div>
            </div>

            {/* Sandbox response console log */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-3">
              <span className="text-[10px] font-black text-slate-455 text-slate-400 uppercase tracking-wider block">n8n Node Console Response</span>
              
              {sandboxResponse ? (
                <pre className="bg-slate-950 text-emerald-450 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-slate-900 overflow-x-auto whitespace-pre-wrap leading-relaxed animate-fadeIn">
                  {sandboxResponse}
                </pre>
              ) : (
                <div className="h-40 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-center text-xs text-slate-450 text-slate-400">
                  Execute the webhook trigger to inspect payload logs.
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      <ModuleAgentSidebar 
        agentName="WhatsApp Briefings Agent"
        permissionsScope="Permissions Scope: Read scheduled recipient roles and delivery crons, write test sandbox messages, trigger WhatsApp Cloud API webhooks. Blocked from editing company profile brand name."
        suggestedPrompts={[
          "trigger WhatsApp sandbox test",
          "list scheduled briefings",
          "check recipient cell carrier status"
        ]}
        defaultMemoryLogs={[
          "Briefings Agent online.",
          "Verified Cloud API connectivity.",
          "CEO morning briefing (LOG-991) delivered at 07:30 AM."
        ]}
        mockResponseMapper={briefingsMockResponse}
      />

      </div>
    </ConsoleLayout>
  );
}
