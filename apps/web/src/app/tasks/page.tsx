'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  CheckSquare, Plus, Sparkles, Brain, Trash2, 
  Layers, Check, X, ShieldCheck, Clock, RefreshCw,
  MessageSquare, User, ArrowRight, Link2, AlertCircle, Play,
  Filter, Settings
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';
import { vortiqClient } from '../utils/vortiqClient';
import dynamic from 'next/dynamic';
const ModuleAIPanel = dynamic(() => import('../components/ai/ModuleAIPanel'), { ssr: false });
const DataImportWizard = dynamic(() => import('../components/DataImportWizard'), { ssr: false });
const DataExportModal = dynamic(() => import('../components/DataExportModal'), { ssr: false });
const FilterBuilder = dynamic(() => import('../components/FilterBuilder'), { ssr: false });
const CustomFieldManager = dynamic(() => import('../components/CustomFieldManager'), { ssr: false });
const DocumentAttachmentPanel = dynamic(() => import('../components/DocumentAttachmentPanel'), { ssr: false });
const RelatedRecordsPanel = dynamic(() => import('../components/RelatedRecordsPanel'), { ssr: false });
const AuditHistoryPanel = dynamic(() => import('../components/AuditHistoryPanel'), { ssr: false });

interface Task {
  id: string;
  name: string;
  stage: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  dependencyId?: string;
  assignedTo: string;
  dueDate: string;
  comments: { user: string; text: string; time: string }[];
  isRecurring: boolean;
  recurrence?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: 'e0a1b023-e123-4567-89ab-cdef01234567', 
      name: 'Follow up with Tata Motors procurement regarding pre-launch specs', 
      stage: 'TODO', 
      priority: 'P1', 
      assignedTo: 'Amit Sharma', 
      dueDate: 'Today, 05:00 PM',
      comments: [
        { user: 'SalesAgent (AI)', text: 'Lead score is 96. High conversion propensity.', time: '2h ago' }
      ],
      isRecurring: false
    },
    { 
      id: 'e0b2c034-f234-5678-90ab-cdef12345678', 
      name: 'Verify sheet metal levels in Pune Warehouse A', 
      stage: 'IN_PROGRESS', 
      priority: 'P2', 
      assignedTo: 'Priya Patel', 
      dueDate: 'Tomorrow',
      comments: [
        { user: 'OpsAgent (AI)', text: 'Stock level is 2 Tons (threshold is 10).', time: '10m ago' }
      ],
      isRecurring: false
    },
    { 
      id: 'e0c3d045-a345-6789-01ab-cdef23456789', 
      name: 'File June GSTR-1 returns JSON output on GST Portal', 
      stage: 'TODO', 
      priority: 'P1', 
      dependencyId: 'e0b2c034-f234-5678-90ab-cdef12345678', 
      assignedTo: 'Manoj Kumar', 
      dueDate: '25 Jun 2026',
      comments: [],
      isRecurring: true,
      recurrence: 'MONTHLY'
    },
    { 
      id: 'e0d4e056-b456-7890-12ab-cdef34567890', 
      name: 'Draft NDA contract agreement with Reliance Retail', 
      stage: 'DONE', 
      priority: 'P3', 
      assignedTo: 'Rahul Sen', 
      dueDate: 'Completed yesterday',
      comments: [
        { user: 'Rahul Sen', text: 'Draft uploaded in CRM attachment drawer.', time: '1d ago' }
      ],
      isRecurring: false
    }
  ]);
  const [recurringTemplates, setRecurringTemplates] = useState<any[]>([
    { id: 'REC-101', name: 'Daily Outbound NCPR Scrub Check', frequency: 'DAILY', assignee: 'Amit Sharma', isActive: true },
    { id: 'REC-102', name: 'Weekly Stock Audit Reconciliation', frequency: 'WEEKLY', assignee: 'Priya Patel', isActive: true },
    { id: 'REC-103', name: 'Monthly GSTR-1 Tax File Export', frequency: 'MONTHLY', assignee: 'Finance Manager', isActive: true }
  ]);
  const [delegateRules, setDelegateRules] = useState<any[]>([
    { id: 'RULE-001', category: 'Sales Leads / Inquiries', targetOwner: 'Amit Sharma', condition: 'Lead Score > 80', isActive: true },
    { id: 'RULE-002', category: 'Stock adjustments / Warehouse', targetOwner: 'Priya Patel', condition: 'Warehouse A location', isActive: true },
    { id: 'RULE-003', category: 'Code / Technical setups', targetOwner: 'Rahul Sen', condition: 'BYOK API changes', isActive: true }
  ]);
  const [aiAnalysis, setAiAnalysis] = useState('TaskAgent Monitor: 3 active task tracks analyzed. e0c3d045-a345-6789-01ab-cdef23456789 is blocked pending completion of e0b2c034-f234-5678-90ab-cdef12345678. Auto-delegation rules ran: Sourced leads allocated to Amit.');
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  const { user, isLoaded } = useUser();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clerkDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';
      const localDemo = localStorage.getItem('vortiq-demo-logged-in') === 'true';
      setIsDemo(clerkDemo || localDemo);
    }
  }, [isLoaded, user]);

  // Sync Task Metrics to Dashboard Telemetry
  const syncTaskMetricsToDashboard = (updatedTasks: Task[]) => {
    if (isDemo) return;
    const completedCount = updatedTasks.filter(t => t.stage === 'DONE').length;

    const savedMetricsStr = localStorage.getItem('vortiq-user-metrics');
    let currentMetrics = {
      healthScore: 100,
      revenue: 0,
      targetAmount: 1500000,
      leadsToday: 0,
      tasksCompleted: 0,
      activeAgents: 8,
      efficiencyScore: 100,
      openTickets: 0,
      activeCampaigns: 0,
      briefingsSent: 0,
      receivables: 0,
      payoutsDone: 0,
      attendancePresent: 0,
      attendanceTotal: 0,
      adClicks: 0
    };
    if (savedMetricsStr) {
      try {
        currentMetrics = JSON.parse(savedMetricsStr);
      } catch (e) {}
    }
    
    currentMetrics.tasksCompleted = completedCount;
    localStorage.setItem('vortiq-user-metrics', JSON.stringify(currentMetrics));
    window.dispatchEvent(new Event('vortiq-user-metrics-change'));
  };

  const refreshTasks = () => {
    if (isLoaded && !isDemo) {
      vortiqClient.callQuery('tasks.tasksList').then(res => {
        if (res && res.length > 0) {
          const mapped = res.map((t: any) => ({
            id: t.id,
            name: t.title,
            stage: t.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
            priority: t.priority as 'P1' | 'P2' | 'P3' | 'P4',
            assignedTo: 'Amit Sharma', // default
            dueDate: t.dueAt ? new Date(t.dueAt).toLocaleDateString() : 'No date',
            comments: [],
            isRecurring: t.isRecurring
          }));
          setTasks(mapped);
          syncTaskMetricsToDashboard(mapped);
        } else {
          setTasks([]);
          syncTaskMetricsToDashboard([]);
        }
      }).catch(err => {
        console.error('Failed to load tasks from DB, fallback to localStorage:', err);
        const savedTasks = localStorage.getItem('vortiq-tasks');
        if (savedTasks) {
          try {
            const parsed = JSON.parse(savedTasks);
            setTasks(parsed);
            syncTaskMetricsToDashboard(parsed);
          } catch (e) {
            setTasks([]);
            syncTaskMetricsToDashboard([]);
          }
        } else {
          setTasks([]);
          syncTaskMetricsToDashboard([]);
        }
      });

      const savedRec = localStorage.getItem('vortiq-recurring-templates');
      const savedDel = localStorage.getItem('vortiq-delegate-rules');

      if (savedRec) {
        try { setRecurringTemplates(JSON.parse(savedRec)); } catch (e) {}
      } else {
        setRecurringTemplates([]);
      }

      if (savedDel) {
        try { setDelegateRules(JSON.parse(savedDel)); } catch (e) {}
      } else {
        setDelegateRules([]);
      }
      setAiAnalysis("TaskAgent Monitor: Connected client database loaded.");
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (!isDemo) {
        setTasks([]);
        setRecurringTemplates([]);
        setDelegateRules([]);
        refreshTasks();
      } else {
        // Keeps defaults for demo
      }
    }
  }, [isLoaded, isDemo]);

  useEffect(() => {
    if (isDemo) return;
    const handleDataChange = () => {
      refreshTasks();
    };
    window.addEventListener('vortiq-data-change', handleDataChange);
    return () => {
      window.removeEventListener('vortiq-data-change', handleDataChange);
    };
  }, [isDemo, isLoaded]);

  const [activeTab, setActiveTab] = useState<'board' | 'recurring' | 'delegation'>('board');



  // Form States - Add Task
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStage, setNewStage] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [newPriority, setNewPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P2');
  const [newAssignee, setNewAssignee] = useState('Amit Sharma');
  const [newDependency, setNewDependency] = useState('');
  const [newDueDate, setNewDueDate] = useState('Today');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Comment input state
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const [aiWorking, setAiWorking] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');
    if (!newName.trim()) {
      setValidationError('Task Title is required.');
      return;
    }

    setIsSubmitting(true);

    if (!isDemo) {
      vortiqClient.callMutation('tasks.tasksCreate', {
        title: newName.trim(),
        description: 'Linked details',
        status: newStage,
        priority: newPriority
      }).then(t => {
        const newT: Task = {
          id: t.id,
          name: t.title,
          stage: t.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
          priority: t.priority as 'P1' | 'P2' | 'P3' | 'P4',
          assignedTo: newAssignee,
          dueDate: newDueDate,
          comments: [],
          isRecurring: t.isRecurring
        };
        const updated = [...tasks, newT];
        setTasks(updated);
        syncTaskMetricsToDashboard(updated);
        setSuccessMessage('Task created successfully!');
        setTimeout(() => {
          resetForm();
          setSuccessMessage('');
        }, 1500);
      }).catch(err => {
        setValidationError(err.message || 'Failed to create task in database');
      }).finally(() => {
        setIsSubmitting(false);
      });
    } else {
      const newT: Task = {
        id: `TSK-00${tasks.length + 1}`,
        name: newName,
        stage: newStage,
        priority: newPriority,
        assignedTo: newAssignee,
        dueDate: newDueDate,
        dependencyId: newDependency || undefined,
        comments: [],
        isRecurring: isRecurring,
        recurrence: isRecurring ? recurrence : undefined
      };

      const updatedTasks = [...tasks, newT];
      setTasks(updatedTasks);
      setSuccessMessage('Demo Mode: Task created successfully!');
      setTimeout(() => {
        resetForm();
        setSuccessMessage('');
      }, 1500);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewStage('TODO');
    setNewPriority('P2');
    setNewDependency('');
    setValidationError('');
    setSuccessMessage('');
    setIsAdding(false);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    if (!isDemo) {
      vortiqClient.callMutation('tasks.tasksDelete', {
        id
      }).then(() => {
        syncTaskMetricsToDashboard(updatedTasks);
      }).catch(err => console.error('Failed to delete task in DB:', err));
    }
  };

  const handleUpdateStage = (id: string, stage: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, stage } : t);
    setTasks(updatedTasks);
    if (!isDemo) {
      vortiqClient.callMutation('tasks.tasksUpdateStage', {
        id,
        status: stage
      }).then(() => {
        syncTaskMetricsToDashboard(updatedTasks);
      }).catch(err => console.error('Failed to update stage in DB:', err));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      handleUpdateStage(id, targetStage);
    }
  };

  const handleAddComment = (taskId: string) => {
    const text = commentInputs[taskId];
    if (!text || !text.trim()) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          comments: [...t.comments, { user: 'Super Admin', text: text.trim(), time: 'Just now' }]
        };
      }
      return t;
    }));

    setCommentInputs({ ...commentInputs, [taskId]: '' });
  };

  const handleTriggerTaskAgent = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAiAnalysis('Updated Task Audit: Checked dependencies. Auto-delegate verified: No backlog tasks detected. Triggered recurring outlines.');
    }, 1200);
  };

  const tasksMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('delegate') || lower.includes('rule') || lower.includes('assign')) {
      return {
        answer: "Tasks Agent: Created new auto-routing delegation task. Lead score 92 (Bharat Forge) assigned to rep Amit Sharma. Scheduled calendar call item for tomorrow morning.",
        logs: "Compiled delegation event routing logs."
      };
    }
    if (lower.includes('dependency') || lower.includes('block') || lower.includes('check')) {
      return {
        answer: "Tasks Agent: Dependency Check: GSTR-1 tax file task (TSK-003) is blocked by pending stock verification (TSK-002) in Warehouse A. Sent Slack/WhatsApp alert to Priya Patel.",
        logs: "Ran tasks critical path dependency algorithm."
      };
    }
    return {
      answer: "Tasks Agent: Monitoring task pipelines and recurring schedules. Ask me to 'delegate high scored leads' or 'check task dependency blocking'.",
      logs: "Scanned active board lists."
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
              <CheckSquare className="w-5.5 h-5.5 text-teal-600 text-teal-600 dark:text-teal-400" />
              Operational Tasks & Schedules
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Collaborate on team items, set task dependencies, customize auto-delegation triggers, and manage recurring workflows.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilterBuilder(!showFilterBuilder)}
              className={`p-2.5 border rounded-xl transition-all shadow-sm ${showFilterBuilder ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowCustomFields(true)}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all shadow-sm"
              title="Custom Fields Manager"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowImportWizard(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Import CSV
            </button>
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              Export CSV
            </button>
            <button 
              onClick={() => {
                setIsAdding(true);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {/* Task Agent AI Control Panel */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  TaskAgent Manager
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">Automated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleTriggerTaskAgent}
            disabled={aiWorking}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-355 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Sync Boards
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 overflow-x-auto">
          {[
            { id: 'board', label: 'Operational Kanban Board', icon: Layers },
            { id: 'recurring', label: 'Recurring Checklists', icon: Clock },
            { id: 'delegation', label: 'Auto-Delegation Rules', icon: CheckSquare }
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

        {/* Task Creation Form */}
        {isAdding && (
          <form onSubmit={handleAddTask} className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-880 space-y-4 max-w-2xl animate-fadeIn shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Create Task File</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Task Description</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Verify June Ledger Totals"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assignee</label>
                <select 
                  value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Amit Sharma">Amit Sharma (Sales)</option>
                  <option value="Priya Patel">Priya Patel (Ops)</option>
                  <option value="Rahul Sen">Rahul Sen (Eng)</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                <select 
                  value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="P1">P1 (Urgent)</option>
                  <option value="P2">P2 (High)</option>
                  <option value="P3">P3 (Medium)</option>
                  <option value="P4">P4 (Low)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                <input 
                  type="text" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                  placeholder="e.g. Tomorrow or 20 Jun"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Depends On (Prerequisite)</label>
                <select 
                  value={newDependency} onChange={(e) => setNewDependency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">None</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.id} - {t.name.slice(0, 25)}...</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <input 
                type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">Recurring Task Template</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Automatically trigger a fresh copy of this task based on intervals.</p>
              </div>

              {isRecurring && (
                <select 
                  value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs ml-auto"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              )}
            </div>

            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold animate-fadeIn">
                {validationError}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold animate-fadeIn">
                {successMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-500 rounded-lg text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tab 1: Kanban Board */}
        {activeTab === 'board' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map(stage => {
                const filteredTasks = tasks.filter(t => {
                  let matchesAdvanced = true;
                  if (appliedFilters.search) {
                    const q = appliedFilters.search.toLowerCase();
                    matchesAdvanced = matchesAdvanced && (
                      t.id.toLowerCase().includes(q) || 
                      t.name.toLowerCase().includes(q)
                    );
                  }
                  return matchesAdvanced;
                });
                const stageTasks = filteredTasks.filter(t => t.stage === stage);
                return (
                  <div 
                    key={stage} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage)}
                    className="bg-slate-50 dark:bg-slate-955/80 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-4 min-h-[450px] transition-colors duration-200 hover:bg-slate-100/50 dark:hover:bg-slate-900/40"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stage.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] font-bold text-slate-600 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-250 dark:border-slate-800">
                        {stageTasks.length}
                      </span>
                    </div>
 
                    <div className="space-y-3">
                      {stageTasks.map(t => {
                        const isBlocked = t.dependencyId && tasks.some(parent => parent.id === t.dependencyId && parent.stage !== 'DONE');
                        return (
                          <div 
                            key={t.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            className={`bg-white dark:bg-slate-900/60 p-4 rounded-xl border space-y-3 text-xs shadow-sm cursor-pointer hover:border-teal-500/50 transition-all duration-200 ${
                              selectedTask?.id === t.id ? 'border-teal-500 bg-teal-500/5' : 'border-slate-200 dark:border-slate-800'
                            }`}
                            onClick={() => setSelectedTask(t)}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-black text-slate-400 font-mono">{t.id}</span>
                                  <span className={`px-1 rounded text-[8px] font-black ${
                                    t.priority === 'P1' ? 'bg-red-50 text-red-600' :
                                    t.priority === 'P2' ? 'bg-amber-50 text-amber-600' :
                                    'bg-blue-50 text-blue-600'
                                  }`}>{t.priority}</span>
                                </div>
                                <p className={`font-semibold mt-1 text-slate-800 ${isBlocked ? 'line-through text-slate-400' : ''}`}>
                                  {t.name}
                                </p>
                              </div>
                              <button onClick={() => handleDeleteTask(t.id)} className="text-slate-400 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Dependencies alert */}
                            {isBlocked && (
                              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg flex items-center gap-1 text-[9px] text-amber-600 font-bold">
                                <AlertCircle className="w-3 h-3" /> Blocked pending {t.dependencyId}
                              </div>
                            )}

                            {/* Comments list */}
                            {t.comments.length > 0 && (
                              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {t.comments.map((c, idx) => (
                                  <div key={idx} className="text-[10px] text-slate-500 font-medium">
                                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{c.user}: </span>
                                    "{c.text}" <span className="text-[9px] text-slate-400">({c.time})</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add comment form */}
                            <div className="flex gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <input 
                                type="text" 
                                placeholder="Add note..."
                                value={commentInputs[t.id] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [t.id]: e.target.value })}
                                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1 text-[10px]"
                              />
                              <button 
                                onClick={() => handleAddComment(t.id)}
                                className="p-1 bg-teal-600 text-white rounded text-[10px] font-bold"
                              >
                                Send
                              </button>
                            </div>

                            {/* Stage update buttons */}
                            <div className="flex gap-1 justify-end pt-2">
                              {stage !== 'TODO' && (
                                <button 
                                  onClick={() => handleUpdateStage(t.id, 'TODO')}
                                  className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[9px] text-slate-500 rounded font-bold"
                                >
                                  Todo
                                </button>
                              )}
                              {stage !== 'IN_PROGRESS' && (
                                <button 
                                  onClick={() => handleUpdateStage(t.id, 'IN_PROGRESS')}
                                  className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[9px] text-slate-500 rounded font-bold"
                                >
                                  In Prog
                                </button>
                              )}
                              {stage !== 'DONE' && (
                                <button 
                                  onClick={() => handleUpdateStage(t.id, 'DONE')}
                                  className="px-1.5 py-0.5 bg-teal-600 text-white text-[9px] rounded font-bold"
                                >
                                  Done
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* Tab 2: Recurring Checklists */}
        {activeTab === 'recurring' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Active Recurring Task Templates</h3>
            
            <div className="space-y-3">
              {recurringTemplates.map(tpl => (
                <div key={tpl.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-950">
                      {tpl.frequency}
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white mt-1.5">{tpl.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Assigned Owner: {tpl.assignee}</p>
                  </div>

                  <button 
                    onClick={() => setRecurringTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, isActive: !t.isActive } : t))}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                      tpl.isActive ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    {tpl.isActive ? 'Template Active' : 'Suspended'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Auto-delegation rules */}
        {activeTab === 'delegation' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Departmental Allocation Triggers</h3>
            
            <div className="space-y-3">
              {delegateRules.map(rule => (
                <div key={rule.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{rule.category}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Rule filter: <span className="font-mono text-[11px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">{rule.condition}</span></p>
                    <p className="text-[10px] text-slate-500 mt-1">Assign Destination: <span className="font-semibold">{rule.targetOwner}</span></p>
                  </div>

                  <button 
                    onClick={() => setDelegateRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                      rule.isActive ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    {rule.isActive ? 'Auto-Route Active' : 'Suspended'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Real-time AI Assistant */}
      <div className="w-full mt-4">
        <ModuleAIPanel module="TASKS" title="Tasks & Workload Intelligence" />
      </div>

      <ModuleAgentSidebar 
        agentName="Operational Tasks Agent"
        permissionsScope="Permissions Scope: Read task boards, write comments and activity logs, calculate deadlines. Denied deleting task templates (Manager review required)."
        suggestedPrompts={[
          "delegate high scored leads to Amit",
          "check task dependency blocking",
          "show active auto-routing triggers"
        ]}
        defaultMemoryLogs={[
          "Tasks Agent initialized.",
          "Scanned 4 tasks. 1 blocked path dependency identified.",
          "Auto-delegation checked. 3 active routing rules verified."
        ]}
        mockResponseMapper={tasksMockResponse}
      />

        {selectedTask && (
          <div className="w-96 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-lg space-y-5 flex flex-col justify-between shrink-0 animate-fadeIn">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Task Detail File</span>
                <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 dark:text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Header profile details */}
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedTask.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">ID: {selectedTask.id}</p>
                <div className="mt-2 flex flex-col gap-2 border bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                      selectedTask.stage === 'DONE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                      selectedTask.stage === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                    }`}>
                      {selectedTask.stage}
                    </span>
                    <span>Priority: <b className="text-slate-800 dark:text-white">{selectedTask.priority}</b></span>
                  </div>
                </div>
              </div>

              {/* Personnel/Salary Info */}
              <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Assigned Representative:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedTask.assignedTo}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Due Date:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedTask.dueDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Recurring Task:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedTask.isRecurring ? `Yes (${selectedTask.recurrence})` : 'No'}</span>
                </div>
                {selectedTask.dependencyId && (
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                    <span>Blocked By Dependency:</span>
                    <span className="text-red-650 dark:text-red-405">{selectedTask.dependencyId}</span>
                  </div>
                )}
              </div>

              {/* Data Relationship & Attachments panels */}
              <div className="border-t border-slate-100 dark:border-slate-900 pt-4 space-y-4">
                <DocumentAttachmentPanel module="TASKS" recordId={selectedTask.id} />
                <RelatedRecordsPanel module="TASKS" recordId={selectedTask.id} />
                <AuditHistoryPanel module="TASKS" recordId={selectedTask.id} />
              </div>

            </div>
          </div>
        )}

      {/* Modals and Wizards */}
      {showImportWizard && (
        <DataImportWizard 
          module="TASKS"
          onClose={() => setShowImportWizard(false)}
          onSuccess={refreshTasks}
        />
      )}

      {showExportModal && (
        <DataExportModal 
          module="TASKS"
          filters={appliedFilters}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showCustomFields && (
        <CustomFieldManager 
          module="TASKS"
          onClose={() => setShowCustomFields(false)}
        />
      )}

      {showFilterBuilder && (
        <div className="fixed inset-y-0 right-0 z-45 bg-[#0f172a] shadow-2xl transition-all border-l border-slate-850">
          <FilterBuilder 
            module="TASKS"
            onApply={(f) => {
              setAppliedFilters(f);
              setShowFilterBuilder(false);
            }}
            onClose={() => setShowFilterBuilder(false)}
          />
        </div>
      )}

      </div>
    </ConsoleLayout>
  );
}
