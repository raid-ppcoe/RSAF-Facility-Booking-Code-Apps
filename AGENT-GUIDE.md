# Agent Guide: Step-by-Step Fullstack Code App Scaffolding

## Overview

This guide provides AI agents with structured, procedural steps to create a complete fullstack Dataverse Code App from scratch. Follow these phases sequentially. Each phase has:

- **Objectives**: What to accomplish
- **Inputs**: Required information from user/previous phases
- **Outputs**: Deliverables (files, schema, code)
- **Verification**: Checklist to validate completion

---

## Prerequisites & Discovery (Phase 0)

### Phase 0a: Gather Requirements

**Objective**: Understand the business domain and define the app scope.

**Steps**:

1. **Identify Primary Entity**
   - What is the main data object? (e.g., Booking, Asset, Ticket, Order)
   - Define 5-10 core fields
   - Example: Booking = { facilityId, userId, startTime, endTime, purpose, status }

2. **Identify Related Entities**
   - What entities reference the primary? (e.g., Facility → Department, User)
   - Define relationships (1:N, N:N)
   - Example: Booking (N:1)→ Facility, Booking (N:1)→ User

3. **Define User Roles & Permissions**
   - Who uses the app? (Admin, Manager, User, Guest)
   - What can each role do? (CRUD operations, approvals, exports)
   - Example: Admin can create facilities; User can book; Manager can approve

4. **Scope Business Workflows**
   - What approval/status flows exist?
   - Are there recurring/batch operations?
   - Example: Booking → Pending → Approved/Rejected

