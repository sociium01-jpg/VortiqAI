'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  Users, UserPlus, Sparkles, Brain, ArrowRight, Trash2, 
  Layers, Mail, Target, MessageSquare, Plus, Check, Printer, Download, Search, Filter, Calendar, FileText, ChevronRight, X, Clock, Paperclip, Send, Settings, Cpu
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { handlePrint, handleExportPDF } from '../utils/export';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

import { vortiqClient } from '../utils/vortiqClient';
import dynamic from 'next/dynamic';
const ModuleAIPanel = dynamic(() => import('../components/ai/ModuleAIPanel'), { ssr: false });
const DataImportWizard = dynamic(() => import('../components/DataImportWizard'), { ssr: false });
const DataExportModal = dynamic(() => import('../components/DataExportModal'), { ssr: false });
const FilterBuilder = dynamic(() => import('../components/FilterBuilder'), { ssr: false });
const CustomFieldManager = dynamic(() => import('../components/CustomFieldManager'), { ssr: false });
const DocumentAttachmentPanel = dynamic(() => import('../components/DocumentAttachmentPanel'), { ssr: false });
const RelatedRecordsPanel = dynamic(() => import('../components/RelatedRecordsPanel'), { ssr: false });
const AuditHistoryPanel = dynamic(() => import('../components/AuditHistoryPanel'), { ssr: false });
const classifyConsolePrompt = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes('metric') || t.includes('score') || t.includes('dashboard')) return 'query_metrics';
  if (t.includes('revenue') || t.includes('finance') || t.includes('invoice') || t.includes('gst')) return 'query_finance';
  if (t.includes('stock') || t.includes('inventory')) return 'query_inventory';
  if (t.includes('absent') || t.includes('attendance') || t.includes('employee')) return 'query_employees';
  if (t.includes('lead')) return 'query_leads';
  if (t.includes('deal')) return 'query_deals';
  if (t.includes('task')) return 'query_tasks';
  if (t.includes('create contact') || t.includes('add lead') || t.includes('add contact')) return 'create_contact';
  if (t.includes('create task') || t.includes('add task')) return 'create_task';
  return 'query_metrics'; // default
};

