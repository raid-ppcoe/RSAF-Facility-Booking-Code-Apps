import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle2, AlertCircle, Building2, User as UserIcon, Calendar, XCircle } from 'lucide-react';
import { format, parse, isAfter } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ConfirmDialog } from './ConfirmDialog';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Dashboard: React.FC = () => {
  const { bookings, facilities, cancelBooking, createAuditLog } = useAppContext();
  const { user } = useAuth();
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);

  const userBookings = bookings.filter(b => b.userId === user?.id);
  const pendingCount = userBookings.filter(b => b.status === 'pending').length;
  const approvedCount = userBookings.filter(b => b.status === 'approved').length;
  
  const toDate = (d: string, t: string) => parse(`${d} ${t}`, 'yyyy-MM-dd HH:mm', new Date());

  const upcomingBookings = userBookings
    .filter(b => (b.status === 'approved' || b.status === 'pending') && isAfter(toDate(b.date, b.startTime), new Date()))
    .sort((a, b) => toDate(a.date, a.startTime).getTime() - toDate(b.date, b.startTime).getTime());

  const stats = [
    { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Approved', value: approvedCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Facilities', value: facilities.length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Upcoming Bookings</h2>
          {upcomingBookings.length > 5 && (
            <button 
              onClick={() => setShowAllUpcoming(!showAllUpcoming)}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showAllUpcoming ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Facility</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingBookings.length > 0 ? (
                (showAllUpcoming ? upcomingBookings : upcomingBookings.slice(0, 5)).map((booking) => {
                  const facility = facilities.find(f => f.id === booking.facilityId);
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                            <Building2 size={16} />
                          </div>
                          <span className="font-bold text-slate-700">{facility?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{format(toDate(booking.date, booking.startTime), 'MMM dd, yyyy')}</span>
                          <span className="text-xs font-medium text-slate-400">{format(toDate(booking.date, booking.startTime), 'hh:mm a')} - {format(toDate(booking.date, booking.endTime), 'hh:mm a')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{booking.purpose}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          booking.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                          booking.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(booking.status === 'pending' || booking.status === 'approved') && (
                          <button
                            onClick={() => setConfirmCancelBookingId(booking.id)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
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
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
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
        message="Are you sure you want to cancel this booking? The booking status will be set to rejected."
        confirmLabel="Cancel Booking"
        onConfirm={async () => {
          if (confirmCancelBookingId) {
            const booking = bookings.find(b => b.id === confirmCancelBookingId);
            await cancelBooking(confirmCancelBookingId);
            await createAuditLog({
              action: 'rejected',
              entityType: 'booking',
              recordId: confirmCancelBookingId,
              userId: user?.id || '',
              userName: user?.name || '',
              bookerId: booking?.userId || user?.id || '',
            });
          }
          setConfirmCancelBookingId(null);
        }}
        onCancel={() => setConfirmCancelBookingId(null)}
      />
    </div>
  );
};
