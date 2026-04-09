# Code Apps Documentation Suite — Complete Guide

> **A comprehensive system for designing, building, and deploying scalable, dynamic Dataverse Code Apps.**

---

## 📚 Documentation Overview

This documentation suite provides everything needed to build production-grade Code Apps on Microsoft Dataverse. It consists of three interconnected documents, each serving a different purpose:

| Document | Purpose | Audience | Use When |
|---|---|---|---|
| **[SKILLS.md](SKILLS.md)** | Reusable patterns & best practices | Developers implementing features | You want to learn "how to do it right" |
| **[SPECIFICATION.md](SPECIFICATION.md)** | Architectural blueprint & design principles | Architects & tech leads | You're designing a new app from scratch |
| **[AGENT-GUIDE.md](AGENT-GUIDE.md)** | Step-by-step scaffolding procedures | AI agents & developers | You're building an app and need procedural steps |

---

## Quick Start: Which Document Should I Read?

### 🏗️ "I'm designing a new Code App"
**→ Start with [SPECIFICATION.md](SPECIFICATION.md)**

Start here to understand:
- Core architectural principles (no hardcoding, configuration-driven, extensible, multi-tenant)
- Layered architecture (Data → Business Logic → State → UI)
- Dynamic scalability patterns (field config, workflow config, permission matrices)
- Anti-patterns to avoid
- Real-time & multi-tenancy considerations

**Then read**: [SKILLS.md](SKILLS.md) for implementation patterns  
**Then use**: [AGENT-GUIDE.md](AGENT-GUIDE.md) for step-by-step execution

### 💻 "I'm implementing a feature"
**→ Start with [SKILLS.md](SKILLS.md)**

Start here to learn:
- How to wrap Dataverse services with business logic
- Creating custom React hooks for feature encapsulation
- Using Context API for app-wide state
- Type-first design patterns
- Configuration-driven UI
- Error handling and testing patterns

**When stuck**: Reference [SPECIFICATION.md](SPECIFICATION.md) sections for architectural context

### 🤖 "I'm building an app from scratch (or I'm an AI agent)"
**→ Follow [AGENT-GUIDE.md](AGENT-GUIDE.md)**

This document is procedural and step-by-step:
- Phase 0: Requirements & environment setup
- Phase 1: Dataverse schema design & creation
- Phase 2: Service layer generation
- Phase 3: Type definitions
- Phase 4: Hooks & state management
- Phase 5-10: Configuration, UI, rules, testing, deployment

Each phase has:
- Clear objectives
- Step-by-step instructions
- Code examples
- Verification checklists

---

## 🎯 Core Principles Across All Documents

These principles appear in all three documents:

### ✅ No Hardcoding
- All configurable aspects stored in metadata tables, environment variables, or feature flags
- Business rules, UI layouts, workflows, and permissions are externalized
- Example: Max booking weeks comes from config table, not `const MAX = 4`

### ✅ Configuration-Driven Architecture
- Behavior determined by configuration, not code branches
- Four layers of configuration: Environment, System, Entity, User/Department
- New features added via config, not code changes

### ✅ Extensibility Through Plugins
- New features added without modifying core code
- Plugin hooks for custom integrations (Teams notifications, webhooks, etc.)
- Teams can register custom handlers without forking codebase

### ✅ Multi-Tenancy from Day One
- Architecture assumes multiple independent organizations
- Every query filters by tenant ID
- Configuration and permissions scoped per tenant

### ✅ Layered Architecture
```
┌─────────────────────────────────────┐
│         UI Components               │ (React: Forms, Grids, Calendars)
├─────────────────────────────────────┤
│     Context API (App-wide State)    │ (Coordinates all features)
├─────────────────────────────────────┤
│      Feature Hooks (Logic)          │ (useFacilities, useBookings, etc.)
├─────────────────────────────────────┤
│    Service Wrappers (Dataverse)     │ (Generated services + business logic)
├─────────────────────────────────────┤
│    Generated Dataverse Services     │ (Auto-created by SDK)
├─────────────────────────────────────┤
│         Dataverse Backend           │ (Tables, relationships, security)
└─────────────────────────────────────┘
```

