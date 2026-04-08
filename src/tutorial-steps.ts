import type { Step } from 'react-joyride';

// ── Helper: navigate to a tab before showing a step ─────────────────────────
const navigateTo = (tab: string): Promise<void> =>
  new Promise((resolve) => {
    (window as any).__navigateTo?.(tab);
    setTimeout(resolve, 400);
  });

/**
 * Extended Step type with tutorial-specific metadata
 */
export interface TutorialStep extends Step {
  checkpoint?: string; // For interactive steps
  dependencies?: string[]; // Prerequisites for this step
  skipAllowed?: boolean; // Whether user can skip this step
}

/**
 * ENHANCED USER TUTORIAL
 * Interactive walkthrough for booking creation with demo booking flow
 * Guides users from facility selection through to viewing their booking
 */
export const userBookingDemoTutorialSteps: TutorialStep[] = [
  // ─ SECTION 1: Welcome & Navigation ──────────────────────────────────────
  // 1. Welcome
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Welcome to Facility Booking! 🎉',
    content:
      'Let\'s take a quick interactive tour. You\'ll learn how to book a facility step-by-step with a demo booking.',
    skipAllowed: true,
  },
  // 2. Sidebar overview
  {
    target: '[data-tutorial="sidebar"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Navigation Sidebar',
    content:
      'Use the sidebar to navigate between sections. You can create bookings, view availability, manage settings, and more.',
    skipAllowed: false,
  },
  
  // ─ SECTION 2: Interactive Demo Booking ──────────────────────────────────
  // 3. Highlight Book nav → navigate
  {
    target: '[data-tutorial="nav-book"]',
    placement: 'right',
    skipBeacon: true,
    title: '📋 Ready to Create Your First Booking?',
    content:
      'Click here to go to the booking form. We\'ll walk through it together!',
    before: () => navigateTo('book'),
    skipAllowed: false,
  },
  // 4. Facility selector intro
  {
    target: '[data-tutorial="booking-facility-select"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Step 1: Select a Facility',
    content:
      'Start by choosing a location and then a facility. Try selecting a location now.',
    checkpoint: 'userBookingDemo-location-selected',
    skipAllowed: false,
  },
  // 5. Explain facility selection
  {
    target: '[data-tutorial="booking-facility-summary"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Facility Details',
    content:
      'Here\'s your selected facility and its capacity. You can change facility or location if needed.',
    skipAllowed: false,
  },
  // 6. Date/Time selection intro
  {
    target: '[data-tutorial="booking-datetime"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Step 2: Choose Date & Time',
    content:
      'Pick a start date. Try selecting a date in the future. The time slots will update based on availability.',
    checkpoint: 'userBookingDemo-date-selected',
    skipAllowed: false,
  },
  // 7. Multi-day option
  {
    target: '[data-tutorial="booking-multiday-toggle"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Multi-Day Bookings',
    content:
      'Need a facility for multiple consecutive days? Toggle this option to set an end date.',
    skipAllowed: true,
  },
  // 8. Time slot selection
  {
    target: '[data-tutorial="booking-start-time"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Start & End Times',
    content:
      'Select your start time (slots are 15-minute intervals). The end time must be after the start time.',
    skipAllowed: false,
  },
  // 9. Duration display
  {
    target: '[data-tutorial="booking-duration"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Duration Preview',
    content:
      'This shows the total duration of your booking. Check it looks right before submitting!',
    skipAllowed: true,
  },
  // 10. Purpose field
  {
    target: '[data-tutorial="booking-purpose"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Step 3: Describe Your Booking',
    content:
      'Tell admins why you need this facility. This helps them approve your request. Try entering a purpose now.',
    checkpoint: 'userBookingDemo-purpose-entered',
    skipAllowed: false,
  },
  // 11. Recurrence option
  {
    target: '[data-tutorial="booking-recurrence"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Recurring Bookings (Optional)',
    content:
      'Need the same slot every week? Enable recurrence and set the number of weeks to repeat.',
    skipAllowed: true,
  },
  // 12. Conflict checker
  {
    target: '[data-tutorial="booking-conflicts"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Real-Time Conflict Detection',
    content:
      'If there are any scheduling conflicts, they\'ll appear here. Your booking must not overlap with any existing ones.',
    skipAllowed: true,
  },
  // 13. Submit button intro
  {
    target: '[data-tutorial="booking-submit"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Step 4: Submit Your Booking',
    content:
      'Ready? Click submit to create your demo booking. It will appear in your dashboard immediately!',
    checkpoint: 'userBookingDemo-booking-submitted',
    skipAllowed: false,
  },

  // ─ SECTION 3: Dashboard & Results ───────────────────────────────────────
  // 14. Success message
  {
    target: '[data-tutorial="booking-success"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Success! ✅',
    content:
      'Your booking has been created and appears in the dashboard with "DEMO" label. This is how it will look when you create real bookings!',
    skipAllowed: true,
  },
  // 15. Highlight Dashboard nav
  {
    target: '[data-tutorial="nav-home"]',
    placement: 'right',
    skipBeacon: true,
    title: 'View in Dashboard',
    content:
      'Go to your dashboard to see your booking in the upcoming bookings list. Click here!',
    before: () => navigateTo('home'),
    skipAllowed: true,
  },
  // 16. Dashboard demo booking
  {
    target: '[data-tutorial="dashboard-bookings"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Your Demo Booking',
    content:
      'Here\'s your booking! Real bookings will appear the same way. You can view details, cancel, or manage them here.',
    skipAllowed: true,
  },

  // ─ SECTION 4: Additional Features ───────────────────────────────────────
  // 17. Availability calendar
  {
    target: '[data-tutorial="nav-availability"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Check Facility Availability',
    content:
      'Before booking, you can check facility availability on the calendar. Color-coded slots show what\'s open or booked.',
    before: () => navigateTo('availability'),
    skipAllowed: true,
  },
  // 18. Settings
  {
    target: '[data-tutorial="nav-settings"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Your Profile Settings',
    content:
      'Update your contact information and manage your profile settings here.',
    before: () => navigateTo('settings'),
    skipAllowed: true,
  },
  // 19. Profile badge
  {
    target: '[data-tutorial="user-profile"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Your Role & Name',
    content:
      'Your name and current role are always shown here. When your role changes, you\'ll see a notification!',
    skipAllowed: true,
  },
  // 20. All set
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'You\'re Ready! 🚀',
    content:
      'You now know how to create bookings, check availability, and manage your profile. Use the help button (bottom-right) to replay this tour anytime. Good luck!',
    skipAllowed: true,
  },
];

