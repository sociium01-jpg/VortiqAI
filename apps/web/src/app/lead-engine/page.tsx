'use client';

import React, { useState } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  Target, Sparkles, Filter, Check, X, ShieldAlert,
  Search, RefreshCw, ArrowRight, Download, Users, Mail, Phone, ExternalLink, Plus, AlertCircle
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

interface ICPFilters {
  industries: string[];
  subIndustries: string[];
  jobTitles: string[];
  seniorities: string[];
  locations: string[];
  minCompanySize: number;
  maxCompanySize: number;
}

export default function LeadEnginePage() {
  const [icpPrompt, setIcpPrompt] = useState(
    "We want B2B procurement managers and supply chain directors in manufacturing hubs like Pune and Chennai, working at mid-to-large-size automotive parts suppliers."
  );

  const [parsing, setParsing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(47);
  const [maxCredits] = useState(100);
  const [estimatedLeads, setEstimatedLeads] = useState<number | null>(null);
  const [filters, setFilters] = useState<ICPFilters | null>(null);

  // Manual entry states
  const [manualName, setManualName] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Auto assignment state
  const [assignmentRule, setAssignmentRule] = useState('ROUND_ROBIN');

  // Duplicate check state
  const [scanningDuplicates, setScanningDuplicates] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');

  // Lead search result set mock
  const [leads, setLeads] = useState([
    { id: 'lead-1', name: 'Rajesh Kulkarni', title: 'Director of Procurement', company: 'Indo-Autotech Pvt Ltd', location: 'Pune, Maharashtra', size: 450, email: 'rajesh.k@indoautotech.in', phone: '+91 98765 43201', linkedin: 'https://linkedin.com/in/rajesh-kulkarni', score: 96, emailVerified: true, phoneVerified: true, status: 'RAW', selected: false },
    { id: 'lead-2', name: 'Suresh Kumar', title: 'VP Supply Chain', company: 'Chennai Pistons Group', location: 'Chennai, Tamil Nadu', size: 1200, email: 'suresh.kumar@chennaipistons.com', phone: '+91 98440 12345', linkedin: 'https://linkedin.com/in/suresh-kumar', score: 91, emailVerified: true, phoneVerified: false, status: 'RAW', selected: false },
    { id: 'lead-3', name: 'Meera Deshmukh', title: 'Procurement Specialist', company: 'Varroc Engineering', location: 'Aurangabad, Maharashtra', size: 5200, email: 'meera.deshmukh@varroc.com', phone: '+91 99223 34455', linkedin: 'https://linkedin.com/in/meera-deshmukh', score: 85, emailVerified: true, phoneVerified: true, status: 'RAW', selected: false },
    { id: 'lead-4', name: 'Aditya Sen', title: 'Senior Buyer - Electronics', company: 'Minda Industries', location: 'Gurugram, Haryana', size: 850, email: 'aditya.sen@minda.co.in', phone: '+91 95601 12233', linkedin: 'https://linkedin.com/in/aditya-sen', score: 72, emailVerified: false, phoneVerified: true, status: 'RAW', selected: false }
  ]);

  const [scoreFilter, setScoreFilter] = useState<number>(70);
  const [verifyEmailFilter, setVerifyEmailFilter] = useState<boolean>(false);
  const [verifyPhoneFilter, setVerifyPhoneFilter] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleParseICP = () => {
    setParsing(true);
    setTimeout(() => {
      setFilters({
        industries: ['Manufacturing', 'Automotive'],
        subIndustries: ['Auto Components', 'Forgings'],
        jobTitles: ['Procurement Manager', 'Supply Chain Director', 'VP SCM'],
        seniorities: ['Director', 'VP', 'Manager'],
        locations: ['Pune', 'Chennai', 'Aurangabad'],
        minCompanySize: 100,
        maxCompanySize: 5000
      });
      setEstimatedLeads(1420);
      setParsing(false);
    }, 800);
  };

  const handleFindLeads = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
    }, 1000);
  };

  const toggleSelectLead = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, selected: !l.selected } : l));
  };

  const toggleSelectAll = () => {
    const allSelected = filteredLeads.every(l => l.selected);
    setLeads(prev => prev.map(l => {
      if (filteredLeads.some(fl => fl.id === l.id)) {
        return { ...l, selected: !allSelected };
      }
      return l;
    }));
  };

  const handleImportLead = (id: string) => {
    if (creditsUsed >= maxCredits) {
      alert("Upgrade plan to unlock more monthly lead credits!");
      return;
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'IMPORTED' } : l));
    setCreditsUsed(prev => prev + 1);
  };

  const handleRejectLead = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
  };

  const handleBulkImport = () => {
    const selected = filteredLeads.filter(l => l.selected && l.status === 'RAW');
    if (selected.length === 0) return;
    if (creditsUsed + selected.length > maxCredits) {
      alert("Upgrade plan or purchase extra lead credits to import all selected leads!");
      return;
    }
    setLeads(prev => prev.map(l => {
      if (selected.some(sl => sl.id === l.id)) {
        return { ...l, status: 'IMPORTED', selected: false };
      }
      return l;
    }));
    setCreditsUsed(prev => prev + selected.length);
  };

  const handleBulkReject = () => {
    const selected = filteredLeads.filter(l => l.selected && l.status === 'RAW');
    if (selected.length === 0) return;
    setLeads(prev => prev.map(l => {
      if (selected.some(sl => sl.id === l.id)) {
        return { ...l, status: 'REJECTED', selected: false };
      }
      return l;
    }));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualCompany || !manualEmail) {
      setValidationError('All required fields (Name, Company, Email) must be filled.');
      return;
    }
    const isDuplicate = leads.some(l => l.email.toLowerCase() === manualEmail.toLowerCase());
    if (isDuplicate) {
      setValidationError('Lead with this email already exists in search results.');
      return;
    }

    const newLead = {
      id: `manual-${Date.now()}`,
      name: manualName,
      title: 'Business Target',
      company: manualCompany,
      location: 'Custom entry',
      size: 100,
      email: manualEmail,
      phone: manualPhone || 'Not provided',
      linkedin: '#',
      score: 60,
      emailVerified: true,
      phoneVerified: false,
      status: 'RAW',
      selected: false
    };

    setLeads([newLead, ...leads]);
    setManualName('');
    setManualCompany('');
    setManualEmail('');
    setManualPhone('');
    setValidationError('');
    setShowManualForm(false);
  };

  const triggerDuplicateScan = () => {
    setScanningDuplicates(true);
    setDuplicateMessage('');
    setTimeout(() => {
      setScanningDuplicates(false);
      setDuplicateMessage('Scan Complete: No duplicate email records found in directories.');
    }, 1200);
  };

  const removeFilterTag = (type: keyof ICPFilters, value: string) => {
    if (!filters) return;
    const current = filters[type];
    if (Array.isArray(current)) {
      setFilters({
        ...filters,
        [type]: (current as string[]).filter(v => v !== value)
      });
    }
  };

  const filteredLeads = leads.filter(l => {
    if (l.score < scoreFilter) return false;
    if (verifyEmailFilter && !l.emailVerified) return false;
    if (verifyPhoneFilter && !l.phoneVerified) return false;
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    return true;
  });

  const leadEngineMockMapper = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('scrape') || lower.includes('search') || lower.includes('find')) {
      return {
        answer: "Lead Engine Agent: Sourced 5 matching B2B targets in Chennai region matching 'Procurement Director'. Estimated credits charge: 5.",
        logs: "Parsed ICP rule 'Procurement Director Chennai' and executed scraper queue."
      };
    }
    if (lower.includes('verify') || lower.includes('validate')) {
      return {
        answer: "Lead Engine Agent: Sourced lead validation results: 3 emails active, 1 catch-all risk. Carrier check shows NCPR scrub completed.",
        logs: "Validated target emails and scrubbed phones against DND database."
      };
    }
    return {
      answer: "Lead Engine Agent: Sourcing active. Ask me to 'search procurement Chennai leads' or 'validate sourced list'.",
      logs: "Checked credit limits and active ICP prompts."
    };
  };

  return (
    <ConsoleLayout>
      <div className="flex gap-6 items-start">
        
        {/* Main content grid */}
        <div className="flex-1 space-y-6">
          
          {/* Banner header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5.5 h-5.5 text-teal-655 text-teal-600 dark:text-teal-400" />
                Autonomous Lead Engine
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Find, enrich, and validate qualified business targets matching your ideal client persona (ICP).
              </p>
            </div>
            
            {/* Credit balance visualizer */}
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Credits Remaining</p>
                <p className="text-lg font-bold text-teal-605 text-teal-600 dark:text-teal-400 mt-0.5">
                  {maxCredits - creditsUsed} <span className="text-xs text-slate-450">/ {maxCredits}</span>
                </p>
              </div>
              <div className="w-20 bg-slate-200 dark:bg-slate-900 rounded-full h-2">
                <div 
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, 100 - (creditsUsed / maxCredits) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* ICP Search panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-teal-605 text-teal-600 dark:text-teal-400" />
                AI Ideal Customer Profile (ICP) Builder
              </h3>
              
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:border-teal-500 resize-none h-24 transition-colors font-medium"
                placeholder="Describe your ideal client..."
                value={icpPrompt}
                onChange={(e) => setIcpPrompt(e.target.value)}
              />

              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] text-slate-500 font-semibold">
                  AI extracts target cities, designations, industries, and size.
                </p>
                <button
                  onClick={handleParseICP}
                  disabled={parsing}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-400 hover:to-indigo-500 text-xs font-semibold rounded-xl text-white shadow-lg shadow-teal-500/10 flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                >
                  {parsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Parse with AI
                </button>
              </div>

              {/* Parsed Chips and tags */}
              {filters && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-900 space-y-3">
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Active Filters</p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold w-16">Industries:</span>
                      {filters.industries.map(ind => (
                        <span key={ind} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 text-[10px] font-semibold">
                          {ind}
                          <button onClick={() => removeFilterTag('industries', ind)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold w-16">Job Titles:</span>
                      {filters.jobTitles.map(job => (
                        <span key={job} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-550/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold">
                          {job}
                          <button onClick={() => removeFilterTag('jobTitles', job)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold w-16">Locations:</span>
                      {filters.locations.map(loc => (
                        <span key={loc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-750 text-[10px] font-semibold">
                          {loc}
                          <button onClick={() => removeFilterTag('locations', loc)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rule Configurations & Actions */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-855 dark:text-slate-200">Rule Configurations & Actions</h3>
                <div className="mt-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Auto-Assignment rules</label>
                    <select 
                      value={assignmentRule} 
                      onChange={(e) => setAssignmentRule(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-350 focus:outline-none"
                    >
                      <option value="ROUND_ROBIN">Round Robin</option>
                      <option value="HIGH_SCORE_LEAD">High Scorer to Lead Rep</option>
                      <option value="GEOGRAPHICAL">Geographical Match</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-105 dark:border-slate-850 pt-2.5">
                    <button 
                      onClick={triggerDuplicateScan}
                      disabled={scanningDuplicates}
                      className="text-[10px] text-teal-650 dark:text-teal-400 font-bold hover:underline"
                    >
                      {scanningDuplicates ? 'Scanning...' : 'Scan Duplicates'}
                    </button>
                    <button 
                      onClick={() => setShowManualForm(!showManualForm)}
                      className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Manual Lead
                    </button>
                  </div>
                  {duplicateMessage && (
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">{duplicateMessage}</p>
                  )}
                </div>
              </div>

              <div className="py-2 text-center border-t border-slate-105 dark:border-slate-850 pt-4">
                {estimatedLeads !== null ? (
                  <div>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">
                      {estimatedLeads.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Matching profiles found</p>
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-605 text-xs font-semibold">
                    Click "Parse with AI" to estimate lead volume
                  </div>
                )}
              </div>

              <button
                onClick={handleFindLeads}
                disabled={searching || !filters}
                className="w-full py-3 bg-teal-605 hover:bg-teal-750 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-955 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-205 disabled:opacity-40"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Find Leads
              </button>
            </div>
          </div>

          {/* Manual Lead Entry Overlay Form */}
          {showManualForm && (
            <form onSubmit={handleManualSubmit} className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-705 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Manual Target Entry
              </h3>
              {validationError && (
                <div className="p-3 bg-red-500/5 border border-red-500/15 text-red-650 dark:text-red-400 text-[10px] font-semibold rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {validationError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Full Name *" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="text" 
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  placeholder="Company Name *" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="email" 
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Email Address *" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="text" 
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="Phone Mobile" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-555 text-white rounded-lg text-xs font-bold transition-all">
                  Save Target
                </button>
                <button type="button" onClick={() => { setShowManualForm(false); setValidationError(''); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Results Filters & Table */}
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden shadow-sm">
            
            {/* Filters Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-900 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-center gap-4">
                
                {/* Score threshold */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-450 font-medium">Min AI Score:</span>
                  <input 
                    type="range" 
                    min="50" 
                    max="95" 
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(Number(e.target.value))}
                    className="accent-teal-500 w-24 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-bold">{scoreFilter}+</span>
                </div>

                {/* Verify filters */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={verifyEmailFilter}
                    onChange={(e) => setVerifyEmailFilter(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-teal-500 focus:ring-teal-500/50 bg-white dark:bg-slate-950 w-3.5 h-3.5"
                  />
                  <span className="text-xs text-slate-505 dark:text-slate-400 font-semibold">Verified Email</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={verifyPhoneFilter}
                    onChange={(e) => setVerifyPhoneFilter(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-teal-505 focus:ring-teal-500/50 bg-white dark:bg-slate-950 w-3.5 h-3.5"
                  />
                  <span className="text-xs text-slate-505 dark:text-slate-400 font-semibold">Verified Mobile</span>
                </label>

                {/* Status filter */}
                <select
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-slate-705 dark:text-slate-300 py-1.5 px-3 focus:outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="RAW">Pending Import</option>
                  <option value="IMPORTED">Imported to CRM</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Actions for Selected */}
              <div className="flex items-center gap-2">
                {filteredLeads.some(l => l.selected) && (
                  <div className="flex items-center gap-2 mr-2 animate-fade-in">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {filteredLeads.filter(l => l.selected).length} selected
                    </span>
                    <button
                      onClick={handleBulkImport}
                      className="px-2.5 py-1 bg-teal-650 dark:bg-teal-500 hover:bg-teal-750 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-[10px] font-bold rounded-lg transition-all"
                    >
                      Bulk Import
                    </button>
                    <button
                      onClick={handleBulkReject}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg transition-all"
                    >
                      Bulk Reject
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => alert('Exported lead list to CSV')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-955 dark:hover:bg-slate-900 border border-slate-250 dark:border-slate-850 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> CSV Export
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs leading-normal">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-900 text-slate-405 font-bold uppercase tracking-wider bg-slate-50/20">
                    <th className="py-2.5 px-4 w-10">
                      <input 
                        type="checkbox"
                        checked={filteredLeads.length > 0 && filteredLeads.every(l => l.selected)}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-350 dark:border-slate-850 bg-white dark:bg-slate-950 text-teal-500 focus:ring-teal-500/50 w-3.5 h-3.5"
                      />
                    </th>
                    <th className="py-2.5 px-3">Company Target</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Contact Email/Mobile</th>
                    <th className="py-2.5 px-3">AI Fit</th>
                    <th className="py-2.5 px-3 text-right">Import Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
                  {filteredLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-3 px-4">
                        <input 
                          type="checkbox"
                          checked={l.selected}
                          onChange={() => toggleSelectLead(l.id)}
                          className="rounded border-slate-350 dark:border-slate-850 bg-white dark:bg-slate-950 text-teal-500 focus:ring-teal-500/50 w-3.5 h-3.5"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {l.name}
                            <a href={l.linkedin} target="_blank" className="text-slate-400 hover:text-teal-500"><ExternalLink className="w-3 h-3" /></a>
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">{l.title} @ <b className="font-bold text-slate-700 dark:text-slate-300">{l.company}</b></p>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[11px] text-slate-500">{l.location}</td>
                      <td className="py-3 px-3">
                        {l.status === 'IMPORTED' ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {l.email}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {l.phone}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-extrabold text-slate-400 blur-[3px] select-none select-all-none">rajesh.k@indoautotech.in</p>
                            <p className="text-[10px] text-teal-655 dark:text-teal-400 mt-0.5 font-bold">Click Import to unlock contacts details</p>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-850 dark:text-slate-200">
                        {l.score}/100
                      </td>
                      <td className="py-3 px-3 text-right">
                        {l.status === 'IMPORTED' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded text-[9px] font-bold">
                            Imported
                          </span>
                        ) : l.status === 'REJECTED' ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px] font-bold">
                            Rejected
                          </span>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleImportLead(l.id)}
                              className="p-1.5 bg-teal-500/10 text-teal-650 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/25 rounded-lg transition-colors"
                              title="Import to CRM"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectLead(l.id)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-505 rounded-lg transition-colors"
                              title="Reject Target"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Collapsible Local Lead Engine Agent Sidebar */}
        <ModuleAgentSidebar 
          agentName="Lead Engine Agent"
          permissionsScope="Authorized to scan B2B directories, read scraped ICP rules, execute duplicate validation, and check email/mobile verification statuses."
          suggestedPrompts={[
            "scrape procurement Chennai leads",
            "verify target lists contact channels",
            "check duplicate records directories"
          ]}
          defaultMemoryLogs={[
            "Lead Engine initialized: vector ICP parser active.",
            "Parsed prompt prompt target: automotive procurement managers.",
            "Estimated matching leads pool: 1,420 targets."
          ]}
          mockResponseMapper={leadEngineMockMapper}
        />

      </div>
    </ConsoleLayout>
  );
}
