'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, Check, AlertTriangle, X, Play, RefreshCw, 
  ArrowRight, Download, Eye, Layers, FileSpreadsheet, Trash2 
} from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface DataImportWizardProps {
  module: string; // e.g. CRM_CONTACTS, HR_EMPLOYEES, INVENTORY_ITEMS, SUPPORT_TICKETS, TASKS
  onClose: () => void;
  onSuccess: () => void;
}

const FIELD_DEFAULTS: Record<string, { label: string; key: string; required: boolean }[]> = {
  CRM_CONTACTS: [
    { label: 'First Name', key: 'firstName', required: true },
    { label: 'Last Name', key: 'lastName', required: true },
    { label: 'Email Address', key: 'email', required: false },
    { label: 'Phone Number', key: 'phone', required: false },
    { label: 'Status', key: 'status', required: false }
  ],
  HR_EMPLOYEES: [
    { label: 'Employee Code', key: 'employeeCode', required: true },
    { label: 'First Name', key: 'firstName', required: true },
    { label: 'Last Name', key: 'lastName', required: true },
    { label: 'Email Address', key: 'email', required: true },
    { label: 'Phone Number', key: 'phone', required: false },
    { label: 'Department', key: 'department', required: false },
    { label: 'Designation', key: 'designation', required: false }
  ],
  INVENTORY_ITEMS: [
    { label: 'SKU Code', key: 'sku', required: true },
    { label: 'Item Name', key: 'name', required: true },
    { label: 'Quantity', key: 'quantity', required: false },
    { label: 'Reorder Point', key: 'reorderPoint', required: false },
    { label: 'Price (INR)', key: 'price', required: true }
  ],
  SUPPORT_TICKETS: [
    { label: 'Ticket Number', key: 'ticketNumber', required: false },
    { label: 'Title', key: 'title', required: true },
    { label: 'Description', key: 'description', required: true },
    { label: 'Priority', key: 'priority', required: false },
    { label: 'Status', key: 'status', required: false }
  ],
  TASKS: [
    { label: 'Task Title', key: 'title', required: true },
    { label: 'Description', key: 'description', required: false },
    { label: 'Priority', key: 'priority', required: false },
    { label: 'Status', key: 'status', required: false }
  ]
};

