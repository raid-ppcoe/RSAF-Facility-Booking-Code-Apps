# Specification: Designing Scalable, Dynamic Code Apps on Dataverse

## Executive Summary

A **"dynamic, scalable Code App"** is one that grows with your business without hardcoding changes into the codebase. This specification provides the architectural blueprint for building such apps on Microsoft Dataverse, emphasizing:

- **No Hardcoding**: All configurable aspects stored in metadata tables, environment variables, or feature flags
- **Configuration-Driven**: UI layouts, business rules, approval workflows, and permissions defined declaratively
- **Extensible**: Plugins, webhooks, and custom actions allow teams to add features without modifying core code
- **Multi-Tenant Ready**: Support for multiple organizations/teams with isolated data and configuration
- **Real-Time Collaboration**: Optimistic updates, conflict resolution, and live synchronization
- **Future-Proof**: New fields, entities, and workflows can be added via configuration, not code

---

## Part 1: Core Principles

### 1.1 Principle: No Hardcoding

**Definition**: Hard-coded values (field names, business logic, approval rules, UI structure) are the enemy of scalability.

**Application**:

| What | Hardcoded ❌ | Dynamic ✅ |
|-----|-------------|---------|
| **Field Names** | `if (booking.status === 'pending')` | Load `STATUS_CONFIG` from metadata |
| **Business Rules** | Max booking weeks = 4 (in code) | Load from config table `cr_Configuration` |
| **UI Layout** | Form fields hardcoded in component | Load field config from metadata service |
| **Approval Workflows** | If user is admin, auto-approve | Load approval rules by facility/department |
| **Feature Availability** | Feature only available in prod | Use feature flags in environment config |

**Pattern**:

```typescript
// ❌ WRONG: Hardcoded
export const MAX_BOOKING_WEEKS = 4;
export const STATUSES = ['pending', 'approved', 'rejected'];

// ✅ RIGHT: Configuration-driven
const loadConfiguration = async () => {
  const config = await ConfigService.getAll();
  return {
    maxBookingWeeks: parseInt(config.find(c => c.key === 'max_booking_weeks')?.value || '4'),
    statuses: JSON.parse(config.find(c => c.key === 'booking_statuses')?.value || '["pending","approved","rejected"]')
  };
};
```

### 1.2 Principle: Configuration-Driven Architecture

**Definition**: Behavior is determined by configuration (metadata tables, environment variables, feature flags), not code branches.

**Layers of Configuration**:

1. **Environment Level** (`.env` files, CI/CD)
   ```
   DATAVERSE_ENV=dev
   API_ENDPOINT=https://dev-org.crm.dynamics.com
   ENABLE_DEBUG_LOGS=true
   ```

2. **System Level** (Dataverse configuration tables)
   ```
   Table: cr_Configuration
   - max_booking_weeks: 4
   - auto_approval_days: 2
   - enable_recurring_bookings: true
   - approval_chain_depth: 3
   ```

3. **Entity Level** (Metadata on specific records)
   ```
   Facility record fields:
   - approval_mode: 'specific_approvers' or 'department_admins'
   - auto_approve: true/false
   - enable_recurring: true/false
   ```

4. **User/Department Level** (Role-based configuration)
   ```
   Role: 'facility_admin' can edit facilities
   Department 'Engineering' has 5-person approval chain
   ```

### 1.3 Principle: Extensibility Through Plugins, Not Code Changes

**Definition**: New features should be addable without modifying core business logic.

**Plugin Architecture**:

