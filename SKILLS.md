# Code Apps Skills: Reusable Patterns & Best Practices

This document captures proven patterns from the FacilityBook project that can be applied to any fullstack Dataverse Code App. These skills represent the "how to do things right" across all layers of the application.

---

## 1. Dataverse Service Layer Abstraction

**Objective**: Isolate Dataverse SDK details behind a clean, reusable service layer.

### Pattern Overview

Generated services (`Cr71a_facilitiesService`, `Cr71a_booking2sService`, etc.) provide basic CRUD operations but lack domain-specific logic. Wrap these in custom hook layers that:

- Abstract Dataverse SDK details (client, dataSourceName, type mappings)
- Implement business logic and validation
- Handle data transformation (Dataverse → App types → UI)
- Manage loading/error states consistently

### Implementation Example

```typescript
// Generated service (auto-created, minimal changes)
export class Cr71a_facilitiesService {
  private static readonly dataSourceName = 'cr71a_facilities';
  private static readonly client = getClient(dataSourcesInfo);

  public static async getAll(options?: IGetAllOptions): Promise<IOperationResult<Cr71a_facilities[]>> {
    return Cr71a_facilitiesService.client.retrieveMultipleRecordsAsync<Cr71a_facilities>(
      Cr71a_facilitiesService.dataSourceName,
      options
    );
  }
}

// Custom hook layer (your business logic here)
export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Call generated service with specific field selection
      const result = await Cr71a_facilitiesService.getAll({
        select: [
          'cr71a_facilityid',
          'cr71a_facilityname',
          '_cr71a_departmentname_value', // Lookup
          'cr71a_capacity',
          'cr71a_description',
          'cr71a_maxrecurrenceweeks'
        ],
        filter: 'statecode eq 0', // Active records only
        orderBy: ['cr71a_facilityname asc']
      });

      // Transform Dataverse format → App types
      if (result.data) {
        setFacilities(
          result.data.map(f => ({
            id: f.cr71a_facilityid,
            name: f.cr71a_facilityname,
            departmentId: f._cr71a_departmentname_value || '',
            capacity: parseInt(f.cr71a_capacity || '0', 10),
            description: f.cr71a_description || '',
            maxRecurrenceWeeks: parseInt(f.cr71a_maxrecurrenceweeks || '4', 10)
          }))
        );
      }
    } catch (err: any) {
      setError(`Failed to load facilities: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return { facilities, loading, error, loadFacilities };
}
```

### Key Considerations

- **Field Selection**: Always specify `select: [...]` to reduce payload size and improve performance
- **Filtering**: Use Dataverse FetchXML-style filters (`statecode eq 0` for active records)
- **Lookup Fields**: Reference computed lookup fields with underscore prefix (`_cr71a_departmentname_value`)
- **Error Handling**: Catch Dataverse SDK errors and map to human-readable messages
- **Batch Operations**: For multiple entities, fetch all in one service call with top parameter

---

## 2. Custom React Hooks as Abstraction Layer

**Objective**: Encapsulate business logic, state management, and side effects in reusable hooks.

### Pattern: Feature Hooks

Each feature (bookings, facilities, users) gets a dedicated hook that manages:
- Data loading and caching
- CRUD operations with optimistic updates
- Validation and error handling
- Loading states

### Core Booking Hook Example

```typescript
export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tutorial mode integration (covered in Session 4)
  const { isTutorialMode } = useTutorialMode();

  // Load all bookings
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_booking2sService.getAll({
        select: ['cr71a_booking2id', 'cr71a_bookingpurpose', '_cr71a_facilityname_value', ...],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_date desc'],
        top: 500 // Pagination
      });

      if (result.data) {
        const transformed = result.data.map(transformDataverseBooking);
        setBookings(transformed);
      }
    } catch (err: any) {
      setError(`Failed to load bookings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create booking with validation
  const createBooking = useCallback(async (booking: Omit<Booking, 'id'>) => {
    // Validate: no overlapping bookings
    const overlap = bookings.some(b => 
      b.facilityId === booking.facilityId &&
      checkDateTimeOverlap(b.startTime, b.endTime, booking.startTime, booking.endTime)
    );

    if (overlap) {
      throw new Error('Facility is already booked for this time period');
    }

    const result = await Cr71a_booking2sService.create({
      cr71a_facilityname: booking.facilityId,
      cr71a_bookingpurpose: booking.purpose,
      cr71a_starttime: booking.startTime,
      cr71a_endtime: booking.endTime
    });

    // Optimistic update
    const newBooking: Booking = { id: result.id, ...booking };
    setBookings(prev => [newBooking, ...prev]);
    
    return result.id;
  }, [bookings]);

  // Update booking status
  const updateBookingStatus = useCallback(async (id: string, status: BookingStatus) => {
    // Validate: allowed transitions
    const booking = bookings.find(b => b.id === id);
    if (!booking || !VALID_TRANSITIONS[booking.status].includes(status)) {
      throw new Error(`Cannot transition from ${booking?.status} to ${status}`);
    }

    await Cr71a_booking2sService.update(id, {
      cr71a_status: STATUS_TO_DATAVERSE[status]
    });

    // Optimistic update
    setBookings(prev => 
      prev.map(b => b.id === id ? { ...b, status } : b)
    );
  }, [bookings]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return { bookings, loading, error, createBooking, updateBookingStatus };
}
```

### Key Skill Points

1. **Separation of Concerns**: Hook handles state + service calls; components don't call services directly
2. **Validation at Hook Level**: Business rules (overlapping bookings, status transitions) enforced before Dataverse calls
3. **Optimistic Updates**: Update UI immediately, fall back to reload on error
4. **Consistent State Shape**: All hooks follow `{ data, loading, error, actions }` pattern
5. **Memoization**: Use `useCallback` to prevent unnecessary re-renders

---

## 3. Context API for App-Wide State Management

**Objective**: Coordinate multiple hooks and expose app state to all components without prop drilling.

### Pattern: Composite Context

Create a single `AppContext` that composes all feature hooks and exposes a unified API.

```typescript
interface AppContextType {
  // State from all hooks
  departments: Department[];
  facilities: Facility[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;

  // Composite actions
  addBooking: (booking: Booking, recurrence?: RecurrenceConfig) => Promise<string[]>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  
  // Utility methods
  getVisibleFacilities: (facilities: Facility[], userDepartmentId?: string) => Facility[];
  getDepartmentForBooking: (booking: Booking) => string | undefined;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Compose all hooks
  const { departments, ...deptMethods } = useDepartments();
  const { facilities, ...facilityMethods } = useFacilities();
  const { bookings, ...bookingMethods } = useBookings();

  const loading = deptLoading || facilityLoading || bookingLoading;
  const error = deptError || facilityError || bookingError;

  // Composite methods (orchestrate multiple hooks)
  const addBooking = async (booking: Booking, recurrence?: RecurrenceConfig) => {
    const ids = [];
    
    if (recurrence?.type === 'weekly') {
      for (let i = 0; i < recurrence.weeks; i++) {
        const bookingWithDate = {
          ...booking,
          date: addWeeks(parseISO(booking.date), i)
        };
        const id = await bookingMethods.createBooking(bookingWithDate);
        ids.push(id);
      }
    } else {
      const id = await bookingMethods.createBooking(booking);
      ids.push(id);
    }

    return ids;
  };

  return (
    <AppContext.Provider value={{
      departments, facilities, bookings,
      loading, error,
      addBooking, updateBookingStatus: bookingMethods.updateBookingStatus,
      ...
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
```

### Benefits

- **Single Source of Truth**: All app state flows through one context
- **Dependency Injection**: Components consume what they need without importing individual hooks
- **Composite Actions**: Orchestrate multi-step workflows (e.g., recurring bookings, approval chains)
- **Loading/Error Coordination**: Track overall app state, not per-hook

---

## 4. Type-First Design (Single Source of Truth)

**Objective**: Define all data structures once in `types.ts` and synchronize them across layers.

### Pattern: Layered Type Hierarchy

```typescript
// src/types.ts — SINGLE SOURCE OF TRUTH

// Domain models (what the app works with)
export interface Facility {
  id: string;
  name: string;
  departmentId: string;
  capacity: number;
  description: string;
  maxRecurrenceWeeks: number;
  autoApprove?: boolean;
  approvalMode?: 'department_admins' | 'specific_approvers';
}

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// These types are used everywhere:
// - Hooks (useFacilities returns Facility[])
// - Context (AppContext exposes Facility[])
// - Components (receive Facility as props)
// - Generation code (generated models map to these)
```

### Synchronization Strategy

1. **Generated Models** → **App Types**: Transform in hooks
   ```typescript
   // In useFacilities
   const facility: Facility = {
     id: dataverseFacility.cr71a_facilityid,
     name: dataverseFacility.cr71a_facilityname,
     // ... map all fields
   };
   ```

2. **App Types** → **Dataverse Payload**: Transform on create/update
   ```typescript
   // In Cr71a_facilitiesService.create wrapper
   const payload = {
     cr71a_facilityname: facility.name,
     cr71a_capacity: facility.capacity,
     // ... map back to Dataverse schema
   };
   ```

3. **Type Validation**: Use TypeScript strictly
   ```typescript
   // Compile error if types mismatch
   const booking: Booking = loadedBooking; // Must match structure
   ```

### Anti-Patterns to Avoid

❌ **Don't**: Define types in multiple places (types.ts, models.ts, hooks.ts)  
✅ **Do**: Single types.ts, import everywhere

❌ **Don't**: Use `any` or loose typings  
✅ **Do**: Strong types enforced by TypeScript compiler

---

## 5. Configuration-Driven Approach (No Hardcoding)

**Objective**: Externalize all configurable aspects so apps scale without code changes.

### Pattern 1: Feature Flags

```typescript
// src/config/features.ts
export const FEATURES = {
  RECURRING_BOOKINGS: true,
  APPROVAL_WORKFLOWS: true,
  MULTI_DEPARTMENT_FACILITIES: true,
  TUTORIAL_MODE: true,
  AUDIT_LOGGING: true
};

// In components
if (FEATURES.RECURRING_BOOKINGS) {
  return <RecurrenceSelector />;
}
```

### Pattern 2: Business Rules (Configuration Table)

Instead of hardcoding rules like "max booking duration = 4 weeks", store in Dataverse:

```typescript
// Config table in Dataverse: cr_Configuration
interface SystemConfig {
  id: string;
  configKey: string; // e.g., "max_booking_weeks"
  configValue: string; // e.g., "4"
  description?: string;
}

// In hook
const loadConfig = async () => {
  const result = await ConfigService.getAll({
    filter: `cr_active eq 1`,
  });
  
  const config = new Map(
    result.data.map(item => [item.configKey, item.configValue])
  );
  
  return {
    maxBookingWeeks: parseInt(config.get('max_booking_weeks') || '4'),
    autoApprovalDays: parseInt(config.get('auto_approval_days') || '2'),
  };
};
```

### Pattern 3: Layout Configuration (Metadata-Driven UI)

```typescript
// Config table defining form fields dynamically
interface FieldConfig {
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'lookup';
  label: string;
  required: boolean;
  order: number;
  visible: boolean;
}

// In component
export const DynamicForm: React.FC<{ entityType: string }> = ({ entityType }) => {
  const [fields, setFields] = useState<FieldConfig[]>([]);

  useEffect(() => {
    // Load field config from metadata service
    FieldConfigService.getByEntity(entityType).then(setFields);
  }, [entityType]);

  return (
    <form>
      {fields
        .sort(f => f.order)
        .filter(f => f.visible)
        .map(field => (
          <FormField key={field.fieldName} config={field} />
        ))}
    </form>
  );
};
```

### Key Benefits

- **No Code Redeployment**: Change behavior via config tables
- **Environmental Differences**: Dev/Test/Prod have different config without rebuilding
- **User-Configurable**: Admins can adjust rules without developer involvement

---

## 6. Pluggable Business Rules Engine

**Objective**: Allow complex workflows (approvals, validations, calculations) to be configured, not hardcoded.

### Pattern: Rule Registry

```typescript
// src/rules/ruleRegistry.ts
export interface ValidationRule {
  id: string;
  name: string;
  entityType: string;
  condition: (record: any) => boolean;
  errorMessage: string;
}

export interface ApprovalRule {
  id: string;
  facilityId: string;
  approverType: 'user' | 'department' | 'auto';
  approverProfileId?: string;
  approverId?: string;
  requiresComment?: boolean;
}

// Registry for validation rules
const validationRules: Map<string, ValidationRule[]> = new Map();

// In booking creation
const validateBooking = async (booking: Booking) => {
  const rules = validationRules.get('booking') || [];
  
  for (const rule of rules) {
    if (!rule.condition(booking)) {
      throw new Error(rule.errorMessage);
    }
  }
};

// In approval workflow
const getApproversForFacility = (facility: Facility) => {
  const rules = ApprovalRuleService.getByFacilityId(facility.id);
  
  if (rules.some(r => r.approverType === 'auto')) {
    return []; // Auto-approve, no human approvers needed
  }
  
  // Return list of users/departments to notify
  return rules
    .filter(r => r.approverType === 'user' || r.approverType === 'department')
    .map(r => ({ type: r.approverType, id: r.approverProfileId || r.approverId }));
};
```

### Benefits

- **Decoupled**: Rules defined separately from execution
- **Reusable**: Same rule engine across multiple entities
- **Testable**: Inject rules into functions for unit testing
- **Dynamic**: Load rules from Dataverse at runtime

---

## 7. Audit Logging & Compliance

**Objective**: Track all changes for compliance, debugging, and user accountability.

### Pattern: Audit Hook with Context

```typescript
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  entityType: string;
  recordId: string;
  timestamp: string;
  changes?: Record<string, { before: any; after: any }>;
  details?: string;
}

export function useAuditLogs() {
  const createLog = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const payload = {
      cr71a_action: log.action,
      cr71a_entitytype: log.entityType,
      'cr71a_UserId@odata.bind': `/systemusers(${log.userId})`,
      cr71a_recordid: log.recordId,
      cr71a_details: JSON.stringify(log.changes),
      createdon: new Date().toISOString()
    };

    await Cr71a_auditlogsService.create(payload);
  };

  return { createLog };
}

// In context, trigger audit logs on every action
const addBooking = async (booking: Booking) => {
  const id = await bookingMethods.createBooking(booking);
  
  await auditMethods.createLog({
    action: 'create',
    entityType: 'booking',
    recordId: id,
    userId: user.id,
    userName: user.name,
    details: `Created booking for facility ${booking.facilityId}`
  });

  return id;
};
```

### Keys to Effective Auditing

1. **Automatic Triggers**: Log all CRUD operations automatically
2. **User Context**: Always capture who made the change
3. **Detailed Changes**: Record before/after values for updates
4. **Immutable Logs**: Audit logs should never be deleted or modified

---

## 8. Error Handling & Loading States

**Objective**: Provide consistent, user-friendly error handling across the app.

### Pattern: Unified Error Boundary + Hook States

```typescript
// Custom hook pattern (all hooks follow this)
export const useBookings = () => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.getAll(...);
      setData(result.data);
    } catch (err: any) {
      // Map Dataverse SDK errors to user-friendly messages
      const message = err.message?.includes('Authentication')
        ? 'Your session has expired. Please log in again.'
        : `Failed to load bookings: ${err.message || 'Unknown error'}`;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, load };
};

// In components
const MyComponent = () => {
  const { data, loading, error } = useBookings();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={reload} />;
  
  return <BookingList bookings={data} />;
};

// Global error boundary
export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(`An unexpected error occurred: ${event.message}`);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) return <ErrorAlert message={error} />;
  return <>{children}</>;
};
```

---

## 9. Environment-Based Configuration

**Objective**: Support Dev/Test/Prod with different configs without code changes.

### Pattern: ENV Variables + Vite Configuration

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    define: {
      'process.env.DATAVERSE_ENV': JSON.stringify(env.DATAVERSE_ENV),
      'process.env.API_ENDPOINT': JSON.stringify(env.API_ENDPOINT),
    },
  };
});

