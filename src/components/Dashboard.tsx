import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle2, AlertCircle, Building2, User as UserIcon, Calendar, XCircle, Filter, X, Shield, ShieldCheck } from 'lucide-react';
import { format, parse, isAfter, isSameDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ConfirmDialog } from './ConfirmDialog';
import { isGlobalAdmin, isAdminOrAbove } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Dashboard: React.FC = () => {
  const { bookings, facilities, locations, cancelBooking, createAuditLog, getVisibleFacilities, canUserApproveFacility } = useAppContext();
  const { user } = useAuth();
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'admin' | 'personal'>('admin');

  const [cancelError, setCancelError] = useState<string | null>(null);

  const visibleFacilities = isGlobalAdmin(user?.role) ? facilities : getVisibleFacilities(facilities, user?.departmentId);

  const roleFilteredBookings = isGlobalAdmin(user?.role)
    ? bookings
    : user?.role === 'super_admin' || user?.role === 'admin'
      ? bookings.filter(b => {
          const facility = facilities.find(f => f.id === b.facilityId);
          if (!facility) return false;
          return canUserApproveFacility(user!.id, user!.role, facility, user!.departmentId);
        })
      : bookings.filter(b => b.userId === user?.id);

  const userBookings = bookings.filter(b => b.userId === user?.id);
  
  const toDate = (d: string, t: string) => parse(`${d} ${t}`, 'yyyy-MM-dd HH:mm', new Date());

  const activeBookings = isAdminOrAbove(user?.role) && viewMode === 'admin' ? roleFilteredBookings : userBookings;

  const upcomingBookings = activeBookings
    .filter(b => (b.status === 'approved' || b.status === 'pending' || b.status === 'processing_clearance' || b.status === 'clearance_processed') && isAfter(toDate(b.date, b.startTime), new Date()))
    .filter(b => !filterDate || isSameDay(parse(b.date, 'yyyy-MM-dd', new Date()), parse(filterDate, 'yyyy-MM-dd', new Date())))
    .sort((a, b) => toDate(a.date, a.startTime).getTime() - toDate(b.date, b.startTime).getTime());

  const pendingCount = upcomingBookings.filter(b => b.status === 'pending' || b.status === 'processing_clearance').length;
  const approvedCount = upcomingBookings.filter(b => b.status === 'approved' || b.status === 'clearance_processed').length;

  const stats = [
    { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Approved', value: approvedCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Upcoming', value: upcomingBookings.length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div data-tutorial="dashboard-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Bookings Table */}
      <div data-tutorial="dashboard-bookings" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold text-slate-800">Upcoming Bookings</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {isAdminOrAbove(user?.role) && (
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('admin')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all',
                    viewMode === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  )}
                >
                  <Shield size={14} />
                  Admin View
                </button>
                <button
                  onClick={() => setViewMode('personal')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all border-l border-slate-200',
                    viewMode === 'personal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  )}
                >
                  <UserIcon size={14} />
                  My Bookings
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Filter by date"
                className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  title="Clear filter"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {upcomingBookings.length > 5 && (
              <button 
                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showAllUpcoming ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-3 sm:px-6 py-4">Facility</th>
                <th className="px-3 sm:px-6 py-4">Location</th>
                <th className="px-3 sm:px-6 py-4">Date & Time</th>
                <th className="px-3 sm:px-6 py-4 hidden sm:table-cell">Purpose</th>
                <th className="px-3 sm:px-6 py-4">Status</th>
                <th className="px-3 sm:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingBookings.length > 0 ? (
                (showAllUpcoming ? upcomingBookings : upcomingBookings.slice(0, 5)).map((booking) => {
                  const facility = facilities.find(f => f.id === booking.facilityId);
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                            <Building2 size={16} />
                          </div>
                          <span className="font-bold text-slate-700">{facility?.name}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-sm text-slate-500">{facility?.locationId ? locations.find(l => l.id === facility.locationId)?.name || '—' : '—'}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">
                              {format(toDate(booking.date, booking.startTime), 'MMM dd, yyyy')}
                              {booking.endDate && booking.endDate !== booking.date ? ` - ${format(toDate(booking.endDate, booking.endTime), 'MMM dd, yyyy')}` : ''}
                            </span>
                            <span className="text-xs font-medium text-slate-400 flex flex-wrap gap-x-2">
                              <span><span className="text-[10px] uppercase opacity-60 mr-1">Start:</span>{format(toDate(booking.date, booking.startTime), 'hh:mm a')}</span>
                              <span className="opacity-30">|</span>
                              <span><span className="text-[10px] uppercase opacity-60 mr-1">End:</span>{format(toDate(booking.endDate || booking.date, booking.endTime), 'hh:mm a')}</span>
                            </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-slate-600">{booking.purpose}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          booking.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                          booking.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          booking.status === 'processing_clearance' ? "bg-orange-100 text-orange-700" :
                          booking.status === 'clearance_processed' ? "bg-teal-100 text-teal-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {booking.status === 'processing_clearance' ? 'Processing Clearance' :
                           booking.status === 'clearance_processed' ? 'Clearance Processed' :
                           booking.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right">
                        {(booking.status === 'pending' || booking.status === 'approved' || booking.status === 'processing_clearance' || booking.status === 'clearance_processed') && (
                          <button
                            onClick={() => setConfirmCancelBookingId(booking.id)}
                            className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                            title="Cancel Booking"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No upcoming bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        open={confirmCancelBookingId !== null}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? You can rebook the same slot later if needed."
        confirmLabel="Cancel Booking"
        onConfirm={async () => {
          if (confirmCancelBookingId) {
            try {
              const booking = bookings.find(b => b.id === confirmCancelBookingId);
              await cancelBooking(confirmCancelBookingId);
              await createAuditLog({
                action: 'cancelled',
                entityType: 'booking',
                recordId: confirmCancelBookingId,
                userId: user?.id || '',
                userName: user?.name || '',
                bookerId: booking?.userId || user?.id || '',
              });
              setCancelError(null);
            } catch (err: any) {
              setCancelError(err?.message || 'Failed to cancel booking. Please try again.');
            }
          }
          setConfirmCancelBookingId(null);
        }}
        onCancel={() => setConfirmCancelBookingId(null)}
      />
      {cancelError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-rose-50 border border-rose-200 text-rose-700 px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
          {cancelError}
          <button onClick={() => setCancelError(null)} className="ml-3 font-bold hover:text-rose-900">✕</button>
        </div>
      )}
    </div>
  );
};
