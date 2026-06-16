'use client';

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, AlertCircle, Eye, Shield, History } from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface AuditLogEntry {
  id: string;
  action: string;
  oldValues: any;
  newValues: any;
  createdAt: string;
  user: string;
}

interface TimelineEntry {
  id: string;
  actionType: string;
  description: string;
  actorName: string;
  createdAt: string;
}

interface AuditHistoryPanelProps {
  module: string;
  recordId: string;
}

export default function AuditHistoryPanel({ module, recordId }: AuditHistoryPanelProps) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'diffs'>('timeline');

  const fetchHistory = () => {
    setLoading(true);
    vortiqClient.callQuery('interconnect.getAuditHistory', { module, recordId })
      .then((res: any) => {
        setTimeline(res.timeline || []);
        setAuditLogs(res.auditLogs || []);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load audit history:', err);
        setError('Failed to resolve change log history.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [module, recordId]);

  useEffect(() => {
    const handleDataChange = () => {
      fetchHistory();
    };
    window.addEventListener('vortiq-data-change', handleDataChange);
    return () => {
      window.removeEventListener('vortiq-data-change', handleDataChange);
    };
  }, []);

  const formatJSON = (val: any) => {
    if (!val) return 'None';
    try {
      if (typeof val === 'string') return val;
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          Audit & Life Timeline
        </h3>
        
        {/* Toggle subtab */}
        <div className="flex bg-slate-950/60 p-1 rounded-lg border border-slate-850 text-xs">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${activeSubTab === 'timeline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Activity Stream
          </button>
          <button
            onClick={() => setActiveSubTab('diffs')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${activeSubTab === 'diffs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Audit Log Diff
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
          Fetching change logs and timelines...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-rose-400 text-xs flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-rose-500/40" />
          {error}
        </div>
      ) : activeSubTab === 'timeline' ? (
        // TIMELINE STREAM
        timeline.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-semibold border border-dashed border-slate-800 rounded-xl">
            No activity logged for this record.
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 space-y-5 py-2">
            {timeline.map((entry) => (
              <div key={entry.id} className="relative group">
                {/* Node circle */}
                <div className="absolute -left-[30px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-slate-950 group-hover:scale-125 transition-all shadow-inner" />
                
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold">
                    {new Date(entry.createdAt).toLocaleString('en-IN')}
                  </span>
                  <p className="text-xs font-semibold text-slate-200">{entry.description}</p>
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Shield className="h-3 w-3 text-indigo-400" />
                    By: {entry.actorName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // DIFFS & AUDIT LOGS
        auditLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-semibold border border-dashed border-slate-800 rounded-xl">
            No deep versions audit history found.
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-slate-950/40 border border-slate-850 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-wide">Previous values</span>
                    <pre className="bg-slate-950 border border-slate-900 rounded p-2 text-rose-300 overflow-x-auto max-h-[80px] font-mono leading-relaxed">
                      {formatJSON(log.oldValues)}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-wide">Updated values</span>
                    <pre className="bg-slate-950 border border-slate-900 rounded p-2 text-emerald-300 overflow-x-auto max-h-[80px] font-mono leading-relaxed">
                      {formatJSON(log.newValues)}
                    </pre>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  Modified by: <span className="text-slate-200 font-bold">{log.user}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
