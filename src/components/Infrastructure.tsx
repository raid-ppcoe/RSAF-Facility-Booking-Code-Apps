import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { Plus, Edit2, Trash2, X, Building, CalendarOff, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { isGlobalAdmin, isSuperAdminOrAbove } from '../types';

export const Infrastructure: React.FC = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment, blockedDates, addBlackout, updateBlackout, deleteBlackout, facilities, locations, addLocation, updateLocation, deleteLocation, getVisibleFacilities } = useAppContext();
  const { user } = useAuth();
  const isGlobalAdminUser = isGlobalAdmin(user?.role);
  const isSuperAdminOrAboveUser = isSuperAdminOrAbove(user?.role);
  const [activeTab, setActiveTab] = useState<'departments'|'blackouts'|'locations'>(isSuperAdminOrAboveUser ? 'departments' : 'blackouts');

  // Facilities visible to this user (respecting department visibility)
  const userVisibleFacilities = isGlobalAdminUser ? facilities : getVisibleFacilities(facilities, user?.departmentId);

  // Facilities in the user's department
  const deptFacilityIds = new Set(
    userVisibleFacilities.filter(f => f.departmentId === user?.departmentId).map(f => f.id)
  );

  // Blackouts visible to this user
  const visibleBlackouts = isGlobalAdminUser
    ? blockedDates
    : blockedDates.filter(bd => bd.isGlobal || (bd.facilityId && deptFacilityIds.has(bd.facilityId)));

  // Facilities available in the blackout modal
  const blackoutFacilityOptions = isGlobalAdminUser
    ? facilities
    : userVisibleFacilities.filter(f => deptFacilityIds.has(f.id));

  // Whether user can edit/delete a specific blackout
  const canManageBlackout = (bd: typeof blockedDates[number]) =>
    isGlobalAdminUser || (!bd.isGlobal && !!bd.facilityId && deptFacilityIds.has(bd.facilityId));

  // State for "apply to all dept facilities" toggle (super_admin blackout)
  const [applyToAllDeptFacilities, setApplyToAllDeptFacilities] = useState(false);

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

  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [locFormData, setLocFormData] = useState({ name: '' });
  const [confirmDeleteLocId, setConfirmDeleteLocId] = useState<string | null>(null);

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

  const handleLocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingLoc) {
        await updateLocation(editingLoc.id, locFormData.name);
      } else {
        await addLocation(locFormData.name);
      }
      setIsLocModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save location');
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const nowTime = format(new Date(), 'HH:mm');

  const handleBlackoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate: end date must not be before start date
    if (blackoutFormData.endDate < blackoutFormData.startDate) {
      setFormError('End date cannot be before the start date.');
      return;
    }

    // Validate: cannot create blackout entirely in the past
    if (!editingBlackout) {
      if (blackoutFormData.endDate < todayStr) {
        setFormError('Cannot create a blackout date in the past.');
        return;
      }
      // If end date is today and time-specific, check end time hasn't passed
      if (!blackoutFormData.isFullDay && blackoutFormData.endDate === todayStr && blackoutFormData.endTime && blackoutFormData.endTime <= nowTime) {
        setFormError('The blackout end time has already passed today.');
        return;
      }
    }

    // Validate: for time-specific blackouts on the same date, end time must be after start time
    if (!blackoutFormData.isFullDay && blackoutFormData.startTime && blackoutFormData.endTime) {
      if (blackoutFormData.startDate === blackoutFormData.endDate && blackoutFormData.endTime <= blackoutFormData.startTime) {
        setFormError('End time must be after the start time.');
        return;
      }
    }

    const basePayload = {
      reason: blackoutFormData.reason,
      startDate: blackoutFormData.startDate,
      endDate: blackoutFormData.endDate,
      isFullDay: blackoutFormData.isFullDay,
      startTime: blackoutFormData.isFullDay ? undefined : blackoutFormData.startTime || undefined,
      endTime: blackoutFormData.isFullDay ? undefined : blackoutFormData.endTime || undefined,
      createdBy: user?.id || '',
    };
    try {
      if (editingBlackout) {
        await updateBlackout(editingBlackout.id, {
          ...basePayload,
          facilityId: blackoutFormData.facilityId || null,
          isGlobal: !blackoutFormData.facilityId,
        });
      } else if (applyToAllDeptFacilities && user?.departmentId) {
        // Create a blackout for each facility in the user's department
        const deptFacs = facilities.filter(f => f.departmentId === user.departmentId);
        for (const fac of deptFacs) {
          await addBlackout({
            ...basePayload,
            facilityId: fac.id,
            isGlobal: false,
          } as any);
        }
      } else {
        await addBlackout({
          ...basePayload,
          facilityId: blackoutFormData.facilityId || null,
          isGlobal: !blackoutFormData.facilityId,
        } as any);
      }
      setIsBlackoutModalOpen(false);
      setApplyToAllDeptFacilities(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save blackout date');
    }
  };

  return (
    <div data-tutorial="infrastructure-panel" className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Infrastructure Management</h1>
          <p className="mt-2 text-slate-500">Manage departments and facility blackout dates.</p>
        </div>
      </div>

      <div data-tutorial="infrastructure-tabs" className="flex flex-wrap gap-4 border-b border-slate-200">
        {isSuperAdminOrAboveUser && (
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
        )}
        {isSuperAdminOrAboveUser && (
          <button
            onClick={() => setActiveTab('locations')}
            className={`pb-4 px-2 font-bold transition-all ${
              activeTab === 'locations' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Locations
          </button>
        )}
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

      {activeTab === 'departments' && isSuperAdminOrAboveUser && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold text-slate-800">Departments</h2>
            {isGlobalAdminUser && (
              <button 
                onClick={() => { setEditingDept(null); setDeptFormData({name: '', description: ''}); setFormError(null); setIsDeptModalOpen(true); }}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Add Department
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isGlobalAdminUser ? departments : departments.filter(d => d.id === user?.departmentId)).map(dept => (
              <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Building size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Edit Department" onClick={() => { setEditingDept(dept); setDeptFormData({name: dept.name, description: dept.description || ''}); setFormError(null); setIsDeptModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    {isGlobalAdminUser && (
                      <button title="Delete Department" onClick={() => setConfirmDeleteDeptId(dept.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    )}
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
              onClick={() => { setEditingBlackout(null); setBlackoutFormData({ reason: '', startDate: '', endDate: '', isFullDay: true, startTime: '', endTime: '', facilityId: '', isGlobal: false }); setApplyToAllDeptFacilities(false); setFormError(null); setIsBlackoutModalOpen(true); }}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Add Blackout Date
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleBlackouts.map(bd => (
              <div key={bd.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                    <CalendarOff size={20} />
                  </div>
                  {canManageBlackout(bd) && (
                    <div className="flex items-center gap-2">
                      <button title="Edit Blackout" onClick={() => { setEditingBlackout(bd); setBlackoutFormData({ reason: bd.reason, startDate: bd.startDate, endDate: bd.endDate, isFullDay: bd.isFullDay, startTime: bd.startTime || '', endTime: bd.endTime || '', facilityId: bd.facilityId || '', isGlobal: bd.isGlobal }); setFormError(null); setIsBlackoutModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button title="Delete Blackout" onClick={() => setConfirmDeleteBlackoutId(bd.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
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

      {activeTab === 'locations' && isSuperAdminOrAboveUser && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold text-slate-800">Locations</h2>
            <button 
              onClick={() => { setEditingLoc(null); setLocFormData({ name: '' }); setFormError(null); setIsLocModalOpen(true); }}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Add Location
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map(loc => (
              <div key={loc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <MapPin size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Edit Location" onClick={() => { setEditingLoc(loc); setLocFormData({ name: loc.name }); setFormError(null); setIsLocModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button title="Delete Location" onClick={() => setConfirmDeleteLocId(loc.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{loc.name}</h3>
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
              <button title="Close" type="button" onClick={() => { setFormError(null); setIsDeptModalOpen(false); }} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
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
                <button type="button" onClick={() => { setFormError(null); setIsDeptModalOpen(false); }} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
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
             <button title="Close" type="button" onClick={() => { setFormError(null); setIsBlackoutModalOpen(false); }} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
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
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
                 <input title="Start Date" required type="date" min={todayStr} value={blackoutFormData.startDate} onChange={e => setBlackoutFormData({...blackoutFormData, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
               </div>
               <div className="space-y-2">
                 <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">End Date</label>
                 <input title="End Date" required type="date" min={blackoutFormData.startDate || todayStr} value={blackoutFormData.endDate} onChange={e => setBlackoutFormData({...blackoutFormData, endDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
               </div>
             </div>
             <div className="space-y-2 flex items-center gap-3">
                <input title="Full Day" type="checkbox" id="isFullDay" checked={blackoutFormData.isFullDay} onChange={e => setBlackoutFormData({...blackoutFormData, isFullDay: e.target.checked})} className="w-5 h-5 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all" />
                <label htmlFor="isFullDay" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Day</label>
             </div>
             {!blackoutFormData.isFullDay && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
             {/* Super Admin: "Apply to all facilities in my department" toggle */}
             {user?.role === 'super_admin' && !editingBlackout && (
               <div className="space-y-2 mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                 <input
                   title="Apply to all department facilities"
                   type="checkbox"
                   id="applyAllDept"
                   checked={applyToAllDeptFacilities}
                   onChange={e => {
                     setApplyToAllDeptFacilities(e.target.checked);
                     if (e.target.checked) setBlackoutFormData({...blackoutFormData, facilityId: ''});
                   }}
                   className="w-5 h-5 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all"
                 />
                 <label htmlFor="applyAllDept" className="text-sm font-bold text-blue-800 cursor-pointer">Apply to all facilities in my department</label>
               </div>
             )}
             {!applyToAllDeptFacilities && (
               <div className="space-y-2 mt-4">
                 <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                   {isGlobalAdminUser ? 'Facility (Optional)' : 'Facility'}
                 </label>
                 <select title="Facility" required={!isGlobalAdminUser} value={blackoutFormData.facilityId} onChange={e => setBlackoutFormData({...blackoutFormData, facilityId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium">
                   {isGlobalAdminUser && <option value="">All Facilities (Global)</option>}
                   {!isGlobalAdminUser && <option value="" disabled>Select a facility...</option>}
                   {blackoutFacilityOptions.map(f => (
                     <option key={f.id} value={f.id}>{f.name}</option>
                   ))}
                 </select>
               </div>
             )}
             <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
               <button type="button" onClick={() => { setFormError(null); setIsBlackoutModalOpen(false); }} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
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

      {isLocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{editingLoc ? 'Edit' : 'Add'} Location</h2>
              <button title="Close" type="button" onClick={() => setIsLocModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleLocSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Location Name</label>
                <input title="Location Name" required type="text" value={locFormData.name} onChange={e => setLocFormData({ name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" placeholder="e.g. Headquarters, North Campus" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsLocModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteLocId !== null}
        title="Delete Location"
        message="Are you sure you want to delete this location? This action cannot be undone."
        onConfirm={() => {
          if (confirmDeleteLocId) deleteLocation(confirmDeleteLocId);
          setConfirmDeleteLocId(null);
        }}
        onCancel={() => setConfirmDeleteLocId(null)}
      />
    </div>
  );
};
