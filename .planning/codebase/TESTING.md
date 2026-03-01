# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Status:** Not configured

**Notes:**
- No test runner configured (Jest, Vitest, etc. not in devDependencies)
- No test files present in codebase (no `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`)
- No test commands in `package.json` scripts
- TypeScript strict mode enabled for type safety as primary verification method

**Build verification approach:**
```bash
npm run build   # Compiles TypeScript and bundles for distribution
npm run dev     # Watch mode for development builds
```

## Type Safety as Testing Strategy

Given the absence of unit/integration testing infrastructure, this codebase relies on TypeScript's strict mode for verification:

**tsconfig.json settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "jsx": "react-jsx",
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

## Testable Code Patterns

While tests aren't written, the code is structured to be testable:

**Custom Hook Isolation (`src/useMemberstack.ts`):**
- Separates state management from UI rendering
- Pure functions like `statusDotClass()` and `statusTitle()` are easily testable:
  ```typescript
  function statusDotClass(status: PluginState): string {
    switch (status) {
      case 'loading': return 'ms-plugin-status-dot ms-plugin-status-dot--loading';
      case 'connected': return 'ms-plugin-status-dot ms-plugin-status-dot--success';
      // ...
    }
  }
  ```

**Dependency Injection via Context:**
- Plugin actions, shell execution, and storage are injected via React context
- Allows easy mocking by providing test implementations of `PluginContextValue`

**Async Operation Patterns:**
- Clear cancellation tokens (`cancelledRef`, `cancelledRef.current`)
- Mounted state tracking (`mountedRef`) prevents state updates on unmounted components
- Enables testing of race conditions and cleanup

**State Management Structure:**
```typescript
interface UseMemberstackReturn extends MemberstackState {
  connect: () => Promise<void>;
  authenticate: () => Promise<void>;
  cancelAuth: () => void;
  fetchApps: () => Promise<void>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  authenticating: boolean;
  fetchingApps: boolean;
}
```

All state and actions are returned from the hook, making them mockable.

## Error Handling Testability

Error cases are explicitly handled and could be tested:

**Example error handling pattern in `useMemberstack.ts`:**
```typescript
try {
  const nodeCheck = await shell.exec('sh', ['-c', 'which node']);
  if (nodeCheck.exit_code !== 0) {
    setError('Node.js is required but not found.');
    setStatus('error');
    setLoading(false);
    return;
  }
  // ... continue
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  setError(msg);
  setStatus('error');
}
```

Testable scenarios:
- Command execution failures (exit code !== 0)
- JSON parsing errors (silent catch)
- Timeout scenarios (120000ms limit in authentication)
- Component unmounting during async operations

## Manual Testing Approach

Current testing is manual via the Ship Studio plugin interface:

**Plugin Lifecycle Testing:**
- `onActivate()` - Logs activation message
- `onDeactivate()` - Removes injected styles and logs deactivation

**State Flow Testing:**
- Plugin detects if Claude Code or Codex is installed
- Plugin detects if MCP server is configured
- Plugin detects authentication status
- State transitions render appropriate UI views (ConnectView, ConnectedView)

**Integration Points to Verify:**
- Shell execution: `shell.exec()` returns correct stdout/stderr
- Storage persistence: `storage.read()` and `storage.write()`
- Toast notifications: `showToast()` displays user feedback
- Theme application: `theme` values apply to modal and components
- URL opening: `openUrl()` external links work

## Test File Organization (if implemented)

**Recommended structure:**
```
src/
├── __tests__/
│   ├── hooks/
│   │   └── useMemberstack.test.ts
│   ├── components/
│   │   ├── ConnectView.test.tsx
│   │   ├── ConnectedView.test.tsx
│   │   ├── Modal.test.tsx
│   │   └── ToolbarButton.test.tsx
│   └── utils/
│       └── statusDisplay.test.ts
```

Or co-located pattern:
```
src/
├── useMemberstack.test.ts
├── ConnectView.test.tsx
└── context.test.ts
```

## Mocking Patterns (if tests were implemented)

**Mock Plugin Context:**
```typescript
const mockContext: PluginContextValue = {
  pluginId: 'memberstack-test',
  shell: {
    exec: jest.fn().mockResolvedValue({
      stdout: '',
      stderr: '',
      exit_code: 0,
    }),
  },
  storage: {
    read: jest.fn().mockResolvedValue({}),
    write: jest.fn().mockResolvedValue(undefined),
  },
  actions: {
    showToast: jest.fn(),
    openUrl: jest.fn(),
    refreshGitStatus: jest.fn(),
    refreshBranches: jest.fn(),
    focusTerminal: jest.fn(),
  },
  theme: {
    bgPrimary: '#1a1a2e',
    bgSecondary: '#16213e',
    bgTertiary: '#0f3460',
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
    textMuted: '#888888',
    border: '#333333',
    accent: '#6C5CE7',
    accentHover: '#7d6ce7',
    action: '#3b82f6',
    actionHover: '#2563eb',
    actionText: '#ffffff',
    error: '#ef4444',
    success: '#22c55e',
  },
};
```

## React-Specific Testing Patterns

Components use React hooks that would require a testing library:

**Testing library approach (if implemented):**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MemberstackToolbar } from './index';

// Would need context provider wrapper
const wrapper = ({ children }) => (
  <PluginContextProvider value={mockContext}>
    {children}
  </PluginContextProvider>
);

test('displays toolbar button', () => {
  render(<ToolbarButton status="connected" onClick={jest.fn()} />, { wrapper });
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

## Coverage Gaps (if testing were implemented)

**Areas with complex logic to test:**
- `useMemberstack.ts` - 558 lines with multiple async flows (detection, connection, authentication, app fetching, logout, disconnect, refresh)
- Shell script generation and execution (Node.js script templates in connect/disconnect)
- JSON response parsing with fallbacks (app list fetching handles multiple field names)
- Authentication polling mechanism (2-second interval, 120-second timeout)
- State cleanup on component unmount during pending async operations

---

*Testing analysis: 2026-03-01*

**Note:** This project is a plugin for Ship Studio with no current test infrastructure. Testing should be added to cover the complex async state management in `useMemberstack.ts` and the conditional rendering logic in component views.
