import type { Step } from 'react-joyride';

// ── Helper: navigate to a tab before showing a step ─────────────────────────
const navigateTo = (tab: string): Promise<void> =>
  new Promise((resolve) => {
    (window as any).__navigateTo?.(tab);
    setTimeout(resolve, 400);
  });

// ── User Tutorial (shown to new users on first login) ──────────────────────
export const userTutorialSteps: Step[] = [
  // 1. Welcome
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Welcome to Facility Booking! 🎉',
    content:
      'This quick tour will walk you through the key features of the app. You can skip at any time.',
  },
  // 2. Sidebar overview
  {
    target: '[data-tutorial="sidebar"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Navigation Sidebar',
    content:
      'Use the sidebar to switch between different sections of the app. On mobile, tap the menu icon in the top bar.',
  },
  // 3. Highlight Home nav → navigate to Dashboard
  {
    target: '[data-tutorial="nav-home"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Home / Dashboard',
    content:
      'Click here to go to your Dashboard. Let\'s explore it now!',
    before: () => navigateTo('home'),
  },
  // 4. Dashboard – stats cards
  {
    target: '[data-tutorial="dashboard-stats"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Booking Stats',
    content:
      'These cards give you a quick overview of your pending, approved, and total bookings.',
    before: () => navigateTo('home'),
  },
  // 5. Dashboard – upcoming bookings
  {
    target: '[data-tutorial="dashboard-bookings"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Upcoming Bookings',
    content:
      'Your upcoming confirmed bookings are listed here so you never miss a reservation.',
  },
  // 6. Highlight Book nav → navigate to Book Facility
  {
    target: '[data-tutorial="nav-book"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Book a Facility',
    content:
      'Click here to create a new booking. Let\'s take a look!',
    before: () => navigateTo('book'),
  },
  // 7. Booking form – facility selector
  {
    target: '[data-tutorial="booking-facility-select"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Select a Facility',
    content:
      'Start by choosing a location and facility from the dropdowns. Available options depend on your department.',
    before: () => navigateTo('book'),
  },
  // 8. Booking form – date/time
  {
    target: '[data-tutorial="booking-datetime"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Pick Date & Time',
    content:
      'Choose your preferred date and time slot. Greyed-out slots are already booked or blocked.',
  },
  // 9. Booking form – purpose
  {
    target: '[data-tutorial="booking-purpose"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Booking Purpose',
    content:
      'Describe why you need the facility. This helps approvers decide on your request.',
  },
  // 10. Booking form – recurrence
  {
    target: '[data-tutorial="booking-recurrence"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Recurring Bookings',
    content:
      'Need the same slot every week? Enable recurrence and set the number of weeks.',
  },
  // 11. Highlight Availability nav → navigate
  {
    target: '[data-tutorial="nav-availability"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Availability Calendar',
    content:
      'Click here to check facility availability. Let\'s explore!',
    before: () => navigateTo('availability'),
  },
  // 12. Availability – controls
  {
    target: '[data-tutorial="availability-controls"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Availability Controls',
    content:
      'Filter by location, facility, and week to find open time slots.',
    before: () => navigateTo('availability'),
  },
  // 13. Availability – grid
  {
    target: '[data-tutorial="availability-grid"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Weekly Grid',
    content:
      'Color-coded time slots show what\'s available (green), booked (red), or blocked (grey).',
  },
  // 14. Highlight Settings nav → navigate
  {
    target: '[data-tutorial="nav-settings"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Settings',
    content:
      'Click here to view and update your profile. Let\'s check it out!',
    before: () => navigateTo('settings'),
  },
  // 15. Settings – profile section
  {
    target: '[data-tutorial="settings-profile"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Your Profile',
    content:
      'View your profile details here. You can update your contact number if needed.',
    before: () => navigateTo('settings'),
  },
  // 16. Top bar profile badge
  {
    target: '[data-tutorial="user-profile"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Profile Badge',
    content:
      'Your name and current role are always visible here in the top bar.',
  },
  // 17. All set
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'You\'re All Set! ✅',
    content:
      'That\'s everything you need to get started. Use the help button at the bottom-right corner to replay this tour anytime.',
  },
];

