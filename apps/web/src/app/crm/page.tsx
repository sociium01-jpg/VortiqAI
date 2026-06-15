'use client';

import React, { useState, useEffect } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  Users, UserPlus, Sparkles, Brain, ArrowRight, Trash2, 
  Layers, Mail, Target, MessageSquare, Plus, Check, Printer, Download, Search, Filter, Calendar, FileText, ChevronRight, X, Clock, Paperclip, Send
} from 'lucide-react';
import { handlePrint, handleExportPDF } from '../utils/export';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

export default function CRMPage() {
  // Tabs: 'contacts' | 'companies' | 'deals' | 'meetings'
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies' | 'deals' | 'meetings'>('contacts');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minScore, setMinScore] = useState(0);

  // Selected item for Detailed View (drawer)
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  // Simulated Sales Reps for assignment
  const salesReps = ['Rahul Sharma', 'Sneha Rao', 'Amit Verma', 'Priya Naik'];

  // Simulated Contacts
  const [contacts, setContacts] = useState([
    { id: 'C-001', name: 'Ravi Shah', companyName: 'Bharat Forge', email: 'ravi@bharatforge.com', phone: '+91 98765 43210', status: 'CUSTOMER', score: 92, enriched: true, rep: 'Rahul Sharma', source: 'Website Demo request', gst: '27AADCB1234F1Z5', industry: 'Automotive Components', address: 'Plot 42, MIDC Chakan, Pune', notes: ['Sent pricing catalog', 'Discussed raw sheet bulk pricing slots'], attachments: ['MCA_Certificate.pdf', 'GSTIN_Doc.pdf'], manualRating: 5 },
    { id: 'C-002', name: 'Amit Desai', companyName: 'Reliance Retail', email: 'amit@reliance.com', phone: '+91 98223 34455', status: 'LEAD', score: 74, enriched: false, rep: 'Sneha Rao', source: 'Meta Campaigns ad', gst: '27BBBBB2222B2Z2', industry: 'Retail & Consumer Goods', address: 'Reliance Corporate Park, Navi Mumbai', notes: ['Awaiting call scheduling response'], attachments: [], manualRating: 3 },
    { id: 'C-003', name: 'Priya Patel', companyName: 'Tata Motors', email: 'priya@tata.com', phone: '+91 99887 76655', status: 'QUALIFIED', score: 88, enriched: true, rep: 'Amit Verma', source: 'Referral partner', gst: '27CCCCC3333C3Z3', industry: 'Automotive Manufacturing', address: 'Tata Motors Plant, Pimpri, Pune', notes: ['NDA signed', 'Requested technical spec sheet variants'], attachments: ['NDA_Signed_Tata.pdf'], manualRating: 4 },
    { id: 'C-004', name: 'Vijay Nair', companyName: 'Jindal Steel', email: 'vijay@jindal.com', phone: '+91 97665 54433', status: 'LEAD', score: 45, enriched: false, rep: 'Priya Naik', source: 'Outbound Cold list', gst: 'Unregistered', industry: 'Metals & Forging', address: 'Jindal Office Tower, BKC, Mumbai', notes: ['Call disconnected twice'], attachments: [], manualRating: 2 }
  ]);

  // Simulated Companies
  const [companies] = useState([
    { id: 'COM-01', name: 'Bharat Forge', industry: 'Automotive Components', contacts: 1, dealsValue: 12000000 },
    { id: 'COM-02', name: 'Reliance Retail', industry: 'Retail & Consumer Goods', contacts: 1, dealsValue: 2200000 },
    { id: 'COM-03', name: 'Tata Motors', industry: 'Automotive Manufacturing', contacts: 1, dealsValue: 750000 },
    { id: 'COM-04', name: 'Jindal Steel', industry: 'Metals & Forging', contacts: 1, dealsValue: 450000 }
  ]);

  // Simulated Deal Pipeline
  const [deals, setDeals] = useState([
    { id: 'D-101', name: 'Raw Sheet Supply Deal', company: 'Bharat Forge', amount: 450000, stage: 'NEGOTIATION' },
    { id: 'D-102', name: 'Luxury Villa Sale', company: 'Ravi Shah', amount: 12000000, stage: 'PROSPECT' },
    { id: 'D-103', name: 'Enterprise Cloud Subscription', company: 'Tata Motors', amount: 750000, stage: 'WON' },
    { id: 'D-104', name: 'Retail Steel Roll Shipment', company: 'Jindal Steel', amount: 2200000, stage: 'QUALIFIED' }
  ]);

  // Simulated Meetings
  const meetings = [
    { id: 'M-501', title: 'Pricing negotiation call', company: 'Bharat Forge', time: 'Tomorrow, 11:30 AM', rep: 'Rahul Sharma' },
    { id: 'M-502', title: 'Product review demo meeting', company: 'Tata Motors', time: '18 June 2026, 04:00 PM', rep: 'Amit Verma' }
  ];

  // Forms state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRep, setNewRep] = useState('Rahul Sharma');
  
  // Note creation state inside details drawer
  const [newNote, setNewNote] = useState('');

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newC = {
      id: `C-00${contacts.length + 1}`,
      name: newName,
      companyName: newCompany || 'Self',
      email: newEmail || `${newName.toLowerCase().replace(' ', '')}@vortiq-temp.in`,
      phone: newPhone || '+91 90000 00000',
      status: 'LEAD',
      score: 50,
      enriched: false,
      rep: newRep,
      source: 'Manual Add',
      gst: 'Awaiting',
      industry: 'Custom Services',
      address: 'Corporate office, India',
      notes: [],
      attachments: [],
      manualRating: 3
    };
    setContacts([newC, ...contacts]);
    setNewName('');
    setNewCompany('');
    setNewEmail('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleAIEnrich = (id: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, enriched: true, score: Math.min(100, c.score + 15), industry: c.industry === 'Custom Services' ? 'Enriched B2B SaaS' : c.industry };
        if (selectedContact && selectedContact.id === id) {
          setSelectedContact(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedContact) return;
    setContacts(prev => prev.map(c => {
      if (c.id === selectedContact.id) {
        const updated = { ...c, notes: [newNote, ...c.notes] };
        setSelectedContact(updated);
        return updated;
      }
      return c;
    }));
    setNewNote('');
  };

  const handleRepChange = (clientId: string, newRepName: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === clientId) {
        const updated = { ...c, rep: newRepName };
        if (selectedContact && selectedContact.id === clientId) {
          setSelectedContact(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  // Filter contacts
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesScore = c.score >= minScore;
    return matchesSearch && matchesStatus && matchesScore;
  });

  // Reusable Agent mock mapping
  const crmMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('enrich') || lower.includes('contact')) {
      return {
        answer: "CRM Agent: LinkedIn data enriched. Target company headcount: 500-1000. Pune region active. Fit index matches ICP parameters (88/100).",
        logs: "Enriched metadata logs for Priya Patel (Tata Motors)."
      };
    }
    if (lower.includes('email') || lower.includes('draft') || lower.includes('outreach')) {
      return {
        answer: "Subject: Automating industrial steel dispatches with Vortiq OS\n\nDear Ravi Shah,\n\nI noticed Bharat Forge is looking to integrate Razorpay ledger flows with regional warehousing dispatches. Vortiq Business OS coordinates inventory limits and GSTR returns natively. Let's schedule a call.",
        logs: "Drafted sales email pitch for Ravi Shah (Bharat Forge)."
      };
    }
    return {
      answer: "CRM Agent: Active and monitoring pipeline metrics. You can ask me to 'enrich contact Priya Patel' or 'draft outbound email outreach Ravi Shah'.",
      logs: "Scanned CRM pipeline data fields."
    };
  };

  return (
    <ConsoleLayout>
      <div className="flex gap-6 items-start">
        
        {/* Main Workspace Column */}
        <div className="flex-1 space-y-6">
          
          {/* Module Title */}
          <div className="border-b border-slate-200 dark:border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-teal-655 text-teal-600 dark:text-teal-400" /> CRM & Pipelines
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage customer directory, companies, deals pipelines, and schedule follow-ups.</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all shadow-sm"
                title="Print list"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleExportPDF('CRM Contacts Directory', filteredContacts)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all shadow-sm"
                title="Export PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="px-4 py-2.5 bg-teal-600 dark:bg-teal-500 hover:bg-teal-750 dark:hover:bg-teal-450 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
              >
                <UserPlus className="w-4 h-4" /> Add Lead
              </button>
            </div>
          </div>

          {/* CRM Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 text-xs font-bold text-slate-450">
            <button 
              onClick={() => { setActiveTab('contacts'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'contacts' ? 'border-teal-500 text-teal-650' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Contacts
            </button>
            <button 
              onClick={() => { setActiveTab('companies'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'companies' ? 'border-teal-500 text-teal-650' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" /> Companies
            </button>
            <button 
              onClick={() => { setActiveTab('deals'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'deals' ? 'border-teal-500 text-teal-650' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" /> Deals Pipeline
            </button>
            <button 
              onClick={() => { setActiveTab('meetings'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'meetings' ? 'border-teal-500 text-teal-650' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" /> Meetings & Follow-ups
            </button>
          </div>

          {/* Add Lead Form Overlay/Panel */}
          {isAdding && (
            <form onSubmit={handleAddContact} className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl shadow-md">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Lead
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="text" 
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Company" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="text" 
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone (e.g. +91 98000 11111)" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Assign Sales Owner</label>
                  <select 
                    value={newRep} 
                    onChange={(e) => setNewRep(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-white focus:outline-none"
                  >
                    {salesReps.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all">
                  Save Lead File
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* CRM Views Switcher */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* VIEW: CONTACTS DIRECTORY */}
            {activeTab === 'contacts' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts..." 
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">All Status</option>
                      <option value="LEAD">Leads</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="CUSTOMER">Customers</option>
                    </select>

                    <select 
                      value={minScore} 
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value={0}>All Scores</option>
                      <option value={50}>Score &gt; 50</option>
                      <option value={80}>Score &gt; 80</option>
                    </select>
                  </div>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No contacts match the filter options.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs leading-normal">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Lead Name</th>
                          <th className="py-2.5 px-3">Company</th>
                          <th className="py-2.5 px-3">Sales Owner</th>
                          <th className="py-2.5 px-3">AI Score</th>
                          <th className="py-2.5 px-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
                        {filteredContacts.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all cursor-pointer" onClick={() => setSelectedContact(c)}>
                            <td className="py-3 px-3">
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white">{c.name}</p>
                                <p className="text-[10px] text-slate-450 mt-0.5">{c.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold">{c.companyName}</td>
                            <td className="py-3 px-3 text-[11px] font-semibold text-slate-500">{c.rep}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{c.score}/100</span>
                                {c.enriched && <span className="text-[8px] bg-teal-550/10 text-teal-650 dark:text-teal-400 px-1 py-0.5 rounded-full font-bold">Enriched</span>}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <ChevronRight className="w-4 h-4 text-slate-350 inline-block" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: COMPANIES DIRECTORY */}
            {activeTab === 'companies' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Connected Client Companies</h3>
                <table className="w-full text-left text-xs leading-normal">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Company Name</th>
                      <th className="py-2.5 px-3">Industry Vertical</th>
                      <th className="py-2.5 px-3">Linked Contacts</th>
                      <th className="py-2.5 px-3 text-right">Pipeline Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
                    {companies.map((com) => (
                      <tr key={com.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all">
                        <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">{com.name}</td>
                        <td className="py-3 px-3 font-semibold text-slate-550">{com.industry}</td>
                        <td className="py-3 px-3 font-bold">{com.contacts}</td>
                        <td className="py-3 px-3 text-right font-black text-teal-650 dark:text-teal-400">{formatINR(com.dealsValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW: DEALS KANBAN */}
            {activeTab === 'deals' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Deals Stage Pipelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['PROSPECT', 'QUALIFIED', 'NEGOTIATION', 'WON'].map((stage) => {
                    const stageDeals = deals.filter(d => d.stage === stage);
                    return (
                      <div key={stage} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-900 pb-2">
                          <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">{stage}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-md font-bold">{stageDeals.length}</span>
                        </div>

                        <div className="space-y-2.5">
                          {stageDeals.map((d) => (
                            <div key={d.id} className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-850 rounded-xl space-y-2 text-xs shadow-sm">
                              <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white">{d.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{d.company}</p>
                              </div>
                              <p className="font-extrabold text-teal-650 dark:text-teal-405">{formatINR(d.amount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW: MEETINGS */}
            {activeTab === 'meetings' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Scheduled Rep Meetings</h3>
                <div className="space-y-3">
                  {meetings.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs shadow-sm">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{m.title}</h4>
                        <p className="text-[10px] text-slate-500">Client: {m.company} | Owner: {m.rep}</p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-805 text-slate-650 dark:text-slate-300 rounded-lg font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {m.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* SIDEBAR drawer detail view (if contact clicked) */}
          {selectedContact && (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-lg space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-900 pb-3">
                  <span className="text-xs font-black uppercase text-slate-450 tracking-wider">Contact Profile File</span>
                  <button onClick={() => setSelectedContact(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-450 dark:text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Header profile details */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedContact.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedContact.companyName} ({selectedContact.industry})</p>
                  <div className="mt-2 flex flex-col gap-2 border bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        selectedContact.status === 'CUSTOMER' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                        selectedContact.status === 'QUALIFIED' ? 'bg-teal-500/10 text-teal-650 dark:text-teal-400 border-teal-500/25' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                      }`}>
                        {selectedContact.status}
                      </span>
                      <span>Fit Score: <b className="text-slate-800 dark:text-white">{selectedContact.score}/100</b></span>
                    </div>

                    {/* Manual Rating Fallback Selector */}
                    <div className="flex items-center gap-1.5 border-t border-slate-200 dark:border-slate-850 pt-2">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Manual Rating:</span>
                      <div className="flex gap-0.5 text-amber-500 text-sm">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            onClick={() => {
                              setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, manualRating: star } : c));
                              setSelectedContact(prev => ({ ...prev, manualRating: star }));
                            }}
                            className="focus:outline-none hover:scale-110 transition-transform"
                          >
                            {star <= (selectedContact.manualRating || 3) ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Local SalesAgent enrichment triggers */}
                <div className="p-3 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/15 rounded-xl space-y-2 text-[11px] font-medium text-slate-600 dark:text-slate-350">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" /> SalesAgent Copilot
                    </span>
                    {!selectedContact.enriched && (
                      <button 
                        onClick={() => handleAIEnrich(selectedContact.id)}
                        className="text-[9px] underline text-teal-650 dark:text-teal-400 font-bold"
                      >
                        Enrich details
                      </button>
                    )}
                  </div>
                  <p className="leading-relaxed">
                    {selectedContact.enriched 
                      ? `AI Propensity: High conversion potential (88%). Recommended Next Action: Send tailored Bulk Sheet supplier quotes.`
                      : `AI recommends enriching contact profile to fetch company headcount, LinkedIn URL, and GST registration status.`
                    }
                  </p>
                </div>

                {/* File details overview */}
                <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                    <span>GSTIN Number:</span>
                    <span className="text-slate-850 dark:text-slate-250">{selectedContact.gst}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                    <span>Phone Mobile:</span>
                    <span className="text-slate-850 dark:text-slate-250">{selectedContact.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                    <span>Sourced From:</span>
                    <span className="text-slate-850 dark:text-slate-250">{selectedContact.source}</span>
                  </div>
                  <div className="flex flex-col border-b border-slate-100 dark:border-slate-900 pb-1.5 gap-0.5">
                    <span>Office Address:</span>
                    <span className="text-[10px] text-slate-850 dark:text-slate-250 leading-relaxed font-normal">{selectedContact.address}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Assigned Rep:</span>
                    <select 
                      value={selectedContact.rep} 
                      onChange={(e) => handleRepChange(selectedContact.id, e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-350 focus:outline-none"
                    >
                      {salesReps.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notes Feed section */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Notes Thread</span>
                  
                  {/* Add note inline form */}
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add manual trace note..." 
                      className="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                    <button type="submit" className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-white rounded-xl">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedContact.notes.map((note: string, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-900 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 leading-normal font-semibold">
                        {note}
                      </div>
                    ))}
                    {selectedContact.notes.length === 0 && (
                      <p className="text-[10px] text-slate-455 italic">No notes added to this contact.</p>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Attachments</span>
                  <div className="space-y-1.5">
                    {selectedContact.attachments.map((file: string, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-lg flex items-center justify-between text-[10px] text-slate-750 dark:text-slate-350">
                        <span className="flex items-center gap-1 font-semibold">
                          <Paperclip className="w-3 h-3 text-slate-400" /> {file}
                        </span>
                        <a href="#" className="underline text-teal-650 dark:text-teal-400 font-bold">Download</a>
                      </div>
                    ))}
                    {selectedContact.attachments.length === 0 && (
                      <p className="text-[10px] text-slate-450 italic">No files uploaded.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Collapsible Local CRM Agent Sidebar */}
        <ModuleAgentSidebar 
          agentName="CRM Pipeline Agent"
          permissionsScope="Authorized to read contacts directories, companies links, deal pipeline stages, and follow-up calendar metrics. Blocked from write actions on invoices."
          suggestedPrompts={[
            "enrich contact Priya Patel",
            "draft sales outreach email Ravi Shah",
            "score pipeline deals risk"
          ]}
          defaultMemoryLogs={[
            "CRM Agent initialized: pipeline scanning enabled.",
            "Scanned 4 contact records. Identified 1 customer, 1 qualified, and 2 raw leads.",
            "Calculated deals value: Rs 1,54,00,000 active."
          ]}
          mockResponseMapper={crmMockResponse}
        />

      </div>
    </ConsoleLayout>
  );
}
