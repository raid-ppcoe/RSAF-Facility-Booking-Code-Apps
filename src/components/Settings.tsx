import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Phone, Save, Loader2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updatePhone } = useAuth();
  const [phone, setPhone] = useState(String(user?.phone || ''));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setPhone(String(user?.phone || ''));
  }, [user?.phone]);

  const handleSavePhone = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updatePhone(phone.trim());
      setSaveMessage({ type: 'success', text: 'Phone number saved successfully.' });
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save phone number. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Settings</h1>
          <p className="mt-2 text-slate-500">Manage your profile and preferences.</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <img src={user?.avatar} alt={user?.name || "User Avatar"} className="w-16 h-16 rounded-full bg-slate-100" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Role</h3>
            <p className="font-medium text-slate-800 capitalize flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user?.role === 'super_admin' ? 'bg-purple-500' : user?.role === 'admin' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
              {(user?.role || '').replace('_', ' ')}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-2"><Phone size={14} /> Contact Number</span>
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
              />
              <button
                onClick={handleSavePhone}
                disabled={saving || phone.trim() === (user?.phone || '')}
                className="px-4 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center gap-2 text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
            {saveMessage && (
              <p className={`mt-2 text-sm font-medium ${saveMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {saveMessage.text}
              </p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Notice</h3>
            <p className="text-sm text-slate-600">
              Profile details are managed by your administrator via Azure Active Directory / Dataverse. 
              To request changes to your name or department, please contact your IT helpdesk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};