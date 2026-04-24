import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useClearance } from '../hooks/useClearance';
import type { ClearanceEmailField, ClearanceAutoSource } from '../types';
import { ClearanceEmailTemplate } from './ClearanceEmailTemplate';
import { Calendar, Clock, Info, AlertTriangle, CheckCircle2, ChevronRight, Building2, ChevronLeft, Layers, Timer, Shield, Check } from 'lucide-react';
import { format, addMinutes, parse, addWeeks, startOfDay, addDays } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { checkTimeOverlap, checkDateTimeOverlap, validateBookingDateRange, calculateBookingDuration } from '../utils/timeUtils';
import { isGlobalAdmin } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BookingForm: React.FC = () => {
  const { facilities, bookings, addBooking, departments, locations, createAuditLog, blockedDates, getVisibleFacilities } = useAppContext();
  const { user, envEmail } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { createClearanceRecord } = useClearance();

  const visibleFacilities = useMemo(() => {
    if (isGlobalAdmin(user?.role)) return facilities;
    return getVisibleFacilities(facilities, user?.departmentId);
  }, [facilities, user, getVisibleFacilities]);

  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [facilityPickerDone, setFacilityPickerDone] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const facilityRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const purposeRef = useRef<HTMLDivElement>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Generate 15-min intervals for a full 24 hours (00:00 to 23:45)
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    let current = parse('00:00', 'HH:mm', new Date());
    const end = parse('23:45', 'HH:mm', new Date());
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
  const initialStart = date === todayStr ? getEarliestStartTime(timeOptions) : '08:00';

  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(() => {
    const nextIdx = timeOptions.findIndex(t => t > initialStart);
    return nextIdx !== -1 ? timeOptions[nextIdx] : initialStart;
  });

  // When start date changes, sync end date to match and update start time if needed
  useEffect(() => {
    // If not multi-day, enforce end date equals start date
    if (!isMultiDay) {
      setEndDate(date);
    } else if (date > endDate) {
      // If in multi-day mode but user selects a start date after the current end date
      setEndDate(date);
      setSyncMessage('✨ End date updated to match start date');
      const timer = setTimeout(() => setSyncMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    
    if (date === format(new Date(), 'yyyy-MM-dd')) {
      const earliest = getEarliestStartTime(timeOptions);
      if (startTime < earliest) {
        setStartTime(earliest);
      }
    }
  }, [date, isMultiDay, endDate, timeOptions]);

  // When toggling multi-day off, instantly reset end date
  useEffect(() => {
    if (!isMultiDay && date !== endDate) {
      setEndDate(date);
    }
  }, [isMultiDay, date, endDate]);

  // Compute live duration
  const durationPreview = useMemo(() => {
    return calculateBookingDuration(date, startTime, isMultiDay ? endDate : date, endTime);
  }, [date, startTime, endDate, endTime, isMultiDay]);

  // Auto-adjust endTime when startTime changes or end date changes
  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const effectiveEndDate = isMultiDay ? endDate : date;
    
    // For same-day bookings, end time must be after start time
    if (date === effectiveEndDate && endTime <= startTime) {
      const nextIdx = timeOptions.findIndex(t => t > startTime);
      if (nextIdx !== -1) setEndTime(timeOptions[nextIdx]);
    }
    
    // For overnight bookings (today → tomorrow), default to 08:00 on next day
    if (date === todayStr && effectiveEndDate === tomorrowStr && startTime === '08:00') {
      setEndTime('08:00');
    }
  }, [startTime, endDate, date, isMultiDay, endTime, timeOptions]);

  // Filter start time options: only future slots when date is today
  const availableStartTimes = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (date === todayStr) {
      const now = format(new Date(), 'HH:mm');
      // Only show times that are not in the past
      return timeOptions.filter(t => t > now);
    }
    return timeOptions;
  }, [date, timeOptions]);

  // Filter end time options based on date and start time
  const availableEndTimes = useMemo(() => {
    const effectiveEndDate = isMultiDay ? endDate : date;
    
    // Multi-day booking: if ending on a future date, any time allows it within the 24 hr limit
    if (effectiveEndDate > date) {
      return timeOptions;
    }
    
    // Same-day booking: only times after start time
    return timeOptions.filter(t => t > startTime);
  }, [endDate, date, startTime, timeOptions, isMultiDay]);

  const [purpose, setPurpose] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly'>('none');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedFacilities = useMemo(() => 
    facilities.filter(f => selectedFacilityIds.includes(f.id)),
    [facilities, selectedFacilityIds]
  );
  const selectedFacility = selectedFacilities[0]; // Primary facility (for backward compat)

  // State for post-submission email template modal
  const [emailTemplateState, setEmailTemplateState] = useState<{
    booking: { date: string; startTime: string; endTime: string; purpose: string; id: string };
    facility: typeof selectedFacilities[0];
    fields: ClearanceEmailField[];
    fieldsData: Record<string, string>;
  } | null>(null);

  const anyClearanceRequired = selectedFacilities.some(f => f.requestClearance);

  // Merge clearanceEmailFields across all clearance-required facilities (union by label).
  // Returns [] if no facility has clearanceEmailFields configured — ClearanceEmailTemplate
  // renders a default set in that case.
  const mergedClearanceFields = useMemo((): ClearanceEmailField[] => {
    const clearanceFacilities = selectedFacilities.filter(f => f.requestClearance);
    if (clearanceFacilities.length === 0) return [];
    const seen = new Set<string>();
    const fields: ClearanceEmailField[] = [];
    for (const f of clearanceFacilities) {
      for (const field of (f.clearanceEmailFields || [])) {
        if (!seen.has(field.label)) {
          seen.add(field.label);
          fields.push(field);
        }
      }
    }
    return fields;
  }, [selectedFacilities]);

  function resolveAutoValue(source: ClearanceAutoSource): string {
    switch (source) {
      case 'name':    return user?.name || '';
      case 'phone':   return user?.phone || '';
      case 'email':   return envEmail || user?.email || '';
      case 'date':    return date;
      case 'time':    return startTime && endTime ? `${startTime} – ${endTime}` : '';
      case 'purpose': return purpose;
      case 'facility':return selectedFacilities.find(f => f.requestClearance)?.name || '';
    }
  }

  const filteredFacilities = useMemo(() => {
    if (!selectedLocation) return [];
    return visibleFacilities.filter(f => f.locationId === selectedLocation);
  }, [visibleFacilities, selectedLocation]);

  // Conflict Checking Logic (handles multi-day & multi-facility bookings)
  useEffect(() => {
    if (selectedFacilityIds.length === 0 || !date || !endDate || !startTime || !endTime || isSubmitted) return;

    const checkConflicts = () => {
      const newConflicts: string[] = [];
      const iterations = recurrenceType === 'weekly' ? recurrenceWeeks : 1;
      const effectiveEndDate = isMultiDay ? endDate : date;

      for (let i = 0; i < iterations; i++) {
        const iterationStartDate = i === 0
          ? date
          : format(addWeeks(parse(date, 'yyyy-MM-dd', new Date()), i), 'yyyy-MM-dd');
        
        const dayOffset = Math.floor((new Date(effectiveEndDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        const iterationEndDate = i === 0
          ? effectiveEndDate
          : format(addDays(addWeeks(parse(date, 'yyyy-MM-dd', new Date()), i), dayOffset), 'yyyy-MM-dd');

        const iterStartISO = `${iterationStartDate} ${startTime}`;
        const iterEndISO = `${iterationEndDate} ${endTime}`;

        for (const facId of selectedFacilityIds) {
          let hasConflict = false;
          const facName = facilities.find(f => f.id === facId)?.name || 'Unknown';
          
          for (const b of bookings) {
            if (b.facilityId !== facId || b.status === 'rejected' || b.status === 'cancelled') continue;
            
            const exStartISO = `${b.date} ${b.startTime}`;
            const exEndISO = `${b.endDate || b.date} ${b.endTime}`;
            
            if (checkDateTimeOverlap(iterStartISO, iterEndISO, exStartISO, exEndISO)) {
              hasConflict = true;
              break;
            }
          }

          if (hasConflict) {
            const displayDate = parse(iterationStartDate, 'yyyy-MM-dd', new Date());
            if (iterationEndDate > iterationStartDate) {
              const displayEndDate = parse(iterationEndDate, 'yyyy-MM-dd', new Date());
              newConflicts.push(`${facName}: ${format(displayDate, 'MMM dd')} - ${format(displayEndDate, 'MMM dd, yyyy')}`);
            } else {
              newConflicts.push(`${facName}: ${format(displayDate, 'MMM dd, yyyy')}`);
            }
          }
        }
      }
      setConflicts(newConflicts);
    };

    const timer = setTimeout(checkConflicts, 300);
    return () => clearTimeout(timer);
}, [selectedFacilityIds, date, endDate, isMultiDay, startTime, endTime, recurrenceType, recurrenceWeeks, bookings, isSubmitted, facilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard against double-submit: prevent concurrent booking requests
    if (isSubmitting) {
      showErrorToast('Booking already in progress. Please wait...');
      return;
    }

    setSubmitError(null);

    // Validate facility selection
    if (selectedFacilityIds.length === 0) {
      setSubmitError('Please select at least one facility before booking.');
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

    // Validate start/end date range and times using date range validator
    const effectiveEndDate = isMultiDay ? endDate : date;
    const dateRangeValidation = validateBookingDateRange(date, startTime, effectiveEndDate, endTime);
    if (!dateRangeValidation.isValid) {
      setSubmitError(dateRangeValidation.error || 'Invalid date/time range.');
      scrollToRef(dateRef);
      return;
    }

    // Validate start time is not in the past
    const selectedStartDT = parse(date + ' ' + startTime, 'yyyy-MM-dd HH:mm', new Date());
    if (selectedStartDT < new Date()) {
      setSubmitError('Please select a start time that is not in the past.');
      scrollToRef(dateRef);
      return;
    }

    // Check against blackout periods for each selected facility
    for (const facId of selectedFacilityIds) {
      const blocked = blockedDates.find(bd => {
        if (!bd.isGlobal && bd.facilityId !== facId) return false;
        
        if (date >= bd.startDate && date <= bd.endDate) {
          if (bd.isFullDay) return true;
          const bdStart = bd.startTime || '00:00';
          const bdEnd = bd.endTime || '23:59';
          if (startTime < bdEnd && '22:00' > bdStart) return true;
        }
        
        const effectiveEndDate = isMultiDay ? endDate : date;
        if (effectiveEndDate != date && effectiveEndDate >= bd.startDate && effectiveEndDate <= bd.endDate) {
          if (bd.isFullDay) return true;
          const bdStart = bd.startTime || '00:00';
          const bdEnd = bd.endTime || '23:59';
          if ('08:00' < bdEnd && endTime > bdStart) return true;
        }
        
        return false;
      });
      if (blocked) {
        const facName = facilities.find(f => f.id === facId)?.name || 'Selected facility';
        setSubmitError(`${facName}: This time slot falls within a blackout period: "${blocked.reason}".`);
        scrollToRef(dateRef);
        return;
      }
    }

    console.log('BookingForm handleSubmit called', { conflicts: conflicts.length, isSubmitting });
    if (conflicts.length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      console.log('Calling addBooking...', {
        facilityIds: selectedFacilityIds,
        date,
        endDate: isMultiDay ? endDate : date,
        startTime,
        endTime,
        purpose,
        recurrenceType,
        recurrenceWeeks
      });

      // Build per-facility autoApprove map
      const autoApproveMap: Record<string, boolean> = {};
      for (const fac of selectedFacilities) {
        autoApproveMap[fac.id] = fac.requestClearance ? false : (fac.autoApprove ?? false);
      }

      const createdIds = await addBooking(
        {
          facilityId: selectedFacilityIds,
          userId: user?.id || '',
          userName: user?.name || '',
          userEmail: envEmail,
          date,
          endDate: isMultiDay ? endDate : date,
          startTime,
          endTime,
          purpose,
          autoApprove: autoApproveMap,
        },
        { type: recurrenceType, weeks: recurrenceWeeks }
      );
      console.log('addBooking resolved successfully, IDs:', createdIds);

      // Create clearance records for bookings whose facility requires clearance
      if (anyClearanceRequired && createdIds.length > 0) {
        // Build fieldsData — user_input fields stored as empty strings (filled on OSN email);
        // auto/fixed fields resolved to concrete values for the template.
        const fieldsData: Record<string, string> = {};
        for (const field of mergedClearanceFields) {
          if (field.inputType === 'auto' && field.autoSource) {
            fieldsData[field.label] = resolveAutoValue(field.autoSource);
          } else if (field.inputType === 'fixed') {
            fieldsData[field.label] = field.fixedValue ?? '';
          } else {
            fieldsData[field.label] = '';
          }
        }

        const clearanceFacilityIds = selectedFacilityIds.filter(fId =>
          selectedFacilities.find(f => f.id === fId)?.requestClearance
        );
        for (let idx = 0; idx < createdIds.length; idx++) {
          const facIdx = idx % selectedFacilityIds.length;
          const facId = selectedFacilityIds[facIdx];
          if (clearanceFacilityIds.includes(facId)) {
            await createClearanceRecord({
              bookingId: createdIds[idx],
              fullName: '',
              rank: '',
              phone: '',
              email: '',
              fieldsData,
            });
          }
        }

        // Always show the email template modal when a clearance facility was booked.
        // If no clearanceEmailFields were configured, ClearanceEmailTemplate renders a default set.
        const primaryClearanceFacility = selectedFacilities.find(f => f.requestClearance);
        if (primaryClearanceFacility) {
          setEmailTemplateState({
            booking: { date, startTime, endTime, purpose, id: createdIds[0] },
            facility: primaryClearanceFacility,
            fields: mergedClearanceFields,
            fieldsData,
          });
        }
      }

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
      
      // Show success toast and reset form
      const bookingCount = createdIds.length;
      const message = bookingCount === 1 
        ? 'Booking created successfully!' 
        : `${bookingCount} bookings created successfully!`;
      showSuccessToast(message);
      
      setSuccess(true);
      setIsSubmitted(true); // Suppress conflict detection after booking
    } catch (err: any) {
      console.error('Booking failed:', err);
      const errorMessage = err?.message || 'Failed to create booking. Check console for details.';
      setSubmitError(errorMessage);
      showErrorToast(errorMessage);
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
                <button type="button" onClick={() => { setSuccess(false); setIsSubmitted(false); setSelectedFacilityIds([]); setFacilityPickerDone(false); setSelectedLocation(''); setConflicts([]); }} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">Book Another</button>
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
                              setSelectedFacilityIds([locFacilities[0].id]);
                              setFacilityPickerDone(true);
                            } else {
                              setSelectedFacilityIds([]);
                              setFacilityPickerDone(false);
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
              ) : !facilityPickerDone ? (
                /* Step 2: Choose Facilities within Location (multi-select) */
                <div className="space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation('');
                        setSelectedFacilityIds([]);
                        setFacilityPickerDone(false);
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors mb-2"
                    >
                      <ChevronLeft size={16} />
                      Back to locations
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                       <p className="text-xs text-slate-500 font-medium">
                         {locations.find(l => l.id === selectedLocation)?.name} — select one or more facilities
                       </p>
                       {selectedFacilityIds.length > 0 && (
                         <span className="text-xs font-bold text-blue-600">{selectedFacilityIds.length} selected</span>
                       )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredFacilities.map(f => {
                      const deptName = departments.find(d => d.id === f.departmentId)?.name || 'Unknown Department';
                      const isSelected = selectedFacilityIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelectedFacilityIds(prev => 
                              prev.includes(f.id) 
                                ? prev.filter(id => id !== f.id) 
                                : [...prev, f.id]
                            );
                          }}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-xl transition-all text-left group",
                            isSelected 
                              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                              : "bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-300 group-hover:border-blue-400"
                            )}>
                              {isSelected && <Check size={14} />}
                            </div>
                            <div>
                              <p className={cn("font-bold text-sm", isSelected ? "text-blue-800" : "text-slate-800 group-hover:text-blue-800")}>
                                {f.name}
                              </p>
                              <p className={cn("text-xs mt-1", isSelected ? "text-blue-500" : "text-slate-400 group-hover:text-blue-500")}>
                                {deptName} · Capacity: {f.capacity} pax
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {filteredFacilities.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">No facilities found in this location.</p>
                    )}
                  </div>
                  {selectedFacilityIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFacilityPickerDone(true)}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      Continue with {selectedFacilityIds.length} {selectedFacilityIds.length === 1 ? 'facility' : 'facilities'}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ) : (
                /* Step 3: Facilities selected — show summary with change option */
                <div className="space-y-2">
                  {selectedFacilities.map(fac => (
                    <div key={fac.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-blue-900 text-sm truncate">{fac.name}</p>
                        <p className="text-xs text-blue-600 truncate">
                          {locations.find(l => l.id === selectedLocation)?.name} · {departments.find(d => d.id === fac.departmentId)?.name} · Capacity: {fac.capacity} pax
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setFacilityPickerDone(false)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                    >
                      Change Facilities
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedFacilityIds([]); setFacilityPickerDone(false); setSelectedLocation(''); }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                    >
                      Change Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div ref={dateRef} data-tutorial="booking-datetime" className="space-y-6">
              {/* Date Section Toggleable Grid */}
              <div className={cn("grid gap-6", isMultiDay ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    {isMultiDay ? "Start Date" : "Date"}
                  </label>
                  <div className="relative">
                    <input 
                      title="Start Date"
                      type="date" 
                      required
                      min={todayStr}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium h-14"
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  </div>
                  
                  {/* Multi-day toggle checkbox */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="multiDayToggle"
                      title="Multi-day Toggle"
                      checked={isMultiDay}
                      onChange={(e) => setIsMultiDay(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 transition-all cursor-pointer"
                    />
                    <label htmlFor="multiDayToggle" className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors select-none">
                      Multi-day / Overnight booking
                    </label>
                  </div>
                </div>

                {isMultiDay && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">End Date</label>
                    <div className="relative">
                      <input 
                        title="End Date"
                        type="date" 
                        required
                        min={date}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={cn(
                          "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium h-14",
                          syncMessage && "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50/50"
                        )}
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    </div>
                    {/* Auto-sync toast message */}
                    {syncMessage && (
                      <p className="text-xs font-bold text-emerald-600 animate-in fade-in slide-in-from-top-1 px-1">
                        {syncMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Time Section Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Start Time</label>
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
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">End Time</label>
                  <select 
                    title="End Time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium h-14"
                  >
                    {availableEndTimes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              
              {/* Duration Preview Badge */}
              {durationPreview && (
                <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
                  <Timer size={18} className="shrink-0" />
                  <p className="text-sm font-bold">
                    Total Duration: <span className="text-indigo-900">{durationPreview}</span>
                  </p>
                </div>
              )}
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

            {anyClearanceRequired && (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Shield className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-amber-900">
                  <span className="font-bold">Clearance required.</span>{' '}
                  After submitting, an email template will appear for you to send to Force Protection (FP) on OSN.
                </div>
              </div>
            )}

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
                    max={Math.min(...selectedFacilities.map(f => f.maxRecurrenceWeeks || 12), 12)}
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
            {selectedFacilities.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {selectedFacilities.length === 1 ? 'Facility Details' : `${selectedFacilities.length} Facilities Selected`}
                </h3>
                {selectedFacilities.map(fac => (
                  <div key={fac.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <p className="font-bold text-slate-800 text-lg">{fac.name}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                      <Building2 size={16} />
                      <span>{departments.find(d => d.id === fac.departmentId)?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                      <Info size={16} />
                      <span>Capacity: {fac.capacity} pax</span>
                    </div>
                    {fac.description && (
                      <p className="text-slate-500 text-sm leading-relaxed">{fac.description}</p>
                    )}
                    {fac.autoApprove && (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                        <CheckCircle2 size={16} />
                        <span>Auto-Approved</span>
                      </div>
                    )}
                    {fac.requestClearance && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm font-bold">
                        <Shield size={16} />
                        <span>Clearance Required</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 opacity-50">
                <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">Select facilities to see details</p>
              </div>
            )}

            {conflicts.length > 0 && !success && (
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
                    The selected time slot is already booked. Please choose another time or change your facility selection.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {emailTemplateState && (
        <ClearanceEmailTemplate
          booking={emailTemplateState.booking}
          facility={emailTemplateState.facility}
          fields={emailTemplateState.fields}
          fieldsData={emailTemplateState.fieldsData}
          onClose={() => setEmailTemplateState(null)}
        />
      )}
    </div>
  );
};
