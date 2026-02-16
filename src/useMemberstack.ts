import { useState, useEffect, useCallback, useRef } from 'react';
import { usePluginContext } from './context';
import type { Tool, ToolStatus, PluginState, MemberstackApp, MemberstackState } from './types';

const MCP_URL = 'https://mcp.memberstack.com/mcp';

const DEFAULT_TOOLS: Record<Tool, ToolStatus> = {
  'claude-code': { installed: false, configured: false },
  'codex': { installed: false, configured: false },
};

export interface UseMemberstackReturn extends MemberstackState {
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

export function useMemberstack(): UseMemberstackReturn {
  const ctx = usePluginContext();

  // Store context values in refs so callbacks don't get recreated on every render
  const shellRef = useRef(ctx.shell);
  const showToastRef = useRef(ctx.actions.showToast);
  const storageRef = useRef(ctx.storage);
  shellRef.current = ctx.shell;
  showToastRef.current = ctx.actions.showToast;
  storageRef.current = ctx.storage;

  const [status, setStatus] = useState<PluginState>('loading');
  const [tools, setTools] = useState<Record<Tool, ToolStatus>>(DEFAULT_TOOLS);
  const [authenticated, setAuthenticated] = useState(false);
  const [apps, setApps] = useState<MemberstackApp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingApps, setFetchingApps] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const authPidRef = useRef<string | null>(null);
  const authPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const fetchAttemptedRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // --- Detection (runs once on mount) ---

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      const shell = shellRef.current;
      setLoading(true);
      setError(null);
      const toolState: Record<Tool, ToolStatus> = {
        'claude-code': { installed: false, configured: false },
        'codex': { installed: false, configured: false },
      };