// .env.development
DATAVERSE_ENV=dev
API_ENDPOINT=https://dev-org.crm.dynamics.com
ENABLE_DEBUG_LOGS=true

// .env.production
DATAVERSE_ENV=prod
API_ENDPOINT=https://prod-org.crm.dynamics.com
ENABLE_DEBUG_LOGS=false

// In code
const isDev = process.env.DATAVERSE_ENV === 'dev';
const apiEndpoint = process.env.API_ENDPOINT;

if (process.env.ENABLE_DEBUG_LOGS) {
  console.log('Debug mode enabled');
}
```

### Multi-Tenant Configuration

```typescript
// Load tenant-specific config at runtime
const loadTenantConfig = async (tenantId: string) => {
  const result = await TenantConfigService.getByTenantId(tenantId);
  
  return {
    tenantId,
    branding: result.branding,
    features: JSON.parse(result.enabledFeatures),
    approvalLevels: result.approvalLevels,
    maxBookingDays: result.maxBookingDays
  };
};
```

---

## 10. Testing Patterns for Dataverse Integration

**Objective**: Test business logic without depending on live Dataverse environments.

### Pattern: Service Mocking & Stubs

```typescript
// src/__tests__/mocks/facilityServiceMock.ts
export const mockFacilitiesService = {
  getAll: jest.fn(async () => ({
    data: [
      {
        cr71a_facilityid: 'fac-1',
        cr71a_facilityname: 'Lab A',
        cr71a_capacity: '30',
        cr71a_description: 'Test facility'
      }
    ]
  }))
};

