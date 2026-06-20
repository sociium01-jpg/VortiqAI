'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { SignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Force light theme on authentication screens
    document.documentElement.classList.remove('dark');

    if (isLoaded && user) {
      router.push('/dashboard');
    }
  }, [isLoaded, user, router]);

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
        <Link href="/">
          <img 
            src="/logo.png" 
            alt="Vortiq Logo" 
            className="h-12 w-auto object-contain"
          />
        </Link>
        <div className="text-center">
          <p className="text-xs text-slate-500 font-semibold">Create your AI Business OS Account</p>
        </div>
      </div>

      {/* Clerk Sign Up Card with Custom Light Styling */}
      <div className="w-full max-w-md flex justify-center">
        <SignUp
          signInUrl="/login"
          forceRedirectUrl="/onboarding"
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