**Verification**:
- [ ] Primary entity identified with core fields
- [ ] Relationships documented
- [ ] User roles and permissions listed
- [ ] Workflows described
- [ ] Scope written (what's in/out)

**Output**: Requirements document (can be simple text or wiki)

---

### Phase 0b: Environment Setup

**Objective**: Prepare development environment for Dataverse + React development.

**Steps**:

1. **Check Prerequisites**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be 9+
   git --version   # Required
   ```

2. **Clone or Initialize Project**

   > **Recommended (npm CLI — requires `@microsoft/power-apps` ≥ 1.0.4)**:
   ```bash
   # Scaffold from the official Power Apps Code Apps template
   npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app
   cd my-app
   npm install

   # Initialize code app metadata (interactive — prompts for display name & environment)
   npx power-apps init
   # or non-interactive:
   npx power-apps init --display-name "My App" --environment-id <your-env-id>
   ```

   > **Alternative (pac CLI — legacy, will be deprecated)**:
   ```bash
   npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app
   cd my-app
   npm install

   pac auth create
   pac env select --environment <your-env-id>
   pac code init --displayname "My App"
   ```

   > **From scratch (manual setup)**:
   ```bash
   npm create vite@latest my-app -- --template react
   cd my-app
   npm install
   npm install @microsoft/power-apps @microsoft/power-apps-vite react-dom date-fns tailwindcss
   npx power-apps init
   ```

3. **Set Up Environment Variables**
   ```bash
   # .env.development
   VITE_DATAVERSE_ENV=dev
   VITE_API_ENDPOINT=https://dev-org.crm.dynamics.com
   VITE_ENABLE_DEBUG_LOGS=true

   # .env.production
   VITE_DATAVERSE_ENV=prod
   VITE_API_ENDPOINT=https://prod-org.crm.dynamics.com
   VITE_ENABLE_DEBUG_LOGS=false
   ```

4. **Configure Vite + TypeScript**
   ```typescript
   // vite.config.ts
   import { powerApps } from '@microsoft/power-apps-vite/plugin';
   
   export default defineConfig(({ mode }) => {
     const env = loadEnv(mode, '.', 'VITE_');
     return {
       plugins: [react(), powerApps()],
       define: {
         'process.env.VITE_DATAVERSE_ENV': JSON.stringify(env.VITE_DATAVERSE_ENV),
       }
     };
   });
   ```

5. **Test Locally**
   ```bash
   npm run dev
   ```
   Open the URL labelled **Local Play** in the same browser profile as your Power Platform tenant.

   > **Browser Note**: Since December 2025, Chrome and Edge block requests from public origins to local endpoints by default. You may need to grant browser permission for local network access.

6. **Build & Deploy**
   ```bash
   # Using npm CLI (recommended)
   npm run build
   npx power-apps push

   # Using pac CLI (legacy)
   npm run build
   pac code push
   # or piped: npm run build | pac code push
   ```

**Verification**:
- [ ] Node/npm versions correct
- [ ] Project initialized with React + TypeScript
- [ ] Dependencies installed (including `@microsoft/power-apps` ≥ 1.0.4)
- [ ] `npx power-apps init` completed (or `pac code init`)
- [ ] .env files created
- [ ] Vite config includes Power Apps plugin
- [ ] `npm run dev` starts without errors
- [ ] Local Play URL opens in browser

**Output**: Project structure ready for app development

---

## Phase 1: Dataverse Schema Design

**Objective**: Define and create Dataverse tables, fields, and relationships.

### Phase 1a: Schema Definition

**Input**: Requirements document (Phase 0a)

**Steps**:

1. **Define Primary Entity Table**

   Create a document outlining table structure:

   ```markdown
   # Table: Booking
   
   **Display Name**: Booking
   **Plural Name**: Bookings
   **Schema Name**: cr_booking
   **Primary Column**: cr_purpose
   **Record Ownership**: User

   ## Columns
   
   | Display Name | Schema Name | Type | Required | Notes |
   |---|---|---|---|---|
   | Purpose | cr_purpose | Single line text (200) | ✅ | Primary |
   | Facility | cr_facilityid | Lookup → Facility | ✅ | |
   | Booked By | cr_bookedbyid | Lookup → User | ✅ | |
   | Start Time | cr_starttime | DateTime (User Local) | ✅ | |
   | End Time | cr_endtime | DateTime (User Local) | ✅ | |
   | Status | cr_status | Choice | ✅ | pending/approved/rejected |
   | Series ID | cr_seriesid | Single line text (100) | ❌ | For recurring |
   ```

2. **Define Related Entity Tables**

   Repeat for Facility, Department, User:

   ```markdown
   # Table: Facility
   
   **Display Name**: Facility
   **Plural Name**: Facilities
   **Schema Name**: cr_facility
   **Primary Column**: cr_name
   
   ## Columns
   | Display Name | Schema Name | Type | Required |
   |---|---|---|---|
   | Name | cr_name | Single line text (200) | ✅ |
   | Department | cr_departmentid | Lookup → Department | ✅ |
   | Capacity | cr_capacity | Whole number | ✅ |
   | Description | cr_description | Multiple line text (2000) | ✅ |
   | Max Recurrence Weeks | cr_maxrecurrenceweeks | Whole number | ✅ |
   ```

3. **Define Choice Fields**

   ```markdown
   ## Choices

   ### Booking Status (cr_status)
   - Pending (406210000)
   - Approved (406210001)
   - Rejected (406210002)

   ### Facility Type (cr_facilitytype)
   - Room (100000000)
   - Lab (100000001)
   - Hall (100000002)
   - Sports (100000003)
   ```

4. **Define Relationships**

   ```markdown
   ## Relationships

   - Booking (N:1) → Facility
   - Booking (N:1) → User
   - Booking (N:1) → Department (denormalized)
   - Facility (N:1) → Department
   - FacilityApprover (N:1) → Facility
   - FacilityApprover (N:1) → User or Department
   ```

**Verification**:
- [ ] All entities documented with Display/Schema names
- [ ] All fields documented (type, required, constraints)
- [ ] Choice options defined with numeric values
- [ ] Relationships documented (1:N, N:N)
- [ ] Primary columns identified

**Output**: Schema design document

### Phase 1b: Create Tables in Dataverse

**Input**: Schema design document (Phase 1a)

**Steps**:

1. **Access Dataverse Designer**
   - Open Power Apps (https://make.powerapps.com)
   - Select "Solutions"
   - Create new Solution: "MyAppSolution"
   - Inside solution, add Tables

2. **Create Each Table**
   - Click "+ New Table"
   - Enter Display Name (e.g., "Facility")
   - Schema Name auto-fills (modify if needed): cr_facility
   - Record Ownership: "User" or "Organization"
   - Save

3. **Add Fields to Each Table**
   - For each field in schema document:
     - Click "+ Add Column"
     - Enter Display Name
     - Select Data Type (maps to schema)
     - Set Required: Business Required if needed
     - Set Max Length (for text fields)
     - Save

4. **Create Lookup Columns**
   - Click "+ Add Column"
   - Data Type: "Lookup"
   - Select Related Table (e.g., Department for Facility)
   - This auto-creates the 1:N relationship

5. **Create Choice Columns**
   - Click "+ Add Column"
   - Data Type: "Choice"
   - Enter choices in JSON format
   - Map to numeric values (for Dataverse)

6. **Add Audit Table** (for compliance)
   ```
   Table: Audit Log
   - Action (Choice: create/update/delete/approve)
   - EntityType (Text)
   - RecordId (Text)
   - UserId (Lookup → User)
   - Changes (JSON text field)
   - CreatedOn (Timestamp)
   ```

**Example using Power Apps UI**:

1. Open Solution
2. Click "New Table"
3. Fill in:
   - Display Name: Facility Booking
   - Plural Name: Facility Bookings
   - Schema Name: cr_facility_booking
4. Click Create
5. Add columns using "+" button

**Verification**:
- [ ] All tables created in Dataverse
- [ ] All columns added with correct types
- [ ] Lookup relationships established
- [ ] Choice columns configured
- [ ] Can view tables in Dataverse web interface

**Output**: Dataverse schema created and live

---

## Phase 2: Service Layer Generation & Customization

**Objective**: Generate TypeScript service layer from Dataverse schema.

### Phase 2a: Generate Services with Power Apps SDK

**Input**: Live Dataverse tables (Phase 1b)

**Steps**:

1. **Install Power Apps CLI** (if not installed)
   ```bash
   npm install -g @microsoft/power-apps-cli
   ```

2. **Generate Services from Schema**
   ```bash
   # Download schema from Dataverse
   pac data download-service-layer \
     --entityFolder ./src/generated/models \
     --serviceFolder ./src/generated/services \
     --connectionUri "https://dev-org.crm.dynamics.com" \
     --tables @["cr_booking", "cr_facility", "cr_department"]
   ```

   This creates:
   ```
   src/generated/
   ├── models/
   │   ├── Cr71a_booking2sModel.ts
   │   ├── Cr71a_facilityModel.ts
   │   └── CommonModels.ts
   ├── services/
   │   ├── Cr71a_booking2sService.ts
   │   └── Cr71a_facilityService.ts
   └── index.ts
   ```

3. **Inspect Generated Services**

   Each service has structure:
   ```typescript
   export class Cr71a_booking2sService {
     public static async create(record): Promise<IOperationResult> { ... }
     public static async update(id, changes): Promise<IOperationResult> { ... }
     public static async delete(id): Promise<void> { ... }
     public static async get(id, options): Promise<IOperationResult> { ... }
     public static async getAll(options): Promise<IOperationResult> { ... }
   }
   ```

**Verification**:
- [ ] All services generated for primary and related tables
- [ ] Services export correct types from models
- [ ] Can import `Cr71a_booking2sService` without errors
- [ ] TypeScript compilation succeeds

**Output**: Auto-generated service layer

### Phase 2b: Create Custom Service Wrappers

**Input**: Generated services (Phase 2a), Requirements (Phase 0a)

**Steps**:

1. **Create Service Wrapper Directory**
   ```bash
   mkdir -p src/services
   ```

2. **Create Wrapper for Each Entity**

   **src/services/facilityService.ts**:
   ```typescript
   import { Cr71a_facilityService } from '../generated/services/Cr71a_facilityService';
   import type { Cr71a_facility } from '../generated/models/Cr71a_facilityModel';
   import type { Facility } from '../types';

   export class FacilityService {
     /**
      * Get all active facilities, optionally filtered by department
      */
     static async getActiveFacilities(departmentId?: string) {
       const filters = ['statecode eq 0'];
       if (departmentId) {
         filters.push(`_cr_departmentid_value eq '${departmentId}'`);
       }

       const result = await Cr71a_facilityService.getAll({
         select: [
           'cr_facilityid',
           'cr_facilityname',
           '_cr_departmentid_value',
           'cr_capacity',
           'cr_description',
           'cr_maxrecurrenceweeks'
         ],
         filter: filters.join(' and '),
         orderBy: ['cr_facilityname asc']
       });

       return result.data || [];
     }

     /**
      * Create facility with defaults from tenant config
      */
     static async createFacility(facility: Omit<Facility, 'id'>) {
       const payload: Partial<Cr71a_facility> = {
         cr_facilityname: facility.name,
         'cr_departmentid@odata.bind': `/cr_departments(${facility.departmentId})`,
         cr_capacity: facility.capacity.toString(),
         cr_description: facility.description,
         cr_maxrecurrenceweeks: facility.maxRecurrenceWeeks.toString()
       };

       const result = await Cr71a_facilityService.create(payload as any);
       return result;
     }

     static async updateFacility(id: string, changes: Partial<Facility>) {
       const payload: any = {};
       if (changes.name) payload.cr_facilityname = changes.name;
       if (changes.capacity) payload.cr_capacity = changes.capacity.toString();
       if (changes.description) payload.cr_description = changes.description;

       return await Cr71a_facilityService.update(id, payload);
     }

     static async deleteFacility(id: string) {
       return await Cr71a_facilityService.delete(id);
     }
   }
   ```

   Repeat for Booking, Department, etc.

3. **Map Dataverse Enums to TypeScript**

   **src/constants/dataverseEnums.ts**:
   ```typescript
   export const BOOKING_STATUS_TO_CODE: Record<string, number> = {
     'pending': 406210000,
     'approved': 406210001,
     'rejected': 406210002
   };

   export const CODE_TO_BOOKING_STATUS: Record<number, string> = {
     406210000: 'pending',
     406210001: 'approved',
     406210002: 'rejected'
   };

   export const FACILITY_TYPE_CHOICES = {
     Room: 100000000,
     Lab: 100000001,
     Hall: 100000002,
     Sports: 100000003
   };
   ```

**Verification**:
- [ ] Service wrappers created for all entities
- [ ] Enum mappings defined
- [ ] Filters and select clauses optimized
- [ ] OData binding syntax correct
- [ ] No TypeScript errors

**Output**: Custom service wrappers + enum mappings

---

### Phase 2c: Dataverse Actions & Functions (npm CLI)

**Objective**: Discover and add Dataverse Web API actions and functions as strongly-typed service classes.

> **Requires**: `@microsoft/power-apps` ≥ 1.1.1, npm CLI only (not available in `pac code`)

**Steps**:

1. **Discover Available Operations**
   ```bash
   # Search by name (case-insensitive substring match)
   npx power-apps find-dataverse-api --search "WhoAmI"

   # Get JSON output for scripting/agents
   npx power-apps find-dataverse-api --search "WhoAmI" --json

   # Search for custom actions
   npx power-apps find-dataverse-api --search "AddRecurrence"
   ```

2. **Add the Operation to Your App**
   ```bash
   npx power-apps add-dataverse-api --api-name WhoAmI
   # or short alias:
   npx power-apps add-dataverse-api -n WhoAmI
   ```

   This generates:
   ```
   <schemaPath>/dataverse/WhoAmI.Schema.json        ← operation schema
   <schemaPath>/dataverse/<Entity>.Schema.json       ← referenced entity schemas
   <schemaPath>/appschemas/dataSourcesInfo.ts        ← regenerated
   power.config.json                                 ← updated
   <codeGenPath>/generated/models/<Entity>Model.ts   ← entity models
   <codeGenPath>/generated/services/WhoAmIService.ts ← typed service class
   ```

3. **Use the Generated Service**
   ```typescript
   // Unbound function (no record ID)
   import { WhoAmIService } from './generated/services/WhoAmIService';
   const result = await WhoAmIService.WhoAmI();
   // result.value: { BusinessUnitId, UserId, OrganizationId }

   // Bound action (first arg is record GUID)
   import { AddToQueueService } from './generated/services/AddToQueueService';
   const result = await AddToQueueService.AddToQueue(queueId, target);
   ```

4. **Refresh After Dataverse Changes**
   ```bash
   # Re-running is idempotent — safely overwrites schema and regenerates
   npx power-apps add-dataverse-api -n WhoAmI
   ```

**Verification**:
- [ ] `find-dataverse-api` returns expected operations
- [ ] Schema files generated in `<schemaPath>/dataverse/`
- [ ] `power.config.json` updated with `databaseReferences["default.cds"]`
- [ ] Generated service class compiles without errors
- [ ] Service method returns typed result
- [ ] Bound operations accept record GUID as first parameter

**Output**: Strongly-typed Dataverse operation services

---

### Phase 2d: Power Automate Flow Integration (npm CLI)

**Objective**: Add Power Automate cloud flows as typed, callable services in your code app.

> **Requires**: `@microsoft/power-apps` ≥ 1.1.1, npm CLI only. Only flows with PowerApps trigger type are supported.

**Steps**:

1. **List Available Flows**
   ```bash
   npx power-apps list-flows
   # Filter by name:
   npx power-apps list-flows --search approval
   ```
   Copy the Flow ID from the output.

2. **Add a Flow**
   ```bash
   npx power-apps add-flow --flow-id <flow-id>
   ```

   This generates:
   ```
   src/services/<FlowName>Service.ts      ← typed service class with Run() method
   src/models/<FlowName>Model.ts          ← input/output TypeScript types
   schemas/logicflows/<FlowName>.Schema.json  ← OpenAPI schema (do not edit)
   power.config.json                      ← updated with flow connection references
   ```

3. **Call the Flow from Code**
   ```typescript
   import { ApprovalWorkflowService } from './services/ApprovalWorkflowService';

   // Flow with input parameters
   const result = await ApprovalWorkflowService.Run({
     requester: 'Alex',
     amount: 1500,
   });
   if (result.success) {
     console.log('Response:', result.data);
   }

   // Flow without parameters
   import { SendNotificationService } from './services/SendNotificationService';
   const result = await SendNotificationService.Run();
   ```

4. **Update or Remove Flows**
   ```bash
   # Re-run to pick up definition changes (idempotent)
   npx power-apps add-flow --flow-id <flow-id>

   # Remove by name or ID
   npx power-apps remove-flow --flow-name ApprovalWorkflow
   npx power-apps remove-flow --flow-id <flow-id>
   ```

**Limitations**:
- Only Manual flows with the PowerApps trigger type
- Only solution-aware flows (use `list-flows` to verify)
- Developer must have access to the flow and its underlying connections
- End users need Dataverse permissions (App Opener role or equivalent)
- Re-run `add-flow` manually after flow definition changes

**Verification**:
- [ ] `list-flows` returns expected flows
- [ ] Service and model files generated
- [ ] `power.config.json` updated with flow entry and connection dependencies
- [ ] `Run()` method signature matches flow's input parameters
- [ ] Flow triggers successfully from local dev (`npm run dev`)
- [ ] Result object has `success`, `data`, and optional `error` properties

**Output**: Typed Power Automate flow services

---

## Phase 3: Type Definitions & API Contracts

**Objective**: Define single source of truth for all domain types.

### Phase 3a: Define App Types

**Input**: Requirements (Phase 0a), Dataverse schema (Phase 1b)

**Create src/types.ts**:

```typescript
/**
 * Single source of truth for all domain types.
 * These types:
 * - Are independent of Dataverse schema
 * - Are used by all layers (hooks, context, components)
 * - Map to/from generated Dataverse models
 */

// Domain types
export interface Facility {
  id: string;
  name: string;
  departmentId: string;
  capacity: number;
  description: string;
  maxRecurrenceWeeks: number;
}

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  startTime: string; // ISO 8601
  endTime: string;
  status: BookingStatus;
  purpose: string;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

export type UserRole = 'user' | 'admin' | 'super_admin' | 'global_admin';

// Validation & configuration types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FacilityApprover {
  id: string;
  facilityId: string;
  approverType: 'user' | 'department';
  approverId?: string;
  departmentId?: string;
}

