'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, PhoneCall, Megaphone, Package, Landmark, 
  UserCheck, CheckSquare, LifeBuoy, Settings, BarChart3, MessageSquare, 
  Brain, ShieldAlert, AlertTriangle, Check, X, Menu, ChevronRight, Target,
  Sun, Moon, Search, Cpu, Play, Terminal, ArrowRight, ShieldCheck
} from 'lucide-react';

// Indian Rupee Formatter helper
export const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val).replace('INR', 'Rs');
};

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export default function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Dual-mode AI config state
  const [aiMode, setAiMode] = useState<'manual' | 'ai-assisted'>('ai-assisted');
  
  // Global NLP command bar state
  const [commandText, setCommandText] = useState('');
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'compiling' | 'awaiting_approval' | 'approved' | 'executing' | 'completed'>('idle');
  const [requireApprovalBeforeSend, setRequireApprovalBeforeSend] = useState(true);

  // Real-time state mock shared values
  const [tasksCompleted, setTasksCompleted] = useState(14);
  const [leadsCount, setLeadsCount] = useState(18);
  
  // Human Review Queue State
  const [reviewQueue, setReviewQueue] = useState([
    { id: 'job-101', agent: 'Finance Agent', description: 'Generate GST invoice & IRN for Tata Motors (Rs 4,50,000)', type: 'FINANCE' },
    { id: 'job-102', agent: 'Legal Agent', description: 'Approve NDA agreement draft with Reliance Retail', type: 'LEGAL' },
    { id: 'job-103', agent: 'Ops Agent', description: 'Approve Purchase Order draft for 500 units steel sheets from Jindal Steel', type: 'OPS' },
    { id: 'job-104', agent: 'Sales Agent', description: 'Email campaign blast to 45 B2B wholesale manufacturers', type: 'SALES' }
  ]);

  // Active AI Agents
  const agents = [
    { name: 'Superboss Command AI', status: aiMode === 'manual' ? 'SUSPENDED' : 'RUNNING', lastActive: 'Just now' },
    { name: 'CRM Pipeline Agent', status: aiMode === 'manual' ? 'SUSPENDED' : 'IDLE', lastActive: '5m ago' },
    { name: 'Sales Agent', status: aiMode === 'manual' ? 'SUSPENDED' : 'RUNNING', lastActive: 'Just now' },
    { name: 'Marketing Agent', status: aiMode === 'manual' ? 'SUSPENDED' : 'IDLE', lastActive: '2h ago' },
    { name: 'Lead Engine', status: aiMode === 'manual' ? 'SUSPENDED' : 'RUNNING', lastActive: '1m ago' },
    { name: 'Finance Agent', status: aiMode === 'manual' ? 'SUSPENDED' : 'AWAITING_APPROVAL', lastActive: '10m ago' },
    { name: 'HR Manager', status: aiMode === 'manual' ? 'SUSPENDED' : 'IDLE', lastActive: '1d ago' },
    { name: 'Voice Caller', status: aiMode === 'manual' ? 'SUSPENDED' : 'RUNNING', lastActive: 'Just now' }
  ];

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM & Pipelines', path: '/crm', icon: Users },
    { name: 'Lead Engine', path: '/lead-engine', icon: Target },
    { name: 'Sales & Calls', path: '/sales', icon: PhoneCall },
    { name: 'Marketing', path: '/marketing', icon: Megaphone },
    { name: 'Inventory & SKUs', path: '/inventory', icon: Package },
    { name: 'Finance & GST', path: '/finance', icon: Landmark },
    { name: 'HR & Payroll', path: '/hr', icon: UserCheck },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Support', path: '/support', icon: LifeBuoy },
    { name: 'AI Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'WhatsApp Briefings', path: '/briefings', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(activeTheme);
    
    const storedAiMode = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
    if (storedAiMode) {
      setAiMode(storedAiMode);
    } else {
      localStorage.setItem('vortiq-ai-mode', 'ai-assisted');
    }

    // Listen to settings updates
    const handleStorageChange = () => {
      const current = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
      if (current) setAiMode(current);
    };
    window.addEventListener('vortiq-ai-mode-change', handleStorageChange);
    return () => window.removeEventListener('vortiq-ai-mode-change', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vortiq-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vortiq-theme', 'light');
    }
  };

  const toggleAiMode = () => {
    const nextMode = aiMode === 'manual' ? 'ai-assisted' : 'manual';
    setAiMode(nextMode);
    localStorage.setItem('vortiq-ai-mode', nextMode);
    window.dispatchEvent(new Event('vortiq-ai-mode-change'));
  };

  const handleApprove = (id: string) => {
    setReviewQueue(prev => prev.filter(item => item.id !== id));
    setTasksCompleted(t => t + 1);
  };

  const handleReject = (id: string) => {
    setReviewQueue(prev => prev.filter(item => item.id !== id));
  };

  // NLP command parser compiler
  const handleExecuteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;

    if (aiMode === 'manual') {
      alert('AI features are disabled in Manual Mode. Please switch to AI-Assisted Mode to compile natural language workflows.');
      return;
    }

    setWorkflowTitle(commandText);
    setWorkflowStatus('compiling');
    setIsCommandModalOpen(true);
    setWorkflowSteps([]);

    // Simulate multi-agent compilation steps
    setTimeout(() => {
      const lower = commandText.toLowerCase();
      let steps = [];

      if (lower.includes('lead') || lower.includes('follow up') || lower.includes('contact')) {
        steps = [
          { agent: 'Lead Engine Agent', action: 'Filter and segment hot B2B leads from database (Score > 85)', status: 'COMPLETED' },
          { agent: 'CRM Agent', action: 'Validate no active duplicates exist for target candidates', status: 'COMPLETED' },
          { agent: 'Sales Agent', action: 'Auto-assign follow-up phone tasks to sales reps Sneha and Rahul', status: 'PENDING' },
          { agent: 'WhatsApp Briefing Agent', action: 'Draft reminders for daily manager briefs', status: 'PENDING' }
        ];
      } else if (lower.includes('invoice') || lower.includes('payment') || lower.includes('remind')) {
        steps = [
          { agent: 'Finance Agent', action: 'Scan ledger database for invoices overdue > 7 days', status: 'COMPLETED' },
          { agent: 'Superboss Agent', action: 'Calculate outstanding totals: Rs 4,50,000 across 3 clients', status: 'COMPLETED' },
          { agent: 'Support Agent', action: 'Verify email communication history logs for client flags', status: 'COMPLETED' },
          { agent: 'Finance Agent', action: 'Draft payment reminder emails & WhatsApp notification links', status: 'AWAITING_APPROVAL', isSensitive: true }
        ];
      } else if (lower.includes('ticket') || lower.includes('support')) {
        steps = [
          { agent: 'Support Agent', action: 'Scan support queue for unassigned tickets', status: 'COMPLETED' },
          { agent: 'Superboss Agent', action: 'Check employee workload allocation (Sneha: 4, Rahul: 8)', status: 'COMPLETED' },
          { agent: 'Support Agent', action: 'Auto-assign ticket #TC-902 to Sneha Rao and generate draft auto-response', status: 'PENDING' }
        ];
      } else {
        steps = [
          { agent: 'Superboss Agent', action: 'Parse request: "' + commandText + '"', status: 'COMPLETED' },
          { agent: 'Consolidated Analyst', action: 'Extract relevant tables contexts and compile audit metrics', status: 'COMPLETED' },
          { agent: 'Module Agent', action: 'Schedule automated workflow execution sequence', status: 'PENDING' }
        ];
      }

      setWorkflowSteps(steps);
      setWorkflowStatus('awaiting_approval');
    }, 1000);
  };

  const handleRunWorkflow = () => {
    setWorkflowStatus('executing');
    
    // Simulate execution step-by-step
    let currentStep = 0;
    const interval = setInterval(() => {
      setWorkflowSteps(prev => {
        const next = [...prev];
        const pendingIdx = next.findIndex(s => s.status === 'PENDING' || s.status === 'AWAITING_APPROVAL');
        if (pendingIdx !== -1) {
          next[pendingIdx].status = 'COMPLETED';
        }
        return next;
      });

      currentStep++;
      if (currentStep >= workflowSteps.length) {
        clearInterval(interval);
        setWorkflowStatus('completed');
        setTasksCompleted(t => t + 1);
        setCommandText('');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950 transition-colors duration-200">
      
      {/* Universal Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
            V
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">VORTIQ</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-505 font-semibold uppercase tracking-wider">Business OS</p>
          </div>
        </div>

        {/* NLP Command Box */}
        <form onSubmit={handleExecuteCommand} className="hidden lg:flex items-center relative max-w-md w-full mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              placeholder={aiMode === 'manual' ? 'AI disabled in Manual Mode...' : 'Ask AI / compile workflow (e.g. "remind unpaid clients")...'}
              disabled={aiMode === 'manual'}
              className="w-full pl-9 pr-20 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-50 transition-all"
            />
            <button 
              type="submit"
              disabled={aiMode === 'manual' || !commandText.trim()}
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-white font-black rounded-lg transition-all"
            >
              Ask AI
            </button>
          </div>
        </form>

        {/* Global Agentic Status Indicators */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleAiMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
              aiMode === 'ai-assisted' 
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-650 dark:text-teal-400 hover:bg-teal-500/15' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-650 dark:text-rose-455 hover:bg-rose-500/15'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${aiMode === 'ai-assisted' ? 'bg-teal-500 animate-pulse' : 'bg-rose-500'}`} />
            {aiMode === 'ai-assisted' ? 'AI-Assisted Mode' : 'Manual Mode'}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-450 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            {reviewQueue.length} approvals
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>

          <span className="px-3 py-1 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-750 font-bold uppercase tracking-wide">
            Growth Tier
          </span>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-inner">
            CEO
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className={`border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/20 backdrop-blur-sm transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full overflow-hidden border-r-0'
        } flex flex-col shrink-0`}>
          <div className="flex-1 py-4 overflow-y-auto space-y-1 px-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 px-3 tracking-widest mb-2">Modules</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-650 dark:text-teal-300' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-405' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* Quick Stats at bottom of sidebar */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 text-[10px] space-y-2 text-slate-500">
            <div className="flex justify-between font-semibold">
              <span>Leads Captured:</span>
              <span className="text-slate-800 dark:text-slate-350">{leadsCount}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Human approvals:</span>
              <span className="text-slate-800 dark:text-slate-350">{tasksCompleted} completed</span>
            </div>
          </div>
        </aside>

        {/* Middle Core Content Frame */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Right Sidebar: AI Agent Monitor & Human Approval Queue */}
        <aside className="hidden xl:flex w-80 border-l border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/60 p-5 flex-col overflow-y-auto shrink-0 gap-6">
          
          {/* AI Human-in-the-Loop Review Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Human Review Queue
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                {reviewQueue.length}
              </span>
            </div>

            {reviewQueue.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500">
                No items pending human review.
              </div>
            ) : (
              <div className="space-y-3">
                {reviewQueue.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-255 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 transition-all space-y-2 text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className={`font-extrabold text-[10px] uppercase border px-2 py-0.5 rounded ${
                        aiMode === 'manual' ? 'bg-slate-500/10 border-slate-500/20 text-slate-500' : 'bg-teal-500/5 border-teal-500/20 text-teal-650 dark:text-teal-405'
                      }`}>
                        {item.agent}
                      </span>
                      <span className="text-[9px] text-slate-550 font-semibold">{item.id}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{item.description}</p>
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => handleApprove(item.id)}
                        className="flex-1 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(item.id)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-750 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Agent Registry */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-900 pt-6">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" /> Active AI Agent Registry
            </h3>
            <div className="space-y-2.5">
              {agents.map((agent) => (
                <div key={agent.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      aiMode === 'manual' ? 'bg-slate-400' :
                      agent.status === 'RUNNING' ? 'bg-teal-500 dark:bg-teal-405 animate-pulse' :
                      agent.status === 'AWAITING_APPROVAL' ? 'bg-amber-500 dark:bg-amber-405' : 'bg-slate-400 dark:bg-slate-600'
                    }`} />
                    <span className={`font-semibold ${aiMode === 'manual' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-305'}`}>{agent.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-450 dark:text-slate-505 font-semibold">{agent.status}</span>
                </div>
              ))}
            </div>
          </div>
          
        </aside>

      </div>

      {/* Global NLP Workflow Compiler Modal */}
      {isCommandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <Cpu className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-spin" /> NLP Agentic Workflow Parser
              </h3>
              <button 
                onClick={() => setIsCommandModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">User Prompt Input</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 italic">
                "{workflowTitle}"
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Compiled execution steps</span>
                {workflowStatus === 'compiling' && (
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold animate-pulse">Analyzing prompt context...</span>
                )}
                {workflowStatus === 'awaiting_approval' && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Awaiting Owner Approval
                  </span>
                )}
                {workflowStatus === 'executing' && (
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold animate-pulse">Running multi-agent execution...</span>
                )}
                {workflowStatus === 'completed' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Workflow Completed
                  </span>
                )}
              </div>

              {workflowStatus === 'compiling' ? (
                <div className="space-y-2 py-4">
                  <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded w-full animate-pulse border" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded w-5/6 animate-pulse border" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded w-2/3 animate-pulse border" />
                </div>
              ) : (
                <div className="space-y-2">
                  {workflowSteps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 border rounded-2xl text-xs flex items-center justify-between gap-3 ${
                        step.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                        step.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/5 border-amber-500/10 text-amber-700 dark:text-amber-450' :
                        'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-855 text-slate-650 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                          step.status === 'AWAITING_APPROVAL' ? 'bg-amber-500 text-white' :
                          'bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-extrabold text-[10px] uppercase text-indigo-650 dark:text-indigo-400">{step.agent}</p>
                          <p className="font-semibold mt-0.5">{step.action}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase shrink-0">
                        {step.status === 'AWAITING_APPROVAL' ? 'Awaiting Human' : step.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safety triggers */}
            {workflowStatus === 'awaiting_approval' && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 text-amber-700 dark:text-amber-400 rounded-2xl space-y-2 text-[10px] font-semibold leading-relaxed">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-405">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> DPDP Compliance & Safety Override Triggered
                </div>
                <p>
                  This request contains sensitive tasks (sending notifications/updating files).
                  Verification: The workflow is compliant with NCPR dial registers and DPDP opt-out tags.
                </p>
                <div className="flex items-center gap-2 pt-1 border-t border-amber-500/10">
                  <input 
                    type="checkbox" 
                    id="require-review"
                    checked={requireApprovalBeforeSend}
                    onChange={(e) => setRequireApprovalBeforeSend(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500" 
                  />
                  <label htmlFor="require-review" className="cursor-pointer font-bold">Require final approval for each WhatsApp/Email message before sending</label>
                </div>
              </div>
            )}

            {/* Modal Buttons footer */}
            <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-bold">
              {workflowStatus === 'awaiting_approval' && (
                <>
                  <button 
                    onClick={handleRunWorkflow}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl flex items-center gap-1 shadow-md shadow-teal-500/25 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Approve & Execute
                  </button>
                  <button 
                    onClick={() => {
                      alert('Manual workflow fallback active. Auto tasks dismissed.');
                      setIsCommandModalOpen(false);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-755 rounded-xl transition-all"
                  >
                    Manual Fallback
                  </button>
                </>
              )}
              {workflowStatus === 'completed' && (
                <button 
                  onClick={() => setIsCommandModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl transition-all"
                >
                  Close Workflow
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
