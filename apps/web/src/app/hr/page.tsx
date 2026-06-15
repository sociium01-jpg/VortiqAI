'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  UserCheck, Plus, Sparkles, Brain, Calendar, 
  Download, FileText, Check, X, ShieldAlert, Award,
  Clock, ShieldCheck, RefreshCw, ChevronRight, AlertCircle, Users
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';
import { vortiqClient } from '../utils/vortiqClient';
import dynamic from 'next/dynamic';
const ModuleAIPanel = dynamic(() => import('../components/ai/ModuleAIPanel'), { ssr: false });

interface Employee {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  doj: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  bankAccount: string;
  ifsc: string;
  pan: string;
  aadhaar: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  dates: string;
  days: number;
  balanceRemaining: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function HRPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  useEffect(() => {
    if (isLoaded && !isDemo) {
      setEmployees([]);
      setLeaveRequests([]);
      setCandidates([]);
      setAttendance([]);
      setAiAnalysis("HRAgent Audit: Workspace initialized. No employee records registered.");
    }
  }, [isLoaded, isDemo]);

  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll' | 'recruiting'>('directory');

  // Employee list
  const [employees, setEmployees] = useState<Employee[]>([
    { 
      id: 'EMP-001', 
      code: 'VRTQ-101', 
      name: 'Amit Sharma', 
      phone: '+91 98765 43210', 
      email: 'amit.sharma@vortiq.ai', 
      role: 'Sales Lead', 
      department: 'Sales & BD', 
      doj: '10 Jan 2025', 
      basicSalary: 30000, 
      hra: 10000, 
      allowances: 5000, 
      bankAccount: 'XXXX XXXX 1092', 
      ifsc: 'HDFC0001092', 
      pan: 'ABCDE1234F', 
      aadhaar: 'XXXX XXXX 9901', 
      status: 'ACTIVE' 
    },
    { 
      id: 'EMP-002', 
      code: 'VRTQ-102', 
      name: 'Priya Patel', 
      phone: '+91 95601 22334', 
      email: 'priya.patel@vortiq.ai', 
      role: 'Operations Executive', 
      department: 'Operations', 
      doj: '18 Feb 2025', 
      basicSalary: 22000, 
      hra: 8000, 
      allowances: 5000, 
      bankAccount: 'XXXX XXXX 4451', 
      ifsc: 'ICIC0000445', 
      pan: 'KLMNO5678P', 
      aadhaar: 'XXXX XXXX 1123', 
      status: 'ACTIVE' 
    },
    { 
      id: 'EMP-003', 
      code: 'VRTQ-103', 
      name: 'Rahul Sen', 
      phone: '+91 98110 44556', 
      email: 'rahul.sen@vortiq.ai', 
      role: 'Senior Developer', 
      department: 'Engineering', 
      doj: '01 Dec 2024', 
      basicSalary: 60000, 
      hra: 18000, 
      allowances: 7000, 
      bankAccount: 'XXXX XXXX 8891', 
      ifsc: 'SBIN0000112', 
      pan: 'XYZAB9012C', 
      aadhaar: 'XXXX XXXX 7762', 
      status: 'ACTIVE' 
    }
  ]);

