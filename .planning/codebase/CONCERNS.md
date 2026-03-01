# Codebase Concerns

**Analysis Date:** 2026-03-01

## Tech Debt

**Inline JavaScript String Execution:**
- Issue: `useMemberstack.ts` embeds large JavaScript scripts as string literals that are executed via `shell.exec('node', ['-e', script])`. This pattern appears in the `connect()` function (lines 152-166), `fetchApps()` function (lines 283-331), and `disconnect()` function (lines 426-449). Scripts contain manual JSON parsing and file I/O logic that would benefit from being externalized.
- Files: `src/useMemberstack.ts`
- Impact: Makes code harder to test, debug, and maintain. Script errors only surface at runtime. String-based code is not syntax-checked or type-safe.
- Fix approach: Extract shell scripts into separate files or create dedicated Node.js helper modules. Simplify command execution with proper error propagation.

**Hardcoded Shell Command Patterns:**
- Issue: Multiple shell.exec calls with similar patterns throughout `useMemberstack.ts`. Examples: reading config files with `cat`, writing with `fs.writeFileSync`, executing node with `-e` flag for inline scripts (lines 71, 81, 94, 100, 108, 121, 152-187, 283-331, 426-449, 452, 492-520).
- Files: `src/useMemberstack.ts`
- Impact: Brittle to environment changes (e.g., different shells, missing tools). No error context or logging for debugging shell failures.
- Fix approach: Create wrapper functions around shell execution that handle common patterns (file read/write, config detection, process spawning). Add comprehensive error messages with context.

**Duplicate Detection Logic:**
- Issue: Tool detection logic is repeated in three places: initial `useEffect` detection (lines 70-136), `refresh()` method (lines 491-533), and partially in inline reconnection checks. The same shell commands and parsing logic appear verbatim.
- Files: `src/useMemberstack.ts`
- Impact: Maintenance burden. Bug fixes in one place need to be replicated. Changes to detection strategy require updating multiple locations.
- Fix approach: Extract detection into a separate `detectTools()` function that returns state object. Call from both initial mount and refresh.

**Polling-Based Authentication with No Backoff:**
- Issue: `authenticate()` function (lines 222-266) spawns an MCP process and polls `~/.mcp-auth` every 2 seconds (line 239) for up to 120 seconds (line 240). No exponential backoff, no jitter, and no graceful shutdown of the spawned process on timeout.
- Files: `src/useMemberstack.ts` (lines 238-251)
- Impact: Creates unnecessary load on filesystem checks. Process may not fully terminate on timeout. Hard timeout at 120s may be too aggressive if network is slow.
- Fix approach: Implement exponential backoff starting at 2s, add process cleanup with `kill -9` fallback, make timeout configurable.

**Unchecked JSON Parsing in App Fetching:**
- Issue: `fetchApps()` (lines 340-369) parses JSON responses without comprehensive error handling. Falls back to checking multiple field names (`a.id || a.appId || a.app_id`) which masks API schema inconsistencies. Silent catch blocks at lines 369 and 385 hide parsing errors.
- Files: `src/useMemberstack.ts`
- Impact: Silent failures when API returns unexpected format. Users see "No apps found" with no indication of parsing errors. Makes debugging API issues difficult.
- Fix approach: Add detailed logging of parsing failures (log actual response structure). Validate response schema against expected types. Return parsed failures as error messages to user.

## Known Bugs

**Missing Process Cleanup on Component Unmount:**
- Symptoms: When component unmounts, the spawned mcp-remote process may continue running (line 231). If user navigates away during authentication, process persists in background.
- Files: `src/useMemberstack.ts` (lines 222-266, 535-538)
- Trigger: Start authentication, then close modal or unmount component before completing login
- Workaround: Manually kill the process with `killall mcp-remote` or wait for timeout
- Fix approach: Store process PID and ensure cleanup in unmount effect. Use `cleanup` pattern with `killall npx` or equivalent.

