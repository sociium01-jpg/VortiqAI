'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate successful Clerk login and redirect to dashboard
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

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

      {/* Form Card */}
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-850 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-6">
        
        {/* Google OAuth Option */}
        <button 
          onClick={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              router.push('/dashboard');
            }, 1000);
          }}
          className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.71l3.27-3.27C17.67 1.54 15.01 1 12 1 7.24 1 3.22 3.73 1.25 7.71l3.86 3C6.06 7.71 8.8 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.51 12.3c0-.82-.07-1.61-.21-2.38H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.38-4.89 3.38-8.23z" />
            <path fill="#FBBC05" d="M5.11 10.71c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.25 3.19C.45 4.8.01 6.6.01 8.45c0 1.85.44 3.65 1.24 5.26l3.86-3z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.2 0-5.94-2.67-6.91-5.67L1.23 15.6C3.2 19.58 7.22 23 12 23z" />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800/60"></div>
          <span className="flex-shrink mx-3 text-slate-500 font-semibold text-[9px] uppercase tracking-wider">Or credentials</span>
          <div className="flex-grow border-t border-slate-800/60"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@bharatforge.com" 
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-400">Password</label>
              <a href="#" className="text-[9px] text-teal-400 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg shadow-teal-500/10"
          >
            {loading ? 'Logging in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Redirect Link */}
      <p className="mt-6 text-xs text-slate-400 font-semibold">
        Don't have an account? <Link href="/signup" className="text-teal-400 hover:underline">Start free trial</Link>
      </p>

    </div>
  );
}