// Mock the generated service
jest.mock('../generated/services/Cr71a_facilitiesService', () => ({
  Cr71a_facilitiesService: mockFacilitiesService
}));

// Test hook
describe('useFacilities', () => {
  it('should load and transform facilities', async () => {
    const { result } = renderHook(() => useFacilities());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.facilities).toHaveLength(1);
    expect(result.current.facilities[0].name).toBe('Lab A');
  });

  it('should handle errors gracefully', async () => {
    mockFacilitiesService.getAll.mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useFacilities());
    
    await waitFor(() => {
      expect(result.current.error).toContain('Network error');
    });
  });
});

// Integration test (with demo mode)
describe('useBookings - Integration', () => {
  it('should create and validate booking', async () => {
    const { result } = renderHook(() => useBookings());

    act(() => {
      result.current.createBooking({
        facilityId: 'fac-1',
        userId: 'user-1',
        startTime: '2026-04-09T09:00:00',
        endTime: '2026-04-09T10:00:00',
        purpose: 'Team meeting'
      });
    });

    await waitFor(() => {
      expect(result.current.bookings).toHaveLength(1);
    });
  });
});
```

---

## 11. npm CLI Commands (Replacing pac code)

**Objective**: Use the new npm-based CLI (`npx power-apps`) introduced in `@microsoft/power-apps` v1.0.4+ as the primary toolchain for code app development. The `pac code` commands are deprecated and will be removed in a future release.

### Prerequisites

- `@microsoft/power-apps` ≥ 1.0.4 (latest: 1.1.1)
- Node.js LTS
- No separate Power Platform CLI installation required

### Command Reference

| npm CLI Command | Old pac CLI Equivalent | Purpose |
|---|---|---|
| `npx power-apps init` | `pac code init` | Initialize code app metadata |
| `npx power-apps run` | `npm run dev` | Start local dev server |
| `npx power-apps push` | `pac code push` | Publish to Power Platform |
| `npx power-apps find-dataverse-api` | _(none)_ | Discover Dataverse operations |
| `npx power-apps add-dataverse-api` | _(none)_ | Add Dataverse action/function |
| `npx power-apps list-flows` | _(none)_ | List solution-aware flows |
| `npx power-apps add-flow` | _(none)_ | Add Power Automate flow |
| `npx power-apps remove-flow` | _(none)_ | Remove flow from app |

### Pattern: Project Initialization

```bash
# Step 1: Scaffold from official template
npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app
cd my-app

