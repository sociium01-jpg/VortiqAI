'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Database, Edit2, Trash2, Plus, Check, X, RefreshCw, Brain, Filter } from 'lucide-react';
import { vortiqClient } from '../../utils/vortiqClient';

const MEMORY_TYPES = ['Company', 'Module', 'User', 'Record-Level'];
const AGENT_TYPES = ['SUPERBOSS', 'CRM', 'LEAD_ENGINE', 'FINANCE', 'SUPPORT', 'MARKETING', 'HR', 'INVENTORY', 'TASKS'];

export default function AIMemoryViewer() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemoryType, setSelectedMemoryType] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newMemory, setNewMemory] = useState({ agentType: 'SUPERBOSS', memoryType: 'Company', content: '' });
  const [saving, setSaving] = useState(false);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vortiqClient.callQuery('ai.getAIMemory', {
        agentType: selectedAgent || undefined,
        memoryType: selectedMemoryType || undefined
      });
      setMemories(data || []);
    } catch (err: any) {
      console.error('Failed to fetch AI memory:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, selectedMemoryType]);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      await vortiqClient.callMutation('ai.updateAIMemory', { id, content: editContent });
      setEditingId(null);
      setEditContent('');
      await fetchMemories();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this memory entry? This action is audited and cannot be undone.')) return;
    try {
      await vortiqClient.callMutation('ai.deleteAIMemory', { id });
      await fetchMemories();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleAddNew = async () => {
    if (!newMemory.content.trim()) return;
    setSaving(true);
    try {
      await vortiqClient.callMutation('ai.createAIMemory', newMemory);
      setAddingNew(false);
      setNewMemory({ agentType: 'SUPERBOSS', memoryType: 'Company', content: '' });
      await fetchMemories();
    } catch (err: any) {
      alert(`Create failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (memoryType: string) => {
    const map: Record<string, string> = {
      'Company': 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
      'Module': 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
      'User': 'bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
      'Record-Level': 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    };
    return map[memoryType] || 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">AI Memory Vault</h3>
            <p className="text-[10px] text-slate-500 font-semibold">{memories.length} memory entries · All changes are audited</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMemories} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setAddingNew(!addingNew)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all">
            <Plus className="w-3.5 h-3.5" />
            Add Memory
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>
        <select
          value={selectedMemoryType}
          onChange={e => setSelectedMemoryType(e.target.value)}
          className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400"
        >
          <option value="">All Memory Types</option>
          {MEMORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={selectedAgent}
          onChange={e => setSelectedAgent(e.target.value)}
          className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400"
        >
          <option value="">All Agents</option>
          {AGENT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Add New Memory Form */}
      {addingNew && (
        <div className="p-4 rounded-2xl border border-indigo-300 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-500" /> New Memory Entry
          </h4>
          <div className="flex gap-2">
            <select value={newMemory.agentType} onChange={e => setNewMemory(p => ({ ...p, agentType: e.target.value }))}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold focus:outline-none focus:border-indigo-400">
              {AGENT_TYPES.map(a => <option key={a} value={a}>{a} Agent</option>)}
            </select>
            <select value={newMemory.memoryType} onChange={e => setNewMemory(p => ({ ...p, memoryType: e.target.value }))}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold focus:outline-none focus:border-indigo-400">
              {MEMORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <textarea
            value={newMemory.content}
            onChange={e => setNewMemory(p => ({ ...p, content: e.target.value }))}
            placeholder="Enter memory content (e.g. 'Brand tone: Professional but approachable. Target: B2B SMEs in India.')"
            rows={3}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 resize-none focus:outline-none focus:border-indigo-400"
          />
          <div className="flex gap-2">
            <button onClick={handleAddNew} disabled={saving || !newMemory.content.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black transition-all">
              <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Memory'}
            </button>
            <button onClick={() => setAddingNew(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Memory List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />)}
        </div>
      ) : memories.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <Brain className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">No memory entries found</p>
          <p className="text-xs text-slate-400">AI will build memory as it interacts with your business data.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map((mem) => (
            <div key={mem.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-black uppercase ${getTypeColor(mem.memoryType)}`}>
                    {mem.memoryType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{mem.agentType} Agent</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(mem.id); setEditContent(mem.content); }}
                    className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                    title="Edit memory"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete memory (audited)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingId === mem.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-indigo-300 dark:border-indigo-500/40 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 resize-none focus:outline-none focus:border-indigo-400"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(mem.id)} disabled={saving}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black">
                      <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{mem.content}</p>
              )}

              <p className="text-[9px] text-slate-400 font-semibold">Created {new Date(mem.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
