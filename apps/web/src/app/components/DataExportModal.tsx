'use client';

import React, { useState } from 'react';
import { X, Download, FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface DataExportModalProps {
  module: string;
  filters?: any;
  onClose: () => void;
}

export default function DataExportModal({ module, filters = {}, onClose }: DataExportModalProps) {
  const [format, setFormat] = useState<'CSV' | 'XLSX' | 'PDF'>('CSV');
  const [exporting, setExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await vortiqClient.callMutation('dataHub.createExportJob', {
        module,
        filters,
        fileType: format
      });
      setRecordCount(res.recordsCount);
      setDownloadUrl(res.fileUrl || `data:text/csv;charset=utf-8,${encodeURIComponent(res.filters || '')}`);
      setExporting(false);
    } catch (err: any) {
      setExporting(false);
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Export Data</h3>
              <p className="text-xs text-slate-400">Export records for {module.replace('CRM_', '').replace('_ITEMS', '')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {!downloadUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">Select your preferred export format:</p>
              
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setFormat('CSV')}
                  className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${format === 'CSV' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold' : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}`}
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs">CSV</span>
                </button>
                <button 
                  onClick={() => setFormat('XLSX')}
                  className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${format === 'XLSX' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold' : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}`}
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs">Excel</span>
                </button>
                <button 
                  onClick={() => setFormat('PDF')}
                  className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${format === 'PDF' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold' : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}`}
                >
                  <FileText className="h-6 w-6 text-rose-400" />
                  <span className="text-xs">PDF</span>
                </button>
              </div>

              {Object.keys(filters).length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-1">Active filters will be applied:</span>
                  {Object.entries(filters).map(([key, val]) => val && (
                    <div key={key} className="flex justify-between mt-0.5">
                      <span className="capitalize">{key}:</span>
                      <span className="text-slate-300 font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 animate-pulse">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-200">Export Ready!</h4>
                <p className="text-xs text-slate-400 mt-1">Compiled {recordCount} records into {format} file format.</p>
              </div>

              <a 
                href={downloadUrl} 
                download={`${module.toLowerCase()}_export.${format.toLowerCase()}`}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/10"
              >
                <Download className="h-4 w-4" />
                Download File Now
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="text-sm font-semibold text-slate-400 hover:text-white px-4 py-2"
          >
            Cancel
          </button>
          {!downloadUrl && (
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Export'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
