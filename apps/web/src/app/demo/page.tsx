'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, ShoppingBag, Cloud, Users, 
  ArrowRight, Activity, ShieldCheck, HelpCircle
} from 'lucide-react';

export default function DemoPage() {
  const personas = [
    {
      id: 'manufacturing',
      title: 'Bharat Components Pvt Ltd',
      type: 'Industrial Manufacturing',
      icon: Building2,
      color: 'from-amber-500/10 to-orange-600/10 text-amber-400 border-amber-500/25',
      buttonBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
      stats: [
        { label: 'B2B Contacts', val: '45' },
        { label: 'Pipeline Deals', val: '12' },
        { label: 'Awaiting Approvals', val: '3' },
        { label: 'Low Stock Alerts', val: '3' },
        { label: 'Today\'s Tasks', val: '8' }
      ],
      aiOverview: 'AI Sales Agent active. Finance Agent gates GSTR-1 drafts and TDS alerts awaiting human sign-off.'
    },
    {
      id: 'd2c',
      title: 'Zora Wellness',
      type: 'D2C Consumer Brand',
      icon: ShoppingBag,
      color: 'from-pink-500/10 to-rose-600/10 text-pink-400 border-pink-500/25',
      buttonBg: 'bg-pink-500 hover:bg-pink-400 text-slate-950',
      stats: [
        { label: 'E-com Contacts', val: '2,400' },
        { label: 'Shopify Orders', val: '34' },
        { label: 'AI Support Resolved', val: '9' },
        { label: 'Pending Dispatches', val: '8' },
        { label: 'Staff Count', val: '8' }
      ],
      aiOverview: 'Google/Meta Ads CPL analyzer active. Shopify order connector syncing. Support Agent auto-resolves tickets.'
    },
    {
      id: 'saas',
      title: 'Nexus Cloud',
      type: 'B2B SaaS Startup',
      icon: Cloud,
      color: 'from-teal-500/10 to-indigo-600/10 text-teal-400 border-teal-500/25',
      buttonBg: 'bg-teal-500 hover:bg-teal-400 text-slate-950',
      stats: [
        { label: 'SaaS Leads', val: '180' },
        { label: 'Negotiations', val: '5 (Rs 45L)' },
        { label: 'AI Outbound Drafts', val: '7' },
        { label: 'Monthly Revenue', val: 'Rs 8.4L' },
        { label: 'Open Candidates', val: '4' }
      ],
      aiOverview: 'Outbound sales agents writing copy. Legal agent drafting NDAs. HR agent screening engineers.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
            V
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">VORTIQ</h1>
            <p className="text-xs text-slate-500 font-medium">Business OS</p>
          </div>
        </div>
        <Link 
          href="/signup" 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          Start Free Trial <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Header */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> INTERACTIVE PRE-POPULATED DEMO CONSOLE
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Explore Vortiq OS Personas
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
          Launch a read-only sandbox pre-populated with live contacts, GST invoice audits, low stock indicators, and human-in-the-loop review feeds.
        </p>
      </section>

      {/* Personas cards */}
      <section className="px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-24">
        {personas.map((p) => {
          const Icon = p.icon;
          return (
            <div 
              key={p.id}
              className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all shadow-2xl relative overflow-hidden backdrop-blur-md"
            >
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${p.color} border flex items-center justify-center`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{p.title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.type}</p>
                  </div>
                </div>

                {/* Pre-populated stats grid */}
                <div className="grid grid-cols-2 gap-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
                  {p.stats.map((s, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</span>
                      <p className="text-sm font-extrabold text-white">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* AI integration notes */}
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">AI Operations Telemetry</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-semibold italic">
                    "{p.aiOverview}"
                  </p>
                </div>

              </div>

              <div className="pt-8 border-t border-slate-800 mt-8">
                <Link 
                  href={`/dashboard?demo=${p.id}`}
                  className={`w-full py-3.5 rounded-xl text-center text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg ${p.buttonBg}`}
                >
                  Explore as Persona <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          );
        })}
      </section>

    </div>
  );
}