export default function DataImportWizard({ module, onClose, onSuccess }: DataImportWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateRule, setDuplicateRule] = useState<'SKIP' | 'UPDATE' | 'NEW'>('SKIP');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<any>(null);

  // Setup initial mapping suggestions
  const targetFields = FIELD_DEFAULTS[module] || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvContent(text);
        
        // Quick validate headers
        vortiqClient.callMutation('dataHub.validateImportFile', {
          csvContent: text,
          module
        }).then((res: any) => {
          setHeaders(res.headers);
          setPreviewRows(res.previewRows);
          
          // Auto-map based on string match
          const newMapping: Record<string, string> = {};
          res.headers.forEach((h: string) => {
            const match = targetFields.find(t => 
              t.label.toLowerCase().includes(h.toLowerCase()) || 
              t.key.toLowerCase().includes(h.toLowerCase())
            );
            if (match) {
              newMapping[h] = match.key;
            }
          });
          setMapping(newMapping);
          setStep(2);
        }).catch((err: any) => {
          alert(`File parsing failed: ${err.message}`);
        });
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleMapChange = (header: string, targetKey: string) => {
    setMapping(prev => ({
      ...prev,
      [header]: targetKey
    }));
  };

  const validateMapping = () => {
    const errors: string[] = [];
    // Check required fields are mapped
    targetFields.forEach(t => {
      if (t.required) {
        const isMapped = Object.values(mapping).includes(t.key);
        if (!isMapped) {
          errors.push(`Required field "${t.label}" is not mapped.`);
        }
      }
    });

    // Check duplicate targets
    const targets = Object.values(mapping).filter(Boolean);
    const uniqueTargets = new Set(targets);
    if (targets.length !== uniqueTargets.size) {
      errors.push('Multiple CSV columns cannot map to the same field.');
    }

    setValidationErrors(errors);
    if (errors.length === 0) {
      setStep(3);
    }
  };

  const startImport = async () => {
    setImporting(true);
    setProgress(10);
    
    // Simulate upload/import progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 15;
      });
    }, 400);

    try {
      const res = await vortiqClient.callMutation('dataHub.startImportJob', {
        module,
        csvContent,
        fieldMapping: mapping,
        duplicateRule
      });
      clearInterval(interval);
      setProgress(100);
      setSummary(res);
      setStep(4);
      onSuccess();
    } catch (err: any) {
      clearInterval(interval);
      setImporting(false);
      alert(`Import error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Universal Import Wizard</h3>
              <p className="text-xs text-slate-400">Importing records into {module.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps bar */}
        <div className="px-8 py-4 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700'}`}>1</span>
            Upload File
          </div>
          <div className="h-px bg-slate-800 flex-1 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700'}`}>2</span>
            Map Fields
          </div>
          <div className="h-px bg-slate-800 flex-1 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-400' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700'}`}>3</span>
            Validate & Preview
          </div>
          <div className="h-px bg-slate-800 flex-1 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 4 ? 'text-indigo-400' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${step >= 4 ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700'}`}>4</span>
            Import Summary
          </div>
        </div>

        {/* Body content (scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-xl p-8 text-center cursor-pointer bg-slate-900/30 transition-all flex flex-col items-center justify-center relative">
                <input 
                  type="file" 
                  accept=".csv,.xls,.xlsx" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-12 w-12 text-slate-500 mb-4" />
                <p className="font-semibold text-slate-200">Drag and drop your data file here</p>
                <p className="text-xs text-slate-400 mt-1">Supports CSV, XLS, XLSX formats (Up to 50MB)</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Import Guidelines
                </h4>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                  <li>Ensure the first row contains columns names (headers).</li>
                  <li>Required fields must not contain empty rows or invalid formatting.</li>
                  <li>Indian phone numbers should match mobile formats (with or without +91).</li>
                  <li>Invalid rows will be skipped and reported in the failed rows sheet.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <h4 className="font-semibold text-slate-200 text-sm">Map Columns from uploaded file to Vortiq system fields</h4>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {headers.map(h => (
                  <div key={h} className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">CSV Column</p>
                      <p className="font-semibold text-slate-200 truncate">{h}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Vortiq Target Field</p>
                      <select 
                        value={mapping[h] || ''} 
                        onChange={(e) => handleMapChange(h, e.target.value)}
                        className="w-full text-sm bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Ignore Column --</option>
                        {targetFields.map(t => (
                          <option key={t.key} value={t.key}>
                            {t.label} {t.required ? '(Required)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-900/60 text-rose-300 rounded-xl p-4 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Validation Errors
                  </p>
                  {validationErrors.map((err, i) => <p key={i}>• {err}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Validate & Preview */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-semibold text-slate-200 text-sm">Preview Records and Configure Rules</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Duplicate Rule:</label>
                    <select 
                      value={duplicateRule} 
                      onChange={(e: any) => setDuplicateRule(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs rounded p-1 text-slate-200"
                    >
                      <option value="SKIP">Skip Duplicates</option>
                      <option value="UPDATE">Update Existing</option>
                      <option value="NEW">Import All (Allows Duplicates)</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        {headers.map(h => mapping[h] && (
                          <th key={h} className="p-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-900 hover:bg-slate-900/20 text-slate-300">
                          {headers.map(h => mapping[h] && (
                            <td key={h} className="p-2 max-w-[150px] truncate">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importing ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>Importing to database...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400">
                  Ready to import. Click the button below to parse and save raw data records to the platform.
                </div>
              )}
            </div>
          )}

          {/* Step 4: Import Summary */}
          {step === 4 && summary && (
            <div className="space-y-6 py-4 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <Check className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-100">Import Job Complete!</h4>
              <p className="text-sm text-slate-400 mt-1">Processed {summary.totalRows} data rows successfully</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-xl mt-6">
                <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Created</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.createdRows}</p>
                </div>
                <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Updated</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">{summary.updatedRows}</p>
                </div>
                <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Duplicates Skipped</p>
                  <p className="text-2xl font-bold text-slate-300 mt-1">{summary.skippedRows}</p>
                </div>
                <div className="bg-slate-900/40 p-4 border border-rose-950 rounded-xl">
                  <p className="text-xs text-slate-400">Errors</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{summary.failedRows}</p>
                </div>
              </div>

              {summary.failedRows > 0 && (
                <div className="w-full max-w-xl mt-6 bg-rose-500/5 border border-rose-950 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Failed Rows Summary
                  </div>
                  <p className="text-xs text-rose-400 mb-3">
                    Some rows failed validation rules or contained malformed data. You can download the failed rows to correct and re-upload.
                  </p>
                  <button className="flex items-center gap-2 text-xs bg-rose-950/40 border border-rose-900/50 hover:bg-rose-950/80 text-rose-200 px-3 py-2 rounded-lg font-medium transition-all">
                    <Download className="h-4 w-4" />
                    Download Error Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div>
            {step === 2 && (
              <button 
                onClick={() => setStep(1)} 
                className="text-sm text-slate-400 hover:text-white font-medium"
              >
                Back to Upload
              </button>
            )}
            {step === 3 && !importing && (
              <button 
                onClick={() => setStep(2)} 
                className="text-sm text-slate-400 hover:text-white font-medium"
              >
                Back to Mapping
              </button>
            )}
          </div>
          <div>
            {step === 2 && (
              <button 
                onClick={validateMapping} 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {step === 3 && (
              <button 
                onClick={startImport} 
                disabled={importing}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-all"
              >
                {importing ? 'Processing...' : 'Run Import Now'}
                <Play className="h-4 w-4" />
              </button>
            )}
            {step === 4 && (
              <button 
                onClick={onClose} 
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all"
              >
                Close Wizard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
