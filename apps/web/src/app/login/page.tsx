'use client';

import React from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Brand logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Link href="/" className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20 text-lg">
          V
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">VORTIQ</h1>
          <p className="text-xs text-slate-500 font-medium">Log in to your Business OS Console</p>
        </div>
      </div>

      {/* Clerk Sign In Card with Custom Dark Styling */}
      <div className="w-full max-w-md flex justify-center">
        <SignIn
          signUpUrl="/signup"
          forceRedirectUrl="/dashboard"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#0d9488', // Teal-600
              colorBackground: '#0f172a', // Slate-900
              colorInputBackground: '#020617', // Slate-950
              colorInputText: '#f8fafc', // Slate-50
              colorText: '#f1f5f9', // Slate-100
              colorTextSecondary: '#94a3b8', // Slate-400
            },
            elements: {
              card: 'border border-slate-800 shadow-2xl rounded-3xl backdrop-blur-md bg-slate-900/40 p-2 w-full',
              socialButtonsBlockButton: 'border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs py-2.5 rounded-xl font-semibold',
              formButtonPrimary: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-lg shadow-teal-500/10 text-xs',
              formFieldInput: 'bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all',
              footerActionLink: 'text-teal-400 hover:text-teal-300 font-semibold',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
            }
          }}
        />
      </div>
    </div>
  );
}
