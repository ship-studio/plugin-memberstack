# Memberstack Plugin for Ship Studio

## What This Is

A Ship Studio toolbar plugin that connects users to their Memberstack account via MCP, lets them switch between apps and environments, and surfaces Memberstack's knowledge base (docs, memberscripts, templates) directly in the editor. Currently the plugin only handles connection setup — this project makes the connected state actually useful.

## Core Value

Users can select and switch Memberstack apps from within Ship Studio so the AI agent operates on the right app, without leaving the editor.

## Requirements

### Validated

- MCP connection setup (detect tools, configure, authenticate) — existing
- App listing with role badges — existing
- Logout and disconnect flows — existing
- Toolbar button with status indicator — existing

### Active

- [ ] Searchable app selector that replaces the flat app list
- [ ] Selecting an app calls switchApp via JSON-RPC to update MCP context
- [ ] Active app name displayed prominently (in toolbar or modal header)
- [ ] Selected app persists across plugin sessions via storage
- [ ] LIVE/SANDBOX environment toggle with visual indicator
- [ ] Environment switch calls switchMemberstackEnvironment via JSON-RPC
- [ ] Current environment state shown clearly in UI
- [ ] Knowledge base search tab in the modal (alongside app management)
- [ ] Search input that queries memberstackKnowledgeSearch
- [ ] Results displayed with titles, content snippets, source URLs
- [ ] Code snippets from memberscripts shown in copyable format
- [ ] Source category filtering (help center, blog post, memberscript, component, template)
- [ ] E2E verification that app switching actually changes MCP context
- [ ] E2E verification that environment toggle works
- [ ] E2E verification that knowledge search returns results

### Out of Scope

- Member management (search, create, edit) — v2 feature, heavier effort
- App dashboard / stats (member counts, plans overview) — v2 feature
- Quick reference panel (plan IDs, content group IDs) — v2 feature
- Additional Ship Studio slots beyond toolbar — current slot is sufficient
- Webflow-specific code generation — out of scope for this version

## Context

- Ship Studio plugin API provides: shell.exec, storage, actions (showToast, openUrl), theme, project info, invoke
- MCP communication uses JSON-RPC via shell.exec spawning Node processes with mcp-remote — proven pattern from existing fetchApps
- The Memberstack MCP exposes 62 tools across 7 categories (members, plans, dataTables, gatedContent, teams, customFields, stripe) plus a knowledge base search
- `currentApp` returns rich data: Stripe connection, branding, security settings, redirects, stack type, domains, member limits
- `memberstackKnowledgeSearch` accepts natural language queries and returns docs, memberscripts (150+ code snippets), Webflow components, and templates
- User has 130+ apps — the app list must be searchable, not a flat list
- The plugin is brownfield: 9 source files, ~558-line main hook, well-structured with clear patterns

## Constraints

- **Tech stack**: React 19, TypeScript 5.6, Vite 6.0 — must match existing setup
- **Ship Studio API**: Only toolbar slot available; all MCP calls go through shell.exec
- **MCP pattern**: Must use JSON-RPC via mcp-remote (same as fetchApps) for switchApp and switchMemberstackEnvironment
- **Build output**: Single ES module (dist/index.js), React externalized to Ship Studio host
- **Verification**: Each feature must be programmatically verified (E2E) — not just manual testing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| App switcher replaces flat list | User has 130+ apps; flat list is unusable at scale | — Pending |
| JSON-RPC for app/env switching | Proven pattern from fetchApps; keeps MCP state in sync | — Pending |
| Knowledge search as modal tab | Keeps single entry point (toolbar button); tabs cleanly separate concerns | — Pending |
| E2E verification via shell commands | User wants programmatic proof that features work, not manual testing | — Pending |

---
*Last updated: 2026-03-01 after initialization*
