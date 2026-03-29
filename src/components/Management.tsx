import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  Check, 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Building2, 
  Layers, 
  ClipboardList,
  Search,
  Filter,
  ExternalLink,
  ScrollText,
  Loader2
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Management: React.FC = () => {
  const { 
    bookings, 
    updateBookingStatus,
    deleteBooking, 
    facilities, 
    departments, 
    addFacility, 
    updateFacility, 
    deleteFacility,
    getDepartmentForBooking,
    auditLogs,
    auditLoading,
    auditError,
    createAuditLog,
    reloadAuditLogs,
  } = useAppContext();
  const { user: currentUser } = useAuth();
  const { users, roles, updateUserRole, createUser } = useUsers();
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<any>(null);
  const [confirmDeleteFacilityId, setConfirmDeleteFacilityId] = useState<string | null>(null);
  const [confirmDeleteBookingId, setConfirmDeleteBookingId] = useState<string | null>(null);
  const [facilityFormError, setFacilityFormError] = useState<string | null>(null);
  
  const [facilityFormData, setFacilityFormData] = useState({
    name: '',
    departmentId: '',
    capacity: 10,
    maxRecurrenceWeeks: 4,
    description: ''
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    departmentId: '',
    roleId: ''
  });

  const handleOpenFacilityModal = (facility?: any) => {
    if (facility) {
      setEditingFacility(facility);
      setFacilityFormData({
        name: facility.name,
        departmentId: facility.departmentId,
        capacity: facility.capacity,
        maxRecurrenceWeeks: facility.maxRecurrenceWeeks || 4,
        description: facility.description || ''
      });
    } else {
      setEditingFacility(null);
      setFacilityFormData({
        name: '',
        departmentId: '',
        capacity: 10,
        maxRecurrenceWeeks: 4,
        description: ''
      });
    }
    setFacilityFormError(null);
    setIsFacilityModalOpen(true);
  };

  const handleFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacilityFormError(null);
    try {
      if (editingFacility) {
        await updateFacility({
          id: editingFacility.id,
          ...facilityFormData
        });
      } else {
        await addFacility({
          ...facilityFormData
        } as any);
      }
      setIsFacilityModalOpen(false);
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to save facility');
    }
  };

  // Filter bookings based on role
  const filteredBookings = bookings.filter(b => {
    if (currentUser?.role === 'super_admin') return true;
    if (currentUser?.role === 'admin') {
      const deptId = getDepartmentForBooking(b);
      return deptId === currentUser.departmentId;
    }
    return false;
  });

  const pendingBookings = filteredBookings.filter(b => b.status === 'pending');

  const handleApprove = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    await updateBookingStatus(bookingId, 'approved');
    await createAuditLog({
      action: 'approved',
      entityType: 'booking',
      recordId: bookingId,
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      bookerId: booking?.userId || '',
    });
    reloadAuditLogs();
  };

  const handleReject = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    await updateBookingStatus(bookingId, 'rejected');
    await createAuditLog({
      action: 'rejected',
      entityType: 'booking',
      recordId: bookingId,
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      bookerId: booking?.userId || '',
    });
    reloadAuditLogs();
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    await deleteBooking(bookingId);
    await createAuditLog({
      action: 'deleted',
      entityType: 'booking',
      recordId: bookingId,
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      bookerId: booking?.userId || '',
    });
    reloadAuditLogs();
  };

  return (
    <div className="space-y-8">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('requests')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeSubTab === 'requests' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Booking Requests
        </button>
        {currentUser?.role === 'super_admin' && (
          <>
            <button 
              onClick={() => setActiveSubTab('facilities')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeSubTab === 'facilities' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Facilities
            </button>
            <button 
              onClick={() => setActiveSubTab('users')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeSubTab === 'users' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              User Roles
            </button>
            <button 
              onClick={() => setActiveSubTab('auditlog')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeSubTab === 'auditlog' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Audit Log
            </button>
          </>
        )}
      </div>

      {activeSubTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Pending Requests</h2>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                {pendingBookings.length} Pending
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Facility</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Purpose</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingBookings.length > 0 ? (
                  pendingBookings.map((booking) => {
                    const facility = facilities.find(f => f.id === booking.facilityId);
                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                              {booking.userName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{booking.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-600">{facility?.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}</span>
                            <span className="text-xs font-medium text-slate-400">{booking.startTime} - {booking.endTime}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500 italic">"{booking.purpose}"</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`${((window as any).Xrm?.Utility?.getGlobalContext?.()?.getClientUrl?.()) || ''}/main.aspx?etn=cr71a_booking2&id=${booking.id}&pagetype=entityrecord`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                              title="View in Dataverse"
                            >
                              <ExternalLink size={18} />
                            </a>
                            <button 
                              onClick={() => handleApprove(booking.id)}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleReject(booking.id)}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteBookingId(booking.id)}
                              className="p-2 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                              title="Delete Booking"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                      No pending requests at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map(facility => (
            <div key={facility.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Building2 size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    title="Edit Facility"
                    onClick={() => handleOpenFacilityModal(facility)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    title="Delete Facility"
                    onClick={() => setConfirmDeleteFacilityId(facility.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{facility.name}</h3>
                <p className="text-sm font-medium text-slate-400">{departments.find(d => d.id === facility.departmentId)?.name}</p>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity</span>
                  <span className="font-bold text-slate-700">{facility.capacity} pax</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Recurrence</span>
                  <span className="font-bold text-slate-700">{facility.maxRecurrenceWeeks ?? '—'} weeks</span>
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={() => handleOpenFacilityModal()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-all">
              <Plus size={24} />
            </div>
            <span className="font-bold">Add New Facility</span>
          </button>
        </div>
      )}

      {activeSubTab === 'auditlog' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Audit Log</h2>
            <button
              onClick={() => reloadAuditLogs()}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          {auditLoading ? (
            <div className="p-10 text-center">
              <Loader2 className="animate-spin mx-auto text-slate-400" size={28} />
            </div>
          ) : auditError ? (
            <div className="p-6 text-center text-rose-500 font-medium">
              {auditError}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Facility</th>
                    <th className="px-6 py-4">Original Booker</th>
                    <th className="px-6 py-4">Performed By</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => {
                      const booking = bookings.find(b => b.id === log.recordId);
                      const facility = booking ? facilities.find(f => f.id === booking.facilityId) : null;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                              log.action === 'approved' ? "bg-emerald-100 text-emerald-700" :
                              log.action === 'rejected' ? "bg-rose-100 text-rose-700" :
                              log.action === 'deleted' ? "bg-orange-100 text-orange-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {log.actionLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{facility?.name || log.entityType || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{log.bookerName || '—'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700">{log.performedByName || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, yyyy hh:mm a') : '—'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                        No audit log entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">User Permissions</h2>
            <button
              onClick={() => {
                setUserFormData({ name: '', email: '', departmentId: '', roleId: '' });
                setUserFormError(null);
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 font-medium">Name / Email</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-sm">
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-slate-500">{user.email}</p>
                        {user.id === currentUser?.id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {departments.find(d => d.id === user.departmentId)?.name || '—'}
                      </td>
                      <td className="py-4">
                        <select
                          title="User Role"
                          value={user.roleId || ''}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                          disabled={user.id === currentUser?.id}
                          onChange={(e) => {
                            if(e.target.value) updateUserRole(user.id, e.target.value);
                          }}
                        >
                          <option value="" disabled>Select Role...</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
              <button
                title="Close"
                onClick={() => setIsUserModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUserFormError(null);
                setUserFormSubmitting(true);
                try {
                  await createUser(userFormData.name, userFormData.email, userFormData.departmentId, userFormData.roleId);
                  setIsUserModalOpen(false);
                } catch (err: any) {
                  setUserFormError(err.message || 'Failed to add user');
                } finally {
                  setUserFormSubmitting(false);
                }
              }}
              className="p-6 space-y-4"
            >
              {userFormError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                  {userFormError}
                </div>
              )}
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                <input
                  title="Full Name"
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Email</label>
                <input
                  title="Email"
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Department</label>
                <select
                  title="Department"
                  required
                  value={userFormData.departmentId}
                  onChange={e => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Role</label>
                <select
                  title="Role"
                  required
                  value={userFormData.roleId}
                  onChange={e => setUserFormData({ ...userFormData, roleId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="" disabled>Select Role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormSubmitting}
                  className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
                >
                  {userFormSubmitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFacilityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingFacility ? 'Edit Facility' : 'Add New Facility'}
              </h2>
              <button 
                title="Close"
                onClick={() => setIsFacilityModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFacilitySubmit} className="p-6 space-y-4">
              {facilityFormError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                  {facilityFormError}
                </div>
              )}
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Facility Name</label>
                <input
                  title="Facility Name"
                  type="text"
                  required
                  value={facilityFormData.name}
                  onChange={e => setFacilityFormData({...facilityFormData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Department</label>
                <select
                  title="Department"
                  required
                  value={facilityFormData.departmentId}
                  onChange={e => setFacilityFormData({...facilityFormData, departmentId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Capacity (pax)</label>
                  <input
                    title="Capacity"
                    type="number"
                    required min={1}
                    value={facilityFormData.capacity}
                    onChange={e => setFacilityFormData({...facilityFormData, capacity: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Max Recurrence</label>
                  <input
                    title="Max Recurrence"
                    type="number"
                    required min={1}
                    value={facilityFormData.maxRecurrenceWeeks}
                    onChange={e => setFacilityFormData({...facilityFormData, maxRecurrenceWeeks: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFacilityModalOpen(false)}
                  className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200"
                >
                  {editingFacility ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteFacilityId !== null}
        title="Delete Facility"
        message="Are you sure you want to delete this facility? This action cannot be undone."
        onConfirm={() => {
          if (confirmDeleteFacilityId) deleteFacility(confirmDeleteFacilityId);
          setConfirmDeleteFacilityId(null);
        }}
        onCancel={() => setConfirmDeleteFacilityId(null)}
      />

      <ConfirmDialog
        open={confirmDeleteBookingId !== null}
        title="Delete Booking"
        message="Are you sure you want to delete this booking? This will be logged in the audit trail."
        onConfirm={async () => {
          if (confirmDeleteBookingId) {
            await handleDeleteBooking(confirmDeleteBookingId);
          }
          setConfirmDeleteBookingId(null);
        }}
        onCancel={() => setConfirmDeleteBookingId(null)}
      />
    </div>
  );
};