```typescript
// Core app defines plugin interface
export interface BookingPlugin {
  id: string;
  name: string;
  hooks: {
    beforeCreate?: (booking: Booking) => Promise<void>;
    afterApprove?: (booking: Booking) => Promise<void>;
    onCancel?: (booking: Booking) => Promise<void>;
  };
}

// Teams can register custom plugins
const pluginRegistry: BookingPlugin[] = [];

export const registerPlugin = (plugin: BookingPlugin) => {
  pluginRegistry.push(plugin);
};

// Execute all plugin hooks
const executeHooks = async (action: 'beforeCreate' | 'afterApprove', booking: Booking) => {
  for (const plugin of pluginRegistry) {
    if (plugin.hooks[action]) {
      await plugin.hooks[action](booking);
    }
  }
};

// Example: Custom notification plugin
registerPlugin({
  id: 'teams-notifier',
  name: 'MS Teams Notifications',
  hooks: {
    afterApprove: async (booking: Booking) => {
      await TeamsClient.sendMessage(`Booking ${booking.id} approved!`);
    }
  }
});
```

### 1.4 Principle: Multi-Tenancy from the Ground Up

**Definition**: Architecture should assume multiple independent organizations/teams from day one.

**Implementation Strategy**:

```typescript
// Every query includes tenant filter
const getTenantId = () => {
  // From user context, session, or URL parameter
  return getUserContext()?.tenantId || getCurrentOrgId();
};

// All data fetches filtered by tenant
const loadBookings = async () => {
  const tenantId = getTenantId();
  const result = await BookingsService.getAll({
    filter: `_cr_tenantnid_value eq '${tenantId}' and statecode eq 0`
  });
  return result.data;
};

// Tenant configuration loaded separately
const loadTenantConfig = async () => {
  const tenantId = getTenantId();
  return await TenantConfigService.getByTenantId(tenantId);
};

// Audit logs include tenant context
const createAuditLog = async (log: AuditLog) => {
  const tenantId = getTenantId();
  return await AuditLogService.create({
    ...log,
    '_cr_tenantnid_value': tenantId,
    timestamp: new Date().toISOString()
  });
};
```

---

## Part 2: Architectural Layers

### 2.1 Data Layer: Dataverse Service Abstraction

**Responsibility**: Isolate Dataverse SDK details; provide clean, business-focused API.

**Components**:

```
Generated Services (Auto-created by Power Apps SDK)
    ↓
Custom Service Wrappers (Business logic, transformations)
    ↓
React Hooks (State management, optimistic updates)
    ↓
Context API (App-wide state coordination)
```

**Layer 1: Generated Services** (Auto-created, minimal changes)
```typescript
// Cr71a_facilitiesService.ts (do NOT modify)
export class Cr71a_facilitiesService {
  public static async getAll(options?: IGetAllOptions) { ... }
  public static async create(record: Cr71a_facilitiesBase) { ... }
  public static async update(id: string, changes: Partial<Cr71a_facilitiesBase>) { ... }
  public static async delete(id: string) { ... }
}
```

**Layer 2: Custom Wrappers** (Your business logic)
```typescript
// facilityService.wrapper.ts
export class FacilityServiceWrapper {
  static async getActiveFacilities(departmentId?: string) {
    const filter = `statecode eq 0${departmentId ? ` and _cr71a_departmentid_value eq '${departmentId}'` : ''}`;
    const result = await Cr71a_facilitiesService.getAll({
      select: ['cr71a_facilityid', 'cr71a_facilityname', 'cr71a_capacity', ...],
      filter,
      orderBy: ['cr71a_facilityname asc']
    });
    return result.data;
  }

  static async createFacilityWithDefaults(facility: Omit<Facility, 'id'>) {
    // Load tenant config
    const config = await TenantConfigService.getCurrent();
    
    const payload = {
      cr71a_facilityname: facility.name,
      cr71a_capacity: facility.capacity,
      // ... apply defaults from config
      cr71a_maxrecurrenceweeks: config.defaultMaxRecurrenceWeeks,
      cr71a_autoapproved: config.defaultAutoApprove
    };

    const result = await Cr71a_facilitiesService.create(payload);
    return result;
  }
}
```

**Key Characteristics**:

- ✅ Hides SDK complexity from React components
- ✅ Centralizes business logic (validation, transformations, defaults)
- ✅ Applies Dataverse-specific patterns (choice field mapping, OData filters)
- ✅ Handles batch operations for performance