// ── Backward Compatibility: Legacy User Tutorial Steps ──────────────────────
export const userTutorialSteps: TutorialStep[] = userBookingDemoTutorialSteps;

/**
 * ADMIN FACILITY MANAGEMENT - BEGINNER TIER
 * Teaches admins how to create basic facilities with required fields
 */
export const adminFacilityBeginnerTutorialSteps: TutorialStep[] = [
  // 1. Welcome to admin features
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Congratulations, Admin! 🎉',
    content:
      'You\'ve been promoted to Admin. You can now create and manage facilities. Let\'s walk through the basics!',
    skipAllowed: true,
  },
  // 2. Management tab intro
  {
    target: '[data-tutorial="nav-management"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Admin Management Hub',
    content:
      'This is where you manage facilities, bookings, users, and more. Click here to explore!',
    before: () => navigateTo('management'),
    skipAllowed: false,
  },
  // 3. Facilities tab
  {
    target: '[data-tutorial="management-tabs"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Facilities Tab',
    content:
      'Click on the "Facilities" tab to start creating and managing facilities.',
    checkpoint: 'adminFacilityBeginner-facilities-tab-clicked',
    skipAllowed: false,
  },
  // 4. Create facility button
  {
    target: '[data-tutorial="facility-create-button"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Create Your First Facility',
    content:
      'Click this button to open the facility creation form. Let\'s create a demo facility together!',
    skipAllowed: false,
  },
  // 5. Facility name field
  {
    target: '[data-tutorial="facility-name-input"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Facility Name',
    content:
      'Enter a descriptive name for your facility (e.g., "Conference Room A", "Lab 202"). Try typing a name now!',
    checkpoint: 'adminFacilityBeginner-facility-name-entered',
    skipAllowed: false,
  },
  // 6. Capacity field
  {
    target: '[data-tutorial="facility-capacity-input"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Set Capacity',
    content:
      'How many people can use this facility at once? Enter the maximum occupancy. Try adjusting the number!',
    checkpoint: 'adminFacilityBeginner-capacity-set',
    skipAllowed: false,
  },
  // 7. Description field
  {
    target: '[data-tutorial="facility-description-input"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Describe Your Facility',
    content:
      'Add a brief description highlighting amenities and features (e.g., "Projector, whiteboard, video conference setup"). Try entering a description!',
    checkpoint: 'adminFacilityBeginner-description-entered',
    skipAllowed: false,
  },
  // 8. Department selector
  {
    target: '[data-tutorial="facility-department-select"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Assign to Department',
    content:
      'Select which department this facility belongs to. This controls who can see and book it.',
    checkpoint: 'adminFacilityBeginner-department-selected',
    skipAllowed: false,
  },
  // 9. Location selector
  {
    target: '[data-tutorial="facility-location-select"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Select Location',
    content:
      'Choose the physical location of this facility (e.g., "Building A - 3rd Floor").',
    checkpoint: 'adminFacilityBeginner-location-selected',
    skipAllowed: false,
  },
  // 10. Max recurrence weeks
  {
    target: '[data-tutorial="facility-max-recurrence-input"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Recurrence Limit',
    content:
      'How many consecutive weeks can users book this facility recurrently? Default is 4 weeks. You can change this based on your policies.',
    skipAllowed: true,
  },
  // 11. Approval mode (brief intro)
  {
    target: '[data-tutorial="facility-approval-mode"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Booking Approvals',
    content:
      'You can auto-approve all bookings (FCFS) or require manual approval via "Department Admins". We\'ll configure approvals in Advanced Settings!',
    skipAllowed: true,
  },
  // 12. Save facility
  {
    target: '[data-tutorial="facility-save-button"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Save Your Facility',
    content:
      'Click save to create your facility. You\'ll then see it added to the list!',
    checkpoint: 'adminFacilityBeginner-facility-saved',
    skipAllowed: false,
  },
  // 13. Facility card display
  {
    target: '[data-tutorial="facility-card"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Your New Facility',
    content:
      'Here\'s your created facility! You can see the name, capacity, approvers, and actions (Edit, Advanced Settings, Delete). The "Advanced Settings" button unlocks approval customization.',
    skipAllowed: true,
  },
  // 14. Next steps
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Beginner Tutorial Complete! ✅',
    content:
      'You\'ve created your first facility! Next, explore "Advanced Settings" on your facility card to customize approvers and manage access. Click "Advanced Settings" when ready!',
    skipAllowed: true,
  },
];

