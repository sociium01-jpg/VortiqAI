'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, Sparkles, WifiOff, AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Cpu } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

interface ModuleAIPanelProps {
  module: string;
  title?: string;
  defaultExpanded?: boolean;
}

export default function ModuleAIPanel({ module, title, defaultExpanded = false }: ModuleAIPanelProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [asked, setAsked] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiMode, setAiMode] = useState<'manual' | 'ai-assisted'>('ai-assisted');

  useEffect(() => {
    const stored = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
    if (stored) setAiMode(stored);
    const handleModeChange = () => {
      const m = localStorage.getItem('vortiq-ai-mode') as 'manual' | 'ai-assisted';
      if (m) setAiMode(m);
    };
    window.addEventListener('vortiq-ai-mode-change', handleModeChange);
    return () => window.removeEventListener('vortiq-ai-mode-change', handleModeChange);
  }, []);

  const askAgent = useCallback(async (question?: string) => {
    if (aiMode === 'manual') return;
    setLoading(true);
    setAsked(true);
    try {
      const data = await vortiqClient.callMutation('ai.askModuleAgent', {
        module,
        question: question || undefined
      });
      setSummary(data);
    } catch (err: any) {
      setSummary({
        summary: `Module AI error: ${err.message}`,
        isAIGenerated: false,
        dataSource: 'Error',
        generatedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [module, aiMode]);

  const handleCustomAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    askAgent(customQuestion);
    setCustomQuestion('');
  };

  if (aiMode === 'manual') {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
        <Brain className="w-4 h-4 text-slate-400" />
        <span className="font-semibold">AI is in Manual Mode — <span className="text-teal-600 dark:text-teal-500 cursor-pointer hover:underline" onClick={() => { localStorage.setItem('vortiq-ai-mode', 'ai-assisted'); window.dispatchEvent(new Event('vortiq-ai-mode-change')); }}>enable AI-Assisted Mode</span> to get intelligent insights.</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-500/20 dark:border-indigo-500/15 bg-gradient-to-br from-indigo-50/50 to-violet-50/30 dark:from-indigo-950/30 dark:to-violet-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-500/10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/20">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            {title || `${module} AI Agent`}
          </span>
          {summary?.isAIGenerated && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 font-bold uppercase">AI</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!asked && (
            <button
              onClick={() => { setExpanded(true); askAgent(); }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black transition-all shadow-sm shadow-indigo-500/20"
            >
              <Sparkles className="w-3 h-3" />
              Ask AI
            </button>
          )}
          {asked && (
            <button
              onClick={() => askAgent()}
              disabled={loading}
              className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 rounded-lg text-indigo-500 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Loading State */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-400 font-semibold">
                <Cpu className="w-3.5 h-3.5 animate-pulse" />
                Computing {module} metrics → preparing AI context...
              </div>
              <div className="space-y-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-3 bg-indigo-100 dark:bg-indigo-500/10 rounded animate-pulse" style={{ width: `${85 - i * 12}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Not Asked State */}
          {!asked && !loading && (
            <div className="text-center py-4 space-y-3">
              <Brain className="w-8 h-8 text-indigo-300 dark:text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold">
                Click "Ask AI" to get live insights for {module}
              </p>
            </div>
          )}

          {/* AI Summary */}
          {summary && !loading && (
            <div className="space-y-3">
              {/* Provider not connected */}
              {!summary.isAIGenerated && summary.dataSource?.includes('Not Connected') && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">AI provider not connected — showing computed metrics. Add API key in Settings.</span>
                </div>
              )}

              {/* Error fallback */}
              {!summary.isAIGenerated && summary.dataSource?.includes('Error') && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">AI error — manual review recommended.</span>
                </div>
              )}

              {/* The actual summary */}
              <div className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-indigo-100 dark:border-indigo-500/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                {summary.summary}
              </div>

              {/* Custom question box */}
              <form onSubmit={handleCustomAsk} className="flex gap-2">
                <div className="relative flex-1">
                  <MessageSquare className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={e => setCustomQuestion(e.target.value)}
                    placeholder={`Ask ${module} Agent anything...`}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customQuestion.trim() || loading}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black transition-all"
                >
                  Ask
                </button>
              </form>

              {/* Metadata footer */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {summary.dataSource || 'Live Database'}
                </span>
                <span>{summary.generatedAt ? new Date(summary.generatedAt).toLocaleTimeString() : ''}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