**Shell Timeout Not Enforced Consistently:**
- Symptoms: `fetchApps()` passes timeout to shell.exec (line 333: `{ timeout: 25000 }`), but other shell commands don't specify timeout (e.g., lines 167, 187, 216, 405, 435, 449, 452, 492, 504, 509, 520). Unresponsive shell commands can hang indefinitely.
- Files: `src/useMemberstack.ts`
- Trigger: If node installation is corrupted or shell hangs, plugin UI becomes unresponsive
- Workaround: Kill terminal/app process
- Fix approach: Add timeout to all shell.exec calls. Consider implementing circuit breaker pattern.

**Ref Updates During Render:**
- Symptoms: Lines 31-33 in `useMemberstack.ts` update refs (`shellRef.current`, `showToastRef.current`, `storageRef.current`) synchronously in the component body. While this works, it violates React's rendering model and can cause issues with concurrent rendering.
- Files: `src/useMemberstack.ts` (lines 28-33)
- Trigger: May cause issues in future React versions with concurrent features
- Workaround: None currently, but not immediately broken
- Fix approach: Move ref updates to useEffect with dependency on context changes.

## Security Considerations

**File System Access for Auth Credentials:**
- Risk: Authentication tokens stored in `~/.mcp-auth/` directory. If this directory has loose permissions, other user processes could read tokens. Plugin has no control over file permissions set by MCP server.
- Files: `src/useMemberstack.ts` (lines 121, 248, 405, 452)
- Current mitigation: Relies on MCP server to set secure permissions. No validation of directory permissions in plugin.
- Recommendations: (1) Document that users should verify `~/.mcp-auth/` has 700 permissions. (2) Add warning if directory is world-readable. (3) Consider whether tokens should be read from secure storage instead.

**Eval-like Pattern with `node -e`:**
- Risk: Embedding shell scripts as strings and executing them with `node -e` is similar to eval(). If input is ever unsanitized, code injection is possible.
- Files: `src/useMemberstack.ts` (multiple locations)
- Current mitigation: Current scripts are hardcoded. No user input is interpolated.
- Recommendations: (1) Maintain strict policy that shell scripts are never built from user input. (2) Use proper Node.js APIs (fs module, require) instead of inline execution. (3) Add code review checklist for any script changes.

**Config File Overwrite Without Backup:**
- Risk: `connect()` function (lines 152-189) directly modifies `~/.claude.json` and `~/.codex/config.toml` without backing up original files. If operation fails mid-way, user's config could be corrupted.
- Files: `src/useMemberstack.ts` (lines 152-189)
- Current mitigation: Try/catch blocks catch errors but don't restore original.
- Recommendations: (1) Read file → validate → write to temp location → rename (atomic operation). (2) Create backup at `~/.claude.json.backup.memberstack`. (3) Warn user before modifying files.

**No Validation of MCP Server Response:**
- Risk: `fetchApps()` (lines 340-369) parses and displays data from untrusted MCP server without validation. If server is compromised, could inject malicious data into UI.
- Files: `src/useMemberstack.ts`
- Current mitigation: Data is displayed as text only (no HTML injection). But app list comes from external source.
- Recommendations: (1) Validate app object schema before display. (2) Escape/sanitize all string fields. (3) Consider signing responses from server.

## Performance Bottlenecks

**Synchronous Shell Command During Initial Detection:**
- Problem: Detection phase (lines 71-136) makes sequential shell.exec calls to check for tools and auth state. Each call blocks until completion before next call starts (no Promise.all).
- Files: `src/useMemberstack.ts` (lines 70-136)
- Cause: Sequential await calls for claudeResult, codexResult, authResult
- Improvement path: Execute detection checks in parallel using Promise.all() where possible. Estimate: ~2-3 seconds blocked time could be reduced to ~1 second.

**Polling for Auth Completion with 2s Interval:**
- Problem: `authenticate()` polls filesystem every 2 seconds (line 239) for up to 120 seconds. This creates 60 filesystem reads. Each `find` command scans directory.
- Files: `src/useMemberstack.ts` (lines 242-251)
- Cause: No event-based mechanism to detect when auth completes. No exponential backoff.
- Improvement path: First check quickly (every 500ms for first 5 attempts), then slow down. Use file watch API if available in Ship Studio context. Consider webhook from MCP server.