---

## 📖 Document Structure & Key Sections

### [SKILLS.md](SKILLS.md) — 10 Skill Areas

1. **Dataverse Service Layer Abstraction** — Wrap generated services with business logic
2. **Custom React Hooks as Abstraction** — Encapsulate feature behavior in reusable hooks
3. **Context API for State Management** — Coordinate multiple hooks and expose unified API
4. **Type-First Design** — Single source of truth in types.ts
5. **Configuration-Driven Approach** — Feature flags, business rules, layout config
6. **Pluggable Business Rules** — Rules registry for validators and approval workflows
7. **Audit Logging & Compliance** — Track all changes for compliance and debugging
8. **Error Handling & Loading States** — Consistent error and loading patterns
9. **Environment-Based Configuration** — Dev/Test/Prod with .env files
10. **Testing Patterns** — Mocking services, unit tests, integration tests

### [SPECIFICATION.md](SPECIFICATION.md) — 6 Major Parts

**Part 1: Core Principles**
- No hardcoding
- Configuration-driven
- Extensibility through plugins
- Multi-tenancy from ground up

**Part 2: Architectural Layers**
- Data layer (service abstraction)
- Business logic layer (rules & validation)
- State management (Context API)
- UI layer (configuration-driven components)

**Part 3: Dynamic Scalability Techniques**
- Field-level configuration
- Layout configuration
- Workflow configuration
- Permission matrices (RBAC)
- Custom extensibility hooks

**Part 4: Design Patterns**
- Service wrapper pattern
- Hook as feature logic
- Context for coordination

**Part 5: Anti-Patterns**
- What NOT to do (with solutions)

**Part 6: Advanced Topics**
- Multi-tenancy strategies
- Optimistic updates & conflict resolution

### [AGENT-GUIDE.md](AGENT-GUIDE.md) — 10 Execution Phases

**Phase 0**: Requirements & environment setup  
**Phase 1**: Dataverse schema design & creation  
**Phase 2**: Service layer generation  
**Phase 3**: Type definitions  
**Phase 4**: Hooks & state management  
**Phase 5**: Configuration schema  
**Phase 6**: UI components  
**Phase 7**: Business rules engine  
**Phase 8**: Integration testing  
**Phase 9**: Multi-environment setup  
**Phase 10**: Extensibility setup  

Each phase includes:
- Clear objectives
- Numbered procedural steps
- Code examples
- Verification checklists

---

## 🔄 How to Use These Documents Together

### Scenario 1: Building Your First Code App

1. **Understand the philosophy** → Read [SPECIFICATION.md](SPECIFICATION.md) Part 1 (Core Principles)
2. **Learn implementation patterns** → Read [SKILLS.md](SKILLS.md) sections 1-4 (Basics)
3. **Build the app** → Follow [AGENT-GUIDE.md](AGENT-GUIDE.md) Phases 0-5
4. **Add features** → Read [SKILLS.md](SKILLS.md) sections 5-10 as needed
5. **Optimize & extend** → Reference [SPECIFICATION.md](SPECIFICATION.md) Part 3 (Scalability Techniques)

### Scenario 2: Reviewing a Code App Architecture

1. **Check against specification** → Use [SPECIFICATION.md](SPECIFICATION.md) as checklist
2. **Verify skill implementation** → Cross-reference with [SKILLS.md](SKILLS.md) patterns
3. **Assess scalability** → Review [SPECIFICATION.md](SPECIFICATION.md) Part 3 techniques

### Scenario 3: Onboarding New Developer

1. **Give overview** → Send link to this page
2. **Orient to principles** → Have them read [SPECIFICATION.md](SPECIFICATION.md) Part 1
3. **Show patterns** → Have them study [SKILLS.md](SKILLS.md) for areas they'll work on
4. **Provide reference** → Bookmark [AGENT-GUIDE.md](AGENT-GUIDE.md) for when they build

### Scenario 4: AI Agent Scaffolding a New App

