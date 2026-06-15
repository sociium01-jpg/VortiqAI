'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'clerk' | 'demo'>('clerk');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [demoError, setDemoError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Force light theme on authentication screens
    document.documentElement.classList.remove('dark');
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoEmail.trim().toLowerCase() === 'demo@vortiq.ai' && demoPassword === 'VortiqDemo2026') {
      setIsLoggingIn(true);
      setDemoError('');
      setTimeout(() => {
        localStorage.setItem('vortiq-demo-logged-in', 'true');
        localStorage.setItem('vortiq-plan', 'BUSINESS');
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      setDemoError('Invalid credentials. Use demo@vortiq.ai / VortiqDemo2026');
    }
  };

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

      {/* Login Container Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl p-6 relative">
        
        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            onClick={() => setLoginType('clerk')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              loginType === 'clerk'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Client Sign In
          </button>
          <button
            onClick={() => setLoginType('demo')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              loginType === 'demo'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Interactive Demo
          </button>
        </div>

        {loginType === 'clerk' ? (
          <div className="w-full flex justify-center">
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
                  card: 'border-0 shadow-none bg-transparent p-0 w-full',
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
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-sm font-black text-slate-800">Demo Workspace Console</h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Explore pre-populated mock database modules.</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500">Email Address</label>
              <input
                type="email"
                required
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                placeholder="demo@vortiq.ai"
                className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500">Password</label>
              <input
                type="password"
                required
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none transition-all"
              />
            </div>

            {demoError && (
              <p className="text-[10px] text-red-650 font-bold text-center">{demoError}</p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl transition-all shadow-lg shadow-teal-500/10 text-xs flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" /> Accessing Demo...
                </>
              ) : (
                "Log In to Demo Console"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