# Step 2: Install dependencies
npm install

# Step 3: Initialize code app (interactive or with flags)
npx power-apps init
# or:
npx power-apps init --display-name "My App" --environment-id <env-id>

# Step 4: Test locally
npm run dev

# Step 5: Build and deploy
npm run build
npx power-apps push
```

### Key Differences from pac code

1. **Authentication**: `npx power-apps init` handles auth automatically (no separate `pac auth create`)
2. **Fewer prerequisites**: No .NET SDK or Power Platform CLI installation needed
3. **New capabilities**: `find-dataverse-api`, `add-dataverse-api`, `list-flows`, `add-flow` are npm-only
4. **Same generated output**: Both CLIs produce identical `power.config.json`, models, and services

### When to Use Which

- **New projects**: Always use `npx power-apps` commands
- **Existing projects on pac code**: Continue using `pac code` but plan migration; both work side-by-side
- **Dataverse actions, functions, flows**: npm CLI only (no `pac code` equivalent)

---

## 12. Dataverse Actions & Functions

**Objective**: Discover and call Dataverse Web API actions and functions (e.g., `WhoAmI`, `AddToQueue`, custom actions) from your code app using generated, strongly-typed service classes.

> **Requires**: `@microsoft/power-apps` ≥ 1.1.1, npm CLI only

### Pattern: Discover → Add → Use

#### Step 1: Discover Available Operations

```bash
# Search by name (case-insensitive substring match)
npx power-apps find-dataverse-api --search "WhoAmI"

