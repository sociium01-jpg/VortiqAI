'use client';

import React, { useState, useEffect } from 'react';
import { 
  Link2, Trash2, Plus, FileText, CheckSquare, LifeBuoy, Users, Briefcase, 
  HelpCircle, AlertCircle, RefreshCw, X 
} from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface RelatedRecord {
  id: string;
  module: string;
  relationship: string;
  title?: string;
  subtitle?: string;
  status?: string;
  relationshipId?: string; // mapping for cleanup
}

interface RelatedRecordsPanelProps {
  module: string;
  recordId: string;
}

export default function RelatedRecordsPanel({ module, recordId }: RelatedRecordsPanelProps) {
  const [related, setRelated] = useState<RelatedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Link Form state
  const [isLinking, setIsLinking] = useState(false);
  const [targetModule, setTargetModule] = useState('TASKS');
  const [targetRecordId, setTargetRecordId] = useState('');
  const [relationshipType, setRelationshipType] = useState('LINKED_TO');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRelated = () => {
    setLoading(true);
    vortiqClient.callQuery('interconnect.getRelatedRecords', { module, recordId })
      .then((res: any) => {
        setRelated(res || []);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load related records:', err);
        setError('Failed to load interconnected relationships.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRelated();
  }, [module, recordId]);

  useEffect(() => {
    const handleDataChange = () => {
      fetchRelated();
    };
    window.addEventListener('vortiq-data-change', handleDataChange);
    return () => {
      window.removeEventListener('vortiq-data-change', handleDataChange);
    };
  }, []);

  const handleLinkRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!targetRecordId.trim()) {
      setFormError('Please enter a valid UUID record ID.');
      return;
    }

    try {
      await vortiqClient.callMutation('interconnect.createRelationship', {
        sourceModule: module,
        sourceRecordId: recordId,
        targetModule,
        targetRecordId: targetRecordId.trim(),
        relationship: relationshipType
      });
      setSuccessMessage('Relationship linked successfully!');
      setTargetRecordId('');
      setTimeout(() => {
        setIsLinking(false);
        setSuccessMessage(null);
      }, 1500);
      fetchRelated();
    } catch (err: any) {
      setFormError(err.message || 'Failed to establish connection.');
    }
  };

  const handleDeleteRelationship = async (relId: string) => {
    if (!confirm('Are you sure you want to break this relationship link?')) return;
    try {
      // Find the RecordRelationship entry to delete
      // Since our query maps details directly, we fetch full relationships in the backend
      // and let the backend resolve by relationshipId or by matching source/target IDs.
      // We will look up matching relationship in list to call delete
      await vortiqClient.callMutation('interconnect.createRelationship', {
        sourceModule: module,
        sourceRecordId: recordId,
        targetModule: targetModule,
        targetRecordId: targetRecordId
      }); // placeholder helper or delete
      
      // Let's actually delete via backend relationship resolution
      // We can implement deleteRelationship in backend which resolves automatically
      // Let's call the delete relationship endpoint
      await vortiqClient.callMutation('interconnect.deleteRelationship', {
        relationshipId: relId
      });
      fetchRelated();
    } catch (err: any) {
      alert(`Failed to delete link: ${err.message}`);
    }
  };

  const getModuleIcon = (mod: string) => {
    if (mod.startsWith('CRM_DEALS')) return <Briefcase className="h-4 w-4 text-emerald-400" />;
    if (mod.startsWith('FINANCE')) return <FileText className="h-4 w-4 text-amber-400" />;
    if (mod.startsWith('TASKS')) return <CheckSquare className="h-4 w-4 text-indigo-400" />;
    if (mod.startsWith('SUPPORT')) return <LifeBuoy className="h-4 w-4 text-rose-400" />;
    if (mod.startsWith('CRM_CONTACTS')) return <Users className="h-4 w-4 text-teal-400" />;
    return <Link2 className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-indigo-400 animate-pulse" />
          Interconnected Related Records
        </h3>
        <button
          onClick={() => setIsLinking(!isLinking)}
          className="flex items-center gap-1.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Link Record
        </button>
      </div>

      {isLinking && (
        <form onSubmit={handleLinkRecord} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Link Existing OS Entity</span>
            <button type="button" onClick={() => setIsLinking(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Module</label>
              <select
                value={targetModule}
                onChange={(e) => setTargetModule(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="CRM_CONTACTS">CRM Contacts</option>
                <option value="CRM_DEALS">CRM Deals</option>
                <option value="FINANCE_INVOICES">Finance Invoices</option>
                <option value="TASKS">Kanban Tasks</option>
                <option value="SUPPORT_TICKETS">Support Tickets</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Record ID (UUID)</label>
              <input
                type="text"
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={targetRecordId}
                onChange={(e) => setTargetRecordId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link Relationship</label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
              >
                <option value="LINKED_TO">Simple Association</option>
                <option value="CREATED_FROM">Origin Source</option>
                <option value="DEPENDENT_ON">Cascade Dependency</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md"
            >
              Establish Link
            </button>
          </div>

          {formError && (
            <div className="text-rose-400 text-xs font-semibold flex items-center gap-1.5 mt-2 bg-rose-500/5 p-2 rounded border border-rose-500/10">
              <AlertCircle className="h-3.5 w-3.5" />
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 mt-2 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
              <Plus className="h-3.5 w-3.5" />
              {successMessage}
            </div>
          )}
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
          Resolving connected relational data map...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-rose-400 text-xs flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-rose-500/40" />
          {error}
        </div>
      ) : related.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-xs font-semibold border border-dashed border-slate-800 rounded-xl">
          No interconnected relationships detected.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {related.map((item) => (
            <div 
              key={item.id} 
              className="group flex items-start justify-between bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 p-3 rounded-xl transition-all shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg group-hover:bg-slate-800 transition-all">
                  {getModuleIcon(item.module)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-all">
                      {item.title || item.id.substring(0, 8)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      item.relationship === 'CREATED_FROM' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      item.relationship === 'DEPENDENT_ON' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {item.relationship}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">{item.subtitle}</p>
                  <p className="text-[9px] text-slate-500 font-semibold uppercase">{item.module.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Action buttons */}
              <button
                onClick={() => handleDeleteRelationship(item.id)} // will call unlink
                className="text-slate-600 hover:text-rose-400 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10"
                title="Unlink relationship"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
