'use client';

import React, { useState } from 'react';
import ConsoleLayout from '../ConsoleLayout';
import { 
  MessageSquare, UserCheck, Key, Shield, AlertCircle, RefreshCw
} from 'lucide-react';

export default function TelegramPage() {
  const [pairingCode, setPairingCode] = useState('482910');
  const [sessions] = useState([
    { id: 1, name: 'Amit Sharma (CEO)', username: '@amit_vortiq', pairedAt: 'June 10, 2026', status: 'ACTIVE' },
    { id: 2, name: 'Priya Patel (Sales)', username: '@priya_vortiq', pairedAt: 'June 12, 2026', status: 'ACTIVE' }
  ]);

  const generateCode = () => {
    setPairingCode(String(Math.floor(100000 + Math.random() * 900000)));
  };

  return (
    <ConsoleLayout>
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-5">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <MessageSquare className="w-5.5 h-5.5 text-sky-400" /> Telegram Integration Console
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Control VORTIQ Business OS using natural language commands, receive notifications, and verify agent actions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PAIRING FORM */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <Key className="w-5 h-5 text-sky-400" /> Pair New User
          </h3>

          <div className="text-center p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">6-Digit Pairing Code</p>
            <h2 className="text-4xl font-black text-teal-400 tracking-wider">{pairingCode}</h2>
            <p className="text-xs text-slate-400 leading-normal">
              Message the bot *&ldquo;/start&rdquo;* or enter this code in Settings to link your profile.
            </p>
            <button 
              onClick={generateCode}
              className="flex items-center justify-center gap-2 mx-auto text-xs text-slate-300 hover:text-white font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate Code
            </button>
          </div>
        </div>

        {/* CONNECTED USERS LIST */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-400" /> Paired Telegram Sessions
          </h3>

          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-white">{s.name}</h4>
                  <p className="text-[10px] text-slate-500">Username: {s.username} • Paired: {s.pairedAt}</p>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-black rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </ConsoleLayout>
  );
}
