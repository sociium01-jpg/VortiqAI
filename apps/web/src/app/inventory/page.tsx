'use client';

import { useUser } from '@clerk/nextjs';

import React, { useState, useEffect } from 'react';
import ConsoleLayout, { formatINR } from '../ConsoleLayout';
import { 
  Package, Plus, Sparkles, Brain, AlertTriangle, 
  Trash2, Eye, Truck, Check, RefreshCw, FileText, ArrowRight,
  TrendingDown, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers,
  Filter, Settings, X
} from 'lucide-react';
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

interface SKU {
  id?: string;
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
  brand?: string;
  thickness?: string;
  size?: string;
  finish?: string;
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

  // Universal Data Import, Export, Search, Filter states
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);



  const refreshInventoryData = () => {
    if (isLoaded && !isDemo) {
      vortiqClient.callQuery('inventory.skusList').then((res: any) => {
        if (res && res.length > 0) {
          setSkus(res.map((s: any) => ({
            id: s.id,
            code: s.skuCode,
            name: s.name,
            category: s.product?.category || 'Gurjan Plywood',
            quantity: s.stockEntries?.reduce((acc: number, entry: any) => acc + entry.quantity, 0) || 0,
            reorderPoint: s.reorderPoint || 10,
            unit: s.product?.unitOfMeasure || 'PCS',
            location: 'Warehouse A',
            costPrice: s.costPrice || 0,
            sellingPrice: s.sellingPrice || 0,
            gstRate: s.product?.gstRate || 18,
            hsnCode: s.product?.hsnCode || '4412.31',
            vendor: s.product?.brand || 'Spelux',
            brand: s.product?.brand || 'Spelux',
            thickness: s.attributes?.thickness || '19mm',
            size: s.attributes?.size || '8x4',
            finish: s.attributes?.finish || 'Glossy'
          })));
        } else {
          setSkus([]);
        }
      }).catch(e => {
        console.error('Error fetching inventory SKUs:', e);
        setSkus([]);
      });
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (!isDemo) {
        setSkus([]);
        setPurchaseOrders([]);
        setDispatches([]);
        setHistory([]);
        refreshInventoryData();
      }
    }
  }, [isLoaded, isDemo]);

  useEffect(() => {
    if (isDemo) return;
    const handleDataChange = () => {
      refreshInventoryData();
    };
    window.addEventListener('vortiq-data-change', handleDataChange);
    return () => {
      window.removeEventListener('vortiq-data-change', handleDataChange);
    };
  }, [isDemo, isLoaded]);

  const [activeTab, setActiveTab] = useState<'catalog' | 'inwards' | 'orders' | 'shipping'>('catalog');

  // SKUs List
  const [skus, setSkus] = useState<SKU[]>([
    { id: '20c785de-d8d4-4a6f-9721-36b0df44db31', code: 'PLY-GUR-19-8X4-G', name: 'Gurjan Premium Plywood', category: 'Gurjan Plywood', quantity: 2, reorderPoint: 10, unit: 'PCS', location: 'Warehouse A', costPrice: 2800, sellingPrice: 3800, gstRate: 18, hsnCode: '4412.31', vendor: 'Greenply Industries', brand: 'Greenply', thickness: '19mm', size: '8x4', finish: 'Glossy' },
    { id: '40f1a0fb-d4ad-4d10-a92c-6331fa2e0fe6', code: 'PLY-ALT-12-8X4-M', name: 'Alternate Commercial Board', category: 'Alternate Plywood', quantity: 45, reorderPoint: 15, unit: 'PCS', location: 'Warehouse A', costPrice: 1200, sellingPrice: 1800, gstRate: 18, hsnCode: '4412.31', vendor: 'CenturyPly', brand: 'CenturyPly', thickness: '12mm', size: '8x4', finish: 'Matte' },
    { id: 'b567d1db-0433-4fde-b565-d05e55e09f5f', code: 'PLY-HW-16-7X4-S', name: 'Hardwood Suede Laminate', category: 'Hardwood Plywood', quantity: 8, reorderPoint: 10, unit: 'PCS', location: 'Warehouse B', costPrice: 1900, sellingPrice: 2500, gstRate: 18, hsnCode: '4412.31', vendor: 'Greenply Industries', brand: 'Greenply', thickness: '16mm', size: '7x4', finish: 'Suede' },
    { id: '96b8296a-0f8b-4cde-bb7b-891df99b24ff', code: 'PLY-COM-09-8X4-T', name: 'Commercial Textured Sheet', category: 'Commercial Plywood', quantity: 230, reorderPoint: 50, unit: 'PCS', location: 'Warehouse A', costPrice: 650, sellingPrice: 950, gstRate: 18, hsnCode: '4412.31', vendor: 'Local Supplier', brand: 'Spelux', thickness: '9mm', size: '8x4', finish: 'Textured' }
  ]);

  const filteredSkus = skus.filter(s => {
    let matchesAdvanced = true;
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      matchesAdvanced = matchesAdvanced && (
        s.code.toLowerCase().includes(q) || 
        s.name.toLowerCase().includes(q) || 
        s.category.toLowerCase().includes(q)
      );
    }
    return matchesAdvanced;
  });

  // Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    { id: 'PO-2026-001', vendor: 'Greenply Industries', skuCode: 'PLY-GUR-19-8X4-G', quantity: 15, totalCost: 42000, status: 'SENT_TO_VENDOR', createdAt: '12 Jun 2026' },
    { id: 'PO-2026-002', vendor: 'CenturyPly', skuCode: 'PLY-ALT-12-8X4-M', quantity: 10, totalCost: 12000, status: 'DRAFT', createdAt: 'Today' }
  ]);

  // Courier Dispatches
  const [dispatches, setDispatches] = useState<Dispatch[]>([
    { id: 'DSP-901', customer: 'National Furniture Mart', skuCode: 'PLY-GUR-19-8X4-G', quantity: 4, partner: 'Shiprocket', trackingNo: 'SR992019401', status: 'IN_TRANSIT', address: 'Pimpri, Pune, MH - 411018' },
    { id: 'DSP-902', customer: 'Apex Builders Hyderabad', skuCode: 'PLY-ALT-12-8X4-M', quantity: 15, partner: 'Delhivery', trackingNo: 'DELH77301948', status: 'DELIVERED', address: 'Banjara Hills, Hyderabad, TS - 500034' },
    { id: 'DSP-903', customer: 'Metro Interio Bangalore', skuCode: 'PLY-HW-16-7X4-S', quantity: 5, partner: 'Shiprocket', trackingNo: 'SR119028445', status: 'PICKING', address: 'Whitefield, Bangalore, KA - 560066' }
  ]);

  // Inward/Outward transaction history
  const [history, setHistory] = useState([
    { id: 'TXN-001', skuCode: 'PLY-GUR-19-8X4-G', quantity: 10, type: 'INWARD', reason: 'PO Fulfillment', user: 'Admin Manoj', date: '12 Jun 2026' },
    { id: 'TXN-002', skuCode: 'PLY-ALT-12-8X4-M', quantity: -5, type: 'OUTWARD', reason: 'Sales Order Dispatch', user: 'Rep Shruti', date: 'Yesterday' }
  ]);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Gurjan Plywood');
  const [newQty, setNewQty] = useState(10);
  const [newReorder, setNewReorder] = useState(5);
  const [newCost, setNewCost] = useState(100);
  const [newSell, setNewSell] = useState(150);
  const [newGst, setNewGst] = useState(18);
  const [newHsn, setNewHsn] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newLocation, setNewLocation] = useState('Warehouse A');
  const [newBrand, setNewBrand] = useState('Spelux');
  const [newThickness, setNewThickness] = useState('19mm');
  const [newSize, setNewSize] = useState('8x4');
  const [newFinish, setNewFinish] = useState('Glossy');

  // Inward Form State
  const [isInwarding, setIsInwarding] = useState(false);
  const [inwardSKU, setInwardSKU] = useState('PLY-GUR-19-8X4-G');
  const [inwardQty, setInwardQty] = useState(10);
  const [inwardReason, setInwardReason] = useState('Purchase');

  const [aiWorking, setAiWorking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('Stock Analysis: PLY-GUR-19-8X4-G is below reorder point (2 left, threshold 10). Depletion predicted in 4 days. Auto-drafted PO-2026-002 with Greenply and prepared National Furniture delivery route parameters.');

  const handleAddSKU = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    const newS: SKU = {
      code: newCode.toUpperCase(),
      name: newName,
      category: newCategory,
      quantity: newQty,
      reorderPoint: newReorder,
      unit: 'PCS',
      location: newLocation,
      costPrice: newCost,
      sellingPrice: newSell,
      gstRate: newGst,
      hsnCode: newHsn || '4412.31',
      vendor: newVendor || 'Spelux',
      brand: newBrand,
      thickness: newThickness,
      size: newSize,
      finish: newFinish
    };

    if (!isDemo) {
      vortiqClient.callMutation('inventory.productsCreate', {
        name: newName,
        category: newCategory,
        brand: newBrand,
        gstRate: newGst
      }).then((prod: any) => {
        return vortiqClient.callMutation('inventory.skusCreate', {
          productId: prod.id,
          skuCode: newCode.toUpperCase(),
          name: newName,
          costPrice: newCost,
          sellingPrice: newSell,
          reorderPoint: newReorder,
          attributes: {
            brand: newBrand,
            thickness: newThickness,
            size: newSize,
            finish: newFinish
          }
        });
      }).then((sku: any) => {
        if (newQty > 0) {
          return vortiqClient.callMutation('inventory.stockAdjust', {
            skuId: sku.id,
            quantity: newQty,
            reason: 'Initial stock load'
          });
        }
      }).then(() => {
        window.dispatchEvent(new Event('vortiq-data-change'));
      }).catch(e => console.error('Error creating SKU in db:', e));
    }

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
    setNewBrand('Spelux');
    setNewThickness('19mm');
    setNewSize('8x4');
    setNewFinish('Glossy');
    setIsAdding(false);
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSkus(prev => prev.map(s => s.code === inwardSKU ? { ...s, quantity: s.quantity + inwardQty } : s));

    if (!isDemo) {
      const skuObj = skus.find(s => s.code === inwardSKU);
      if (skuObj && skuObj.id) {
        vortiqClient.callMutation('inventory.stockAdjust', {
          skuId: skuObj.id,
          quantity: inwardQty,
          reason: inwardReason
        }).then(() => {
          window.dispatchEvent(new Event('vortiq-data-change'));
        }).catch(e => console.error('Error adjusting stock:', e));
      }
    }

    const newTxn = {
      id: `TXN-00${history.length + 1}`,
      skuCode: inwardSKU,
      quantity: inwardQty,
      type: 'INWARD',
      reason: inwardReason,
      user: user?.fullName || 'Super Admin',
      date: 'Today'
    };
    setHistory([newTxn, ...history]);
    setIsInwarding(false);
  };

  const handleOutward = (skuCode: string, qty: number) => {
    setSkus(prev => prev.map(s => s.code === skuCode ? { ...s, quantity: Math.max(0, s.quantity - qty) } : s));

    if (!isDemo) {
      const skuObj = skus.find(s => s.code === skuCode);
      if (skuObj && skuObj.id) {
        vortiqClient.callMutation('inventory.stockAdjust', {
          skuId: skuObj.id,
          quantity: -qty,
          reason: 'Manual Outward Deduct'
        }).then(() => {
          window.dispatchEvent(new Event('vortiq-data-change'));
        }).catch(e => console.error('Error adjusting stock:', e));
      }
    }

    const newTxn = {
      id: `TXN-00${history.length + 1}`,
      skuCode: skuCode,
      quantity: -qty,
      type: 'OUTWARD',
      reason: 'Manual Outward Deduct',
      user: user?.fullName || 'Super Admin',
      date: 'Today'
    };
    setHistory([newTxn, ...history]);
  };

  const handleTriggerReorderScan = () => {
    setAiWorking(true);
    setTimeout(() => {
      setAiWorking(false);
      setAiAnalysis('Updated Stock Forecast: Created new draft purchase order for PLY-GUR-19-8X4-G (10 Sheets) to Greenply Industries. Current supply schedules are fully audited.');
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
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Import CSV
            </button>
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              Export CSV
            </button>
            <button 
              onClick={() => {
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="Gurjan Plywood">Gurjan Plywood</option>
                  <option value="Alternate Plywood">Alternate Plywood</option>
                  <option value="Hardwood Plywood">Hardwood Plywood</option>
                  <option value="Commercial Plywood">Commercial Plywood</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Brand</label>
                <input 
                  type="text" required value={newBrand} onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="e.g. Greenply"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thickness</label>
                <select 
                  value={newThickness} onChange={(e) => setNewThickness(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="6mm">6mm</option>
                  <option value="9mm">9mm</option>
                  <option value="12mm">12mm</option>
                  <option value="16mm">16mm</option>
                  <option value="19mm">19mm</option>
                  <option value="25mm">25mm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Size (Dimensions)</label>
                <select 
                  value={newSize} onChange={(e) => setNewSize(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="8x4">8x4</option>
                  <option value="7x4">7x4</option>
                  <option value="8x3">8x3</option>
                  <option value="7x3">7x3</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Finish Style</label>
                <select 
                  value={newFinish} onChange={(e) => setNewFinish(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="Glossy">Glossy</option>
                  <option value="Matte">Matte</option>
                  <option value="Suede">Suede</option>
                  <option value="Textured">Textured</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Stock Quantity</label>
                <input 
                  type="number" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="e.g. 4412.31"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preferred Vendor</label>
                <input 
                  type="text" value={newVendor} onChange={(e) => setNewVendor(e.target.value)}
                  placeholder="e.g. Greenply Industries"
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
                    {filteredSkus.map((s) => {
                      const isLow = s.quantity <= s.reorderPoint;
                      return (
                        <tr 
                          key={s.code} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300 font-medium cursor-pointer transition-colors ${
                            selectedSKU?.code === s.code ? 'bg-slate-100/60 dark:bg-slate-800/30' : ''
                          }`}
                          onClick={() => setSelectedSKU(s)}
                        >
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

        {/* Modals and Wizards */}
        {showImportWizard && (
          <DataImportWizard 
            module="INVENTORY_ITEMS"
            onClose={() => setShowImportWizard(false)}
            onSuccess={() => refreshInventoryData()}
          />
        )}

        {showExportModal && (
          <DataExportModal 
            module="INVENTORY_ITEMS"
            filters={appliedFilters}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {showCustomFields && (
          <CustomFieldManager 
            module="INVENTORY_ITEMS"
            onClose={() => setShowCustomFields(false)}
          />
        )}

        {showFilterBuilder && (
          <div className="fixed inset-y-0 right-0 z-45 bg-[#0f172a] shadow-2xl transition-all border-l border-slate-850">
            <FilterBuilder 
              module="INVENTORY_ITEMS"
              onApply={(f) => {
                setAppliedFilters(f);
                setShowFilterBuilder(false);
              }}
              onClose={() => setShowFilterBuilder(false)}
            />
          </div>
        )}

        {selectedSKU && (
          <div className="w-96 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-lg space-y-5 flex flex-col justify-between shrink-0 animate-fadeIn">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">SKU Detail File</span>
                <button onClick={() => setSelectedSKU(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 dark:text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Header profile details */}
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedSKU.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Code: {selectedSKU.code} • Category: {selectedSKU.category}</p>
                <div className="mt-2 flex flex-col gap-2 border bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      selectedSKU.quantity <= selectedSKU.reorderPoint 
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    }`}>
                      {selectedSKU.quantity <= selectedSKU.reorderPoint ? 'Low Stock' : 'In Stock'}
                    </span>
                    <span>Qty: <b className="text-slate-800 dark:text-white">{selectedSKU.quantity} {selectedSKU.unit || 'Units'}</b></span>
                  </div>
                </div>
              </div>

              {/* SKU Info */}
              <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Warehouse Location:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedSKU.location}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Reorder Point:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedSKU.reorderPoint}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Preferred Vendor:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedSKU.vendor}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Cost Price:</span>
                  <span className="text-slate-800 dark:text-slate-250">{formatINR(selectedSKU.costPrice)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>Selling Price:</span>
                  <span className="text-slate-800 dark:text-slate-250">{formatINR(selectedSKU.sellingPrice)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>GST Rate:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedSKU.gstRate}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                  <span>HSN Code:</span>
                  <span className="text-slate-800 dark:text-slate-250">{selectedSKU.hsnCode}</span>
                </div>
              </div>

              {/* Data Relationship & Attachments panels */}
              {selectedSKU.id && (
                <div className="border-t border-slate-100 dark:border-slate-900 pt-4 space-y-4">
                  <DocumentAttachmentPanel module="INVENTORY_SKUS" recordId={selectedSKU.id} />
                  <RelatedRecordsPanel module="INVENTORY_SKUS" recordId={selectedSKU.id} />
                  <AuditHistoryPanel module="INVENTORY_SKUS" recordId={selectedSKU.id} />
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
}
