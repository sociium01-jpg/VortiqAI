'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  PhoneCall, Play, Pause, Sparkles, Brain, Clock, ShieldCheck, 
  ChevronRight, Plus, Target, CheckCircle2, AlertTriangle, FileText, Printer, Download, Paperclip, Send, Trash2
} from 'lucide-react';
import { handlePrint, handleExportPDF } from '../utils/export';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

export default function SalesPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  useEffect(() => {
    if (isLoaded && !isDemo) {
      setCallQueue([]);
      setRevenueAchieved(0);
      setTargetAmount(0);
      setActivities([]);
    }
  }, [isLoaded, isDemo]);

  // Mock outbound calls queue
  const [callQueue, setCallQueue] = useState([
    { id: 'CALL-001', name: 'Ravi Shah', phone: '+91 98765 43210', company: 'Bharat Forge', status: 'QUEUED', timeRestriction: 'TRAI OK (10 AM - 7 PM IST)', ncprScrubbed: true },
    { id: 'CALL-002', name: 'Amit Desai', phone: '+91 98223 34455', company: 'Reliance Retail', status: 'QUEUED', timeRestriction: 'TRAI OK (10 AM - 7 PM IST)', ncprScrubbed: true },
    { id: 'CALL-003', name: 'Karan Mehra', phone: '+91 99887 1122', company: 'Aditya Birla', status: 'DND_BLOCKED', timeRestriction: 'TRAI OK (10 AM - 7 PM IST)', ncprScrubbed: false },
    { id: 'CALL-004', name: 'Priya Patel', phone: '+91 99887 76655', company: 'Tata Motors', status: 'COMPLETED', timeRestriction: 'TRAI OK (10 AM - 7 PM IST)', ncprScrubbed: true }
  ]);

  // Current Target settings
  const [targetAmount, setTargetAmount] = useState(1500000);
  const [revenueAchieved, setRevenueAchieved] = useState(1150000);

  // Call script drafted by Voice Bot
  const [selectedScript, setSelectedScript] = useState('REAL_ESTATE');
  const scripts = {
    REAL_ESTATE: "Namaste {{name}}, I'm calling from Vortiq Real Estate. Just so you know, I am an AI assistant calling on behalf of the team. I saw you showed interest in our luxury villas...",
    SAAS: "Namaste {{name}}, calling on behalf of Nexus Cloud. This is Rachel, an AI caller assistant. I wanted to verify if you'd like to try our consolidated developer dashboard...",
    MANUFACTURING: "Namaste {{name}}, calling on behalf of Bharat Components. This is a quick automated call to confirm dispatch orders of RAW-STEEL-V4 steel sheets..."
  };

  // Activity Log
  const [activities, setActivities] = useState([
    { id: 1, type: 'MANUAL_CALL', desc: 'Rahul Sharma logged a follow-up call with Karan', time: '1h ago' },
    { id: 2, type: 'AI_CALL', desc: 'AI Voice rep executed call with Priya Patel. Duration: 1m 24s', time: '2h ago' },
    { id: 3, type: 'TARGET_UPDATE', desc: 'Target adjusted manually by Admin', time: '1d ago' }
  ]);

  // Call Logger form state
  const [showLoggerForm, setShowLoggerForm] = useState(false);
  const [logClientName, setLogClientName] = useState('');
  const [logPhone, setLogPhone] = useState('');
  const [logOutcome, setLogOutcome] = useState('CONNECTED');
  const [logNotes, setLogNotes] = useState('');
  const [logFollowUpDate, setLogFollowUpDate] = useState('');
  const [logLinkedDeal, setLogLinkedDeal] = useState('None');
  const [logRep, setLogRep] = useState('Rahul Sharma');

  const [callingState, setCallingState] = useState<'IDLE' | 'CALLING'>('IDLE');

  const handleLogManualCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logClientName || !logPhone) return;

    const newActivity = {
      id: Date.now(),
      type: 'MANUAL_CALL',
      desc: `Rep ${logRep} logged Call with ${logClientName} (${logOutcome}). Notes: "${logNotes}". Next callback: ${logFollowUpDate || 'None'}. Linked Deal: ${logLinkedDeal}`,
      time: 'Just now'
    };

    setActivities([newActivity, ...activities]);
    
    const queueItem = {
      id: `CALL-${100 + callQueue.length + 1}`,
      name: logClientName,
      phone: logPhone,
      company: 'Client File',
      status: 'COMPLETED',
      timeRestriction: 'Manual Log',
      ncprScrubbed: true
    };
    setCallQueue([queueItem, ...callQueue]);

    setLogClientName('');
    setLogPhone('');
    setLogNotes('');
    setLogFollowUpDate('');
    setShowLoggerForm(false);
  };

  const handleTriggerCalls = () => {
    setCallingState('CALLING');
    setTimeout(() => {
      setCallingState('IDLE');
      setCallQueue(prev => prev.map(c => {
        if (c.status === 'QUEUED') {
          return { ...c, status: 'COMPLETED' };
        }
        return c;
      }));
      setActivities(prev => [
        { id: Date.now(), type: 'AI_CALL', desc: 'Batch calls queue executed autonomously via Exotel 140-series trunk.', time: 'Just now' },
        ...prev
      ]);
    }, 1200);
  };

  const salesMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('script') || lower.includes('prompt')) {
      return {
        answer: `Sales Agent: Drafted outbound script for manufacturing.\n\nScript Text:\n"${scripts.MANUFACTURING}"`,
        logs: "Compiled manufacturing voice script."
      };
    }
    if (lower.includes('compliance') || lower.includes('dnd') || lower.includes('scrub')) {
      return {
        answer: "Sales Agent: Outbound call dispatcher DND check completed. 1 blocked numbers (Karan Mehra - NCPR DND flag).",
        logs: "Checked caller registry compliance. Suspended DND outbound numbers."
      };
    }
    return {
      answer: "Sales Agent: Trunks online. Ask me to 'compile calling scripts' or 'scrub queue compliance'.",
      logs: "Audited telemarketing calling hours compliance."
    };
  };

  return (
    <ConsoleLayout>
      <div className="flex gap-6 items-start">
        
        {/* Main work area */}
        <div className="flex-1 space-y-6">
          
          {/* Module Title */}
          <div className="border-b border-slate-200 dark:border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-5.5 h-5.5 text-teal-600 text-teal-600 dark:text-teal-400" /> Sales & Calls
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage outbound calling compliance, log rep call outcomes, and configure AI scripts.</p>
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
                onClick={() => handleExportPDF('Sales Outbound Call Logs', activities)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all shadow-sm"
                title="Export PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowLoggerForm(!showLoggerForm)}
                className="px-4 py-2.5 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-500 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Log Call Outcome
              </button>
            </div>
          </div>

          {/* Manual Call Outcome Logger Form */}
          {showLoggerForm && (
            <form onSubmit={handleLogManualCallSubmit} className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl shadow-md">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1">
                <PhoneCall className="w-4 h-4" /> Log Call Outcome Form
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  required
                  value={logClientName}
                  onChange={(e) => setLogClientName(e.target.value)}
                  placeholder="Client Contact Name *" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                />
                <input 
                  type="text" 
                  required
                  value={logPhone}
                  onChange={(e) => setLogPhone(e.target.value)}
                  placeholder="Phone Number (e.g. +91 99999 88888) *" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                />
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Call Disposition Outcome</label>
                  <select 
                    value={logOutcome} 
                    onChange={(e) => setLogOutcome(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="CONNECTED">Connected & Spoke</option>
                    <option value="NO_ANSWER">No Answer</option>
                    <option value="BUSY">Busy Line</option>
                    <option value="CALLBACK_REQUESTED">Callback Requested</option>
                    <option value="NOT_INTERESTED">Not Interested</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Link Active Deal</label>
                  <select 
                    value={logLinkedDeal} 
                    onChange={(e) => setLogLinkedDeal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="None">None</option>
                    <option value="Raw Sheet Supply Deal">Raw Sheet Supply Deal</option>
                    <option value="Luxury Villa Sale">Luxury Villa Sale</option>
                    <option value="Enterprise Cloud Subscription">Enterprise Cloud Subscription</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Callback follow-up date (Optional)</label>
                  <input 
                    type="date" 
                    value={logFollowUpDate}
                    onChange={(e) => setLogFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <textarea 
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Discussion notes summary..." 
                    className="w-full h-16 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all">
                  Save Log Entry
                </button>
                <button type="button" onClick={() => setShowLoggerForm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Grid: Call queue vs Scripts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Call compliance queue */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <PhoneCall className="w-4.5 h-4.5 text-teal-600" /> Outbound Call Dispatcher
                </h3>
                <button 
                  onClick={handleTriggerCalls}
                  disabled={callingState === 'CALLING'}
                  className="px-3.5 py-2 bg-teal-605 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 disabled:opacity-50 text-white dark:text-slate-955 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-white dark:fill-slate-955" /> {callingState === 'CALLING' ? 'Executing Queue...' : 'Trigger Call Queue'}
                </button>
              </div>

              <div className="p-3 bg-amber-500/5 dark:bg-slate-950 border border-amber-500/10 dark:border-slate-800 rounded-2xl flex items-start gap-2.5 text-xs text-slate-550 dark:text-slate-400 leading-normal">
                <Clock className="w-4 h-4 text-amber-500 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-white">TRAI Time Compliance (10 AM - 7 PM IST)</p>
                  <p className="text-[10px] text-slate-500 font-medium">Platform voice dialers restrict commercial tele-calling according to NDNC scrub registry regulations.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {callQueue.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">{item.name} ({item.company})</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.phone}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className="text-slate-550">{item.timeRestriction}</span>
                        <span className={item.ncprScrubbed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                          {item.ncprScrubbed ? '✓ NCPR Scrubbed (Not DND)' : '✗ DND Flag Blocked'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                      item.status === 'DND_BLOCKED' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI voice script configurations */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-teal-600" /> AI voice Script configs
              </h3>

              <div className="flex gap-2">
                {['REAL_ESTATE', 'SAAS', 'MANUFACTURING'].map((sc) => (
                  <button 
                    key={sc}
                    onClick={() => setSelectedScript(sc)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                      selectedScript === sc 
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400' 
                        : 'bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {sc.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-800 rounded-2xl text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed relative min-h-[120px]">
                <span className="absolute -top-2 right-4 px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-bold">
                  Script text
                </span>
                "{scripts[selectedScript as keyof typeof scripts]}"
              </div>

              {/* Target meters */}
              <div className="space-y-3.5 border-t border-slate-200 dark:border-slate-900 pt-5">
                <h4 className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">Configure Monthly Target Goals</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-550">Achieved:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{formatINR(revenueAchieved)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2500000" 
                    step="50000"
                    value={revenueAchieved} 
                    onChange={(e) => setRevenueAchieved(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-550">Goal Cap:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{formatINR(targetAmount)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="500000" 
                    max="5000000" 
                    step="100000"
                    value={targetAmount} 
                    onChange={(e) => setTargetAmount(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Activity Logs feed */}
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Calling Activity Log</h3>
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-900 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-inner">
                  <span className="text-slate-800 dark:text-slate-300">{a.desc}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Collapsible Local Sales Agent Sidebar */}
        <ModuleAgentSidebar 
          agentName="Sales & Calls Agent"
          permissionsScope="Authorized to read dialer queues, log outgoing call transcripts, generate voice prompts, and monitor NCPR check status. Cannot change CRM deal stages autonomously."
          suggestedPrompts={[
            "draft SAAS calling script",
            "check call list compliance",
            "verify outbound dialer slots"
          ]}
          defaultMemoryLogs={[
            "Sales Agent active: Exotel calling trunk sync active.",
            "Audited 4 call queue records. Blocked CALL-003 due to NCPR registry DND match.",
            "Prepared voice caller scripts for real estate and SaaS."
          ]}
          mockResponseMapper={salesMockResponse}
        />

      </div>
    </ConsoleLayout>
  );
}
