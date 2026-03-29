import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { format, startOfWeek, addDays, parse, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Building2, Calendar as CalendarIcon, Ban, Phone, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AvailabilityCalendar: React.FC = () => {
  const { facilities, bookings, blockedDates, updateBookingStatus, createAuditLog } = useAppContext();
  const { user } = useAuth();
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  const canCancelBooking = (bookingFacilityId: string) => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'admin') {
      const facility = facilities.find(f => f.id === bookingFacilityId);
      return facility?.departmentId === user.departmentId;
    }
    return false;
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 8; i <= 20; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const getBookingAt = (day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const slotEnd = `${(parseInt(time.slice(0, 2)) + 1).toString().padStart(2, '0')}:00`;

    return bookings.find(b => {
      if (b.facilityId !== selectedFacilityId || b.status === 'rejected' || b.status === 'cancelled') return false;
      if (b.date !== dayStr) return false;
      // Check if slot overlaps with booking
      return time < b.endTime && slotEnd > b.startTime;
    });
  };

  const getBlackoutAt = (day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const slotEnd = `${(parseInt(time.slice(0, 2)) + 1).toString().padStart(2, '0')}:00`;

    return blockedDates.find(bd => {
      // Must apply to this facility or be global
      if (!bd.isGlobal && bd.facilityId !== selectedFacilityId) return false;

      // Check if the day falls within the blackout date range
      if (dayStr < bd.startDate || dayStr > bd.endDate) return false;

      // If full day blackout, the entire day is blocked
      if (bd.isFullDay) return true;

      // Otherwise check time overlap
      const bdStart = bd.startTime || '00:00';
      const bdEnd = bd.endTime || '23:59';
      return time < bdEnd && slotEnd > bdStart;
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Building2 size={24} />
          </div>
          <select 
            title="Select Facility"
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="flex-1 md:w-64 h-12 px-4 bg-slate-50 border border-slate-300 shadow-sm rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button 
            title="Previous Week"
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <CalendarIcon size={18} className="text-slate-400" />
            <span className="font-bold text-slate-700 whitespace-nowrap">
              {format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd, yyyy')}
            </span>
          </div>
          <button 
            title="Next Week"
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blackout</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-100">
              <div className="p-4 bg-slate-50/50" />
              {weekDays.map((day) => (
                <div key={day.toString()} className={cn(
                  "p-4 text-center border-l border-slate-100",
                  isSameDay(day, new Date()) ? "bg-blue-50/30" : ""
                )}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{format(day, 'EEE')}</p>
                  <p className={cn(
                    "text-lg font-black",
                    isSameDay(day, new Date()) ? "text-blue-600" : "text-slate-700"
                  )}>{format(day, 'dd')}</p>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="relative">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-50 group">
                  <div className="p-4 text-xs font-bold text-slate-400 text-right pr-6 self-center">{time}</div>
                  {weekDays.map((day) => {
                    const booking = getBookingAt(day, time);
                    const blackout = getBlackoutAt(day, time);
                    const showCancel = booking && canCancelBooking(booking.facilityId) && booking.status !== 'cancelled';
                    return (
                      <div key={day.toString()} className="h-20 border-l border-slate-50 p-1 relative group-hover:bg-slate-50/30 transition-all">
                        {blackout ? (
                          <div className="absolute inset-1 rounded-lg p-2 shadow-sm flex flex-col items-center justify-center overflow-hidden bg-rose-50 border border-rose-200 text-rose-600 animate-in fade-in zoom-in-95">
                            <Ban size={14} className="mb-0.5 shrink-0" />
                            <p className="text-[9px] font-bold truncate leading-tight">{blackout.reason}</p>
                          </div>
                        ) : booking ? (
                          <div className={cn(
                            "absolute inset-1 rounded-lg p-2 shadow-sm flex flex-col justify-center overflow-hidden animate-in fade-in zoom-in-95 group/cell",
                            booking.status === 'approved' ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-amber-50 border border-amber-100 text-amber-700"
                          )}>
                            <p className="text-[10px] font-black uppercase tracking-tighter truncate">{booking.userName}</p>
                            {booking.userPhone && (
                              <p className="text-[9px] font-bold opacity-70 truncate flex items-center gap-0.5">
                                <Phone size={8} className="shrink-0" />{booking.userPhone}
                              </p>
                            )}
                            <p className="text-[9px] font-bold opacity-70 truncate">{booking.purpose}</p>
                            {showCancel && (
                              <button
                                title="Cancel Booking"
                                onClick={() => setConfirmCancelBookingId(booking.id)}
                                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/80 text-rose-500 hover:bg-rose-100 hover:text-rose-700 opacity-0 group-hover/cell:opacity-100 transition-all shadow-sm"
                              >
                                <XCircle size={12} />
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancelBookingId !== null}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? The booker will see the status change."
        confirmLabel="Cancel Booking"
        onConfirm={async () => {
          if (confirmCancelBookingId) {
            const booking = bookings.find(b => b.id === confirmCancelBookingId);
            await updateBookingStatus(confirmCancelBookingId, 'cancelled');
            await createAuditLog({
              action: 'rejected',
              entityType: 'booking',
              recordId: confirmCancelBookingId,
              userId: user?.id || '',
              userName: user?.name || '',
              bookerId: booking?.userId || '',
            });
          }
          setConfirmCancelBookingId(null);
        }}
        onCancel={() => setConfirmCancelBookingId(null)}
      />
    </div>
  );
};