/**
 * ADMIN FACILITY MANAGEMENT - ADVANCED TIER (Optional Deep Dive)
 * Teaches approval modes, custom approvers, and department visibility
 * Prerequisites: Must complete adminFacilityBeginnerTutorialSteps
 * Triggered: When user clicks "Advanced Settings" button on facility card
 */
export const adminFacilityAdvancedTutorialSteps: TutorialStep[] = [
  // 1. Welcome to advanced settings
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Advanced Settings 🔧',
    content:
      'Let\'s customize how bookings are approved for this facility. You have three approval strategies to choose from.',
    skipAllowed: true,
  },
  // 2. Approval mode overview
  {
    target: '[data-tutorial="facility-approval-mode"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Approval Modes Explained',
    content:
      'Three options: (1) Auto-Approve = All bookings auto-approved FCFS (no admin review), (2) Department Admins = Any admin in the department can approve, (3) Custom Approvers = Only specific users/departments.',
    skipAllowed: true,
  },
  // 3. Auto-approve option
  {
    target: '[data-tutorial="facility-auto-approve-checkbox"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Auto-Approve Option',
    content:
      'If you check this, all bookings will be automatically approved in first-come-first-served order. No admin review needed!',
    skipAllowed: true,
  },
  // 4. Custom approvers radio
  {
    target: '[data-tutorial="facility-custom-approvers-radio"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Custom Approvers Mode',
    content:
      'Select this to specify exactly who can approve bookings for this facility. More control, but slightly more work to manage.',
    checkpoint: 'adminFacilityAdvanced-custom-approvers-selected',
    skipAllowed: false,
  },
  // 5. Add user approver
  {
    target: '[data-tutorial="facility-add-user-approver"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Add User Approver',
    content:
      'Select a specific admin user who can review and approve bookings for this facility. Try clicking to add a user!',
    checkpoint: 'adminFacilityAdvanced-user-approver-added',
    skipAllowed: true,
  },
  // 6. Add department approver
  {
    target: '[data-tutorial="facility-add-dept-approver"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Add Department Approver',
    content:
      'Alternatively, you can assign an entire department as approvers. All admins in that department can approve!',
    checkpoint: 'adminFacilityAdvanced-dept-approver-added',
    skipAllowed: true,
  },
  // 7. Approvers list
  {
    target: '[data-tutorial="facility-approvers-list"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Current Approvers',
    content:
      'This list shows all assigned approvers. You can remove any approver by clicking the X button.',
    skipAllowed: true,
  },
  // 8. Department visibility (global admin only)
  {
    target: '[data-tutorial="facility-dept-visibility"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Department Visibility (System Admins)',
    content:
      'Control which departments can see and book this facility. Leave empty to allow all departments.',
    skipAllowed: true,
  },
  // 9. Save advanced settings
  {
    target: '[data-tutorial="facility-advanced-save-button"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Save Custom Approvals',
    content:
      'Click save to apply your approval settings. Your facility is now fully configured!',
    checkpoint: 'adminFacilityAdvanced-advanced-settings-saved',
    skipAllowed: false,
  },
  // 10. Complete advanced
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Advanced Settings Complete! ⭐',
    content:
      'You\'ve mastered facility approval customization. You can now revisit these settings anytime via the Edit button.',
    skipAllowed: true,
  },
];

