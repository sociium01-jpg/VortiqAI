'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Check, X, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Clock, Eye } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

export default function AIApprovalQueue({ compact = false }: { compact?: boolean }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [resolved, setResolved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const pending = await vortiqClient.callQuery('ai.getAIApprovalQueue', { includeResolved: false });
      setQueue(pending || []);
      if (showResolved) {
        const all = await vortiqClient.callQuery('ai.getAIApprovalQueue', { includeResolved: true });
        setResolved((all || []).filter((a: any) => a.status !== 'PENDING'));
      }
    } catch (err: any) {
      console.error('Failed to fetch approval queue:', err);
    } finally {
      setLoading(false);
    }
  }, [showResolved]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    const handleChange = () => fetchQueue();
    window.addEventListener('vortiq-ai-approval-change', handleChange);
    window.addEventListener('vortiq-data-change', handleChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vortiq-ai-approval-change', handleChange);
      window.removeEventListener('vortiq-data-change', handleChange);
    };
  }, [fetchQueue]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await vortiqClient.callMutation('ai.approveAIAction', { id });
      await fetchQueue();
      window.dispatchEvent(new Event('vortiq-ai-approval-change'));
      window.dispatchEvent(new Event('vortiq-data-change'));
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setProcessing(id);
    try {
      await vortiqClient.callMutation('ai.rejectAIAction', { id, reason: rejectReason });
      setRejectingId(null);
      setRejectReason('');
      await fetchQueue();
      window.dispatchEvent(new Event('vortiq-ai-approval-change'));
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const getActionColor = (actionType: string) => {
    if (['SEND_WHATSAPP', 'SEND_EMAIL'].includes(actionType)) return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
    if (['RECORD_PAYMENT', 'UPDATE_PAYROLL'].includes(actionType)) return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
    if (['SUPPORT_ESCALATION'].includes(actionType)) return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
    return 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400';
  };

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-900" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Human Review Queue</h3>
          {queue.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black">{queue.length}</span>
          )}
        </div>
        <button onClick={fetchQueue} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Empty state */}
      {queue.length === 0 && (
        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-2">
          <Check className="w-6 h-6 text-emerald-500 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold">No items pending review</p>
        </div>
      )}

      {/* Approval Cards */}
      <div className="space-y-3">
        {queue.map((item) => {
          const payload = item.payload || {};
          const isExpanded = expandedId === item.id;
          const isRejecting = rejectingId === item.id;
          return (
            <div key={item.id} className="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
              {/* Card Header */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getActionColor(item.actionType)}`}>
                    {item.actionType?.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] text-slate-400 font-semibold">{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  {payload.actionRequired || `AI action requires your approval`}
                </p>
                {payload.draftMessage && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    {payload.draftMessage.substring(0, 150)}{payload.draftMessage.length > 150 ? '...' : ''}
                  </div>
                )}

                {/* Expand for details */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-400 font-bold"
                >
                  <Eye className="w-3 h-3" />
                  {isExpanded ? 'Hide' : 'View'} details
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isExpanded && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                    {Object.entries(payload).filter(([k]) => k !== 'draftMessage' && k !== 'actionRequired').map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="font-bold text-slate-500 uppercase">{k}:</span>
                        <span>{String(v).substring(0, 100)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reject reason input */}
              {isRejecting && (
                <div className="px-3.5 pb-3 space-y-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-500/30 rounded-lg focus:outline-none focus:border-rose-500 font-semibold"
                    autoFocus
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 px-3.5 pb-3.5">
                {!isRejecting ? (
                  <>
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={processing === item.id}
                      className="flex-1 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-black flex items-center justify-center gap-1 transition-all text-[10px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {processing === item.id ? 'Processing...' : 'Approve & Execute'}
                    </button>
                    <button
                      onClick={() => setRejectingId(item.id)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={processing === item.id}
                      className="flex-1 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-60 text-white font-black flex items-center justify-center gap-1 transition-all text-[10px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      {processing === item.id ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show Resolved History */}
      {!compact && (
        <button
          onClick={() => { setShowResolved(!showResolved); fetchQueue(); }}
          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold flex items-center gap-1 transition-colors"
        >
          {showResolved ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showResolved ? 'Hide' : 'Show'} resolved history ({resolved.length})
        </button>
      )}

      {showResolved && resolved.length > 0 && (
        <div className="space-y-2">
          {resolved.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {item.status === 'APPROVED' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <X className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span className="font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                  {(item.payload as any)?.actionRequired || item.actionType}
                </span>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
