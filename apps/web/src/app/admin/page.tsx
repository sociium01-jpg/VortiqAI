'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, CheckSquare, ShieldCheck, Mail, Lock, 
  Eye, EyeOff, Plus, Check, X, Bell, Landmark, UserCheck, 
  HelpCircle, Printer, Download, Save, RefreshCw, ChevronRight, FileText
} from 'lucide-react';
import { handlePrint, handleExportPDF, handleExportExcel, handleExportWord } from '../utils/export';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

export default function VortiqAdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // Central Client Directory (User + Company meta, trial info, registration docs)
  const [clients, setClients] = useState([
    { id: 'CLI-001', name: 'Bharat Components', owner: 'Ravi Shah', email: 'ravi@bharatforge.com', plan: 'GROWTH', trialDaysLeft: 12, docUploaded: true, paymentStatus: 'TRIAL_ACTIVE', registeredName: 'Bharat Components Private Limited', gstin: '27AADCB1234F1Z5' },
    { id: 'CLI-002', name: 'Zora Wellness', owner: 'Priya Patel', email: 'priya@tata.com', plan: 'BUSINESS', trialDaysLeft: 2, docUploaded: true, paymentStatus: 'TRIAL_ENDING_ALERT', registeredName: 'Zora Wellness Retail LLP', gstin: '27AAEZW9988G2Z1' },
    { id: 'CLI-003', name: 'Nexus Cloud', owner: 'Amit Desai', email: 'amit@reliance.com', plan: 'STARTER', trialDaysLeft: 0, docUploaded: false, paymentStatus: 'PAYMENT_OVERDUE', registeredName: 'Nexus Cloud Solutions Pvt Ltd', gstin: '29AABCN5544H1Z9' }
  ]);

  // Support tickets sent from client side to troubleshooting
  const [tickets, setTickets] = useState([
    { id: 'TCK-201', clientName: 'Bharat Components', title: 'GST e-Invoice API connection timeout', severity: 'HIGH', status: 'OPEN', description: 'Getting 504 Gateway Timeout when calling GSTR offline schema validator.' },
    { id: 'TCK-202', clientName: 'Zora Wellness', title: 'Shopify webhook sync issue', severity: 'MEDIUM', status: 'IN_PROGRESS', description: 'Some orders captured on Instagram store are not pushing stock sync to warehouse inventory.' }
  ]);

  // Tasks for Vortiq internal employees
  const [tasks, setTasks] = useState([
    { id: 'TSK-501', title: 'Verify Nexus Cloud registration documents', assignedTo: 'Vikram', priority: 'HIGH', status: 'TODO' },
    { id: 'TSK-502', title: 'Deploy WhatsApp template for trial endings', assignedTo: 'Nisha', priority: 'MEDIUM', status: 'IN_PROGRESS' },
    { id: 'TSK-503', title: 'Trigger Razorpay webhook testing sandbox', assignedTo: 'Vikram', priority: 'LOW', status: 'DONE' }
  ]);

  // Central finance trackers (internal Vortiq business data)
  const [financials, setFinancials] = useState({
    paymentsDone: 245000,
    receivables: 680000,
    expenses: 125000
  });

  const [financeEntries, setFinanceEntries] = useState([
    { id: 'FIN-101', desc: 'Supabase DB Hosting Fee', amount: 8200, type: 'EXPENSE', date: '12/06/2026' },
    { id: 'FIN-102', desc: 'Zora Wellness Subscription Pay', amount: 23997, type: 'RECEIVABLE', date: '14/06/2026' },
    { id: 'FIN-103', desc: 'WhatsApp API Connector fee', amount: 15400, type: 'EXPENSE', date: '15/06/2026' }
  ]);

  // Vortiq internal Employee role management
  const [employees, setEmployees] = useState([
    { id: 'EMP-01', name: 'Vikram Mehta', role: 'Support Lead', status: 'ACTIVE' },
    { id: 'EMP-02', name: 'Nisha Sharma', role: 'Billing Specialist', status: 'ACTIVE' }
  ]);

  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('Support Staff');

  // Input states for updates
  const [remindedClient, setRemindedClient] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState<Record<string, string>>({});
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmt, setNewExpenseAmt] = useState('');

  const toggleShowSecret = (field: string) => {
    setShowSecret(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSendReminder = (clientId: string) => {
    setRemindedClient(clientId);
    setTimeout(() => {
      setRemindedClient(null);
      alert(`Payment reminder notification triggered successfully to client via WhatsApp and Email!`);
    }, 1000);
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'RESOLVED' } : t));
    alert(`Ticket ${ticketId} resolved successfully. Client has been notified.`);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmt) return;
    const amt = Number(newExpenseAmt);
    const entry = {
      id: `FIN-${100 + financeEntries.length + 1}`,
      desc: newExpenseDesc,
      amount: amt,
      type: 'EXPENSE',
      date: new Date().toLocaleDateString('en-IN')
    };
    setFinanceEntries([entry, ...financeEntries]);
    setFinancials(prev => ({ ...prev, expenses: prev.expenses + amt }));
    setNewExpenseDesc('');
    setNewExpenseAmt('');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) return;
    const emp = {
      id: `EMP-0${employees.length + 1}`,
      name: newEmployeeName,
      role: newEmployeeRole,
      status: 'ACTIVE'
    };
    setEmployees([...employees, emp]);
    setNewEmployeeName('');
  };

  const handleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'DONE' } : t));
  };

  const vortiqAdminMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('health') || lower.includes('churn') || lower.includes('risk')) {
      return {
        answer: "Admin Agent: Executed churn forecast. Nexus Cloud is flagged HIGH RISK (Usage drops > 35%, 1 critical open ticket #TCK-201). Recommend CS team outreach and manual grace-period extension.",
        logs: "Calculated client success health indexes."
      };
    }
    if (lower.includes('ticket') || lower.includes('assign') || lower.includes('reply')) {
      return {
        answer: "Admin Agent: Suggested ticket assignment for TCK-201: Route to technical owner Rahul Sen (SLA: 12m remaining). Auto-drafted client reply: 'Our team is investigating the GST e-Invoice Gateway timeout, expected fix in 30 minutes.'",
        logs: "Prepared support routing instructions."
      };
    }
    return {
      answer: "Admin Agent: Scanning client registries and license crons. You can ask me to 'summarize health risks' or 'route open tickets'.",
      logs: "Audited client trials database."
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-teal-500 selection:text-slate-950">
      
      {/* Admin header */}
      <header className="border-b border-slate-900 bg-slate-900/40 sticky top-0 z-40 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
            A
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">VORTIQ ADMIN</h1>
            <p className="text-[9px] text-rose-500 font-extrabold uppercase tracking-widest">Internal Operations Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            Exit Portal
          </Link>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-slate-700">
            ADM
          </div>
        </div>
      </header>

      {/* Main split dashboard */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-900 bg-slate-950/20 p-4 space-y-1 shrink-0">
          <p className="text-[10px] uppercase font-bold text-slate-600 px-3 tracking-widest mb-3">Operations</p>
          {[
            { id: 'dashboard', label: 'Admin Dashboard', icon: Landmark },
            { id: 'clients', label: 'Clients & Documents', icon: Building2 },
            { id: 'support', label: 'Client Support Queue', icon: HelpCircle },
            { id: 'tasks', label: 'Internal Staff Tasks', icon: CheckSquare },
            { id: 'finance', label: 'Corporate Accounts', icon: Landmark },
            { id: 'employees', label: 'Employee Access', icon: UserCheck },
            { id: 'security', label: 'Security & Admins', icon: Lock }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive 
                    ? 'bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border-rose-500/20 text-rose-400 font-black' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Console Container */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto space-y-6">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">Central Operations Dashboard</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Real-time stats on client trials, payments receivable, and internal support workloads.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="p-2 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition-colors" title="Print page">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleExportPDF('Operations Dashboard', [financials])} className="p-2 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition-colors" title="Export PDF">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats metric cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Payments Done</p>
                  <p className="text-xl font-bold text-white mt-1">Rs {financials.paymentsDone.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Accounts Receivable</p>
                  <p className="text-xl font-bold text-teal-400 mt-1">Rs {financials.receivables.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Internal Expenses</p>
                  <p className="text-xl font-bold text-rose-500 mt-1">Rs {financials.expenses.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Trials</p>
                  <p className="text-xl font-bold text-indigo-400 mt-1">{clients.filter(c => c.trialDaysLeft > 0).length} SaaS Clients</p>
                </div>
              </div>

              {/* Detailed tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Client Overviews</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 text-[9px] uppercase font-bold">
                          <th className="py-2">Client Company</th>
                          <th className="py-2">Active Plan</th>
                          <th className="py-2 text-right">Trial Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map(c => (
                          <tr key={c.id} className="border-b border-slate-900/60 font-semibold text-slate-300">
                            <td className="py-3">{c.name}</td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">{c.plan}</span></td>
                            <td className="py-3 text-right text-teal-400">{c.trialDaysLeft} days left</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Operations Checklist</h3>
                  <div className="space-y-2.5 text-xs">
                    {tasks.slice(0, 3).map(t => (
                      <div key={t.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-300">{t.title}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Assigned to: {t.assignedTo}</p>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                          t.status === 'DONE' ? 'bg-teal-500/10 text-teal-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLIENTS & DOCUMENTS */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">Client Management & KYC Documents</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Capture client information, review GSTIN/MCA registration certificates, and manage billing alerts.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleExportExcel('Client KYC Directory', clients)} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Export Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto bg-slate-900/20 border border-slate-900 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider bg-slate-900/10">
                      <th className="py-3.5 px-6">Company Meta</th>
                      <th className="py-3.5 px-4">Authorized User</th>
                      <th className="py-3.5 px-4">GSTIN Details</th>
                      <th className="py-3.5 px-4">KYC Document</th>
                      <th className="py-3.5 px-4">Trial / Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-semibold text-slate-300">
                    {clients.map(c => (
                      <tr key={c.id} className="hover:bg-slate-900/10">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-bold text-slate-200">{c.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">ID: {c.id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-slate-200">{c.owner}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{c.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[10px] font-mono text-slate-400">{c.gstin}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{c.registeredName}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {c.docUploaded ? (
                            <span className="inline-flex items-center gap-1.5 text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 text-[10px]">
                              <FileText className="w-3.5 h-3.5" /> Verified Cert
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800 text-[10px]">
                              Pending Upload
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-slate-200 text-xs">{c.trialDaysLeft} Days Remaining</p>
                            <span className={`inline-block text-[9px] mt-0.5 px-1.5 py-0.2 rounded font-bold ${
                              c.paymentStatus === 'TRIAL_ACTIVE' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                              c.paymentStatus === 'TRIAL_ENDING_ALERT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>{c.paymentStatus.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleSendReminder(c.id)}
                            className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-slate-950 border border-rose-500/30 text-[10px] font-bold rounded-lg transition-all"
                          >
                            Send Payment Warning
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CLIENT SUPPORT QUEUE */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">Client Troubleshooting & Tickets</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Review incoming troubleshooting requests from client portal and dispatch replies.</p>
                </div>
              </div>

              <div className="space-y-4">
                {tickets.map(t => (
                  <div key={t.id} className="p-5 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                          t.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>{t.severity} SEVERITY</span>
                        <h4 className="text-xs font-extrabold text-slate-200">{t.title}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{t.id} • {t.clientName}</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-normal bg-slate-950/80 p-3 rounded-xl border border-slate-900">{t.description}</p>
                    
                    {t.status !== 'RESOLVED' ? (
                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="text"
                          placeholder="Type response to troubleshoot..."
                          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-500 transition-colors"
                          value={ticketReply[t.id] || ''}
                          onChange={(e) => setTicketReply({ ...ticketReply, [t.id]: e.target.value })}
                        />
                        <button
                          onClick={() => handleResolveTicket(t.id)}
                          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve Ticket
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-teal-400 font-bold bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20">
                        <Check className="w-4 h-4" /> Ticket has been resolved and client notified.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: INTERNAL STAFF TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">Vortiq Employee Tasks Queue</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Track tasks assigned to Vortiq employees for support, onboarding, and platform audits.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['TODO', 'IN_PROGRESS', 'DONE'].map(col => (
                  <div key={col} className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{col}</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">
                        {tasks.filter(t => t.status === col).length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {tasks.filter(t => t.status === col).map(t => (
                        <div key={t.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-xs">
                          <p className="font-semibold text-slate-200 leading-normal">{t.title}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                            <span className="text-[10px] text-slate-500 font-medium">For: {t.assignedTo}</span>
                            {col !== 'DONE' && (
                              <button
                                onClick={() => handleTaskComplete(t.id)}
                                className="text-[10px] text-teal-400 hover:underline font-bold"
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CORPORATE ACCOUNTS */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">Corporate Financial Accounting</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage Vortiq central payouts, SaaS receivables, and overhead operational expenses.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleExportWord('Financial Accounts', financeEntries)} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Export Doc
                  </button>
                </div>
              </div>

              {/* Add Expense Form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">General Ledger Entries</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold bg-slate-900/10 py-2">
                          <th className="py-2.5 px-4">Transaction Code</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 font-semibold text-slate-350">
                        {financeEntries.map(e => (
                          <tr key={e.id} className="hover:bg-slate-900/10">
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{e.id}</td>
                            <td className="py-3 px-4 text-slate-200">{e.desc}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                e.type === 'RECEIVABLE' ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-450'
                              }`}>{e.type}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{e.date}</td>
                            <td className={`py-3 px-4 text-right font-mono ${
                              e.type === 'RECEIVABLE' ? 'text-teal-400' : 'text-slate-300'
                            }`}>Rs {e.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Record Operational Expense</h3>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Description</label>
                      <input
                        type="text"
                        required
                        placeholder="Vercel hosting fee, domain renewal..."
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                        value={newExpenseDesc}
                        onChange={(e) => setNewExpenseDesc(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Amount (INR)</label>
                      <input
                        type="number"
                        required
                        placeholder="Amount in Rupees"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                        value={newExpenseAmt}
                        onChange={(e) => setNewExpenseAmt(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-rose-500/10 transition-colors"
                    >
                      Post Expense Entry
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EMPLOYEE ACCESS */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">Employee Access & Responsibility Roles</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Control employee platform login credentials and assign departmental administrative roles.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Active Staff Directory</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold bg-slate-900/10">
                          <th className="py-2.5 px-4">Employee ID</th>
                          <th className="py-2.5 px-4">Full Name</th>
                          <th className="py-2.5 px-4">Role Responsibility</th>
                          <th className="py-2.5 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="font-semibold text-slate-350">
                        {employees.map(emp => (
                          <tr key={emp.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{emp.id}</td>
                            <td className="py-3 px-4 text-slate-200">{emp.name}</td>
                            <td className="py-3 px-4 text-slate-300">{emp.role}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-bold">
                                {emp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Provision New Staff Account</h3>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Employee Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Mehta"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                        value={newEmployeeName}
                        onChange={(e) => setNewEmployeeName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Assigned Role</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                        value={newEmployeeRole}
                        onChange={(e) => setNewEmployeeRole(e.target.value)}
                      >
                        <option value="Support Lead">Support Lead</option>
                        <option value="Billing Specialist">Billing Specialist</option>
                        <option value="Database Admin">Database Admin</option>
                        <option value="Super Administrator">Super Administrator</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-rose-500/10 transition-colors"
                    >
                      Provision Login Account
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & ADMINS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">Security & Master Admin Controls</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Configure master passwords, encryption keys, and review security access logs.</p>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-6 max-w-xl">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Reset Master Password</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Current Password', field: 'currentPwd' },
                      { label: 'New Master Password', field: 'newPwd' },
                      { label: 'Confirm New Master Password', field: 'confirmNewPwd' }
                    ].map((item) => (
                      <div key={item.field} className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400">{item.label}</label>
                        <div className="relative">
                          <input 
                            type={showSecret[item.field] ? 'text' : 'password'}
                            placeholder="••••••••••••"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-rose-500 pr-10"
                          />
                          <button 
                            type="button" 
                            onClick={() => toggleShowSecret(item.field)}
                            className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                          >
                            {showSecret[item.field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => alert('Master credentials updated successfully!')}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-rose-500/10"
                >
                  <Save className="w-4 h-4" /> Save Security Profile
                </button>
              </div>
            </div>
          )}

        </main>

        <ModuleAgentSidebar 
          agentName="Vortiq Admin AI Agent"
          permissionsScope="Permissions Scope: Read client subscriptions logs, audit DND calling hours compliance, access KYC doc registers, draft client troubleshooting responses."
          suggestedPrompts={[
            "summarize client health risks",
            "route open ticket TCK-201",
            "show active trial timelines"
          ]}
          defaultMemoryLogs={[
            "Vortiq Admin Agent online.",
            "Scanned 3 client directories. Flagged 1 client (Nexus Cloud) at high churn risk.",
            "Awaiting manual validation to route support ticket TCK-201."
          ]}
          mockResponseMapper={vortiqAdminMockResponse}
        />

      </div>
    </div>
  );
}
