'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, ShieldCheck, Sparkles, Building2, HelpCircle, Sun, Moon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [billingPeriod, setBillingPeriod] = useState<'quarterly' | 'annual'>('quarterly');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // ROI Calculator States
  const [teamSize, setTeamSize] = useState(10);
  const [softwareSpend, setSoftwareSpend] = useState(25000);
  const [hoursSaved, setHoursSaved] = useState(6);
  const [avgSalary, setAvgSalary] = useState(40000);

  // ROI Math
  const hourlyRate = avgSalary / 160; // 160 working hours in a month
  const productivitySavings = teamSize * hoursSaved * 4.3 * hourlyRate; // 4.3 weeks in a month
  const totalPotentialSavings = productivitySavings + softwareSpend;
  const vortiqCost = billingPeriod === 'quarterly' ? 7999 : 5999; // Growth plan reference
  const netSavings = Math.max(0, totalPotentialSavings - vortiqCost);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

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

  const plans = [
    {
      name: 'Starter',
      desc: 'Ideal for small Indian trading or service firms.',
      users: 'Up to 3 users',
      price: billingPeriod === 'quarterly' ? 2999 : 2249,
      period: 'mo',
      billed: billingPeriod === 'quarterly' ? 'Rs 8,997 billed quarterly' : 'Rs 26,988 billed annually',
      features: [
        '3 users included',
        'Sales CRM & Pipeline logs',
        'Native GST invoice creation',
        '100 AI lead enrichment scans / mo',
        'Telegram notifications bot',
        'Email ticket support'
      ],
      popular: false
    },
    {
      name: 'Growth',
      desc: 'Most popular. Comprehensive tools for mid-market SMEs.',
      users: 'Up to 15 users',
      price: billingPeriod === 'quarterly' ? 7999 : 5999,
      period: 'mo',
      billed: billingPeriod === 'quarterly' ? 'Rs 23,997 billed quarterly' : 'Rs 71,988 billed annually',
      features: [
        '15 users included',
        'All Starter features',
        'Automated outbound calling queue',
        'Social scheduling & campaigns',
        'Shopify & Razorpay reconciliations',
        '1,000 AI lead enrichment scans / mo',
        'Human-in-the-Loop review logs',
        'Priority Slack + Phone support'
      ],
      popular: true
    },
    {
      name: 'Business',
      desc: 'Advanced controls & compliance for growing organizations.',
      users: 'Up to 50 users',
      price: billingPeriod === 'quarterly' ? 19999 : 14999,
      period: 'mo',
      billed: billingPeriod === 'quarterly' ? 'Rs 59,997 billed quarterly' : 'Rs 1,79,988 billed annually',
      features: [
        '50 users included',
        'All Growth features',
        'E-invoicing (IRN generation sandbox)',
        'Payslip automation & HR portal',
        'Unlimited AI lead enrichment',
        'Dedicated account manager',
        'CA audit logs panel export'
      ],
      popular: false
    },
    {
      name: 'Enterprise',
      desc: 'Custom infrastructure for multi-location manufacturing & retail.',
      users: 'Unlimited users',
      price: 'Custom',
      period: '',
      billed: 'Tailored contracts & SLAs',
      features: [
        'Unlimited users',
        'On-premise / private cloud deploy',
        'Tally two-way XML integrations',
        'Custom voice clone training',
        'Custom contract lawyer bots',
        'SLA guarantees compliance'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 overflow-x-hidden transition-colors duration-200">
      
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-955/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
            V
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">VORTIQ</h1>
            <p className="text-xs text-slate-500 font-medium">Business OS</p>
          </div>
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
            href="/dashboard" 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Enter Console <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Pricing Header */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> TRANSPARENT, INDIA-FIRST PRICING
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-slate-950 via-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Simple Pricing for Active Teams
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm font-semibold">
          No credit card required for trial. Billed per organization, not per user. Start saving in 15 minutes.
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center justify-center gap-3 pt-6">
          <span className={`text-xs font-bold ${billingPeriod === 'quarterly' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>Quarterly</span>
          <button 
            onClick={() => setBillingPeriod(prev => prev === 'quarterly' ? 'annual' : 'quarterly')}
            className="w-12 h-6.5 rounded-full bg-slate-200 dark:bg-slate-800 p-1 flex items-center transition-all relative border border-slate-300 dark:border-slate-700"
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-teal-600 dark:bg-teal-400 transition-all ${billingPeriod === 'annual' ? 'translate-x-5.5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs font-bold ${billingPeriod === 'annual' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
            Annually <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">Save 25%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 pb-20">
        {plans.map((p) => (
          <div 
            key={p.name} 
            className={`p-6 rounded-3xl flex flex-col justify-between relative transition-all duration-300 ${
              p.popular 
                ? 'bg-white dark:bg-slate-900 border-2 border-teal-500 shadow-2xl shadow-teal-500/5 transform md:-translate-y-2' 
                : 'bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-800 shadow-sm shadow-slate-100 dark:shadow-none'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 right-6 px-3 py-1 text-[9px] font-black uppercase bg-teal-500 text-slate-955 rounded-full tracking-widest">
                Most Popular
              </span>
            )}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{p.name}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-1 min-h-[32px] font-semibold">{p.desc}</p>
              </div>

              <div className="py-2 border-y border-slate-200 dark:border-slate-800/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {typeof p.price === 'number' ? `Rs ${p.price.toLocaleString('en-IN')}` : p.price}
                  </span>
                  {p.period && <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">/{p.period}</span>}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 font-bold">{p.billed}</p>
              </div>

              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> {p.users}
              </span>

              <ul className="space-y-2.5 pt-2 text-xs">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-tight">
                    <Check className="w-4 h-4 text-teal-605 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/40 space-y-3">
              <Link 
                href="/signup" 
                className={`w-full py-3 rounded-xl text-center text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                  p.popular 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/10' 
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-250 dark:border-slate-700'
                }`}
              >
                Start 15-Day Free Trial
              </Link>
              <p className="text-[9px] text-center text-slate-500 font-semibold">No credit card required</p>
            </div>
          </div>
        ))}
      </section>

      {/* ROI Calculator Widget */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-900 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Calculate your Monthly ROI</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Estimate how much money and time you recover with VORTIQ Business OS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          {/* Sliders */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">Team Size</span>
                <span className="text-teal-600 dark:text-teal-400 font-black">{teamSize} Employees</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={teamSize} 
                onChange={(e) => setTeamSize(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 dark:accent-teal-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-655 dark:text-slate-300">Current Monthly Software Cost</span>
                <span className="text-teal-600 dark:text-teal-400 font-black">Rs {softwareSpend.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="150000" 
                step="5000"
                value={softwareSpend} 
                onChange={(e) => setSoftwareSpend(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 dark:accent-teal-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">Hours Saved Per Employee / Week</span>
                <span className="text-teal-600 dark:text-teal-400 font-black">{hoursSaved} Hours</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={hoursSaved} 
                onChange={(e) => setHoursSaved(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 dark:accent-teal-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">Average Employee Salary (Monthly)</span>
                <span className="text-teal-600 dark:text-teal-400 font-black">Rs {avgSalary.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range" 
                min="15000" 
                max="150000" 
                step="5000"
                value={avgSalary} 
                onChange={(e) => setAvgSalary(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 dark:accent-teal-400"
              />
            </div>
          </div>

          {/* Savings Box */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">ROI Verdict Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-slate-500">Productivity Gain</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Rs {Math.round(productivitySavings).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-slate-500">Tool Consolidation</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Rs {softwareSpend.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Monthly Savings</p>
              <h4 className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">Rs {Math.round(netSavings).toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-slate-550 mt-1 font-semibold">Billed at Rs {vortiqCost.toLocaleString('en-IN')}/mo on the Growth Plan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-900 space-y-10">
        <h2 className="text-2xl md:text-4xl font-black text-center text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <HelpCircle className="w-7 h-7 text-indigo-500 dark:text-indigo-400" /> Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          {[
            { q: "Do you store my API key?", a: "Never unencrypted. AES-256 at rest. We never see it in plaintext." },
            { q: "What happens after my 15-day trial?", a: "You'll be prompted to choose a billing plan. No automatic charges." },
            { q: "Can I import from Zoho or HubSpot?", a: "Yes. One-click CSV import and native Zoho/HubSpot API migration." },
            { q: "Is this GST compliant for my CA?", a: "Yes. Every invoice has IRN, QR code, and GSTIN. GSTR-1 and 3B prep included." },
            { q: "Do I need to install anything?", a: "No. 100% web-based. Mobile apps for iOS and Android available." },
            { q: "What if I want to cancel?", a: "Cancel anytime. Your data is exportable in CSV/Excel within 24 hours of request." }
          ].map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 shadow-sm shadow-slate-100 dark:shadow-none">
              <h4 className="font-extrabold text-slate-900 dark:text-white">{faq.q}</h4>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-950 py-12 px-6 text-center text-xs text-slate-500 space-y-4 transition-colors">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-400 font-bold">
          <Link href="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">Product</Link>
          <Link href="/pricing" className="hover:text-slate-950 dark:hover:text-white transition-colors">Pricing</Link>
          <Link href="/dashboard" className="hover:text-slate-950 dark:hover:text-white transition-colors">Console</Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-emerald-600 dark:text-emerald-400">GST Ready | e-Invoice | TDS | PF/ESI | DPDP Act 2023</span>
        </div>
        <p>© 2026 Vortiq Business OS. Made in India 🇮🇳 for Indian businesses.</p>
      </footer>

    </div>
  );
}
