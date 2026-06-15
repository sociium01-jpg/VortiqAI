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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">VORTIQ</h1>
            <p className="text-xs text-slate-500 font-medium">Business OS</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link>
          <Link href="/demo" className="hover:text-slate-900 dark:hover:text-white transition-colors">Demo</Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
          
          <Link 
            href="/signup" 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
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
          <Link href="/demo" className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-xs text-center">
            See demo
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

      {/* COMPETITOR POSITIONING SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-900 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Competitive Edge</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
            Everything Zoho does. <br />Everything HubSpot wishes it could do in India.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm shadow-slate-100">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-900 pb-2">Vortiq</h3>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">✓ Billed per organization. Unlimited users.</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">✓ Native e-invoicing (IRN), TDS, and GST.</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">✓ Fully live in under 4 hours.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 space-y-4 opacity-75 shadow-sm shadow-slate-100">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900 pb-2">Zoho</h3>
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">✗ Charges Rs 1,250/employee even for inactive users.</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">✗ Requires complex third-party consulting.</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">✗ Fragmented modules require manual syncing.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 space-y-4 opacity-75 shadow-sm shadow-slate-100">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900 pb-2">HubSpot</h3>
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">✗ Costs Rs 75,000/month for advanced features.</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">✗ Zero native support for Indian GST/TDS.</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">✗ Standard USD pricing cuts margin.</p>
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
          <Link href="/demo" className="hover:text-slate-900 dark:hover:text-white transition-colors">See Demo</Link>
          <Link href="/signup" className="hover:text-slate-900 dark:hover:text-white transition-colors">Start Free Trial</Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-emerald-600 dark:text-emerald-400">GST Ready | e-Invoice | TDS | PF/ESI | DPDP Act 2023</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/admin" className="text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 transition-colors">Vortiq Team Portal</Link>
        </div>
        <p>© 2026 Vortiq Business OS. Made in India 🇮🇳 for Indian businesses.</p>
      </footer>

    </div>
  );
}
