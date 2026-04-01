import React, { useState, useEffect } from 'react';
import { Building2, ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Cr71a_departmentsService } from '../generated/services/Cr71a_departmentsService';

interface RegisterFormProps {
  email: string;
  displayName: string;
  onRegister: (data: { fullName: string; phone: string; departmentId: string }) => Promise<void>;
  onBack: () => void;
}

interface DepartmentOption {
  id: string;
  name: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ email, displayName, onRegister, onBack }) => {
  const [fullName, setFullName] = useState(displayName);
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      const result = await Cr71a_departmentsService.getAll({
        select: ['cr71a_departmentid', 'cr71a_departmentname'],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_departmentname asc'],
      });
      if (result.data) {
        setDepartments(
          result.data.map((d) => ({
            id: d.cr71a_departmentid,
            name: d.cr71a_departmentname,
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load departments:', err);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoadingDepts(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!departmentId) {
      setError('Please select a department.');
      return;
    }

    setSubmitting(true);
    try {
      await onRegister({ fullName: fullName.trim(), phone: phone.trim(), departmentId });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#1E3A8A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">FacilityBook</h1>
          <p className="text-slate-500 font-medium">Create Your Account</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email - read-only */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm"
              />
            </div>

            {/* Full Name - editable, prefilled */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Department - required */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Department</label>
              {loadingDepts ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
                  <Loader2 className="animate-spin" size={16} />
                  Loading departments...
                </div>
              ) : (
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Phone - required */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm font-medium px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Register
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </form>
        </motion.div>

        <p className="text-center mt-10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          &copy; 2026 FacilityBook
        </p>
      </div>
    </div>
  );
};
