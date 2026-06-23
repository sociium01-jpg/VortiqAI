'use client';

import { useUser } from '@clerk/nextjs';
import React, { useState, useEffect, useRef } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  MessageSquare, Plus, Send, Paperclip, Pin, Reply, 
  Sparkles, Brain, Search, HelpCircle, User, Users,
  Hash, ShieldAlert, Check, X, Bookmark, ExternalLink, 
  MessageCircle, RefreshCw, Landmark, Briefcase, FileText
} from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface Channel {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
  department?: string | null;
}

interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  parentMessageId?: string | null;
  linkedModule?: string | null;
  linkedRecordId?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  isPinned: boolean;
  createdAt: string | Date;
}

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  // State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Modals / Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'PUBLIC' | 'PRIVATE' | 'DIRECT'>('PUBLIC');
  const [newChannelDept, setNewChannelDept] = useState('');
  
  // Threading / AI Digest
  const [activeThreadParent, setActiveThreadParent] = useState<ChatMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([]);
  const [threadInput, setThreadInput] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Link record selector
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<'CRM_LEADS' | 'FINANCE_INVOICES' | 'TASKS' | 'HR_EMPLOYEES'>('CRM_LEADS');
  const [availableRecords, setAvailableRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  // Attachments
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string } | null>(null);

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load channels on startup
  useEffect(() => {
    if (!isLoaded) return;
    loadChannels();
  }, [isLoaded]);

  // Load messages when active channel changes
  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);
    setActiveThreadParent(null);
    setAiSummary(null);
  }, [activeChannel]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChannels = async () => {
    if (isDemo) {
      // Demo mock channels
      const mock = [
        { id: 'chan-1', name: 'general', type: 'PUBLIC' as const },
        { id: 'chan-2', name: 'announcements', type: 'PUBLIC' as const },
        { id: 'chan-3', name: 'sales-leads', type: 'PUBLIC' as const, department: 'SALES' },
        { id: 'chan-4', name: 'finance-billing', type: 'PUBLIC' as const, department: 'FINANCE' },
        { id: 'chan-5', name: 'Rahul Sharma', type: 'DIRECT' as const }
      ];
      setChannels(mock);
      setActiveChannel(mock[0]);
      return;
    }

    try {
      const res = await vortiqClient.callQuery('chat.channelsList');
      if (res && res.length > 0) {
        setChannels(res);
        setActiveChannel(res[0]);
      } else {
        // Create general channel if none exist
        const general = await vortiqClient.callMutation('chat.channelsCreate', {
          name: 'general',
          type: 'PUBLIC'
        });
        const announcements = await vortiqClient.callMutation('chat.channelsCreate', {
          name: 'announcements',
          type: 'PUBLIC'
        });
        setChannels([general, announcements]);
        setActiveChannel(general);
      }
    } catch (e) {
      console.error('Error loading channels:', e);
    }
  };

  const loadMessages = async (channelId: string) => {
    if (isDemo) {
      const mockMsgs = [
        {
          id: 'm-1',
          channelId,
          senderId: 'u-1',
          senderName: 'Rahul Sharma',
          content: 'Hi team, did we confirm the plywood dispatch for client CLI-004?',
          isPinned: false,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          id: 'm-2',
          channelId,
          senderId: 'u-2',
          senderName: 'Anjali Gupta',
          content: 'Yes, Delhivery tracking is uploaded in the Inventory ledger. Stock subtracted successfully.',
          isPinned: true,
          createdAt: new Date(Date.now() - 1800000)
        }
      ];
      setMessages(mockMsgs);
      return;
    }

    try {
      const res = await vortiqClient.callQuery('chat.messagesList', { channelId });
      if (res && res.messages) {
        setMessages(res.messages);
      }
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile && !selectedRecordId || !activeChannel) return;

    const content = inputText.trim() || (attachedFile ? `Attached file: ${attachedFile.name}` : `Linked record Reference`);

    if (isDemo) {
      const newMsg = {
        id: `m-${Date.now()}`,
        channelId: activeChannel.id,
        senderId: 'current-user',
        senderName: user?.fullName || 'Vortiq User',
        content,
        linkedModule: selectedRecordId ? selectedModule : undefined,
        linkedRecordId: selectedRecordId || undefined,
        fileUrl: attachedFile?.url || undefined,
        fileName: attachedFile?.name || undefined,
        isPinned: false,
        createdAt: new Date()
      };
      setMessages(prev => [...prev, newMsg]);
      setInputText('');
      setAttachedFile(null);
      setSelectedRecordId(null);
      return;
    }

    try {
      const message = await vortiqClient.callMutation('chat.messagesSend', {
        channelId: activeChannel.id,
        content,
        linkedModule: selectedRecordId ? selectedModule : undefined,
        linkedRecordId: selectedRecordId || undefined,
        fileUrl: attachedFile?.url || undefined,
        fileName: attachedFile?.name || undefined
      });
      setMessages(prev => [...prev, message]);
      setInputText('');
      setAttachedFile(null);
      setSelectedRecordId(null);
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    if (isDemo) {
      const newChan = {
        id: `chan-${Date.now()}`,
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
        type: newChannelType,
        department: newChannelDept || undefined
      };
      setChannels(prev => [newChan, ...prev]);
      setActiveChannel(newChan);
      setShowCreateModal(false);
      setNewChannelName('');
      return;
    }

    try {
      const channel = await vortiqClient.callMutation('chat.channelsCreate', {
        name: newChannelName.trim(),
        type: newChannelType,
        department: newChannelDept || undefined
      });
      setChannels(prev => [channel, ...prev]);
      setActiveChannel(channel);
      setShowCreateModal(false);
      setNewChannelName('');
    } catch (e) {
      console.error('Error creating channel:', e);
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeChannel) return;
    setIsGeneratingSummary(true);
    setAiSummary(null);

    if (isDemo) {
      setTimeout(() => {
        setAiSummary(`### 🤖 AI Channel Digest (#${activeChannel.name})\n\nHere is a summary of recent conversations in this channel:\n\n*   **Active Topics**: Discussing plywood deliveries and tracking IDs.\n*   **Key Decisions**: Delhivery logistics routing confirmed for CLI-004.\n*   **Action Items**:\n    *   Verify invoice payment confirmation with Finance Agent.\n    *   Create low-stock task reminder for Plywood inventory.`);
        setIsGeneratingSummary(false);
      }, 1000);
      return;
    }

    try {
      const res = await vortiqClient.callMutation('chat.getChannelAISummary', {
        channelId: activeChannel.id
      });
      if (res && res.summary) {
        setAiSummary(res.summary);
      }
    } catch (e) {
      console.error('Error getting summary:', e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleOpenThread = async (msg: ChatMessage) => {
    setActiveThreadParent(msg);
    if (isDemo) {
      setThreadReplies([]);
      return;
    }

    try {
      const res = await vortiqClient.callQuery('chat.threadRepliesList', {
        parentMessageId: msg.id
      });
      setThreadReplies(res || []);
    } catch (e) {
      console.error('Error getting thread replies:', e);
    }
  };

  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadInput.trim() || !activeThreadParent || !activeChannel) return;

    if (isDemo) {
      const newReply = {
        id: `tr-${Date.now()}`,
        channelId: activeChannel.id,
        senderId: 'current-user',
        senderName: user?.fullName || 'Vortiq User',
        content: threadInput.trim(),
        isPinned: false,
        createdAt: new Date()
      };
      setThreadReplies(prev => [...prev, newReply]);
      setThreadInput('');
      return;
    }

    try {
      const reply = await vortiqClient.callMutation('chat.messagesSend', {
        channelId: activeChannel.id,
        content: threadInput.trim(),
        parentMessageId: activeThreadParent.id
      });
      setThreadReplies(prev => [...prev, reply]);
      setThreadInput('');
    } catch (e) {
      console.error('Error sending thread reply:', e);
    }
  };

  const handlePinToggle = async (msg: ChatMessage) => {
    const nextPinned = !msg.isPinned;
    if (isDemo) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned: nextPinned } : m));
      return;
    }

    try {
      await vortiqClient.callMutation('chat.messagePinToggle', {
        id: msg.id,
        isPinned: nextPinned
      });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned: nextPinned } : m));
    } catch (e) {
      console.error('Error toggling pin:', e);
    }
  };

  // Link record finder
  useEffect(() => {
    if (!showLinkModal) return;
    loadLinkableRecords();
  }, [selectedModule, showLinkModal]);

  const loadLinkableRecords = async () => {
    if (isDemo) {
      if (selectedModule === 'CRM_LEADS') {
        setAvailableRecords([{ id: 'l-1', name: 'Rajesh K. (Plywood Retail)' }]);
      } else if (selectedModule === 'FINANCE_INVOICES') {
        setAvailableRecords([{ id: 'inv-1', name: 'INV-2026-001 (Rs 45,000)' }]);
      } else if (selectedModule === 'TASKS') {
        setAvailableRecords([{ id: 't-1', name: 'Dispatch Plywood batch' }]);
      } else {
        setAvailableRecords([{ id: 'emp-1', name: 'Rahul Sharma' }]);
      }
      return;
    }

    try {
      if (selectedModule === 'CRM_LEADS') {
        const res = await vortiqClient.callQuery('crm.contactsList', { limit: 10 });
        setAvailableRecords(res?.contacts?.map((c: any) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })) || []);
      } else if (selectedModule === 'FINANCE_INVOICES') {
        const res = await vortiqClient.callQuery('finance.invoicesList');
        setAvailableRecords(res?.map((i: any) => ({ id: i.id, name: `${i.invoiceNumber || 'INV'} (${formatINR(10000)})` })) || []);
      } else if (selectedModule === 'TASKS') {
        const res = await vortiqClient.callQuery('tasks.taskList');
        setAvailableRecords(res?.map((t: any) => ({ id: t.id, name: t.title })) || []);
      } else {
        const res = await vortiqClient.callQuery('hr.employeesList');
        setAvailableRecords(res?.map((e: any) => ({ id: e.id, name: e.fullName })) || []);
      }
    } catch (e) {
      console.error('Error listing linkable records:', e);
    }
  };

  return (
    <ConsoleLayout>
      <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
        
        {/* Sidebar Pane (Channels List) */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/40 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Internal Channels</span>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-teal-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map(chan => {
              const isActive = activeChannel?.id === chan.id;
              return (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannel(chan)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                    isActive 
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-l-2 border-teal-500' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {chan.type === 'DIRECT' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Hash className="w-4 h-4" />
                  )}
                  <span>{chan.name}</span>
                  {chan.department && (
                    <span className="ml-auto text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                      {chan.department}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Active Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
          {activeChannel ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between bg-white/70 dark:bg-slate-950/60 backdrop-blur-md">
                <div>
                  <h2 className="text-sm font-black flex items-center gap-1.5 dark:text-white">
                    {activeChannel.type === 'DIRECT' ? null : '#'}
                    {activeChannel.name}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {activeChannel.type === 'DIRECT' ? 'Direct Message session' : 'Channel discussions room'}
                  </p>
                </div>
                
                <button 
                  onClick={handleGenerateSummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 text-[10px] font-black transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  AI Summary
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <MessageSquare className="w-8 h-8 text-slate-350 dark:text-slate-600 mb-2" />
                    <span className="text-xs font-black text-slate-400">Welcome to #{activeChannel.name}!</span>
                    <p className="text-[10px] text-slate-400 font-medium max-w-xs mt-1">This is the absolute start of conversation logs in this room.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`group flex flex-col p-3 rounded-2xl border transition-all ${
                        msg.isPinned 
                          ? 'border-indigo-100 bg-indigo-50/20 dark:border-indigo-950/30 dark:bg-indigo-950/10' 
                          : 'border-slate-100 hover:border-slate-200 dark:border-slate-900/50 dark:hover:border-slate-900 bg-white dark:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black dark:text-white">{msg.senderName}</span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {msg.isPinned && (
                          <span className="flex items-center gap-0.5 text-[8px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}

                        {/* Link Record Badges */}
                        {msg.linkedModule && (
                          <span className="flex items-center gap-0.5 text-[8px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full font-bold">
                            {msg.linkedModule === 'CRM_LEADS' && <Users className="w-2.5 h-2.5" />}
                            {msg.linkedModule === 'FINANCE_INVOICES' && <Landmark className="w-2.5 h-2.5" />}
                            {msg.linkedModule === 'TASKS' && <Check className="w-2.5 h-2.5" />}
                            {msg.linkedModule === 'HR_EMPLOYEES' && <User className="w-2.5 h-2.5" />}
                            {msg.linkedModule.replace('_', ' ')}
                          </span>
                        )}

                        {/* Action buttons (hover) */}
                        <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
                          <button 
                            onClick={() => handleOpenThread(msg)}
                            className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded text-slate-500"
                            title="Reply in thread"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handlePinToggle(msg)}
                            className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded text-slate-500"
                            title="Toggle pin"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {msg.content}
                      </p>

                      {msg.fileName && (
                        <div className="mt-2 flex items-center gap-1.5 p-2 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 max-w-xs">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">{msg.fileName}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-2">
                
                {/* Active attachments display */}
                {(attachedFile || selectedRecordId) && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {attachedFile && (
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <Paperclip className="w-3 h-3 text-slate-500" />
                        <span className="max-w-[120px] truncate">{attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-500 ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {selectedRecordId && (
                      <div className="flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-xl text-[10px] font-bold text-teal-600 dark:text-teal-400 border border-teal-500/25">
                        <Bookmark className="w-3 h-3 text-teal-500" />
                        <span>Linked {selectedModule.replace('_', ' ')}</span>
                        <button onClick={() => setSelectedRecordId(null)} className="text-teal-400 hover:text-red-500 ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAttachedFile({ name: 'plywood_dispatch_invoice.pdf', url: '/files/mock_invoice.pdf' })}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
                    title="Attach mock file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
                    title="Link database record"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Message #${activeChannel.name}...`}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-teal-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/30">
              <MessageSquare className="w-10 h-10 text-slate-350 dark:text-slate-600 mb-2" />
              <span className="text-xs font-black text-slate-400">No active channel selected</span>
              <p className="text-[10px] text-slate-400 font-medium max-w-xs mt-1">Select a workspace channel or direct message chat in the sidebar to begin.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar (AI summary / Thread details) */}
        {(aiSummary || isGeneratingSummary || activeThreadParent) && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-900/40 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                {activeThreadParent ? 'Thread Replies' : 'AI Summary'}
              </span>
              <button 
                onClick={() => {
                  setAiSummary(null);
                  setActiveThreadParent(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content pane */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isGeneratingSummary && (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
                  <span className="text-[10px] font-bold text-slate-500">Synthesizing chat history...</span>
                </div>
              )}

              {aiSummary && !isGeneratingSummary && (
                <div className="prose prose-sm dark:prose-invert text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold space-y-3">
                  {aiSummary.split('\n').map((line, idx) => {
                    if (line.startsWith('###')) {
                      return <h3 key={idx} className="text-xs font-black text-slate-900 dark:text-white mt-4">{line.replace('###', '')}</h3>;
                    }
                    if (line.startsWith('*')) {
                      return <li key={idx} className="ml-2 list-disc">{line.replace('*', '').trim()}</li>;
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              )}

              {activeThreadParent && (
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    {/* Parent Message Bubble */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-250/20">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Parent Message</span>
                      <span className="text-xs font-black dark:text-white">{activeThreadParent.senderName}</span>
                      <p className="text-xs text-slate-650 dark:text-slate-400 mt-1 font-semibold">{activeThreadParent.content}</p>
                    </div>

                    {/* Replies */}
                    <div className="space-y-3">
                      {threadReplies.map(r => (
                        <div key={r.id} className="p-3 rounded-2xl border border-slate-100 bg-white dark:border-slate-900/50 dark:bg-slate-900/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black dark:text-white">{r.senderName}</span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                            {r.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendThreadReply} className="pt-4 border-t border-slate-200 dark:border-slate-900 flex items-center gap-2">
                    <input
                      type="text"
                      value={threadInput}
                      onChange={e => setThreadInput(e.target.value)}
                      placeholder="Reply..."
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-teal-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                    />
                    <button type="submit" className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md transition-all">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Channel Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-4">Create Channel</h2>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Channel Name</label>
                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  placeholder="e.g. plywood-sales"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Privacy Type</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  {(['PUBLIC', 'PRIVATE', 'DIRECT'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewChannelType(t)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
                        newChannelType === t
                          ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Department (Optional)</label>
                <input
                  type="text"
                  value={newChannelDept}
                  onChange={e => setNewChannelDept(e.target.value)}
                  placeholder="e.g. SALES, FINANCE"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl transition-all shadow-lg shadow-teal-500/10 text-xs"
              >
                Create Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Linking Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 relative">
            <button 
              onClick={() => setShowLinkModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-4">Link Database Record</h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Record Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CRM_LEADS', 'FINANCE_INVOICES', 'TASKS', 'HR_EMPLOYEES'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedModule(m)}
                      className={`py-2 rounded-xl text-[10px] font-black border transition-all ${
                        selectedModule === m
                          ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm font-black'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Select Record</label>
                <select
                  onChange={e => setSelectedRecordId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none transition-all"
                >
                  <option value="">-- Choose Record --</option>
                  {availableRecords.map(rec => (
                    <option key={rec.id} value={rec.id}>{rec.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowLinkModal(false)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl transition-all shadow-lg shadow-teal-500/10 text-xs"
              >
                Confirm Link
              </button>
            </div>
          </div>
        </div>
      )}

    </ConsoleLayout>
  );
}
