# Requirements: Memberstack Plugin v1

**Defined:** 2026-03-01
**Core Value:** Users can select and switch Memberstack apps from within Ship Studio so the AI agent operates on the right app

## v1 Requirements

### App Switcher

- [ ] **APPS-01**: User can search/filter their app list by name
- [ ] **APPS-02**: User can select an app, which calls switchApp via JSON-RPC to update MCP context
- [ ] **APPS-03**: Active app name is displayed prominently in the modal header
- [ ] **APPS-04**: Selected app persists across plugin sessions via storage
- [ ] **APPS-05**: Toolbar button shows active app name or indicator when connected

### Environment

- [ ] **ENV-01**: User can toggle between LIVE and SANDBOX environments
- [ ] **ENV-02**: Toggle calls switchMemberstackEnvironment via JSON-RPC
- [ ] **ENV-03**: Current environment state is visually clear (badge/indicator)

### Knowledge Search

- [ ] **KNOW-01**: Modal has tabs to switch between app management and knowledge search
- [ ] **KNOW-02**: User can search Memberstack docs/scripts via text input
- [ ] **KNOW-03**: Results show titles, content snippets, and source URLs
- [ ] **KNOW-04**: Code snippets from memberscripts are displayed in copyable format
- [ ] **KNOW-05**: User can filter by source category (help center, blog, memberscript, component, template)

### Verification

- [ ] **VER-01**: E2E verification that app switching changes MCP context (call currentApp after switch)
- [ ] **VER-02**: E2E verification that environment toggle works (call getMemberstackEnvironment after switch)
- [ ] **VER-03**: E2E verification that knowledge search returns results for known queries

## v2 Requirements

### Member Management

- **MEM-01**: User can search members by email
- **MEM-02**: User can view member details (plans, status, custom fields)
- **MEM-03**: User can assign/remove plans from members

### App Dashboard

- **DASH-01**: Show member count for active app
- **DASH-02**: Show active plans with IDs
- **DASH-03**: Show content groups with IDs

### Quick Reference

- **REF-01**: Copyable plan IDs for data attributes
- **REF-02**: Copyable content group IDs
- **REF-03**: Copyable custom field IDs

## Out of Scope

| Feature | Reason |
|---------|--------|
| Additional Ship Studio slots | Toolbar slot is sufficient for v1 |
| Webflow code generation | Not core to app switching or knowledge search |
| Member creation/editing | Heavy feature, deferred to v2 |
| Stripe integration management | Dashboard-only concern |
| Custom domain configuration | Dashboard-only concern |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APPS-01 | — | Pending |
| APPS-02 | — | Pending |
| APPS-03 | — | Pending |
| APPS-04 | — | Pending |
| APPS-05 | — | Pending |
| ENV-01 | — | Pending |
| ENV-02 | — | Pending |
| ENV-03 | — | Pending |
| KNOW-01 | — | Pending |
| KNOW-02 | — | Pending |
| KNOW-03 | — | Pending |
| KNOW-04 | — | Pending |
| KNOW-05 | — | Pending |
| VER-01 | — | Pending |
| VER-02 | — | Pending |
| VER-03 | — | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