**Full App List Re-fetched on Every Refresh:**
- Problem: `fetchApps()` spawns full MCP process and re-fetches all apps. No caching between calls. If user clicks "Refresh" multiple times, incurs overhead each time.
- Files: `src/useMemberstack.ts` (lines 276-390)
- Cause: No cache invalidation logic. Storage is used as fallback only.
- Improvement path: Cache results with timestamp. Only re-fetch if cache older than (e.g.) 30 seconds or user explicitly requests. Use `fetchingRef` to prevent concurrent fetches (already implemented).

**Detection Runs on Every Mount:**
- Problem: Detection effect runs once on mount (line 58-141), but not on plugin re-activation. If user toggles plugin on/off, re-activation doesn't detect state changes (e.g., new tool installed).
- Files: `src/useMemberstack.ts` (lines 58-141)
- Cause: Empty dependency array means effect runs once
- Improvement path: Consider whether detection should re-run on certain events (plugin focus, navigation). If so, add listeners or add context signals to dependency array.

## Fragile Areas

**MCP Server Availability Assumption:**
- Files: `src/useMemberstack.ts` (lines 283-390)
- Why fragile: `fetchApps()` assumes `npx mcp-remote https://mcp.memberstack.com/mcp` will succeed. If Memberstack server is down, network is unavailable, or mcp-remote package fails, entire apps list fetch fails silently with vague error.
- Safe modification: Always wrap fetch in try/catch. Add logging before making server call. Test with server offline. Consider timeout as graceful degradation.
- Test coverage: No tests exist. Manual testing needed for network failures.

**Tool Detection Regex Assumptions:**
- Files: `src/useMemberstack.ts` (lines 87-96, 104-111, 492-511)
- Why fragile: Detects tools by checking for `~/.claude.json` and `[mcp_servers.memberstack]` in TOML. If tools change their config format or locations, detection breaks silently.
- Safe modification: Change detection logic, then test against actual installed tools. Add logging to show what configs were found. Consider version-specific detection.
- Test coverage: No tests. Detection tested only manually on development machine.

**Hard-Coded MCP URLs and Paths:**
- Files: `src/useMemberstack.ts` (line 5: `MCP_URL = 'https://mcp.memberstack.com/mcp'`, lines 154, 161, 182, 285)
- Why fragile: Hard-coded URLs and home directory paths. If Memberstack changes API endpoint or if home directory path is atypical, plugin breaks.
- Safe modification: Move to plugin.json or environment config. Use proper path resolution instead of hardcoding `~`. Document assumptions about directory structure.
- Test coverage: No tests for URL routing or path handling.

**Node.js Script String Manipulation:**
- Files: `src/useMemberstack.ts` (lines 152-189, 283-331, 426-449)
- Why fragile: Large multi-line JavaScript strings are error-prone. Indentation, escaping, and formatting must be perfect. Small typos break execution.
- Safe modification: Consider using template literals or external script files. Add syntax validation before execution.
- Test coverage: No unit tests. Requires end-to-end testing with actual shell execution.

## Scaling Limits

**Linear Shell Spawning for Each Operation:**
- Current capacity: Plugin spawns new `node` process for each config modification (connect, disconnect) and for each app fetch. Works fine for single user.
- Limit: If scaled to handle multiple plugin instances or frequent operations, could exhaust system resources or process limits.
- Scaling path: Consider caching connection state in memory. Batch operations where possible. Use single long-lived process for MCP communication instead of spawning for each fetch.

**File System Polling for Auth:**
- Current capacity: Single polling loop with 2s interval handles one concurrent auth flow.
- Limit: If multiple users/plugins authenticate simultaneously, each creates polling interval, consuming resources.
- Scaling path: Implement event-based signaling or use MCP server to push notifications instead of polling.

## Dependencies at Risk

