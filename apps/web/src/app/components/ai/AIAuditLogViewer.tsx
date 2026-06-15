'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, Filter, AlertCircle, CheckCircle, Brain, Clock, Download } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

const MODULES = ['ALL', 'CRM', 'LEAD_ENGINE', 'FINANCE', 'SUPPORT', 'MARKETING', 'HR', 'INVENTORY', 'TASKS', 'DASHBOARD', 'CUSTOM', 'CHAT'];

export default function AIAuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'output' | 'errors' | 'memory'>('output');
  const [memoryAuditLogs, setMemoryAuditLogs] = useState<any[]>([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [outputData, errorData, memData] = await Promise.all([
        vortiqClient.callQuery('ai.getAIAuditLogs', { module: selectedModule === 'ALL' ? undefined : selectedModule, limit: 50 }),
        vortiqClient.callQuery('ai.getAIErrorLogs'),
        vortiqClient.callQuery('ai.getAIMemoryAuditLogs')
      ]);
      setLogs(outputData || []);
      setErrorLogs(errorData || []);
      setMemoryAuditLogs(memData || []);
    } catch (err) {
      console.error('Failed to fetch AI audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const tabs = [
    { id: 'output', label: 'AI Actions', count: logs.length },
    { id: 'errors', label: 'Errors', count: errorLogs.length },
    { id: 'memory', label: 'Memory Audit', count: memoryAuditLogs.length }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-800 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">AI Audit Logs</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Every AI action is immutably logged</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
              tab.id === 'errors' && tab.count > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Module Filter (output tab only) */}
      {activeTab === 'output' && (
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400"
          >
            {MODULES.map(m => <option key={m} value={m}>{m === 'ALL' ? 'All Modules' : m}</option>)}
          </select>
        </div>
      )}

      {/* Log Lists */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-900" />)}
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          
          {/* Output / Action Logs */}
          {activeTab === 'output' && (
            logs.length === 0 ? (
              <div className="py-10 text-center">
                <Brain className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No AI actions logged yet</p>
              </div>
            ) : logs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-black text-slate-700 dark:text-slate-300">{log.agentName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 font-bold uppercase">{log.module}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">{log.outputSummary}</p>
                <div className="flex items-center gap-3 text-[9px] text-slate-400 font-semibold">
                  <span>Model: {log.model}</span>
                  <span>Tokens: {log.tokensUsed}</span>
                  {log.confidence && <span>Confidence: {(log.confidence * 100).toFixed(0)}%</span>}
                </div>
              </div>
            ))
          )}

          {/* Error Logs */}
          {activeTab === 'errors' && (
            errorLogs.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No errors logged — system is healthy</p>
              </div>
            ) : errorLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/15 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-black text-rose-700 dark:text-rose-400">{log.component}</span>
                  </div>
                  <span className="text-[9px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-rose-600 dark:text-rose-400 font-semibold">{log.errorMessage}</p>
              </div>
            ))
          )}

          {/* Memory Audit Logs */}
          {activeTab === 'memory' && (
            memoryAuditLogs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400 font-semibold">No memory changes recorded</p>
              </div>
            ) : memoryAuditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    log.action === 'DELETE' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
                    log.action === 'UPDATE' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                    'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  }`}>{log.action}</span>
                  <span className="text-[9px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                {log.oldContent && <p className="text-slate-400 line-through text-[10px]">{log.oldContent.substring(0, 80)}</p>}
                {log.newContent && <p className="text-slate-600 dark:text-slate-400 font-semibold text-[10px]">{log.newContent.substring(0, 80)}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
