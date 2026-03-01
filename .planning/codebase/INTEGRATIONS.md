# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

**Memberstack MCP Server:**
- Memberstack Model Context Protocol server - Provides AI tool integration for Memberstack authentication and app management
  - SDK/Client: `mcp-remote` (npm package, invoked via `npx`)
  - Endpoint: `https://mcp.memberstack.com/mcp`
  - Protocol: JSON-RPC 2.0 over stdio
  - Auth: OAuth flow with local file storage

**Dashboard Integration:**
- Memberstack Dashboard - User-facing web dashboard
  - URL: `https://app.memberstack.com`
  - Integration: Launched via `openUrl` action in `src/ConnectedView.tsx` line 74

## AI Tool Integrations

**Claude Code:**
- AI development tool with MCP server support
  - Config location: `~/.claude.json`
  - MCP server configuration: `cfg.mcpServers.memberstack`
  - Command: `npx -y mcp-remote https://mcp.memberstack.com/mcp`
  - Implementation: `src/useMemberstack.ts` lines 151-169

**OpenAI Codex:**
- AI code generation tool with MCP server support
  - Config location: `~/.codex/config.toml`
  - MCP server configuration: `[mcp_servers.memberstack]` section
  - Command: `npx -y mcp-remote https://mcp.memberstack.com/mcp`
  - Implementation: `src/useMemberstack.ts` lines 171-189

## Authentication & Identity

**Auth Provider:**
- Custom MCP-based OAuth flow
  - Trigger: `authenticate()` function in `src/useMemberstack.ts` lines 222-266
  - Process:
    1. Spawns `mcp-remote` process with nohup
    2. Polls `~/.mcp-auth` directory for auth file creation
    3. Timeout: 120 seconds (line 240)
    4. Poll interval: 2 seconds (line 239)
  - Storage: Local auth files in `~/.mcp-auth/`
  - State tracked in `authenticated` boolean via `MemberstackState`

## Local Storage

**File-based Storage:**
- Ship Studio plugin storage API - Persistent plugin state
  - Method: `usePluginContext().storage.read()` and `.write()`
  - Data stored: `{ cachedApps: MemberstackApp[] }` (line 375 in `src/useMemberstack.ts`)
  - Purpose: Caching fetched apps list for offline fallback
  - Implementation: `src/useMemberstack.ts` lines 375-385

**Authentication Directory:**
- `~/.mcp-auth/` - Stores MCP authentication tokens/credentials
- `~/.claude.json` - Claude Code MCP server configuration
- `~/.codex/config.toml` - Codex MCP server configuration

## Data Types

**Memberstack App Object (`MemberstackApp`):**
```typescript
interface MemberstackApp {
  id: string;           // App ID
  name: string;         // App name
  role: string;         // User role (OWNER, ADMIN, MEMBER)
  createdAt: string;    // Creation timestamp
}
```
Defined in `src/types.ts` lines 10-15

**Tool Status Object:**
```typescript
interface ToolStatus {
  installed: boolean;   // Tool binary/CLI found
  configured: boolean;  // MCP server configured
}
```
Defined in `src/types.ts` lines 3-6

## Data Fetching

**App List Retrieval:**
- Method: `fetchApps()` in `src/useMemberstack.ts` lines 276-390
- Process:
  1. Spawns MCP client process via `npx mcp-remote`
  2. Sends JSON-RPC initialize request
  3. Calls `tools/call` with `listApps` method
  4. Parses tool response with flexible field mapping (lines 354-367)
  5. Supports multiple response formats: array, `data`, `apps` fields
- Response parsing: `src/useMemberstack.ts` lines 340-372
- Fallback: Returns cached apps on error (lines 380-385)
- Timeout: 25 seconds (line 333)

## Configuration Flow

**Tool Detection:**
- Runs once on plugin mount in `useEffect` (lines 58-141)
- Checks for Node.js availability (line 71)
- Detects Claude Code: reads `~/.claude.json` or checks `which claude` (lines 81-97)
- Detects Codex: reads `~/.codex/config.toml` or lists `~/.codex` (lines 100-111)
- Determines plugin status based on detection results

**MCP Server Connection:**
- Modifies tool config files to register MCP server
- Claude Code: Adds to `mcpServers` object in `~/.claude.json` (lines 152-167)
- Codex: Appends TOML section to `~/.codex/config.toml` (lines 172-189)
- Uses Node.js inline scripts executed via shell

**Logout & Disconnection:**
- `logout()`: Removes `~/.mcp-auth` directory (line 405)
- `disconnect()`: Removes MCP config from both tools and clears auth
  - Claude Code: Deletes `mcpServers.memberstack` entry (line 431)
  - Codex: Removes `[mcp_servers.memberstack]` section via regex (line 444)
  - Clears auth: `rm -rf ~/.mcp-auth` (line 452)

## Webhooks & Callbacks

**Incoming:**
- Plugin lifecycle: `onActivate()` and `onDeactivate()` in `src/index.tsx` lines 57-65

**Outgoing:**
- None - Plugin receives shell command results and state from Ship Studio

## Environment Configuration

**Required Resources:**
- Node.js in system PATH
- Bash/sh shell access
- Write access to home directory (`~/`)
- npm (for installing mcp-remote via npx)

**No env vars required** - All configuration is file-based or hardcoded

## Error Handling

**Common Errors:**
- "Node.js is required but not found" - Line 74
- MCP server response timeout - Line 246
- Authentication timeout - Line 246
- Malformed config files - Try/catch in detection (line 90)
- Tool config write failures - Caught and surfaced in UI

**User Feedback:**
- Toast notifications via `showToast(message, type)` for success/error
- Error state rendered in UI with error message display
- Loading states with spinner feedback during operations

---

*Integration audit: 2026-03-01*