**Hard Dependency on Ship Studio Context API:**
- Risk: Plugin assumes `window.__SHIPSTUDIO_REACT__`, `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__`, etc. are available (context.ts lines 7-8). If Ship Studio changes these globals, plugin breaks at runtime.
- Impact: No fallback. Error only surfaces when user opens plugin.
- Migration plan: Document contract with Ship Studio. Add version compatibility check. Consider feature detection instead of hard requirements.

**Hard Dependency on MCP Server at Fixed URL:**
- Risk: Plugin requires `npx mcp-remote` to be available and contact `https://mcp.memberstack.com/mcp`. If npm packages change or Memberstack service is unavailable, plugin fails.
- Impact: Users cannot authenticate or fetch apps.
- Migration plan: Make MCP URL configurable. Add fallback service. Consider offline mode with cached data.

**Minimal Test Coverage:**
- Risk: No test files exist in repository. Code changes have no automated safety net.
- Impact: Bug regressions go undetected. Refactoring is unsafe.
- Migration plan: Add test framework (vitest with jsdom). Write unit tests for critical paths (detection, auth polling, app parsing). Add integration tests for shell operations.

## Missing Critical Features

**No Error Recovery or Retry Logic:**
- Problem: When shell commands fail, user sees generic error message with no suggestion for recovery. No automatic retry for transient failures (network, temporary process issue).
- Blocks: User cannot recover from temporary network glitches. Each error requires manual troubleshooting.
- Priority: Medium. Affects user experience but not core functionality.

**No Plugin Logging or Diagnostics:**
- Problem: Only basic console.log at activation/deactivation. No structured logs for debugging issues. Users must inspect console to understand what went wrong.
- Blocks: Difficult to diagnose issues in production. Support team cannot collect logs from users.
- Priority: High. Essential for production support.

**No Documentation of Config Requirements:**
- Problem: Plugin modifies `~/.claude.json` and `~/.codex/config.toml` without explaining what values are set or why. No inline documentation in code.
- Blocks: Users cannot manually configure MCP if plugin fails. Cannot understand what plugin did to their system.
- Priority: Medium. Not blocking functionality but affects user trust.

**No Config Validation or Dry-Run:**
- Problem: `connect()` modifies files immediately without showing user what changes will be made or allowing them to preview/approve.
- Blocks: Users cannot validate before commit. No way to test MCP setup without modifying actual config.
- Priority: Low. Most users don't need this but would improve safety.

## Test Coverage Gaps

**No Unit Tests for Shell Command Execution:**
- What's not tested: `shell.exec()` wrapper and error handling. Script string formatting and execution.
- Files: `src/useMemberstack.ts` (all shell.exec calls)
- Risk: Silent failures in shell commands. Incorrect error messages propagated to UI.
- Priority: High - core functionality.

**No Integration Tests for Tool Detection:**
- What's not tested: Detection logic against actual `~/.claude.json` and `~/.codex/config.toml` files.
- Files: `src/useMemberstack.ts` (detection effect, lines 70-136)
- Risk: Detection breaks when tool configs change format. Works only on developer's machine.
- Priority: High - fundamental feature.

**No Tests for App Parsing and Field Mapping:**
- What's not tested: App parsing logic handles various API response formats (`a.id || a.appId || a.app_id`).
- Files: `src/useMemberstack.ts` (lines 346-371)
- Risk: Silent failures when API changes. Users see "No apps" with no context.
- Priority: High - user-visible impact.

**No Tests for Auth Flow and Timeout:**
- What's not tested: Polling loop, timeout handling, process cleanup on cancel.
- Files: `src/useMemberstack.ts` (lines 222-266)
- Risk: Processes left hanging. Timeouts not working as expected.
- Priority: Medium - significant but less common.

**No Component Integration Tests:**
- What's not tested: UI flow between states (not-configured → configured → connected). Modal/form interactions.
- Files: `src/index.tsx`, `src/ConnectView.tsx`, `src/ConnectedView.tsx`
- Risk: UI state transitions break silently. User flow broken.
- Priority: Medium - important for user experience.

---

*Concerns audit: 2026-03-01*
