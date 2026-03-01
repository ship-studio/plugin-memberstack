# Roadmap: Memberstack Plugin for Ship Studio

## Overview

This roadmap delivers a connected, useful plugin in three phases. Phase 1 replaces the flat app list with a searchable switcher that actually changes MCP context. Phase 2 adds environment control and knowledge search to the same modal. Phase 3 proves everything works via programmatic E2E verification.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: App Switcher** - Searchable app selector with persistent selection and MCP context switching
- [ ] **Phase 2: Environment and Knowledge** - LIVE/SANDBOX toggle and knowledge base search tab in the modal
- [ ] **Phase 3: Verification** - E2E verification that app switching, environment toggle, and knowledge search all work

## Phase Details

### Phase 1: App Switcher
**Goal**: Users can find their app by name, select it, and have the AI agent operate on that app across sessions
**Depends on**: Nothing (first phase)
**Requirements**: APPS-01, APPS-02, APPS-03, APPS-04, APPS-05
**Success Criteria** (what must be TRUE):
  1. User can type in a search field and see their app list filtered in real time
  2. User can select an app and the MCP context updates (switchApp called via JSON-RPC)
  3. The active app name is visible in the modal header immediately after selection
  4. Closing and reopening the plugin shows the same app still selected (persisted via storage)
  5. Toolbar button reflects the connected app (name or indicator visible without opening modal)
**Plans**: TBD

Plans:
- [ ] 01-01: Searchable app selector component replacing the flat list, wired to switchApp JSON-RPC
- [ ] 01-02: App persistence via storage and toolbar button active app display

### Phase 2: Environment and Knowledge
**Goal**: Users can switch between LIVE and SANDBOX for their active app and search Memberstack's knowledge base without leaving the editor
**Depends on**: Phase 1
**Requirements**: ENV-01, ENV-02, ENV-03, KNOW-01, KNOW-02, KNOW-03, KNOW-04, KNOW-05
**Success Criteria** (what must be TRUE):
  1. User can toggle between LIVE and SANDBOX and see a visual indicator of the current state
  2. Toggling environment calls switchMemberstackEnvironment via JSON-RPC
  3. Modal has tabs that let user switch between app management and knowledge search
  4. User can type a query and see results with titles, snippets, and source URLs
  5. Code snippets from memberscripts are shown in a copyable format and results can be filtered by source category
**Plans**: TBD

Plans:
- [ ] 02-01: Environment toggle component with JSON-RPC call and visual state indicator
- [ ] 02-02: Knowledge search tab with text input, results display, copyable snippets, and category filter

### Phase 3: Verification
**Goal**: Programmatic proof that all three core capabilities (app switching, environment toggle, knowledge search) work correctly
**Depends on**: Phase 2
**Requirements**: VER-01, VER-02, VER-03
**Success Criteria** (what must be TRUE):
  1. Running E2E verification confirms that selecting an app changes the currentApp returned by MCP
  2. Running E2E verification confirms that toggling environment changes getMemberstackEnvironment response
  3. Running E2E verification confirms that a known query to knowledge search returns expected results
**Plans**: TBD

Plans:
- [ ] 03-01: E2E verification scripts for app switching, environment toggle, and knowledge search

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Switcher | 0/2 | Not started | - |
| 2. Environment and Knowledge | 0/2 | Not started | - |
| 3. Verification | 0/1 | Not started | - |
