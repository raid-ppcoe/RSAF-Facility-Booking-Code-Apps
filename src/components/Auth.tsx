import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, AlertCircle, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { RegisterForm } from './RegisterForm';

export const Auth: React.FC = () => {
  const { loading, error, noProfile, envEmail, envDisplayName, register } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return (
      <RegisterForm
        email={envEmail}
        displayName={envDisplayName}
        onRegister={register}
        onBack={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#1E3A8A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">FacilityBook</h1>
          <p className="text-slate-500 font-medium">Air Force Facility Booking System</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50"
        >
          {loading ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-lg font-bold text-slate-700">Loading your profile...</p>
              <p className="text-sm text-slate-400 mt-2">Connecting to Dataverse</p>
            </div>
          ) : noProfile ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="text-amber-500" size={32} />
              </div>
              <p className="text-lg font-bold text-slate-700 mb-2">Welcome!</p>
              <p className="text-sm text-slate-400 mb-6">
                No account found for <span className="font-semibold text-slate-500">{envEmail}</span>. Register to get started.
              </p>
              <button
                onClick={() => setShowRegister(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold rounded-xl transition-all"
              >
                <UserPlus size={18} />
                Register Here
              </button>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-rose-500" size={32} />
              </div>
              <p className="text-lg font-bold text-slate-700 mb-2">Access Denied</p>
              <p className="text-sm text-slate-400">{error}</p>
              <p className="text-sm text-slate-400 mt-4">
                Please contact your administrator to set up your profile.
              </p>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-lg font-bold text-slate-700">Signing you in...</p>
            </div>
          )}
        </motion.div>

        <p className="text-center mt-10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          &copy; 2026 FacilityBook
        </p>
      </div>
    </div>
  );
};
