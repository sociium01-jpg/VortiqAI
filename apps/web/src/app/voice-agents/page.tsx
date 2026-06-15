'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  PhoneCall, ShieldCheck, History, Code, AlertOctagon, 
  Play, Plus, PhoneMissed, PhoneForwarded, CheckCircle2, UserPlus
} from 'lucide-react';

export default function VoiceAgentsPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';
  const [activeTab, setActiveTab] = useState('history');
  
  // Compliance verification list
  const complianceChecks = [
    { title: 'Calling hours validation (10 AM - 7 PM IST)', status: true },
    { title: 'DLT Registered Header series (140/160 series)', status: true },
    { title: 'NCPR scrubbing active (Auto-blocking active DNDs)', status: true },
    { title: 'Immediate outbound opt-out detection system', status: true }
  ];

  // Outbound call queues
  const outboundQueue = isDemo ? [
    { id: 1, name: 'Ravi Shah', company: 'Bharat Forge', phone: '+919876543210', leadScore: 89, reason: 'Follow-up proposal' },
    { id: 2, name: 'Anjali Verma', company: 'Tata Motors', phone: '+919865432109', leadScore: 78, reason: 'Cold intro raw sheets' }
  ] : [];

  // Call history records
  const callHistory = isDemo ? [
    { id: 'call-01', name: 'Ravi Shah', phone: '+919876543210', duration: '1m 24s', outcome: 'INTERESTED', date: 'Today, 11:20 AM' },
    { id: 'call-02', name: 'Karan Malhotra', phone: '+919123456789', duration: '0m 45s', outcome: 'NOT_INTERESTED', date: 'Yesterday, 03:40 PM' },
    { id: 'call-03', name: 'Sunita Rao', phone: '+919876123456', duration: '0m 00s', outcome: 'VOICEMAIL_LEFT', date: 'Yesterday, 10:15 AM' }
  ] : [];

  return (
    <ConsoleLayout>
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <PhoneCall className="w-5.5 h-5.5 text-teal-400" /> Outbound AI Voice Agent Panel
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Configure regulatory-compliant conversational calling agents for sales & support.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/10">
            <Plus className="w-4 h-4" /> Create Script
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COMPLIANCE CHECKLIST & SCRIPTS */}
        <div className="space-y-6">
          
          {/* TRAI Verification checklist */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> TRAI Regulatory Compliance
            </h3>
            <div className="space-y-3">
              {complianceChecks.map((check, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-300">{check.title}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>

          {/* DND scrubbing logs preview */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2 mb-3">
              <AlertOctagon className="w-5 h-5 text-red-400" /> DND Scrub Logs (NCPR)
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">+919988776655</p>
                  <span className="text-[10px] text-slate-500">Scrubbed via Cache</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20">
                  DND BLOCKED
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">+919876543210</p>
                  <span className="text-[10px] text-slate-500">Scrubbed via NCPR API</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CLEAN
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* LOG QUEUE AND HISTORY DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation Tab */}
          <div className="flex gap-2 border-b border-slate-900 pb-2">
            {[
              { id: 'history', label: 'Call History', icon: History },
              { id: 'queue', label: 'Call Queue', icon: PhoneForwarded }
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-slate-900 text-teal-400 border border-slate-800' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <IconComp className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'history' ? (
            <div className="space-y-4">
              {callHistory.map((call) => (
                <div key={call.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white">{call.name}</h4>
                    <p className="text-xs text-slate-400">{call.phone} • Duration: {call.duration}</p>
                    <span className="text-[10px] text-slate-500">Call made on {call.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${
                      call.outcome === 'INTERESTED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : call.outcome === 'NOT_INTERESTED'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {call.outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {outboundQueue.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white">{item.name} ({item.company})</h4>
                    <p className="text-xs text-slate-400">Phone: {item.phone} • Lead Score: {item.leadScore}/100</p>
                    <span className="text-[10px] text-slate-500">Reason: {item.reason}</span>
                  </div>
                  <button className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-lg text-xs font-bold transition-all">
                    <Play className="w-3.5 h-3.5 fill-teal-400" /> Start call
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </ConsoleLayout>
  );
}