### 2.2 Business Logic Layer: Rules & Validation

**Responsibility**: Enforce business rules independently of UI or Dataverse.

**Components**:

```typescript
// Validation rules
type ValidationResult = { valid: boolean; errors: string[] };

export interface BookingValidator {
  validate(booking: Booking): Promise<ValidationResult>;
}

const bookingValidators: BookingValidator[] = [
  {
    validate: async (booking: Booking) => {
      const conflicts = await BookingsService.getConflicting(
        booking.facilityId,
        booking.startTime,
        booking.endTime
      );
      return {
        valid: conflicts.length === 0,
        errors: conflicts.length > 0 ? ['Facility already booked for this time'] : []
      };
    }
  },
  {
    validate: async (booking: Booking) => {
      const facility = await FacilityService.getById(booking.facilityId);
      const weeks = getWeeksDuration(booking.startTime, booking.endTime);
      return {
        valid: weeks <= facility.maxRecurrenceWeeks,
        errors: weeks > facility.maxRecurrenceWeeks ? [`Exceeds max duration of ${facility.maxRecurrenceWeeks} weeks`] : []
      };
    }
  }
];

// Approval rules
export interface ApprovalRule {
  id: string;
  name: string;
  condition: (booking: Booking) => boolean;
  approversGenerator: (booking: Booking) => Promise<Approver[]>;
}

const approvalRules: ApprovalRule[] = [
  {
    id: 'department_admin_rule',
    name: 'Department Admin Approval',
    condition: (booking) => booking.status === 'pending',
    approversGenerator: async (booking) => {
      const facility = await FacilityService.getById(booking.facilityId);
      const admins = await AdminService.getByDepartment(facility.departmentId);
      return admins;
    }
  }
];

// Execute all validators
const validateBooking = async (booking: Booking): Promise<ValidationResult> => {
  const results = await Promise.all(
    bookingValidators.map(v => v.validate(booking))
  );

  const allErrors = results.flatMap(r => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
};

// Determine approvers dynamically
const getApproversForBooking = async (booking: Booking) => {
  const applicableRules = approvalRules.filter(r => r.condition(booking));
  
  const approverSets = await Promise.all(
    applicableRules.map(r => r.approversGenerator(booking))
  );

  // Merge and deduplicate
  return [...new Set(approverSets.flat())];
};
```

### 2.3 State Management Layer: Context API

**Responsibility**: Coordinate hooks and expose unified app interface.

**Pattern**:

```typescript
interface AppContextType {
  // Data
  facilities: Facility[];
  bookings: Booking[];
  // ... other entities
  
  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  createBooking: (booking: Booking) => Promise<string>;
  approveBooking: (bookingId: string, comment?: string) => Promise<void>;
  
  // Utilities
  validateBooking: (booking: Booking) => Promise<ValidationResult>;
  getApproversForBooking: (booking: Booking) => Promise<Approver[]>;
  canUserPerformAction: (action: string) => boolean;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Compose individual hooks
  const facilities = useFacilities();
  const bookings = useBookings();
  const auth = useAuth();
  const tenant = useTenant();

  // Composite action: Create booking with approval
  const createBooking = async (booking: Booking) => {
    // 1. Validate
    const validation = await validateBooking(booking);
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }

    // 2. Create record
    const bookingId = await bookings.create(booking);

    // 3. Find approvers
    const approvers = await getApproversForBooking(booking);

    // 4. Notify approvers (via plugin)
    await executeHooks('afterCreate', { ...booking, id: bookingId });

    // 5. Audit log
    await auditLog('create', 'booking', bookingId, {
      booking,
      approvers: approvers.map(a => a.id)
    });

    return bookingId;
  };

  return (
    <AppContext.Provider value={{
      facilities: facilities.data,
      bookings: bookings.data,
      loading: facilities.loading || bookings.loading,
      error: facilities.error || bookings.error,
      createBooking,
      validateBooking,
      getApproversForBooking,
      canUserPerformAction: (action) => {
        const userRole = auth.user?.role;
        const permissions = getUserPermissions(userRole);
        return permissions.includes(action);
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};
```

