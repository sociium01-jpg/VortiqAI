'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Check, RefreshCw, X, AlertCircle } from 'lucide-react';
import { vortiqClient } from '../utils/vortiqClient';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  module?: string;
  recordId?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    vortiqClient.callQuery('interconnect.getNotifications')
      .then((res: any) => {
        setNotifications(res || []);
      })
      .catch(err => console.error('Failed to load notifications:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();

    const handleDataChange = () => {
      fetchNotifications();
    };

    window.addEventListener('vortiq-data-change', handleDataChange);
    return () => {
      window.removeEventListener('vortiq-data-change', handleDataChange);
    };
  }, []);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await vortiqClient.callMutation('interconnect.markNotificationRead', { id });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-800/80"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-slate-950 animate-bounce">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2.5 w-80 bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-indigo-400" />
                Real-Time Alerts ({notifications.length})
              </span>
              <button 
                onClick={fetchNotifications}
                className="text-slate-500 hover:text-slate-300 p-1"
                title="Refresh notifications"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {loading && notifications.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                Loading alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs font-semibold">
                No new notifications.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex items-start gap-2.5 bg-slate-950/50 hover:bg-slate-950 border border-slate-900 hover:border-slate-800 p-2.5 rounded-xl transition-all"
                  >
                    <div className="p-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg mt-0.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>

                    <div className="space-y-0.5 flex-1 pr-6">
                      <h4 className="text-xs font-bold text-slate-200 leading-snug">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">{item.message}</p>
                      <span className="text-[8px] text-slate-500 font-bold block pt-1">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleMarkRead(item.id, e)}
                      className="absolute right-2 top-2 text-slate-600 hover:text-emerald-400 p-1 rounded hover:bg-emerald-500/5 transition-all opacity-0 group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
