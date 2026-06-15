'use client';

import React, { useState } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  Megaphone, Plus, Sparkles, Brain, Eye, Send, 
  Calendar, BarChart3, Target, CheckCircle2, TrendingUp, RefreshCw,
  FolderOpen, ThumbsUp, Layers, Check, X, ShieldAlert, ArrowRight,
  TrendingDown, Globe, AlertCircle, ChevronRight
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

interface Campaign {
  id: string;
  name: string;
  platform: 'LinkedIn' | 'Twitter' | 'Facebook' | 'Instagram' | 'Google Ads' | 'Meta Ads';
  objective: string;
  budgetCap: number;
  spent: number;
  leadsSourced: number;
  cpl: number;
  status: 'DRAFT' | 'SENT_FOR_APPROVAL' | 'APPROVED' | 'RUNNING' | 'COMPLETED';
  copyVariants: string[];
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'scheduler' | 'approval' | 'ads'>('campaigns');

  // Social scheduler posts
  const [posts, setPosts] = useState([
    { id: 'POST-001', platform: 'LinkedIn', copy: 'Excited to announce VORTIQ Business OS is now powering over 100+ mid-size manufacturing setups across Maharashtra! 🇮🇳 #SME #India', scheduledFor: 'Today, 03:00 PM IST', status: 'SCHEDULED' },
    { id: 'POST-002', platform: 'Twitter', copy: 'Stop paying SaaS prices in USD that don\'t match India GST requirements. Vortiq Console has native GSTR-1, e-invoicing, and Razorpay triggers core. ⚡', scheduledFor: 'Tomorrow, 10:00 AM IST', status: 'SCHEDULED' },
    { id: 'POST-003', platform: 'Facebook', copy: 'Simplify your inventory audits and auto re-order sheets from Jindal Steel with our connected ops pipelines. 🏭', scheduledFor: '18 Jun, 09:00 AM IST', status: 'DRAFT' }
  ]);