  // Leave Requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { 
      id: 'LEV-501', 
      employeeId: 'EMP-002', 
      employeeName: 'Priya Patel', 
      reason: 'Personal medical checkup', 
      dates: '18 Jun - 19 Jun', 
      days: 2, 
      balanceRemaining: 14, 
      status: 'PENDING' 
    }
  ]);

  // Candidates Screened
  const [candidates, setCandidates] = useState([
    { name: 'Karan Malhotra', matchScore: 92, status: 'RECOMMENDED', exp: '4 yrs backend engineer, Node.js & PG', email: 'karan.m@gmail.com' },
    { name: 'Sneha Rao', matchScore: 78, status: 'SHORTLISTED', exp: '2 yrs frontend engineer, React & Tailwind', email: 'sneha.rao@yahoo.com' }
  ]);

  // Attendance Check-ins
  const [attendance, setAttendance] = useState([
    { id: 'EMP-001', name: 'Amit Sharma', checks: ['P', 'P', 'P', 'P', 'P', 'P', 'A', 'P', 'P', 'P'], geoFence: 'OK' },
    { id: 'EMP-002', name: 'Priya Patel', checks: ['P', 'P', 'L', 'L', 'P', 'P', 'P', 'P', 'P', 'P'], geoFence: 'OK' },
    { id: 'EMP-003', name: 'Rahul Sen', checks: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], geoFence: 'FLAGGED' }
  ]);

  // Form States - Add Employee
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Developer');
  const [newDept, setNewDept] = useState('Engineering');
  const [newBasic, setNewBasic] = useState(25000);
  const [newHra, setNewHra] = useState(10000);
  const [newAllowances, setNewAllowances] = useState(5000);
  const [newBank, setNewBank] = useState('');
  const [newIfsc, setNewIfsc] = useState('');
  const [newPan, setNewPan] = useState('');
  const [newAadhaar, setNewAadhaar] = useState('');

  // Payroll run wizard state
  const [payrollStep, setPayrollStep] = useState(1);
  const [payrollMonth, setPayrollMonth] = useState('June 2026');
  const [showPayrollWizard, setShowPayrollWizard] = useState(false);

  const [aiWorking, setAiWorking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('HRAgent Audit: Attendance anomaly flagged for Rahul Sen (check-in geo IP mismatch). 1 leave request pending review. Resume parsing complete: Karan Malhotra is a 92% match.');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newEmp: Employee = {
      id: `EMP-00${employees.length + 1}`,
      code: `VRTQ-${100 + employees.length + 1}`,
      name: newName,
      phone: newPhone || '+91 99999 88888',
      email: newEmail,
      role: newRole,
      department: newDept,
      doj: 'Today',
      basicSalary: newBasic,
      hra: newHra,
      allowances: newAllowances,
      bankAccount: newBank || 'XXXX XXXX 0000',
      ifsc: newIfsc || 'SBIN0000000',
      pan: newPan.toUpperCase() || 'ABCDE1234F',
      aadhaar: newAadhaar || 'XXXX XXXX 0000',
      status: 'ACTIVE'
    };

    setEmployees([...employees, newEmp]);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewBank('');
    setNewIfsc('');
    setNewPan('');
    setNewAadhaar('');
    setIsAdding(false);
  };

  const handleApproveLeave = (id: string, approve: boolean) => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, status: approve ? 'APPROVED' : 'REJECTED' };
      }
      return req;
    }));
  };

  const handleAIScreenResumes = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setCandidates([
        { name: 'Karan Malhotra', matchScore: 94, status: 'RECOMMENDED', exp: '4 yrs backend engineer - updated resume scan', email: 'karan.m@gmail.com' },
        ...candidates
      ]);
    }, 1200);
  };

  const executePayrollDisbursal = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setShowPayrollWizard(false);
      setPayrollStep(1);
      alert(`Payroll processed for ${payrollMonth}. Net payslips generated for ${employees.length} active personnel. Ledger entries prepared.`);
    }, 1500);
  };

  const hrMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('audit') || lower.includes('attendance') || lower.includes('geofence') || lower.includes('check')) {
      return {
        answer: "HR Agent: Audited check-ins logs. Rahul Sen geo check-in flagged: IP address originates from outside office coordinates (Bengaluru VPN vs Pune MIDC location). Check-in marked for review.",
        logs: "Parsed geofence logs for employee check-ins."
      };
    }
    if (lower.includes('payroll') || lower.includes('salary') || lower.includes('disburse')) {
      return {
        answer: "HR Agent: Run payroll audit. Basic salary total: Rs 1,12,000. HRA: Rs 36,000. Allowances: Rs 17,000. Grand payout total: Rs 1,65,000. Awaiting human approval to generate payslips.",
        logs: "Pre-audited June 2026 payroll run ledger."
      };
    }
    return {
      answer: "HR Agent: Active and monitoring employee database. Ask me to 'audit check-ins' or 'run payroll audit'.",
      logs: "Scanned active employee profiles list."
    };
  };

  return (
    <ConsoleLayout>
      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5.5 h-5.5 text-teal-600 text-teal-600 dark:text-teal-400" />
              Human Resources & Payroll Console
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Add corporate employee profiles, verify Aadhaar/PAN parameters, review geo-fence check-ins, and run monthly payroll disbursals.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setShowPayrollWizard(true);
                setIsAdding(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all"
            >
              Run Payroll
            </button>
            <button 
              onClick={() => {
                setIsAdding(true);
                setShowPayrollWizard(false);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        </div>

        {/* HR Agent AI Assistant */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  HRAgent Monitor
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">Automated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-355 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleAIScreenResumes}
            disabled={aiWorking}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Screen Candidates
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 overflow-x-auto">
          {[
            { id: 'directory', label: 'Employee Files', icon: Users },
            { id: 'attendance', label: 'Attendance & Geo-Fences', icon: Clock },
            { id: 'payroll', label: 'Leave Requests & Payouts', icon: Award },
            { id: 'recruiting', label: 'Applicant Pipeline', icon: UserCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  active 
                    ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Employee Registration Form */}
        {isAdding && (
          <form onSubmit={handleAddEmployee} className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl animate-fadeIn shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Register Corporate Employee</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Corporate Email</label>
                <input 
                  type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. rahul@vortiq.ai"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Phone</label>
                <input 
                  type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 99018 27364"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role Title</label>
                <input 
                  type="text" required value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Senior Software Architect"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                <select 
                  value={newDept} onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales & BD">Sales & BD</option>
                  <option value="Operations">Operations</option>
                  <option value="HR & Admin">HR & Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Basic Salary (monthly)</label>
                <input 
                  type="number" value={newBasic} onChange={(e) => setNewBasic(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">HRA Allowances</label>
                <input 
                  type="number" value={newHra} onChange={(e) => setNewHra(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Other Allowances</label>
                <input 
                  type="number" value={newAllowances} onChange={(e) => setNewAllowances(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank Account Number</label>
                <input 
                  type="text" placeholder="e.g. 5010029340183" value={newBank} onChange={(e) => setNewBank(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IFSC Code</label>
                <input 
                  type="text" placeholder="e.g. HDFC0000102" value={newIfsc} onChange={(e) => setNewIfsc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">PAN Card Number</label>
                <input 
                  type="text" placeholder="e.g. XYZAB9012C" value={newPan} onChange={(e) => setNewPan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Aadhaar Card Number</label>
                <input 
                  type="text" placeholder="e.g. 5560 9920 1832" value={newAadhaar} onChange={(e) => setNewAadhaar(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all">
                Save Employee Record
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Payroll Wizard Modal */}
        {showPayrollWizard && (
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl shadow-lg animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Run Corporate Payroll Wizard (Step {payrollStep} of 2)
              </h3>
              <button onClick={() => setShowPayrollWizard(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {payrollStep === 1 && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-slate-800 dark:text-slate-100">Calculate Payouts for {payrollMonth}:</p>
                  <p>Total Staff: <span className="font-semibold text-slate-800">{employees.length} Personnel</span></p>
                  <p>Sum Basic Wages: <span className="font-semibold text-slate-800">{formatINR(employees.reduce((sum, e) => sum + e.basicSalary, 0))}</span></p>
                  <p>Sum HRA + Allowances: <span className="font-semibold text-slate-800">{formatINR(employees.reduce((sum, e) => sum + e.hra + e.allowances, 0))}</span></p>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={() => setPayrollStep(2)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    Calculate Taxes & PF <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {payrollStep === 2 && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-slate-800 dark:text-slate-100">Taxes, PF & ESI Contributions (Calculated):</p>
                  <p>Provident Fund (12% basic): <span className="font-semibold text-slate-800">{formatINR(employees.reduce((sum, e) => sum + (e.basicSalary * 0.12), 0))}</span></p>
                  <p>ESI Contribution (0.75% gross): <span className="font-semibold text-slate-800">{formatINR(employees.reduce((sum, e) => sum + ((e.basicSalary + e.hra + e.allowances) * 0.0075), 0))}</span></p>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setPayrollStep(1)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Back</button>
                  <button 
                    onClick={executePayrollDisbursal}
                    className="px-4 py-2 bg-teal-600 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Execute Disbursal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Employee Directory */}
        {activeTab === 'directory' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Active Corporate Roster</h3>
              <span className="text-[10px] text-slate-500 font-semibold">{employees.length} active files</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Employee Code</th>
                    <th className="p-4">Personnel Details</th>
                    <th className="p-4">Department / Designation</th>
                    <th className="p-4">Aadhaar Card</th>
                    <th className="p-4">PAN Card</th>
                    <th className="p-4">Salary Structure</th>
                    <th className="p-4 text-right">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{e.code}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{e.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{e.email} • {e.phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold">{e.role}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{e.department}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">{e.aadhaar}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">{e.pan}</td>
                      <td className="p-4 font-extrabold text-slate-800 dark:text-slate-250">
                        {formatINR(e.basicSalary + e.hra + e.allowances)}/mo
                      </td>
                      <td className="p-4 text-right text-slate-400">{e.doj}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance check-ins */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Attendance Sheet (Last 10 Days)</h3>
              
              <div className="space-y-4">
                {attendance.map((att) => (
                  <div key={att.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{att.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">ID: {att.id}</p>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {att.checks.map((c, idx) => (
                        <span 
                          key={idx} 
                          className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold border text-[10px] shrink-0 ${
                            c === 'P' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                            c === 'L' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                            'bg-red-50 border-red-200 text-red-600'
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                        att.geoFence === 'FLAGGED' 
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950 animate-pulse' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950'
                      }`}>
                        {att.geoFence === 'FLAGGED' ? <AlertCircle className="w-3.5 h-3.5" /> : null}
                        GeoFence: {att.geoFence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Leaves & Payouts */}
        {activeTab === 'payroll' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Vacation / Leave Pipeline</h3>

              <div className="space-y-4 animate-fadeIn">
                {leaveRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{req.employeeName}</h4>
                        <p className="text-[10px] text-slate-500">Dates: {req.dates} ({req.days} days) • Balance remaining: {req.balanceRemaining} days</p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">{req.id}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 italic">"Reason: {req.reason}"</p>

                    {req.status === 'PENDING' ? (
                      <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button 
                          onClick={() => handleApproveLeave(req.id, true)}
                          className="flex-1 py-1.5 bg-teal-600 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold text-xs"
                        >
                          Approve Leave
                        </button>
                        <button 
                          onClick={() => handleApproveLeave(req.id, false)}
                          className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-550 hover:text-slate-700 rounded font-bold text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${
                        req.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' :
                        'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950'
                      }`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Salary Payslip Registry</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">June 2026 Payslips</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">3 records ready to disburse</p>
                    </div>
                    <button className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Recruiting Pipeline */}
        {activeTab === 'recruiting' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Resumes Sourced (HRAgent Auto Scored)</h3>
            
            <div className="space-y-3">
              {candidates.map(c => (
                <div key={c.name} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{c.name}</h4>
                    <p className="text-[10px] text-slate-500">{c.exp} • {c.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-100 dark:border-teal-950">
                      {c.matchScore}% match score
                    </span>
                    <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Real-time AI Assistant */}
      <div className="w-full mt-4">
        <ModuleAIPanel module="HR" title="HR & Payroll Intelligence" />
      </div>

      <ModuleAgentSidebar 
        agentName="HR & Payroll Agent"
        permissionsScope="Permissions Scope: Read employee directories, view candidate CV scores, calculate monthly payroll allowance weights. Denied direct bank disbursements release (Superboss credentials required)."
        suggestedPrompts={[
          "audit employee check-ins geo",
          "run payroll audit for June 2026",
          "list candidates matched above 85"
        ]}
        defaultMemoryLogs={[
          "HR Agent online.",
          "Scanned 3 active employee records. 1 geofence IP check flag detected.",
          "Pre-audited June 2026 payroll total: Rs 1,65,00,000 ready to sync."
        ]}
        mockResponseMapper={hrMockResponse}
      />

      </div>
    </ConsoleLayout>
  );
}
