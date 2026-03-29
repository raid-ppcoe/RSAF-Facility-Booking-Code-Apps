# Dataverse Database Schema — Facility Booking App

> **Prompt:** Create the following Dataverse tables, columns, choice columns, and relationships exactly as described. Use the publisher prefix `cr_` (or your environment's default prefix). All tables should be created under **Solutions** for ALM best practices.

---

## Table 1: Department

**Display Name:** Department  
**Plural Name:** Departments  
**Schema Name:** `cr_Department`  
**Primary Column:** Name  
**Description:** Academic departments that own facilities.  
**Record Ownership:** Organization  

### Columns

| Display Name | Schema Name | Type | Required | Details |
|---|---|---|---|---|
| Name | `cr_Name` | Single line of text (100) | ✅ Business Required | Primary column. Department name (e.g., "Computer Science") |

### Seed Data

| Name |
|---|
| Computer Science |
| Engineering |
| Business |

---

## Table 2: Facility

**Display Name:** Facility  
**Plural Name:** Facilities  
**Schema Name:** `cr_Facility`  
**Primary Column:** Name  
**Description:** Bookable rooms, labs, halls, and sports facilities.  
**Record Ownership:** Organization  

### Columns

| Display Name | Schema Name | Type | Required | Details |
|---|---|---|---|---|
| Name | `cr_Name` | Single line of text (200) | ✅ Business Required | Primary column. Facility name (e.g., "Robotics Lab 402") |
| Department | `cr_DepartmentId` | Lookup → Department | ✅ Business Required | The department that owns this facility |
| Capacity | `cr_Capacity` | Whole number | ✅ Business Required | Maximum occupancy (people). Min: 1 |
| Facility Type | `cr_FacilityType` | Choice | ✅ Business Required | See **Facility Type** choice below |
| Description | `cr_Description` | Multiple lines of text (2000) | ✅ Business Required | Description of the facility |
| Image URL | `cr_ImageUrl` | Single line of text (500) | ❌ Optional | URL to facility image |
| Max Recurrence Weeks | `cr_MaxRecurrenceWeeks` | Whole number | ✅ Business Required | Maximum weeks allowed for recurring bookings. Default: 4, Min: 1, Max: 52 |

### Choice: Facility Type (`cr_FacilityType`)

| Label | Value |
|---|---|
| Room | 100000000 |
| Lab | 100000001 |
| Hall | 100000002 |
| Sports | 100000003 |

### Relationships

| Type | Related Table | Schema Name | Details |
|---|---|---|---|
| Many-to-One | Department | `cr_Department_Facility` | Each facility belongs to one department |

### Seed Data

| Name | Department | Capacity | Type | Max Recurrence Weeks | Description |
|---|---|---|---|---|---|
| Robotics Lab 402 | Computer Science | 30 | Lab | 12 | Advanced robotics and AI research laboratory |
| Main Lecture Hall | Engineering | 200 | Hall | 8 | Large lecture hall for engineering courses |
| Meeting Room A | Business | 12 | Room | 4 | Small meeting room for departmental discussions |

---

## Table 3: Booking

**Display Name:** Booking  
**Plural Name:** Bookings  
**Schema Name:** `cr_Booking`  
**Primary Column:** Purpose  
**Description:** Facility reservations with approval workflow.  
**Record Ownership:** User or Team  

### Columns

| Display Name | Schema Name | Type | Required | Details |
|---|---|---|---|---|
| Purpose | `cr_Purpose` | Single line of text (500) | ✅ Business Required | Primary column. Reason for the booking |
| Facility | `cr_FacilityId` | Lookup → Facility | ✅ Business Required | The facility being booked |
| Booked By | `cr_BookedById` | Lookup → User (systemuser) | ✅ Business Required | The user who made the booking |
| Booked By Name | `cr_BookedByName` | Single line of text (200) | ✅ Business Required | Denormalized display name of the booking user |
| Department | `cr_DepartmentId` | Lookup → Department | ✅ Business Required | Department the facility belongs to (denormalized for filtering) |
| Start Time | `cr_StartTime` | Date and Time (User Local) | ✅ Business Required | Booking start date/time |
| End Time | `cr_EndTime` | Date and Time (User Local) | ✅ Business Required | Booking end date/time |
| Booking Status | `cr_BookingStatus` | Choice | ✅ Business Required | See **Booking Status** choice below. Default: Pending |
| Series ID | `cr_SeriesId` | Single line of text (100) | ❌ Optional | Groups recurring booking instances together. Null for one-time bookings |
| Created On | `createdon` | Date and Time | ✅ System | Auto-populated system column |

### Choice: Booking Status (`cr_BookingStatus`)

| Label | Value |
|---|---|
| Pending | 100000000 |
| Approved | 100000001 |
| Rejected | 100000002 |
| Cancelled | 100000003 |

**Default Value:** Pending (100000000)

### Relationships

| Type | Related Table | Schema Name | Details |
|---|---|---|---|
| Many-to-One | Facility | `cr_Facility_Booking` | Each booking is for one facility |
| Many-to-One | Department | `cr_Department_Booking` | Each booking belongs to one department |
| Many-to-One | User (systemuser) | `cr_User_Booking` | Each booking is created by one user |

### Business Rules

1. **Conflict Prevention:** No two bookings with status `Approved` or `Pending` may overlap on the same facility (same time range). Bookings with status `Rejected` or `Cancelled` do not block new bookings.
2. **Time Slot Grid:** Start and End times must align to 30-minute intervals between 08:00 and 22:00.
3. **Recurrence:** When a recurring booking is created, individual Booking records are generated for each week with the same `Series ID`. The maximum number of weeks is governed by the facility's `Max Recurrence Weeks`.
4. **Status Workflow:** `Pending` → `Approved` or `Rejected`. `Approved` → `Cancelled`. No other transitions allowed.

---

## Table 4: Blackout Period

**Display Name:** Blackout Period  
**Plural Name:** Blackout Periods  
**Schema Name:** `cr_BlackoutPeriod`  
**Primary Column:** Reason  
**Description:** Periods when facilities are unavailable (maintenance, holidays, closures).  
**Record Ownership:** Organization  

### Columns

| Display Name | Schema Name | Type | Required | Details |
|---|---|---|---|---|
| Reason | `cr_Reason` | Single line of text (500) | ✅ Business Required | Primary column. Reason for the blackout (e.g., "Annual Maintenance") |
| Facility | `cr_FacilityId` | Lookup → Facility | ❌ Optional | The specific facility to black out. **Leave blank for a global blackout** that applies to ALL facilities |
| Is Global | `cr_IsGlobal` | Yes/No (Boolean) | ✅ Business Required | Default: No. Set to Yes when the blackout applies to all facilities (Facility column is blank) |
| Start Time | `cr_StartTime` | Date and Time (User Local) | ✅ Business Required | Blackout start date/time |
| End Time | `cr_EndTime` | Date and Time (User Local) | ✅ Business Required | Blackout end date/time |
| Created By | `createdby` | Lookup → User (systemuser) | ✅ System | Auto-populated system column |

### Relationships

| Type | Related Table | Schema Name | Details |
|---|---|---|---|
| Many-to-One | Facility | `cr_Facility_BlackoutPeriod` | Each blackout optionally targets one facility |

### Business Rules

1. If `Is Global` = Yes, the `Facility` lookup must be blank. The blackout blocks ALL facilities.
2. If `Is Global` = No, the `Facility` lookup is required.
3. No bookings (any status) can be created within a blackout period's time range for the affected facility/facilities.

---

## Relationship Diagram

```
┌──────────────┐       1:N        ┌──────────────┐
│  Department   │─────────────────▶│   Facility    │
│              │                  │              │
│  Name        │                  │  Name        │
└──────┬───────┘                  │  Capacity    │
       │                          │  Type        │
       │ 1:N                      │  Description │
       │                          │  MaxRecurWks │
       │                          └──────┬───────┘
       │                                 │
       │         ┌───────────────────────┤
       │         │ 1:N                   │ 1:N
       ▼         ▼                       ▼
┌──────────────────┐          ┌──────────────────┐
│     Booking       │          │  Blackout Period  │
│                  │          │                  │
│  Purpose         │          │  Reason          │
│  Booked By ──▶ User        │  IsGlobal        │
│  Start Time      │          │  Start Time      │
│  End Time        │          │  End Time        │
│  Status          │          │  Created By ──▶ User
│  Series ID       │          └──────────────────┘
└──────────────────┘

         ┌──────────────┐
         │ User          │
         │ (systemuser)  │
         │               │
         │ Security Role │
         │ determines    │
         │ app role      │
         └──────────────┘
```

---

## Security Roles

Instead of a custom `role` column, map app roles to **Dataverse Security Roles**:

| App Role | Dataverse Security Role Name | Permissions |
|---|---|---|
| **User** | `Facility Booking - User` | Create own Bookings. Read all Facilities, Departments. Read own Bookings. Update own Bookings (cancel only). |
| **Admin** | `Facility Booking - Admin` | All User permissions + Read/Update Bookings in their Department (approve/reject). Create/Read/Update Blackout Periods for their department's facilities. |
| **Super Admin** | `Facility Booking - Super Admin` | All Admin permissions across ALL departments + Create/Update/Delete Facilities, Departments. Create global Blackout Periods. Manage all users' bookings. |

### Role Privilege Matrix

| Entity | User | Admin | Super Admin |
|---|---|---|---|
| Department | Read | Read | Full (CRUD) |
| Facility | Read | Read | Full (CRUD) |
| Booking | Create (own), Read (own), Update (own - cancel) | + Read/Update (dept), Approve/Reject | Full (all records) |
| Blackout Period | Read | Create/Read/Update (dept facilities) | Full (CRUD, global) |

---

## Choice Columns Summary

### Facility Type (`cr_FacilityType`)
| Label | Value |
|---|---|
| Room | 100000000 |
| Lab | 100000001 |
| Hall | 100000002 |
| Sports | 100000003 |

### Booking Status (`cr_BookingStatus`)
| Label | Value |
|---|---|
| Pending | 100000000 |
| Approved | 100000001 |
| Rejected | 100000002 |
| Cancelled | 100000003 |

---

## Views to Create

| Table | View Name | Filter/Sort |
|---|---|---|
| Booking | Active Bookings | Status = Pending or Approved, sorted by Start Time ascending |
| Booking | My Bookings | Booked By = current user, sorted by Created On descending |
| Booking | Pending Approvals | Status = Pending, sorted by Created On ascending |
| Booking | Department Bookings | Filter by Department, sorted by Start Time |
| Facility | All Facilities | Active records, sorted by Name |
| Facility | Facilities by Department | Grouped by Department |
| Blackout Period | Active Blackouts | End Time >= today, sorted by Start Time |
| Department | All Departments | Active records, sorted by Name |

---

## Notes

- **User table:** This schema uses the built-in Dataverse `systemuser` table for users. Do NOT create a custom User table. App roles are handled via Security Roles assigned to users.
- **Series ID:** This is a text field (not a lookup) that groups recurring booking instances. Use a GUID or timestamp-based ID when creating recurring series.
- **Booked By Name:** This is denormalized for display performance. It should be populated from the user's full name at booking creation time.
- **Is Global (Blackout):** In the app code, a `facilityId` value of `'all'` means global. In Dataverse, this maps to `Is Global = Yes` with a blank Facility lookup.
- **Publisher Prefix:** Replace `cr_` with your solution's actual publisher prefix.
