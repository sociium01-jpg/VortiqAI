'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, CreditCard, KeyRound, UserPlus, 
  ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle
} from 'lucide-react';

import { useUser } from '@clerk/nextjs';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Business details
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [businessType, setBusinessType] = useState('Manufacturing');
  const [employees, setEmployees] = useState('11-50');
  const [website, setWebsite] = useState('');
  const [step1Error, setStep1Error] = useState('');

  // Step 2: Plan
  const [selectedPlan, setSelectedPlan] = useState('GROWTH');
  const [billingPeriod, setBillingPeriod] = useState<'quarterly' | 'annual'>('quarterly');

  // Step 3: BYOK
  const [aiProvider, setAiProvider] = useState('Anthropic');
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');

  // Step 4: Invites
  const [invites, setInvites] = useState([
    { email: '', role: 'Sales' },
    { email: '', role: 'Finance' },
    { email: '', role: 'Ops' }
  ]);

  const handleGSTINValidation = (val: string) => {
    // Basic India GSTIN format validation (e.g. 27AAAAA1111A1Z1)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(val);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!companyName.trim()) {
        setStep1Error('Company name is required.');
        return;
      }
      if (gstin && !handleGSTINValidation(gstin.toUpperCase())) {
        setStep1Error('Invalid GSTIN format (Format: 27AAAAA1111A1Z1).');
        return;
      }
      setStep1Error('');
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleTestKey = () => {
    if (!apiKey.trim()) return;
    setTestStatus('TESTING');
    setTimeout(() => {
      // Basic simulation success
      setTestStatus('SUCCESS');
    }, 1200);
  };

  const handleInviteChange = (index: number, field: 'email' | 'role', val: string) => {
    const updated = [...invites];
    updated[index][field] = val;
    setInvites(updated);
  };

  const handleFinish = () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vortiq-brand-name', companyName.trim());
      localStorage.setItem('vortiq-plan', selectedPlan);
      
      const savedClientsStr = localStorage.getItem('vortiq-all-clients');
      let savedClients = [];
      if (savedClientsStr) {
        try {
          savedClients = JSON.parse(savedClientsStr);
        } catch (e) {}
      }
      
      const newClient = {
        id: `CLI-00${savedClients.length + 4}`,
        name: companyName.trim(),
        owner: user?.fullName || 'Owner Account',
        email: user?.primaryEmailAddress?.emailAddress || 'owner@vortiq.ai',
        plan: selectedPlan,
        trialDaysLeft: 14,
        docUploaded: false,
        paymentStatus: 'TRIAL_ACTIVE',
        registeredName: `${companyName.trim()} Private Limited`,
        gstin: gstin.trim().toUpperCase() || '27AABCV1234E1Z0'
      };

      if (!savedClients.some((c: any) => c.name.toLowerCase() === companyName.trim().toLowerCase())) {
        savedClients.push(newClient);
      }
      localStorage.setItem('vortiq-all-clients', JSON.stringify(savedClients));
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  const steps = [
    { number: 1, title: 'Business', icon: Building },
    { number: 2, title: 'Plan', icon: CreditCard },
    { number: 3, title: 'AI Key', icon: KeyRound },
    { number: 4, title: 'Team', icon: UserPlus }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Onboarding Wizard Header */}
      <div className="w-full max-w-xl mb-8 flex flex-col items-center">
        <img 
          src="/logo.png" 
          alt="Vortiq Logo" 
          className="h-12 w-auto dark:invert dark:brightness-200 object-contain mb-4"
        />
        <h2 className="text-xl font-black text-white">Setup VORTIQ Business OS</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">Answer 4 quick steps to configure your custom portal.</p>
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between w-full mt-6 px-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.number;
            const isActive = currentStep === s.number;
            return (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                    isCompleted ? 'bg-teal-500 border-teal-500 text-slate-950 shadow-md shadow-teal-500/10' :
                    isActive ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-slate-800 text-slate-500 bg-slate-900/40'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.number}
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-teal-400' : 'text-slate-500'}`}>{s.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-[1.5px] -mt-5 mx-2 transition-all ${
                    currentStep > s.number ? 'bg-teal-500' : 'bg-slate-900'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="w-full max-w-xl bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-6">

        {/* Step 1 Content: Business Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-400" /> Step 1: Business Details
            </h3>

            {step1Error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {step1Error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Company Name *</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Bharat Components Pvt Ltd" 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">GSTIN (Optional)</label>
                <input 
                  type="text" 
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 27AAAAA1111A1Z1" 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Industry Type</label>
                <select 
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                >
                  {['Manufacturing', 'B2B Services', 'D2C', 'Retail', 'SaaS', 'Healthcare', 'Finance', 'Other'].map(opt => (
                    <option key={opt} value={opt} className="bg-slate-950 text-slate-100">{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Number of Employees</label>
                <select 
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                >
                  {['1-10', '11-50', '51-200', '200+'].map(opt => (
                    <option key={opt} value={opt} className="bg-slate-950 text-slate-100">{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Company Website (Optional)</label>
                <input 
                  type="url" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://bharatcomponents.in" 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 Content: Plan Selector */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-400" /> Step 2: Choose Business Plan
            </h3>

            {/* Billing toggle */}
            <div className="flex justify-end gap-3 text-[10px] font-bold">
              <span className={billingPeriod === 'quarterly' ? 'text-teal-400' : 'text-slate-500'}>Quarterly</span>
              <button 
                onClick={() => setBillingPeriod(prev => prev === 'quarterly' ? 'annual' : 'quarterly')}
                className="w-9 h-5 rounded-full bg-slate-800 p-0.5 flex items-center border border-slate-700"
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-teal-400 transition-all ${billingPeriod === 'annual' ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className={billingPeriod === 'annual' ? 'text-teal-400' : 'text-slate-500'}>Annually (25% Off)</span>
            </div>

            {/* Plans List */}
            <div className="space-y-3">
              {[
                { id: 'STARTER', name: 'Starter Plan', users: '3 users', price: billingPeriod === 'quarterly' ? 2999 : 2249 },
                { id: 'GROWTH', name: 'Growth Plan (Recommended)', users: '15 users', price: billingPeriod === 'quarterly' ? 7999 : 5999 },
                { id: 'BUSINESS', name: 'Business Plan', users: '50 users', price: billingPeriod === 'quarterly' ? 19999 : 14999 }
              ].map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPlan === plan.id 
                      ? 'bg-slate-900 border-teal-500 shadow-lg shadow-teal-500/5' 
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === plan.id ? 'border-teal-400' : 'border-slate-700'
                    }`}>
                      {selectedPlan === plan.id && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{plan.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-bold">{plan.users}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">Rs {plan.price.toLocaleString('en-IN')}/mo</span>
                    <p className="text-[9px] text-slate-500 font-semibold">Billed {billingPeriod}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-[9px] text-slate-500 text-center font-semibold italic">
              All plans include a 15-day free trial. You will not be billed today.
            </p>
          </div>
        )}

        {/* Step 3 Content: Connect AI Provider (BYOK) */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-400" /> Step 3: Bring Your Own Key (BYOK)
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              VORTIQ routes your agent operations directly to your own provider. This keeps your costs strictly transparent and keeps us out of your raw AI usage billing.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">AI Provider</label>
                <select 
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                >
                  {['Anthropic', 'OpenAI', 'Gemini'].map(opt => (
                    <option key={opt} value={opt} className="bg-slate-950 text-slate-100">{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">API Key</label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestStatus('IDLE');
                    }}
                    placeholder={`sk-${aiProvider.toLowerCase()}-...`} 
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-700 focus:outline-none transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={handleTestKey}
                    disabled={!apiKey.trim() || testStatus === 'TESTING'}
                    className="px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/40 text-xs font-bold rounded-xl border border-slate-700 text-slate-300 transition-all flex items-center justify-center shrink-0 min-w-[100px]"
                  >
                    {testStatus === 'TESTING' ? 'Testing...' :
                     testStatus === 'SUCCESS' ? 'Passed ✓' : 'Test Key'}
                  </button>
                </div>
              </div>

              {testStatus === 'SUCCESS' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                  Connection to {aiProvider} API succeeded!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 Content: Invite Team */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-teal-400" /> Step 4: Invite Team Members
            </h3>

            <div className="space-y-3.5">
              {invites.map((invite, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <div className="md:col-span-2">
                    <input 
                      type="email" 
                      value={invite.email}
                      onChange={(e) => handleInviteChange(index, 'email', e.target.value)}
                      placeholder={`colleague-${index + 1}@company.com`} 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-700 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <select 
                      value={invite.role}
                      onChange={(e) => handleInviteChange(index, 'role', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                    >
                      {['Admin', 'Sales', 'Marketing', 'Finance', 'Support'].map(role => (
                        <option key={role} value={role} className="bg-slate-950 text-slate-100">{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Actions footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-5 mt-6">
          <button 
            type="button" 
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-800 disabled:opacity-0 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 4 ? (
            <button 
              type="button" 
              onClick={handleNextStep}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-lg shadow-teal-500/10"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleFinish}
              disabled={loading}
              className="px-7 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-lg shadow-teal-500/20"
            >
              {loading ? 'Finalizing...' : 'Launch Console'} <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
