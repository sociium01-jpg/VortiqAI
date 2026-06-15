'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  Package, Plus, Sparkles, Brain, AlertTriangle, 
  Trash2, Eye, Truck, Check, RefreshCw, FileText, ArrowRight,
  TrendingDown, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import ModuleAgentSidebar from '../utils/ModuleAgentSidebar';
import { vortiqClient } from '../utils/vortiqClient';
import dynamic from 'next/dynamic';
const ModuleAIPanel = dynamic(() => import('../components/ai/ModuleAIPanel'), { ssr: false });

interface SKU {
  code: string;
  name: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  unit: string;
  location: string;
  costPrice: number;
  sellingPrice: number;
  gstRate: number; // e.g. 18 for 18%
  hsnCode: string;
  vendor: string;
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  skuCode: string;
  quantity: number;
  totalCost: number;
  status: 'DRAFT' | 'SENT_TO_VENDOR' | 'RECEIVED';
  createdAt: string;
}

interface Dispatch {
  id: string;
  customer: string;
  skuCode: string;
  quantity: number;
  partner: 'Shiprocket' | 'Delhivery';
  trackingNo: string;
  status: 'PICKING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED';
  address: string;
}

export default function InventoryPage() {
  const { user, isLoaded } = useUser();
  const isDemo = isLoaded && user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'demo@vortiq.ai';

  useEffect(() => {
    if (isLoaded && !isDemo) {
      setSkus([]);
      setPurchaseOrders([]);
      setDispatches([]);
      setHistory([]);
      setAiAnalysis("Stock Analysis: Inventory ledger is empty. Register SKU parts to run automated replenishment scans.");
    }
  }, [isLoaded, isDemo]);

  const [activeTab, setActiveTab] = useState<'catalog' | 'inwards' | 'orders' | 'shipping'>('catalog');

  // SKUs List
  const [skus, setSkus] = useState<SKU[]>([
    { code: 'RAW-STEEL-V4', name: 'Raw Sheet Metal V4', category: 'Metals', quantity: 2, reorderPoint: 10, unit: 'Tons', location: 'Warehouse A', costPrice: 45000, sellingPrice: 58000, gstRate: 18, hsnCode: '7208.51', vendor: 'Jindal Steel' },
    { code: 'ALUM-ROD-G2', name: 'Aluminium Extrusion Rod G2', category: 'Metals', quantity: 45, reorderPoint: 15, unit: 'Units', location: 'Warehouse A', costPrice: 1200, sellingPrice: 1800, gstRate: 18, hsnCode: '7604.21', vendor: 'Hindalco Industries' },
    { code: 'COP-WIRE-C1', name: 'Copper Wire Coils C1', category: 'Electrical', quantity: 8, reorderPoint: 10, unit: 'Coils', location: 'Warehouse B', costPrice: 8500, sellingPrice: 11200, gstRate: 12, hsnCode: '7408.11', vendor: 'Finolex Cables' },
    { code: 'STEEL-FAST-M8', name: 'M8 Heavy Fasteners Pack', category: 'Hardware', quantity: 230, reorderPoint: 50, unit: 'Packs', location: 'Warehouse A', costPrice: 450, sellingPrice: 650, gstRate: 18, hsnCode: '7318.15', vendor: 'LPS Bossard' }
  ]);

  // Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    { id: 'PO-2026-001', vendor: 'Jindal Steel', skuCode: 'RAW-STEEL-V4', quantity: 15, totalCost: 675000, status: 'SENT_TO_VENDOR', createdAt: '12 Jun 2026' },
    { id: 'PO-2026-002', vendor: 'Finolex Cables', skuCode: 'COP-WIRE-C1', quantity: 10, totalCost: 85000, status: 'DRAFT', createdAt: 'Today' }
  ]);

  // Courier Dispatches
  const [dispatches, setDispatches] = useState<Dispatch[]>([
    { id: 'DSP-901', customer: 'Tata Motors Assembly', skuCode: 'RAW-STEEL-V4', quantity: 4, partner: 'Shiprocket', trackingNo: 'SR992019401', status: 'IN_TRANSIT', address: 'Pimpri, Pune, MH - 411018' },
    { id: 'DSP-902', customer: 'Bharat Forge CNC', skuCode: 'ALUM-ROD-G2', quantity: 15, partner: 'Delhivery', trackingNo: 'DELH77301948', status: 'DELIVERED', address: 'Chakan, Pune, MH - 410501' },
    { id: 'DSP-903', customer: 'Minda Electricals', skuCode: 'COP-WIRE-C1', quantity: 5, partner: 'Shiprocket', trackingNo: 'SR119028445', status: 'PICKING', address: 'Oragadam, Chennai, TN - 602105' }
  ]);

  // Inward/Outward transaction history
  const [history, setHistory] = useState([
    { id: 'TXN-001', skuCode: 'RAW-STEEL-V4', quantity: 10, type: 'INWARD', reason: 'PO Fulfillment', user: 'Admin Manoj', date: '12 Jun 2026' },
    { id: 'TXN-002', skuCode: 'ALUM-ROD-G2', quantity: -5, type: 'OUTWARD', reason: 'Sales Order Dispatch', user: 'Rep Shruti', date: 'Yesterday' }
  ]);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Metals');
  const [newQty, setNewQty] = useState(10);
  const [newReorder, setNewReorder] = useState(5);
  const [newCost, setNewCost] = useState(100);
  const [newSell, setNewSell] = useState(150);
  const [newGst, setNewGst] = useState(18);
  const [newHsn, setNewHsn] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newLocation, setNewLocation] = useState('Warehouse A');

  // Inward Form State
  const [isInwarding, setIsInwarding] = useState(false);
  const [inwardSKU, setInwardSKU] = useState('RAW-STEEL-V4');
  const [inwardQty, setInwardQty] = useState(10);
  const [inwardReason, setInwardReason] = useState('Purchase');

  const [aiWorking, setAiWorking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('Stock Analysis: RAW-STEEL-V4 is below reorder point (2 left, threshold 10). Depletion predicted in 4 days. Auto-drafted PO-2026-002 with Finolex and preparedTata Motors delivery route parameters.');

  const handleAddSKU = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    const newS: SKU = {
      code: newCode.toUpperCase(),
      name: newName,
      category: newCategory,
      quantity: newQty,
      reorderPoint: newReorder,
      unit: 'Units',
      location: newLocation,
      costPrice: newCost,
      sellingPrice: newSell,
      gstRate: newGst,
      hsnCode: newHsn || '8481.80',
      vendor: newVendor || 'General Supplier'
    };
    setSkus([...skus, newS]);
    resetForm();
  };

  const resetForm = () => {
    setNewCode('');
    setNewName('');
    setNewQty(10);
    setNewReorder(5);
    setNewCost(100);
    setNewSell(150);
    setNewHsn('');
    setNewVendor('');
    setIsAdding(false);
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSkus(prev => prev.map(s => s.code === inwardSKU ? { ...s, quantity: s.quantity + inwardQty } : s));
    const newTxn = {
      id: `TXN-00${history.length + 1}`,
      skuCode: inwardSKU,
      quantity: inwardQty,
      type: 'INWARD',
      reason: inwardReason,
      user: 'Super Admin',
      date: 'Today'
    };
    setHistory([newTxn, ...history]);
    setIsInwarding(false);
  };

  const handleOutward = (skuCode: string, qty: number) => {
    setSkus(prev => prev.map(s => s.code === skuCode ? { ...s, quantity: Math.max(0, s.quantity - qty) } : s));
    const newTxn = {
      id: `TXN-00${history.length + 1}`,
      skuCode: skuCode,
      quantity: -qty,
      type: 'OUTWARD',
      reason: 'Audit Adjustment',
      user: 'Super Admin',
      date: 'Today'
    };
    setHistory([newTxn, ...history]);
  };

  const handleTriggerReorderScan = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAiAnalysis('Updated Stock Forecast: Created new draft purchase order for RAW-STEEL-V4 (10 Tons) to Jindal Steel. Current supply schedules are fully audited.');
    }, 1200);
  };

  const createDraftPO = (skuCode: string, vendor: string) => {
    const sku = skus.find(s => s.code === skuCode);
    if (!sku) return;
    const newPO: PurchaseOrder = {
      id: `PO-2026-00${purchaseOrders.length + 1}`,
      vendor: vendor,
      skuCode: skuCode,
      quantity: sku.reorderPoint * 2,
      totalCost: (sku.reorderPoint * 2) * sku.costPrice,
      status: 'DRAFT',
      createdAt: 'Today'
    };
    setPurchaseOrders([...purchaseOrders, newPO]);
  };

  const approvePO = (id: string) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status: 'SENT_TO_VENDOR' } : po));
  };

  const inventoryMockResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('po') || lower.includes('draft') || lower.includes('purchase')) {
      return {
        answer: "Inventory Agent: Draft PO generated for vendor Jindal Steel. Code: RAW-STEEL-V4. Quantity: 20 Tons. Estimated Cost: Rs 9,00,000. Under safety override lock (waiting for Finance approval).",
        logs: "Compiled draft purchase order PO-2026-003."
      };
    }
    if (lower.includes('stock') || lower.includes('forecast') || lower.includes('alert')) {
      return {
        answer: "Inventory Agent: Low Stock Alert: RAW-STEEL-V4 has 2 units remaining (Threshold 10). Lead time: 7 days. Action: n8n webhook triggered to notify supplier automatically.",
        logs: "Ran inventory depletion forecasting algorithms."
      };
    }
    return {
      answer: "Inventory Agent: Running and scanning stock levels. You can ask me to 'draft purchase order' or 'forecast stock depletion'.",
      logs: "Scanned catalog items list."
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
              <Package className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400" />
              SKUs & Warehouse Operations
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Audit stock catalogs, process inward ledger adjusts, track courier deliveries, and manage vendor purchases.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsInwarding(true);
                setIsAdding(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all"
            >
              Inward Stock
            </button>
            <button 
              onClick={() => {
                setIsAdding(true);
                setIsInwarding(false);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add SKU
            </button>
          </div>
        </div>

        {/* OpsAgent AI Assistant */}
        <div className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 dark:border-teal-400/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">OpsAgent AI Auditor</h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 font-black rounded-full">Automated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
                "{aiAnalysis}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleTriggerReorderScan}
            disabled={aiWorking}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiWorking ? 'animate-spin' : ''}`} /> Scan Reorders
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-900 gap-6 overflow-x-auto">
          {[
            { id: 'catalog', label: 'SKU Catalog & Alerts', icon: Package },
            { id: 'inwards', label: 'Inwards / Adjustments Log', icon: Layers },
            { id: 'orders', label: 'Purchase Orders (PO)', icon: FileText },
            { id: 'shipping', label: 'Shiprocket & Fulfillment', icon: Truck }
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

        {/* SKU Add Form */}
        {isAdding && (
          <form onSubmit={handleAddSKU} className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl animate-fadeIn shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Register New SKU</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SKU Code</label>
                <input 
                  type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. RAW-STEEL-V4"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 uppercase focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Item Name</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Raw Sheet Metal"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select 
                  value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Metals">Metals</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Stock Quantity</label>
                <input 
                  type="number" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reorder Threshold</label>
                <input 
                  type="number" value={newReorder} onChange={(e) => setNewReorder(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cost Price (INR)</label>
                <input 
                  type="number" value={newCost} onChange={(e) => setNewCost(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Selling Price (INR)</label>
                <input 
                  type="number" value={newSell} onChange={(e) => setNewSell(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GST Rate (%)</label>
                <select 
                  value={newGst} onChange={(e) => setNewGst(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                >
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">HSN Code</label>
                <input 
                  type="text" value={newHsn} onChange={(e) => setNewHsn(e.target.value)}
                  placeholder="e.g. 7208.51"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preferred Vendor</label>
                <input 
                  type="text" value={newVendor} onChange={(e) => setNewVendor(e.target.value)}
                  placeholder="e.g. Jindal Steel"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Warehouse Location</label>
                <input 
                  type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all">
                Save SKU
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Inwards Form */}
        {isInwarding && (
          <form onSubmit={handleInwardSubmit} className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-md animate-fadeIn shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Stock Inward Adjustment</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select SKU</label>
                <select 
                  value={inwardSKU} onChange={(e) => setInwardSKU(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs"
                >
                  {skus.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantity to Inward</label>
                <input 
                  type="number" required value={inwardQty} onChange={(e) => setInwardQty(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason / Reference</label>
                <input 
                  type="text" required value={inwardReason} onChange={(e) => setInwardReason(e.target.value)}
                  placeholder="e.g. Audit Corrective or Supplier Delivery"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all">
                Submit Inward
              </button>
              <button type="button" onClick={() => setIsInwarding(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tab 1: Catalog & Stock Alerts */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Active Stock Ledger</h3>
                <span className="text-[10px] text-slate-500 font-semibold">{skus.length} SKUs total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">SKU Code</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Qty on Hand</th>
                      <th className="p-4">Alert Level</th>
                      <th className="p-4">HSN Code</th>
                      <th className="p-4">GST Rate</th>
                      <th className="p-4">Cost Price</th>
                      <th className="p-4">Selling Price</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                    {skus.map((s) => {
                      const isLow = s.quantity <= s.reorderPoint;
                      return (
                        <tr key={s.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300 font-medium">
                          <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{s.code}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-semibold">{s.name}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{s.location} • Vendor: {s.vendor}</p>
                            </div>
                          </td>
                          <td className="p-4">{s.category}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-slate-200">{s.quantity} {s.unit}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 w-fit ${
                              isLow 
                                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950 animate-pulse' 
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950'
                            }`}>
                              {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                              {isLow ? `Low (Threshold ${s.reorderPoint})` : 'Good'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-500">{s.hsnCode}</td>
                          <td className="p-4">{s.gstRate}%</td>
                          <td className="p-4 font-semibold text-slate-500">{formatINR(s.costPrice)}</td>
                          <td className="p-4 font-extrabold text-slate-800 dark:text-slate-250">{formatINR(s.sellingPrice)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {isLow && (
                                <button 
                                  onClick={() => createDraftPO(s.code, s.vendor)}
                                  className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-black hover:bg-amber-600"
                                >
                                  Draft PO
                                </button>
                              )}
                              <button 
                                onClick={() => handleOutward(s.code, 1)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded text-[10px]"
                              >
                                Deduct 1
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inwards / Adjustments Log */}
        {activeTab === 'inwards' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Adjustment History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">SKU Code</th>
                    <th className="p-4">Adjust Type</th>
                    <th className="p-4">Quantity Shift</th>
                    <th className="p-4">Reason Reference</th>
                    <th className="p-4">Triggered By</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{h.id}</td>
                      <td className="p-4 font-semibold">{h.skuCode}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 w-fit ${
                          h.type === 'INWARD'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950'
                        }`}>
                          {h.type === 'INWARD' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {h.type}
                        </span>
                      </td>
                      <td className={`p-4 font-extrabold ${h.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                      </td>
                      <td className="p-4 text-slate-550 font-medium">{h.reason}</td>
                      <td className="p-4 font-semibold">{h.user}</td>
                      <td className="p-4 text-slate-400">{h.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Purchase Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Active Purchase Orders (POs)</h3>
              <span className="text-[10px] text-slate-500 font-semibold">{purchaseOrders.length} active orders</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">PO ID</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">SKU Sourced</th>
                    <th className="p-4">Order Qty</th>
                    <th className="p-4">Est Cost</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{po.id}</td>
                      <td className="p-4 font-semibold">{po.vendor}</td>
                      <td className="p-4 font-bold">{po.skuCode}</td>
                      <td className="p-4">{po.quantity} units</td>
                      <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">{formatINR(po.totalCost)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          po.status === 'SENT_TO_VENDOR' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' :
                          'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950'
                        }`}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {po.status === 'DRAFT' && (
                          <button 
                            onClick={() => approvePO(po.id)}
                            className="px-3 py-1 bg-teal-600 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-black transition-colors"
                          >
                            Approve PO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Shiprocket & Shipping Fulfillment */}
        {activeTab === 'shipping' && (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Shiprocket & Delhivery Delivery Logs</h3>
              <span className="text-[10px] text-slate-500 font-semibold">{dispatches.length} active dispatches</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Dispatch ID</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">SKU & Qty</th>
                    <th className="p-4">Fulfillment Partner</th>
                    <th className="p-4">Tracking Number</th>
                    <th className="p-4">Fulfillment Status</th>
                    <th className="p-4">Delivery Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {dispatches.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">{d.id}</td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{d.customer}</td>
                      <td className="p-4 font-bold">{d.skuCode} ({d.quantity})</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black border border-indigo-100 dark:border-indigo-950">
                          {d.partner}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{d.trackingNo}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          d.status === 'DELIVERED' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950' :
                          d.status === 'IN_TRANSIT' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-950' :
                          'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={d.address}>{d.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Real-time AI Assistant */}
      <div className="w-full mt-4">
        <ModuleAIPanel module="INVENTORY" title="Inventory & Stock Intelligence" />
      </div>

      <ModuleAgentSidebar 
        agentName="Inventory & SKUs Agent"
        permissionsScope="Permissions Scope: Read SKU lists, write inventory transactions history, prepare purchase orders drafts. Gated from approving payouts to vendor."
        suggestedPrompts={[
          "draft purchase order for Jindal Steel",
          "forecast stock depletion rates",
          "list low stock SKU catalog"
        ]}
        defaultMemoryLogs={[
          "Inventory Agent online.",
          "Scanned 4 catalog items. 1 low stock warning detected (RAW-STEEL-V4).",
          "Awaiting manual confirmation to release PO draft."
        ]}
        mockResponseMapper={inventoryMockResponse}
      />

      </div>
    </ConsoleLayout>
  );
}
