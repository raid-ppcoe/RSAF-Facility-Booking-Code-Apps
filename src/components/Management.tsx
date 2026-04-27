import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUsers } from '../hooks/useUsers';
import { useClearance } from '../hooks/useClearance';
import { useClearanceEmails, type ClearanceEmailRecipient, type ClearanceEmailSuggestion } from '../hooks/useClearanceEmails';
import { ConfirmDialog } from './ConfirmDialog';
import type { ApprovalMode, ClearanceEmailField, ClearanceFieldInputType, ClearanceAutoSource } from '../types';
import { isGlobalAdmin, isSuperAdminOrAbove, isAdminOrAbove } from '../types';
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
  ScrollText,
  Loader2,
  Shield,
  UserCheck,
  Eye,
  Crown,
  Mail
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Facility, Booking, ClearanceRecord } from '../types';
import { GripVertical } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sub-component for clearance booking rows with expandable clearance details
const ClearanceBookingRow: React.FC<{
  booking: Booking;
  facility: Facility | undefined;
  onMarkProcessed: () => void;
  onReject: () => void;
  onDelete: () => void;
  getClearanceByBookingId: (bookingId: string) => Promise<ClearanceRecord | null>;
}> = ({ booking, facility, onMarkProcessed, onReject, onDelete, getClearanceByBookingId }) => {
  const [expanded, setExpanded] = useState(false);
  const [clearance, setClearance] = useState<ClearanceRecord | null>(null);
  const [loadingClearance, setLoadingClearance] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !clearance) {
      setLoadingClearance(true);
      const record = await getClearanceByBookingId(booking.id);
      setClearance(record);
      setLoadingClearance(false);
    }
    setExpanded(!expanded);
  };

  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-all">
        <td className="px-3 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs">
              {booking.userName.charAt(0)}
            </div>
            <span className="font-bold text-slate-700">{booking.userName}</span>
          </div>
        </td>
        <td className="px-3 sm:px-6 py-4">
          <span className="text-sm font-medium text-slate-600">{facility?.name}</span>
        </td>
        <td className="px-3 sm:px-6 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">
              {booking.endDate && booking.endDate !== booking.date
                ? `${format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'MMM dd')} - ${format(parse(booking.endDate, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}`
                : format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}
            </span>
            <span className="text-xs font-medium text-slate-400">{booking.startTime} - {booking.endTime}</span>
          </div>
        </td>
        <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
          <span className="text-sm text-slate-500 italic">"{booking.purpose}"</span>
        </td>
        <td className="px-3 sm:px-6 py-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
            Processing Clearance
          </span>
        </td>
        <td className="px-3 sm:px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExpand}
              className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
              title="View Clearance Details"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={onMarkProcessed}
              className="p-2.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition-all"
              title="Mark Clearance Processed"
            >
              <Shield size={18} />
            </button>
            <button
              onClick={onReject}
              className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
              title="Reject"
            >
              <X size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
              title="Delete Booking"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-amber-50/30">
          <td colSpan={6} className="px-6 py-4">
            {loadingClearance ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading clearance details...
              </div>
            ) : clearance ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {clearance.fieldsData && Object.keys(clearance.fieldsData).length > 0
                  ? Object.entries(clearance.fieldsData).map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
                      </div>
                    ))
                  : (
                    <>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                        <p className="text-sm font-medium text-slate-700">{clearance.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rank</p>
                        <p className="text-sm font-medium text-slate-700">{clearance.rank}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                        <p className="text-sm font-medium text-slate-700">{clearance.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm font-medium text-slate-700">{clearance.email}</p>
                      </div>
                    </>
                  )
                }
              </div>
            ) : (
              <p className="text-sm text-slate-400">No clearance details found for this booking.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export const Management: React.FC = () => {
  const { 
    bookings, 
    updateBookingStatus,
    deleteBooking, 
    facilities, 
    departments, 
    locations,
    addFacility, 
    updateFacility, 
    deleteFacility,
    getDepartmentForBooking,
    auditLogs,
    auditLoading,
    auditError,
    createAuditLog,
    reloadAuditLogs,
    facilityApprovers,
    addFacilityApprover,
    removeFacilityApprover,
    getApproversForFacility,
    canUserApproveFacility,
    getUserFacilityIds,
    facilityDepartments,
    addFacilityDepartment,
    removeFacilityDepartment,
    getDepartmentsForFacility,
  } = useAppContext();
  const { user: currentUser } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { users, roles, updateUserRole, createUser, updateUser, checkEmailExists } = useUsers();
  const { getClearanceByBookingId } = useClearance();
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<any>(null);
  const [confirmDeleteFacilityId, setConfirmDeleteFacilityId] = useState<string | null>(null);
  const [confirmDeleteBookingId, setConfirmDeleteBookingId] = useState<string | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [facilityFormError, setFacilityFormError] = useState<string | null>(null);
  
  const [facilityFormData, setFacilityFormData] = useState({
    name: '',
    departmentId: '',
    capacity: 10,
    maxRecurrenceWeeks: 4,
    description: '',
    locationId: '',
    autoApprove: false,
    approvalMode: 'department_admins' as ApprovalMode,
    requestClearance: false,
    clearanceEmailFields: [] as ClearanceEmailField[],
  });

  // Clearance email recipients state (per-facility "To:" list, with autocomplete pool)
  const { getClearanceEmailsForFacility, getAllKnownEmails, addClearanceEmail, removeClearanceEmail } = useClearanceEmails();
  const [facilityRecipients, setFacilityRecipients] = useState<ClearanceEmailRecipient[]>([]);
  const [knownEmailSuggestions, setKnownEmailSuggestions] = useState<ClearanceEmailSuggestion[]>([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientDisplayName, setNewRecipientDisplayName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Approver management state for facility modal
  const [approverUserId, setApproverUserId] = useState('');

  // Manager (super admin) tagging state for facility modal
  const [managerUserId, setManagerUserId] = useState('');

  // Department visibility state for facility modal
  const [visibilityDeptId, setVisibilityDeptId] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userDeptFilter, setUserDeptFilter] = useState('');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    roleId: ''
  });

  // Email validation state for duplicate checking
  const [emailValidation, setEmailValidation] = useState({
    isChecking: false,
    isDuplicate: false,
    existingProfile: null as any
  });
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleOpenFacilityModal = (facility?: any) => {
    if (facility) {
      setEditingFacility(facility);
      setFacilityFormData({
        name: facility.name,
        departmentId: facility.departmentId,
        capacity: facility.capacity,
        maxRecurrenceWeeks: facility.maxRecurrenceWeeks || 4,
        description: facility.description || '',
        locationId: facility.locationId || '',
        autoApprove: facility.autoApprove || false,
        approvalMode: facility.approvalMode || 'department_admins',
        requestClearance: facility.requestClearance || false,
        clearanceEmailFields: facility.clearanceEmailFields || [],
      });
    } else {
      setEditingFacility(null);
      setFacilityFormData({
        name: '',
        departmentId: !isGlobalAdmin(currentUser?.role) ? currentUser?.departmentId || '' : '',
        capacity: 10,
        maxRecurrenceWeeks: 4,
        description: '',
        locationId: '',
        autoApprove: false,
        approvalMode: 'department_admins',
        requestClearance: false,
        clearanceEmailFields: [],
      });
    }
    setApproverUserId('');
    setManagerUserId('');
    setVisibilityDeptId('');
    setFacilityFormError(null);
    setNewRecipientEmail('');
    setNewRecipientDisplayName('');
    setShowSuggestions(false);
    if (facility?.id) {
      getClearanceEmailsForFacility(facility.id).then(setFacilityRecipients);
    } else {
      setFacilityRecipients([]);
    }
    getAllKnownEmails().then(setKnownEmailSuggestions);
    setIsFacilityModalOpen(true);
  };

  const handleAddRecipient = async () => {
    if (!editingFacility) return;
    const email = newRecipientEmail.trim();
    if (!email) return;
    if (facilityRecipients.some(r => r.email.toLowerCase() === email.toLowerCase())) {
      setFacilityFormError('This email is already added to this facility.');
      return;
    }
    try {
      await addClearanceEmail({
        facilityId: editingFacility.id,
        email,
        displayName: newRecipientDisplayName.trim() || email,
      });
      const refreshed = await getClearanceEmailsForFacility(editingFacility.id);
      setFacilityRecipients(refreshed);
      setKnownEmailSuggestions(await getAllKnownEmails());
      setNewRecipientEmail('');
      setNewRecipientDisplayName('');
      setShowSuggestions(false);
      setFacilityFormError(null);
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to add recipient');
    }
  };

  const handleRemoveRecipient = async (recipientId: string) => {
    try {
      await removeClearanceEmail(recipientId);
      setFacilityRecipients(prev => prev.filter(r => r.id !== recipientId));
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to remove recipient');
    }
  };

  // Filter suggestions: match email or display name, exclude already-added recipients
  const filteredSuggestions = useMemo(() => {
    const q = newRecipientEmail.trim().toLowerCase();
    const addedEmails = new Set(facilityRecipients.map(r => r.email.toLowerCase()));
    const pool = knownEmailSuggestions.filter(s => !addedEmails.has(s.email.toLowerCase()));
    if (!q) return pool.slice(0, 8);
    return pool
      .filter(s => s.email.toLowerCase().includes(q) || s.displayName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [newRecipientEmail, knownEmailSuggestions, facilityRecipients]);

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
        const newFacilityId = await addFacility({
          ...facilityFormData
        } as any);
        // Auto-tag creator as an approver for the new facility
        if (newFacilityId && currentUser && !isGlobalAdmin(currentUser.role)) {
          try {
            await addFacilityApprover(newFacilityId, 'user', currentUser.id, undefined, currentUser.name);
          } catch {
            // Non-critical — facility was created, approver tagging can be done manually
          }
        }
      }
      setIsFacilityModalOpen(false);
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to save facility');
    }
  };

  // Approver helpers for the facility modal
  const currentFacilityApprovers = editingFacility ? getApproversForFacility(editingFacility.id) : [];

  // Get super_admin users for the facility managers dropdown
  const superAdminUsers = useMemo(() => {
    return users.filter(u => u.roleName === 'super_admin');
  }, [users]);

  // Get admin users for the approver dropdown (excludes super_admins to avoid duplicates with Managers section)
  const adminUsers = useMemo(() => {
    return users.filter(u => u.roleName === 'admin');
  }, [users]);

  // IDs of super_admin users (used to split currentFacilityApprovers into managers vs approvers)
  const superAdminUserIds = useMemo(() => new Set(superAdminUsers.map(u => u.id)), [superAdminUsers]);

  // Split current facility approvers into managers (super admins) and regular approvers (admins)
  const currentFacilityManagers = useMemo(
    () => currentFacilityApprovers.filter(a => a.approverType === 'user' && a.approverProfileId && superAdminUserIds.has(a.approverProfileId)),
    [currentFacilityApprovers, superAdminUserIds]
  );
  const currentFacilityAdminApprovers = useMemo(
    () => currentFacilityApprovers.filter(a => !(a.approverType === 'user' && a.approverProfileId && superAdminUserIds.has(a.approverProfileId))),
    [currentFacilityApprovers, superAdminUserIds]
  );

  const handleAddApprover = async () => {
    if (!editingFacility) return;
    try {
      if (approverUserId) {
        const selectedUser = users.find(u => u.id === approverUserId);
        await addFacilityApprover(editingFacility.id, 'user', approverUserId, undefined, selectedUser?.name || '');
        setApproverUserId('');
      }
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to add approver');
    }
  };

  const handleAddManager = async () => {
    if (!editingFacility) return;
    try {
      if (managerUserId) {
        const selectedUser = users.find(u => u.id === managerUserId);
        await addFacilityApprover(editingFacility.id, 'user', managerUserId, undefined, selectedUser?.name || '');
        setManagerUserId('');
      }
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to add facility manager');
    }
  };

  const handleRemoveApprover = async (approverId: string) => {
    try {
      await removeFacilityApprover(approverId);
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to remove approver');
    }
  };

  // Department visibility helpers for the facility modal
  const currentFacilityDepts = editingFacility ? getDepartmentsForFacility(editingFacility.id) : [];

  const handleAddVisibilityDept = async () => {
    if (!editingFacility || !visibilityDeptId) return;
    // Prevent duplicates
    if (currentFacilityDepts.some(fd => fd.departmentId === visibilityDeptId)) return;
    try {
      await addFacilityDepartment(editingFacility.id, visibilityDeptId);
      if (currentUser) {
        const deptName = departments.find(d => d.id === visibilityDeptId)?.name || '';
        await createAuditLog({
          action: 'Update' as any,
          entityType: 'FacilityDepartment',
          recordId: editingFacility.id,
          userId: currentUser.id,
          userName: currentUser.name,
        });
      }
      setVisibilityDeptId('');
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to add department visibility');
    }
  };

  // Real-time email validation with debouncing
  const handleEmailChange = useCallback(async (newEmail: string) => {
    setUserFormData(prev => ({ ...prev, email: newEmail }));

    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Clear validation state if email is empty
    if (!newEmail.trim()) {
      setEmailValidation({ isChecking: false, isDuplicate: false, existingProfile: null });
      return;
    }

    // Set loading state
    setEmailValidation(prev => ({ ...prev, isChecking: true }));

    // Debounce the check (500ms)
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const existingProfile = await checkEmailExists(newEmail, editingUser?.id);
        if (existingProfile) {
          setEmailValidation({
            isChecking: false,
            isDuplicate: true,
            existingProfile
          });
        } else {
          setEmailValidation({ isChecking: false, isDuplicate: false, existingProfile: null });
        }
      } catch (err) {
        console.error('Error checking email:', err);
        setEmailValidation({ isChecking: false, isDuplicate: false, existingProfile: null });
      }
    }, 500);
  }, [checkEmailExists, editingUser?.id]);

  // Cleanup timeout on modal close
  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, []);

  // Reset email validation when opening modal
  useEffect(() => {
    if (isUserModalOpen) {
      setEmailValidation({ isChecking: false, isDuplicate: false, existingProfile: null });
    }
  }, [isUserModalOpen]);

  const handleRemoveVisibilityDept = async (fdId: string) => {
    try {
      await removeFacilityDepartment(fdId);
      if (currentUser && editingFacility) {
        await createAuditLog({
          action: 'Update' as any,
          entityType: 'FacilityDepartment',
          recordId: editingFacility.id,
          userId: currentUser.id,
          userName: currentUser.name,
        });
      }
    } catch (err: any) {
      setFacilityFormError(err.message || 'Failed to remove department visibility');
    }
  };

  // Precompute the set of facility IDs this user can manage
  const managedFacilityIds = currentUser
    ? getUserFacilityIds(currentUser.id, currentUser.role, facilities, currentUser.departmentId)
    : new Set<string>();

  // Filter bookings based on role and facility approver tags
  const filteredBookings = bookings.filter(b => {
    if (!currentUser) return false;
    if (isGlobalAdmin(currentUser.role)) return true;
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      return managedFacilityIds.has(b.facilityId);
    }
    return false;
  });

  const pendingBookings = filteredBookings.filter(b => b.status === 'pending');
  const processingClearanceBookings = filteredBookings.filter(b => b.status === 'processing_clearance');

  // Filter audit logs by managed facilities; global_admin sees all
  const filteredAuditLogs = isGlobalAdmin(currentUser?.role)
    ? auditLogs
    : auditLogs.filter(log => {
        const booking = bookings.find(b => b.id === log.recordId);
        if (!booking) return false;
        return managedFacilityIds.has(booking.facilityId);
      });

  const handleApprove = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking?.status !== 'pending') {
      console.warn(`Cannot approve booking ${bookingId}: current status is ${booking?.status}`);
      return;
    }
    try {
      // Check if facility requires clearance
      const facility = facilities.find(f => f.id === booking.facilityId);
      const targetStatus = facility?.requestClearance ? 'processing_clearance' : 'approved';
      
      await updateBookingStatus(bookingId, targetStatus);
      await createAuditLog({
        action: 'approved',
        entityType: 'booking',
        recordId: bookingId,
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
        bookerId: booking?.userId || '',
      });
      reloadAuditLogs();
      showSuccessToast(facility?.requestClearance ? 'Booking approved — clearance processing required' : 'Booking approved successfully');
    } catch (err: any) {
      console.error('Failed to approve booking:', err);
      showErrorToast(err?.message || 'Failed to approve booking');
    }
  };

  const handleMarkClearanceProcessed = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking?.status !== 'processing_clearance') {
      console.warn(`Cannot mark clearance processed for booking ${bookingId}: current status is ${booking?.status}`);
      return;
    }
    try {
      await updateBookingStatus(bookingId, 'clearance_processed');
      await createAuditLog({
        action: 'approved',
        entityType: 'booking',
        recordId: bookingId,
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
        bookerId: booking?.userId || '',
      });
      reloadAuditLogs();
      showSuccessToast('Clearance processed successfully');
    } catch (err: any) {
      console.error('Failed to mark clearance processed:', err);
      showErrorToast(err?.message || 'Failed to mark clearance processed');
    }
  };

  const handleReject = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking?.status !== 'pending') {
      console.warn(`Cannot reject booking ${bookingId}: current status is ${booking?.status}`);
      return;
    }
    try {
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
      showSuccessToast('Booking rejected successfully');
    } catch (err: any) {
      console.error('Failed to reject booking:', err);
      showErrorToast(err?.message || 'Failed to reject booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    try {
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
      showSuccessToast('Booking deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete booking:', err);
      showErrorToast(err?.message || 'Failed to delete booking');
    }
  };

  const handleBulkApprove = async () => {
    for (const bookingId of selectedBookings) {
      await handleApprove(bookingId);
    }
    setSelectedBookings([]);
  };

  const handleBulkReject = async () => {
    for (const bookingId of selectedBookings) {
      await handleReject(bookingId);
    }
    setSelectedBookings([]);
  };

  return (
    <div data-tutorial="management-panel" className="space-y-8">
      {/* Sub-tabs */}
      <div data-tutorial="management-tabs" className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit">
        <button 
          onClick={() => setActiveSubTab('requests')}
          className={cn(
            "px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
            activeSubTab === 'requests' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Booking Requests
        </button>
        {isAdminOrAbove(currentUser?.role) && (
          <>
            <button 
              onClick={() => setActiveSubTab('facilities')}
              className={cn(
                "px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
                activeSubTab === 'facilities' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Facilities
            </button>
          </>
        )}
        {isSuperAdminOrAbove(currentUser?.role) && (
          <>
            <button 
              onClick={() => setActiveSubTab('users')}
              className={cn(
                "px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
                activeSubTab === 'users' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              User Roles
            </button>
            <button 
              onClick={() => setActiveSubTab('auditlog')}
              className={cn(
                "px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
                activeSubTab === 'auditlog' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Audit Log
            </button>
          </>
        )}
      </div>

      {activeSubTab === 'requests' && (
        <div data-tutorial="management-requests" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Pending Requests</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {selectedBookings.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mr-2 sm:mr-4">
                  <span className="text-sm font-bold text-slate-500 mr-2">{selectedBookings.length} selected</span>
                  <button 
                    onClick={handleBulkApprove}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-all"
                  >
                    <Check size={16} /> Approve Selected
                  </button>
                  <button 
                    onClick={handleBulkReject}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-bold transition-all"
                  >
                    <X size={16} /> Reject Selected
                  </button>
                </div>
              )}
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                {pendingBookings.length} Pending
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-3 sm:px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      aria-label="Select all bookings"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedBookings.length > 0 && selectedBookings.length === pendingBookings.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBookings(pendingBookings.map(b => b.id));
                        } else {
                          setSelectedBookings([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-4">User</th>
                  <th className="px-3 sm:px-6 py-4">Facility</th>
                  <th className="px-3 sm:px-6 py-4">Date & Time</th>
                  <th className="px-3 sm:px-6 py-4 hidden sm:table-cell">Purpose</th>
                  <th className="px-3 sm:px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingBookings.length > 0 ? (
                  pendingBookings.map((booking) => {
                    const facility = facilities.find(f => f.id === booking.facilityId);
                    return (
                      <tr key={booking.id} className={cn("hover:bg-slate-50/50 transition-all", selectedBookings.includes(booking.id) ? "bg-blue-50/30" : "")}>
                        <td className="px-3 sm:px-6 py-4">
                          <input 
                            type="checkbox" 
                            aria-label="Select booking"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedBookings.includes(booking.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBookings([...selectedBookings, booking.id]);
                              } else {
                                setSelectedBookings(selectedBookings.filter(id => id !== booking.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                              {booking.userName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{booking.userName}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">{facility?.name}</span>
                            {booking.multiBookingGroupId && pendingBookings.filter(b => b.multiBookingGroupId === booking.multiBookingGroupId).length > 1 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-[10px] font-bold uppercase tracking-wider">
                                <Layers size={10} />
                                Group
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">
                              {booking.endDate && booking.endDate !== booking.date 
                                ? `${format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'MMM dd')} - ${format(parse(booking.endDate, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}`
                                : format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}
                            </span>
                            <span className="text-xs font-medium text-slate-400">{booking.startTime} - {booking.endTime}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                          <span className="text-sm text-slate-500 italic">"{booking.purpose}"</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {booking.multiBookingGroupId && pendingBookings.filter(b => b.multiBookingGroupId === booking.multiBookingGroupId).length > 1 && (
                              <>
                                <button 
                                  onClick={async () => {
                                    const groupBookings = pendingBookings.filter(b => b.multiBookingGroupId === booking.multiBookingGroupId);
                                    for (const gb of groupBookings) await handleApprove(gb.id);
                                  }}
                                  className="px-2 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all text-[10px] font-bold"
                                  title="Approve entire group"
                                >
                                  Approve Group
                                </button>
                                <button 
                                  onClick={async () => {
                                    const groupBookings = pendingBookings.filter(b => b.multiBookingGroupId === booking.multiBookingGroupId);
                                    for (const gb of groupBookings) await handleReject(gb.id);
                                  }}
                                  className="px-2 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all text-[10px] font-bold"
                                  title="Reject entire group"
                                >
                                  Reject Group
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleApprove(booking.id)}
                              className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleReject(booking.id)}
                              className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteBookingId(booking.id)}
                              className="p-2.5 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
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
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                      No pending requests at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Processing Clearance Section */}
          {processingClearanceBookings.length > 0 && (
            <div className="border-t border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Processing Clearance</h3>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                  {processingClearanceBookings.length} Awaiting Clearance
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                      <th className="px-3 sm:px-6 py-4">User</th>
                      <th className="px-3 sm:px-6 py-4">Facility</th>
                      <th className="px-3 sm:px-6 py-4">Date & Time</th>
                      <th className="px-3 sm:px-6 py-4 hidden sm:table-cell">Purpose</th>
                      <th className="px-3 sm:px-6 py-4">Status</th>
                      <th className="px-3 sm:px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processingClearanceBookings.map((booking) => {
                      const facility = facilities.find(f => f.id === booking.facilityId);
                      return (
                        <ClearanceBookingRow
                          key={booking.id}
                          booking={booking}
                          facility={facility}
                          onMarkProcessed={() => handleMarkClearanceProcessed(booking.id)}
                          onReject={() => handleReject(booking.id)}
                          onDelete={() => setConfirmDeleteBookingId(booking.id)}
                          getClearanceByBookingId={getClearanceByBookingId}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.filter(f => managedFacilityIds.has(f.id)).map(facility => (
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
                  {isSuperAdminOrAbove(currentUser?.role) && (
                    <button 
                      title="Delete Facility"
                      onClick={() => setConfirmDeleteFacilityId(facility.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{facility.name}</h3>
                <p className="text-sm font-medium text-slate-400">
                  {departments.find(d => d.id === facility.departmentId)?.name}
                  {facility.locationId && ` • ${locations.find(l => l.id === facility.locationId)?.name || ''}`}
                </p>
                {facility.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{facility.description}</p>
                )}
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
              {/* Approval info badge */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {facility.autoApprove ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Auto-Approve</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700">
                    {getApproversForFacility(facility.id).length} Approver{getApproversForFacility(facility.id).length !== 1 ? 's' : ''}
                  </span>
                )}
                {facility.requestClearance && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Clearance Required</span>
                )}
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
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map((log) => {
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
                setEditingUser(null);
                setUserFormData({ name: '', email: '', phone: '', departmentId: '', roleId: '' });
                setUserFormError(null);
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>
          {/* Search & Department Filter */}
          <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            {isGlobalAdmin(currentUser?.role) && (
              <div className="relative sm:w-56">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  title="Filter by department"
                  value={userDeptFilter}
                  onChange={e => setUserDeptFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="p-6 pt-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 font-medium">Name / Login Email ( I-Net Email )</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users
                    .filter(user => {
                      const q = userSearch.toLowerCase();
                      const matchesSearch = !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
                      // Super admin only sees users in their department
                      const matchesDept = isGlobalAdmin(currentUser?.role)
                        ? (!userDeptFilter || user.departmentId === userDeptFilter)
                        : user.departmentId === currentUser?.departmentId;
                      return matchesSearch && matchesDept;
                    })
                    .map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-sm">
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-slate-500">{user.email}</p>
                        {user.id === currentUser?.id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {user.phone || '—'}
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
                          {roles
                            .filter(r => isGlobalAdmin(currentUser?.role) || r.name !== 'global_admin')
                            .map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4">
                        <button
                          title="Edit User"
                          onClick={() => {
                            setEditingUser(user);
                            setUserFormData({
                              name: user.name,
                              email: user.email,
                              phone: user.phone || '',
                              departmentId: user.departmentId || '',
                              roleId: user.roleId || ''
                            });
                            setUserFormError(null);
                            setIsUserModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
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
              <h2 className="text-xl font-bold text-slate-800">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button
                title="Close"
                onClick={() => { setUserFormError(null); setIsUserModalOpen(false); }}
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
                  if (editingUser) {
                    await updateUser(editingUser.id, userFormData);
                  } else {
                    await createUser(userFormData.name, userFormData.email, userFormData.departmentId, userFormData.roleId, userFormData.phone);
                  }
                  setIsUserModalOpen(false);
                } catch (err: any) {
                  setUserFormError(err.message || (editingUser ? 'Failed to update user' : 'Failed to add user'));
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
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Login Email ( I-Net Email )</label>
                <div className="relative">
                  <input
                    title="Login Email ( I-Net Email )"
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={e => handleEmailChange(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 bg-slate-50 border text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-500 transition-all font-medium",
                      emailValidation.isDuplicate ? "border-rose-300 focus:ring-rose-500" : "border-slate-300 focus:ring-blue-500"
                    )}
                    placeholder="Enter login email address"
                  />
                  {emailValidation.isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={18} className="text-slate-400 animate-spin" />
                    </div>
                  )}
                </div>
                {emailValidation.isDuplicate && emailValidation.existingProfile && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                    <p className="font-bold text-amber-900 mb-1">Email already registered</p>
                    <p className="text-amber-800">Existing user: <strong>{emailValidation.existingProfile.cr71a_fullname}</strong></p>
                    <p className="text-amber-700 text-xs mt-1">Use a different email address or contact the user's administrator if this is a duplicate account.</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                <input
                  title="Phone Number"
                  type="tel"
                  value={userFormData.phone}
                  onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  placeholder="Enter phone number (optional)"
                />
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Department</label>
                <select
                  title="Department"
                  required
                  disabled={!isGlobalAdmin(currentUser?.role)}
                  value={userFormData.departmentId || (!isGlobalAdmin(currentUser?.role) ? currentUser?.departmentId || '' : '')}
                  onChange={e => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium",
                    !isGlobalAdmin(currentUser?.role) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <option value="" disabled>Select Department</option>
                  {(isGlobalAdmin(currentUser?.role)
                    ? departments
                    : departments.filter(d => d.id === currentUser?.departmentId)
                  ).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Role</label>
                <select
                  title="Role"
                  required
                  disabled={editingUser?.id === currentUser?.id}
                  value={userFormData.roleId}
                  onChange={e => setUserFormData({ ...userFormData, roleId: e.target.value })}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium",
                    editingUser?.id === currentUser?.id && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <option value="" disabled>Select Role</option>
                  {roles
                    .filter(r => isGlobalAdmin(currentUser?.role) || r.name !== 'global_admin')
                    .map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setUserFormError(null); setIsUserModalOpen(false); }}
                  className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormSubmitting || emailValidation.isDuplicate}
                  className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {userFormSubmitting ? (editingUser ? 'Saving...' : 'Adding...') : (editingUser ? 'Save Changes' : 'Add User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFacilityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
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
            <form onSubmit={handleFacilitySubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
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
                  disabled={!isGlobalAdmin(currentUser?.role)}
                  value={facilityFormData.departmentId || (!isGlobalAdmin(currentUser?.role) ? currentUser?.departmentId || '' : '')}
                  onChange={e => setFacilityFormData({...facilityFormData, departmentId: e.target.value})}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium",
                    !isGlobalAdmin(currentUser?.role) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <option value="" disabled>Select Department</option>
                  {(isGlobalAdmin(currentUser?.role)
                    ? departments
                    : departments.filter(d => d.id === currentUser?.departmentId)
                  ).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Description</label>
                <textarea
                  title="Description"
                  required
                  value={facilityFormData.description}
                  onChange={e => setFacilityFormData({...facilityFormData, description: e.target.value})}
                  placeholder="Describe the facility..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="block mb-2 text-sm font-bold text-slate-700 uppercase tracking-wider">Location</label>
                  <select
                    title="Location"
                    value={facilityFormData.locationId}
                    onChange={e => setFacilityFormData({...facilityFormData, locationId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                    required
                  >
                    <option value="" disabled>Select a location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <input
                  title="Auto-Approve Bookings"
                  type="checkbox"
                  id="autoApprove"
                  checked={facilityFormData.autoApprove}
                  onChange={e => setFacilityFormData({...facilityFormData, autoApprove: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 bg-slate-50 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-all"
                />
                <div>
                  <label htmlFor="autoApprove" className="text-sm font-bold text-emerald-800 cursor-pointer">Auto-Approve Bookings</label>
                  <p className="text-xs text-emerald-600 mt-0.5">Bookings are automatically approved on a first come, first served basis. No admin approval needed.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <input
                  title="Request Clearance"
                  type="checkbox"
                  id="requestClearance"
                  checked={facilityFormData.requestClearance}
                  onChange={e => setFacilityFormData({...facilityFormData, requestClearance: e.target.checked})}
                  className="w-5 h-5 text-amber-600 bg-slate-50 border-slate-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer transition-all"
                />
                <div>
                  <label htmlFor="requestClearance" className="text-sm font-bold text-amber-800 cursor-pointer">Request Clearance</label>
                  <p className="text-xs text-amber-600 mt-0.5">Users must email Force Protection (FP) on OSN for clearance before booking. Configure what details to include below.</p>
                </div>
              </div>

              {/* Clearance Email Fields Editor */}
              {facilityFormData.requestClearance && (
                <div className="space-y-3 p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-amber-800 uppercase tracking-wider">
                        Clearance Email Fields
                      </label>
                      <p className="text-xs text-amber-600 mt-0.5">Define what information users must include in their clearance email to FP.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {facilityFormData.clearanceEmailFields.map((field, idx) => (
                      <div key={field.id} className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-amber-100">
                        <GripVertical size={14} className="text-slate-300 flex-shrink-0" />
                        {/* Label */}
                        <input
                          type="text"
                          placeholder="Field label"
                          value={field.label}
                          onChange={e => {
                            const updated = [...facilityFormData.clearanceEmailFields];
                            updated[idx] = { ...field, label: e.target.value };
                            setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                          }}
                          className="flex-1 min-w-[120px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        {/* Type dropdown */}
                        <select
                          title="Field type"
                          value={field.inputType}
                          onChange={e => {
                            const updated = [...facilityFormData.clearanceEmailFields];
                            const newType = e.target.value as ClearanceFieldInputType;
                            updated[idx] = { ...field, inputType: newType, autoSource: newType === 'auto' ? 'name' : undefined, fixedValue: newType === 'fixed' ? '' : undefined };
                            setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                          }}
                          className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          <option value="user_input">User enters</option>
                          <option value="auto">Auto-fill</option>
                          <option value="fixed">Fixed value</option>
                        </select>
                        {/* Source or fixed value */}
                        {field.inputType === 'auto' && (
                          <select
                            title="Auto-fill source"
                            value={field.autoSource || 'name'}
                            onChange={e => {
                              const updated = [...facilityFormData.clearanceEmailFields];
                              updated[idx] = { ...field, autoSource: e.target.value as ClearanceAutoSource };
                              setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                            }}
                            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          >
                            <option value="name">Name</option>
                            <option value="phone">Phone</option>
                            <option value="email">Email</option>
                            <option value="date">Date</option>
                            <option value="time">Time</option>
                            <option value="purpose">Purpose</option>
                            <option value="facility">Facility</option>
                          </select>
                        )}
                        {field.inputType === 'fixed' && (
                          <input
                            type="text"
                            placeholder="Fixed value"
                            value={field.fixedValue || ''}
                            onChange={e => {
                              const updated = [...facilityFormData.clearanceEmailFields];
                              updated[idx] = { ...field, fixedValue: e.target.value };
                              setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                            }}
                            className="flex-1 min-w-[100px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        )}
                        {/* Required toggle for user_input */}
                        {field.inputType === 'user_input' && (
                          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required !== false}
                              onChange={e => {
                                const updated = [...facilityFormData.clearanceEmailFields];
                                updated[idx] = { ...field, required: e.target.checked };
                                setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                              }}
                              className="w-3 h-3 rounded"
                            />
                            Req.
                          </label>
                        )}
                        {/* Move up/down */}
                        <div className="flex gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const updated = [...facilityFormData.clearanceEmailFields];
                              [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                              setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 disabled:opacity-30 rounded transition-colors"
                            title="Move up"
                          >▲</button>
                          <button
                            type="button"
                            disabled={idx === facilityFormData.clearanceEmailFields.length - 1}
                            onClick={() => {
                              const updated = [...facilityFormData.clearanceEmailFields];
                              [updated[idx + 1], updated[idx]] = [updated[idx], updated[idx + 1]];
                              setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 disabled:opacity-30 rounded transition-colors"
                            title="Move down"
                          >▼</button>
                        </div>
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = facilityFormData.clearanceEmailFields.filter((_, i) => i !== idx);
                            setFacilityFormData({ ...facilityFormData, clearanceEmailFields: updated });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                          title="Remove field"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newField: ClearanceEmailField = {
                        id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        label: '',
                        inputType: 'user_input',
                        required: true,
                      };
                      setFacilityFormData({
                        ...facilityFormData,
                        clearanceEmailFields: [...facilityFormData.clearanceEmailFields, newField],
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <Plus size={13} /> Add Field
                  </button>
                </div>
              )}

              {/* Clearance Email Recipients ("To:" list) */}
              {facilityFormData.requestClearance && (
                <div className="space-y-3 p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <label className="block text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail size={14} />
                        Clearance Email Recipients (To)
                      </label>
                      <p className="text-xs text-amber-600 mt-0.5">Who Force Protection emails should be sent to for this facility.</p>
                    </div>
                  </div>

                  {!editingFacility ? (
                    <p className="text-xs text-slate-500 italic px-2 py-3 bg-white rounded-lg border border-amber-100">
                      Save this facility first to manage recipients.
                    </p>
                  ) : (
                    <>
                      {/* Current recipients */}
                      {facilityRecipients.length > 0 ? (
                        <div className="space-y-1.5">
                          {facilityRecipients.map((r) => (
                            <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-amber-100">
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail size={13} className="text-amber-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {r.displayName !== r.email ? `${r.displayName} <${r.email}>` : r.email}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipient(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all flex-shrink-0"
                                title="Remove recipient"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic px-2 py-2">No recipients yet. Add one below.</p>
                      )}

                      {/* Add recipient — email with autocomplete + optional display name */}
                      <div className="space-y-2 pt-2 border-t border-amber-100">
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="email@mindef.gov.sg"
                            value={newRecipientEmail}
                            onChange={e => { setNewRecipientEmail(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                          />
                          {showSuggestions && filteredSuggestions.length > 0 && (
                            <div className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-amber-200 rounded-lg shadow-lg">
                              {filteredSuggestions.map((s) => (
                                <button
                                  key={s.email}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setNewRecipientEmail(s.email);
                                    setNewRecipientDisplayName(s.displayName);
                                    setShowSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-amber-50 text-xs border-b border-slate-100 last:border-0"
                                >
                                  <div className="font-medium text-slate-700">{s.displayName}</div>
                                  {s.displayName !== s.email && <div className="text-slate-500">{s.email}</div>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Display name (optional)"
                            value={newRecipientDisplayName}
                            onChange={e => setNewRecipientDisplayName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={handleAddRecipient}
                            disabled={!newRecipientEmail.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus size={13} /> Add
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Facility Managers — tag super admins who can edit this facility */}
              <div className="space-y-3 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <div>
                  <label className="block text-sm font-bold text-violet-800 uppercase tracking-wider mb-2">
                    <Crown size={14} className="inline mr-1 -mt-0.5" />
                    Facility Managers
                  </label>
                  <p className="text-xs text-violet-600 mb-3">Tag super admins who can edit all settings of this facility, manage approvers, and approve bookings.</p>
                </div>

                {editingFacility ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-violet-600" />
                      <span className="text-sm font-bold text-violet-800">Tagged Super Admins</span>
                    </div>
                    {currentFacilityManagers.length > 0 ? (
                      <div className="space-y-1.5">
                        {currentFacilityManagers.map((manager) => (
                          <div key={manager.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700">
                                Super Admin
                              </span>
                              <span className="text-sm font-medium text-slate-700">{manager.displayName || '—'}</span>
                            </div>
                            {isSuperAdminOrAbove(currentUser?.role) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveApprover(manager.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                title="Remove manager"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-violet-500 italic">No super admins tagged yet.</p>
                    )}
                    {/* Add manager controls — only super_admin and global_admin can add/remove */}
                    {isSuperAdminOrAbove(currentUser?.role) && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          title="Select Super Admin"
                          value={managerUserId}
                          onChange={(e) => setManagerUserId(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="" disabled>Select super admin...</option>
                          {superAdminUsers
                            .filter(u => !currentFacilityManagers.some(a => a.approverProfileId === u.id))
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))
                          }
                        </select>
                        <button
                          type="button"
                          onClick={handleAddManager}
                          disabled={!managerUserId}
                          className="px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-violet-500 italic">Save the facility first, then edit it to tag managers.</p>
                )}
              </div>

              {/* Facility Approvers — assign admins who can approve bookings for this facility */}
              {!facilityFormData.autoApprove && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">
                      <Shield size={14} className="inline mr-1 -mt-0.5" />
                      Facility Approvers
                    </label>
                    <p className="text-xs text-blue-600 mb-3">Assign admins who can approve bookings for this facility.</p>
                  </div>

                  {editingFacility ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-blue-600" />
                        <span className="text-sm font-bold text-blue-800">Assigned Approvers</span>
                      </div>
                      {currentFacilityAdminApprovers.length > 0 ? (
                        <div className="space-y-1.5">
                          {currentFacilityAdminApprovers.map((approver) => (
                            <div key={approver.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  "bg-blue-100 text-blue-700"
                                )}>
                                  {approver.approverType}
                                </span>
                                <span className="text-sm font-medium text-slate-700">{approver.displayName || '—'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveApprover(approver.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                title="Remove approver"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-blue-500 italic">No approvers assigned yet. Add admins below.</p>
                      )}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          title="Select User"
                          value={approverUserId}
                          onChange={(e) => setApproverUserId(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" disabled>Select admin...</option>
                          {adminUsers
                            .filter(u => !currentFacilityAdminApprovers.some(a => a.approverType === 'user' && a.approverProfileId === u.id))
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))
                          }
                        </select>
                        <button
                          type="button"
                          onClick={handleAddApprover}
                          disabled={!approverUserId}
                          className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-500 italic">Save the facility first, then edit it to assign approvers.</p>
                  )}
                </div>
              )}

              {/* Department Visibility — global_admin or super_admin (for their own dept or tagged facilities), only when editing an existing facility */}
              {(isGlobalAdmin(currentUser?.role) || (currentUser?.role === 'super_admin' && editingFacility && managedFacilityIds.has(editingFacility.id))) && editingFacility && (
                <div className="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">
                      <Eye size={14} className="inline mr-1 -mt-0.5" />
                      Department Visibility
                    </label>
                    <p className="text-xs text-indigo-600 mb-3">
                      Control which departments can see and book this facility. If no departments are assigned, the facility is visible to all.
                    </p>
                  </div>

                  {/* Currently assigned departments */}
                  {currentFacilityDepts.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-indigo-700">
                          Restricted to {currentFacilityDepts.length} department{currentFacilityDepts.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {currentFacilityDepts.map((fd) => {
                        const dept = departments.find(d => d.id === fd.departmentId);
                        return (
                          <div key={fd.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                                Dept
                              </span>
                              <span className="text-sm font-medium text-slate-700">{dept?.name || fd.departmentId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVisibilityDept(fd.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                              title="Remove department"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-500 italic">Visible to all departments. Assign departments below to restrict access.</p>
                  )}

                  {/* Add department visibility control */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      title="Select Department"
                      value={visibilityDeptId}
                      onChange={(e) => setVisibilityDeptId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" disabled>Select department...</option>
                      {departments
                        .filter(d => !currentFacilityDepts.some(fd => fd.departmentId === d.id))
                        .map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))
                      }
                    </select>
                    <button
                      type="button"
                      onClick={handleAddVisibilityDept}
                      disabled={!visibilityDeptId}
                      className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
              {(isGlobalAdmin(currentUser?.role) || currentUser?.role === 'super_admin') && !editingFacility && (
                <p className="text-xs text-indigo-500 italic p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Eye size={14} className="inline mr-1 -mt-0.5" />
                  Save the facility first, then edit it to configure department visibility.
                </p>
              )}
              </div>
              <div className="p-6 pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
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
        message={
          confirmDeleteFacilityId && bookings.some(b => b.facilityId === confirmDeleteFacilityId)
            ? "This facility has associated bookings. It will be deactivated instead of fully deleted. Are you sure?"
            : "Are you sure you want to delete this facility? This action cannot be undone."
        }
        onConfirm={() => {
          if (confirmDeleteFacilityId) {
            const hasBookings = bookings.some(b => b.facilityId === confirmDeleteFacilityId);
            deleteFacility(confirmDeleteFacilityId, hasBookings);
          }
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
