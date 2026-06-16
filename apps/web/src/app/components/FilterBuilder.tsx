'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Play, Plus, X, Check, Save, Bookmark } from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface FilterBuilderProps {
  module: string;
  onApply: (filters: any) => void;
  onClose: () => void;
}

export default function FilterBuilder({ module, onApply, onClose }: FilterBuilderProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [dateRange, setDateRange] = useState('');
  
  // Custom field query variables
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldQueries, setCustomFieldQueries] = useState<Record<string, string>>({});
  
  // Saved presets list
  const [savedPresets, setSavedPresets] = useState<any[]>([]);
  const [presetName, setPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  useEffect(() => {
    // 1. Fetch custom variables
    vortiqClient.callQuery('dataHub.getCustomFields', { module }).then(res => {
      setCustomFields(res || []);
    }).catch(err => console.error('Error fetching custom fields:', err));

    // 2. Fetch saved filters
    vortiqClient.callQuery('dataHub.getSavedFilters', { module }).then(res => {
      setSavedPresets(res || []);
    }).catch(err => console.error('Error fetching saved filters:', err));
  }, [module]);

  const handleApply = () => {
    onApply({
      search,
      status,
      owner,
      dateRange,
      customFields: customFieldQueries
    });
  };

  const handleClear = () => {
    setSearch('');
    setStatus('');
    setOwner('');
    setDateRange('');
    setCustomFieldQueries({});
    onApply({});
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      const filters = { search, status, owner, dateRange, customFields: customFieldQueries };
      const newPreset = await vortiqClient.callMutation('dataHub.createSavedFilter', {
        module,
        name: presetName,
        filters
      });
      setSavedPresets([newPreset, ...savedPresets]);
      setPresetName('');
      setIsSavingPreset(false);
      alert('Saved view created successfully!');
    } catch (err: any) {
      alert(`Failed to save view: ${err.message}`);
    }
  };

  const handleApplyPreset = (preset: any) => {
    const f = preset.filters || {};
    setSearch(f.search || '');
    setStatus(f.status || '');
    setOwner(f.owner || '');
    setDateRange(f.dateRange || '');
    setCustomFieldQueries(f.customFields || {});
    onApply(f);
    alert(`Applied saved view: "${preset.name}"`);
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 text-slate-100 flex flex-col h-full overflow-y-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h4 className="font-bold flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-400" />
          Advanced Filters
        </h4>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Preset views */}
      {savedPresets.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved Views</span>
          <div className="space-y-1">
            {savedPresets.map((preset) => (
              <button 
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="w-full text-left text-xs bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-indigo-900/40 p-2 rounded-lg text-slate-300 flex items-center justify-between transition-all"
              >
                <span className="font-medium truncate">{preset.name}</span>
                <Bookmark className="h-3 w-3 text-indigo-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main filters */}
      <div className="space-y-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parameters</span>
        
        {/* Search */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Keyword Search</label>
          <input 
            type="text" 
            placeholder="Type search terms..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Record Status</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">-- All --</option>
            <option value="LEAD">Lead</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CUSTOMER">Customer</option>
            <option value="OPEN">Open / Pending</option>
            <option value="TODO">Todo</option>
            <option value="DONE">Done</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>

        {/* Owner */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Assigned Owner</label>
          <input 
            type="text" 
            placeholder="Search by owner..." 
            value={owner} 
            onChange={(e) => setOwner(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Created Period</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">-- Anytime --</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_YEAR">This Year</option>
          </select>
        </div>

        {/* Custom fields query */}
        {customFields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Custom Variables</span>
            {customFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="text-xs text-slate-300">{field.name}</label>
                <input 
                  type="text" 
                  placeholder={`Filter by ${field.name}...`} 
                  value={customFieldQueries[field.id] || ''} 
                  onChange={(e) => setCustomFieldQueries(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preset saver */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        {isSavingPreset ? (
          <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <input 
              type="text" 
              placeholder="Saved view name..." 
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full text-[11px] bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsSavingPreset(false)} className="text-[10px] text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSavePreset} className="text-[10px] bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded font-semibold text-white">Save</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsSavingPreset(true)}
            className="w-full flex items-center justify-center gap-1 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 py-2 rounded-lg text-xs font-semibold text-slate-300 transition-all"
          >
            <Save className="h-3 w-3" />
            Save Current View
          </button>
        )}
      </div>

      {/* Apply / Clear */}
      <div className="pt-2 flex gap-3">
        <button 
          onClick={handleClear}
          className="flex-1 bg-slate-800 hover:bg-slate-700 font-semibold text-xs py-2 rounded-lg text-center text-slate-200 transition-all"
        >
          Clear All
        </button>
        <button 
          onClick={handleApply}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs py-2 rounded-lg text-center text-white flex items-center justify-center gap-1 transition-all"
        >
          <Play className="h-3 w-3" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
