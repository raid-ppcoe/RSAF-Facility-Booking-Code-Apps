import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Info, AlertTriangle, CheckCircle2, ChevronRight, Building2 } from 'lucide-react';
import { format, addMinutes, parse, addWeeks, startOfDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BookingForm: React.FC = () => {
  const { facilities, bookings, addBooking, departments, createAuditLog, blockedDates } = useAppContext();
  const { user } = useAuth();

  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly'>('none');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  // Generate 30-min intervals
  const timeOptions = useMemo(() => {
    const options = [];
    let current = parse('08:00', 'HH:mm', new Date());
    const end = parse('22:00', 'HH:mm', new Date());
    while (current <= end) {
      options.push(format(current, 'HH:mm'));
      current = addMinutes(current, 30);
    }
    return options;
  }, []);

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

    // Validate date is not in the past
    const selectedDate = startOfDay(parse(date, 'yyyy-MM-dd', new Date()));
    if (selectedDate < startOfDay(new Date())) {
      setSubmitError('Select a date in the future.');
      return;
    }

    // Validate start/end time
    const selectedStartDT = parse(date + ' ' + startTime, 'yyyy-MM-dd HH:mm', new Date());
    const selectedEndDT = parse(date + ' ' + endTime, 'yyyy-MM-dd HH:mm', new Date());
    if (selectedStartDT < new Date()) {
      setSubmitError('Start time cannot be in the past.');
      return;
    }
    if (selectedEndDT <= selectedStartDT) {
      setSubmitError('End time must be after the start time.');
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
      await addBooking(
        {
          facilityId: selectedFacilityId,
          userId: user?.id || '',
          userName: user?.name || '',
          date,
          startTime,
          endTime,
          purpose,
        },
        { type: recurrenceType, weeks: recurrenceWeeks }
      );
      console.log('addBooking resolved successfully');
      // Log audit entry for booking creation
      await createAuditLog({
        action: 'created',
        entityType: 'booking',
        recordId: selectedFacilityId,
        userId: user?.id || '',
        userName: user?.name || '',
        bookerId: user?.id || '',
      });
      setSuccess(true);
      setSelectedFacilityId('');
      setPurpose('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Booking failed:', err);
      setSubmitError(err?.message || 'Failed to create booking. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Form */}
        <div className="flex-1 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Book a Facility</h2>
            <p className="text-slate-500 font-medium">Reserve your space for meetings, labs, or events.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Select Facility</label>
              <select 
                title="Select Facility"
                required
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium h-14"
              >
                <option value="">Choose a room...</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (Cap: {f.capacity})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
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
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Purpose of Booking</label>
              <textarea 
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Project Discussion, Research Meeting..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium min-h-[120px] resize-y"
              />
            </div>

            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
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
              disabled={isSubmitting || conflicts.length > 0}
              className={cn(
                "w-full h-16 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3",
                conflicts.length > 0 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-[#1E3A8A] text-white hover:bg-blue-900 active:scale-[0.98]"
              )}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 size={24} />
                  Booking Successful!
                </>
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