  // Campaigns list
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { 
      id: 'CAMP-001', 
      name: 'Q3 Wholesale Lead Outreach', 
      platform: 'LinkedIn',
      objective: 'Lead Generation',
      budgetCap: 150000,
      spent: 85000,
      leadsSourced: 472,
      cpl: 180,
      status: 'RUNNING',
      copyVariants: [
        'Consolidate your B2B supply pipeline with Vortiq - direct HSN & GST triggers integrated.',
        'Mid-size manufacturing hubs: Automate your RFQ approvals. Get started with Vortiq OS today!'
      ]
    },
    { 
      id: 'CAMP-002', 
      name: 'Steel Fabricators Facebook Focus', 
      platform: 'Meta Ads',
      objective: 'Conversions',
      budgetCap: 200000,
      spent: 120000,
      leadsSourced: 500,
      cpl: 240,
      status: 'RUNNING',
      copyVariants: [
        'Scale your dispatch queues using modern logistics triggers. Shiprocket connected core.',
        'Tired of complex spreadsheet audits for SKU stock counts? Meet the Vortiq Inventory Engine.'
      ]
    },
    { 
      id: 'CAMP-003', 
      name: 'Automotive Parts Retargeting', 
      platform: 'Google Ads',
      objective: 'Lead Generation',
      budgetCap: 100000,
      spent: 0,
      leadsSourced: 0,
      cpl: 0,
      status: 'APPROVED',
      copyVariants: [
        'India\'s first AI-native Business Operating System. Try Vortiq OS for GST-compliant invoicing.'
      ]
    },
    { 
      id: 'CAMP-004', 
      name: 'South India Logistics Promo', 
      platform: 'LinkedIn',
      objective: 'Awareness',
      budgetCap: 75000,
      spent: 12000,
      leadsSourced: 88,
      cpl: 136,
      status: 'SENT_FOR_APPROVAL',
      copyVariants: [
        'Reduce transit delays with automated dispatch routing alerts. Learn more here.'
      ]
    }
  ]);

  // Ads Metrics
  const [googleCPL, setGoogleCPL] = useState(180);
  const [metaCPL, setMetaCPL] = useState(240);
  const [linkedinCPL, setLinkedinCPL] = useState(310);
  const [aiAnalysis, setAiAnalysis] = useState('Based on active CPL monitoring: Google Search Campaigns (CPL Rs 180) are running 25% more efficiently than Meta Ads (CPL Rs 240). LinkedIn is proving expensive (Rs 310). I recommend shifting Rs 35,000 from LinkedIn to Google Ads immediately.');

  // Form states - Wizard
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newCampName, setNewCampName] = useState('');
  const [newCampPlatform, setNewCampPlatform] = useState<'LinkedIn' | 'Twitter' | 'Facebook' | 'Instagram' | 'Google Ads' | 'Meta Ads'>('LinkedIn');
  const [newCampObjective, setNewCampObjective] = useState('Lead Generation');
  const [newCampBudget, setNewCampBudget] = useState(50000);
  const [newCampAudience, setNewCampAudience] = useState('Manufacturing Owners in Pune/Chennai');
  const [newCampCopy, setNewCampCopy] = useState('');
  const [newCampCTA, setNewCampCTA] = useState('https://vortiq.ai/demo');

  // Social post state
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [newPostPlatform, setNewPostPlatform] = useState('LinkedIn');
  const [newPostCopy, setNewPostCopy] = useState('');

  const [aiWorking, setAiWorking] = useState(false);

  // Campaign create handler
  const handleCreateCampaign = (status: 'DRAFT' | 'SENT_FOR_APPROVAL') => {
    if (!newCampName) return;
    const newCamp: Campaign = {
      id: `CAMP-00${campaigns.length + 1}`,
      name: newCampName,
      platform: newCampPlatform,
      objective: newCampObjective,
      budgetCap: newCampBudget,
      spent: 0,
      leadsSourced: 0,
      cpl: 0,
      status: status,
      copyVariants: [newCampCopy || 'Default landing copy placeholder']
    };
    setCampaigns([...campaigns, newCamp]);
    resetWizard();
  };

  const resetWizard = () => {
    setNewCampName('');
    setNewCampPlatform('LinkedIn');
    setNewCampObjective('Lead Generation');
    setNewCampBudget(50000);
    setNewCampAudience('Manufacturing Owners in Pune/Chennai');
    setNewCampCopy('');
    setNewCampCTA('https://vortiq.ai/demo');
    setWizardStep(1);
    setShowCampaignWizard(false);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCopy.trim()) return;
    const newP = {
      id: `POST-00${posts.length + 1}`,
      platform: newPostPlatform,
      copy: newPostCopy,
      scheduledFor: 'Scheduled manually',
      status: 'DRAFT'
    };
    setPosts([...posts, newP]);
    setNewPostCopy('');
    setIsAddingPost(false);
  };

  const handleAIGeneratePost = () => {
    setAiWorking(true);
    setTimeout(() => {
      setNewPostCopy(`🚀 Transform your business ops today. Vortiq Business OS combines CRM, invoicing, inventory, and payroll into one unified console. GST compliant out-of-the-box. 🇮🇳`);
      setAiWorking(false);
    }, 1000);
  };

  const handleAIGenerateCampaignCopy = () => {
    setAiWorking(true);
    setTimeout(() => {
      setNewCampCopy(`Looking to optimize your B2B supply logistics? 🏭 Vortiq Business OS lets you automate warehouse sheets, manage client leads, and clear GST returns without manual entries. Sign up for a trial!`);
      setAiWorking(false);
    }, 1000);
  };

  const handleAIAnalyzeAds = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiAnalysis(`Updated Ad Performance: Meta Ads CPL dropped to Rs 225. Google Search remains our most cost-efficient pipeline. Action: Generated an n8n webhook payload ready to adjust regional bid weights.`);
      setAiWorking(false);
    }, 1200);
  };

  const approveCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'APPROVED' } : c));
  };

  const rejectCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'DRAFT' } : c));
  };

  const marketingMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('campaign') || lower.includes('copy') || lower.includes('draft')) {
      return {
        answer: "Marketing Agent: Generated ad copy variants. Objective B2B Lead Gen targeting metal fabrication units. Active template: 'Automate sheet count logs with Vortiq OS'. Approved by Superboss checks.",
        logs: "Compiled copy draft variations for LinkedIn."
      };
    }
    if (lower.includes('budget') || lower.includes('allocate') || lower.includes('bid')) {
      return {
        answer: "Marketing Agent: Bid adjustment suggestion: Shifting Rs 25,000 budget from high-cost LinkedIn (Rs 310 CPL) to Google Search (Rs 180 CPL). n8n trigger compiled.",
        logs: "Simulated bid adjustment nodes for n8n webhook."
      };
    }
    return {
      answer: "Marketing Agent: Active and scanning campaign spends. Ask me to 'draft campaign copy' or 'optimize budget allocation'.",
      logs: "Scanned LinkedIn and Meta campaigns data."
    };
  };

  return (
    <ConsoleLayout>
      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-6">
        
        {/* Module Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400" />
              Marketing & Ad Campaigns
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Design multi-channel customer pipelines, schedule automated social posts, and audit ad CPL parameters.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setShowCampaignWizard(true);
                setActiveTab('campaigns');
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Campaign Wizard
            </button>
          </div>
        </div>

        {/* Marketing Agent Panel */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">MarketingAgent Assistant</h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">Active</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleAIAnalyzeAds}
            disabled={aiWorking}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Optimize Telemetry
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 overflow-x-auto">
          {[
            { id: 'campaigns', label: 'Campaigns Director', icon: Layers },
            { id: 'scheduler', label: 'Social Scheduler', icon: Calendar },
            { id: 'approval', label: 'Creative Approvals', icon: ThumbsUp },
            { id: 'ads', label: 'Ad Platforms Telemetry', icon: BarChart3 }
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

        {/* Wizard Form Slideout/Modal */}
        {showCampaignWizard && (
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg animate-fadeIn max-w-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  New Campaign Planner Wizard (Step {wizardStep} of 3)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Define ad objectives, budget splits, and AI generated variations.</p>
              </div>
              <button onClick={resetWizard} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Campaign Name</label>
                    <input 
                      type="text" 
                      value={newCampName}
                      onChange={(e) => setNewCampName(e.target.value)}
                      placeholder="e.g. Pune Autoparts Direct Outbound"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Platform</label>
                    <select 
                      value={newCampPlatform}
                      onChange={(e) => setNewCampPlatform(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      {['LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'Google Ads', 'Meta Ads'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Campaign Objective</label>
                    <select 
                      value={newCampObjective}
                      onChange={(e) => setNewCampObjective(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="Lead Generation">Lead Generation</option>
                      <option value="Conversions">Conversions</option>
                      <option value="Awareness">Awareness</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Budget Cap (INR)</label>
                    <input 
                      type="number" 
                      value={newCampBudget}
                      onChange={(e) => setNewCampBudget(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    Next Step <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ideal Client Target Audience</label>
                  <input 
                    type="text" 
                    value={newCampAudience}
                    onChange={(e) => setNewCampAudience(e.target.value)}
                    placeholder="e.g. Supply Chain Managers, Mumbai Logistics Managers"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Ad Copy / Pitch Variant</label>
                    <button 
                      type="button" 
                      onClick={handleAIGenerateCampaignCopy}
                      className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5 hover:underline"
                    >
                      <Brain className="w-3 h-3" /> Generate copy using AI
                    </button>
                  </div>
                  <textarea 
                    value={newCampCopy}
                    onChange={(e) => setNewCampCopy(e.target.value)}
                    rows={4}
                    placeholder="Provide campaign pitch lines..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button 
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    Next Step <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Call-To-Action Link (CTA)</label>
                  <input 
                    type="url" 
                    value={newCampCTA}
                    onChange={(e) => setNewCampCTA(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Confirmation Summary:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <p>Name: <span className="font-semibold text-slate-800 dark:text-slate-200">{newCampName || 'Not Set'}</span></p>
                    <p>Platform: <span className="font-semibold text-slate-800 dark:text-slate-200">{newCampPlatform}</span></p>
                    <p>Budget Cap: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(newCampBudget)}</span></p>
                    <p>Objective: <span className="font-semibold text-slate-800 dark:text-slate-200">{newCampObjective}</span></p>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button 
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCreateCampaign('DRAFT')}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                    >
                      Save Draft
                    </button>
                    <button 
                      onClick={() => handleCreateCampaign('SENT_FOR_APPROVAL')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Request Approval
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Campaigns Director */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Active Marketing Campaigns</h3>
                <span className="text-[10px] text-slate-500 font-semibold">{campaigns.length} total records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Campaign Name</th>
                      <th className="p-4">Platform</th>
                      <th className="p-4">Objective</th>
                      <th className="p-4">Budget Cap</th>
                      <th className="p-4">Spent</th>
                      <th className="p-4">Leads</th>
                      <th className="p-4">Avg CPL</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300 font-medium">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-950">
                            {c.platform}
                          </span>
                        </td>
                        <td className="p-4">{c.objective}</td>
                        <td className="p-4 font-semibold">{formatINR(c.budgetCap)}</td>
                        <td className="p-4 text-slate-500">{formatINR(c.spent)}</td>
                        <td className="p-4">{c.leadsSourced}</td>
                        <td className="p-4 font-bold text-teal-600 dark:text-teal-400">
                          {c.cpl > 0 ? `Rs ${c.cpl}` : '--'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            c.status === 'RUNNING' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' :
                            c.status === 'APPROVED' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-950' :
                            c.status === 'SENT_FOR_APPROVAL' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-750'
                          }`}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {c.status === 'SENT_FOR_APPROVAL' && (
                              <>
                                <button 
                                  onClick={() => approveCampaign(c.id)}
                                  className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded text-emerald-600 dark:text-emerald-400"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => rejectCampaign(c.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-red-650 dark:text-red-400"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub copy variants view */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl space-y-3 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-teal-650" /> Copy variant repository
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map(c => (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2 text-xs">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">{c.name}</p>
                    <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-850 pt-2 text-slate-500">
                      {c.copyVariants.map((varText, idx) => (
                        <p key={idx} className="italic">"{varText}"</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Social Scheduler */}
        {activeTab === 'scheduler' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" /> Scheduled Feeds List
                  </h3>
                  <button 
                    onClick={() => setIsAddingPost(!isAddingPost)}
                    className="text-xs text-teal-650 dark:text-teal-400 font-bold hover:underline"
                  >
                    + Add New Post
                  </button>
                </div>

                {isAddingPost && (
                  <form onSubmit={handleCreatePost} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Schedule Post Details</span>
                      <button 
                        type="button" 
                        onClick={handleAIGeneratePost}
                        className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5 hover:underline"
                      >
                        <Brain className="w-3 h-3" /> AI Post Generator
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={newPostPlatform} 
                        onChange={(e) => setNewPostPlatform(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs"
                      >
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Twitter">Twitter</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Today, 06:00 PM IST" 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs"
                        disabled
                      />
                    </div>

                    <textarea 
                      value={newPostCopy} 
                      onChange={(e) => setNewPostCopy(e.target.value)}
                      rows={3}
                      placeholder="Type your copy here..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs resize-none"
                    />

                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1.5 bg-teal-655 bg-teal-600 text-white rounded text-xs font-bold hover:bg-teal-500">
                        Schedule Post
                      </button>
                      <button type="button" onClick={() => setIsAddingPost(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-bold">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-2">
                        <span className="font-extrabold text-[10px] uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-950 px-2 py-0.5 rounded">
                          {post.platform}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{post.scheduledFor}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">"{post.copy}"</p>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">ID: {post.id}</span>
                        <span className={`px-2 py-0.5 rounded border ${
                          post.status === 'SCHEDULED' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-750'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Social Integrations Check</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                    <span className="font-semibold">LinkedIn Business Page</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-950">CONNECTED</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                    <span className="font-semibold">Facebook Ad Account</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-950">CONNECTED</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                    <span className="font-semibold">Google Search Console</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-950">RE-AUTH REQUIRED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Approvals Workflow */}
        {activeTab === 'approval' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Creative & Campaign Approvals (Human In The Loop)</h3>
            </div>

            <div className="p-6 space-y-4">
              {campaigns.filter(c => c.status === 'SENT_FOR_APPROVAL').length === 0 ? (
                <p className="text-xs text-slate-500 font-semibold text-center py-6">No campaigns currently awaiting creative approval.</p>
              ) : (
                <div className="space-y-4">
                  {campaigns.filter(c => c.status === 'SENT_FOR_APPROVAL').map((c) => (
                    <div key={c.id} className="p-5 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.name}</h4>
                          <p className="text-[10px] text-slate-400">Targeting {c.platform} • Budget {formatINR(c.budgetCap)}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-950 uppercase tracking-wider">Awaiting Verification</span>
                      </div>

                      <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-850 text-xs">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Draft Copy Variant</span>
                        <p className="italic text-slate-650 dark:text-slate-350">"{c.copyVariants[0]}"</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-850">
                        <button 
                          onClick={() => rejectCampaign(c.id)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-red-650 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Reject Copy
                        </button>
                        <button 
                          onClick={() => approveCampaign(c.id)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                          Approve & Deploy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Ad Platforms Telemetry */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Google Ads */}
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Google Search Network</span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Rs {googleCPL}</h4>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-950 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" /> -12% CPL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">High search intent keyword bid adjustments executing automatically via n8n cron hook.</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-slate-500">
                  <div>
                    <p>Total Spent</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">Rs 1.45L</p>
                  </div>
                  <div>
                    <p>Conversions</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">805 leads</p>
                  </div>
                </div>
              </div>

              {/* Meta Ads */}
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Meta (FB & Insta)</span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Rs {metaCPL}</h4>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-950 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> +5% CPL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Visual content variants scoring high on engagement. Cost adjustments advised by MarketingAgent.</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-slate-500">
                  <div>
                    <p>Total Spent</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">Rs 1.20L</p>
                  </div>
                  <div>
                    <p>Conversions</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">500 leads</p>
                  </div>
                </div>
              </div>

              {/* LinkedIn Ads */}
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">LinkedIn Account Managed</span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Rs {linkedinCPL}</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-855 flex items-center gap-0.5">
                    -- stable CPL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Premium target audience (C-Suite executives in Bangalore/Mumbai). High CPL is expected here.</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-slate-500">
                  <div>
                    <p>Total Spent</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">Rs 97,000</p>
                  </div>
                  <div>
                    <p>Conversions</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">312 leads</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Campaign CPL comparison Chart mockup */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Relative Cost-Per-Lead Comparison Grid</h4>
              <div className="h-40 flex items-end gap-6 pt-4 px-4 border-b border-l border-slate-250 dark:border-slate-800">
                <div className="w-full bg-teal-500/20 dark:bg-teal-500/10 border-t-2 border-teal-500 flex flex-col justify-end items-center" style={{ height: '45%' }}>
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mb-1">Google (Rs 180)</span>
                </div>
                <div className="w-full bg-indigo-500/20 dark:bg-indigo-500/10 border-t-2 border-indigo-500 flex flex-col justify-end items-center" style={{ height: '60%' }}>
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mb-1">Meta (Rs 240)</span>
                </div>
                <div className="w-full bg-amber-500/20 dark:bg-amber-500/10 border-t-2 border-amber-500 flex flex-col justify-end items-center" style={{ height: '80%' }}>
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mb-1">LinkedIn (Rs 310)</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <ModuleAgentSidebar 
        agentName="Marketing Campaign Agent"
        permissionsScope="Permissions Scope: Read marketing budget, modify campaign draft parameters, update social scheduling queue, trigger ad spend reallocations via n8n hooks."
        suggestedPrompts={[
          "draft campaign copy for manufacturing",
          "optimize budget allocation from LinkedIn",
          "list active social queue drafts"
        ]}
        defaultMemoryLogs={[
          "Marketing Agent online.",
          "Scanned 4 campaigns. Identified Google Ads as most cost efficient (CPL Rs 180).",
          "3 social post drafts queued in local memory."
        ]}
        mockResponseMapper={marketingMockResponse}
      />

      </div>
    </ConsoleLayout>
  );
}
