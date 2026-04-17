import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { format, startOfWeek, addDays, parse, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Building2, Calendar as CalendarIcon, Ban, Phone, Mail, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isGlobalAdmin } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AvailabilityCalendar: React.FC = () => {
  const { facilities, bookings, blockedDates, locations, departments, updateBookingStatus, createAuditLog, canUserApproveFacility } = useAppContext();
  const { user } = useAuth();
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || '');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);

  const uniqueLocations = useMemo(() => {
    const locIds = facilities.map(f => f.locationId).filter((id): id is string => Boolean(id));
    const uniqueIds = Array.from(new Set(locIds));
    return locations.filter(l => uniqueIds.includes(l.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [facilities, locations]);

  const filteredFacilities = useMemo(() => {
    if (!selectedLocation) return facilities;
    return facilities.filter(f => f.locationId === selectedLocation);
  }, [facilities, selectedLocation]);

  useEffect(() => {
    if (selectedLocation && filteredFacilities.length > 0 && !filteredFacilities.find(f => f.id === selectedFacilityId)) {
      setSelectedFacilityId(filteredFacilities[0].id);
    }
  }, [selectedLocation, filteredFacilities, selectedFacilityId]);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  const canCancelBooking = (bookingFacilityId: string) => {
    if (isGlobalAdmin(user?.role)) return true;
    if ((user?.role === 'super_admin' || user?.role === 'admin') && user) {
      const facility = facilities.find(f => f.id === bookingFacilityId);
      if (!facility) return false;
      return canUserApproveFacility(user.id, user.role, facility);
    }
    return false;
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i <= 23; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
      slots.push(`${i.toString().padStart(2, '0')}:15`);
      slots.push(`${i.toString().padStart(2, '0')}:30`);
      slots.push(`${i.toString().padStart(2, '0')}:45`);
    }
    return slots;
  }, []);

  // Auto-scroll calendar to today's column on mobile
  useEffect(() => {
    const scrollContainer = calendarScrollRef.current;
    const todayCol = todayColRef.current;
    if (scrollContainer && todayCol) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const colRect = todayCol.getBoundingClientRect();
      const scrollLeft = colRect.left - containerRect.left + scrollContainer.scrollLeft - (containerRect.width / 2) + (colRect.width / 2);
      scrollContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [weekDays]);

  const getBookingAt = (day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + 15;
    const slotEnd = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

    return bookings.find(b => {
      if (b.facilityId !== selectedFacilityId || b.status === 'rejected' || b.status === 'cancelled') return false;
      
      const bEndDate = b.endDate || b.date;
      if (dayStr < b.date || dayStr > bEndDate) return false;

      const effectiveStart = dayStr === b.date ? b.startTime : '00:00';
      const effectiveEnd = dayStr === bEndDate ? b.endTime : '24:00';

      // Check if slot overlaps with effective booking times for this day
      return time < effectiveEnd && slotEnd > effectiveStart;
    });
  };

  const getBlackoutAt = (day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + 15;
    const slotEnd = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

    return blockedDates.find(bd => {
      // Must apply to this facility or be global
      if (!bd.isGlobal && bd.facilityId !== selectedFacilityId) return false;

      // Check if the day falls within the blackout date range
      if (dayStr < bd.startDate || dayStr > bd.endDate) return false;

      // If full day blackout, the entire day is blocked
      if (bd.isFullDay) return true;

      // Otherwise check time overlap
      const effectiveStart = dayStr === bd.startDate ? (bd.startTime || '00:00') : '00:00';
      const effectiveEnd = dayStr === bd.endDate ? (bd.endTime || '24:00') : '24:00';
      return time < effectiveEnd && slotEnd > effectiveStart;
    });
  };

  return (
    <div data-tutorial="availability-calendar" className="space-y-6">
      <div data-tutorial="availability-controls" className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
          <Building2 size={24} />
        </div>
        {uniqueLocations.length > 0 && (
          <select
            title="Filter by Location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="flex-1 md:w-48 h-12 px-4 bg-slate-50 border border-slate-300 shadow-sm rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm truncate"
          >
            <option value="">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        )}
        <select 
          title="Select Facility"
          value={selectedFacilityId}
          onChange={(e) => setSelectedFacilityId(e.target.value)}
          className="flex-1 md:w-64 h-12 px-4 bg-slate-50 border border-slate-300 shadow-sm rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all truncate"
        >
          {filteredFacilities.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
          </select>
        </div>

        <div className="flex items-center justify-center gap-1 w-full md:w-auto">
          <button 
            title="Previous Week"
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all shrink-0"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <CalendarIcon size={18} className="text-slate-400 shrink-0" />
            <span className="font-bold text-slate-700 whitespace-nowrap text-sm">
              {format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd, yyyy')}
            </span>
          </div>
          <button 
            title="Next Week"
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all shrink-0"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
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
      <div data-tutorial="availability-grid" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div ref={calendarScrollRef} className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-100">
              <div className="p-4 bg-slate-50/50" />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toString()}
                    ref={isToday ? todayColRef : undefined}
                    className={cn(
                      "p-4 text-center border-l border-slate-100",
                      isToday && "bg-blue-50 ring-1 ring-inset ring-blue-200"
                    )}
                  >
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-widest mb-1",
                      isToday ? "text-blue-500" : "text-slate-400"
                    )}>{format(day, 'EEE')}</p>
                    <p className={cn(
                      "text-lg font-black",
                      isToday ? "text-blue-600" : "text-slate-700"
                    )}>{format(day, 'dd')}</p>
                    {isToday && (
                      <div className="mt-1 mx-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                );
              })}
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
                      <div key={day.toString()} className={cn(
                        "h-20 border-l border-slate-50 p-1 relative group-hover:bg-slate-50/30 transition-all",
                        isSameDay(day, new Date()) && "bg-blue-50/20"
                      )}>
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
                            {booking.userEmail && (
                              <p className="text-[9px] font-bold opacity-70 truncate flex items-center gap-0.5">
                                <Mail size={8} className="shrink-0" />{booking.userEmail}
                              </p>
                            )}
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
                                className="absolute top-0.5 right-0.5 p-1 rounded-full bg-white/80 text-rose-500 hover:bg-rose-100 hover:text-rose-700 sm:opacity-0 sm:group-hover/cell:opacity-100 transition-all shadow-sm"
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
            try {
              const booking = bookings.find(b => b.id === confirmCancelBookingId);
              await updateBookingStatus(confirmCancelBookingId, 'cancelled');
              await createAuditLog({
                action: 'cancelled',
                entityType: 'booking',
                recordId: confirmCancelBookingId,
                userId: user?.id || '',
                userName: user?.name || '',
                bookerId: booking?.userId || '',
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
