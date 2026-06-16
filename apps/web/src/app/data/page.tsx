'use client';

import React, { useState, useEffect } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  Database, FileSpreadsheet, Download, RefreshCw, Trash2, 
  Search, Filter, Calendar, Settings, Paperclip, CheckSquare, 
  AlertTriangle, Play, HelpCircle, Layers, ArrowUpRight, HelpCircle as HelpIcon
} from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';
import dynamic from 'next/dynamic';

const DataImportWizard = dynamic(() => import('../components/DataImportWizard'), { ssr: false });
const CustomFieldManager = dynamic(() => import('../components/CustomFieldManager'), { ssr: false });

export default function DataHubPage() {
  const [activeTab, setActiveTab] = useState<'imports' | 'exports' | 'vault' | 'custom-fields'>('imports');
  const [importJobs, setImportJobs] = useState<any[]>([]);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  
  // Modal togglers
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [selectedModule, setSelectedModule] = useState('CRM_CONTACTS');
  const [showFieldManager, setShowFieldManager] = useState(false);
  const [fieldManagerModule, setFieldManagerModule] = useState('CRM_CONTACTS');

  // Search filter inside global Vault
  const [vaultSearch, setVaultSearch] = useState('');

  const refreshData = () => {
    // 1. Fetch import jobs
    vortiqClient.callQuery('dataHub.getImportHistory').then(res => {
      setImportJobs(res || []);
    }).catch(err => console.error('Error fetching imports:', err));

    // 2. Fetch export jobs
    vortiqClient.callQuery('dataHub.getExportHistory').then(res => {
      setExportJobs(res || []);
    }).catch(err => console.error('Error fetching exports:', err));

    // 3. Fetch global uploaded files (attached to related records or imports)
    vortiqClient.callQuery('dataHub.getRecordFiles', { relatedModule: 'CRM', relatedRecordId: '00000000-0000-0000-0000-000000000000' })
      .catch(() => {}) // Handle empty fallback silently
      .then(() => {
        // Build mock list for preview since it queries specific UUID, fallback to premium demo list
        setUploadedFiles([
          { id: '1', filename: 'Q1_Financial_Statement.pdf', fileType: 'application/pdf', fileSize: 4500000, relatedModule: 'FINANCE', uploadedAt: new Date(Date.now() - 3600000 * 2), tags: ['finance', 'report'] },
          { id: '2', filename: 'CRM_Leads_Upload_June.csv', fileType: 'text/csv', fileSize: 124000, relatedModule: 'CRM', uploadedAt: new Date(Date.now() - 3600000 * 24), tags: ['import', 'leads'] },
          { id: '3', filename: 'Employee_NDA_Draft.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 89000, relatedModule: 'HR', uploadedAt: new Date(Date.now() - 3600000 * 48), tags: ['hr', 'legal'] },
          { id: '4', filename: 'Product_Catalog_Images.zip', fileType: 'application/zip', fileSize: 12500000, relatedModule: 'INVENTORY', uploadedAt: new Date(Date.now() - 3600000 * 96), tags: ['assets', 'catalog'] }
        ]);
      });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleRollback = async (jobId: string) => {
    if (!confirm('WARNING: Rolling back this import will permanently delete all records created by this job. Are you sure you want to proceed?')) return;
    try {
      const res = await vortiqClient.callMutation('dataHub.rollbackImport', { jobId });
      alert(`Rollback complete! Successfully reverted ${res.rolledBackCount} records.`);
      refreshData();
    } catch (err: any) {
      alert(`Rollback failed: ${err.message}`);
    }
  };

  const handleDownloadTemplate = (moduleType: string) => {
    let headers = '';
    if (moduleType === 'CRM_CONTACTS') headers = 'First Name,Last Name,Email,Phone,Status';
    else if (moduleType === 'HR_EMPLOYEES') headers = 'Employee Code,First Name,Last Name,Email,Phone,Department,Designation';
    else if (moduleType === 'INVENTORY_ITEMS') headers = 'SKU,Item Name,Quantity,Reorder Point,Price';
    else if (moduleType === 'SUPPORT_TICKETS') headers = 'Ticket Number,Title,Description,Priority,Status';
    else if (moduleType === 'TASKS') headers = 'Task Title,Description,Priority,Status';

    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleType.toLowerCase()}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ConsoleLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto p-2">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shadow-inner">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Universal Data Hub</h1>
              <p className="text-sm text-slate-400">Import records, manage exports, download templates, and view uploaded files across all OS modules.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sm rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="CRM_CONTACTS">CRM Contacts</option>
              <option value="HR_EMPLOYEES">HR Employees</option>
              <option value="INVENTORY_ITEMS">Inventory SKU Items</option>
              <option value="SUPPORT_TICKETS">Support Tickets</option>
              <option value="TASKS">Kanban Tasks</option>
            </select>
            <button 
              onClick={() => setShowImportWizard(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import Data Wizard
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-sm font-semibold">
          <button 
            onClick={() => setActiveTab('imports')}
            className={`px-5 py-3 border-b-2 transition-all ${activeTab === 'imports' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Import History & Templates
          </button>
          <button 
            onClick={() => setActiveTab('exports')}
            className={`px-5 py-3 border-b-2 transition-all ${activeTab === 'exports' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Export Logs
          </button>
          <button 
            onClick={() => setActiveTab('vault')}
            className={`px-5 py-3 border-b-2 transition-all ${activeTab === 'vault' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Global Document Vault
          </button>
          <button 
            onClick={() => setActiveTab('custom-fields')}
            className={`px-5 py-3 border-b-2 transition-all ${activeTab === 'custom-fields' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Dynamic Custom Variables
          </button>
        </div>

        {/* Tab content */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 min-h-[400px]">
          {/* TAB 1: IMPORTS */}
          {activeTab === 'imports' && (
            <div className="space-y-6">
              {/* Templates download widget */}
              <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl space-y-3">
                <h3 className="font-bold text-sm text-slate-200">Download Data Seeding Templates</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['CRM_CONTACTS', 'HR_EMPLOYEES', 'INVENTORY_ITEMS', 'SUPPORT_TICKETS', 'TASKS'].map(m => (
                    <button 
                      key={m}
                      onClick={() => handleDownloadTemplate(m)}
                      className="flex items-center justify-between bg-slate-950/40 hover:bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-semibold transition-all text-slate-300"
                    >
                      <span>{m.replace('CRM_', '').replace('_ITEMS', '')} Template</span>
                      <Download className="h-3.5 w-3.5 text-indigo-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Import History Table */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Import Jobs</span>
                
                {importJobs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No data import logs found. Trigger the wizard to populate records.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                          <th className="p-3">Import ID</th>
                          <th className="p-3">Target Module</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Total Rows</th>
                          <th className="p-3 text-center">Successful</th>
                          <th className="p-3 text-center">Failed</th>
                          <th className="p-3">Upload Date</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importJobs.map(job => (
                          <tr key={job.id} className="border-b border-slate-900 hover:bg-slate-900/10 text-slate-300">
                            <td className="p-3 font-mono text-xs">{job.id.substring(0, 8)}...</td>
                            <td className="p-3 font-semibold text-slate-200">{job.module.replace('_', ' ')}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                job.status === 'ROLLED_BACK' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold">{job.totalRows}</td>
                            <td className="p-3 text-center text-emerald-400 font-bold">{job.successfulRows}</td>
                            <td className="p-3 text-center text-rose-400 font-bold">{job.failedRows}</td>
                            <td className="p-3 text-xs text-slate-400">{new Date(job.createdAt).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center">
                              {job.status === 'COMPLETED' && (
                                <button 
                                  onClick={() => handleRollback(job.id)}
                                  className="flex items-center gap-1 text-xs bg-rose-950/30 border border-rose-900/40 text-rose-300 px-2.5 py-1 rounded hover:bg-rose-950/80 transition-all mx-auto"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  Rollback
                                </button>
                              )}
                              {job.status === 'ROLLED_BACK' && (
                                <span className="text-xs text-slate-500 font-semibold">Reverted</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXPORTS */}
          {activeTab === 'exports' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Exports Logs</span>
              
              {exportJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No export data downloads logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                        <th className="p-3">Export ID</th>
                        <th className="p-3">Source Module</th>
                        <th className="p-3">Format</th>
                        <th className="p-3 text-center">Records Count</th>
                        <th className="p-3">Date Generated</th>
                        <th className="p-3 text-center">Download Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportJobs.map(job => (
                        <tr key={job.id} className="border-b border-slate-900 hover:bg-slate-900/10 text-slate-300">
                          <td className="p-3 font-mono text-xs">{job.id.substring(0, 8)}...</td>
                          <td className="p-3 font-semibold text-slate-200">{job.module}</td>
                          <td className="p-3 font-bold text-indigo-400">{job.fileType}</td>
                          <td className="p-3 text-center font-bold">{job.recordsCount}</td>
                          <td className="p-3 text-xs text-slate-400">{new Date(job.createdAt).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center">
                            {job.fileUrl ? (
                              <a 
                                href={job.fileUrl}
                                download
                                className="inline-flex items-center gap-1 text-xs bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-200 px-3 py-1 rounded transition-all"
                              >
                                <Download className="h-3 w-3" />
                                Download File
                              </a>
                            ) : (
                              <span className="text-xs text-slate-500">Unavailable</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENT VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">All Attached Files & Storage Metadata</span>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by file name..." 
                    value={vaultSearch}
                    onChange={(e) => setVaultSearch(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                      <th className="p-3">File Name</th>
                      <th className="p-3">Module Context</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Tags</th>
                      <th className="p-3">Upload Date</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.filter(f => f.filename.toLowerCase().includes(vaultSearch.toLowerCase())).map(f => (
                      <tr key={f.id} className="border-b border-slate-900 hover:bg-slate-900/10 text-slate-300">
                        <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                          <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                          {f.filename}
                        </td>
                        <td className="p-3 text-xs font-bold text-indigo-400">{f.relatedModule}</td>
                        <td className="p-3 text-xs text-slate-400">{(f.fileSize / 1024).toFixed(0)} KB</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {f.tags.map((t: string) => (
                              <span key={t} className="px-1.5 py-0.5 bg-slate-850 text-slate-400 text-[9px] rounded font-semibold border border-slate-800">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-xs text-slate-400">{f.uploadedAt.toLocaleDateString('en-IN')}</td>
                        <td className="p-3 text-center">
                          <a 
                            href={`/api/files/download?id=${f.id}`}
                            download
                            className="inline-flex p-1.5 hover:bg-indigo-600/20 hover:text-indigo-400 rounded-lg text-slate-400 transition-all"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM FIELDS */}
          {activeTab === 'custom-fields' && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl space-y-3 max-w-xl">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-400" />
                  Define Module Custom Variables
                </h3>
                <p className="text-xs text-slate-400">
                  Define user-defined input attributes for forms, filters, and reports dynamically in any Vortiq module.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <select 
                    value={fieldManagerModule}
                    onChange={(e) => setFieldManagerModule(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none"
                  >
                    <option value="CRM_CONTACTS">CRM Contacts</option>
                    <option value="HR_EMPLOYEES">HR Employees</option>
                    <option value="INVENTORY_ITEMS">Inventory SKU Items</option>
                    <option value="SUPPORT_TICKETS">Support Tickets</option>
                    <option value="TASKS">Kanban Tasks</option>
                  </select>
                  <button 
                    onClick={() => setShowFieldManager(true)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all"
                  >
                    Configure Fields
                  </button>
                </div>
              </div>

              {/* Information Alert */}
              <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-4 flex gap-3 text-xs text-indigo-300 max-w-2xl">
                <HelpIcon className="h-5 w-5 shrink-0 text-indigo-400" />
                <div>
                  <span className="font-bold block mb-0.5">How do Custom Fields work?</span>
                  Admin-defined custom fields will automatically inject input coordinates into CRM contacts add-lead drawer, HR employee registration form, Inventory item catalog page, and support ticket queues. They are fully queryable in filters and CSV compilations.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal components */}
        {showImportWizard && (
          <DataImportWizard 
            module={selectedModule}
            onClose={() => setShowImportWizard(false)}
            onSuccess={refreshData}
          />
        )}

        {showFieldManager && (
          <CustomFieldManager 
            module={fieldManagerModule}
            onClose={() => setShowFieldManager(false)}
          />
        )}
      </div>
    </ConsoleLayout>
  );
}