### 2.4 UI Layer: Configuration-Driven Components

**Responsibility**: Render UI based on configuration; delegate logic to lower layers.

**Pattern**: Metadata-Driven Form

```typescript
interface FormFieldConfig {
  fieldName: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'lookup' | 'choice';
  required: boolean;
  visible: boolean;
  order: number;
  lookupEntityType?: string;
  choices?: { label: string; value: string }[];
  validationRules?: ValidationRule[];
}

export const DynamicBookingForm: React.FC = () => {
  const [formConfig, setFormConfig] = useState<FormFieldConfig[]>([]);
  const [formData, setFormData] = useState({});
  const { createBooking, validateBooking } = useAppContext();

  // Load form config from metadata
  useEffect(() => {
    FormConfigService.getByEntity('booking').then(setFormConfig);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using business logic layer
    const validation = await validateBooking(formData as Booking);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Create booking via context
    const bookingId = await createBooking(formData as Booking);
    notifySuccess(`Booking ${bookingId} created!`);
  };

  return (
    <form onSubmit={handleSubmit}>
      {formConfig
        .filter(f => f.visible)
        .sort((a, b) => a.order - b.order)
        .map(field => (
          <DynamicFormField
            key={field.fieldName}
            config={field}
            value={formData[field.fieldName]}
            onChange={(value) => setFormData(prev => ({
              ...prev,
              [field.fieldName]: value
            }))}
          />
        ))}
      <button type="submit">Create Booking</button>
    </form>
  );
};

// DynamicFormField handles rendering based on config
const DynamicFormField: React.FC<{
  config: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
}> = ({ config, value, onChange }) => {
  switch (config.fieldType) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={config.required}
        />
      );
    case 'lookup':
      return (
        <LookupSelect
          entity={config.lookupEntityType!}
          value={value}
          onChange={onChange}
          required={config.required}
        />
      );
    case 'choice':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={config.required}
        >
          {config.choices?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    default:
      return null;
  }
};
```

---

## Part 3: Dynamic Scalability Techniques

### 3.1 Field-Level Configuration

**Problem**: Adding a new field requires code changes and redeployment.

**Solution**: Metadata-driven field registration.

```typescript
// Metadata table: cr_FieldConfiguration
interface FieldConfig {
  fieldName: string;
  entityType: string;
  label: string;
  fieldType: string;
  required: boolean;
  visible: boolean;
  defaultValue?: any;
  lookupEntity?: string;
  choices?: string; // JSON
  order: number;
  validationRules?: string; // JSON
}

// Load and cache
const fieldConfigCache = new Map<string, FieldConfig[]>();

const getFieldConfig = async (entityType: string) => {
  if (fieldConfigCache.has(entityType)) {
    return fieldConfigCache.get(entityType)!;
  }

  const result = await FieldConfigService.getByEntity(entityType);
  fieldConfigCache.set(entityType, result);
  return result;
};

// Use in components
const renderFields = async (entityType: string) => {
  const fields = await getFieldConfig(entityType);
  return fields
    .filter(f => f.visible)
    .sort((a, b) => a.order - b.order)
    .map(field => <DynamicFormField key={field.fieldName} config={field} />);
};
```

**Benefits**:

- Add fields via admin UI without code changes
- Enable/disable fields per tenant/department
- Reorder fields without redeployment
- Change validation rules dynamically

### 3.2 Layout Configuration

**Problem**: Changing UI layout (sidebar, tabs, modal structure) requires code and redeployment.

**Solution**: Layout defined in metadata.

