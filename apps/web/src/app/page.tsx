'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, MessageSquare, Brain, Shield, ChevronRight, CheckCircle2, 
  ArrowRight, Users, Play, Pause, Sparkles, Send, BrainCircuit, Landmark, BarChart3, HelpCircle,
  Sun, Moon
} from 'lucide-react';

function AnimatedCounter({ value, duration = 1200, suffix = "", prefix = "", decimals = 0 }: { value: number; duration?: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * value);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
}

export default function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeVideo, setActiveVideo] = useState<'business' | 'manufacturing'>('business');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(activeTheme);
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

  const featuresList = [
    { title: "AI agents with memory", desc: "Your agents learn your business every day. After 6 months, they know your customers better than any new tool will." },
    { title: "Built for India, not adapted for it", desc: "Native GST, e-invoicing (IRN), TDS, PF/ESI, Razorpay reconciliation. Not plugins. Core." },
    { title: "Bring Your Own AI Key", desc: "Connect your Anthropic, OpenAI, or Gemini key. We never touch your AI costs." },
    { title: "One platform, truly connected", desc: "A Meta lead auto-flows to CRM, triggers a sales agent, creates a task, and updates your marketing dashboard. Zero manual sync." },
    { title: "Human-first finance", desc: "AI drafts, flags, and categorises. Humans approve every journal entry, payment, and return. Non-negotiable." },
    { title: "Live in an afternoon", desc: "Select your B2B/B3C/D2C template. Import your contacts. Connect your integrations. Done. No consultants." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 overflow-x-hidden transition-colors duration-200">
      
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Vortiq Logo" 
              className="h-9 w-auto dark:invert dark:brightness-200 object-contain"
            />
            <p className="text-xs text-slate-500 font-medium self-end mb-0.5">Business OS</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>

          <button 
            onClick={toggleTheme} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
          
          <Link 
            href="/signup" 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Start Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>
 
      {/* HERO SECTION */}
      <section className="relative py-28 px-6 max-w-7xl mx-auto w-full text-center space-y-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-teal-500/5 to-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> THE AI BUSINESS OS BUILT FOR INDIA
        </span>
 
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none bg-gradient-to-b from-slate-950 via-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent max-w-5xl mx-auto">
          The AI Business OS <br />built for India
        </h1>
 
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base leading-relaxed font-semibold">
          CRM. Marketing. Inventory. Finance. HR. All interconnected. AI agents that work while you sleep. GST-compliant out of the box.
        </p>
 
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black transition-all shadow-xl shadow-teal-500/20 text-xs text-center">
            Start free 15-day trial
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black transition-all border border-slate-250 dark:border-slate-800 text-xs text-center">
            Sign in to Console
          </Link>
        </div>

        {/* Animated stat counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-4xl mx-auto text-center border-t border-slate-200 dark:border-slate-900/60 mt-16">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={63} suffix="M+" />
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Indian SMEs</p>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-300">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={12} suffix=" Modules" />
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Cohesive Flow</p>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-300">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              <span>Zero</span> AI Cost
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">BYOK Routing</p>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-300">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={15} suffix="-Min Setup" />
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">No Consultants</p>
          </div>
        </div>

        {/* Trust logos strip */}
        <div className="pt-10 text-center space-y-3">
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">Works with your favorite platforms</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500 font-bold">
            <span>Tally</span>
            <span>Razorpay</span>
            <span>Shopify</span>
            <span>Meta</span>
            <span>Google</span>
            <span>WhatsApp</span>
          </div>
        </div>
      </section>

      {/* SEAMLESS BUSINESS & MANUFACTURING AI VIDEO DEMO */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-900/60 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-teal-650 dark:text-teal-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-teal-600" /> Platform in Action
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Seamless Business & Manufacturing AI Operations</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xl mx-auto leading-relaxed">
            Watch Vortiq coordinate complex lead routing pipelines, e-invoice generation, and AI-powered manufacturing quality audits in real-time.
          </p>
        </div>

        {/* Video Selector / Player */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 md:p-6 shadow-xl space-y-6">
          <div className="flex justify-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <button 
              onClick={() => setActiveVideo('business')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeVideo === 'business' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Business Command Center Demo
            </button>
            <button 
              onClick={() => setActiveVideo('manufacturing')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeVideo === 'manufacturing' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Manufacturing AI Quality Audit
            </button>
          </div>

          {/* Interactive Player Window */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-850 flex items-center justify-center group">
            {/* Visual simulation based on active video */}
            {activeVideo === 'business' ? (
              <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 text-white font-mono text-[10px] space-y-4">
                {/* Simulated Business Dashboard UI */}
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full bg-emerald-500 ${isPlaying ? 'animate-ping' : ''}`} />
                    <span className="font-bold uppercase tracking-wider text-slate-350">Vortiq Superboss AI Console</span>
                  </div>
                  <span className="bg-indigo-500/30 px-2 py-0.5 rounded text-[8px] text-teal-400">AI ASSISTED MODE ACTIVE</span>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-4">
                  {/* Left Column: Flow Logs */}
                  <div className="col-span-2 space-y-2 bg-black/40 p-4 rounded-xl border border-white/5 overflow-hidden">
                    <p className="text-teal-400">// Incoming Meta Lead Captured (Lead ID: LD-902)</p>
                    <p className="text-slate-400">18:42:01 - Lead Qualify Score: 92% (Objections: None)</p>
                    <p className="text-slate-400">18:42:02 - Lead assigned to Sales Rep Sunil Kumar</p>
                    {isPlaying ? (
                      <>
                        <p className="text-indigo-400 animate-pulse">18:42:03 - Created automated follow-up calendar slot</p>
                        <p className="text-emerald-400 animate-pulse">18:42:05 - Generated draft GSTR-1 invoice (Rs 23,997)</p>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">// Click play to simulate automated module-to-module flows...</p>
                    )}
                  </div>
                  {/* Right Column: AI Metrics */}
                  <div className="col-span-1 space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-black">Daily Conversion Rate</span>
                      <p className="text-lg font-black text-white mt-0.5">{isPlaying ? '84.6%' : '82.4%'}</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-black">Active Agent Syncs</span>
                      <p className="text-xs font-semibold text-teal-400 mt-0.5">13 Module Agents Live</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[9px] text-slate-400">
                  <span>Press play to simulate real-time pipeline audit...</span>
                  <span>FPS: 60 | Latency: 12ms</span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-mono text-[10px] space-y-4">
                {/* Simulated Manufacturing AI Audit UI */}
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${isPlaying ? 'animate-ping' : ''}`} />
                    <span className="font-bold uppercase tracking-wider text-slate-350">Manufacturing AI / Automated Batch Line 3</span>
                  </div>
                  <span className="bg-teal-500/10 px-2 py-0.5 rounded text-[8px] border border-teal-500/20 text-teal-400">HEAVY MACHINERY TELEMETRY</span>
                </div>

                <div className="flex-1 grid grid-cols-4 gap-4">
                  {/* Left Column: Visual Scanner Camera */}
                  <div className="col-span-2 relative border border-white/10 rounded-xl overflow-hidden bg-black/60 flex items-center justify-center">
                    <div className={`absolute inset-0 border-2 border-emerald-500/40 ${isPlaying ? 'animate-pulse' : ''}`} />
                    <div className="absolute top-2 left-2 bg-emerald-500/25 px-1.5 py-0.2 rounded text-[7px] text-emerald-400">CAMERA STREAM // ACTIVE</div>
                    {/* Crosshair indicator */}
                    <div className="w-12 h-12 border border-dashed border-emerald-400/40 rounded-full flex items-center justify-center">
                      <div className={`w-2 h-2 bg-emerald-500 rounded-full ${isPlaying ? 'scale-150 animate-ping' : ''}`} />
                    </div>
                    <span className="absolute bottom-2 right-2 text-[8px] text-emerald-400">{isPlaying ? 'Quality Check: PASS (99.8%)' : 'Awaiting calibration...'}</span>
                  </div>
                  {/* Right Column: Telemetry logs */}
                  <div className="col-span-2 space-y-2 bg-white/5 p-4 rounded-xl border border-white/5 overflow-hidden">
                    <p className="text-amber-400">// Temperature: 42.5°C (Stable)</p>
                    <p className="text-slate-400">18:42:01 - Checked SKU: BH-201 (Steel Washer)</p>
                    {isPlaying ? (
                      <>
                        <p className="text-slate-300">18:42:02 - Dimensions verified via visual inspection</p>
                        <p className="text-emerald-400 animate-pulse">18:42:03 - Pushed count: 1,402 / 1,500 complete</p>
                        <p className="text-indigo-400 animate-pulse">18:42:05 - Syncing stock count to SKU Catalog</p>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">// Click play to simulate industrial machine vision audit...</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[9px] text-slate-400">
                  <span>Press play to simulate manufacturing pipeline integration...</span>
                  <span>Sensor Sync: OK | Nodes Online: 8</span>
                </div>
              </div>
            )}

            {/* Video overlay controls */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-100 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 shadow-2xl"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-teal-500 transition-all duration-300" 
                style={{ width: isPlaying ? '100%' : '15%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT BENEFITS SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-900 space-y-12 animate-fadeIn">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Platform Benefits</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
            Designed for Maximum Growth & Cost Efficiency
          </h2>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm shadow-slate-100 hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-sm font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Unlimited Scale</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              Billed per organization, not per user. Scale your sales, support, and warehouse operations teams without worrying about mounting per-seat software charges.
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm shadow-slate-100 hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-sm font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Native Compliance</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              Fully integrated GST invoice creation, e-invoicing (IRN), TDS, and PF/ESI calculations, providing pre-populated accounting ledgers ready for professional audit.
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm shadow-slate-100 hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-sm font-black text-teal-600 dark:text-teal-400 tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 uppercase">Time-to-Value</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              Go live in hours using pre-built industry templates. Consolidate separate spreadsheets, CRM records, and calendar entries into one unified command center.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION (6-card grid) */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-900 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Built-in Competencies</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Consolidated OS Features</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuresList.map((f, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 space-y-3 hover:border-slate-300 dark:hover:border-slate-800 transition-all shadow-sm shadow-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-semibold">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-900 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Customer Testimonials</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Trusted by Indian Founders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: "Consolidating our Shopify logs, CRM leads, and manual calling templates under Vortiq saved us over Rs 2L a month in developer hours.", author: "Rajesh K., B2B Founder" },
            { quote: "The compliance safeguards are stellar. Calls block automatically outside TRAI slots, and our CA gets pre-populated GSTR-1 files.", author: "Sunita M., Industrial Spares CA" },
            { quote: "Outbound qualified lead calls now sync directly with our database. The response rate is 3x faster than manual dialers.", author: "Karan S., B2B SaaS Growth Lead" }
          ].map((t, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900/35 border border-slate-200 dark:border-slate-900 space-y-4 text-xs shadow-sm shadow-slate-100">
              <p className="text-slate-600 dark:text-slate-300 italic font-semibold leading-relaxed">"{t.quote}"</p>
              <p className="font-extrabold text-teal-600 dark:text-teal-400">— {t.author}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-3xl shadow-sm">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <h4 className="text-xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={40} suffix="%" />
            </h4>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Reduction in manual ops</p>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-300">
            <h4 className="text-xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={3} suffix="x Faster" />
            </h4>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Lead Response Time</p>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-300">
            <h4 className="text-xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={2.3} decimals={1} prefix="Rs " suffix="L/mo" />
            </h4>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Productivity Recovered</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-950 py-12 px-6 text-center text-xs text-slate-500 space-y-4 transition-colors">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-400 font-bold">
          <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link>
          <Link href="/signup" className="hover:text-slate-900 dark:hover:text-white transition-colors">Start Free Trial</Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</Link>
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/accessibility" className="hover:text-slate-900 dark:hover:text-white transition-colors">Accessibility</Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/admin" className="text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 transition-colors">Vortiq Team Portal</Link>
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
          GST Ready | e-Invoice | TDS | PF/ESI | DPDP Act 2023 | Developed by Sociium, founded in 2026
        </div>
        <p>© 2026 Vortiq Business OS. Made in India 🇮🇳 for Indian businesses.</p>
      </footer>

    </div>
  );
}
