'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  useEffect(() => {
    // Force light theme on authentication screens
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Back to Home Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-black shadow-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Brand logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Link href="/" className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20 text-lg">
          V
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">VORTIQ</h1>
          <p className="text-xs text-slate-500 font-semibold">Log in to your Business OS Console</p>
        </div>
      </div>

      {/* Clerk Sign In Card with Custom Light Styling */}
      <div className="w-full max-w-md flex justify-center">
        <SignIn
          signUpUrl="/signup"
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#0d9488', // Teal-600
              colorBackground: '#ffffff', // White
              colorInputBackground: '#f8fafc', // Slate-50
              colorInputText: '#0f172a', // Slate-900
              colorText: '#0f172a', // Slate-900
              colorTextSecondary: '#475569', // Slate-600
            },
            elements: {
              card: 'border border-slate-200 shadow-xl rounded-3xl bg-white p-2 w-full',
              socialButtonsBlockButton: 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs py-2.5 rounded-xl font-semibold',
              formButtonPrimary: 'bg-teal-600 hover:bg-teal-500 text-white font-black py-2.5 rounded-xl transition-all shadow-lg shadow-teal-500/10 text-xs',
              formFieldInput: 'bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all',
              footerActionLink: 'text-teal-600 hover:text-teal-500 font-semibold',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
            }
          }}
        />
      </div>
    </div>
  );
}