```typescript
// Metadata table: cr_LayoutConfiguration
interface LayoutConfig {
  layoutId: string;
  layoutType: 'sidebar' | 'tabs' | 'grid' | 'modal';
  sections: LayoutSection[];
  visible: boolean;
  order: number;
}

interface LayoutSection {
  sectionId: string;
  title: string;
  componentName: string; // 'BookingForm', 'FacilityGrid', etc.
  props?: Record<string, any>;
  visible: boolean;
  width?: string; // 'full', 'half', 'third'
  order: number;
}

// Dynamic layout renderer
export const DynamicLayout: React.FC<{ layoutId: string }> = ({ layoutId }) => {
  const [layout, setLayout] = useState<LayoutConfig | null>(null);

  useEffect(() => {
    LayoutService.getById(layoutId).then(setLayout);
  }, [layoutId]);

  if (!layout) return <LoadingSpinner />;

  const sections = layout.sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="layout-container">
      {sections.map(section => {
        const Component = COMPONENT_REGISTRY[section.componentName];
        return (
          <div key={section.sectionId} className={`section-${section.width || 'full'}`}>
            <h3>{section.title}</h3>
            {Component ? (
              <Component {...section.props} />
            ) : (
              <ErrorMessage>Component {section.componentName} not found</ErrorMessage>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Component registry (teams add their custom components here)
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  'BookingForm': BookingForm,
  'FacilityGrid': FacilityGrid,
  'AvailabilityCalendar': AvailabilityCalendar,
  'ApprovalQueue': ApprovalQueue
};
```

### 3.3 Workflow Configuration

**Problem**: Hard-coding approval chains, notification flows, status transitions.

**Solution**: Workflow engine driven by configuration.

```typescript
// Workflow definition in Dataverse
interface WorkflowState {
  stateId: string;
  name: string;
  allowedTransitions: string[]; // Next state IDs
  actions: WorkflowAction[];
}

interface WorkflowAction {
  actionId: string;
  actionType: 'notify' | 'execute' | 'wait' | 'branch';
  config: any; // Action-specific config
  nextStateId: string;
}

interface Workflow {
  workflowId: string;
  name: string;
  initialStateId: string;
  states: WorkflowState[];
}

// Workflow engine
class WorkflowEngine {
  private workflow: Workflow;
  private currentStateId: string;
  private context: Record<string, any>;

  constructor(workflow: Workflow, initialContext: Record<string, any>) {
    this.workflow = workflow;
    this.currentStateId = workflow.initialStateId;
    this.context = initialContext;
  }

  async transitionTo(nextStateId: string) {
    const currentState = this.workflow.states.find(s => s.stateId === this.currentStateId)!;
    
    // Validate transition is allowed
    if (!currentState.allowedTransitions.includes(nextStateId)) {
      throw new Error(`Cannot transition from ${this.currentStateId} to ${nextStateId}`);
    }

    // Execute actions
    const nextState = this.workflow.states.find(s => s.stateId === nextStateId)!;
    for (const action of nextState.actions) {
      await this.executeAction(action);
    }

    this.currentStateId = nextStateId;
  }

  private async executeAction(action: WorkflowAction) {
    switch (action.actionType) {
      case 'notify':
        await NotificationService.send(action.config.recipients, action.config.message);
        break;
      case 'execute':
        const plugin = PLUGIN_REGISTRY[action.config.pluginId];
        if (plugin) await plugin.execute(this.context);
        break;
      case 'wait':
        // Wait for external approval, etc.
        break;
      case 'branch':
        if (action.config.condition(this.context)) {
          await this.transitionTo(action.config.trueBranchStateId);
        } else {
          await this.transitionTo(action.config.falseBranchStateId);
        }
        break;
    }
  }
}

// Usage
const approvalWorkflow = await WorkflowService.getByName('booking_approval');
const engine = new WorkflowEngine(approvalWorkflow, { booking: newBooking });

// Move through workflow
await engine.transitionTo('pending_approval');
// ... later, when approved
await engine.transitionTo('approved');
// ... or rejected
await engine.transitionTo('rejected');
```

### 3.4 Permission Matrix (Role-Based Access Control)

