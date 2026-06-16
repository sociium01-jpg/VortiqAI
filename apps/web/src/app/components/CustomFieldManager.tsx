'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, X, Check, Eye } from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface CustomFieldManagerProps {
  module: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function CustomFieldManager({ module, onClose, onUpdate }: CustomFieldManagerProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('TEXT');
  const [optionsString, setOptionsString] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');

  const fetchFields = () => {
    vortiqClient.callQuery('dataHub.getCustomFields', { module }).then(res => {
      setFields(res || []);
    }).catch(err => console.error('Error fetching custom fields:', err));
  };

  useEffect(() => {
    fetchFields();
  }, [module]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Parse dropdown options if applicable
    const options = optionsString 
      ? optionsString.split(',').map(o => o.trim()).filter(Boolean) 
      : [];

    try {
      await vortiqClient.callMutation('dataHub.createCustomField', {
        module,
        name,
        type,
        options,
        isRequired,
        defaultValue
      });
      
      setName('');
      setOptionsString('');
      setIsRequired(false);
      setDefaultValue('');
      setIsAdding(false);
      
      fetchFields();
      if (onUpdate) onUpdate();
      alert('Custom field created successfully!');
    } catch (err: any) {
      alert(`Failed to create custom field: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom variable? Any saved data values for this field will be permanently deleted.')) return;
    try {
      await vortiqClient.callMutation('dataHub.deleteCustomField', { id });
      fetchFields();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Custom Fields Manager</h3>
              <p className="text-xs text-slate-400">Manage user-defined variables for {module.replace('CRM_', '').replace('_ITEMS', '')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Form to add custom field */}
          {isAdding ? (
            <form onSubmit={handleAdd} className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-4">
              <h4 className="font-bold text-sm text-slate-200">New Custom Variable</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Field Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Lead Score Code" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Data Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TEXT">Text String</option>
                    <option value="NUMBER">Number / Count</option>
                    <option value="DATE">Calendar Date</option>
                    <option value="CURRENCY">Currency Amount</option>
                    <option value="DROPDOWN">Dropdown List</option>
                  </select>
                </div>
              </div>

              {type === 'DROPDOWN' && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Dropdown Options (Comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hot, Warm, Cold" 
                    value={optionsString} 
                    onChange={(e) => setOptionsString(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isRequired"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isRequired" className="text-xs text-slate-300">Mark as Required during records entry</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-all"
                >
                  Save Field
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 py-2.5 rounded-xl text-xs font-semibold text-indigo-400 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Custom Variable
            </button>
          )}

          {/* List of existing custom fields */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Fields ({fields.length})</span>
            
            {fields.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No custom variables defined yet. Define attributes to capture extra data.
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-800/60 p-3 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-slate-200">{f.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Type: <span className="font-medium text-slate-400">{f.type}</span>
                        {f.isRequired ? ' • Required' : ''}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(f.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