1. **Read the entire [AGENT-GUIDE.md](AGENT-GUIDE.md)** end-to-end
2. **Follow phases sequentially**, executing steps exactly
3. **Verify via checklists** after each phase
4. **Reference [SPECIFICATION.md](SPECIFICATION.md)** when design decisions needed
5. **Reference [SKILLS.md](SKILLS.md)** for implementation details

---

## 🗂️ Cross-Document Reference Map

### All Documents Address These Topics

#### No Hardcoding / Configuration-Driven
- **SKILLS.md**: Section 5 (Configuration-Driven Approach)
- **SPECIFICATION.md**: Part 1 (Core Principles) + Part 3 (Dynamic Scalability)
- **AGENT-GUIDE.md**: Phase 5 (Configuration Schema & Loaders)

#### Service Layer & Data Access
- **SKILLS.md**: Section 1-2 (Service Layer, Custom Hooks)
- **SPECIFICATION.md**: Part 2.1 (Data Layer)
- **AGENT-GUIDE.md**: Phase 2 (Service Generation), Phase 4 (Hooks)

#### State Management & Context
- **SKILLS.md**: Section 3 (Context API)
- **SPECIFICATION.md**: Part 2.3 (State Management Layer)
- **AGENT-GUIDE.md**: Phase 4 (Context Setup)

#### Type Safety
- **SKILLS.md**: Section 4 (Type-First Design)
- **SPECIFICATION.md**: Implicit throughout (architecture assumes strong types)
- **AGENT-GUIDE.md**: Phase 3 (Type Definitions)

#### Business Rules & Validation
- **SKILLS.md**: Section 6 (Pluggable Business Rules)
- **SPECIFICATION.md**: Part 2.2 (Business Logic Layer) + Part 3.4 (Permission Matrix)
- **AGENT-GUIDE.md**: Phase 7 (Business Rules Engine)

#### Multi-Tenancy
- **SKILLS.md**: Implicit in hook patterns (filter by tenant)
- **SPECIFICATION.md**: Part 1.4 (Multi-Tenancy) + Part 6.1 (Tenant Isolation)
- **AGENT-GUIDE.md**: Embedded in service calls (always filter by tenant)

#### Error Handling
- **SKILLS.md**: Section 8 (Error Handling & Loading States)
- **SPECIFICATION.md**: Implicit in all examples
- **AGENT-GUIDE.md**: Phase 4-6 (Error states in hooks/components)

#### Testing
- **SKILLS.md**: Section 10 (Testing Patterns)
- **SPECIFICATION.md**: Implicit in design (support mocking services)
- **AGENT-GUIDE.md**: Phase 8 (Integration Testing)

---

## 🎓 Learning Path by Role

### For Frontend Developers
1. [SKILLS.md](SKILLS.md) — Sections 1-4 (Fundamentals)
2. [SKILLS.md](SKILLS.md) — Sections 8-10 (Practices)
3. [AGENT-GUIDE.md](AGENT-GUIDE.md) — Phases 4-6 (Hooks, Context, UI)

**Time**: ~2 hours reading + ~4 hours implementation

### For Architects / Tech Leads
1. [SPECIFICATION.md](SPECIFICATION.md) — All parts
2. [SKILLS.md](SKILLS.md) — All sections (understand all patterns)
3. [AGENT-GUIDE.md](AGENT-GUIDE.md) — Skim phases (understand workflow)

**Time**: ~3 hours reading

### For DevOps / Deployment
1. [AGENT-GUIDE.md](AGENT-GUIDE.md) — Phase 0 (Environment), Phase 9 (Multi-Env)
2. [SKILLS.md](SKILLS.md) — Section 9 (Environment Config)
3. [SPECIFICATION.md](SPECIFICATION.md) — Part 1 (Concepts) for context

**Time**: ~1 hour reading

### For AI Agents Scaffolding Apps
1. [AGENT-GUIDE.md](AGENT-GUIDE.md) — Read entirely, follow procedurally
2. [SPECIFICATION.md](SPECIFICATION.md) — Reference for design decisions
3. [SKILLS.md](SKILLS.md) — Reference for implementation details

**Time**: Varies by app complexity

---

## 🚀 Getting Started in 5 Minutes

### For Immediate Action: "I want to build an app NOW"