export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  entityType: string;
  recordId: string;
  userId: string;
  userName: string;
  timestamp: string;
  changes?: Record<string, { before: any; after: any }>;
}

// API response shapes
export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}

export interface PaginationInfo {
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
}
```

**Verification**:
- [ ] All domain entities have types
- [ ] Types are independent of Dataverse schema names
- [ ] Enum types defined (BookingStatus, UserRole)
- [ ] API response shapes defined
- [ ] No circular dependencies

**Output**: Comprehensive type definitions

### Phase 3b: Create Type Mapping Utilities

**Create src/utils/typeMappers.ts**:

```typescript
import type { Cr71a_booking2s } from '../generated/models/Cr71a_booking2sModel';
import type { Booking } from '../types';
import { CODE_TO_BOOKING_STATUS } from '../constants/dataverseEnums';

/**
 * Transform Dataverse booking record to app Booking type
 */
export const mapDataverseBookingToApp = (dvBooking: Cr71a_booking2s): Booking => {
  return {
    id: dvBooking.cr_bookingid,
    facilityId: dvBooking._cr_facilityid_value,
    userId: dvBooking._cr_bookedbyid_value,
    userName: dvBooking.cr_bookedbyname || '',
    startTime: dvBooking.cr_starttime || '',
    endTime: dvBooking.cr_endtime || '',
    status: CODE_TO_BOOKING_STATUS[dvBooking.cr_status as number] || 'pending',
    purpose: dvBooking.cr_purpose,
    createdAt: dvBooking.createdon || new Date().toISOString()
  };
};

