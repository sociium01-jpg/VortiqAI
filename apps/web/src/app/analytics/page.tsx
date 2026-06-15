'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  BarChart3, Brain, FileText, Calendar, Search, ArrowRight, TrendingUp,
  RefreshCw, CheckCircle2, ChevronRight, Play, Database, AlertCircle,
  FileSpreadsheet, Download
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount).replace('INR', 'Rs');
};

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  useEffect(() => {
    if (isLoaded && !isDemo) {
      setQueryResult(null);
      setAiAnalysis("AnalyticsAgent: Pipeline reporting ready. Connect data connectors to compile business analytics dashboards.");
    }
  }, [isLoaded, isDemo]);

  const [nlQuery, setNlQuery] = useState('Show all B2B contacts with lead score greater than 80 in Pune');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [activeChart, setActiveChart] = useState<'revenue' | 'funnel' | 'cac'>('revenue');
  const [aiWorking, setAiWorking] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState('AnalyticsAgent: Compiled text-to-SQL prompt. Forecast model predicts 84% probability of meeting June sales target. CAC has dropped by 12% due to Google Ads optimization.');

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      
      let compiledSql = '';
      let mockRows = [];

      if (nlQuery.toLowerCase().includes('lead') || nlQuery.toLowerCase().includes('contacts')) {
        compiledSql = `SELECT id, first_name, last_name, email, lead_score, city \nFROM Contact \nWHERE lead_score > 80 AND city = 'Pune'\nORDER BY lead_score DESC;`;
        mockRows = [
          { id: 'CON-092', first_name: 'Rajesh', last_name: 'Kulkarni', email: 'rajesh.k@indoautotech.in', lead_score: 96, city: 'Pune' },
          { id: 'CON-104', first_name: 'Meera', last_name: 'Deshmukh', email: 'meera.d@varroc.com', lead_score: 85, city: 'Pune' }
        ];
      } else if (nlQuery.toLowerCase().includes('revenue') || nlQuery.toLowerCase().includes('sales')) {
        compiledSql = `SELECT SUM(grand_total) as monthly_revenue, invoice_date \nFROM Invoice \nWHERE payment_status = 'PAID'\nGROUP BY invoice_date;`;
        mockRows = [
          { monthly_revenue: 1200000, invoice_date: 'June 2026' },
          { monthly_revenue: 650000, invoice_date: 'May 2026' }
        ];
      } else {
        compiledSql = `SELECT name, category, quantity \nFROM SKU \nWHERE quantity <= reorder_point;`;
        mockRows = [
          { name: 'Raw Sheet Metal V4', category: 'Metals', quantity: 2 }
        ];
      }

      setSqlQuery(compiledSql);
      setQueryResult({
        rows: mockRows,
        executionTimeMs: 14,
        rowCount: mockRows.length
      });
    }, 1000);
  };

  const handleTriggerForecast = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAiAnalysis('AnalyticsAgent: Forecast recalculated. High-score deal closures (Tata Motors) boosted June success probability from 73% to 84%.');
    }, 1200);
  };

  const analyticsMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('forecast') || lower.includes('predict') || lower.includes('target')) {
      return {
        answer: "Analytics Agent: June sales targets forecast predicts 84% probability of achievement (Target: Rs 15,00,000; Expected: Rs 12,65,000). Closing Tata Motors deal adds 11% to confidence matrix.",
        logs: "Re-calculated propensity scores & forecast models."
      };
    }
    if (lower.includes('sql') || lower.includes('query') || lower.includes('compile')) {
      return {
        answer: "Analytics Agent: Compiled Natural Language query to SQL. Schema referenced: Contact. Query: SELECT id, email, lead_score FROM Contact WHERE lead_score > 80 AND city = 'Pune'.",
        logs: "Executed text-to-SQL compile sequence."
      };
    }
    return {
      answer: "Analytics Agent: Active and tracking BI telemetry. Ask me to 'recalculate target forecast' or 'compile SQL query B2B leads'.",
      logs: "Scanned database schema configurations."
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
              <BarChart3 className="w-5.5 h-5.5 text-teal-600 text-teal-600 dark:text-teal-400" />
              Autonomous Business Intelligence (BI)
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Ask natural language queries to compile SQL queries, inspect monthly target forecasts, and review propensity scores.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleTriggerForecast}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Recalculate Forecasts
            </button>
          </div>
        </div>

        {/* Analytics Agent Panel */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  AnalyticsAgent NLP Compiler
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">Automated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
        </div>

        {/* Natural Language to SQL Console */}
        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-4 h-4 text-teal-600" /> NLP-to-SQL Database Console
          </h3>

          <form onSubmit={handleQuerySubmit} className="flex gap-2">
            <input 
              type="text" 
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. Show all contacts in Pune with lead score > 80"
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
            <button type="submit" className="px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
              Compile & Run <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </form>

          {/* Compiled Output Section */}
          {sqlQuery && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn pt-2">
              <div className="lg:col-span-5 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Compiled SQL Syntax</span>
                <pre className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-slate-900 overflow-x-auto whitespace-pre-wrap">
                  {sqlQuery}
                </pre>
              </div>

              <div className="lg:col-span-7 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Executed Results ({queryResult?.rowCount} rows in {queryResult?.executionTimeMs}ms)</span>
                  <button className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-0.5">
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 font-bold text-slate-500">
                        {queryResult && Object.keys(queryResult.rows[0] || {}).map(key => (
                          <th key={key} className="p-3 uppercase">{key.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium">
                      {queryResult && queryResult.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300">
                          {Object.values(row).map((val: any, colIdx) => (
                            <td key={colIdx} className="p-3">{val.toString()}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts and Propensity Forecasting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart Display Widget */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Interactive BI Charts</h3>
              
              <div className="flex gap-1.5">
                {[
                  { id: 'revenue', label: 'Revenue Forecast' },
                  { id: 'funnel', label: 'Conversion Funnel' },
                  { id: 'cac', label: 'CAC Split' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveChart(opt.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      activeChart === opt.id 
                        ? 'bg-teal-50 border-teal-200 text-teal-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom SVG/HTML Chart Replica */}
            <div className="h-44 flex items-end justify-between pt-6 px-4 border-b border-l border-slate-200 dark:border-slate-800">
              {activeChart === 'revenue' && (
                <>
                  <div className="w-1/4 bg-teal-500/20 dark:bg-teal-500/10 border-t-2 border-teal-500 flex flex-col justify-end items-center" style={{ height: '35%' }}>
                    <span className="text-[9px] text-slate-500 mb-1">Apr (Rs 6.5L)</span>
                  </div>
                  <div className="w-1/4 bg-teal-500/20 dark:bg-teal-500/10 border-t-2 border-teal-500 flex flex-col justify-end items-center" style={{ height: '55%' }}>
                    <span className="text-[9px] text-slate-500 mb-1">May (Rs 12.0L)</span>
                  </div>
                  <div className="w-1/4 bg-teal-500/30 dark:bg-teal-500/15 border-t-2 border-teal-605 flex flex-col justify-end items-center" style={{ height: '80%' }}>
                    <span className="text-[9px] font-bold text-teal-600 mb-1">June (Rs 18.5L)</span>
                  </div>
                </>
              )}

              {activeChart === 'funnel' && (
                <>
                  <div className="w-1/4 bg-indigo-500/20 dark:bg-indigo-500/10 border-t-2 border-indigo-500 flex flex-col justify-end items-center" style={{ height: '90%' }}>
                    <span className="text-[9px] text-slate-500 mb-1">Leads (1,420)</span>
                  </div>
                  <div className="w-1/4 bg-indigo-500/20 dark:bg-indigo-500/10 border-t-2 border-indigo-500 flex flex-col justify-end items-center" style={{ height: '40%' }}>
                    <span className="text-[9px] text-slate-500 mb-1">Qualified (580)</span>
                  </div>
                  <div className="w-1/4 bg-indigo-500/30 dark:bg-indigo-500/15 border-t-2 border-indigo-605 flex flex-col justify-end items-center" style={{ height: '15%' }}>
                    <span className="text-[9px] font-bold text-indigo-600 mb-1">Deals (88)</span>
                  </div>
                </>
              )}

              {activeChart === 'cac' && (
                <>
                  <div className="w-1/4 bg-amber-500/20 dark:bg-amber-500/10 border-t-2 border-amber-500 flex flex-col justify-end items-center" style={{ height: '35%' }}>
                    <span className="text-[9px] text-slate-500 mb-1">Google (Rs 180)</span>
                  </div>
                  <div className="w-1/4 bg-amber-500/20 dark:bg-amber-500/10 border-t-2 border-amber-500 flex flex-col justify-end items-center" style={{ height: '50%' }}>
                    <span className="text-[9px] text-slate-500 mb-1">Meta (Rs 240)</span>
                  </div>
                  <div className="w-1/4 bg-amber-500/30 dark:bg-amber-500/15 border-t-2 border-amber-605 flex flex-col justify-end items-center" style={{ height: '75%' }}>
                    <span className="text-[9px] font-bold text-amber-600 mb-1">LinkedIn (Rs 310)</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Propensity Forecast Detail Widget */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-teal-600" /> Propensity Forecasting Model
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Month Target Target:</span>
                <span className="text-slate-800">Rs 20,000,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Achieved MTD:</span>
                <span className="text-emerald-600">Rs 18,50,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>AI Predicted Total:</span>
                <span className="text-teal-600 font-extrabold">Rs 22,10,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>June Target Target success probability:</span>
                <span className="text-amber-600 font-extrabold">84% Success odds</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] leading-relaxed italic text-slate-500">
              "Note: Success likelihood increased from 73% following Tata Motors invoice draft approval."
            </div>
          </div>

        </div>

        {/* Reports Download list */}
        <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
            <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-600" /> Compiled Business Reports
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'June GSTR-1 Ledger.json', desc: 'Offline GST report payload', size: '42 KB' },
              { name: 'Q3 Outbound Call Script Analytics.pdf', desc: 'Transcripts & keywords metrics', size: '1.4 MB' },
              { name: 'June Staff Attendance Scorecard.xlsx', desc: 'Clock-in geo audit sheet', size: '620 KB' }
            ].map((doc, idx) => (
              <div key={idx} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs font-semibold">
                <div>
                  <p className="text-slate-800 dark:text-slate-200">{doc.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{doc.desc}</p>
                </div>
                <button className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 rounded flex items-center gap-1 font-bold text-[10px]">
                  <Download className="w-3.5 h-3.5" /> {doc.size}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <ModuleAgentSidebar 
        agentName="Analytics & BI Agent"
        permissionsScope="Permissions Scope: Read database schema definitions, execute analytical read queries, compile text-to-SQL commands. Denied write access to transaction ledgers."
        suggestedPrompts={[
          "recalculate target forecast June",
          "compile SQL query B2B leads",
          "list compiled business reports"
        ]}
        defaultMemoryLogs={[
          "Analytics Agent online.",
          "Indexed 43 database tables schemas successfully.",
          "Target probability matrix set to 84% confidence intervals."
        ]}
        mockResponseMapper={analyticsMockResponse}
      />

      </div>
    </ConsoleLayout>
  );
}