// ── Admin Upgrade Tutorial (shown when user role changes to admin) ──────────
export const adminUpgradeTutorialSteps: Step[] = [
  // 1. Welcome
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Welcome, Admin! 🛡️',
    content:
      'Your role has been upgraded to Admin. Let\'s walk you through the new features you now have access to.',
  },
  // 2. Highlight Management nav → navigate
  {
    target: '[data-tutorial="nav-management"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Management Tab',
    content:
      'This is your main admin workspace. Click here to explore it!',
    before: () => navigateTo('management'),
  },
  // 3. Management – tabs
  {
    target: '[data-tutorial="management-tabs"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Management Sections',
    content:
      'Switch between Booking Requests, Facilities, Users and other management areas using these tabs.',
    before: () => navigateTo('management'),
  },
  // 4. Management – requests panel
  {
    target: '[data-tutorial="management-requests"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Booking Requests',
    content:
      'Review pending booking requests from users in your department. Approve or reject them individually or in bulk.',
  },
  // 5. Highlight Infrastructure nav → navigate
  {
    target: '[data-tutorial="nav-infrastructure"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Infrastructure Tab',
    content:
      'Manage the building blocks of the system. Click here to explore!',
    before: () => navigateTo('infrastructure'),
  },
  // 6. Infrastructure – tabs
  {
    target: '[data-tutorial="infrastructure-tabs"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Infrastructure Sections',
    content:
      'Manage locations, blocked dates, and department settings from these tabs.',
    before: () => navigateTo('infrastructure'),
  },
  // 7. Infrastructure – panel overview
  {
    target: '[data-tutorial="infrastructure-panel"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Infrastructure Overview',
    content:
      'Create and manage locations and set blackout periods for facilities in your department.',
  },
  // 8. Complete
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Admin Tour Complete! ✅',
    content:
      'You\'re ready to manage your department\'s facilities and bookings. Use the help button to replay this tour anytime.',
  },
];

// ── Super Admin Upgrade Tutorial (shown when role changes to super_admin) ───
export const superAdminUpgradeTutorialSteps: Step[] = [
  // 1. Welcome
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Welcome, Super Admin! ⚡',
    content:
      'You now have full system-wide control. Let\'s review your expanded capabilities.',
  },
  // 2. Dashboard – global stats
  {
    target: '[data-tutorial="nav-home"]',
    placement: 'right',
    skipBeacon: true,
    title: 'System-Wide Dashboard',
    content:
      'Your dashboard now shows all bookings across every department, not just your own.',
    before: () => navigateTo('home'),
  },
  // 3. Dashboard stats – global view
  {
    target: '[data-tutorial="dashboard-stats"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Global Stats',
    content:
      'These stats reflect all bookings system-wide. You have visibility across every department.',
    before: () => navigateTo('home'),
  },
  // 4. Management – full access
  {
    target: '[data-tutorial="nav-management"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Full Management Access',
    content:
      'You can approve/reject bookings for all departments, manage all facilities, and assign user roles system-wide.',
    before: () => navigateTo('management'),
  },
  // 5. Infrastructure – full control
  {
    target: '[data-tutorial="nav-infrastructure"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Full Infrastructure Control',
    content:
      'Create and manage departments, locations, and global blackout periods that affect all facilities across the system.',
    before: () => navigateTo('infrastructure'),
  },
  // 6. Complete
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Super Admin Tour Complete! ✅',
    content:
      'You have complete control of the system. Use the help button to replay this tour anytime.',
  },
];

// ── Full Tutorials (for help button replay) ─────────────────────────────────
export const fullUserTutorial: Step[] = [...userTutorialSteps];

export const fullAdminTutorial: Step[] = [
  ...userTutorialSteps.slice(0, -1), // Remove the "all set" final step
  ...adminUpgradeTutorialSteps,
];

export const fullSuperAdminTutorial: Step[] = [
  ...userTutorialSteps.slice(0, -1),
  ...adminUpgradeTutorialSteps.slice(0, -1), // Remove admin's "complete" step
  ...superAdminUpgradeTutorialSteps,
];

export function getTutorialSteps(
  currentRole: string,
  tutorialRole: string | undefined,
  isReplay: boolean
): Step[] {
  // Help-button replay → full tutorial for current role
  if (isReplay) {
    if (currentRole === 'super_admin') return fullSuperAdminTutorial;
    if (currentRole === 'admin') return fullAdminTutorial;
    return fullUserTutorial;
  }

  // First-time user (never seen any tutorial)
  if (!tutorialRole) {
    return userTutorialSteps;
  }

  // Role was upgraded → show only upgrade steps
  if (tutorialRole === 'user' && currentRole === 'admin') {
    return adminUpgradeTutorialSteps;
  }
  if (tutorialRole === 'user' && currentRole === 'super_admin') {
    return [...adminUpgradeTutorialSteps.slice(0, -1), ...superAdminUpgradeTutorialSteps];
  }
  if (tutorialRole === 'admin' && currentRole === 'super_admin') {
    return superAdminUpgradeTutorialSteps;
  }

  // Fallback: full tutorial for current role
  return getTutorialSteps(currentRole, undefined, true);
}