function CRMContent() {
  const { user, isLoaded } = useUser();
  const [isDemo, setIsDemo] = useState(false);

  // Universal Data Import, Export, Search, Filter states
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clerkDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';
      const localDemo = localStorage.getItem('vortiq-demo-logged-in') === 'true';
      setIsDemo(clerkDemo || localDemo);
    }
  }, [isLoaded, user]);

  const refreshCrmData = () => {
    if (isLoaded && !isDemo) {
      // 1. Fetch contacts
      vortiqClient.callQuery('crm.contactsList', { limit: 100 }).then(res => {
        if (res && res.contacts && res.contacts.length > 0) {
          setContacts(res.contacts.map((c: any) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            companyName: c.companyName || 'Self',
            email: c.email || '',
            phone: c.phone || '',
            status: c.status,
            score: c.leadScore || 50,
            enriched: c.consentStatus === 'GIVEN',
            rep: 'Rahul Sharma',
            source: c.source || 'Manual Add',
            gst: 'Awaiting',
            industry: 'Custom Services',
            address: 'Corporate office, India',
            notes: [],
            attachments: [],
            manualRating: 3
          })));
        } else {
          setContacts([]);
        }
      }).catch(e => {
        console.error('Error fetching contacts:', e);
        setContacts([]);
      });

      // 2. Fetch companies
      vortiqClient.callQuery('crm.companiesList').then(res => {
        if (res && res.length > 0) {
          setCompanies(res.map((c: any) => ({
            id: c.id,
            name: c.name,
            industry: c.industry || 'General',
            contacts: 1,
            dealsValue: 0
          })));
        } else {
          setCompanies([]);
        }
      }).catch(e => {
        console.error('Error fetching companies:', e);
        setCompanies([]);
      });

      // 3. Fetch deals
      vortiqClient.callQuery('crm.dealsList').then(res => {
        if (res && res.length > 0) {
          setDeals(res.map((d: any) => ({
            id: d.id,
            name: d.title,
            company: d.companyId || 'Unknown',
            amount: d.value,
            stage: d.stage?.name || 'PROSPECT'
          })));
        } else {
          setDeals([]);
        }
      }).catch(e => {
        console.error('Error fetching deals:', e);
        setDeals([]);
      });

      // 4. Fetch meetings
      vortiqClient.callQuery('crm.meetingsList').then(res => {
        if (res && res.length > 0) {
          setMeetings(res.map((m: any) => ({
            id: m.id,
            title: m.title,
            company: m.description || 'General Meeting',
            time: m.dueAt ? new Date(m.dueAt).toLocaleString() : 'Today',
            rep: 'Rahul Sharma'
          })));
        } else {
          setMeetings([]);
        }
      }).catch(e => {
        console.error('Error fetching meetings:', e);
        setMeetings([]);
      });
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (!isDemo) {
        setContacts([]);
        setCompanies([]);
        setDeals([]);
        setMeetings([]);
        refreshCrmData();
      } else {
        // Keeps defaults for demo
      }
    }
  }, [isLoaded, isDemo]);

  useEffect(() => {
    if (isDemo) return;
    const handleDataChange = () => {
      refreshCrmData();
    };
    window.addEventListener('vortiq-data-change', handleDataChange);
    return () => {
      window.removeEventListener('vortiq-data-change', handleDataChange);
    };
  }, [isDemo, isLoaded]);

  // Tabs: 'contacts' | 'companies' | 'deals' | 'meetings' | 'whatsapp' | 'openclaw'
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies' | 'deals' | 'meetings' | 'whatsapp' | 'openclaw'>('contacts');

  const searchParams = useSearchParams();
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && ['contacts', 'companies', 'deals', 'meetings', 'whatsapp', 'openclaw'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minScore, setMinScore] = useState(0);

  // Selected item for Detailed View (drawer)
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  // WhatsApp States
  const [waEnabled, setWaEnabled] = useState(true);
  const [waPhone, setWaPhone] = useState('+919000012345');
  const [waVerifyToken, setWaVerifyToken] = useState('vortiq_verify_token_xyz');
  const [waId, setWaId] = useState('waba_9021830');
  const [showMetaSignup, setShowMetaSignup] = useState(false);
  const [metaConnected, setMetaConnected] = useState(true);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testingMessage, setTestingMessage] = useState(false);

  // Live Chat Simulator Sandbox States
  const [waChats, setWaChats] = useState([
    { id: 'wa-1', phone: '+919876543210', name: 'Ravi Shah', lastMessage: 'Interested in property options', time: '10m ago', unread: false, messages: [
      { id: 'm1', text: 'Namaste Raviji, I am an AI calling. How can I help you today?', sender: 'assistant', time: '10m ago' },
      { id: 'm2', text: 'Interested in premium property options and luxury villas spec pricing sheets.', sender: 'client', time: '9m ago' }
    ] },
    { id: 'wa-2', phone: '+919500012345', name: 'Sunita Rao', lastMessage: 'What are your timings?', time: '1h ago', unread: false, messages: [
      { id: 'm3', text: 'Hello, what are your services and operational timings?', sender: 'client', time: '1h ago' }
    ] }
  ]);
  const [selectedChatId, setSelectedChatId] = useState('wa-1');
  const [outgoingText, setOutgoingText] = useState('');
  const [incomingText, setIncomingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [faqInput, setFaqInput] = useState('Business Name: Alpha Real Estate Developers\nHours: Mon-Sat 9AM-7PM\nServices: Luxury Hinjewadi villas layout configurations starting at Rs 1.2 Crore\nAuto-reply FAQs: Yes, we provide site visits and sub-structure payment plans over 3 years.');

  // OpenClaw States
  const [openClawEnabled, setOpenClawEnabled] = useState(true);
  const [openClawPerms, setOpenClawPerms] = useState({
    crmConnected: true,
    tasksConnected: true,
    financeConnected: true,
    inventoryConnected: true,
    hrConnected: true,
    dashboardConnected: true,
    supportConnected: true
  });
  const [consolePrompt, setConsolePrompt] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'Vortiq OpenClaw Agent Environment v1.0.0 Online',
    'OpenClaw: Standard capabilities parsed successfully.',
    'System: Awaiting user command input...'
  ]);
  const [runningCmd, setRunningCmd] = useState(false);

  // Load configurations from DB on mount
  useEffect(() => {
    if (!isDemo && isLoaded) {
      vortiqClient.callQuery('ai.getConnectorConfig', { connectorType: 'OPENCLAW' })
        .then((res: any) => {
          if (res) {
            setOpenClawEnabled(res.isEnabled);
            if (res.config && typeof res.config === 'object') {
              setOpenClawPerms(prev => ({ ...prev, ...res.config }));
            }
          }
        }).catch(err => console.error('Error loading OpenClaw config:', err));

      vortiqClient.callQuery('ai.getConnectorConfig', { connectorType: 'WHATSAPP' })
        .then((res: any) => {
          if (res) {
            setWaEnabled(res.isEnabled);
            if (res.config && typeof res.config === 'object') {
              setWaPhone(res.config.phone || '+919000012345');
              setWaVerifyToken(res.config.verifyToken || 'vortiq_verify_token_xyz');
              setWaId(res.config.wabaId || 'waba_9021830');
              setMetaConnected(res.config.metaConnected !== false);
              if (res.config.faqInput) setFaqInput(res.config.faqInput);
            }
          }
        }).catch(err => console.error('Error loading WhatsApp config:', err));
    }
  }, [isDemo, isLoaded]);

  const handleSaveOpenClawPerms = (updatedPerms: any, enabledState: boolean = openClawEnabled) => {
    setOpenClawPerms(updatedPerms);
    if (!isDemo) {
      vortiqClient.callMutation('ai.saveConnectorConfig', {
        connectorType: 'OPENCLAW',
        isEnabled: enabledState,
        config: updatedPerms
      }).catch(err => console.error('Error saving OpenClaw config:', err));
    }
  };

  const handleSaveWhatsAppConfig = (updates: any, enabledState: boolean = waEnabled) => {
    if (!isDemo) {
      const mergedConfig = {
        phone: waPhone,
        verifyToken: waVerifyToken,
        wabaId: waId,
        metaConnected,
        faqInput,
        ...updates
      };
      vortiqClient.callMutation('ai.saveConnectorConfig', {
        connectorType: 'WHATSAPP',
        isEnabled: enabledState,
        config: mergedConfig
      }).catch(err => console.error('Error saving WhatsApp config:', err));
    }
  };

  const handleSendOutgoingMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingText.trim()) return;
    const newMessage = {
      id: `msg-${Date.now()}`,
      text: outgoingText,
      sender: 'assistant',
      time: 'Just now'
    };
    setWaChats(prev => prev.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          lastMessage: outgoingText,
          time: 'Just now',
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));
    setOutgoingText('');
  };

  const handleSimulateIncomingMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomingText.trim()) return;
    const clientMessage = {
      id: `msg-${Date.now()}`,
      text: incomingText,
      sender: 'client',
      time: 'Just now'
    };
    
    setWaChats(prev => prev.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          lastMessage: incomingText,
          time: 'Just now',
          messages: [...chat.messages, clientMessage]
        };
      }
      return chat;
    }));
    
    const queryText = incomingText;
    setIncomingText('');

    if (autoReplyEnabled) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        let reply = "Hello! I'm your Vortiq AI assistant. I didn't quite catch that. Could you clarify?";
        const lower = queryText.toLowerCase();
        if (lower.includes('timing') || lower.includes('hour')) {
          reply = "Our business hours are Monday to Saturday from 9:00 AM to 7:00 PM. We are closed on Sundays.";
        } else if (lower.includes('price') || lower.includes('cost') || lower.includes('luxury') || lower.includes('villa')) {
          reply = "Our premium luxury Hinjewadi villas start at Rs 1.2 Crore. We offer sub-structure payment plans spread over 3 years.";
        } else if (lower.includes('visit') || lower.includes('book') || lower.includes('appointment')) {
          reply = "I would be happy to schedule a site visit for you! Would tomorrow afternoon at 3:00 PM work?";
        } else if (lower.includes('service')) {
          reply = "We specialize in layout configurations, sub-structure planning, and premium property sales in Chakan and Hinjewadi.";
        }

        const botMessage = {
          id: `msg-${Date.now() + 1}`,
          text: reply,
          sender: 'assistant',
          time: 'Just now'
        };

        setWaChats(prev => prev.map(chat => {
          if (chat.id === selectedChatId) {
            return {
              ...chat,
              lastMessage: reply,
              time: 'Just now',
              messages: [...chat.messages, botMessage]
            };
          }
          return chat;
        }));
      }, 1200);
    }
  };

  const handleRunOpenClawCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consolePrompt.trim()) return;
    
    const prompt = consolePrompt;
    setConsolePrompt('');
    setRunningCmd(true);

    const intent = classifyConsolePrompt(prompt);

    setConsoleLogs(prev => [
      ...prev,
      `> Command: "${prompt}"`,
      `[OpenClaw] Parsing natural language query...`,
      `[OpenClaw] Intent classified: ${intent}`,
      `[OpenClaw] Checking cross-section connector permissions for ${intent.toUpperCase()}...`
    ]);

    setTimeout(() => {
      const intentToModule: Record<string, string> = {
        query_metrics: 'dashboardConnected',
        query_leads: 'crmConnected',
        query_deals: 'crmConnected',
        create_contact: 'crmConnected',
        query_tasks: 'tasksConnected',
        create_task: 'tasksConnected',
        query_finance: 'financeConnected',
        query_inventory: 'inventoryConnected',
        query_employees: 'hrConnected',
        list_approvals: 'supportConnected',
        approve_job: 'supportConnected',
        reject_job: 'supportConnected'
      };

      const requiredPermission = intentToModule[intent];
      const hasPermission = openClawPerms[requiredPermission as keyof typeof openClawPerms] === true;

      if (!openClawEnabled) {
        setConsoleLogs(prev => [
          ...prev,
          `[Error] OpenClaw Agent engine is currently disabled. Toggle it on to execute commands.`,
          `System: Idle.`
        ]);
        setRunningCmd(false);
        return;
      }

      if (requiredPermission && !hasPermission) {
        setConsoleLogs(prev => [
          ...prev,
          `[OpenClaw] Permission status: DENIED`,
          `[Error] OpenClaw Agent is not permitted to access this section (${requiredPermission.replace('Connected', '').toUpperCase()}). Please enable it in the Cross-Section Connectors Matrix.`,
          `System: Idle.`
        ]);
        setRunningCmd(false);
        return;
      }

      setConsoleLogs(prev => [
        ...prev,
        `[OpenClaw] Permission status: ALLOWED`,
        `[tRPC] Dispatching call: ai.runOpenClawSkill({ intent: "${intent}", parameters: {} })`
      ]);

      if (isDemo) {
        setTimeout(() => {
          let mockResult = {};
          if (intent === 'query_metrics') {
            mockResult = { contactsCount: 13, dealsCount: 6, tasksCount: 14, efficiencyScore: 91.5 };
          } else if (intent === 'query_finance') {
            mockResult = { totalUnpaid: 450000, invoiceCount: 3, pendingTaxes: [] };
          } else if (intent === 'query_inventory') {
            mockResult = { lowStock: [{ name: 'Steel Sheets SKU-V4', quantity: 80, reorderPoint: 100 }] };
          } else if (intent === 'query_employees') {
            mockResult = { absentees: [{ name: 'Priya Patel', role: 'SALES' }] };
          } else {
            mockResult = { status: 'success', data: 'Operation completed' };
          }

          setConsoleLogs(prev => [
            ...prev,
            `[tRPC] Response received (demo fallback):`,
            JSON.stringify(mockResult, null, 2),
            `System: Idle.`
          ]);
          setRunningCmd(false);
        }, 800);
      } else {
        vortiqClient.callMutation('ai.runOpenClawSkill', {
          intent,
          parameters: {}
        }).then(res => {
          setConsoleLogs(prev => [
            ...prev,
            `[tRPC] Response received:`,
            JSON.stringify(res.result || res, null, 2),
            `System: Idle.`
          ]);
        }).catch(err => {
          setConsoleLogs(prev => [
            ...prev,
            `[Error] tRPC dispatch failed: ${err.message}`,
            `System: Idle.`
          ]);
        }).finally(() => {
          setRunningCmd(false);
        });
      }
    }, 600);
  };

  // Simulated Sales Reps for assignment
  const salesReps = ['Rahul Sharma', 'Sneha Rao', 'Amit Verma', 'Priya Naik'];

  // Simulated Contacts
  const [contacts, setContacts] = useState([
    { id: 'C-001', name: 'Ravi Shah', companyName: 'Bharat Forge', email: 'ravi@bharatforge.com', phone: '+91 98765 43210', status: 'CUSTOMER', score: 92, enriched: true, rep: 'Rahul Sharma', source: 'Website Demo request', gst: '27AADCB1234F1Z5', industry: 'Automotive Components', address: 'Plot 42, MIDC Chakan, Pune', notes: ['Sent pricing catalog', 'Discussed raw sheet bulk pricing slots'], attachments: ['MCA_Certificate.pdf', 'GSTIN_Doc.pdf'], manualRating: 5 },
    { id: 'C-002', name: 'Amit Desai', companyName: 'Reliance Retail', email: 'amit@reliance.com', phone: '+91 98223 34455', status: 'LEAD', score: 74, enriched: false, rep: 'Sneha Rao', source: 'Meta Campaigns ad', gst: '27BBBBB2222B2Z2', industry: 'Retail & Consumer Goods', address: 'Reliance Corporate Park, Navi Mumbai', notes: ['Awaiting call scheduling response'], attachments: [], manualRating: 3 },
    { id: 'C-003', name: 'Priya Patel', companyName: 'Tata Motors', email: 'priya@tata.com', phone: '+91 99887 76655', status: 'QUALIFIED', score: 88, enriched: true, rep: 'Amit Verma', source: 'Referral partner', gst: '27CCCCC3333C3Z3', industry: 'Automotive Manufacturing', address: 'Tata Motors Plant, Pimpri, Pune', notes: ['NDA signed', 'Requested technical spec sheet variants'], attachments: ['NDA_Signed_Tata.pdf'], manualRating: 4 },
    { id: 'C-004', name: 'Vijay Nair', companyName: 'Jindal Steel', email: 'vijay@jindal.com', phone: '+91 97665 54433', status: 'LEAD', score: 45, enriched: false, rep: 'Priya Naik', source: 'Outbound Cold list', gst: 'Unregistered', industry: 'Metals & Forging', address: 'Jindal Office Tower, BKC, Mumbai', notes: ['Call disconnected twice'], attachments: [], manualRating: 2 }
  ]);

  // Simulated Companies
  const [companies, setCompanies] = useState([
    { id: 'COM-01', name: 'Bharat Forge', industry: 'Automotive Components', contacts: 1, dealsValue: 12000000 },
    { id: 'COM-02', name: 'Reliance Retail', industry: 'Retail & Consumer Goods', contacts: 1, dealsValue: 2200000 },
    { id: 'COM-03', name: 'Tata Motors', industry: 'Automotive Manufacturing', contacts: 1, dealsValue: 750000 },
    { id: 'COM-04', name: 'Jindal Steel', industry: 'Metals & Forging', contacts: 1, dealsValue: 450000 }
  ]);

  // Simulated Deal Pipeline
  const [deals, setDeals] = useState([
    { id: 'D-101', name: 'Raw Sheet Supply Deal', company: 'Bharat Forge', amount: 450000, stage: 'NEGOTIATION' },
    { id: 'D-102', name: 'Luxury Villa Sale', company: 'Ravi Shah', amount: 12000000, stage: 'PROSPECT' },
    { id: 'D-103', name: 'Enterprise Cloud Subscription', company: 'Tata Motors', amount: 750000, stage: 'WON' },
    { id: 'D-104', name: 'Retail Steel Roll Shipment', company: 'Jindal Steel', amount: 2200000, stage: 'QUALIFIED' }
  ]);

  // Simulated Meetings
  const [meetings, setMeetings] = useState([
    { id: 'M-501', title: 'Pricing negotiation call', company: 'Bharat Forge', time: 'Tomorrow, 11:30 AM', rep: 'Rahul Sharma' },
    { id: 'M-502', title: 'Product review demo meeting', company: 'Tata Motors', time: '18 June 2026, 04:00 PM', rep: 'Amit Verma' }
  ]);

  // Forms state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRep, setNewRep] = useState('Rahul Sharma');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Note creation state inside details drawer
  const [newNote, setNewNote] = useState('');

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');
    if (!newName.trim()) {
      setValidationError('Name is required.');
      return;
    }

    const names = newName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'User';

    const cleanPhone = newPhone.replace(/[\s-]/g, '');
    const formattedPhone = cleanPhone.startsWith('+91') ? cleanPhone : `+91${cleanPhone || '9000000000'}`;

    // Validate phone number format (Indian format starts with +91 and 10 digits)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(formattedPhone)) {
      setValidationError('Please enter a valid 10-digit Indian phone number starting with +91 (e.g. +91 98765 43210).');
      return;
    }

    // Validate email format
    if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    if (!isDemo) {
      vortiqClient.callMutation('crm.contactsCreate', {
        firstName,
        lastName,
        email: newEmail || undefined,
        phone: formattedPhone,
        status: 'LEAD' as const
      }).then(c => {
        const newC = {
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          companyName: newCompany || 'Self',
          email: c.email || '',
          phone: c.phone || '',
          status: c.status,
          score: c.leadScore || 50,
          enriched: c.consentStatus === 'GIVEN',
          rep: newRep,
          source: 'Manual Add',
          gst: 'Awaiting',
          industry: 'Custom Services',
          address: 'Corporate office, India',
          notes: [],
          attachments: [],
          manualRating: 3
        };
        setContacts(prev => [newC, ...prev]);
        setNewName('');
        setNewCompany('');
        setNewEmail('');
        setNewPhone('');
        setSuccessMessage('Lead created successfully!');
        setTimeout(() => {
          setIsAdding(false);
          setSuccessMessage('');
        }, 1500);
      }).catch(err => {
        setValidationError(err.message || 'Failed to add contact');
      }).finally(() => {
        setIsSubmitting(false);
      });
    } else {
      const newC = {
        id: `C-00${contacts.length + 1}`,
        name: newName,
        companyName: newCompany || 'Self',
        email: newEmail || `${newName.toLowerCase().replace(' ', '')}@vortiq-temp.in`,
        phone: newPhone || '+91 90000 00000',
        status: 'LEAD',
        score: 50,
        enriched: false,
        rep: newRep,
        source: 'Manual Add',
        gst: 'Awaiting',
        industry: 'Custom Services',
        address: 'Corporate office, India',
        notes: [],
        attachments: [],
        manualRating: 3
      };
      setContacts([newC, ...contacts]);
      setNewName('');
      setNewCompany('');
      setNewEmail('');
      setNewPhone('');
      setSuccessMessage('Demo Mode: Lead created successfully!');
      setTimeout(() => {
        setIsAdding(false);
        setSuccessMessage('');
      }, 1500);
      setIsSubmitting(false);
    }
  };

  const handleAIEnrich = (id: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, enriched: true, score: Math.min(100, c.score + 15), industry: c.industry === 'Custom Services' ? 'Enriched B2B SaaS' : c.industry };
        if (selectedContact && selectedContact.id === id) {
          setSelectedContact(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedContact) return;
    setContacts(prev => prev.map(c => {
      if (c.id === selectedContact.id) {
        const updated = { ...c, notes: [newNote, ...c.notes] };
        setSelectedContact(updated);
        return updated;
      }
      return c;
    }));
    setNewNote('');
  };

  const handleRepChange = (clientId: string, newRepName: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === clientId) {
        const updated = { ...c, rep: newRepName };
        if (selectedContact && selectedContact.id === clientId) {
          setSelectedContact(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  // Filter contacts
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesScore = c.score >= minScore;

    // Advanced FilterBuilder filters
    let matchesAdvanced = true;
    if (appliedFilters.search) {
      const s = appliedFilters.search.toLowerCase();
      matchesAdvanced = matchesAdvanced && (
        c.name.toLowerCase().includes(s) || 
        c.companyName.toLowerCase().includes(s) || 
        c.email.toLowerCase().includes(s)
      );
    }
    if (appliedFilters.status) {
      matchesAdvanced = matchesAdvanced && c.status === appliedFilters.status;
    }

    return matchesSearch && matchesStatus && matchesScore && matchesAdvanced;
  });

  // Reusable Agent mock mapping
  const crmMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('enrich') || lower.includes('contact')) {
      return {
        answer: "CRM Agent: LinkedIn data enriched. Target company headcount: 500-1000. Pune region active. Fit index matches ICP parameters (88/100).",
        logs: "Enriched metadata logs for Priya Patel (Tata Motors)."
      };
    }
    if (lower.includes('email') || lower.includes('draft') || lower.includes('outreach')) {
      return {
        answer: "Subject: Automating industrial steel dispatches with Vortiq OS\n\nDear Ravi Shah,\n\nI noticed Bharat Forge is looking to integrate Razorpay ledger flows with regional warehousing dispatches. Vortiq Business OS coordinates inventory limits and GSTR returns natively. Let's schedule a call.",
        logs: "Drafted sales email pitch for Ravi Shah (Bharat Forge)."
      };
    }
    return {
      answer: "CRM Agent: Active and monitoring pipeline metrics. You can ask me to 'enrich contact Priya Patel' or 'draft outbound email outreach Ravi Shah'.",
      logs: "Scanned CRM pipeline data fields."
    };
  };

  return (
    <ConsoleLayout>
      <div className="flex gap-6 items-start">
        
        {/* Main Workspace Column */}
        <div className="flex-1 space-y-6">
          
          {/* Module Title */}
          <div className="border-b border-slate-200 dark:border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-teal-600 text-teal-600 dark:text-teal-400" /> CRM & Pipelines
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage customer directory, companies, deals pipelines, and schedule follow-ups.</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilterBuilder(!showFilterBuilder)}
                className={`p-2.5 border rounded-xl transition-all shadow-sm ${showFilterBuilder ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                title="Advanced Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowCustomFields(true)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all shadow-sm"
                title="Custom Fields Manager"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowImportWizard(true)}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                Import CSV
              </button>
              <button 
                onClick={() => setShowExportModal(true)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
              >
                Export CSV
              </button>
              <button 
                onClick={handlePrint}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all shadow-sm"
                title="Print list"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleExportPDF('CRM Contacts Directory', filteredContacts)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition-all shadow-sm"
                title="Export PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="px-4 py-2.5 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-500 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
              >
                <UserPlus className="w-4 h-4" /> Add Lead
              </button>
            </div>
          </div>

          {/* CRM Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 text-xs font-bold text-slate-400">
            <button 
              onClick={() => { setActiveTab('contacts'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'contacts' ? 'border-teal-500 text-teal-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Contacts
            </button>
            <button 
              onClick={() => { setActiveTab('companies'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'companies' ? 'border-teal-500 text-teal-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" /> Companies
            </button>
            <button 
              onClick={() => { setActiveTab('deals'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'deals' ? 'border-teal-500 text-teal-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" /> Deals Pipeline
            </button>
            <button 
              onClick={() => { setActiveTab('meetings'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'meetings' ? 'border-teal-500 text-teal-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" /> Meetings & Follow-ups
            </button>
            <button 
              onClick={() => { setActiveTab('whatsapp'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'whatsapp' ? 'border-teal-500 text-teal-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Assistant
            </button>
            <button 
              onClick={() => { setActiveTab('openclaw'); setSelectedContact(null); }}
              className={`pb-3 transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'openclaw' ? 'border-teal-500 text-teal-600' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" /> OpenClaw Agent
            </button>
          </div>

          {/* Add Lead Form Overlay/Panel */}
          {isAdding && (
            <form onSubmit={handleAddContact} className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl shadow-md">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Lead
              </h3>
              
              {validationError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-605 dark:text-rose-400 rounded-xl text-xs font-bold animate-fadeIn">
                  {validationError}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold animate-fadeIn">
                  {successMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name *" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="text" 
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Company" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <input 
                  type="text" 
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone (e.g. +91 98000 11111)" 
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Assign Sales Owner</label>
                  <select 
                    value={newRep} 
                    onChange={(e) => setNewRep(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                  >
                    {salesReps.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Lead File'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsAdding(false); setValidationError(''); setSuccessMessage(''); }} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* CRM Views Switcher */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* VIEW: CONTACTS DIRECTORY */}
            {activeTab === 'contacts' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts..." 
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">All Status</option>
                      <option value="LEAD">Leads</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="CUSTOMER">Customers</option>
                    </select>

                    <select 
                      value={minScore} 
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value={0}>All Scores</option>
                      <option value={50}>Score &gt; 50</option>
                      <option value={80}>Score &gt; 80</option>
                    </select>
                  </div>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No contacts match the filter options.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Desktop table */}
                    <table className="hidden md:table w-full text-left text-xs leading-normal">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Lead Name</th>
                          <th className="py-2.5 px-3">Company</th>
                          <th className="py-2.5 px-3">Sales Owner</th>
                          <th className="py-2.5 px-3">AI Score</th>
                          <th className="py-2.5 px-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
                        {filteredContacts.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all cursor-pointer" onClick={() => setSelectedContact(c)}>
                            <td className="py-3 px-3">
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white">{c.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{c.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold">{c.companyName}</td>
                            <td className="py-3 px-3 text-[11px] font-semibold text-slate-500">{c.rep}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{c.score}/100</span>
                                {c.enriched && <span className="text-[8px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-1 py-0.5 rounded-full font-bold">Enriched</span>}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <ChevronRight className="w-4 h-4 text-slate-300 inline-block" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Card-based view */}
                    <div className="md:hidden space-y-3">
                      {filteredContacts.map((c) => (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedContact(c)}
                          className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{c.name}</h4>
                              <p className="text-[10px] text-slate-450 mt-0.5">{c.email} • {c.phone}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                          <div className="flex justify-between items-center text-[10px] border-t border-slate-100 dark:border-slate-800/60 pt-2 font-semibold">
                            <div>
                              <span className="text-slate-450">Company:</span> <span className="text-slate-700 dark:text-slate-300">{c.companyName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-450">Score:</span> 
                              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{c.score}/100</span>
                              {c.enriched && <span className="text-[8px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-1 py-0.5 rounded-full font-bold">Enriched</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: COMPANIES DIRECTORY */}
            {activeTab === 'companies' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Connected Client Companies</h3>
                {/* Desktop table */}
                <table className="hidden md:table w-full text-left text-xs leading-normal">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Company Name</th>
                      <th className="py-2.5 px-3">Industry Vertical</th>
                      <th className="py-2.5 px-3">Linked Contacts</th>
                      <th className="py-2.5 px-3 text-right">Pipeline Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300">
                    {companies.map((com) => (
                      <tr key={com.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all">
                        <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">{com.name}</td>
                        <td className="py-3 px-3 font-semibold text-slate-550">{com.industry}</td>
                        <td className="py-3 px-3 font-bold">{com.contacts}</td>
                        <td className="py-3 px-3 text-right font-black text-teal-600 dark:text-teal-400">{formatINR(com.dealsValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile view */}
                <div className="md:hidden space-y-3">
                  {companies.map((com) => (
                    <div key={com.id} className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{com.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-500/20">{com.industry}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] border-t border-slate-100 dark:border-slate-800/60 pt-2 font-semibold">
                        <div>
                          <span className="text-slate-400">Contacts:</span> <span className="text-slate-705 dark:text-slate-300">{com.contacts}</span>
                        </div>
                        <span className="font-black text-teal-605 dark:text-teal-400">{formatINR(com.dealsValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW: DEALS KANBAN */}
            {activeTab === 'deals' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Deals Stage Pipelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['PROSPECT', 'QUALIFIED', 'NEGOTIATION', 'WON'].map((stage) => {
                    const stageDeals = deals.filter(d => d.stage === stage);
                    return (
                      <div key={stage} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-900 pb-2">
                          <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">{stage}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-md font-bold">{stageDeals.length}</span>
                        </div>

                        <div className="space-y-2.5">
                          {stageDeals.map((d) => (
                            <div key={d.id} className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-800 rounded-xl space-y-2 text-xs shadow-sm">
                              <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white">{d.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{d.company}</p>
                              </div>
                              <p className="font-extrabold text-teal-600 dark:text-teal-400">{formatINR(d.amount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW: MEETINGS */}
            {activeTab === 'meetings' && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Scheduled Rep Meetings</h3>
                <div className="space-y-3">
                  {meetings.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-sm">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{m.title}</h4>
                        <p className="text-[10px] text-slate-500">Client: {m.company} | Owner: {m.rep}</p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {m.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW: WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* Left Side: Meta Onboarding Settings */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-teal-650" /> Meta WhatsApp Settings
                      </h3>
                      <button 
                        onClick={() => {
                          const newState = !waEnabled;
                          setWaEnabled(newState);
                          handleSaveWhatsAppConfig({}, newState);
                        }}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                          waEnabled 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {waEnabled ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp Phone Number</label>
                        <input 
                          type="text" 
                          value={waPhone} 
                          onChange={(e) => {
                            setWaPhone(e.target.value);
                            handleSaveWhatsAppConfig({ phone: e.target.value });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">WABA Account ID</label>
                        <input 
                          type="text" 
                          value={waId} 
                          onChange={(e) => {
                            setWaId(e.target.value);
                            handleSaveWhatsAppConfig({ wabaId: e.target.value });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">Verify Token</label>
                        <input 
                          type="text" 
                          value={waVerifyToken} 
                          onChange={(e) => {
                            setWaVerifyToken(e.target.value);
                            handleSaveWhatsAppConfig({ verifyToken: e.target.value });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-1">
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Webhook Endpoint</span>
                        <code className="text-[10px] block font-mono text-teal-605 dark:text-teal-400 select-all overflow-hidden text-ellipsis">
                          https://api.vortiq.in/api/whatsapp/webhook
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                      <Brain className="w-4.5 h-4.5 text-teal-600" /> FAQ Knowledge Base
                    </h3>
                    <div className="space-y-3 text-xs">
                      <p className="text-[10px] text-slate-500 leading-normal font-medium">
                        Configure business rules and contextual details that the AI WhatsApp assistant will read to resolve customer inbound Q&As.
                      </p>
                      <textarea
                        rows={6}
                        value={faqInput}
                        onChange={(e) => {
                          setFaqInput(e.target.value);
                          handleSaveWhatsAppConfig({ faqInput: e.target.value });
                        }}
                        placeholder="Define services, prices, and FAQs here..."
                        className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-[10px] text-slate-850 dark:text-slate-350 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Live Chat Simulator Sandbox */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col xl:flex-row overflow-hidden shadow-sm min-h-[500px]">
                  {/* Chats list */}
                  <div className="w-full xl:w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Simulated Inbounds</span>
                      <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full text-[9px] font-bold">2 active</span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[400px]">
                      {waChats.map(chat => (
                        <div 
                          key={chat.id}
                          onClick={() => setSelectedChatId(chat.id)}
                          className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                            selectedChatId === chat.id 
                              ? 'bg-slate-100 dark:bg-slate-800/40 border-l-4 border-teal-500' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">{chat.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{chat.lastMessage}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium shrink-0">{chat.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat Pane */}
                  <div className="flex-1 flex flex-col justify-between min-h-[400px]">
                    {/* Chat header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white">
                          {waChats.find(c => c.id === selectedChatId)?.name}
                        </h4>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                          {waChats.find(c => c.id === selectedChatId)?.phone}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span>AI Auto-Reply</span>
                        <button 
                          onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-all border ${
                            autoReplyEnabled ? 'bg-teal-500 border-teal-400' : 'bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${autoReplyEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[300px] min-h-[220px]">
                      {waChats.find(c => c.id === selectedChatId)?.messages.map(msg => (
                        <div 
                          key={msg.id}
                          className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                            msg.sender === 'client'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                              : 'bg-teal-650 text-white rounded-tr-none'
                          }`}>
                            <p className="font-medium">{msg.text}</p>
                            <span className={`text-[8px] block text-right font-bold ${
                              msg.sender === 'client' ? 'text-slate-500' : 'text-teal-200'
                            }`}>{msg.time}</span>
                          </div>
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Outgoing & Simulator Inputs */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                      {/* Operator manual reply */}
                      <form onSubmit={handleSendOutgoingMessage} className="flex gap-2">
                        <input 
                          type="text" 
                          value={outgoingText}
                          onChange={(e) => setOutgoingText(e.target.value)}
                          placeholder="Type manual reply (as operator)..."
                          className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500"
                        />
                        <button 
                          type="submit" 
                          className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center shrink-0 hover:bg-teal-500"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                      {/* Inbound Simulator (Simulates customer action) */}
                      <form onSubmit={handleSimulateIncomingMessage} className="flex gap-2">
                        <input 
                          type="text" 
                          value={incomingText}
                          onChange={(e) => setIncomingText(e.target.value)}
                          placeholder="Simulate incoming customer query message..."
                          className="flex-1 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <button 
                          type="submit" 
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-black flex items-center justify-center shrink-0 shadow-sm"
                        >
                          Simulate Inbound
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: OPENCLAW */}
            {activeTab === 'openclaw' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* Left Side: Connection permission matrix */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-teal-650" /> OpenClaw Status
                    </h3>
                    <button 
                      onClick={() => {
                        const newState = !openClawEnabled;
                        setOpenClawEnabled(newState);
                        handleSaveOpenClawPerms(openClawPerms, newState);
                      }}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                        openClawEnabled 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {openClawEnabled ? 'CONNECTED' : 'OFFLINE'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Cross-Section Connectors</h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-medium mt-0.5">
                        Authorize which workspace modules OpenClaw agents are permitted to query, read, and write database rows.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs font-bold text-slate-750 dark:text-slate-350">
                      {[
                        { key: 'dashboardConnected', label: 'Dashboard & Business Telemetry' },
                        { key: 'crmConnected', label: 'CRM Leads & Pipeline Deals' },
                        { key: 'tasksConnected', label: 'Tasks, Reminders & Calendars' },
                        { key: 'financeConnected', label: 'Invoices, Receivables & Taxes' },
                        { key: 'inventoryConnected', label: 'Inventory Stock & POs' },
                        { key: 'hrConnected', label: 'Employee Attendance Rosters' },
                        { key: 'supportConnected', label: 'Support SLA Ticket Queues' }
                      ].map((item) => {
                        const isChecked = openClawPerms[item.key as keyof typeof openClawPerms] === true;
                        return (
                          <label 
                            key={item.key} 
                            className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-900/30 cursor-pointer transition-all"
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                const updated = {
                                  ...openClawPerms,
                                  [item.key]: !isChecked
                                };
                                handleSaveOpenClawPerms(updated);
                              }}
                              className="w-4 h-4 accent-teal-500"
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Side: Natural Language Sandbox prompt & output */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-widest flex items-center gap-1.5">
                      <Plus className="w-4.5 h-4.5 text-teal-650" /> Prompt Console Sandbox
                    </h3>

                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                      Test the OpenClaw agent live. Enter operational prompts to see the agent parse intents, check cross-section permissions, make tRPC database calls, and return results.
                    </p>

                    <form onSubmit={handleRunOpenClawCommand} className="flex gap-2">
                      <input 
                        type="text" 
                        value={consolePrompt}
                        onChange={(e) => setConsolePrompt(e.target.value)}
                        placeholder="e.g. Find leads with high scores, Check stock warnings, Check overdue invoice finance"
                        className="flex-1 bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-teal-500 font-semibold"
                      />
                      <button 
                        type="submit" 
                        disabled={runningCmd || !consolePrompt.trim()}
                        className="px-5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black shadow-md disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 flex items-center justify-center shrink-0 min-w-[100px]"
                      >
                        {runningCmd ? 'Running...' : 'Run Prompt'}
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                      <span className="self-center font-extrabold uppercase text-slate-405">Presets:</span>
                      {[
                        'List low stock inventory items',
                        'Show metrics scorecard',
                        'Check pending approvals',
                        'Query finance receivables'
                      ].map(preset => (
                        <button 
                          key={preset}
                          type="button"
                          onClick={() => setConsolePrompt(preset)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-teal-500 hover:text-teal-650 dark:hover:text-teal-400 transition-all"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Console output */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-5 shadow-inner space-y-3 font-mono text-[10px] text-teal-400 min-h-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Execution Output logs</span>
                      <button 
                        onClick={() => setConsoleLogs([
                          'Vortiq OpenClaw Agent Environment v1.0.0 Online',
                          'System: Awaiting user command input...'
                        ])}
                        className="text-[9px] text-slate-500 hover:underline hover:text-slate-350"
                      >
                        Clear Console
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto leading-relaxed">
                      {consoleLogs.map((log, idx) => (
                        <div key={idx} className={
                          log.startsWith('>') ? 'text-white font-extrabold mt-2' :
                          log.startsWith('[Error]') ? 'text-rose-500 font-extrabold' :
                          log.startsWith('[OpenClaw]') ? 'text-teal-350 font-bold' :
                          log.startsWith('[tRPC]') ? 'text-indigo-405' :
                          'text-slate-500'
                        }>
                          {log.startsWith('{') || log.startsWith('[') ? (
                            <pre className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-900 text-teal-300 font-mono text-[9px] overflow-x-auto whitespace-pre">
                              {log}
                            </pre>
                          ) : (
                            <span>{log}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* SIDEBAR drawer detail view (if contact clicked) */}
          {selectedContact && (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-lg space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-900 pb-3">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Contact Profile File</span>
                  <button onClick={() => setSelectedContact(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 dark:text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Header profile details */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedContact.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedContact.companyName} ({selectedContact.industry})</p>
                  <div className="mt-2 flex flex-col gap-2 border bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        selectedContact.status === 'CUSTOMER' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                        selectedContact.status === 'QUALIFIED' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                      }`}>
                        {selectedContact.status}
                      </span>
                      <span>Fit Score: <b className="text-slate-800 dark:text-white">{selectedContact.score}/100</b></span>
                    </div>

                    {/* Manual Rating Fallback Selector */}
                    <div className="flex items-center gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-2">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Manual Rating:</span>
                      <div className="flex gap-0.5 text-amber-500 text-sm">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            onClick={() => {
                              setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, manualRating: star } : c));
                              setSelectedContact(prev => ({ ...prev, manualRating: star }));
                            }}
                            className="focus:outline-none hover:scale-110 transition-transform"
                          >
                            {star <= (selectedContact.manualRating || 3) ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Local SalesAgent enrichment triggers */}
                <div className="p-3 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/15 rounded-xl space-y-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" /> SalesAgent Copilot
                    </span>
                    {!selectedContact.enriched && (
                      <button 
                        onClick={() => handleAIEnrich(selectedContact.id)}
                        className="text-[9px] underline text-teal-600 dark:text-teal-400 font-bold"
                      >
                        Enrich details
                      </button>
                    )}
                  </div>
                  <p className="leading-relaxed">
                    {selectedContact.enriched 
                      ? `AI Propensity: High conversion potential (88%). Recommended Next Action: Send tailored Bulk Sheet supplier quotes.`
                      : `AI recommends enriching contact profile to fetch company headcount, LinkedIn URL, and GST registration status.`
                    }
                  </p>
                </div>

                {/* File details overview */}
                <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                    <span>GSTIN Number:</span>
                    <span className="text-slate-800 dark:text-slate-250">{selectedContact.gst}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                    <span>Phone Mobile:</span>
                    <span className="text-slate-800 dark:text-slate-250">{selectedContact.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                    <span>Sourced From:</span>
                    <span className="text-slate-800 dark:text-slate-250">{selectedContact.source}</span>
                  </div>
                  <div className="flex flex-col border-b border-slate-100 dark:border-slate-900 pb-1.5 gap-0.5">
                    <span>Office Address:</span>
                    <span className="text-[10px] text-slate-800 dark:text-slate-250 leading-relaxed font-normal">{selectedContact.address}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Assigned Rep:</span>
                    <select 
                      value={selectedContact.rep} 
                      onChange={(e) => handleRepChange(selectedContact.id, e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
                    >
                      {salesReps.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notes Feed section */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notes Thread</span>
                  
                  {/* Add note inline form */}
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add manual trace note..." 
                      className="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                    <button type="submit" className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-white rounded-xl">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedContact.notes.map((note: string, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-900 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 leading-normal font-semibold">
                        {note}
                      </div>
                    ))}
                    {selectedContact.notes.length === 0 && (
                      <p className="text-[10px] text-slate-455 italic">No notes added to this contact.</p>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="border-t border-slate-100 dark:border-slate-900 pt-4 space-y-4">
                  <DocumentAttachmentPanel module="CRM_CONTACTS" recordId={selectedContact.id} />
                  <RelatedRecordsPanel module="CRM_CONTACTS" recordId={selectedContact.id} />
                  <AuditHistoryPanel module="CRM_CONTACTS" recordId={selectedContact.id} />
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Real AI Intelligence Panel */}
        <div className="mt-4 mb-2">
          <ModuleAIPanel module="CRM" title="CRM AI Agent" />
        </div>

        {/* Collapsible Local CRM Agent Sidebar */}
        <ModuleAgentSidebar 
          agentName="CRM Pipeline Agent"
          permissionsScope="Authorized to read contacts directories, companies links, deal pipeline stages, and follow-up calendar metrics. Blocked from write actions on invoices."
          suggestedPrompts={[
            "enrich contact Priya Patel",
            "draft sales outreach email Ravi Shah",
            "score pipeline deals risk"
          ]}
          defaultMemoryLogs={[
            "CRM Agent initialized: pipeline scanning enabled.",
            "Scanned 4 contact records. Identified 1 customer, 1 qualified, and 2 raw leads.",
            "Calculated deals value: Rs 1,54,00,000 active."
          ]}
          mockResponseMapper={crmMockResponse}
        />

        {/* Modals and Wizards */}
        {showImportWizard && (
          <DataImportWizard 
            module="CRM_CONTACTS"
            onClose={() => setShowImportWizard(false)}
            onSuccess={refreshCrmData}
          />
        )}

        {showExportModal && (
          <DataExportModal 
            module="CRM_CONTACTS"
            filters={appliedFilters}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {showCustomFields && (
          <CustomFieldManager 
            module="CRM_CONTACTS"
            onClose={() => setShowCustomFields(false)}
          />
        )}

        {showFilterBuilder && (
          <div className="fixed inset-y-0 right-0 z-45 bg-[#0f172a] shadow-2xl transition-all border-l border-slate-850">
            <FilterBuilder 
              module="CRM_CONTACTS"
              onApply={(f) => {
                setAppliedFilters(f);
                setShowFilterBuilder(false);
              }}
              onClose={() => setShowFilterBuilder(false)}
            />
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
}

export default function CRMPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-bold">Loading CRM...</div>}>
      <CRMContent />
    </React.Suspense>
  );
}
