# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `ToolbarButton.tsx`, `ConnectView.tsx`, `Modal.tsx`)
- Utilities/Hooks: camelCase with descriptive names (e.g., `useMemberstack.ts`, `context.ts`, `styles.ts`)
- Type definitions: `types.ts` (single file for all type exports)

**Functions:**
- React components: PascalCase (e.g., `MemberstackToolbar`, `ConnectView`)
- Utility functions: camelCase (e.g., `usePluginContext`, `useTheme`, `statusDotClass`)
- Custom hooks: camelCase with `use` prefix (e.g., `useMemberstack`, `usePluginContext`, `useInjectStyles`)
- Helper functions: camelCase (e.g., `statusDotClass`, `statusTitle`, `roleBadgeColor`)

**Variables:**
- State variables: camelCase (e.g., `status`, `tools`, `authenticated`, `showModal`)
- Constants: UPPER_SNAKE_CASE for style IDs and config values (e.g., `MS_STYLE_ID`, `MCP_URL`, `DEFAULT_TOOLS`)
- Private refs: camelCase with `Ref` suffix (e.g., `shellRef`, `authPidRef`, `fetchingRef`)
- Destructured props: camelCase (e.g., `{ ms }`, `{ status, onClick }`)

**Types:**
- Interfaces: PascalCase prefixed with context (e.g., `PluginContextValue`, `MemberstackState`, `UseMemberstackReturn`)
- Type aliases: PascalCase (e.g., `PluginState`, `Tool`, `ToolStatus`)
- Generic object keys: camelCase (e.g., `Record<Tool, ToolStatus>`)

## Code Style

**Formatting:**
- No explicit formatter configured (Prettier not in devDependencies)
- Indentation: 2 spaces (observed in all source files)
- Line length: No explicit limit observed
- Semicolons: Always present at end of statements
- Quotes: Single quotes for strings (e.g., `'react'`, `'memberstack'`)

**Linting:**
- No ESLint configuration detected
- Manual ESLint disable comment used where needed (e.g., `// eslint-disable-line react-hooks/exhaustive-deps`)
- Implies linting rules are enforced externally or not used in development

## Import Organization

**Order:**
1. React/third-party library imports (e.g., `import { useState, useEffect } from 'react'`)
2. Local utility imports (e.g., `import { usePluginContext } from './context'`)
3. Local component imports (e.g., `import { ToolbarButton } from './ToolbarButton'`)
4. Type imports via `type` keyword (e.g., `import type { Tool, ToolStatus } from './types'`)
5. Constant imports (e.g., `import { MS_STYLE_ID, MEMBERSTACK_CSS } from './styles'`)

**Path Aliases:**
- Relative imports only (no path aliases configured)
- Uses `./` for sibling files in same directory

**Example import block from `src/index.tsx`:**
```typescript
import { useState, useEffect } from 'react';
import { useMemberstack } from './useMemberstack';
import { ToolbarButton } from './ToolbarButton';
import { Modal } from './Modal';
import { ConnectView } from './ConnectView';
import { ConnectedView } from './ConnectedView';
import { MS_STYLE_ID, MEMBERSTACK_CSS } from './styles';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations and JSON parsing (e.g., in `useMemberstack.ts`)
- Catch blocks check `instanceof Error` for proper error type casting:
  ```typescript
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setError(msg);
  }
  ```
- Silent catches for non-critical operations (e.g., JSON parse failures in `fetchApps`):
  ```typescript
  try { cfg = JSON.parse(claudeResult.stdout); } catch {}
  ```
- Shell execution results checked for exit code: `if (result.exit_code !== 0) throw new Error(...)`
- Promises may reject silently in polling operations (e.g., `catch { /* keep polling */ }`)

## Logging

**Framework:** `console` only

**Patterns:**
- Use `console.log` with descriptive prefix for debugging
- Log important state transitions: `console.log('[memberstack] Plugin activated')`
- Debug logs for app list parsing: `console.log('[memberstack] listApps result:', ...)`
- Log first item to diagnose field names: `console.log('[memberstack] first app:', ...)`
- Prefixed with `[memberstack]` for module identification

**Example logging from `useMemberstack.ts`:**
```typescript
console.log('[memberstack] listApps result:', JSON.stringify(resp.result, null, 2));
console.log('[memberstack] content text:', item.text.slice(0, 500));
console.log('[memberstack] first app:', JSON.stringify(appArray[0]));
```

## Comments

**When to Comment:**
- Section headers with dashes for major logical blocks (e.g., `// --- Detection (runs once on mount) ---`)
- Inline explanations for non-obvious logic (e.g., `// Store context values in refs so callbacks don't get recreated on every render`)
- Clarifications for browser APIs and special behaviors (e.g., `// ESC to close` in Modal)
- Special cases like malformed JSON handling

**JSDoc/TSDoc:**
- Not extensively used; types and interfaces document themselves
- Type annotations provide inline documentation (e.g., `useCallback(async () => { ... }, [tools])`)

## Function Design

**Size:**
- Small functions for UI components (20-60 lines)
- Larger functions acceptable for complex async operations (up to 150+ lines in `useMemberstack`)
- Each function has a single responsibility within its scope

**Parameters:**
- Prefer destructured props for components: `{ ms }: { ms: UseMemberstackReturn }`
- Optional parameters use `?` in types: `size?: number`
- Configuration objects passed to callbacks via refs when needing stable identity: `shellRef.current`

**Return Values:**
- React components return JSX directly
- Custom hooks return object with both state and dispatch functions (e.g., `UseMemberstackReturn`)
- Async functions return `Promise<void>` or `Promise<T>` with explicit return type
- Utility functions return typed values (e.g., `string` from `statusTitle`)

## Module Design

**Exports:**
- Named exports for reusable components and hooks (e.g., `export function MemberstackToolbar()`)
- Default exports only in plugin entry point (`index.tsx`)
- Plugin API exports as named constants: `export const name = 'Memberstack'`
- Type exports via `export type` keyword

**Barrel Files:**
- Not used; context.ts acts as a re-export hub for plugin context hooks:
  ```typescript
  export function usePluginContext(): PluginContextValue { ... }
  export function useShell() { return usePluginContext().shell; }
  export function useToast() { return usePluginContext().actions.showToast; }
  ```

**Example from `src/index.tsx` (plugin loader contract):**
```typescript
export const name = 'Memberstack';
export const slots = { toolbar: MemberstackToolbar };
export function onActivate() { ... }
export function onDeactivate() { ... }
```

---

*Convention analysis: 2026-03-01*
