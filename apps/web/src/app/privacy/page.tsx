'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Sun, Moon } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
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
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-16 px-6 space-y-8">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">Privacy Policy</h2>
          <p className="text-xs text-slate-500">Last Updated: June 15, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert text-xs leading-relaxed space-y-6 text-slate-700 dark:text-slate-300">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Introduction</h3>
            <p>
              Welcome to Vortiq Business OS, operated by Sociium. We are committed to protecting your business data and privacy. This Privacy Policy describes how we collect, store, share, and protect information when you register for and use Vortiq Business OS.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Data Security & Storage</h3>
            <p>
              We implement industry-standard encryption protocols (AES-256 at rest, TLS 1.3 in transit) to protect client databases. Databases are isolated per organization to ensure complete security boundary protection.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. Information We Collect</h3>
            <p>
              * **Account Credentials**: Name, email, phone number, and organization branding details.<br />
              * **Business Telemetry**: User-input metrics, stock SKUs, client CRM databases, and invoice metadata.<br />
              * **BYOK API keys**: User-provided credentials for third-party AI interfaces. These keys are encrypted locally and never transferred in plaintext.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">4. Compliance & Controls</h3>
            <p>
              Vortiq complies with Indian data protection laws, including the Digital Personal Data Protection (DPDP) Act 2023. User data will never be sold or used for AI training without explicit written consent.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">5. Contact Information</h3>
            <p>
              For privacy audits or data deletion requests, contact the Sociium Data Protection Officer at privacy@sociium.com.
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
