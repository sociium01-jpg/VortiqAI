'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  LifeBuoy, Plus, Sparkles, Brain, AlertTriangle, 
  CheckCircle2, RefreshCw, MessageSquare, Send, Check,
  Clock, ShieldAlert, ArrowRight, User, AlertCircle, X, Search, Filter
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

interface TicketComment {
  user: string;
  text: string;
  time: string;
  isInternal: boolean;
}

interface Ticket {
  id: string;
  customer: string;
  email: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'FINANCE' | 'SHIPPING' | 'SALES' | 'INTEGRATION';
  slaMinutesRemaining: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  comments: TicketComment[];
}

export default function SupportPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  useEffect(() => {
    if (isLoaded && !isDemo) {
      setTickets([]);
      setSelectedTicketId(null);
      setAiAnalysis("SupportAgent Monitor: Ticket queue is empty. Customer support channels are quiet.");
    }
  }, [isLoaded, isDemo]);

  const [tickets, setTickets] = useState<Ticket[]>([
    { 
      id: 'TCK-801', 
      customer: 'Amit Desai', 
      email: 'amit.desai@gmail.com',
      subject: 'Invoice amount anomaly discrepancy', 
      description: 'The GSTIN on invoice INV-2026-002 shows a tax rate of 18% but our purchase contract was signed for 12% output GST. Please check and regenerate.',
      status: 'OPEN', 
      priority: 'URGENT', 
      category: 'FINANCE', 
      slaMinutesRemaining: 12, 
      sentiment: 'NEGATIVE',
      comments: [
        { user: 'SupportAgent (AI)', text: 'Analyzed invoice contract terms. Mismatch detected.', time: '10m ago', isInternal: true }
      ]
    },
    { 
      id: 'TCK-802', 
      customer: 'Tata Motors Assembly', 
      email: 'procurement@tatamotors.com',
      subject: 'Dispatch delayed for raw metal sheets', 
      description: 'PO-2026-001 shows dispatched but the Delhivery tracking portal has not updated for 24 hours. We need these raw sheets on our assembly line by tomorrow morning.',
      status: 'IN_PROGRESS', 
      priority: 'HIGH', 
      category: 'SHIPPING', 
      slaMinutesRemaining: 45, 
      sentiment: 'NEUTRAL',
      comments: []
    },
    { 
      id: 'TCK-803', 
      customer: 'Ravi Shah', 
      email: 'ravi.shah@villas.in',
      subject: 'Villa floorplan PDF download query', 
      description: 'I am unable to download the pre-launch floorplan specifications from the CRM client portal. The page keeps throwing a timeout error.',
      status: 'RESOLVED', 
      priority: 'LOW', 
      category: 'SALES', 
      slaMinutesRemaining: 0, 
      sentiment: 'POSITIVE',
      comments: [
        { user: 'SupportAgent (AI)', text: 'Sent villa floorplan attachment via email link.', time: '2h ago', isInternal: false }
      ]
    },
    { 
      id: 'TCK-804', 
      customer: 'Vijay Nair', 
      email: 'vijay@nairconsulting.com',
      subject: 'Connect Tally XML integration setup help', 
      description: 'We need to sync our billing ledgers with our local Tally ERP setup. Does the Vortiq settings tab support n8n webhooks for XML export?',
      status: 'OPEN', 
      priority: 'MEDIUM', 
      category: 'INTEGRATION', 
      slaMinutesRemaining: 180, 
      sentiment: 'NEUTRAL',
      comments: []
    }
  ]);

  // Selected ticket for responder drawer
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>('TCK-801');
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Responder Form States
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // New ticket state
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newCategory, setNewCategory] = useState<'FINANCE' | 'SHIPPING' | 'SALES' | 'INTEGRATION'>('INTEGRATION');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [aiWorking, setAiWorking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('SupportAgent Monitor: 4 total tickets in queue. TCK-801 requires immediate human intervention due to SLA limits. Sentiment parsed: 1 Irritated customer.');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newSubject.trim()) return;

    const newT: Ticket = {
      id: `TCK-80${tickets.length + 1}`,
      customer: newCustomer,
      email: newEmail || 'inquiries@vortiq.ai',
      subject: newSubject,
      description: newDesc || 'Inbound request logged via client portal.',
      status: 'OPEN',
      priority: newPriority,
      category: newCategory,
      slaMinutesRemaining: 240,
      sentiment: 'NEUTRAL',
      comments: []
    };

    setTickets([newT, ...tickets]);
    setSelectedTicketId(newT.id);
    resetForm();
  };

  const resetForm = () => {
    setNewCustomer('');
    setNewEmail('');
    setNewSubject('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        const newComments: TicketComment[] = [
          ...t.comments,
          {
            user: isInternalNote ? 'Super Admin (Internal Note)' : 'Super Admin',
            text: replyText.trim(),
            time: 'Just now',
            isInternal: isInternalNote
          }
        ];
        return {
          ...t,
          comments: newComments,
          status: isInternalNote ? t.status : 'IN_PROGRESS'
        };
      }
      return t;
    }));

    setReplyText('');
  };

  const handleResolveTicket = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'RESOLVED', slaMinutesRemaining: 0 } : t));
  };

  const handleAIGenerateResponse = () => {
    if (!selectedTicket) return;
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setReplyText(`Namaste ${selectedTicket.customer}, thank you for contacting Vortiq. I've audited the database records. Regarding ${selectedTicket.subject}, our finance agent has drafted a correction entry. Once approved by our CFO, we will trigger the GSTR filing refresh.`);
    }, 1000);
  };

  const handleTriggerSupportSync = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAiAnalysis('Updated Support Audit: Verified SLA countdown metrics. AI drafted responses updated based on updated ledger records.');
    }, 1200);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const supportMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('sentiment') || lower.includes('alert') || lower.includes('irritated')) {
      return {
        answer: "Support Agent: Ticket TCK-801 contains HIGH negative sentiment. Customer Amit Desai is irritated due to tax rate mismatch (18% vs 12%). Priority upgraded to URGENT. SLA countdown active: 12m remaining.",
        logs: "Parsed sentiment levels using NLP classifier."
      };
    }
    if (lower.includes('faq') || lower.includes('template') || lower.includes('draft')) {
      return {
        answer: "Support Agent: Suggested FAQ Draft: 'How to check my GSTIN tax rate mismatch?'. Action: n8n workflow generated ready to auto-respond to incoming WhatsApp inquiries.",
        logs: "Prepared support reply FAQ template."
      };
    }
    return {
      answer: "Support Agent: Monitoring SLA queues and ticketing boards. Ask me to 'analyze negative sentiment alert' or 'draft FAQ response template'.",
      logs: "Scanned support ticket status flags."
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
              <LifeBuoy className="w-5.5 h-5.5 text-teal-600 text-teal-600 dark:text-teal-400" />
              Customer Support Desk
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Track SLA compliance windows, analyze incoming customer sentiments, draft AI-assisted replies, and post internal notes.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsAdding(true);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Open Support Ticket
            </button>
          </div>
        </div>

        {/* Support Agent AI Dashboard Panel */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  SupportAgent Core
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">SLA Watchdog</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleTriggerSupportSync}
            disabled={aiWorking}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-355 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Sync SLA Timers
          </button>
        </div>

        {/* Ticket Creation Modal */}
        {isAdding && (
          <form onSubmit={handleCreateTicket} className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl animate-fadeIn shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Open Inbound Support Ticket</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer Name</label>
                <input 
                  type="text" required value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="e.g. Amit Desai"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer Email</label>
                <input 
                  type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. amit@gmail.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Support Category</label>
                <select 
                  value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="INTEGRATION">Integration Setup</option>
                  <option value="FINANCE">Billing & GST</option>
                  <option value="SHIPPING">Shipping & Dispatch</option>
                  <option value="SALES">Sales Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority / SLA Severity</label>
                <select 
                  value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="LOW">Low Severity</option>
                  <option value="MEDIUM">Medium Severity</option>
                  <option value="HIGH">High Severity</option>
                  <option value="URGENT">Urgent SLA (15m response)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ticket Subject</label>
              <input 
                type="text" required value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Tally Integration failing with XML error"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Query Description</label>
              <textarea 
                rows={4} value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Provide detailed description of the customer issue..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all">
                Open Ticket
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Main Split: Ticket Queue + Drawer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Ticket List Panel */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
            
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Search Ticket ID or client name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <div className="flex gap-2 shrink-0">
                <select 
                  value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                  <option value="LOW">Low Only</option>
                </select>
                <select 
                  value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Issue Overview</th>
                    <th className="p-3">SLA Status</th>
                    <th className="p-3">Sentiment</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {filteredTickets.map((t) => {
                    const active = selectedTicketId === t.id;
                    const isSlaBreached = t.slaMinutesRemaining <= 15 && t.status !== 'RESOLVED';
                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300 font-medium transition-all ${
                          active ? 'bg-teal-500/5 dark:bg-teal-400/5 border-l-4 border-l-teal-600' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{t.id}</td>
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-slate-800">{t.subject}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{t.customer} • {t.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {t.status === 'RESOLVED' ? (
                            <span className="text-slate-400 text-[10px]">Closed</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border flex items-center gap-1 w-fit ${
                              isSlaBreached 
                                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950 animate-pulse' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-250 dark:border-slate-700'
                            }`}>
                              {t.slaMinutesRemaining}m remaining
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            t.sentiment === 'NEGATIVE' ? 'bg-red-50 text-red-600 border-red-100' :
                            t.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {t.sentiment}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950 text-[9px] font-black rounded">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {t.status !== 'RESOLVED' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolveTicket(t.id);
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ticket Details / Responder Drawer */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
            {selectedTicket ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 font-mono uppercase">{selectedTicket.id} Detail</h3>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{selectedTicket.subject}</h4>
                    <p className="text-[10px] text-slate-500">From: {selectedTicket.customer} ({selectedTicket.email})</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                    selectedTicket.status === 'RESOLVED' ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 border-teal-200 text-teal-600'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  {selectedTicket.description}
                </div>

                {/* Sentiment Alert */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-black">Client Sentiment:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                    selectedTicket.sentiment === 'NEGATIVE' ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {selectedTicket.sentiment}
                  </span>
                </div>

                {/* Historical Conversation / Notes thread */}
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Thread & Audits</span>
                  {selectedTicket.comments.map((comment, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border text-[11px] ${
                        comment.isInternal 
                          ? 'bg-amber-500/5 border-amber-500/20 text-amber-600' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <p className="font-bold mb-0.5">{comment.user} <span className="text-[9px] font-semibold text-slate-400">({comment.time})</span></p>
                      <p className="italic">"{comment.text}"</p>
                    </div>
                  ))}
                </div>

                {/* Responder Form */}
                {selectedTicket.status !== 'RESOLVED' && (
                  <form onSubmit={handleSendReply} className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setIsInternalNote(false)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            !isInternalNote 
                              ? 'bg-teal-50 border-teal-200 text-teal-600' 
                              : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          Public Reply
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setIsInternalNote(true)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            isInternalNote 
                              ? 'bg-amber-50 border-amber-250 text-amber-600' 
                              : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          Internal Note
                        </button>
                      </div>

                      <button 
                        type="button" 
                        onClick={handleAIGenerateResponse}
                        className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5 hover:underline"
                      >
                        <Brain className="w-3 h-3" /> Auto Draft Reply
                      </button>
                    </div>

                    <textarea 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder={isInternalNote ? "Write internal log (hidden from client)..." : "Write response message to client..."}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                    />

                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" /> 
                        {isInternalNote ? 'Post Note' : 'Send Message'}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            ) : (
              <p className="text-xs text-slate-500 font-semibold text-center py-12">Select a ticket from support queue to respond.</p>
            )}
          </div>
        </div>

      </div>

      <ModuleAgentSidebar 
        agentName="Client Support Agent"
        permissionsScope="Permissions Scope: Read customer support tickets, write replies and internal notes, calculate SLA remaining countdowns. Denied modification to sales rep assignments (Superboss authority required)."
        suggestedPrompts={[
          "analyze negative sentiment alert",
          "draft FAQ response template",
          "list high priority integration tickets"
        ]}
        defaultMemoryLogs={[
          "Support Agent online.",
          "Scanned 4 tickets. Identified 1 URGENT ticket with high negative sentiment.",
          "Ready to parse incoming customer mail channels."
        ]}
        mockResponseMapper={supportMockResponse}
      />

      </div>
    </ConsoleLayout>
  );
}