# Output:
# ====================================================================
# Dataverse Operations
# ====================================================================
#   WhoAmI  (Function)
#   Returns: mscrm.WhoAmIResponse
# --------------------------------------------------------------------
# Total: 1 operation(s)

# Get raw JSON for scripting/agents
npx power-apps find-dataverse-api --search "WhoAmI" --json
```

#### Step 2: Add the Operation

```bash
npx power-apps add-dataverse-api --api-name WhoAmI
# or short alias:
npx power-apps add-dataverse-api -n WhoAmI
```

**What this does**:
1. Fetches operation definition from Dataverse `$metadata`
2. Creates schema file at `<schemaPath>/dataverse/WhoAmI.Schema.json`
3. Saves referenced entity schemas (skips if existing)
4. Updates `power.config.json` with `databaseReferences["default.cds"]`
5. Regenerates `dataSourcesInfo.ts`
6. Generates `WhoAmIService.ts` and corresponding model types

#### Step 3: Use the Generated Service

```typescript
import { WhoAmIService } from './generated/services/WhoAmIService';

// Unbound function — no record ID required
const result = await WhoAmIService.WhoAmI();
// result.value: { BusinessUnitId: string, UserId: string, OrganizationId: string }
```

### Bound vs. Unbound Operations

```typescript
// UNBOUND — environment-wide, no record ID
const whoAmI = await WhoAmIService.WhoAmI();