**Problem**: Hard-coding role-based permissions in code.

**Solution**: RBAC configuration table.

```typescript
// Metadata table: cr_Permission
interface Permission {
  permissionId: string;
  resourceType: string; // 'booking', 'facility', 'user'
  action: string; // 'create', 'read', 'update', 'delete', 'approve'
  roleId: string;
  tenantId: string;
}

interface RolePermissionCache {
  [roleId: string]: {
    [resourceType: string]: string[]; // actions
  };
}

const permissionCache: RolePermissionCache = {};

// Load permissions for user role
const getUserPermissions = async (userId: string, roleId: string, tenantId: string) => {
  const cacheKey = `${roleId}@${tenantId}`;
  
  if (permissionCache[cacheKey]) {
    return permissionCache[cacheKey];
  }

  const permissions = await PermissionService.getByRole(roleId, tenantId);
  
  const grouped = permissions.reduce((acc, perm) => {
    if (!acc[perm.resourceType]) acc[perm.resourceType] = [];
    acc[perm.resourceType].push(perm.action);
    return acc;
  }, {} as RolePermissionCache);

  permissionCache[cacheKey] = grouped;
  return grouped;
};

// Use in code
const canUserDeleteBooking = async (userId: string, roleId: string) => {
  const permissions = await getUserPermissions(userId, roleId, getTenantId());
  return permissions['booking']?.includes('delete') ?? false;
};

// In UI
const DeleteButton = ({ bookingId }: { bookingId: string }) => {
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    canUserDeleteBooking(auth.user!.id, auth.user!.role).then(setCanDelete);
  }, []);

  if (!canDelete) return null;

  return <button onClick={() => deleteBooking(bookingId)}>Delete</button>;
};
```

### 3.5 Custom Extensibility Hooks

**Problem**: Teams need to add custom behavior (integrations, notifications) without forking the codebase.

**Solution**: Plugin/Hook system.

```typescript
// Core hook definitions
export interface AppHook {
  id: string;
  name: string;
  version: string;
  handlers: {
    [hookName: string]: (context: any) => Promise<void>;
  };
}

// Hook registry
const hookRegistry = new Map<string, AppHook[]>();

export const registerHook = (hook: AppHook) => {
  if (!hookRegistry.has(hook.id)) {
    hookRegistry.set(hook.id, []);
  }
  hookRegistry.get(hook.id)!.push(hook);
};

// Hook executor
export const executeHook = async (hookName: string, context: any) => {
  const results = [];

  for (const [, hooks] of hookRegistry) {
    for (const hook of hooks) {
      if (hook.handlers[hookName]) {
        try {
          await hook.handlers[hookName](context);
          results.push({ hookId: hook.id, status: 'success' });
        } catch (err) {
          results.push({ hookId: hook.id, status: 'error', error: (err as Error).message });
        }
      }
    }
  }

  return results;
};

// Example: Teams notification hook
registerHook({
  id: 'teams-notifications',
  name: 'Microsoft Teams Notifications',
  version: '1.0.0',
  handlers: {
    'booking:created': async (context: { booking: Booking; approvers: User[] }) => {
      const message = `New booking created: ${context.booking.purpose}`;
      for (const approver of context.approvers) {
        if (approver.meetsTeamsChannel) {
          await TeamsClient.sendNotification(approver.meetsTeamsChannel, message);
        }
      }
    },
    'booking:approved': async (context: { booking: Booking }) => {
      await TeamsClient.sendNotification('general', `Booking approved: ${context.booking.id}`);
    }
  }
});

// In business logic
const createBooking = async (booking: Booking) => {
  const approvers = await getApproversForBooking(booking);
  
  // Execute hooks
  await executeHook('booking:created', { booking, approvers });
  
  return booking.id;
};
```

---

## Part 4: Key Design Patterns

### 4.1 Service Wrapper Pattern

Wrap auto-generated services with business logic and transformation.

