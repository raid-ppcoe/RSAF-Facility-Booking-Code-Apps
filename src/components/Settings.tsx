import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { Phone, Save, Loader2, Building2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updatePhone } = useAuth();
  const { departments } = useAppContext();
  const departmentName = departments.find(d => d.id === user?.departmentId)?.name;
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
    <div data-tutorial="settings-panel" className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Settings</h1>
          <p className="mt-2 text-slate-500">Manage your profile and preferences.</p>
        </div>
      </div>
      
      <div data-tutorial="settings-profile" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </div>
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
              <span className="flex items-center gap-2"><Building2 size={14} /> Department</span>
            </h3>
            <p className="font-medium text-slate-800 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${departmentName ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              {departmentName || 'Not assigned'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-2"><Phone size={14} /> Contact Number</span>
            </h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="min-w-0 flex-1 max-w-[200px] sm:max-w-none px-3 sm:px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
              />
              <button
                onClick={handleSavePhone}
                disabled={saving || phone.trim() === (user?.phone || '')}
                className="shrink-0 whitespace-nowrap px-4 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center gap-2 text-sm"
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