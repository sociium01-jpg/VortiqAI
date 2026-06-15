'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Building2 } from 'lucide-react';

export default function AboutPage() {
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-955/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/25">
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
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
          <Link href="/" className="text-xs font-bold text-slate-550 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-16 px-6 space-y-8">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">About Sociium</h2>
          <p className="text-xs text-slate-500">Founded in 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert text-xs leading-relaxed space-y-6 text-slate-700 dark:text-slate-300 font-semibold">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Our Vision</h3>
            <p>
              Sociium was founded in 2026 with a single cohesive mission: to build the world's most intuitive, reliable, and integrated AI-ready business operating system for Small and Medium Enterprises (SMEs).
            </p>
            <p>
              We believe that enterprise software should not require complex developer consultants, separate disconnected tool databases, or per-user seat limits that penalize organizational growth.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">The Vortiq Platform</h3>
            <p>
              Vortiq Business OS is our flagship platform. It brings sales pipelines, lead capturing, marketing budgets, SKU cataloging, financial invoices, and employee tasks under one unified, contrast-compliant workspace.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Core Values</h3>
            <p>
              * **Transparency**: Zero per-seat billing and Bring-Your-Own-Key AI cost control models.<br />
              * **Security**: AES-256 local database isolation by design.<br />
              * **Inclusivity**: Compliance-driven guidelines that keep user controls intuitive.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Sociium. Built in India 🇮🇳</p>
      </footer>
    </div>
  );
}