      try {
        const nodeCheck = await shell.exec('sh', ['-c', 'which node']);
        if (cancelled) return;
        if (nodeCheck.exit_code !== 0) {
          setError('Node.js is required but not found.');
          setStatus('error');
          setLoading(false);
          return;
        }

        // Detect Claude Code
        const claudeResult = await shell.exec('sh', ['-c', 'cat ~/.claude.json 2>/dev/null']);
        if (cancelled) return;
        if (claudeResult.exit_code === 0 && claudeResult.stdout.trim()) {
          toolState['claude-code'].installed = true;
          try {
            const cfg = JSON.parse(claudeResult.stdout);
            if (cfg.mcpServers?.memberstack) {
              toolState['claude-code'].configured = true;
            }
          } catch {
            // Malformed JSON
          }
        } else {
          const whichClaude = await shell.exec('sh', ['-c', 'which claude 2>/dev/null']);
          if (cancelled) return;
          if (whichClaude.exit_code === 0) toolState['claude-code'].installed = true;
        }

        // Detect Codex
        const codexResult = await shell.exec('sh', ['-c', 'cat ~/.codex/config.toml 2>/dev/null']);
        if (cancelled) return;
        if (codexResult.exit_code === 0 && codexResult.stdout.trim()) {
          toolState['codex'].installed = true;
          if (codexResult.stdout.includes('[mcp_servers.memberstack]')) {
            toolState['codex'].configured = true;
          }
        } else {
          const codexDir = await shell.exec('sh', ['-c', 'ls ~/.codex 2>/dev/null']);
          if (cancelled) return;
          if (codexDir.exit_code === 0) toolState['codex'].installed = true;
        }

        setTools(toolState);
        const anyInstalled = toolState['claude-code'].installed || toolState['codex'].installed;
        const anyConfigured = toolState['claude-code'].configured || toolState['codex'].configured;

        if (!anyInstalled) { setStatus('no-tools'); setLoading(false); return; }
        if (!anyConfigured) { setStatus('not-configured'); setLoading(false); return; }

        // Check auth
        const authResult = await shell.exec('sh', ['-c', 'find ~/.mcp-auth -name "*.json" 2>/dev/null | head -1']);
        if (cancelled) return;
        if (authResult.exit_code === 0 && authResult.stdout.trim()) {
          setAuthenticated(true);
          setStatus('connected');
        } else {
          setStatus('configured');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []); // Runs once — no deps

  // --- Connect (configure MCP in detected tools) ---

  const connect = useCallback(async () => {
    const shell = shellRef.current;
    setLoading(true);
    setError(null);

    try {
      if (tools['claude-code'].installed) {
        const script = `
const fs = require('fs');
const p = require('os').homedir() + '/.claude.json';
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
if (!cfg.mcpServers) cfg.mcpServers = {};
cfg.mcpServers.memberstack = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', 'mcp-remote', 'https://mcp.memberstack.com/mcp'],
  env: {}
};
fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
console.log('OK');
`.trim();
        const result = await shell.exec('node', ['-e', script]);
        if (result.exit_code !== 0) throw new Error(`Claude Code config failed: ${result.stderr}`);
      }

      if (tools['codex'].installed) {
        const script = `
const fs = require('fs');
const os = require('os');
const path = require('path');
const dir = path.join(os.homedir(), '.codex');
const p = path.join(dir, 'config.toml');
try { fs.mkdirSync(dir, { recursive: true }); } catch {}
let content = '';
try { content = fs.readFileSync(p, 'utf8'); } catch {}
if (!content.includes('[mcp_servers.memberstack]')) {
  const entry = '\\n[mcp_servers.memberstack]\\ncommand = "npx"\\nargs = ["-y", "mcp-remote", "https://mcp.memberstack.com/mcp"]\\n';
  fs.writeFileSync(p, content + entry);
}
console.log('OK');
`.trim();
        const result = await shell.exec('node', ['-e', script]);
        if (result.exit_code !== 0) throw new Error(`Codex config failed: ${result.stderr}`);
      }

      setTools(prev => {
        const next = { ...prev };
        if (next['claude-code'].installed) next['claude-code'] = { ...next['claude-code'], configured: true };
        if (next['codex'].installed) next['codex'] = { ...next['codex'], configured: true };
        return next;
      });
      setStatus('configured');
      showToastRef.current('MCP server configured!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToastRef.current(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [tools]);

  // --- Authenticate (OAuth via mcp-remote) ---

  const stopAuth = useCallback(() => {
    if (authPollRef.current) {
      clearInterval(authPollRef.current);
      authPollRef.current = null;
    }
    if (authPidRef.current) {
      shellRef.current.exec('sh', ['-c', `kill ${authPidRef.current} 2>/dev/null`]);
      authPidRef.current = null;
    }
    setAuthenticating(false);
  }, []);

  const authenticate = useCallback(async () => {
    const shell = shellRef.current;
    setAuthenticating(true);
    setError(null);
    cancelledRef.current = false;

    try {
      const spawnResult = await shell.exec('sh', [
        '-c',
        `nohup npx -y mcp-remote ${MCP_URL} > /tmp/mcp-memberstack-auth.log 2>&1 & echo $!`,
      ]);
      if (spawnResult.exit_code !== 0) throw new Error('Failed to start authentication.');

      const pid = spawnResult.stdout.trim();
      authPidRef.current = pid;

      let elapsed = 0;
      const pollInterval = 2000;
      const timeout = 120000;

      await new Promise<void>((resolve, reject) => {
        authPollRef.current = setInterval(async () => {
          if (cancelledRef.current) { stopAuth(); reject(new Error('Cancelled.')); return; }
          elapsed += pollInterval;
          if (elapsed >= timeout) { stopAuth(); reject(new Error('Authentication timed out.')); return; }
          try {
            const check = await shell.exec('sh', ['-c', 'find ~/.mcp-auth -name "*.json" 2>/dev/null | head -1']);
            if (check.exit_code === 0 && check.stdout.trim()) { stopAuth(); resolve(); }
          } catch { /* keep polling */ }
        }, pollInterval);
      });

      setAuthenticated(true);
      setStatus('connected');
      showToastRef.current('Authenticated with Memberstack!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!cancelledRef.current) {
        setError(msg);
        showToastRef.current(msg, 'error');
      }
    } finally {
      setAuthenticating(false);
    }
  }, [stopAuth]);

  const cancelAuth = useCallback(() => {
    cancelledRef.current = true;
    stopAuth();
  }, [stopAuth]);

  // --- Fetch Apps (via mcp-remote stdio) ---

  const fetchingRef = useRef(false);
  const fetchApps = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setFetchingApps(true);
    setError(null);

    try {
      const script = `
const { spawn } = require('child_process');
const child = spawn('npx', ['-y', 'mcp-remote', 'https://mcp.memberstack.com/mcp'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buf = '';
let gotInit = false;
let done = false;

const timer = setTimeout(() => {
  if (!done) { done = true; console.log(JSON.stringify({ error: 'timeout' })); child.kill(); process.exit(0); }
}, 20000);

function send(obj) { child.stdin.write(JSON.stringify(obj) + '\\n'); }

child.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  const lines = buf.split('\\n');
  buf = lines.pop() || '';
  for (const line of lines) {
    if (!line.trim()) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id === 1 && !gotInit) {
      gotInit = true;
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'listApps', arguments: {} } });
    }
    if (msg.id === 2 && !done) {
      done = true;
      clearTimeout(timer);
      console.log(JSON.stringify({ ok: true, result: msg.result }));
      child.kill();
      process.exit(0);
    }
  }
});

child.on('error', (e) => {
  if (!done) { done = true; clearTimeout(timer); console.log(JSON.stringify({ error: e.message })); process.exit(0); }
});
child.stderr.on('data', () => {});

send({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'memberstack-plugin', version: '1.0.0' } }
});
`.trim();

      const result = await shellRef.current.exec('node', ['-e', script], { timeout: 25000 });
      const output = (result.stdout || '').trim();

      if (!output) {
        throw new Error(result.stderr ? result.stderr.slice(0, 200) : 'No response from MCP server.');
      }

      const resp = JSON.parse(output);
      if (resp.error) throw new Error(resp.error);

      // Log the full response so we can debug field names
      console.log('[memberstack] listApps result:', JSON.stringify(resp.result, null, 2));

      let parsedApps: MemberstackApp[] = [];
      const content = resp.result?.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'text' && item.text) {
            console.log('[memberstack] content text:', item.text.slice(0, 500));
            try {
              const parsed = JSON.parse(item.text);
              const appArray = Array.isArray(parsed) ? parsed
                : Array.isArray(parsed.data) ? parsed.data
                : Array.isArray(parsed.apps) ? parsed.apps
                : null;
              if (appArray && appArray.length > 0) {
                // Log first app to see all field names
                console.log('[memberstack] first app keys:', Object.keys(appArray[0]));
                console.log('[memberstack] first app:', JSON.stringify(appArray[0]));
                parsedApps = appArray.map((a: Record<string, unknown>) => ({
                  id: String(a.id || a.appId || a.app_id || ''),
                  name: String(a.name || a.appName || a.app_name || a.id || 'Unnamed'),
                  role: String(a.role || a.accessLevel || a.access_level || 'MEMBER'),
                  createdAt: String(a.createdAt || a.created_at || a.createdDate || ''),
                }));
              }
            } catch { /* not JSON */ }
          }
        }
      }

      setApps(parsedApps);
      try { await storageRef.current.write({ cachedApps: parsedApps }); } catch {}
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      try {
        const cached = await storageRef.current.read();
        if (cached.cachedApps && Array.isArray(cached.cachedApps)) {
          setApps(cached.cachedApps as MemberstackApp[]);
          return;
        }
      } catch {}
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) setFetchingApps(false);
    }
  }, []);

  // Auto-fetch apps once when entering connected state
  useEffect(() => {
    if (status === 'connected' && !fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      fetchApps();
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Logout ---

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await shellRef.current.exec('sh', ['-c', 'rm -rf ~/.mcp-auth']);
      setAuthenticated(false);
      setApps([]);
      fetchAttemptedRef.current = false;
      setStatus('configured');
      showToastRef.current('Logged out of Memberstack.', 'success');
    } catch {
      showToastRef.current('Failed to log out.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Disconnect ---

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (tools['claude-code'].configured) {
        const script = `
const fs = require('fs');
const p = require('os').homedir() + '/.claude.json';
try {
  const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (cfg.mcpServers?.memberstack) { delete cfg.mcpServers.memberstack; fs.writeFileSync(p, JSON.stringify(cfg, null, 2)); }
  console.log('OK');
} catch(e) { console.log('OK'); }
`.trim();
        await shellRef.current.exec('node', ['-e', script]);
      }

      if (tools['codex'].configured) {
        const script = `
const fs = require('fs');
const p = require('os').homedir() + '/.codex/config.toml';
try {
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/\\n?\\[mcp_servers\\.memberstack\\][\\s\\S]*?(?=\\n\\[|$)/g, '');
  fs.writeFileSync(p, content.trim() + '\\n');
  console.log('OK');
} catch(e) { console.log('OK'); }
`.trim();
        await shellRef.current.exec('node', ['-e', script]);
      }

      await shellRef.current.exec('sh', ['-c', 'rm -rf ~/.mcp-auth']);

      setTools(prev => {
        const next = { ...prev };
        if (next['claude-code'].configured) next['claude-code'] = { ...next['claude-code'], configured: false };
        if (next['codex'].configured) next['codex'] = { ...next['codex'], configured: false };
        return next;
      });
      setAuthenticated(false);
      setApps([]);
      fetchAttemptedRef.current = false;
      setStatus('not-configured');
      showToastRef.current('Memberstack disconnected.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToastRef.current(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [tools]);

  // --- Refresh ---

  const refresh = useCallback(async () => {
    fetchAttemptedRef.current = false;
    setApps([]);
    setFetchingApps(false);
    // Re-run detection by forcing status change
    setStatus('loading');
    setLoading(true);
    setError(null);

    const shell = shellRef.current;
    const toolState: Record<Tool, ToolStatus> = {
      'claude-code': { installed: false, configured: false },
      'codex': { installed: false, configured: false },
    };

    try {
      const claudeResult = await shell.exec('sh', ['-c', 'cat ~/.claude.json 2>/dev/null']);
      if (claudeResult.exit_code === 0 && claudeResult.stdout.trim()) {
        toolState['claude-code'].installed = true;
        try {
          const cfg = JSON.parse(claudeResult.stdout);
          if (cfg.mcpServers?.memberstack) toolState['claude-code'].configured = true;
        } catch {}
      } else {
        const w = await shell.exec('sh', ['-c', 'which claude 2>/dev/null']);
        if (w.exit_code === 0) toolState['claude-code'].installed = true;
      }

      const codexResult = await shell.exec('sh', ['-c', 'cat ~/.codex/config.toml 2>/dev/null']);
      if (codexResult.exit_code === 0 && codexResult.stdout.trim()) {
        toolState['codex'].installed = true;
        if (codexResult.stdout.includes('[mcp_servers.memberstack]')) toolState['codex'].configured = true;
      } else {
        const d = await shell.exec('sh', ['-c', 'ls ~/.codex 2>/dev/null']);
        if (d.exit_code === 0) toolState['codex'].installed = true;
      }

      setTools(toolState);
      const anyInstalled = toolState['claude-code'].installed || toolState['codex'].installed;
      const anyConfigured = toolState['claude-code'].configured || toolState['codex'].configured;

      if (!anyInstalled) { setStatus('no-tools'); return; }
      if (!anyConfigured) { setStatus('not-configured'); return; }

      const authResult = await shell.exec('sh', ['-c', 'find ~/.mcp-auth -name "*.json" 2>/dev/null | head -1']);
      if (authResult.exit_code === 0 && authResult.stdout.trim()) {
        setAuthenticated(true);
        setStatus('connected');
      } else {
        setStatus('configured');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cleanup auth polling on unmount
  useEffect(() => {
    return () => { stopAuth(); };
  }, [stopAuth]);

  return {
    status,
    tools,
    authenticated,
    apps,
    error,
    loading,
    fetchingApps,
    authenticating,
    connect,
    authenticate,
    cancelAuth,
    fetchApps,
    logout,
    disconnect,
    refresh,
  };
}