/**
 * ADMIN FACILITY EDITING TUTORIAL
 * Teaches how to modify facility settings after creation
 * Prerequisites: adminFacilityBeginnerTutorialSteps
 * Triggered: When user clicks Edit button on facility card
 */
export const adminFacilityEditingTutorialSteps: TutorialStep[] = [
  // 1. Editing intro
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Edit Facility Settings 🔧',
    content:
      'Modify your facility details. Most settings can be changed anytime—except department and location, which are locked after creation.',
    skipAllowed: true,
  },
  // 2. Name field
  {
    target: '[data-tutorial="facility-name-input"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Update Facility Name',
    content:
      'Can\'t think of a better name? Change it anytime. Try editing the name!',
    checkpoint: 'adminFacilityEditing-facility-name-changed',
    skipAllowed: true,
  },
  // 3. Capacity field
  {
    target: '[data-tutorial="facility-capacity-input"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Adjust Capacity',
    content:
      'Updated your facility size? Adjust the maximum occupancy here.',
    checkpoint: 'adminFacilityEditing-capacity-changed',
    skipAllowed: true,
  },
  // 4. Description field
  {
    target: '[data-tutorial="facility-description-input"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Update Description',
    content:
      'Keep your facility description current with new amenities, equipment, or restrictions.',
    checkpoint: 'adminFacilityEditing-description-changed',
    skipAllowed: true,
  },
  // 5. Locked fields notice
  {
    target: '[data-tutorial="facility-locked-fields-notice"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Locked Fields',
    content:
      'Department and Location are locked after creation for data integrity. To change them, create a new facility.',
    skipAllowed: true,
  },
  // 6. Max recurrence weeks
  {
    target: '[data-tutorial="facility-max-recurrence-input"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Adjust Recurrence Limit',
    content:
      'Change how many weeks users can book recurring slots. Decrease to restrict, increase for more flexibility.',
    skipAllowed: true,
  },
  // 7. Approval settings change
  {
    target: '[data-tutorial="facility-approval-controls"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Modify Approval Strategy',
    content:
      'Switch between Auto-Approve and custom approvers. Changes take effect for new bookings only.',
    checkpoint: 'adminFacilityEditing-approvals-changed',
    skipAllowed: true,
  },
  // 8. Save edits
  {
    target: '[data-tutorial="facility-save-button"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Save Changes',
    content:
      'Click save to apply your updates. The facility will be refreshed with new settings.',
    checkpoint: 'adminFacilityEditing-edit-saved',
    skipAllowed: false,
  },
  // 9. Confirmation
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Facility Updated! ✅',
    content:
      'Your facility changes are saved. Users will see the updated details when they book. Well done!',
    skipAllowed: true,
  },
];

/**
 * SUPER ADMIN FACILITY MANAGEMENT TUTORIAL
 * Teaches system-wide facility management across all departments
 * Prerequisites: None (or adminFacilityBeginnerTutorialSteps)
 * Triggered: When user upgraded to super_admin
 */
