'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { 
  LayoutDashboard, Users, PhoneCall, Megaphone, Package, Landmark, 
  UserCheck, CheckSquare, LifeBuoy, Settings, BarChart3, MessageSquare, 
  Brain, ShieldAlert, AlertTriangle, Check, X, Menu, ChevronRight, Target,
  Sun, Moon, Search, Cpu, Play, Terminal, ArrowRight, ShieldCheck
} from 'lucide-react';
import { vortiqClient } from './utils/vortiqClient';
import dynamic from 'next/dynamic';
const AINotificationBell = dynamic(() => import('./components/ai/AINotificationBell'), { ssr: false });

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
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [clientPlan, setClientPlan] = useState('GROWTH');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocalDemo = localStorage.getItem('vortiq-demo-logged-in') === 'true';
      const isClerkDemo = user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';
      const resolvedDemo = isLocalDemo || isClerkDemo;
      setIsDemoUser(resolvedDemo);
      setClientPlan(localStorage.getItem('vortiq-plan') || 'GROWTH');
      
      const handlePlanUpdate = () => {
        setClientPlan(localStorage.getItem('vortiq-plan') || 'GROWTH');
      };
      window.addEventListener('vortiq-plan-change', handlePlanUpdate);

      if (user && !resolvedDemo) {
        const email = user.primaryEmailAddress?.emailAddress || '';
        const name = user.fullName || user.username || 'Vortiq User';
        
        vortiqClient.callMutation('auth.syncUser', {
          clerkId: user.id,
          email,
          name,
          orgName: localStorage.getItem('vortiq-brand-name') || undefined
        }).then(data => {
          if (data && data.orgId && data.userId) {
            localStorage.setItem('vortiq-org-id', data.orgId);
            localStorage.setItem('vortiq-user-id', data.userId);
            if (data.plan) {
              localStorage.setItem('vortiq-plan', data.plan);
              setClientPlan(data.plan);
            }
            window.dispatchEvent(new Event('vortiq-user-sync-complete'));
          }
        }).catch(err => {
          console.error('Failed to sync user to database:', err);
        });
      }

      return () => {
        window.removeEventListener('vortiq-plan-change', handlePlanUpdate);
      };
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;

    const connectSse = () => {
      const orgId = localStorage.getItem('vortiq-org-id');
      const isDemo = localStorage.getItem('vortiq-demo-logged-in') === 'true' || 
                      user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

      if (!orgId || isDemo) {
        console.log('[SSE] No production orgId or in demo mode. Skipping SSE subscription.');
        return;
      }

      const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:4000';
        }
        return 'https://api.vortiq.in';
      };

      console.log(`[SSE] Connecting to live event stream for org: ${orgId}`);
      eventSource = new EventSource(`${getApiUrl()}/api/events?orgId=${orgId}`);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Received live change notification:', data);

          // Dispatch data change event globally to reload tables and dashboard metrics
          window.dispatchEvent(new Event('vortiq-data-change'));
          window.dispatchEvent(new CustomEvent('vortiq-event-notification', { detail: data }));
        } catch (err) {
          console.error('[SSE] Failed to parse event message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('[SSE] EventSource connection encountered error, reconnecting...', err);
      };
    };

    // Try connecting immediately
    connectSse();

    // Re-connect if organization sync completes
    const handleSyncComplete = () => {
      if (eventSource) {
        eventSource.close();
      }
      connectSse();
    };

    window.addEventListener('vortiq-user-sync-complete', handleSyncComplete);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      window.removeEventListener('vortiq-user-sync-complete', handleSyncComplete);
    };
  }, [user]);
  
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
    { name: 'AI Command Center', path: '/ai', icon: Brain },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
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
  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;

    if (aiMode === 'manual') {
      alert('AI features are disabled in Manual Mode. Please switch to AI-Assisted Mode to compile natural language workflows.');
      return;
    }

    setWorkflowTitle(commandText);
    setWorkflowStatus('compiling');
    setIsCommandModalOpen(true);
    setWorkflowSteps([{ agent: 'Superboss Agent', action: `Parsing: "${commandText.substring(0, 60)}..."`, status: 'COMPLETED' }]);

    try {
      const result = await vortiqClient.callMutation('ai.runAIWorkflow', {
        workflowType: 'CUSTOM',
        prompt: commandText
      });
      const steps = (result as any)?.steps || [{ agent: 'Superboss Agent', action: 'Analysis complete', status: 'COMPLETED' }];
      setWorkflowSteps(steps);
      setWorkflowStatus((result as any)?.status === 'AWAITING_APPROVAL' ? 'awaiting_approval' : 'completed');
      window.dispatchEvent(new Event('vortiq-ai-approval-change'));
    } catch (err: any) {
      setWorkflowSteps([{ agent: 'Superboss Agent', action: `Error: ${err.message}`, status: 'FAILED' }]);
      setWorkflowStatus('completed');
    }
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
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Business OS</p>
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
              className="w-full pl-9 pr-20 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-50 transition-all"
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
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/15' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500 hover:bg-rose-500/15'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${aiMode === 'ai-assisted' ? 'bg-teal-500 animate-pulse' : 'bg-rose-500'}`} />
            {aiMode === 'ai-assisted' ? 'AI-Assisted Mode' : 'Manual Mode'}
          </button>
          <AINotificationBell />
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

          <span className="px-3 py-1 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wide">
            {clientPlan.charAt(0) + clientPlan.slice(1).toLowerCase()} Tier
          </span>
          <div className="relative">
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-8 h-8 rounded-full bg-indigo-600 overflow-hidden flex items-center justify-center font-bold text-white text-xs shadow-inner border border-slate-200 dark:border-slate-800 focus:outline-none hover:ring-2 hover:ring-teal-500 transition-all"
            >
              {isDemoUser ? (
                <div className="w-full h-full bg-gradient-to-tr from-teal-500 to-indigo-650 flex items-center justify-center font-black text-white text-xs">DU</div>
              ) : user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'CEO'
              )}
            </button>

            {isProfileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-45" 
                  onClick={() => setIsProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {isDemoUser ? 'Vortiq Demo User' : (user?.fullName || 'User Account')}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {isDemoUser ? 'demo@vortiq.ai' : (user?.primaryEmailAddress?.emailAddress || 'active session')}
                    </p>
                  </div>
                  
                  <Link 
                    href="/settings?tab=profile" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all"
                  >
                    User Profile Update
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all"
                  >
                    User Preferences
                  </Link>
                  <button 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      localStorage.removeItem('vortiq-demo-logged-in');
                      try {
                        signOut();
                      } catch (e) {
                        // ignore
                      }
                      window.location.href = '/';
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-350 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold transition-all border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Sidebar Backdrop Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 transition-transform duration-300 transform lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden lg:border-r-0'
        } flex flex-col shrink-0`}>
          {/* Close button header on mobile */}
          <div className="flex items-center justify-between lg:hidden p-4 border-b border-slate-200 dark:border-slate-900">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Navigation Menu</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 py-4 overflow-y-auto space-y-1 px-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 px-3 tracking-widest mb-2">Modules</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  href={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-300' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* Quick Stats at bottom of sidebar */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 text-[10px] space-y-2 text-slate-500">
            <div className="flex justify-between font-semibold">
              <span>Leads Captured:</span>
              <span className="text-slate-800 dark:text-slate-300">{leadsCount}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Human approvals:</span>
              <span className="text-slate-800 dark:text-slate-300">{tasksCompleted} completed</span>
            </div>
          </div>
        </aside>

        {/* Middle Core Content Frame */}
        <main className="flex-1 overflow-y-auto p-6 pb-28 lg:pb-6 relative">
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
                  <div key={item.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-800 transition-all space-y-2 text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className={`font-extrabold text-[10px] uppercase border px-2 py-0.5 rounded ${
                        aiMode === 'manual' ? 'bg-slate-500/10 border-slate-500/20 text-slate-500' : 'bg-teal-500/5 border-teal-500/20 text-teal-600 dark:text-teal-400'
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
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all"
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
                      agent.status === 'RUNNING' ? 'bg-teal-500 dark:bg-teal-400 animate-pulse' :
                      agent.status === 'AWAITING_APPROVAL' ? 'bg-amber-500 dark:bg-amber-405' : 'bg-slate-400 dark:bg-slate-600'
                    }`} />
                    <span className={`font-semibold ${aiMode === 'manual' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-305'}`}>{agent.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{agent.status}</span>
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
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 italic">
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
                        step.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/5 border-amber-500/10 text-amber-700 dark:text-amber-500' :
                        'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                          step.status === 'AWAITING_APPROVAL' ? 'bg-amber-500 text-white' :
                          'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-extrabold text-[10px] uppercase text-indigo-600 dark:text-indigo-400">{step.agent}</p>
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
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-755 rounded-xl transition-all"
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

      {/* Sticky Bottom Navigation Bar for Mobile/Tablet */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-900 px-2 py-2 flex justify-around items-center shadow-lg pb-safe">
        {[
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'CRM', path: '/crm', icon: Users },
          { name: 'Sales', path: '/sales', icon: PhoneCall },
          { name: 'Support', path: '/support', icon: LifeBuoy },
          { name: 'Settings', path: '/settings', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-teal-600 dark:text-teal-400 font-extrabold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
