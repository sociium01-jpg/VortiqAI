'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ShieldAlert, X } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

export default function AINotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const fetchPending = useCallback(async () => {
    try {
      const data = await vortiqClient.callQuery('ai.getAIApprovalQueue', { includeResolved: false });
      setCount((data || []).length);
      setItems((data || []).slice(0, 5));
    } catch {
      // silent fail — bell is non-critical UI
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    const handleChange = () => fetchPending();
    window.addEventListener('vortiq-ai-approval-change', handleChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vortiq-ai-approval-change', handleChange);
    };
  }, [fetchPending]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        title="AI Approval Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-amber-500 text-[9px] font-black text-white flex items-center justify-center px-1 leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">AI Approval Queue</span>
                {count > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black border border-amber-200 dark:border-amber-500/20">{count}</span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {count === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500 font-semibold">
                No pending approvals — all clear ✓
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map(item => (
                  <div key={item.id} className="px-4 py-3 space-y-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">{item.actionType?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                      {(item.payload as any)?.actionRequired || 'AI action pending approval'}
                    </p>
                    <p className="text-[9px] text-slate-400">{new Date(item.createdAt).toLocaleTimeString()}</p>
                  </div>
                ))}
                {count > 5 && (
                  <div className="px-4 py-2 text-[10px] text-slate-400 font-semibold text-center">
                    +{count - 5} more items
                  </div>
                )}
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
              <a
                href="/ai"
                onClick={() => setOpen(false)}
                className="block w-full text-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
              >
                View AI Command Center →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
