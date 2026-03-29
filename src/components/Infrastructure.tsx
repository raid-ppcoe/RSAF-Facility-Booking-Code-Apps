import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { Plus, Edit2, Trash2, X, Building, CalendarOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const Infrastructure: React.FC = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment, blockedDates, addBlackout, updateBlackout, deleteBlackout, facilities } = useAppContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments'|'blackouts'>('departments');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptFormData, setDeptFormData] = useState({ name: '', description: '' });

  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false);
  const [editingBlackout, setEditingBlackout] = useState<any>(null);
  const [blackoutFormData, setBlackoutFormData] = useState({ 
    reason: '', startDate: '', endDate: '', isFullDay: true, 
    startTime: '', endTime: '', facilityId: '', isGlobal: false 
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteDeptId, setConfirmDeleteDeptId] = useState<string | null>(null);
  const [confirmDeleteBlackoutId, setConfirmDeleteBlackoutId] = useState<string | null>(null);

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, deptFormData.name, deptFormData.description);
      } else {
        await addDepartment(deptFormData.name, deptFormData.description);
      }
      setIsDeptModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save department');
    }
  };

  const handleBlackoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      reason: blackoutFormData.reason,
      startDate: blackoutFormData.startDate,
      endDate: blackoutFormData.endDate,
      isFullDay: blackoutFormData.isFullDay,
      startTime: blackoutFormData.isFullDay ? undefined : blackoutFormData.startTime || undefined,
      endTime: blackoutFormData.isFullDay ? undefined : blackoutFormData.endTime || undefined,
      facilityId: blackoutFormData.facilityId || null,
      isGlobal: !blackoutFormData.facilityId,
      createdBy: user?.id || '',
    };
    try {
      if (editingBlackout) {
        await updateBlackout(editingBlackout.id, payload);
      } else {
        await addBlackout(payload as any);
      }
      setIsBlackoutModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save blackout date');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Infrastructure Management</h1>
          <p className="mt-2 text-slate-500">Manage departments and facility blackout dates.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-4 px-2 font-bold transition-all ${
            activeTab === 'departments' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('blackouts')}
          className={`pb-4 px-2 font-bold transition-all ${
            activeTab === 'blackouts' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Blackout Dates
        </button>
      </div>

      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold text-slate-800">Departments</h2>
            <button 
              onClick={() => { setEditingDept(null); setDeptFormData({name: '', description: ''}); setIsDeptModalOpen(true); }}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Add Department
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map(dept => (
              <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Building size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Edit Department" onClick={() => { setEditingDept(dept); setDeptFormData({name: dept.name, description: ''}); setIsDeptModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button title="Delete Department" onClick={() => setConfirmDeleteDeptId(dept.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{dept.name}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'blackouts' && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold text-slate-800">Blackout Dates</h2>
            <button 
              onClick={() => { setEditingBlackout(null); setBlackoutFormData({ reason: '', startDate: '', endDate: '', isFullDay: true, startTime: '', endTime: '', facilityId: '', isGlobal: false }); setIsBlackoutModalOpen(true); }}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Add Blackout Date
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blockedDates.map(bd => (
              <div key={bd.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                    <CalendarOff size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Edit Blackout" onClick={() => { setEditingBlackout(bd); setBlackoutFormData({ reason: bd.reason, startDate: bd.startDate, endDate: bd.endDate, isFullDay: bd.isFullDay, startTime: bd.startTime, endTime: bd.endTime, facilityId: bd.facilityId || '', isGlobal: bd.isGlobal }); setIsBlackoutModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button title="Delete Blackout" onClick={() => setConfirmDeleteBlackoutId(bd.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{bd.reason}</h3>
                  <p className="text-sm font-medium text-slate-500">
                    {format(parseISO(bd.startDate), 'MMM d, yyyy')} - {format(parseISO(bd.endDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{bd.facilityId ? facilities.find(f => f.id === bd.facilityId)?.name || 'Specific Facility' : 'All Facilities'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{editingDept ? 'Edit' : 'Add'} Department</h2>
              <button title="Close" type="button" onClick={() => setIsDeptModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Name</label>
                <input title="Name" required type="text" value={deptFormData.name} onChange={e => setDeptFormData({...deptFormData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Description</label>
                <textarea title="Description" value={deptFormData.description} onChange={e => setDeptFormData({...deptFormData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium min-h-[120px] resize-y"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBlackoutModalOpen && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
             <h2 className="text-xl font-bold text-slate-800">{editingBlackout ? 'Edit' : 'Add'} Blackout Date</h2>
             <button title="Close" type="button" onClick={() => setIsBlackoutModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
           </div>
           <form onSubmit={handleBlackoutSubmit} className="p-6 space-y-4">
             {formError && (
               <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                 {formError}
               </div>
             )}
             <div className="space-y-2">
               <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Reason</label>
               <input title="Reason" required type="text" value={blackoutFormData.reason} onChange={e => setBlackoutFormData({...blackoutFormData, reason: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
                 <input title="Start Date" required type="date" value={blackoutFormData.startDate} onChange={e => setBlackoutFormData({...blackoutFormData, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
               </div>
               <div className="space-y-2">
                 <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">End Date</label>
                 <input title="End Date" required type="date" value={blackoutFormData.endDate} onChange={e => setBlackoutFormData({...blackoutFormData, endDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
               </div>
             </div>
             <div className="space-y-2 flex items-center gap-3">
                <input title="Full Day" type="checkbox" id="isFullDay" checked={blackoutFormData.isFullDay} onChange={e => setBlackoutFormData({...blackoutFormData, isFullDay: e.target.checked})} className="w-5 h-5 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all" />
                <label htmlFor="isFullDay" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Day</label>
             </div>
             {!blackoutFormData.isFullDay && (
               <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="space-y-2">
                   <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Start Time</label>
                   <input title="Start Time" required={!blackoutFormData.isFullDay} type="time" value={blackoutFormData.startTime} onChange={e => setBlackoutFormData({...blackoutFormData, startTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
                 </div>
                 <div className="space-y-2">
                   <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">End Time</label>
                   <input title="End Time" required={!blackoutFormData.isFullDay} type="time" value={blackoutFormData.endTime} onChange={e => setBlackoutFormData({...blackoutFormData, endTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
                 </div>
               </div>
             )}
             <div className="space-y-2 mt-4">
               <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Facility (Optional)</label>
               <select title="Facility" value={blackoutFormData.facilityId} onChange={e => setBlackoutFormData({...blackoutFormData, facilityId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium">
                 <option value="">All Facilities</option>
                 {facilities.map(f => (
                   <option key={f.id} value={f.id}>{f.name}</option>
                 ))}
               </select>
             </div>
             <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
               <button type="button" onClick={() => setIsBlackoutModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
               <button type="submit" className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save</button>
             </div>
           </form>
         </div>
       </div>
      )}

      <ConfirmDialog
        open={confirmDeleteDeptId !== null}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
        onConfirm={() => {
          if (confirmDeleteDeptId) deleteDepartment(confirmDeleteDeptId);
          setConfirmDeleteDeptId(null);
        }}
        onCancel={() => setConfirmDeleteDeptId(null)}
      />

      <ConfirmDialog
        open={confirmDeleteBlackoutId !== null}
        title="Delete Blackout Date"
        message="Are you sure you want to delete this blackout date? This action cannot be undone."
        onConfirm={() => {
          if (confirmDeleteBlackoutId) deleteBlackout(confirmDeleteBlackoutId);
          setConfirmDeleteBlackoutId(null);
        }}
        onCancel={() => setConfirmDeleteBlackoutId(null)}
      />
    </div>
  );
};
