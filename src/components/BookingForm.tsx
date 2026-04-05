import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Info, AlertTriangle, CheckCircle2, ChevronRight, Building2, ChevronLeft, Layers } from 'lucide-react';
import { format, addMinutes, parse, addWeeks, startOfDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BookingForm: React.FC = () => {
  const { facilities, bookings, addBooking, departments, locations, createAuditLog, blockedDates, getVisibleFacilities } = useAppContext();
  const { user, envEmail } = useAuth();

  const visibleFacilities = useMemo(() => {
    if (user?.role === 'super_admin') return facilities;
    return getVisibleFacilities(facilities, user?.departmentId);
  }, [facilities, user, getVisibleFacilities]);

  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const facilityRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const purposeRef = useRef<HTMLDivElement>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Generate 15-min intervals from 08:00 to 22:00
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    let current = parse('08:00', 'HH:mm', new Date());
    const end = parse('22:00', 'HH:mm', new Date());
    while (current <= end) {
      options.push(format(current, 'HH:mm'));
      current = addMinutes(current, 15);
    }
    return options;
  }, []);

  // Compute the earliest valid start time (next 15-min slot after now)
  const getEarliestStartTime = (allOptions: string[]) => {
    const now = format(new Date(), 'HH:mm');
    const future = allOptions.find(t => t > now);
    return future ?? allOptions[allOptions.length - 1];
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const initialStart = date === todayStr ? getEarliestStartTime(timeOptions) : '09:00';

  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(() => {
    const nextIdx = timeOptions.findIndex(t => t > initialStart);
    return nextIdx !== -1 ? timeOptions[nextIdx] : initialStart;
  });

  // When date changes, snap start time to earliest valid slot for today
  useEffect(() => {
    if (date === format(new Date(), 'yyyy-MM-dd')) {
      const earliest = getEarliestStartTime(timeOptions);
      if (startTime < earliest) {
        setStartTime(earliest);
      }
    }
  }, [date]);

  // Auto-adjust endTime when startTime changes
  useEffect(() => {
    if (endTime <= startTime) {
      const nextIdx = timeOptions.findIndex(t => t > startTime);
      if (nextIdx !== -1) setEndTime(timeOptions[nextIdx]);
    }
  }, [startTime]);

  // Filter start time options: only future slots when date is today
  const availableStartTimes = useMemo(() => {
    if (date === format(new Date(), 'yyyy-MM-dd')) {
      const now = format(new Date(), 'HH:mm');
      return timeOptions.filter(t => t > now);
    }
    return timeOptions;
  }, [date, timeOptions]);

  const [purpose, setPurpose] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly'>('none');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  const filteredFacilities = useMemo(() => {
    if (!selectedLocation) return [];
    return visibleFacilities.filter(f => f.locationId === selectedLocation);
  }, [visibleFacilities, selectedLocation]);

  // Conflict Checking Logic
  useEffect(() => {
    if (!selectedFacilityId || !date || !startTime || !endTime) return;

    const checkConflicts = () => {
      const newConflicts: string[] = [];
      const iterations = recurrenceType === 'weekly' ? recurrenceWeeks : 1;

      for (let i = 0; i < iterations; i++) {
        const checkDate = i === 0
          ? date
          : format(addWeeks(parse(date, 'yyyy-MM-dd', new Date()), i), 'yyyy-MM-dd');

        const hasConflict = bookings.some(b => {
          if (b.facilityId !== selectedFacilityId || b.status === 'rejected') return false;
          if (b.date !== checkDate) return false;
          // Time overlap check
          return startTime < b.endTime && endTime > b.startTime;
        });

        if (hasConflict) {
          const displayDate = parse(checkDate, 'yyyy-MM-dd', new Date());
          newConflicts.push(format(displayDate, 'MMM dd, yyyy'));
        }
      }
      setConflicts(newConflicts);
    };

    const timer = setTimeout(checkConflicts, 300);
    return () => clearTimeout(timer);
  }, [selectedFacilityId, date, startTime, endTime, recurrenceType, recurrenceWeeks, bookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate facility selection
    if (!selectedFacilityId) {
      setSubmitError('Please select a facility before booking.');
      scrollToRef(facilityRef);
      return;
    }

    // Validate purpose
    if (!purpose.trim()) {
      setSubmitError('Please enter a purpose for the booking.');
      scrollToRef(purposeRef);
      return;
    }

    // Validate date is not in the past
    const selectedDate = startOfDay(parse(date, 'yyyy-MM-dd', new Date()));
    if (selectedDate < startOfDay(new Date())) {
      setSubmitError('Please select a date in the future.');
      scrollToRef(dateRef);
      return;
    }

    // Validate start/end time
    const selectedStartDT = parse(date + ' ' + startTime, 'yyyy-MM-dd HH:mm', new Date());
    const selectedEndDT = parse(date + ' ' + endTime, 'yyyy-MM-dd HH:mm', new Date());
    if (selectedStartDT < new Date()) {
      setSubmitError('Please select a start time that is not in the past.');
      scrollToRef(dateRef);
      return;
    }
    if (selectedEndDT <= selectedStartDT) {
      setSubmitError('Please select an end time that is after the start time.');
      scrollToRef(dateRef);
      return;
    }

    // Check against blackout periods
    const blocked = blockedDates.find(bd => {
      if (!bd.isGlobal && bd.facilityId !== selectedFacilityId) return false;
      if (date < bd.startDate || date > bd.endDate) return false;
      if (bd.isFullDay) return true;
      const bdStart = bd.startTime || '00:00';
      const bdEnd = bd.endTime || '23:59';
      return startTime < bdEnd && endTime > bdStart;
    });
    if (blocked) {
      setSubmitError(`This time slot falls within a blackout period: "${blocked.reason}".`);
      scrollToRef(dateRef);
      return;
    }

    console.log('BookingForm handleSubmit called', { conflicts: conflicts.length, isSubmitting });
    if (conflicts.length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      console.log('Calling addBooking...', {
        facilityId: selectedFacilityId,
        date,
        startTime,
        endTime,
        purpose,
        recurrenceType,
        recurrenceWeeks
      });
      const createdIds = await addBooking(
        {
          facilityId: selectedFacilityId,
          userId: user?.id || '',
          userName: user?.name || '',
          userEmail: envEmail,
          date,
          startTime,
          endTime,
          purpose,
          autoApprove: selectedFacility?.autoApprove,
        },
        { type: recurrenceType, weeks: recurrenceWeeks }
      );
      console.log('addBooking resolved successfully, IDs:', createdIds);
      // Log audit entry for booking creation
      if (createdIds.length > 0) {
        await createAuditLog({
          action: 'created',
          entityType: 'booking',
          recordId: createdIds[0],
          userId: user?.id || '',
          userName: user?.name || '',
          bookerId: user?.id || '',
        });
      }
      setSuccess(true);
      setPurpose('');
    } catch (err: any) {
      console.error('Booking failed:', err);
      setSubmitError(err?.message || 'Failed to create booking. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-tutorial="booking-form" className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Form */}
        <div className="flex-1 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Book a Facility</h2>
            <p className="text-slate-500 font-medium">Reserve your space for meetings, labs, or events.</p>
          </div>

          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                <p className="text-sm font-bold text-emerald-700">Booking submitted successfully!</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => { setSuccess(false); setSelectedFacilityId(''); setSelectedLocation(''); }} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">Book Another</button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={() => (window as any).__navigateTo?.('dashboard')} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">View in Dashboard</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div ref={facilityRef} data-tutorial="booking-facility-select" className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Select Facility</label>

              {/* Location & Facility Picker */}
              {!selectedLocation ? (
                /* Step 1: Choose Location */
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Layers size={14} />
                    Choose a location to see available facilities
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {locations.map(loc => {
                      const locFacilities = visibleFacilities.filter(f => f.locationId === loc.id);
                      if (locFacilities.length === 0) return null;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(loc.id);
                            if (locFacilities.length === 1) {
                              setSelectedFacilityId(locFacilities[0].id);
                            } else {
                              setSelectedFacilityId('');
                            }
                          }}
                          className="flex flex-col items-start gap-1 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                        >
                          <span className="font-bold text-slate-800 group-hover:text-blue-800 text-sm">{loc.name}</span>
                          <span className="text-xs text-slate-400 group-hover:text-blue-500">
                            {locFacilities.length} {locFacilities.length === 1 ? 'facility' : 'facilities'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {facilities.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No facilities available.</p>
                  )}
                </div>
              ) : !selectedFacilityId ? (
                /* Step 2: Choose Facility within Location */
                <div className="space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation('');
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors mb-2"
                    >
                      <ChevronLeft size={16} />
                      Back to locations
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                       <p className="text-xs text-slate-500 font-medium">
                         {locations.find(l => l.id === selectedLocation)?.name} — select a facility
                       </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredFacilities.map(f => {
                      const deptName = departments.find(d => d.id === f.departmentId)?.name || 'Unknown Department';
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFacilityId(f.id)}
                          className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                        >
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-800 text-sm">
                              {f.name}
                            </p>
                            <p className="text-xs text-slate-400 group-hover:text-blue-500 mt-1">
                              {deptName} · Capacity: {f.capacity} pax
                            </p>
                          </div>
                          <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white rounded-full text-xs font-bold transition-all whitespace-nowrap">
                            Select <ChevronRight size={14} />
                          </span>
                        </button>
                      );
                    })}
                    {filteredFacilities.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">No facilities found in this location.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Step 3: Facility selected — show summary with change option */
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex-1">
                    <p className="font-bold text-blue-900 text-sm">{selectedFacility?.name}</p>
                    <p className="text-xs text-blue-600">
                      {locations.find(l => l.id === selectedLocation)?.name} · {departments.find(d => d.id === selectedFacility?.departmentId)?.name} · Capacity: {selectedFacility?.capacity} pax
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedFacilityId('')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                    >
                      Change Facility
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedFacilityId(''); setSelectedLocation(''); }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                    >
                      Change Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div ref={dateRef} data-tutorial="booking-datetime" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <input 
                    title="Date"
                    type="date" 
                    required
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium h-14"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Start</label>
                  <select 
                    title="Start Time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium h-14"
                  >
                    {availableStartTimes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">End</label>
                  <select 
                    title="End Time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium h-14"
                  >
                    {timeOptions.filter(t => t > startTime).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div ref={purposeRef} data-tutorial="booking-purpose" className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Purpose of Booking</label>
              <textarea 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Project Discussion, Research Meeting..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium min-h-[120px] resize-y"
              />
            </div>

            <div data-tutorial="booking-recurrence" className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-blue-600" size={20} />
                  <span className="font-bold text-blue-900">Recurring Booking</span>
                </div>
                <select 
                  title="Recurrence Type"
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as any)}
                  className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-blue-800 shadow-sm"
                >
                  <option value="none">One-time</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              {recurrenceType === 'weekly' && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <span className="text-sm font-bold text-blue-800">Repeat for</span>
                  <input 
                    title="Recurrence Weeks"
                    type="number" 
                    min="1" 
                    max={selectedFacility?.maxRecurrenceWeeks || 12}
                    value={recurrenceWeeks}
                    onChange={(e) => setRecurrenceWeeks(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 bg-white border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-blue-900"
                  />
                  <span className="text-sm font-bold text-blue-800">weeks</span>
                </div>
              )}
            </div>

            {submitError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                <p className="text-sm font-medium text-rose-700">{submitError}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting || conflicts.length > 0 || success}
              className={cn(
                "w-full h-16 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3",
                conflicts.length > 0 || success
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-[#1E3A8A] text-white hover:bg-blue-900 active:scale-[0.98]"
              )}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Check for Conflicts & Book
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Info & Conflicts */}
        <div className="w-full md:w-80 bg-slate-50 p-8 border-l border-slate-200">
          <div className="space-y-8">
            {selectedFacility ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Facility Details</h3>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <p className="font-bold text-slate-800 text-lg">{selectedFacility.name}</p>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Building2 size={16} />
                    <span>{departments.find(d => d.id === selectedFacility.departmentId)?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Info size={16} />
                    <span>Capacity: {selectedFacility.capacity} pax</span>
                  </div>
                  {selectedFacility.description && (
                    <p className="text-slate-500 text-sm leading-relaxed">{selectedFacility.description}</p>
                  )}
                  {selectedFacility.autoApprove && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                      <CheckCircle2 size={16} />
                      <span>Auto-Approved (First come, first served)</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 opacity-50">
                <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">Select a facility to see details</p>
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Conflicts Found</h3>
                </div>
                <div className="space-y-2">
                  {conflicts.map(c => (
                    <div key={c} className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-3">
                      <div className="w-2 h-2 bg-rose-500 rounded-full" />
                      <span className="text-sm font-bold text-rose-700">{c}</span>
                    </div>
                  ))}
                  <p className="text-xs text-rose-500 font-medium leading-relaxed mt-2">
                    The selected time slot is already booked on these dates. Please choose another time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
