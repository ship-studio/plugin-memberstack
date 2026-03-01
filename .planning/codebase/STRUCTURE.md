# Codebase Structure

**Analysis Date:** 2026-03-01

## Directory Layout

```
plugin-memberstack/
├── src/                     # Source code (TypeScript/React)
├── dist/                    # Built output (generated, not committed)
├── node_modules/            # Dependencies (git ignored)
├── .git/                    # Version control
├── .planning/               # GSD documentation
├── .claude/                 # Claude.com workspace config
├── package.json             # Project manifest and scripts
├── package-lock.json        # Dependency lock file
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── plugin.json              # Ship Studio plugin metadata
└── .gitignore               # Git ignore rules
```

## Directory Purposes

**src/:**
- Purpose: All source code for the plugin
- Contains: React components, hooks, utilities, types, styles
- Key files: index.tsx (entry), useMemberstack.ts (state), components (UI)

**dist/:**
- Purpose: Output directory for built plugin
- Contains: Compiled JavaScript (ES module format)
- Generated: Yes (build artifacts)
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed npm dependencies
- Committed: No (in .gitignore)

**.planning/codebase/:**
- Purpose: GSD documentation and architecture analysis
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

## Key File Locations

**Entry Points:**
- `src/index.tsx`: Plugin entry point; exports MemberstackToolbar component as slots.toolbar, lifecycle hooks onActivate/onDeactivate

**Configuration:**
- `tsconfig.json`: TypeScript compiler options (target ES2020, JSX support, strict mode)
- `vite.config.ts`: Vite build configuration with rollup options to externalize React/React-DOM
- `plugin.json`: Ship Studio plugin metadata (id: memberstack, version 0.1.0, slots: toolbar)
- `package.json`: Project dependencies and build scripts

**Core Logic:**
- `src/useMemberstack.ts`: Main state management hook; 558 lines of detection, configuration, authentication, and app fetching logic
- `src/context.ts`: Plugin context hooks for accessing Ship Studio APIs (shell, storage, theme, actions)
- `src/types.ts`: TypeScript type definitions for all interfaces (PluginState, MemberstackState, PluginContextValue, etc.)

**UI Components:**
- `src/ToolbarButton.tsx`: Toolbar button with Memberstack icon and status indicator dot
- `src/Modal.tsx`: Generic modal wrapper with theme support and ESC-to-close
- `src/ConnectView.tsx`: Multi-state UI for no-tools, not-configured, configured, and error states
- `src/ConnectedView.tsx`: Post-authentication UI showing apps list and logout/disconnect actions

**Styling:**
- `src/styles.ts`: CSS-in-JS string with all component styles using BEM naming (ms-plugin-* prefix) and keyframe animations

## Naming Conventions

**Files:**
- Components: PascalCase.tsx (e.g., ToolbarButton.tsx, ConnectView.tsx)
- Hooks: camelCase with "use" prefix and .ts extension (e.g., useMemberstack.ts)
- Utilities/Constants: camelCase.ts (e.g., context.ts, types.ts, styles.ts)

**Directories:**
- Flat structure: No nested feature directories; all files at src/ root
- Convention: Functional organization by purpose (hooks, components, utilities)

**Functions:**
- React components: PascalCase (MemberstackToolbar, ToolbarButton, ConnectView)
- Hooks: camelCase with "use" prefix (useMemberstack, usePluginContext, useTheme)
- Utility functions: camelCase (roleeBadgeColor, statusDotClass, statusTitle, useInjectStyles)
- Handlers: camelCase with action name (connect, authenticate, logout, fetchApps)

**Types/Interfaces:**
- Types: PascalCase with Type suffix optional (PluginState, MemberstackState, UseMemberstackReturn, ToolStatus)
- Enums/Union types: Named descriptively ('loading' | 'no-tools' | 'configured' | 'connected')

**CSS Classes:**
- Convention: BEM with "ms-plugin-" prefix
- Pattern: `.ms-plugin-{block}`, `.ms-plugin-{block}--{modifier}`, `.ms-plugin-{block}__{element}`
- Examples: `.ms-plugin-btn`, `.ms-plugin-btn--primary`, `.ms-plugin-modal-header`

**Constants:**
- All caps with underscores: MS_STYLE_ID, MEMBERSTACK_CSS, MCP_URL, DEFAULT_TOOLS

## Where to Add New Code

**New Feature (e.g., new tool type detection):**
- Primary code: `src/useMemberstack.ts` (detection logic in detect() effect)
- Supporting types: `src/types.ts` (extend Tool union, ToolStatus interface)
- UI rendering: `src/ConnectView.tsx` or `src/ConnectedView.tsx` (conditional UI)

**New Component/Module:**
- Implementation: `src/NewComponent.tsx` (if UI) or `src/useNewHook.ts` (if logic)
- Integration: Import and use in `src/index.tsx` or other components
- Styling: Add classes to `src/styles.ts`
- Types: Add interfaces to `src/types.ts`

**Utilities:**
- Shared helpers: `src/context.ts` (for context hooks) or create new `src/utils.ts`
- Constants: Add to top of relevant file or create `src/constants.ts`

**Tests (when added):**
- Location: Colocate with source (e.g., `src/useMemberstack.test.ts` or `src/__tests__/useMemberstack.test.ts`)
- Pattern: Follow test conventions in TESTING.md (to be documented)

## Special Directories

**dist/:**
- Purpose: Compiled plugin output
- Generated: Yes (by `npm run build` or `npm run dev`)
- Committed: No (.gitignore present)
- Contents: Single index.js file (ES module format) per vite.config.ts

**.planning/codebase/:**
- Purpose: Architecture and documentation artifacts
- Generated: Yes (by /gsd:map-codebase command)
- Committed: Yes (version control documents architecture decisions)
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

**.claude/:**
- Purpose: Claude.com workspace settings
- Generated: Yes (by Claude.com)
- Committed: Yes (to sync workspace state)
- Contents: Workspace configuration files

## File Organization Summary

| Purpose | Location | Extension | Count |
|---------|----------|-----------|-------|
| Entry point | src/index.tsx | tsx | 1 |
| State hooks | src/useMemberstack.ts | ts | 1 |
| Context hooks | src/context.ts | ts | 1 |
| UI components | src/{ToolbarButton,Modal,ConnectView,ConnectedView}.tsx | tsx | 4 |
| Type definitions | src/types.ts | ts | 1 |
| Styling | src/styles.ts | ts | 1 |
| **Total src/** | | | **9 files** |
| Config files | {tsconfig.json, vite.config.ts, plugin.json, package.json} | json/ts | 4 |

## Directory Tree (Visual Reference)

```
src/
├── index.tsx              # Plugin entry + toolbar component
├── useMemberstack.ts      # Main state management hook (558 lines)
├── context.ts             # Plugin context hooks
├── types.ts               # Type definitions
├── styles.ts              # CSS-in-JS styling
├── ToolbarButton.tsx      # Toolbar UI with status dot
├── Modal.tsx              # Modal wrapper component
├── ConnectView.tsx        # Connection flow UI (4 states)
└── ConnectedView.tsx      # Post-auth UI (apps + actions)
```
