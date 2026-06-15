'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  Landmark, Plus, Sparkles, Brain, AlertTriangle, 
  CheckCircle2, FileText, Download, ShieldCheck, RefreshCw,
  Bell, FileSpreadsheet, Check, X, ShieldAlert, ArrowDownRight,
  TrendingUp, TrendingDown, Layers
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

interface InvoiceItem {
  description: string;
  hsnCode: string;
  qty: number;
  rate: number;
  discountPct: number;
  gstRate: number; // 5, 12, 18, 28
}

interface Invoice {
  id: string;
  customer: string;
  gstin: string;
  items: InvoiceItem[];
  paymentStatus: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  irnStatus: 'PENDING' | 'FILED';
  dueDate: string;
  date: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  status: 'DRAFT' | 'POSTED';
}

export default function FinancePage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  useEffect(() => {
    if (isLoaded && !isDemo) {
      setInvoices([]);
      setLedger([]);
      setReminders([]);
      setAnomalies([]);
      setAiAnalysis("Finance Audit: Ledger is in balance. No transaction activity detected.");
    }
  }, [isLoaded, isDemo]);

  const [activeTab, setActiveTab] = useState<'invoices' | 'ledger' | 'gst' | 'reminders'>('invoices');

  // Invoices list
  const [invoices, setInvoices] = useState<Invoice[]>([
    { 
      id: 'INV-2026-001', 
      customer: 'Tata Motors Assembly', 
      gstin: '27AAAAA1111A1Z1', 
      items: [
        { description: 'Raw Sheet Metal V4', hsnCode: '7208.51', qty: 4, rate: 45000, discountPct: 5, gstRate: 18 }
      ],
      paymentStatus: 'PAID',
      irnStatus: 'FILED',
      dueDate: '20 Jun 2026',
      date: '12 Jun 2026'
    },
    { 
      id: 'INV-2026-002', 
      customer: 'Reliance Retail Logistics', 
      gstin: '27BBBBB2222B2Z2', 
      items: [
        { description: 'M8 Heavy Fasteners Pack', hsnCode: '7318.15', qty: 10, rate: 650, discountPct: 0, gstRate: 18 }
      ],
      paymentStatus: 'OVERDUE',
      irnStatus: 'FILED',
      dueDate: '10 Jun 2026',
      date: '01 Jun 2026'
    },
    { 
      id: 'INV-2026-003', 
      customer: 'Jindal Steel Mills', 
      gstin: '27CCCCC3333C3Z3', 
      items: [
        { description: 'Aluminium Extrusion Rod G2', hsnCode: '7604.21', qty: 15, rate: 1800, discountPct: 2, gstRate: 18 }
      ],
      paymentStatus: 'DRAFT',
      irnStatus: 'PENDING',
      dueDate: '30 Jun 2026',
      date: 'Today'
    }
  ]);

  // Journal Entries Ledger
  const [ledger, setLedger] = useState<JournalEntry[]>([
    { id: 'JE-001', entryNumber: 'JE-2026-101', date: '12 Jun 2026', description: 'Raw Sheet Metal Sale Tata', account: 'Accounts Receivable', debit: 201780, credit: 0, status: 'POSTED' },
    { id: 'JE-002', entryNumber: 'JE-2026-101', date: '12 Jun 2026', description: 'Raw Sheet Metal Sale Tata', account: 'Sales Income', debit: 0, credit: 171000, status: 'POSTED' },
    { id: 'JE-003', entryNumber: 'JE-2026-101', date: '12 Jun 2026', description: 'Raw Sheet Metal Sale Tata', account: 'Output CGST 9%', debit: 0, credit: 15390, status: 'POSTED' },
    { id: 'JE-004', entryNumber: 'JE-2026-101', date: '12 Jun 2026', description: 'Raw Sheet Metal Sale Tata', account: 'Output SGST 9%', debit: 0, credit: 15390, status: 'POSTED' }
  ]);

  // Payment Reminders Configuration
  const [reminders, setReminders] = useState([
    { id: 'REM-001', triggerDays: 2, channel: 'WhatsApp', isActive: true, template: 'Dear {{company}}, invoice {{id}} is overdue by {{days}} days. Kindly settle. Vortiq Pay Link: {{link}}' },
    { id: 'REM-002', triggerDays: 5, channel: 'Email & SMS', isActive: false, template: 'Urgent Payment Reminder: Outstanding invoice {{id}} from Vortiq Client Portal. Please transfer ASAP.' }
  ]);

  // Anomaly warnings list
  const [anomalies, setAnomalies] = useState([
    { id: 'ANOM-101', description: 'Suspected duplicate entry: Identical invoice drafted for Reliance Retail (Rs 12,00,000) within 3 minutes.', severity: 'CRITICAL' }
  ]);

  // Invoice creation form states
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemHsn, setNewItemHsn] = useState('7208.51');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemRate, setNewItemRate] = useState(1000);
  const [newItemGstRate, setNewItemGstRate] = useState(18);
  const [newItemDiscount, setNewItemDiscount] = useState(0);

  const [aiWorking, setAiWorking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('Finance Audit: All posted ledger ledger transactions are in perfect balance. One critical alert remains (duplicate Reliance Invoice suspicion). Note: Auto-ledger writes blocked for compliance.');

  // Calculation helpers for Invoice
  const getInvoiceSubtotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => {
      const discountedRate = item.rate * (1 - item.discountPct / 100);
      return sum + (discountedRate * item.qty);
    }, 0);
  };

  const getInvoiceTax = (items: InvoiceItem[], type: 'CGST' | 'SGST' | 'IGST' | 'TOTAL') => {
    return items.reduce((sum, item) => {
      const discountedRate = item.rate * (1 - item.discountPct / 100);
      const itemTax = discountedRate * item.qty * (item.gstRate / 100);
      if (type === 'CGST' || type === 'SGST') return sum + (itemTax / 2); // local split
      return sum + itemTax; // Total/IGST
    }, 0);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newItemDesc.trim()) return;
    
    const newItems: InvoiceItem[] = [{
      description: newItemDesc,
      hsnCode: newItemHsn,
      qty: newItemQty,
      rate: newItemRate,
      discountPct: newItemDiscount,
      gstRate: newItemGstRate
    }];

    const newI: Invoice = {
      id: `INV-2026-00${invoices.length + 1}`,
      customer: newCustomer,
      gstin: newGstin.toUpperCase() || 'Unregistered',
      items: newItems,
      paymentStatus: 'DRAFT',
      irnStatus: 'PENDING',
      dueDate: '30 Jun 2026',
      date: 'Today'
    };

    setInvoices([newI, ...invoices]);
    resetForm();
  };

  const resetForm = () => {
    setNewCustomer('');
    setNewGstin('');
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemRate(1000);
    setNewItemDiscount(0);
    setIsAdding(false);
  };

  const handleApproveAndFileIRN = (id: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return { ...inv, irnStatus: 'FILED', paymentStatus: 'SENT' };
      }
      return inv;
    }));

    // Post to ledger logs (Human in loop action)
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    const sub = getInvoiceSubtotal(inv.items);
    const tax = getInvoiceTax(inv.items, 'TOTAL');
    const grand = sub + tax;

    const newJE1: JournalEntry = {
      id: `JE-${Date.now()}-1`,
      entryNumber: `JE-2026-00${ledger.length / 4 + 1}`,
      date: 'Today',
      description: `Sales Invoicing - ${inv.customer}`,
      account: 'Accounts Receivable',
      debit: grand,
      credit: 0,
      status: 'POSTED'
    };

    const newJE2: JournalEntry = {
      id: `JE-${Date.now()}-2`,
      entryNumber: `JE-2026-00${ledger.length / 4 + 1}`,
      date: 'Today',
      description: `Sales Invoicing - ${inv.customer}`,
      account: 'Sales Income',
      debit: 0,
      credit: sub,
      status: 'POSTED'
    };
    const newJE3: JournalEntry = {
      id: `JE-${Date.now()}-3`,
      entryNumber: `JE-2026-00${ledger.length / 4 + 1}`,
      date: 'Today',
      description: `Sales Invoicing - ${inv.customer}`,
      account: 'Output CGST Liability',
      debit: 0,
      credit: tax / 2,
      status: 'POSTED'
    };
    const newJE4: JournalEntry = {
      id: `JE-${Date.now()}-4`,
      entryNumber: `JE-2026-00${ledger.length / 4 + 1}`,
      date: 'Today',
      description: `Sales Invoicing - ${inv.customer}`,
      account: 'Output SGST Liability',
      debit: 0,
      credit: tax / 2,
      status: 'POSTED'
    };

    setLedger([...ledger, newJE1, newJE2, newJE3, newJE4]);
  };

  const handleRunAudit = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAnomalies([]);
      setAiAnalysis('Updated Audit: Reliance duplicate check passed. All ledgers validated matching physical inventory dispatches.');
    }, 1200);
  };

  const financeMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('invoice') || lower.includes('calculate') || lower.includes('tax') || lower.includes('gst')) {
      return {
        answer: "Finance Agent: Simulated GST & tax calculations. Subtotal: Rs 1,80,000. CGST (9%): Rs 16,200. SGST (9%): Rs 16,200. Total Invoice value: Rs 2,12,400. Draft ready, awaiting IRN filing authorization.",
        logs: "Calculated tax schedule for B2B supply transaction."
      };
    }
    if (lower.includes('anomaly') || lower.includes('duplicate') || lower.includes('alert')) {
      return {
        answer: "Finance Agent: Scan results: Identical invoice drafted for Reliance Retail (Rs 12,0,000) within 3 minutes matches duplicate transaction criteria. Recommend rejecting INV-2026-002 duplicate.",
        logs: "Audited ledger for transactional anomalies."
      };
    }
    return {
      answer: "Finance Agent: Running audit and tracking payment cycles. Ask me to 'calculate invoice tax' or 'check duplicate invoice alert'.",
      logs: "Scanned active B2B invoice directory."
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
              <Landmark className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400" />
              Corporate Finance & GST Ledger
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Generate B2B GST tax invoices, register e-invoice IRN numbers, schedule payment reminders, and balance journal ledgers.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsAdding(true);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          </div>
        </div>

        {/* Finance Agent Security Panel */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  FinanceAgent Audits 
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-black rounded-full">Secure Ledger</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleRunAudit}
            disabled={aiWorking}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Scan Anomalies
          </button>
        </div>

        {/* Profit and Loss Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 text-slate-400 uppercase tracking-wider">Gross Revenues</span>
            <div className="flex justify-between items-end mt-2">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">Rs 18,50,000</h4>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-950 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +14%
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Accounts Receivable</span>
            <div className="flex justify-between items-end mt-2">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">Rs 6,20,000</h4>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-950">Pending Clearance</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Operational Expenses</span>
            <div className="flex justify-between items-end mt-2">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">Rs 3,10,000</h4>
              <span className="text-[10px] text-red-600 dark:text-red-450 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-100 dark:border-red-950 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> -4%
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 overflow-x-auto">
          {[
            { id: 'invoices', label: 'B2B GST Invoices', icon: FileText },
            { id: 'ledger', label: 'CA Journal Ledger', icon: FileSpreadsheet },
            { id: 'gst', label: 'GST Filings (GSTR-1)', icon: Landmark },
            { id: 'reminders', label: 'Payment Reminders Flow', icon: Bell }
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

        {/* Invoice Creation Form */}
        {isAdding && (
          <form onSubmit={handleCreateInvoice} className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl animate-fadeIn shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Draft New B2B GST Invoice</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer Recipient Name</label>
                <input 
                  type="text" required value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="e.g. Tata Motors"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer GSTIN</label>
                <input 
                  type="text" required value={newGstin} onChange={(e) => setNewGstin(e.target.value)}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Invoice Line Item Details</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="text" required placeholder="Item description" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
                <input 
                  type="text" required placeholder="HSN Code" value={newItemHsn} onChange={(e) => setNewItemHsn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
                <select 
                  value={newItemGstRate} onChange={(e) => setNewItemGstRate(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800"
                >
                  <option value={5}>GST 5%</option>
                  <option value={12}>GST 12%</option>
                  <option value={18}>GST 18%</option>
                  <option value={28}>GST 28%</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="number" placeholder="Quantity" value={newItemQty} onChange={(e) => setNewItemQty(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
                <input 
                  type="number" placeholder="Rate / Price (INR)" value={newItemRate} onChange={(e) => setNewItemRate(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
                <input 
                  type="number" placeholder="Discount %" value={newItemDiscount} onChange={(e) => setNewItemDiscount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all">
                Save Invoice Draft
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tab 1: Invoices Grid */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Billing & Invoice Records</h3>
                <span className="text-[10px] text-slate-500 font-semibold">{invoices.length} invoices total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Invoice ID</th>
                      <th className="p-4">Client / GSTIN</th>
                      <th className="p-4">Line Items Summary</th>
                      <th className="p-4">Taxable Subtotal</th>
                      <th className="p-4">CGST</th>
                      <th className="p-4">SGST</th>
                      <th className="p-4">Grand Total</th>
                      <th className="p-4">IRN Filed</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                    {invoices.map((inv) => {
                      const sub = getInvoiceSubtotal(inv.items);
                      const cgst = getInvoiceTax(inv.items, 'CGST');
                      const sgst = getInvoiceTax(inv.items, 'SGST');
                      const total = sub + getInvoiceTax(inv.items, 'TOTAL');
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300">
                          <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{inv.id}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-semibold">{inv.customer}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{inv.gstin}</p>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 max-w-xs truncate">{inv.items[0]?.description} (x{inv.items[0]?.qty})</td>
                          <td className="p-4 font-semibold">{formatINR(sub)}</td>
                          <td className="p-4 text-slate-500">{formatINR(cgst)}</td>
                          <td className="p-4 text-slate-500">{formatINR(sgst)}</td>
                          <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">{formatINR(total)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                              inv.irnStatus === 'FILED' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' 
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950'
                            }`}>
                              {inv.irnStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                              inv.paymentStatus === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' :
                              inv.paymentStatus === 'OVERDUE' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950' :
                              inv.paymentStatus === 'SENT' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-950' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}>
                              {inv.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {inv.irnStatus === 'PENDING' && (
                              <button 
                                onClick={() => handleApproveAndFileIRN(inv.id)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-955 text-[10px] font-black rounded"
                              >
                                Approve & File IRN
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

            {/* Anomalies alert widget */}
            {anomalies.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900 rounded-2xl space-y-2 text-xs">
                <span className="font-extrabold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Duplicate Transaction Flagged
                </span>
                <p className="text-slate-600 dark:text-slate-300">{anomalies[0].description}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Journal Ledgers */}
        {activeTab === 'ledger' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Double-Entry Journal Entries</h3>
              <span className="text-[10px] text-slate-500 font-semibold">{ledger.length} entries posted</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">JE ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Reference Note</th>
                    <th className="p-4">GL Account Head</th>
                    <th className="p-4">Debit (DR)</th>
                    <th className="p-4">Credit (CR)</th>
                    <th className="p-4">Filing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {ledger.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300 font-medium">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{j.entryNumber}</td>
                      <td className="p-4 text-slate-400">{j.date}</td>
                      <td className="p-4 text-slate-500">{j.description}</td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{j.account}</td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">
                        {j.debit > 0 ? formatINR(j.debit) : '--'}
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">
                        {j.credit > 0 ? formatINR(j.credit) : '--'}
                      </td>
                      <td className="p-4">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950">
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: GSTR Tax Filings */}
        {activeTab === 'gst' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">GSTR-1 Tax File Assembler</h3>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white">GSTR-1 Offline Schema (June 2026)</p>
                <p className="text-[10px] text-slate-500 mt-1">Ready for file uploads on GST portal. Auto calculated SGST/CGST split ledger totals.</p>
              </div>
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                <Download className="w-3.5 h-3.5" /> Export GSTR JSON
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-black">Outward Supplies (B2B)</span>
                <p className="text-sm font-bold text-slate-800">2 Invoices filed with IRN</p>
                <p className="text-[11px] text-slate-500">Total Taxable Value: Rs 12,01,170</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-black">Tax Liabilities Summary</span>
                <p className="text-sm font-bold text-slate-800">SGST/CGST: Rs 30,780 each</p>
                <p className="text-[11px] text-slate-500">IGST: Rs 0 (All regional intra-state supplies)</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payment Reminders */}
        {activeTab === 'reminders' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Automation Reminder Rules</h3>
            
            <div className="space-y-4">
              {reminders.map((r) => (
                <div key={r.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-950">
                        {r.channel} Trigger
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">Send reminder {r.triggerDays} days after Invoice Due Date</p>
                    </div>
                    <button 
                      onClick={() => setReminders(prev => prev.map(item => item.id === r.id ? { ...item, isActive: !item.isActive } : item))}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors border ${
                        r.isActive 
                          ? 'bg-teal-50 border-teal-200 text-teal-600' 
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      {r.isActive ? 'Rule Active' : 'Rule Disabled'}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    {r.template}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <ModuleAgentSidebar 
        agentName="Finance & Tax Agent"
        permissionsScope="Permissions Scope: Read customer invoices list, view ledger entries, audit GSTR-1 liabilities calculations. Denied direct autonomous write to ERP ledgers (Human review mandatory)."
        suggestedPrompts={[
          "calculate invoice tax for RAW-STEEL-V4",
          "check duplicate invoice alert Reliance",
          "verify GSTR-1 liability summary"
        ]}
        defaultMemoryLogs={[
          "Finance Agent online.",
          "Scanned 3 invoices. Outward GSTR-1 summary matches expected tax liabilities.",
          "Anomaly warning: Duplicate check flagged 1 potential risk."
        ]}
        mockResponseMapper={financeMockResponse}
      />

      </div>
    </ConsoleLayout>
  );
}