// BOUND — scoped to a specific record, first arg is always the GUID
import { AddToQueueService } from './generated/services/AddToQueueService';

const result = await AddToQueueService.AddToQueue(
  queueId,              // string — GUID of the destination queue
  target,               // Record<string, unknown> — the activity to add
  sourceQueue,           // Record<string, unknown> | undefined
  queueItemProperties    // Record<string, unknown> | undefined
);
// result.value: { QueueItemId: string }
```

### Generated Type Patterns

| Parameter/Return Type | TypeScript Mapping |
|---|---|
| GUID | `string` |
| Lookup (entity reference) | `Record<string, unknown>` |
| No return value | `Promise<IOperationResult<void>>` |
| Scalar (boolean, number) | `Promise<IOperationResult<T>>` |
| Complex type or entity | `Promise<IOperationResult<Record<string, unknown>>>` |

### Key Considerations

- **Idempotent re-runs**: Running `add-dataverse-api` again with the same name safely overwrites schema and regenerates files without duplicates
- **Schema refresh**: Re-run to pick up changes to an operation's signature after Dataverse updates
- **pac code skips these**: `pac code add-data-source` will skip operation schema files with a "Skipping unsupported Dataverse operation schema" message — this is expected

---

## 13. Power Automate Flow Integration

**Objective**: Discover, add, invoke, and manage Power Automate cloud flows from a code app using generated, strongly-typed service classes.

> **Requires**: `@microsoft/power-apps` ≥ 1.1.1, npm CLI only

### Pattern: List → Add → Call → Update/Remove

#### Step 1: List Available Flows

```bash
npx power-apps list-flows

# Output:
# Name                    Status   Modified On   Flow ID
# ──────────────────────────────────────────────────────────
# Approval Workflow       Started  2026-01-15    a0a0a0a0-...
# Send Notification       Started  2026-02-01    b1b1b1b1-...

# Filter by name
npx power-apps list-flows --search approval
```

#### Step 2: Add a Flow

```bash
npx power-apps add-flow --flow-id a0a0a0a0-bbbb-cccc-dddd-e1e1e1e1e1e1
```

**Generated files**:
```
src/
  services/
    ApprovalWorkflowService.ts   ← typed service class
  models/
    ApprovalWorkflowModel.ts     ← input/output types
schemas/
  logicflows/
    ApprovalWorkflow.Schema.json ← OpenAPI schema (do not edit)
```

#### Step 3: Call the Flow

```typescript
// Flow WITH input parameters
import { ApprovalWorkflowService } from './services/ApprovalWorkflowService';

const result = await ApprovalWorkflowService.Run({
  requester: 'Alex',
  amount: 1500,
});

if (result.success) {
  console.log('Flow triggered. Response:', result.data);
} else {
  console.error('Flow failed:', result.error);
}

// Flow WITHOUT input parameters
import { SendNotificationService } from './services/SendNotificationService';
const result = await SendNotificationService.Run();
```

**Result shape**:
| Property | Type | Description |
|---|---|---|
| `success` | `boolean` | `true` if flow triggered successfully |
| `data` | varies | Typed response payload from the flow |
| `error` | `Error?` | Error details when `success` is `false` |

#### Step 4: Update or Remove

```bash
# Re-run to pick up flow definition changes (idempotent)
npx power-apps add-flow --flow-id <flow-id>

# Remove by data source name
npx power-apps remove-flow --flow-name ApprovalWorkflow

