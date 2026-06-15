'use client';

import React, { useState, useEffect } from 'react';
import { Brain, ChevronRight, ChevronLeft, Cpu, ShieldAlert, Send, Sparkles, RefreshCw, Terminal, Check, X } from 'lucide-react';

interface ModuleAgentSidebarProps {
  agentName: string;
  permissionsScope: string;
  suggestedPrompts: string[];
  defaultMemoryLogs: string[];
  mockResponseMapper: (prompt: string) => { answer: string; logs: string };
}

export default function ModuleAgentSidebar({
  agentName,
  permissionsScope,
  suggestedPrompts,
  defaultMemoryLogs,
  mockResponseMapper
}: ModuleAgentSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'manual' | 'ai-assisted'>('ai-assisted');
  const [promptInput, setPromptInput] = useState('');
  const [memoryLogs, setMemoryLogs] = useState<string[]>(defaultMemoryLogs);
  
  // AI output states
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load and sync AI mode
  useEffect(() => {
    const stored = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
    if (stored) setAiMode(stored);

    const handleStorage = () => {
      const current = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
      if (current) setAiMode(current);
    };
    window.addEventListener('vortiq-ai-mode-change', handleStorage);
    return () => window.removeEventListener('vortiq-ai-mode-change', handleStorage);
  }, []);

  const handleSendPrompt = (text: string) => {
    if (!text.trim() || aiMode === 'manual' || isProcessing) return;

    setIsProcessing(true);
    setAiDraft(null);

    setTimeout(() => {
      const result = mockResponseMapper(text);
      setAiDraft(result.answer);
      setMemoryLogs(prev => [result.logs, ...prev]);
      setIsProcessing(false);
      setPromptInput('');
    }, 1000);
  };

  const handleApplyDraft = () => {
    alert('AI Draft applied successfully to active form/view!');
    setAiDraft(null);
  };

  return (
    <div className={`relative flex transition-all duration-350 shrink-0 ${isOpen ? 'w-80' : 'w-10'}`}>
      
      {/* Toggle button tab */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-[-16px] top-6 w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-850 dark:hover:text-white shadow-md z-10 hover:scale-105 transition-all"
        title={isOpen ? 'Close Agent Sidebar' : 'Open Agent Sidebar'}
      >
        {isOpen ? <ChevronRight className="w-4.5 h-4.5" /> : <Brain className="w-4.5 h-4.5 text-teal-650 animate-pulse" />}
      </button>

      {/* Main Drawer Container */}
      <div className={`w-full border-l border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950/40 backdrop-blur-sm h-full flex flex-col p-4 overflow-y-auto space-y-5 transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        
        {/* Agent Header */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
          <Brain className="w-5 h-5 text-indigo-500" />
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{agentName}</h4>
            <span className={`text-[9px] font-black uppercase flex items-center gap-1 mt-0.5 ${
              aiMode === 'ai-assisted' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${aiMode === 'ai-assisted' ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`} />
              {aiMode === 'ai-assisted' ? 'Agent Active' : 'Suspended (Manual)'}
            </span>
          </div>
        </div>

        {/* If Manual Mode */}
        {aiMode === 'manual' ? (
          <div className="flex-1 flex flex-col justify-center text-center p-4 space-y-3 bg-slate-50 dark:bg-slate-900/10 border dark:border-slate-900 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-350">Manual Mode Compliant</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold leading-relaxed">
              AI agent calculations and suggestion drafts are currently disabled. Use the manual forms on the page to manage data directly.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4 text-xs font-semibold">
            
            {/* Permissions Badge */}
            <div className="p-3 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 text-[10px] text-indigo-700 dark:text-indigo-400 leading-normal space-y-1">
              <span className="font-extrabold uppercase tracking-widest block text-[9px]">Data Access Permission Scope</span>
              <p className="font-medium">{permissionsScope}</p>
            </div>

            {/* Local Ask Prompt */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ask Module Agent</span>
              <div className="relative">
                <input 
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendPrompt(promptInput);
                  }}
                  placeholder="Ask local AI details..."
                  className="w-full pl-3 pr-10 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-teal-500 text-xs"
                />
                <button 
                  onClick={() => handleSendPrompt(promptInput)}
                  disabled={isProcessing || !promptInput.trim()}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Prompt templates list */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Suggested Commands</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map(p => (
                  <button 
                    key={p}
                    onClick={() => handleSendPrompt(p)}
                    className="px-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-900 border dark:border-slate-850 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Draft Response Output */}
            {isProcessing && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border rounded-2xl animate-pulse space-y-2">
                <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              </div>
            )}

            {aiDraft && (
              <div className="p-3.5 bg-teal-500/5 border border-teal-500/15 rounded-2xl space-y-3 animate-fadeIn">
                <span className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest block">Draft Suggestion</span>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">{aiDraft}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={handleApplyDraft}
                    className="flex-1 py-1.5 bg-teal-500 hover:bg-teal-450 text-slate-950 font-extrabold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Apply Draft
                  </button>
                  <button 
                    onClick={() => setAiDraft(null)}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Memory Logs */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" /> Local Memory Log
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {memoryLogs.map((log, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-xl text-[10px] text-slate-500 font-medium leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
