import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { format, startOfWeek, endOfWeek, addDays, addMonths, parse, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Building2, Calendar as CalendarIcon, Ban, Phone, Mail, XCircle, LayoutGrid, List, X, CheckCircle2, Clock, Hourglass, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isGlobalAdmin } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Color palette for location identity dots in consolidated view
const LOCATION_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500', bgStripe: 'bg-blue-50' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', dot: 'bg-teal-500', bgStripe: 'bg-teal-50' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', dot: 'bg-purple-500', bgStripe: 'bg-purple-50' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-500', bgStripe: 'bg-orange-50' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-500', bgStripe: 'bg-pink-50' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800', dot: 'bg-indigo-500', bgStripe: 'bg-indigo-50' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', dot: 'bg-cyan-500', bgStripe: 'bg-cyan-50' },
  { bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-800', dot: 'bg-lime-500', bgStripe: 'bg-lime-50' },
  { bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-800', dot: 'bg-fuchsia-500', bgStripe: 'bg-fuchsia-50' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', dot: 'bg-rose-500', bgStripe: 'bg-rose-50' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500', bgStripe: 'bg-emerald-50' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-500', bgStripe: 'bg-amber-50' },
] as const;

// Consistent status colors used across both single and consolidated views
const STATUS_STYLES = {
  approved:             { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approved' },
  pending:              { bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Pending' },
  processing_clearance: { bg: 'bg-orange-50',  border: 'border-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500',  label: 'Processing Clearance' },
  clearance_processed:  { bg: 'bg-teal-50',    border: 'border-teal-100',    text: 'text-teal-700',    dot: 'bg-teal-500',    label: 'Clearance Processed' },
} as const;

const getStatusStyle = (status: string) =>
  STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.pending;

const STATUS_ICONS = {
  approved: CheckCircle2,
  pending: Clock,
  processing_clearance: Hourglass,
  clearance_processed: ShieldCheck,
} as const;

const getStatusIcon = (status: string) =>
  STATUS_ICONS[status as keyof typeof STATUS_ICONS] ?? Clock;

export const AvailabilityCalendar: React.FC = () => {
  const { facilities: allFacilities, bookings, blockedDates, locations, departments, updateBookingStatus, createAuditLog, canUserApproveFacility, getVisibleFacilities } = useAppContext();
  const { user } = useAuth();

  // Only show facilities this user is allowed to see. Global admins bypass the filter; for
  // everyone else (super_admin, admin, user), facilities tagged to other departments are hidden,
  // so their bookings/blackouts don't appear on the availability calendar either.
  const facilities = useMemo(
    () => (isGlobalAdmin(user?.role) ? allFacilities : getVisibleFacilities(allFacilities, user?.departmentId)),
    [allFacilities, user?.role, user?.departmentId, getVisibleFacilities]
  );

  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || '');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [consolidatedView, setConsolidatedView] = useState(false);
  const [visibleFacilityIds, setVisibleFacilityIds] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);

  const uniqueLocations = useMemo(() => {
    const locIds = facilities.map(f => f.locationId).filter((id): id is string => Boolean(id));
    const uniqueIds = Array.from(new Set(locIds));
    return locations.filter(l => uniqueIds.includes(l.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [facilities, locations]);

  const uniqueDepartments = useMemo(() => {
    const deptIds = [...new Set(facilities.map(f => f.departmentId))];
    return departments.filter(d => deptIds.includes(d.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [facilities, departments]);

  const filteredFacilities = useMemo(() => {
    let result = facilities;
    if (selectedLocation) result = result.filter(f => f.locationId === selectedLocation);
    if (selectedDepartment) result = result.filter(f => f.departmentId === selectedDepartment);
    return result;
  }, [facilities, selectedLocation, selectedDepartment]);

  useEffect(() => {
    if (consolidatedView) {
      setVisibleFacilityIds(new Set(filteredFacilities.map(f => f.id)));
    }
  }, [consolidatedView, filteredFacilities]);

  const NO_LOCATION_COLOR = { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', dot: 'bg-slate-400', bgStripe: 'bg-slate-50' } as const;

  const locationColorMap = useMemo(() => {
    const map = new Map<string, typeof LOCATION_COLORS[number]>();
    const sortedLocations = [...locations].sort((a, b) => a.name.localeCompare(b.name));
    sortedLocations.forEach((loc, i) => {
      map.set(loc.id, LOCATION_COLORS[i % LOCATION_COLORS.length]);
    });
    return map;
  }, [locations]);

  const getFacilityColors = (facilityId: string) => {
    const fac = facilities.find(f => f.id === facilityId);
    if (!fac?.locationId) return NO_LOCATION_COLOR;
    return locationColorMap.get(fac.locationId) ?? NO_LOCATION_COLOR;
  };

  useEffect(() => {
    if (filteredFacilities.length > 0 && !filteredFacilities.find(f => f.id === selectedFacilityId)) {
      setSelectedFacilityId(filteredFacilities[0].id);
    }
  }, [filteredFacilities, selectedFacilityId]);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  const canCancelBooking = (bookingFacilityId: string) => {
    if (isGlobalAdmin(user?.role)) return true;
    if ((user?.role === 'super_admin' || user?.role === 'admin') && user) {
      const facility = facilities.find(f => f.id === bookingFacilityId);
      if (!facility) return false;
      return canUserApproveFacility(user.id, user.role, facility, user.departmentId);
    }
    return false;
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(mStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
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

  useEffect(() => {
    if (calendarMode !== 'week') return;
    const scrollContainer = calendarScrollRef.current;
    const todayCol = todayColRef.current;
    if (scrollContainer && todayCol) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const colRect = todayCol.getBoundingClientRect();
      const scrollLeft = colRect.left - containerRect.left + scrollContainer.scrollLeft - (containerRect.width / 2) + (colRect.width / 2);
      scrollContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [weekDays, calendarMode]);

  // --- Slot-level helpers (week view) ---

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
      return time < effectiveEnd && slotEnd > effectiveStart;
    });
  };

  const getBlackoutAt = (day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + 15;
    const slotEnd = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

    return blockedDates.find(bd => {
      if (!bd.isGlobal && bd.facilityId !== selectedFacilityId) return false;
      if (dayStr < bd.startDate || dayStr > bd.endDate) return false;
      if (bd.isFullDay) return true;
      const effectiveStart = dayStr === bd.startDate ? (bd.startTime || '00:00') : '00:00';
      const effectiveEnd = dayStr === bd.endDate ? (bd.endTime || '24:00') : '24:00';
      return time < effectiveEnd && slotEnd > effectiveStart;
    });
  };

  const getBookingsAt = (day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + 15;
    const slotEnd = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

    return bookings.filter(b => {
      if (!visibleFacilityIds.has(b.facilityId) || b.status === 'rejected' || b.status === 'cancelled') return false;
      const bEndDate = b.endDate || b.date;
      if (dayStr < b.date || dayStr > bEndDate) return false;
      const effectiveStart = dayStr === b.date ? b.startTime : '00:00';
      const effectiveEnd = dayStr === bEndDate ? b.endTime : '24:00';
      return time < effectiveEnd && slotEnd > effectiveStart;
    });
  };

  const getConsolidatedBlackoutAt = (day: Date, time: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + 15;
    const slotEnd = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

    return blockedDates.filter(bd => {
      if (!bd.isGlobal && (!bd.facilityId || !visibleFacilityIds.has(bd.facilityId))) return false;
      if (dayStr < bd.startDate || dayStr > bd.endDate) return false;
      if (bd.isFullDay) return true;
      const effectiveStart = dayStr === bd.startDate ? (bd.startTime || '00:00') : '00:00';
      const effectiveEnd = dayStr === bd.endDate ? (bd.endTime || '24:00') : '24:00';
      return time < effectiveEnd && slotEnd > effectiveStart;
    });
  };

  // --- Day-level helpers (month view) ---

  const getBookingsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return bookings
      .filter(b => {
        if (b.status === 'rejected' || b.status === 'cancelled') return false;
        if (consolidatedView ? !visibleFacilityIds.has(b.facilityId) : b.facilityId !== selectedFacilityId) return false;
        const bEndDate = b.endDate || b.date;
        return dayStr >= b.date && dayStr <= bEndDate;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getBlackoutsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return blockedDates.filter(bd => {
      if (consolidatedView) {
        if (!bd.isGlobal && (!bd.facilityId || !visibleFacilityIds.has(bd.facilityId))) return false;
      } else {
        if (!bd.isGlobal && bd.facilityId !== selectedFacilityId) return false;
      }
      return dayStr >= bd.startDate && dayStr <= bd.endDate;
    });
  };

  const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const selectedDayBookings = selectedDay ? getBookingsForDay(selectedDay) : [];
  const selectedDayBlackouts = selectedDay ? getBlackoutsForDay(selectedDay) : [];

  return (
    <div data-tutorial="availability-calendar" className="space-y-6">
      {/* Controls */}
      <div data-tutorial="availability-controls" className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Building2 size={24} />
            </div>

            {/* Single / All Facilities toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setConsolidatedView(false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  !consolidatedView ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <List size={14} />
                Single
              </button>
              <button
                type="button"
                onClick={() => setConsolidatedView(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  consolidatedView ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutGrid size={14} />
                All Facilities
              </button>
            </div>

            {/* Month / Week toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setCalendarMode('month')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  calendarMode === 'month' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <CalendarIcon size={14} />
                Month
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('week')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  calendarMode === 'week' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <List size={14} />
                Week
              </button>
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

            {consolidatedView && uniqueDepartments.length > 1 && (
              <select
                title="Filter by Department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="flex-1 md:w-48 h-12 px-4 bg-slate-50 border border-slate-300 shadow-sm rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm truncate"
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            {!consolidatedView && (
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
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-1 w-full md:w-auto">
            <button
              type="button"
              title={calendarMode === 'month' ? 'Previous Month' : 'Previous Week'}
              onClick={() => setCurrentDate(calendarMode === 'month' ? addMonths(currentDate, -1) : addDays(currentDate, -7))}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all shrink-0"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <CalendarIcon size={18} className="text-slate-400 shrink-0" />
              <span className="font-bold text-slate-700 whitespace-nowrap text-sm">
                {calendarMode === 'month'
                  ? format(currentDate, 'MMMM yyyy')
                  : `${format(weekDays[0], 'MMM dd')} - ${format(weekDays[6], 'MMM dd, yyyy')}`
                }
              </span>
            </div>
            <button
              type="button"
              title={calendarMode === 'month' ? 'Next Month' : 'Next Week'}
              onClick={() => setCurrentDate(calendarMode === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7))}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all shrink-0"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Legend */}
          {consolidatedView ? (
            <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
              {(() => {
                const visibleLocationIds = Array.from(new Set(
                  filteredFacilities
                    .filter(f => visibleFacilityIds.has(f.id) && f.locationId)
                    .map(f => f.locationId as string)
                ));
                const visibleLocs = locations
                  .filter(l => visibleLocationIds.includes(l.id))
                  .sort((a, b) => a.name.localeCompare(b.name));
                return visibleLocs.map(loc => {
                  const colors = locationColorMap.get(loc.id) ?? NO_LOCATION_COLOR;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        setVisibleFacilityIds(prev => {
                          const next = new Set(prev);
                          const locFacilityIds = filteredFacilities
                            .filter(f => f.locationId === loc.id)
                            .map(f => f.id);
                          const remainingAfter = Array.from(next).filter(id => !locFacilityIds.includes(id));
                          if (remainingAfter.length > 0) {
                            locFacilityIds.forEach(id => next.delete(id));
                          }
                          return next;
                        });
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all border",
                        colors.bg, colors.border, colors.text
                      )}
                    >
                      <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                      {loc.name}
                    </button>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
              {Object.values(STATUS_STYLES).map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", s.dot)} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blackout</span>
              </div>
            </div>
          )}
        </div>

        {/* Status legend for consolidated view */}
        {consolidatedView && (
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            {(Object.keys(STATUS_STYLES) as Array<keyof typeof STATUS_STYLES>).map(key => {
              const s = STATUS_STYLES[key];
              const Icon = STATUS_ICONS[key];
              return (
                <div key={s.label} className="flex items-center gap-1.5 text-slate-500">
                  <Icon size={12} />
                  <span className="text-[10px] font-bold">{s.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-rose-500">
              <Ban size={12} />
              <span className="text-[10px] font-bold text-slate-500">Blackout</span>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div data-tutorial="availability-grid" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {calendarMode === 'month' ? (
          // ── Month View ──────────────────────────────────────────────────────
          <div>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_HEADERS.map(h => (
                <div key={h} className="py-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400 border-l border-slate-100 first:border-l-0">
                  {h}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                const inMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const dayBookings = getBookingsForDay(day);
                const dayBlackouts = getBlackoutsForDay(day);
                const hasBlackout = dayBlackouts.length > 0;
                const visibleChips = dayBookings.slice(0, 3);
                const overflowCount = dayBookings.length - 3;

                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-[96px] p-2 border-b border-l border-slate-100 cursor-pointer transition-colors",
                      idx % 7 === 0 && "border-l-0",
                      inMonth ? "bg-white hover:bg-slate-50/70" : "bg-slate-50/40",
                      hasBlackout && inMonth && "bg-rose-50/40",
                      isToday && "bg-blue-50/40"
                    )}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-end mb-1">
                      <span className={cn(
                        "w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full",
                        isToday ? "bg-blue-600 text-white" : inMonth ? "text-slate-700" : "text-slate-300"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Blackout indicator */}
                    {hasBlackout && inMonth && (
                      <div className="flex items-center gap-1 mb-0.5 px-1 py-0.5 rounded bg-rose-100 border border-rose-200">
                        <Ban size={9} className="text-rose-500 shrink-0" />
                        <span className="text-[9px] font-bold text-rose-600 truncate">{dayBlackouts[0].reason}</span>
                      </div>
                    )}

                    {/* Booking chips */}
                    {inMonth && visibleChips.map(b => {
                      const s = getStatusStyle(b.status);
                      const label = consolidatedView
                        ? (facilities.find(f => f.id === b.facilityId)?.name || '')
                        : b.purpose;
                      const facColors = getFacilityColors(b.facilityId);
                      const StatusIcon = getStatusIcon(b.status);
                      const chipColors = consolidatedView ? facColors : s;
                      return (
                        <div
                          key={b.id}
                          className={cn(
                            "flex items-center gap-1 mb-0.5 px-1.5 py-0.5 rounded border text-[10px] font-bold truncate",
                            chipColors.bg, chipColors.border, chipColors.text
                          )}
                          title={`${label} — ${b.startTime}–${b.endTime} (${s.label})`}
                        >
                          {consolidatedView && (
                            <StatusIcon size={10} className="shrink-0" />
                          )}
                          <span className="truncate">{label}</span>
                        </div>
                      );
                    })}
                    {overflowCount > 0 && inMonth && (
                      <div className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        +{overflowCount} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // ── Week View (unchanged) ────────────────────────────────────────────
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
                      if (consolidatedView) {
                        const slotBookings = getBookingsAt(day, time);
                        const slotBlackouts = getConsolidatedBlackoutAt(day, time);

                        return (
                          <div key={day.toString()} className={cn(
                            "h-20 border-l border-slate-50 p-0.5 relative group-hover:bg-slate-50/30 transition-all",
                            isSameDay(day, new Date()) && "bg-blue-50/20"
                          )}>
                            {slotBlackouts.length > 0 && slotBookings.length === 0 ? (
                              <div className="absolute inset-0.5 rounded-lg p-1 flex flex-col items-center justify-center overflow-hidden bg-rose-50 border border-rose-200 text-rose-600">
                                <Ban size={12} className="shrink-0 mb-0.5" />
                                <p className="text-[8px] font-bold truncate leading-tight">{slotBlackouts[0].reason}</p>
                              </div>
                            ) : slotBookings.length > 0 ? (
                              <div className="absolute inset-0.5 flex flex-col gap-0.5 overflow-hidden rounded-lg p-0.5">
                                {slotBookings.map(b => {
                                  const s = getStatusStyle(b.status);
                                  const facName = facilities.find(f => f.id === b.facilityId)?.name || '';
                                  const facColors = getFacilityColors(b.facilityId);
                                  const StatusIcon = getStatusIcon(b.status);
                                  return (
                                    <div
                                      key={b.id}
                                      className={cn(
                                        "flex-1 min-h-[14px] rounded-md px-1.5 py-0.5 overflow-hidden flex items-center gap-1 border",
                                        facColors.bg, facColors.text, facColors.border
                                      )}
                                      title={`${facName} — ${b.userName}: ${b.purpose} (${s.label})`}
                                    >
                                      <StatusIcon size={10} className="shrink-0" />
                                      <span className="text-[8px] font-bold truncate">{facName}</span>
                                      {slotBookings.length <= 2 && (
                                        <span className="text-[7px] opacity-70 truncate ml-auto">{b.userName}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      }

                      // Single facility view
                      const booking = getBookingAt(day, time);
                      const blackout = getBlackoutAt(day, time);
                      const showCancel = booking && canCancelBooking(booking.facilityId) && booking.status !== 'cancelled';
                      const bookingStyle = booking ? getStatusStyle(booking.status) : null;
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
                          ) : booking && bookingStyle ? (
                            <div className={cn(
                              "absolute inset-1 rounded-lg p-2 shadow-sm flex flex-col justify-center overflow-hidden animate-in fade-in zoom-in-95 group/cell border",
                              bookingStyle.bg, bookingStyle.border, bookingStyle.text
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
                                  type="button"
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
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDay(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{format(selectedDay, 'EEEE')}</p>
                <h3 className="text-lg font-black text-slate-800">{format(selectedDay, 'dd MMMM yyyy')}</h3>
              </div>
              <button
                type="button"
                title="Close"
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {selectedDayBlackouts.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Blackout Periods</p>
                  {selectedDayBlackouts.map((bd, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-2">
                      <Ban size={16} className="text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-rose-700">{bd.reason}</p>
                        <p className="text-xs text-rose-500 mt-0.5">
                          {bd.isFullDay ? 'Full day' : `${bd.startTime || '00:00'} – ${bd.endTime || '24:00'}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDayBookings.length === 0 && selectedDayBlackouts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <CalendarIcon size={32} className="mb-3 opacity-30" />
                  <p className="font-medium text-sm">No bookings for this day</p>
                </div>
              )}

              {selectedDayBookings.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bookings</p>
                  {selectedDayBookings.map(b => {
                    const s = getStatusStyle(b.status);
                    const facility = facilities.find(f => f.id === b.facilityId);
                    const facColors = getFacilityColors(b.facilityId);
                    const StatusIcon = getStatusIcon(b.status);
                    const rowColors = consolidatedView ? facColors : s;
                    const showCancel = canCancelBooking(b.facilityId) && b.status !== 'cancelled';
                    return (
                      <div key={b.id} className={cn("flex items-start gap-3 p-4 rounded-xl border mb-2", rowColors.bg, rowColors.border)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border", s.bg, s.border, s.text)}>
                              <StatusIcon size={10} />
                              {s.label}
                            </span>
                            <span className={cn("text-xs font-bold", rowColors.text)}>
                              {b.startTime} – {b.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {consolidatedView && (
                              <div className={cn("w-2 h-2 rounded-full shrink-0", facColors.dot)} />
                            )}
                            <p className={cn("text-sm font-bold truncate", rowColors.text)}>
                              {facility?.name || '—'}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{b.purpose}</p>
                          {b.userName && (
                            <p className="text-xs text-slate-400 mt-0.5">{b.userName}</p>
                          )}
                        </div>
                        {showCancel && (
                          <button
                            type="button"
                            title="Cancel Booking"
                            onClick={() => { setConfirmCancelBookingId(b.id); setSelectedDay(null); }}
                            className="p-2 rounded-lg bg-white/80 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-all shadow-sm shrink-0"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
          <button type="button" title="Dismiss" onClick={() => setCancelError(null)} className="ml-3 font-bold hover:text-rose-900">✕</button>
        </div>
      )}
    </div>
  );
};