# Remove by flow ID
npx power-apps remove-flow --flow-id <flow-id>
```

### Limitations

- **PowerApps trigger only**: Only manual flows with the PowerApps trigger type are supported
- **Solution-aware only**: `list-flows` only shows flows belonging to a solution
- **Maker access required**: The developer running `add-flow` must have access to the flow and its underlying connections
- **Dataverse permissions at runtime**: End users need sufficient Dataverse permissions (e.g., App Opener security role)
- **npm CLI only**: Not available in `pac code` commands
- **No auto-refresh**: Re-run `add-flow` manually after flow definition changes

---

## 14. Context & Metadata APIs

**Objective**: Retrieve runtime context (app, user, host) and Dataverse table metadata for personalization, dynamic forms, and localized labels.

### Pattern 1: App/User/Host Context

```typescript
import { getContext } from '@microsoft/power-apps/app';

const ctx = await getContext();

// App context
const appId = ctx.app.appId;                    // App ID
const environmentId = ctx.app.environmentId;    // Environment ID
const queryParams = ctx.app.queryParams;        // URL query params

// User context
const fullName = ctx.user.fullName;             // "John Doe"
const objectId = ctx.user.objectId;             // Azure AD object ID
const tenantId = ctx.user.tenantId;             // Tenant ID
const upn = ctx.user.userPrincipalName;         // "john@contoso.com"

// Host context
const sessionId = ctx.host.sessionId;           // Changes per app launch
```

**Use cases**:
- Personalize UI based on user identity
- Feature flags tied to specific environments
- Correlate sessions with platform telemetry
- Pass query params for deep linking

### Pattern 2: Table Metadata at Runtime

```typescript
import { AccountsService } from './generated/services/AccountsService';

// Get localized column labels
const { data } = await AccountsService.getMetadata({
  schema: { columns: 'all' }
});

const columnLabels: Record<string, string> = {};
if (data.Attributes) {
  for (const attr of data.Attributes) {
    const label = attr.DisplayName?.UserLocalizedLabel?.Label;
    if (label) columnLabels[attr.LogicalName] = label;
  }
}

// Identify required fields for dynamic form validation
const requiredFields = data.Attributes
  ?.filter(attr => attr.IsRequiredForForm)
  .map(attr => ({
    logicalName: attr.LogicalName,
    displayName: attr.DisplayName?.UserLocalizedLabel?.Label,
    attributeType: attr.AttributeTypeName?.Value
  })) || [];

// Discover lookup relationships
const { data: relData } = await AccountsService.getMetadata({
  metadata: ['LogicalName', 'DisplayName'],
  schema: { manyToOne: true }
});

const lookups = relData.ManyToOneRelationships?.map(rel => ({
  lookupField: rel.ReferencingAttribute,
  relatedTable: rel.ReferencedEntity,
  relationshipName: rel.SchemaName,
})) || [];
```

### GetEntityMetadataOptions Interface

```typescript
interface GetEntityMetadataOptions {
  metadata?: Array<String>;        // Entity-level properties
  schema?: {
    columns?: "all" | Array<String>;  // Column metadata
    oneToMany?: boolean;              // 1:N relationships
    manyToOne?: boolean;              // N:1 (lookup) relationships
    manyToMany?: boolean;             // N:N relationships
  };
}
```

### Best Practices

- **Cache metadata**: Metadata calls are heavy — cache at app start or per session
- **Request only what you need**: Prefer a column list over `"all"` for performance
- **Defensive access**: Check for property existence: `DisplayName?.UserLocalizedLabel?.Label`
- **Use TypeScript types**: Rely on generated types from the Dataverse Web API

---

## 15. v1.0 Client Library Migration

**Objective**: Migrate from `@microsoft/power-apps` v0.3.x to v1.0+ by removing the deprecated `initialize()` function and adopting the new `setConfig` API.

### Breaking Change: No More `initialize()`

In v1.0+, the client library initializes automatically. You can call data services, retrieve context, and interact with the platform immediately — no initialization wait required.

#### Remove This Code

```typescript
// ❌ REMOVE — no longer needed in v1.0+
import { initialize } from '@microsoft/power-apps';

useEffect(() => {
  const init = async () => {
    try {
      await initialize();
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize Power Apps client library');
      setLoading(false);
    }
  };
  init();
}, []);

