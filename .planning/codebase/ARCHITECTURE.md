# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** Plugin-based React component system with state management and external service integration

**Key Characteristics:**
- Ship Studio plugin architecture leveraging host-provided React and DOM APIs
- State-driven UI with modal-based user interactions
- Multi-stage state progression (detection → configuration → authentication → connected)
- Shell command execution for tool configuration and MCP server management
- OAuth-based authentication with file system polling

## Layers

**Presentation (UI Components):**
- Purpose: Render user-facing interfaces for connection setup and account management
- Location: `src/ToolbarButton.tsx`, `src/Modal.tsx`, `src/ConnectView.tsx`, `src/ConnectedView.tsx`
- Contains: React functional components with theme-aware styling
- Depends on: `useMemberstack` hook, theme context, plugin actions
- Used by: `MemberstackToolbar` component

**State Management (Hooks):**
- Purpose: Manage plugin state, detect tools, configure MCP servers, handle authentication
- Location: `src/useMemberstack.ts`
- Contains: Complex state logic via useState, useCallback, useEffect, and refs
- Depends on: Plugin context (shell, storage, actions)
- Used by: `MemberstackToolbar` and view components

**Context Layer:**
- Purpose: Provide access to Ship Studio plugin APIs
- Location: `src/context.ts`
- Contains: Hook wrappers for shell execution, storage, theme, and actions
- Depends on: Window global for Ship Studio context reference
- Used by: All hooks and components

**Entry Point:**
- Purpose: Bootstrap plugin and export required Ship Studio interfaces
- Location: `src/index.tsx`
- Contains: Root component, style injection, plugin lifecycle hooks
- Depends on: All other modules

**Type Definitions:**
- Purpose: Define plugin interfaces and state contracts
- Location: `src/types.ts`
- Contains: TypeScript interfaces for PluginContextValue, MemberstackState, and enums

**Styling:**
- Purpose: Define CSS classes and animations for plugin UI
- Location: `src/styles.ts`
- Contains: CSS-in-JS string with BEM-style class names and keyframe animations
- Depends on: None (style injection via DOM)
- Used by: All components

## Data Flow

**Detection Phase (on mount):**
1. Plugin mounts and `useInjectStyles()` injects CSS into document head
2. `useMemberstack()` hook runs detection effect on initial render
3. Shell commands check for Node.js, Claude Code (~/.claude.json), Codex (~/.codex/config.toml)
4. Shell commands check for MCP authentication files (~/.mcp-auth)
5. State transitions: loading → no-tools | not-configured | configured | connected

**Configuration Phase:**
1. User clicks "Connect Memberstack" button in ConnectView
2. `connect()` callback executes Node scripts via shell to modify tool config files
3. Scripts add memberstack MCP server entry to ~/.claude.json (JSON) or ~/.codex/config.toml (TOML)
4. On success, status changes to "configured"

**Authentication Phase:**
1. User clicks "Authenticate with Memberstack" in ConnectView
2. `authenticate()` spawns mcp-remote process with nohup in background
3. Process polls ~/.mcp-auth directory every 2 seconds for auth token file
4. On token found, status changes to "connected" and auto-fetches apps
5. User can cancel polling via `cancelAuth()`

**App Fetch Phase:**
1. Triggered automatically when entering "connected" status (once per mount)
2. Spawns Node child_process running mcp-remote with JSON-RPC communication
3. Sends initialize, notifications/initialized, then tools/call (listApps)
4. Parses response content array, normalizes app field names
5. Falls back to cached apps on error (from storage)

**State Transitions:**
```
loading
├─ no-tools (no tools detected) → refresh → loading
├─ not-configured (tools found, no MCP config)
│  └─ connect() → configured
├─ configured (MCP configured, not authenticated)
│  └─ authenticate() → authenticating → connected
├─ connected (authenticated, can fetch apps)
│  └─ logout() → configured
│  └─ disconnect() → not-configured
└─ error (detection failed)
   └─ refresh → loading
```