/**
 * Transform app Booking to Dataverse-compatible payload
 */
export const mapAppBookingToDataverse = (appBooking: Omit<Booking, 'id'>): any => {
  return {
    cr_purpose: appBooking.purpose,
    'cr_facilityid@odata.bind': `/cr_facilities(${appBooking.facilityId})`,
    'cr_bookedbyid@odata.bind': `/systemusers(${appBooking.userId})`,
    cr_starttime: appBooking.startTime,
    cr_endtime: appBooking.endTime,
    cr_status: BOOKING_STATUS_TO_CODE[appBooking.status]
  };
};
```

**Verification**:
- [ ] Mappers handle all entity types
- [ ] Dataverse enum values converted correctly
- [ ] OData binding syntax correct
- [ ] Null/undefined values handled
- [ ] No type assertion errors

**Output**: Type mapping utilities

---

## Phase 4: Core Hooks & State Management

**Objective**: Create feature hooks that encapsulate business logic and state.

### Phase 4a: Create Feature Hooks

**Input**: Service wrappers (Phase 2b), Types (Phase 3)

**Create src/hooks/useFacilities.ts**:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { FacilityService } from '../services/facilityService';
import type { Facility } from '../types';
import { mapDataverseToApp } from '../utils/typeMappers';

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFacilities = useCallback(async (departmentId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await FacilityService.getActiveFacilities(departmentId);
      setFacilities(data.map(mapDataverseToApp));
    } catch (err: any) {
      setError(`Failed to load facilities: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFacility = useCallback(async (facility: Omit<Facility, 'id'>) => {
    try {
      const result = await FacilityService.createFacility(facility);
      setFacilities(prev => [mapDataverseToApp(result.data), ...prev]);
      return result.data.cr_facilityid;
    } catch (err: any) {
      throw new Error(`Failed to create facility: ${err.message}`);
    }
  }, []);

  const updateFacility = useCallback(async (id: string, changes: Partial<Facility>) => {
    try {
      await FacilityService.updateFacility(id, changes);
      setFacilities(prev =>
        prev.map(f => f.id === id ? { ...f, ...changes } : f)
      );
    } catch (err: any) {
      throw new Error(`Failed to update facility: ${err.message}`);
    }
  }, []);

  const deleteFacility = useCallback(async (id: string) => {
    try {
      await FacilityService.deleteFacility(id);
      setFacilities(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      throw new Error(`Failed to delete facility: ${err.message}`);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  return {
    facilities,
    loading,
    error,
    loadFacilities,
    createFacility,
    updateFacility,
    deleteFacility
  };
}
```

Repeat for Bookings, Departments, etc., following same pattern.

**Verification**:
- [ ] Hook created for each feature (Facilities, Bookings, etc.)
- [ ] Loading, error, and data states managed
- [ ] All CRUD operations implemented
- [ ] useEffect loads data on mount
- [ ] Memoized callbacks prevent unnecessary renders
- [ ] Error messages user-friendly

**Output**: Feature hooks for all entities

### Phase 4b: Create App Context

**Input**: Feature hooks (Phase 4a)

**Create src/contexts/AppContext.tsx**:

```typescript
import React, { createContext, useContext } from 'react';
import { useFacilities } from '../hooks/useFacilities';
import { useBookings } from '../hooks/useBookings';
import { useDepartments } from '../hooks/useDepartments';
import type { Booking, Facility, ValidationResult } from '../types';

interface AppContextType {
  // Data
  facilities: Facility[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;

  // Actions
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<string>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;

  // Utilities
  validateBooking: (booking: Omit<Booking, 'id'>) => Promise<ValidationResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const facilities = useFacilities();
  const bookings = useBookings();
  const departments = useDepartments();

  const loading = facilities.loading || bookings.loading || departments.loading;
  const error = facilities.error || bookings.error || departments.error;

  // Composite action: Create booking with validation
  const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    // Validate
    const validation = await validateBooking(booking);
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }

    // Create
    return await bookings.createBooking(booking);
  };

  const validateBooking = async (booking: Omit<Booking, 'id'>): Promise<ValidationResult> => {
    const errors: string[] = [];

    // Validate facility exists
    if (!facilities.facilities.find(f => f.id === booking.facilityId)) {
      errors.push('Facility not found');
    }

    // Validate no time overlap
    const conflicts = bookings.bookings.filter(b =>
      b.facilityId === booking.facilityId &&
      !(booking.endTime <= b.startTime || booking.startTime >= b.endTime)
    );
    if (conflicts.length > 0) {
      errors.push('Facility already booked for this time period');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  return (
    <AppContext.Provider value={{
      facilities: facilities.facilities,
      bookings: bookings.bookings,
      loading,
      error,
      createBooking,
      updateBookingStatus: bookings.updateBookingStatus,
      cancelBooking: bookings.cancelBooking,
      validateBooking
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

**Verification**:
- [ ] AppContext composes all feature hooks
- [ ] Composite actions orchestrate workflows
- [ ] Loading and error states aggregated
- [ ] useAppContext hook created with error boundary
- [ ] TypeScript types fully defined

**Output**: App context + provider setup

---

## Phase 5: Configuration Schema & Loaders

**Objective**: Externalize configurable behavior into metadata tables.

### Phase 5a: Design Configuration Schema

**Input**: Requirements (Phase 0a), Specification (review SPECIFICATION.md)

**Create src/config/schema.ts**:

```typescript
/**
 * Configuration schema definitions.
 * These shapes match tables in Dataverse.
 */

export interface SystemConfiguration {
  configKey: string;
  configValue: string;
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
}

export interface FieldConfiguration {
  fieldName: string;
  entityType: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'lookup' | 'choice';
  required: boolean;
  visible: boolean;
  order: number;
  validationRules?: string; // JSON
}

export interface LayoutConfiguration {
  layoutId: string;
  layoutType: 'form' | 'grid' | 'calendar';
  name: string;
  description?: string;
  sections: LayoutSection[];
  visible: boolean;
}

export interface LayoutSection {
  sectionId: string;
  title: string;
  componentName: string;
  visible: boolean;
  width: 'full' | 'half' | 'third';
  order: number;
}

export interface ValidationRule {
  ruleId: string;
  entityType: string;
  fieldName?: string;
  ruleType: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  config: any;
  errorMessage: string;
}
```

### Phase 5b: Create Configuration Loader

**Create src/services/configService.ts**:

```typescript
import type { SystemConfiguration } from '../config/schema';

/**
 * Load system configuration from Dataverse
 */
export class ConfigService {
  private static cache = new Map<string, any>();

  /**
   * Get single config value by key
   */
  static async getConfig(key: string, defaultValue?: any) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const result = await ConfigServiceDataverse.getAll({
        filter: `cr_configkey eq '${key}'`,
        select: ['cr_configvalue', 'cr_datatype']
      });

      if (result.data && result.data.length > 0) {
        const config = result.data[0];
        const value = this.parseValue(config.cr_configvalue, config.cr_datatype);
        this.cache.set(key, value);
        return value;
      }
    } catch (err) {
      console.error(`Failed to load config ${key}:`, err);
    }

    return defaultValue ?? null;
  }

  /**
   * Get all configs as object
   */
  static async getAllConfigs(): Promise<Record<string, any>> {
    try {
      const result = await ConfigServiceDataverse.getAll({
        select: ['cr_configkey', 'cr_configvalue', 'cr_datatype'],
        filter: 'statecode eq 0'
      });

      if (!result.data) return {};

      const configs: Record<string, any> = {};
      for (const item of result.data) {
        const value = this.parseValue(item.cr_configvalue, item.cr_datatype);
        configs[item.cr_configkey] = value;
      }

      return configs;
    } catch (err) {
      console.error('Failed to load all configs:', err);
      return {};
    }
  }

  private static parseValue(value: string, dataType: string): any {
    switch (dataType) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  /**
   * Invalidate cache (call after config update)
   */
  static invalidateCache() {
    this.cache.clear();
  }
}

// Hook for React components
export function useConfig() {
  const [config, setConfig] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    ConfigService.getAllConfigs().then(setConfig).finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
```

**Verification**:
- [ ] Configuration schema defined
- [ ] Config loader Service created
- [ ] Cache mechanism implemented
- [ ] useConfig hook created
- [ ] Parsing logic handles all data types

**Output**: Configuration schema + loaders

---

## Phase 6: UI Components (Configuration-Driven)

**Objective**: Build React components that follow configuration and delegate logic to hooks/context.

### Phase 6a: Create Layout Components

**Create src/components/Layout.tsx**:

```typescript
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'home', label: 'Home', roles: ['user', 'admin', 'super_admin'] },
    { id: 'book', label: 'Book Facility', roles: ['user', 'admin', 'super_admin'] },
    { id: 'management', label: 'Management', roles: ['admin', 'super_admin'] },
    { id: 'settings', label: 'Settings', roles: ['admin', 'super_admin'] }
  ];

  const visibleItems = menuItems.filter(item =>
    item.roles.includes(user?.role || 'user')
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">App Name</h1>
        <nav className="space-y-2">
          {visibleItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === item.id
                  ? 'bg-blue-600'
                  : 'hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};
```

### Phase 6b: Create Feature Components

**Create src/components/BookingForm.tsx**:

```typescript
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Booking } from '../types';

export const BookingForm: React.FC = () => {
  const { facilities, createBooking, validateBooking } = useAppContext();
  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'createdAt'>>({
    facilityId: '',
    userId: '',
    userName: '',
    startTime: '',
    endTime: '',
    status: 'pending',
    purpose: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate
      const validation = await validateBooking(formData);
      if (!validation.valid) {
        setError(validation.errors.join('; '));
        return;
      }

      // Create
      const bookingId = await createBooking(formData);
      alert(`Booking created: ${bookingId}`);
      
      // Reset form
      setFormData({
        facilityId: '',
        userId: '',
        userName: '',
        startTime: '',
        endTime: '',
        status: 'pending',
        purpose: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold">Create Booking</h2>

      {error && <div className="bg-red-50 p-4 text-red-700">{error}</div>}

      <div>
        <label className="block font-medium mb-2">Facility</label>
        <select
          value={formData.facilityId}
          onChange={(e) => setFormData(prev => ({ ...prev, facilityId: e.target.value }))}
          required
          className="w-full border rounded p-2"
        >
          <option value="">Select a facility</option>
          {facilities.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-2">Purpose</label>
        <input
          type="text"
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
          required
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">Start Time</label>
        <input
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
          required
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">End Time</label>
        <input
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
          required
          className="w-full border rounded p-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Booking'}
      </button>
    </form>
  );
};
```

**Verification**:
- [ ] Layout component created with role-based menu
- [ ] Feature components created (Form, Grid, Calendar)
- [ ] Components use context API for data/actions
- [ ] Error states displayed
- [ ] Loading states managed
- [ ] Form validation integrated

**Output**: React UI components

---

## Phase 7: Business Rules Engine

**Objective**: Implement configurable validation and approval logic.

**Create src/rules/validationRules.ts**:

```typescript
import type { Booking, ValidationResult } from '../types';

export interface BookingValidator {
  id: string;
  validate: (booking: Omit<Booking, 'id'>) => Promise<ValidationResult>;
}

const validators: BookingValidator[] = [
  {
    id: 'no-overlaps',
    validate: async (booking) => {
      // Check for overlapping bookings in actual implementation
      return { valid: true, errors: [] };
    }
  },
  {
    id: 'duration-limit',
    validate: async (booking) => {
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      const weeks = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      if (weeks > 4) {
        return {
          valid: false,
          errors: ['Booking duration cannot exceed 4 weeks']
        };
      }

      return { valid: true, errors: [] };
    }
  }
];

export const validateBooking = async (
  booking: Omit<Booking, 'id'>
): Promise<ValidationResult> => {
  const results = await Promise.all(
    validators.map(v => v.validate(booking))
  );

  const allErrors = results.flatMap(r => r.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
};
```

**Verification**:
- [ ] Validators implemented for core business rules
- [ ] Each validator is testable independently
- [ ] Error messages clear and actionable
- [ ] Can be extended without modifying existing validators

**Output**: Business rules engine

---

## Phase 8-10: Integration, Testing & Deployment

### Phase 8: Integration Testing

**Create src/__tests__/integration.test.ts**:

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFacilities } from '../hooks/useFacilities';
import { useBookings } from '../hooks/useBookings';

describe('Integration: Facility Booking Flow', () => {
  it('should load facilities and create booking', async () => {
    // Setup
    const { result: facilitiesResult } = renderHook(() => useFacilities());
    const { result: bookingsResult } = renderHook(() => useBookings());

    // Load facilities
    await waitFor(() => expect(facilitiesResult.current.loading).toBe(false));
    expect(facilitiesResult.current.facilities.length).toBeGreaterThan(0);

    // Create booking
    const facility = facilitiesResult.current.facilities[0];

    act(() => {
      bookingsResult.current.createBooking({
        facilityId: facility.id,
        userId: 'user-1',
        userName: 'John Doe',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        purpose: 'Team meeting',
        status: 'pending'
      });
    });

    await waitFor(() => expect(bookingsResult.current.bookings.length).toBe(1));
  });
});
```

### Phase 9: Multi-Environment Setup

**Create .env files**:

```bash
# .env.development
VITE_DATAVERSE_ENV=dev
VITE_API_ENDPOINT=https://dev-org.crm.dynamics.com

# .env.test
VITE_DATAVERSE_ENV=test
VITE_API_ENDPOINT=https://test-org.crm.dynamics.com

# .env.production
VITE_DATAVERSE_ENV=prod
VITE_API_ENDPOINT=https://prod-org.crm.dynamics.com
```

### Phase 10: Extensibility Setup

**Create src/plugins/pluginRegistry.ts**:

```typescript
export interface Plugin {
  id: string;
  name: string;
  hooks: {
    'booking:created'?: (context: any) => Promise<void>;
    'booking:approved'?: (context: any) => Promise<void>;
  };
}

const registry: Plugin[] = [];

export const registerPlugin = (plugin: Plugin) => {
  registry.push(plugin);
};

export const executePluginHooks = async (
  hookName: string,
  context: any
) => {
  for (const plugin of registry) {
    const handler = plugin.hooks[hookName as keyof Plugin['hooks']];
    if (handler) {
      await handler(context);
    }
  }
};
```

---

## Phase 11: ALM, Context & Deployment

**Objective**: Set up application lifecycle management, leverage runtime context APIs, and deploy across environments using solutions and pipelines.

### Phase 11a: Context & Metadata Integration

**Input**: Working app from Phase 8-10

**Steps**:

1. **Retrieve App/User/Host Context**
   ```typescript
   import { getContext } from '@microsoft/power-apps/app';

   const ctx = await getContext();

   // Use in hooks or components
   const currentUser = ctx.user.fullName;          // "John Doe"
   const userId = ctx.user.objectId;               // Azure AD object ID
   const upn = ctx.user.userPrincipalName;         // "john@contoso.com"
   const envId = ctx.app.environmentId;            // Environment ID
   const queryParams = ctx.app.queryParams;        // URL deep-link params
   const sessionId = ctx.host.sessionId;           // For telemetry correlation
   ```

2. **Use Table Metadata for Dynamic Forms**
   ```typescript
   // Get localized column labels and required fields at runtime
   const { data } = await Cr71a_facilitiesService.getMetadata({
     schema: { columns: 'all' }
   });

   const requiredFields = data.Attributes
     ?.filter(attr => attr.IsRequiredForForm)
     .map(attr => attr.LogicalName) || [];

   const columnLabels: Record<string, string> = {};
   data.Attributes?.forEach(attr => {
     const label = attr.DisplayName?.UserLocalizedLabel?.Label;
     if (label) columnLabels[attr.LogicalName] = label;
   });
   ```

3. **Configure Observability (Optional)**
   ```typescript
   import { setConfig } from '@microsoft/power-apps/app';

   setConfig({
     logger: {
       logMetric: (name, value, properties) => {
         appInsights.trackMetric({ name, average: value }, properties);
       }
     }
   });
   ```

### Phase 11b: Solution-Based Deployment

**Steps**:

1. **Deploy to a Solution**
   ```bash
   # Deploy to preferred solution (if configured in environment)
   npm run build
   npx power-apps push
   # or: pac code push

   # Deploy to a specific solution
   pac code push --solutionName MySolution
   ```

2. **Add to Solution via Power Apps UI** (if already deployed)
   - Go to make.powerapps.com → Solutions
   - Select your solution → Add existing → App → Code app

3. **Use Connection References for Portability**
   ```bash
   # List connection references in a solution
   pac code list-connection-references -env <envURL> -s <solutionID>

   # Add data source using connection reference (resolves per-environment)
   pac code add-data-source -a <apiName> -cr <connectionRefLogicalName> -s <solutionID>
   ```

4. **Use Environment Variables for ALM**
   ```bash
   # Use @envvar: prefix for dataset/table values
   pac code add-data-source \
     --apiid shared_sharepointonline \
     --connectionId <id> \
     --dataset "@envvar:crd1b_SharepointSiteVar" \
     --table "@envvar:crd1b_sharepointList"
   ```

5. **Deploy via Pipelines**
   - Add app to a Dataverse solution (Step 2)
   - Configure Power Platform Pipelines (Dev → Test → Prod)
   - Pipelines run preflight checks for dependencies, connection references, etc.

**Verification**:
- [ ] `getContext()` returns valid app, user, and host data
- [ ] `getMetadata()` returns column and relationship metadata
- [ ] App deployed to a solution
- [ ] Connection references resolve correctly across environments
- [ ] Environment variable references persist in `power.config.json`
- [ ] Pipeline deployment succeeds with preflight checks passing

**Limitations**:
- Code apps don't support Solution Packager or Power Platform Git integration
- Code apps aren't available in Power Apps mobile or Power Apps for Windows
- Sensitive data must be stored in Dataverse (hosted app code is publicly accessible)
- To hide the Power Apps header, append `?hideNavBar=true` to the app URL

**Output**: Production-ready deployment across environments

---

## Verification Checklist

Before deploying, verify:

### Schema & Services
- [ ] All Dataverse tables created
- [ ] Services generated and compiling
- [ ] Choice field enums mapped correctly
- [ ] Relationships established

### Types & Contracts
- [ ] types.ts complete and consistent
- [ ] Type mappers handle all fields
- [ ] No any type assertions needed

### Hooks & Context
- [ ] Feature hooks created for all entities
- [ ] All CRUD operations working
- [ ] AppContext composes hooks
- [ ] useAppContext hook available

### Configuration
- [ ] Configuration schema defined
- [ ] Config loader service working
- [ ] .env files for all environments

### UI
- [ ] Layout component rendering
- [ ] Forms integrated with context
- [ ] Role-based menus working
- [ ] Error states showing

### Business Logic
- [ ] Validators implemented
- [ ] Approval logic working
- [ ] Audit logging in place

### Testing
- [ ] Unit tests for hooks
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths

### Deployment
- [ ] Multi-environment configs ready
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors/warnings
- [ ] Performance acceptable (load times < 3s)

### npm CLI & New Features
- [ ] Using `@microsoft/power-apps` ≥ 1.0.4 (≥ 1.1.1 for actions/flows)
- [ ] `npx power-apps init` completed successfully
- [ ] Dataverse actions/functions added via `add-dataverse-api` (if needed)
- [ ] Power Automate flows added via `add-flow` (if needed)
- [ ] `getContext()` used for user/app context
- [ ] `getMetadata()` used for dynamic validation (if needed)
- [ ] No `initialize()` calls (v1.0+ migration)

### ALM & Solutions
- [ ] App added to a Dataverse solution
- [ ] Connection references used for environment portability
- [ ] Environment variables used for data source config (if applicable)
- [ ] Pipeline deployment tested (Dev → Test → Prod)

---

## Summary

By following these 11 phases, you've built a fully functional, scalable, and configured-driven Code App:

1. ✅ Requirements gathered
2. ✅ Dataverse schema designed & created
3. ✅ Service layer generated & wrapped (including Dataverse actions & flows)
4. ✅ Type definitions comprehensive
5. ✅ Feature hooks encapsulate logic
6. ✅ Context API coordinates state
7. ✅ Configuration externalized
8. ✅ UI components built
9. ✅ Business rules configurable
10. ✅ Multi-environment & extensible
11. ✅ ALM, context APIs & solution deployment

**Result**: A robust, maintainable, customer-ready Code App.

---

**Next Steps**:
- Deploy to development environment using `npx power-apps push`
- Test with real users
- Gather feedback
- Iterate on configuration as per user needs
- Scale by adding new entities (repeat phases 1-5)
- Add Dataverse actions/functions as needed (Phase 2c)
- Integrate Power Automate flows for workflows (Phase 2d)
- Deploy across environments via Pipelines (Phase 11)