export const superAdminFacilityTutorialSteps: TutorialStep[] = [
  // 1. Welcome to super admin
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Welcome, Super Admin! ⚡',
    content:
      'You now have system-wide facility management. You can create and manage facilities across ALL departments.',
    skipAllowed: true,
  },
  // 2. Global facility view
  {
    target: '[data-tutorial="nav-management"]',
    placement: 'right',
    skipBeacon: true,
    title: 'System-Wide Management',
    content:
      'Visit Management → Facilities to see all facilities from all departments.',
    before: () => navigateTo('management'),
    skipAllowed: false,
  },
  // 3. Department filter
  {
    target: '[data-tutorial="facility-department-filter"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Filter by Department',
    content:
      'Use this filter to view facilities from specific departments, or leave it empty to see all.',
    skipAllowed: true,
  },
  // 4. Create cross-department facility
  {
    target: '[data-tutorial="facility-create-button"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Create for Any Department',
    content:
      'When you create a facility, you can now assign it to ANY department in the system, not just your own.',
    checkpoint: 'superAdminFacility-create-any-dept-facility',
    skipAllowed: false,
  },
  // 5. Department selector (expanded)
  {
    target: '[data-tutorial="facility-department-select"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Choose Any Department',
    content:
      'You have access to all departments! Select one for you new facility. This unlocked access is a super admin privilege.',
    skipAllowed: false,
  },
  // 6. Global approvers
  {
    target: '[data-tutorial="facility-custom-approvers-radio"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Cross-Department Approvers',
    content:
      'You can assign approvers from ANY department or any user with admin privileges system-wide. Perfect for matrices reporting structures!',
    checkpoint: 'superAdminFacility-cross-dept-approvers',
    skipAllowed: true,
  },
  // 7. Global approver selector
  {
    target: '[data-tutorial="facility-add-user-approver"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Add Any Admin as Approver',
    content:
      'The user/department selector now shows all admins across all departments. You can mix and match approvers from different teams!',
    skipAllowed: true,
  },
  // 8. Department visibility control
  {
    target: '[data-tutorial="facility-dept-visibility"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Control Department Visibility',
    content:
      'Decide which departments can see this facility. Empty list = all departments can see it. Add departments to restrict visibility.',
    checkpoint: 'superAdminFacility-dept-visibility-control',
    skipAllowed: true,
  },
  // 9. Global blackout periods
  {
    target: '[data-tutorial="nav-infrastructure"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Global Infrastructure',
    content:
      'In Infrastructure, you can set global blackout dates that affect facilities across the entire system.',
    before: () => navigateTo('infrastructure'),
    skipAllowed: true,
  },
  // 10. Complete super admin
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Super Admin Tour Complete! 🎓',
    content:
      'You\'re now a super admin! You manage the entire facility booking system. Create facilities wisely and remember: great power = great responsibility!',
    skipAllowed: true,
  },
];

// ── Backward Compatibility: Legacy Admin Upgrade Tutorial ─────────────────
export const adminUpgradeTutorialSteps: TutorialStep[] = adminFacilityBeginnerTutorialSteps.slice(1, 9);

// ── Backward Compatibility: Legacy Super Admin Upgrade Tutorial ────────────
export const superAdminUpgradeTutorialSteps: TutorialStep[] = superAdminFacilityTutorialSteps.slice(1);

// ── Full Tutorials (for help button replay) ─────────────────────────────────
export const fullUserTutorial: TutorialStep[] = [...userBookingDemoTutorialSteps];

export const fullAdminTutorial: TutorialStep[] = [
  ...userBookingDemoTutorialSteps.slice(0, -1), // Remove the "ready" final step
  ...adminFacilityBeginnerTutorialSteps,
];

export const fullSuperAdminTutorial: TutorialStep[] = [
  ...userBookingDemoTutorialSteps.slice(0, -1),
  ...adminFacilityBeginnerTutorialSteps.slice(1, -1), // Remove first and last steps
  ...adminFacilityAdvancedTutorialSteps.slice(1, -1), // Remove first and last steps
  ...superAdminFacilityTutorialSteps,
];

export function getTutorialSteps(
  currentRole: string,
  tutorialRole: string | undefined,
  isReplay: boolean
): TutorialStep[] {
  // Help-button replay → full tutorial for current role
  if (isReplay) {
    if (currentRole === 'global_admin' || currentRole === 'super_admin') return fullSuperAdminTutorial;
    if (currentRole === 'admin') return fullAdminTutorial;
    return fullUserTutorial;
  }

  // First-time user (never seen any tutorial)
  if (!tutorialRole) {
    return userBookingDemoTutorialSteps;
  }

  // Role was upgraded → show only upgrade steps
  if (tutorialRole === 'user' && currentRole === 'admin') {
    return adminFacilityBeginnerTutorialSteps;
  }
  if (tutorialRole === 'user' && (currentRole === 'super_admin' || currentRole === 'global_admin')) {
    return [
      ...adminFacilityBeginnerTutorialSteps.slice(1, -1),
      ...superAdminFacilityTutorialSteps,
    ];
  }
  if (tutorialRole === 'admin' && (currentRole === 'super_admin' || currentRole === 'global_admin')) {
    return superAdminFacilityTutorialSteps;
  }
  if ((tutorialRole === 'super_admin') && currentRole === 'global_admin') {
    return superAdminFacilityTutorialSteps;
  }

  // Fallback: full tutorial for current role
  return getTutorialSteps(currentRole, undefined, true);
}