```
1. Open AGENT-GUIDE.md
2. Go to Phase 0a: Gather Requirements
3. Follow the checklist
4. Move to Phase 1: Dataverse Schema
5. Continue phase by phase
```

### For Understanding: "I want to understand the philosophy FIRST"

```
1. Open SPECIFICATION.md
2. Read Part 1: Core Principles (5 min)
3. Read Part 2: Architectural Layers (10 min)
4. Skim Part 3: Scalability Techniques (5 min)
5. Now go to AGENT-GUIDE.md Phase 0
```

### For Deep Dive: "I want to master all these patterns"

```
1. Read SPECIFICATION.md (30 min)
2. Study SKILLS.md (60 min)
3. Implement AGENT-GUIDE.md Phase 1-5 (hands-on, 4-6 hours)
4. Reference SKILLS.md for each feature you build
5. Refer to SPECIFICATION.md when making architectural decisions
```

---

## ✅ Quality Assurance Checklist

Before deploying your Code App, verify against these documents:

**Architecture (from SPECIFICATION.md)**
- [ ] No hardcoded values (fields, statuses, rules)
- [ ] Configuration-driven behavior implemented
- [ ] Layered architecture followed (Data → Logic → State → UI)
- [ ] Anti-patterns identified and eliminated

**Implementation (from SKILLS.md)**
- [ ] Service layer wraps Dataverse SDK
- [ ] Hooks encapsulate business logic
- [ ] Context API coordinates features
- [ ] Types defined in single types.ts
- [ ] Error handling consistent across hooks
- [ ] Unit tests for hooks
- [ ] Integration tests for workflows

**Completeness (from AGENT-GUIDE.md)**
- [ ] All 10 phases completed
- [ ] Verification checklists passed at each phase
- [ ] Code compiles without errors
- [ ] All tests passing
- [ ] Multi-environment configs ready

---

## 📞 FAQ

**Q: Can I use these documents for multiple projects?**  
A: Yes! These are generic patterns applicable to any Dataverse Code App. Adapt them to your specific domain.

**Q: Should I follow AGENT-GUIDE.md exactly or can I adapt?**  
A: Adapt as needed, but keep the phase sequence. Each phase depends on previous ones.

**Q: What if my app is simpler than the examples?**  
A: Skip irrelevant phases (e.g., if no approval workflows, skip approval-specific parts of Phase 7). Principles still apply.

**Q: How do I handle changes after launch?**  
A: Use Configuration (SPECIFICATION.md Part 3) to change behavior without code. Add new entities by repeating Phases 1-5.

**Q: Can AI agents use AGENT-GUIDE.md to scaffold apps?**  
A: Yes! It's written with procedural steps that agents can follow. Ensure agent understands prerequisites and verifies each phase.

---

## 📝 Document Maintenance

These documents are living guidance. As patterns evolve:

- Update [SKILLS.md](SKILLS.md) when new patterns emerge
- Update [SPECIFICATION.md](SPECIFICATION.md) when architectural decisions change
- Update [AGENT-GUIDE.md](AGENT-GUIDE.md) when procedural steps improve

---

## 🔗 Related Artifacts

In your workspace, you also have:

- **DATAVERSE_SCHEMA.md** — Complete schema for FacilityBook (existing app)
- **facilitybook/** — Reference implementation (study for patterns)
- **.env files** — Environment configuration examples
- **src/generated/** — Example of generated services
- **src/** — Example of all patterns in practice

---

## Summary

You now have a comprehensive system for building scalable, dynamic Dataverse Code Apps:

| Need | Document |
|---|---|
| Understand WHY | [SPECIFICATION.md](SPECIFICATION.md) |
| Learn HOW | [SKILLS.md](SKILLS.md) |
| Implement WHAT | [AGENT-GUIDE.md](AGENT-GUIDE.md) |

**Start now:**
- **Designers**: Read [SPECIFICATION.md](SPECIFICATION.md)
- **Developers**: Start with [AGENT-GUIDE.md](AGENT-GUIDE.md)
- **Architects**: Read all three

---

**Version**: 1.0  
**Created**: April 2026  
**Based on**: FacilityBook production architecture
