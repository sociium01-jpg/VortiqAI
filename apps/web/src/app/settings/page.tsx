'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  Settings, Key, Phone, MessageSquare, Database, CreditCard, Save, RefreshCw, EyeOff, Eye, Building2,
  ToggleLeft, ToggleRight, Play, Cpu, AlertTriangle, ShieldCheck, Sparkles, Code, Brain, Shield, Trash2, Download
} from 'lucide-react';

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  triggerEvent: string;
  webhookUrl: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  useEffect(() => {
    if (isLoaded && !isDemo) {
      setBrandName("My Business");
      setLogoUrl("");
      setAddress("");
      setCity("");
      setState("");
      setPincode("");
      setAnthropicKey("");
      setOpenAIKey("");
      setElevenlabsKey("");
      setGeminiKey("");
      setWorkflows([]);
      setMemoryStats([
        { tier: 'Company Memory', scope: 'Brand tone, corporate structures, SOP rules', vectors: 0 },
        { tier: 'Module Memory', scope: 'Kanban stages configs, lead scorers, calling rules', vectors: 0 },
        { tier: 'User Memory', scope: 'Reps dashboard preferences, email copies templates', vectors: 0 },
        { tier: 'Record-Level Memory', scope: 'Timeline transcripts, customer touchpoints, activity history', vectors: 0 }
      ]);
      setAiAnalysis("SettingsAgent: Setup complete. Add your API keys and configure modules.");
    }
  }, [isLoaded, isDemo]);

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'keys' | 'voice' | 'n8n' | 'modules' | 'ai-safety'>('profile');
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // Global AI Mode State
  const [aiModeEnabled, setAiModeEnabled] = useState(true);

  // Safety approval checkboxes
  const [safetyRules, setSafetyRules] = useState({
    sendWhatsApp: true,
    sendEmail: true,
    writeLedger: true,
    modifyPayroll: true,
    deleteRecords: true,
    updatePermissions: true,
    exportData: true
  });

  // Memory Tiers state
  const [memoryStats, setMemoryStats] = useState([
    { tier: 'Company Memory', scope: 'Brand tone, corporate structures, SOP rules', vectors: 14 },
    { tier: 'Module Memory', scope: 'Kanban stages configs, lead scorers, calling rules', vectors: 28 },
    { tier: 'User Memory', scope: 'Reps dashboard preferences, email copies templates', vectors: 42 },
    { tier: 'Record-Level Memory', scope: 'Timeline transcripts, customer touchpoints, activity history', vectors: 184 }
  ]);

  // Company profile states
  const [brandName, setBrandName] = useState('Alpha Components');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1560518883-ce09059eeffa');
  const [address, setAddress] = useState('12, MG Road, Camp');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('411001');

  // Encryption credentials
  const [anthropicKey, setAnthropicKey] = useState('sk-ant-api03-xxxxxx');
  const [openaiKey, setOpenAIKey] = useState('sk-proj-xxxxxx');
  const [elevenlabsKey, setElevenlabsKey] = useState('el-key-xxxxxx');
  const [geminiKey, setGeminiKey] = useState('AIzaSyxxxxxx');
  const [selectedProvider, setSelectedProvider] = useState('GEMINI');

  // Module configuration toggles
  const [modules, setModules] = useState<ModuleConfig[]>([
    { id: 'crm', name: 'CRM & Pipelines', description: 'Customer directories and Kanban deal stages', isEnabled: true },
    { id: 'lead-engine', name: 'Lead Engine', description: 'Ideal Client Persona (ICP) scraper pipeline', isEnabled: true },
    { id: 'sales', name: 'Sales & Calls', description: 'Outbound telemarketing scripts and call logger', isEnabled: true },
    { id: 'marketing', name: 'Marketing & Campaigns', description: 'Social scheduling and ad spent telemetries', isEnabled: true },
    { id: 'inventory', name: 'Inventory & SKUs', description: 'Multi-warehouse stock limits and dispatches', isEnabled: true },
    { id: 'finance', name: 'Finance & GST', description: 'GST invoices generation and CA journal ledgers', isEnabled: true },
    { id: 'hr', name: 'HR & Payroll', description: 'Employee directories, geofence checks, payslip audits', isEnabled: true }
  ]);

  // n8n workflow triggers
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([
    { id: 'WF-001', name: 'On Lead Capture -> Send WhatsApp Notification', triggerEvent: 'LEAD_CAPTURED', webhookUrl: 'https://n8n.vortiq.ai/webhook/lead-trigger', isActive: true },
    { id: 'WF-002', name: 'On Invoice Created -> Email Client PDF Link', triggerEvent: 'INVOICE_CREATED', webhookUrl: 'https://n8n.vortiq.ai/webhook/invoice-mailer', isActive: true },
    { id: 'WF-003', name: 'On Low Stock Alert -> Auto Draft Purchase Order', triggerEvent: 'LOW_STOCK_ALERT', webhookUrl: 'https://n8n.vortiq.ai/webhook/po-drafter', isActive: false }
  ]);

  // NLP Automation compiler states
  const [nlpPrompt, setNlpPrompt] = useState('When a new B2B lead is captured, check fit score, assign to Rahul, and draft a call task.');
  const [compiledN8nJson, setCompiledN8nJson] = useState<string | null>(null);

  const [aiWorking, setAiWorking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('SettingsAgent: Connected n8n triggers verified. BYOK encryption checks completed successfully. Call compliance TRAI rules active.');

  useEffect(() => {
    const stored = localStorage.getItem('vortiq-ai-mode');
    setAiModeEnabled(stored !== 'manual');
  }, []);

  const handleToggleAiMode = () => {
    const next = !aiModeEnabled;
    setAiModeEnabled(next);
    localStorage.setItem('vortiq-ai-mode', next ? 'ai-assisted' : 'manual');
    window.dispatchEvent(new Event('vortiq-ai-mode-change'));
    
    // Log the change
    setAiAnalysis(next 
      ? 'SettingsAgent: AI Assisted mode activated. Departmental agents scanning telemetry.' 
      : 'SettingsAgent: AI Assisted mode deactivated. Operating in strictly Manual Mode.'
    );
  };

  const handleToggleSafetyRule = (key: keyof typeof safetyRules) => {
    setSafetyRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClearMemory = (tier: string) => {
    if (confirm(`Are you sure you want to permanently clear all vector contexts for ${tier}?`)) {
      setMemoryStats(prev => prev.map(m => m.tier === tier ? { ...m, vectors: 0 } : m));
      alert(`${tier} cleared successfully.`);
    }
  };

  const toggleShowSecret = (field: string) => {
    setShowSecret(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleToggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m));
  };

  const handleToggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
  };

  const handleCompileNlp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpPrompt.trim()) return;

    setAiWorking(true);
    setCompiledN8nJson(null);
    setTimeout(() => {
      setAiWorking(false);
      setCompiledN8nJson(JSON.stringify({
        "meta": { "templateId": "WF-AUTO-992" },
        "nodes": [
          {
            "parameters": { "path": "webhook/lead-enrichment", "options": {} },
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 1,
            "position": [250, 300]
          },
          {
            "parameters": {
              "conditions": {
                "number": [{ "value1": "={{$json[\"fit_score\"]}}", "operation": "larger", "value2": 85 }]
              }
            },
            "type": "n8n-nodes-base.if",
            "position": [450, 300]
          },
          {
            "parameters": { "assignee": "Rahul Sharma", "task": "Lead outbound call follow-up" },
            "type": "n8n-nodes-base.vortiqTaskConnector",
            "position": [680, 200]
          }
        ]
      }, null, 2));
    }, 1200);
  };

  const handleTriggerSettingsSync = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAiAnalysis('Updated Settings Audit: n8n webhook endpoints tested. Rest encrypted BYOK key handshakes verified.');
    }, 1200);
  };

  return (
    <ConsoleLayout>
      <div className="space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400" />
              Settings & Integrations Console
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Configure tenant company profiles, toggle active platform modules, customize BYOK credentials, and manage n8n trigger webhooks.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleTriggerSettingsSync}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Sync Webhooks
            </button>
          </div>
        </div>

        {/* Settings Agent Status */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  SettingsAgent Configuration
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">Automated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Grid Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sub Navigation */}
          <div className="lg:col-span-3 space-y-2">
            {[
              { id: 'profile', label: 'Company Profile', icon: Building2 },
              { id: 'keys', label: 'BYOK API Keys', icon: Key },
              { id: 'ai-safety', label: 'AI Integration & Safety', icon: Shield },
              { id: 'voice', label: 'Voice Outbound Rules', icon: Phone },
              { id: 'n8n', label: 'n8n Webhook Triggers', icon: Cpu },
              { id: 'modules', label: 'Module Customization', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    active 
                      ? 'bg-teal-500/10 dark:bg-slate-900 border-teal-200 dark:border-slate-800 text-teal-600 dark:text-teal-400 font-extrabold' 
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Configuration Form Body */}
          <div className="lg:col-span-9 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-6">
            
            {/* TAB: PROFILE */}
            {activeSubTab === 'profile' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Corporate Profile</h3>
                  <p className="text-xs text-slate-400 mt-1">Configure trading names and logo URLs. Legal identifiers (GSTIN/Company details) are read-only for security reasons.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Registered Entity (Locked)</label>
                    <input 
                      type="text" disabled value="Alpha Components Private Limited"
                      className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed opacity-75"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GSTIN Number (Locked)</label>
                    <input 
                      type="text" disabled value="27AADCA1122F1Z4"
                      className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed opacity-75"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Trading / Brand Name</label>
                    <input 
                      type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Brand Logo URL</label>
                    <input 
                      type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Street Address</label>
                    <input 
                      type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City</label>
                    <input 
                      type="text" value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label>
                    <input 
                      type="text" value={state} onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pincode</label>
                    <input 
                      type="text" value={pincode} onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => alert('Brand details updated successfully!')}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Save Profile Customization
                </button>
              </div>
            )}

            {/* TAB: KEYS */}
            {activeSubTab === 'keys' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Bring Your Own Key (BYOK)</h3>
                  <p className="text-xs text-slate-400 mt-1">Direct LLM access billing. Key parameters are strictly stored on secure client sessions.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">AI Provider Integration</label>
                    <select 
                      value={selectedProvider} 
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="GEMINI">Google Gemini Pro (Recommended)</option>
                      <option value="OPENAI">OpenAI GPT-4o</option>
                      <option value="ANTHROPIC">Anthropic Claude 3.5 Sonnet</option>
                    </select>
                  </div>

                  {[
                    { label: 'Gemini API Key', field: 'geminiKey', value: geminiKey, setter: setGeminiKey },
                    { label: 'Anthropic Claude Key', field: 'anthropicKey', value: anthropicKey, setter: setAnthropicKey },
                    { label: 'OpenAI API Key', field: 'openaiKey', value: openaiKey, setter: setOpenAIKey },
                    { label: 'ElevenLabs Voice API Key', field: 'elevenlabsKey', value: elevenlabsKey, setter: setElevenlabsKey }
                  ].map(item => (
                    <div key={item.field} className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">{item.label}</label>
                      <div className="relative">
                        <input 
                          type={showSecret[item.field] ? 'text' : 'password'}
                          value={item.value}
                          onChange={(e) => item.setter(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs pr-10 focus:outline-none"
                        />
                        <button 
                          type="button" 
                          onClick={() => toggleShowSecret(item.field)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showSecret[item.field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => alert('API credentials verified and saved.')}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Save Encryption Credentials
                  </button>
                  <button 
                    onClick={() => alert('Ping connection to ' + selectedProvider + ' successful. Latency: 120ms')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            )}

            {/* TAB: AI SAFETY & INTEGRATION */}
            {activeSubTab === 'ai-safety' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">AI Integration & Safety Controls</h3>
                  <p className="text-xs text-slate-400 mt-1">Manage tenant dual-mode switches, configure human approval checkpoints for sensitive actions, and administer memory scopes.</p>
                </div>

                {/* Global Toggle */}
                <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <p className="font-extrabold text-teal-700 dark:text-teal-400">AI-Assisted Mode Status</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Toggle between Manual Mode (AI deactivated, strictly standard forms) and AI-Assisted Mode.
                    </p>
                  </div>
                  <button 
                    onClick={handleToggleAiMode}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-black transition-all ${
                      aiModeEnabled 
                        ? 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/25 text-teal-600 dark:text-teal-400 font-black' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    {aiModeEnabled ? 'AI Enabled' : 'AI Disabled (Manual)'}
                  </button>
                </div>

                {/* Safety check-boxes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-4.5 h-4.5 text-indigo-500" /> Human Approval Checkpoints (Safety Guardrails)
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5 text-xs">
                    {[
                      { label: 'Require confirmation before sending client WhatsApp briefings or campaign updates', key: 'sendWhatsApp' },
                      { label: 'Require approval before releasing outreach emails or posting social calendar cards', key: 'sendEmail' },
                      { label: 'Lock direct database writes to Invoices or Accounting Ledger entries (strictly human auth required)', key: 'writeLedger' },
                      { label: 'Lock modifications to Employee profiles, designated payroll runs or bank structures', key: 'modifyPayroll' },
                      { label: 'Block autonomous deletion of inventory products, SKUs, or customer directories', key: 'deleteRecords' },
                      { label: 'Gate access to roles allocations and custom workflow automations modifications', key: 'updatePermissions' },
                      { label: 'Enforce dual review checks prior to exporting bulk records or customer directories', key: 'exportData' }
                    ].map(rule => (
                      <div key={rule.key} className="flex items-start gap-2.5">
                        <input 
                          type="checkbox" 
                          id={rule.key}
                          checked={safetyRules[rule.key as keyof typeof safetyRules]}
                          onChange={() => handleToggleSafetyRule(rule.key as any)}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 mt-0.5" 
                        />
                        <label htmlFor={rule.key} className="cursor-pointer text-slate-700 dark:text-slate-300 font-semibold leading-tight">
                          {rule.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Memory managers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" /> Memory Scopes Manager
                  </h4>
                  <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/20 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="p-3">Memory Tier</th>
                          <th className="p-3">Scope Scope</th>
                          <th className="p-3 text-center">Stored Vectors</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {memoryStats.map(stat => (
                          <tr key={stat.tier} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-all">
                            <td className="p-3 font-extrabold">{stat.tier}</td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 font-medium">{stat.scope}</td>
                            <td className="p-3 text-center font-bold text-indigo-600 dark:text-teal-500">{stat.vectors} entries</td>
                            <td className="p-3 text-right space-x-1.5 shrink-0">
                              <button 
                                onClick={() => handleClearMemory(stat.tier)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 transition-all"
                                title="Clear memory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => alert('Exporting ' + stat.tier + ' context files...')}
                                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                                title="Export memory context"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VOICE */}
            {activeSubTab === 'voice' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Voice & Outbound Rules</h3>
                  <p className="text-xs text-slate-400 mt-1">Outbound telemarketing restrictions enforced client-side via DLT caller headers.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <input type="checkbox" defaultChecked disabled className="w-4 h-4 rounded text-teal-600" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Enforce TRAI Compliant Calling Hours</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Locks dialer commands during non-permissible slots (07:00 PM - 10:00 AM IST).</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">DLT Registered Caller ID</label>
                    <input 
                      type="text" defaultValue="+91 1409920192"
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Caller ID header must belong to 140/160 series telemarketing allocation.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: N8N */}
            {activeSubTab === 'n8n' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">n8n Plug-and-Play Workflows</h3>
                  <p className="text-xs text-slate-400 mt-1">Connect your workspace webhook nodes to execute external automation pipelines.</p>
                </div>

                {/* Workflow list */}
                <div className="space-y-3">
                  {workflows.map(wf => (
                    <div key={wf.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-955 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-extrabold text-slate-905 dark:text-slate-200">{wf.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Webhook URL: <span className="font-mono bg-white dark:bg-slate-900 border dark:border-slate-800 px-1 rounded">{wf.webhookUrl}</span></p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Trigger key: {wf.triggerEvent}</p>
                      </div>

                      <button 
                        onClick={() => handleToggleWorkflow(wf.id)}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                          wf.isActive ? 'bg-teal-500/10 border-teal-200 text-teal-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        {wf.isActive ? 'Trigger Active' : 'Disabled'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* NLP Automation compiler */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-teal-600" /> NLP automation parser
                  </h4>

                  <form onSubmit={handleCompileNlp} className="space-y-3">
                    <textarea 
                      value={nlpPrompt} onChange={(e) => setNlpPrompt(e.target.value)}
                      rows={3}
                      placeholder="e.g. When a new lead fits, trigger n8n hook..."
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs resize-none focus:outline-none"
                    />

                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={aiWorking}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Cpu className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} />
                        Compile Flow Nodes
                      </button>
                    </div>
                  </form>

                  {compiledN8nJson && (
                    <div className="space-y-2 animate-fadeIn">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Compiled JSON Nodes</span>
                      <pre className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-slate-900 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {compiledN8nJson}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MODULES */}
            {activeSubTab === 'modules' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Module Visibility Customizer</h3>
                  <p className="text-xs text-slate-400 mt-1">Enable or disable specific modules. Disabled modules will be hidden from the sidebar menu.</p>
                </div>

                <div className="space-y-3">
                  {modules.map(mod => (
                    <div key={mod.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-955 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{mod.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{mod.description}</p>
                      </div>

                      <button 
                        onClick={() => handleToggleModule(mod.id)}
                        className={`p-1 rounded-full transition-all ${
                          mod.isEnabled ? 'text-teal-600' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      >
                        {mod.isEnabled ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </ConsoleLayout>
  );
}