// ❌ REMOVE — initialization state flags
if (!isInitialized) return;
```

#### Replace With Direct Calls

```typescript
// ✅ v1.0+ — call services directly, no initialization needed
useEffect(() => {
  const loadData = async () => {
    try {
      const result = await Cr71a_facilitiesService.getAll({
        select: ['cr71a_facilityid', 'cr71a_facilityname'],
        filter: 'statecode eq 0'
      });
      setFacilities(result.data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };
  loadData();
}, []);
```

### New `setConfig` API

```typescript
import { setConfig } from '@microsoft/power-apps/app';

// Configure observability — supply a logger for session and network metrics
setConfig({
  logger: {
    logMetric: (metricName: string, metricValue: number, properties?: Record<string, string>) => {
      // Send to Azure App Insights or your telemetry service
      appInsights.trackMetric({ name: metricName, average: metricValue }, properties);
    }
  }
});
```

### Migration Checklist

- ✅ Remove `import { initialize } from '@microsoft/power-apps'`
- ✅ Remove `await initialize()` calls and related `useEffect` wrappers
- ✅ Remove `isInitialized` state flags and conditional guards
- ✅ Call data services directly in `useEffect` or event handlers
- ✅ (Optional) Add `setConfig` with a logger for observability

---

## 16. ALM & Solution Deployment

**Objective**: Manage code app lifecycle across Dev/Test/Prod environments using solutions, connection references, environment variables, and pipelines.

### Pattern 1: Solution-Based Deployment

```bash
# Deploy to a specific solution
pac code push --solutionName MySolution

# If a preferred solution is configured in the environment,
# pac code push saves to it by default (no flag needed)
pac code push
```

After deployment, add to a solution via Power Apps UI:
1. Go to make.powerapps.com → Solutions
2. Select your solution → Add existing → App → Code app

### Pattern 2: Connection References for Portability

Instead of binding directly to a user-specific connection, bind to a connection reference that resolves per-environment:

```bash
# List connection references in a solution
pac code list-connection-references -env <environmentURL> -s <solutionID>

# Add data source using connection reference
pac code add-data-source -a <apiName> -cr <connectionReferenceLogicalName> -s <solutionID>
```

**Why this matters**: Connection references are solution components — when you export/import the solution to another environment, the app automatically uses the correct connection for that environment.

### Pattern 3: Environment Variables in Data Sources

Use `@envvar:` prefix for ALM-portable dataset and table values:

```bash
pac code add-data-source \
  --apiid shared_sharepointonline \
  --connectionId <id> \
  --dataset "@envvar:crd1b_SharepointSiteVar" \
  --table "@envvar:crd1b_sharepointList"
```

The `@envvar:` references persist in `power.config.json`. When the app moves to another environment, it resolves the values configured for those environment variables in that environment — no code changes needed.

### Pattern 4: Pipeline Deployment (Dev → Test → Prod)

1. **Develop locally**: `npm run dev` with `npx power-apps run`
2. **Push to Dev**: `npm run build && npx power-apps push`
3. **Add to solution**: Include in a Dataverse solution
4. **Deploy via Pipelines**: Use Power Platform Pipelines with preflight checks for dependencies, connection references, etc.

### Key Considerations

- Code apps don't support Solution Packager or Power Platform Git integration
- Code apps aren't available in Power Apps mobile or Power Apps for Windows
- Sensitive data should be stored in Dataverse, not in app code (hosted app code is publicly accessible)
- Hide the Power Apps header in shared URLs: append `?hideNavBar=true`

---

## Summary: Skills Checklist

When building a Code App, ensure you cover:

- ✅ **Service Layer**: Generated services wrapped by custom hooks
- ✅ **Hooks Abstraction**: Business logic encapsulated in reusable hooks
- ✅ **Context Management**: App-wide state via context API
- ✅ **Type Safety**: Single source of truth in types.ts
- ✅ **Configuration**: No hardcoding; rules in metadata tables
- ✅ **Business Rules**: Pluggable, testable rule engine
- ✅ **Auditing**: Track all changes for compliance
- ✅ **Error Handling**: Consistent error states and user messages
- ✅ **Environment Config**: Dev/Test/Prod with .env files
- ✅ **Testing**: Mocks and integration tests for validation
- ✅ **npm CLI**: Use `npx power-apps` commands for init, run, push, and new features
- ✅ **Dataverse Actions**: Discover and call actions/functions via `find-dataverse-api` and `add-dataverse-api`
- ✅ **Flow Integration**: Add Power Automate flows with typed `Run()` methods
- ✅ **Context & Metadata**: Use `getContext()` and `getMetadata()` for runtime personalization
- ✅ **v1.0 Migration**: Remove `initialize()`, use `setConfig` for observability
- ✅ **ALM & Deployment**: Solutions, connection references, environment variables, pipelines

---

**Next Steps**: Review [SPECIFICATION.md](SPECIFICATION.md) for the architectural blueprint, then [AGENT-GUIDE.md](AGENT-GUIDE.md) for step-by-step scaffolding procedures.