```typescript
// Generated (DO NOT MODIFY)
Cr71a_booking2sService.create(record)

// Wrapper (YOUR LOGIC)
BookingServiceWrapper.createWithApproval(booking) {
  1. Validate
  2. Create record
  3. Find approvers
  4. Notify
  5. Audit log
  6. Execute hooks
}
```

### 4.2 Hook as Feature Logic

Encapsulate feature behavior (data + operations + state) in a single hook.

```typescript
export function useFeature() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const load = async () => { ... };
  const create = async (item) => { ... };
  const update = async (id, changes) => { ... };
  const delete = async (id) => { ... };

  useEffect(() => { load(); }, []);

  return { data, loading, error, create, update, delete };
}
```

### 4.3 Context for Coordination

Compose multiple hooks and orchestrate multi-step workflows.

```typescript
export const AppProvider = () => {
  const feature1 = useFeature1();
  const feature2 = useFeature2();

  // Composite action
  const coordinatedAction = async () => {
    await feature1.create(...);
    await feature2.update(...);
    await auditLog(...);
  };

  return <AppContext.Provider>{...}</AppContext.Provider>;
};
```

---

## Part 5: Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|---|---|---|
| **Hardcoded Field Names** | `booking.cr71a_booking2id` everywhere | Map to app types: `booking.id` |
| **Magic Numbers** | `401000 = approved status` | Create enums; map in hooks |
| **Logic in Components** | `if (user.id === adminId)` | Implement in context/hooks |
| **Direct Service Calls** | Components import `service.ts` | All through hooks + context |
| **Hardcoded Workflows** | `if (status === pending) notify admin` | Configuration table + workflow engine |
| **No Error Handling** | Async without try-catch | Consistent error states in hooks |
| **Tight Coupling** | Components tightly bound to Dataverse | Abstraction layers decouple them |
| **Global State** | `window.globalConfig = ...` | Use Context API properly |

---

## Part 6: Multi-Tenancy & Real-Time Collaboration

### 6.1 Tenant Isolation Strategy

```typescript
// Every query filters by tenant
const getTenantId = () => getCurrentUserTenant();

const loadData = async () => {
  return await Service.getAll({
    filter: `_cr_tenantnid_value eq '${getTenantId()}'`
  });
};

// Audit logs include tenant
await AuditLog.create({
  action: 'create',
  '_cr_tenantnid_value': getTenantId(),
  ...
});

// Configuration per tenant
const getTenantConfig = async () => {
  const config = await ConfigService.getByTenant(getTenantId());
  return config;
};
```

### 6.2 Optimistic Updates & Conflict Resolution

```typescript
const updateBooking = async (id: string, changes: Partial<Booking>) => {
  // 1. Update UI immediately (optimistic)
  setBooking(prev => ({ ...prev, ...changes }));

  try {
    // 2. Persist to Dataverse
    await BookingsService.update(id, changes);
  } catch (err) {
    // 3. On conflict/error, reload from server
    const latest = await BookingsService.get(id);
    setBooking(latest);
    notifyError('Update failed; reverted to latest server version');
  }
};
```

---

## Summary: Key Takeaways

1. **No Hardcoding**: All configurable aspects in metadata tables or environment config
2. **Configuration-Driven**: Behavior determined by config, not code branches
3. **Extensible Design**: Plugins and hooks allow new features without core changes
4. **Multi-Tenant Ready**: Data and config isolated by tenant from the ground up
5. **Layered Architecture**: Data → Business Logic → State → UI (each layer has clear responsibility)
6. **Type Safety**: Single source of truth in types.ts; strong TypeScript throughout
7. **Dynamic Workflows**: Approval chains, status transitions, notifications all configurable
8. **Real-Time Collaboration**: Optimistic updates, conflict resolution, live synchronization

---

**Next Steps**:

1. Review [SKILLS.md](SKILLS.md) for implementation patterns
2. Follow [AGENT-GUIDE.md](AGENT-GUIDE.md) for step-by-step scaffolding
3. Apply these principles to your next Code App project