**State Management:**
- Local React state for UI (status, tools, authenticated, apps, loading flags, error)
- Refs for stable callback references and polling control (authPidRef, authPollRef, shellRef, storageRef)
- Plugin storage for caching app data (cachedApps)
- File system as source of truth (tool configs, auth tokens)

## Key Abstractions

**MemberstackState:**
- Purpose: Represents complete plugin state at any moment
- Location: `src/types.ts` (interface definition), `src/useMemberstack.ts` (implementation)
- Pattern: Immutable state via React hooks; state updates trigger re-renders
- Fields: status, tools, authenticated, apps, error, loading, fetchingApps, authenticating

**PluginState (enum):**
- Purpose: Represent state progression stages
- Values: 'loading' | 'no-tools' | 'not-configured' | 'configured' | 'connected' | 'error'
- Used by: Components to conditionally render UI per stage

**ToolStatus:**
- Purpose: Track installation and configuration of AI tools
- Fields: installed (boolean), configured (boolean)
- Tools tracked: 'claude-code', 'codex'

**MemberstackApp:**
- Purpose: Represent a Memberstack application the user has access to
- Fields: id, name, role, createdAt
- Source: MCP server listApps tool response, normalized from various field names

**PluginContextValue:**
- Purpose: Capsule all Ship Studio APIs provided to plugin
- Contains: shell, storage, actions, theme, invoke, project metadata
- Access: `usePluginContext()` and specialized hooks (useShell, useStorage, useTheme, etc.)

## Entry Points

**MemberstackToolbar:**
- Location: `src/index.tsx` (exported as `slots.toolbar`)
- Triggers: Mounted by Ship Studio when plugin is loaded
- Responsibilities:
  - Initialize styles via `useInjectStyles()`
  - Fetch memberstack state via `useMemberstack()`
  - Render toolbar button with status indicator
  - Manage modal visibility state
  - Route to ConnectView or ConnectedView based on connection status

**onActivate():**
- Location: `src/index.tsx` (lifecycle hook)
- Triggers: When plugin is enabled by user
- Responsibilities: Console log activation

**onDeactivate():**
- Location: `src/index.tsx` (lifecycle hook)
- Triggers: When plugin is disabled by user
- Responsibilities: Remove injected styles from DOM

## Error Handling

**Strategy:** Catch errors at operation level, store in state, display to user via UI

**Patterns:**
- Detection errors result in status='error' and display in error box UI
- Configuration errors show toast notification and error box, state reverts
- Authentication errors stop polling and display error message
- App fetch errors fall back to cached data or show "No apps found"
- Shell execution errors capture stderr and display user-friendly message

**Error boundaries:** No formal React error boundary; relies on try-catch in callbacks

## Cross-Cutting Concerns

**Logging:**
- Console logs via `console.log('[memberstack] ...')` prefix
- Structured JSON logging from Node scripts executed via shell
- Debug output: first app keys, response structure for MCP responses

**Validation:**
- Exit code checks on all shell.exec() calls
- JSON parse error handling with try-catch
- Tool detection via file existence checks (head -1, which, ls)
- App field name flexibility (maps from 8+ possible field names)

**Authentication:**
- OAuth via mcp-remote CLI tool
- File system polling for auth token presence
- Token stored at ~/.mcp-auth/*.json by mcp-remote
- Timeout after 120 seconds (configurable)
- Process cleanup on cancel or completion

**State Persistence:**
- App list cached to plugin storage (via storage.write/read)
- Tool configs written to user home directory files
- Auth tokens written by mcp-remote to ~/.mcp-auth
- MCP config persisted in ~/.claude.json and ~/.codex/config.toml

**Concurrency Control:**
- `fetchingRef.current` prevents concurrent app fetches
- `fetchAttemptedRef.current` prevents re-fetching on mount
- `cancelledRef.current` allows cancellation of detection effects
- `mountedRef.current` prevents state updates after unmount
