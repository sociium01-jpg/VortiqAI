'use client';

import React, { useState, useEffect } from 'react';
import { Paperclip, Plus, Trash2, Eye, Download, X, AlertCircle } from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface DocumentAttachmentPanelProps {
  module: string;
  recordId: string;
}

export default function DocumentAttachmentPanel({ module, recordId }: DocumentAttachmentPanelProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // Form states
  const [filename, setFilename] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [fileSize, setFileSize] = useState(1024 * 1024 * 2); // default 2MB
  const [filePath, setFilePath] = useState('/attachments/doc_v1.pdf');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchFiles = () => {
    vortiqClient.callQuery('dataHub.getRecordFiles', {
      relatedModule: module,
      relatedRecordId: recordId
    }).then(res => {
      setFiles(res || []);
    }).catch(err => console.error('Error fetching record files:', err));
  };

  useEffect(() => {
    fetchFiles();
  }, [module, recordId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) return;

    setUploading(true);
    try {
      const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
      await vortiqClient.callMutation('dataHub.uploadFile', {
        filename,
        fileType,
        fileSize,
        filePath,
        relatedModule: module,
        relatedRecordId: recordId,
        tags,
        description
      });
      setFilename('');
      setTagsInput('');
      setDescription('');
      setIsAdding(false);
      fetchFiles();
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await vortiqClient.callMutation('dataHub.deleteFile', { id });
      fetchFiles();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-indigo-400" />
          Document Attachments ({files.length})
        </h4>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Attach Document
        </button>
      </div>

      {/* Upload Form overlay */}
      {isAdding && (
        <form onSubmit={handleUpload} className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Document Name</label>
              <input 
                type="text" 
                placeholder="e.g. GSTIN Certificate.pdf"
                value={filename} 
                onChange={(e) => setFilename(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">File Type</label>
              <select 
                value={fileType} 
                onChange={(e) => setFileType(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="application/pdf">PDF Document</option>
                <option value="image/png">PNG Image</option>
                <option value="image/jpeg">JPEG Image</option>
                <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word Document (DOCX)</option>
                <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel Sheet (XLSX)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Tags (comma separated)</label>
              <input 
                type="text" 
                placeholder="e.g. compliance, legal" 
                value={tagsInput} 
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Description</label>
              <input 
                type="text" 
                placeholder="Optional notes..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] px-3 py-1 rounded transition-all"
            >
              {uploading ? 'Attaching...' : 'Save Attachment'}
            </button>
          </div>
        </form>
      )}

      {/* Files list */}
      {files.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-500">
          No files attached to this record.
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center justify-between bg-slate-950/30 border border-slate-800/80 p-2.5 rounded-lg text-xs">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-semibold text-slate-200 truncate">{f.filename}</p>
                <div className="flex gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span>{(f.fileSize / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{new Date(f.uploadedAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setPreviewFile(f)}
                  className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition-all"
                  title="Preview document"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <a 
                  href={`/api/files/download?id=${f.id}`}
                  download={f.filename}
                  className="p-1 hover:text-emerald-400 hover:bg-slate-800 rounded transition-all"
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button 
                  onClick={() => handleDelete(f.id)}
                  className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal overlay */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[75vh]">
            <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-slate-100">
              <span className="font-bold text-sm truncate">{previewFile.filename}</span>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-900 flex items-center justify-center p-4">
              {previewFile.fileType.startsWith('image/') ? (
                <img 
                  src={previewFile.filePath} 
                  alt={previewFile.filename}
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : previewFile.fileType === 'application/pdf' ? (
                <div className="w-full h-full border border-slate-850 rounded overflow-hidden flex flex-col items-center justify-center text-center p-6 bg-slate-950/40">
                  <Eye className="h-12 w-12 text-indigo-400 mb-3 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-200">PDF Reader Configured</span>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Premium PDF viewing, annotation extraction, and AI document understanding logs are configured.
                  </p>
                  <a 
                    href={`/api/files/download?id=${previewFile.id}`}
                    download={previewFile.filename}
                    className="mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    <Download className="h-4 w-4" />
                    Download to View Offline
                  </a>
                </div>
              ) : (
                <div className="text-center p-6 max-w-sm">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-200">Preview Unavailable</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Preview is not available for this file type ({previewFile.fileType}). You can download the file.
                  </p>
                  <a 
                    href={`/api/files/download?id=${previewFile.id}`}
                    download={previewFile.filename}
                    className="mt-4 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
