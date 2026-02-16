import { useTheme } from './context';
import type { UseMemberstackReturn } from './useMemberstack';

function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function ConnectView({ ms }: { ms: UseMemberstackReturn }) {
  const theme = useTheme();

  // No tools detected
  if (ms.status === 'no-tools') {
    return (
      <div>
        <div
          className="ms-plugin-info-box"
          style={{
            background: `${theme.error}15`,
            border: `1px solid ${theme.error}30`,
          }}
        >
          No supported AI tools detected on this machine.
        </div>
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
          Memberstack MCP requires one of the following:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: theme.bgTertiary,
              fontSize: 12,
            }}
          >
            <strong>Claude Code</strong>
            <div style={{ opacity: 0.5, marginTop: 2 }}>
              npm install -g @anthropic-ai/claude-code
            </div>
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: theme.bgTertiary,
              fontSize: 12,
            }}
          >
            <strong>OpenAI Codex</strong>
            <div style={{ opacity: 0.5, marginTop: 2 }}>
              npm install -g @openai/codex
            </div>
          </div>
        </div>
        <button
          className="ms-plugin-btn ms-plugin-btn--secondary"
          style={{ borderColor: theme.border }}
          onClick={ms.refresh}
          disabled={ms.loading}
        >
          {ms.loading ? <><span className="ms-plugin-spinner" /> Checking...</> : 'Re-check'}
        </button>
      </div>
    );
  }

  // Tools found but not configured
  if (ms.status === 'not-configured') {
    return (
      <div>
        <div className="ms-plugin-tool-badges">
          <div
            className="ms-plugin-tool-badge"
            style={{
              background: ms.tools['claude-code'].installed
                ? `${theme.success}15`
                : `${theme.textMuted}10`,
              color: ms.tools['claude-code'].installed ? theme.success : theme.textMuted,
            }}
          >
            {ms.tools['claude-code'].installed ? <CheckIcon /> : <XIcon />}
            Claude Code
          </div>
          <div
            className="ms-plugin-tool-badge"
            style={{
              background: ms.tools['codex'].installed
                ? `${theme.success}15`
                : `${theme.textMuted}10`,
              color: ms.tools['codex'].installed ? theme.success : theme.textMuted,
            }}
          >
            {ms.tools['codex'].installed ? <CheckIcon /> : <XIcon />}
            Codex
          </div>
        </div>

        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>
          Add the Memberstack MCP server to your AI tool{ms.tools['claude-code'].installed && ms.tools['codex'].installed ? 's' : ''} to get started.
        </p>

        {ms.error && <div className="ms-plugin-error-box">{ms.error}</div>}

        <button
          className="ms-plugin-btn ms-plugin-btn--primary"
          onClick={ms.connect}
          disabled={ms.loading}
        >
          {ms.loading ? (
            <><span className="ms-plugin-spinner" /> Configuring...</>
          ) : (
            'Connect Memberstack'
          )}
        </button>
      </div>
    );
  }

  // Configured but not authenticated
  if (ms.status === 'configured') {
    if (ms.authenticating) {
      return (
        <div className="ms-plugin-auth-waiting">
          <span className="ms-plugin-spinner" style={{ color: '#6C5CE7' }} />
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              Waiting for authentication...
            </div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>
              A browser window should open. Complete the login there.
            </div>
          </div>
          <button
            className="ms-plugin-btn ms-plugin-btn--secondary ms-plugin-btn--small"
            style={{ borderColor: theme.border, width: 'auto' }}
            onClick={ms.cancelAuth}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div>
        <div
          className="ms-plugin-info-box"
          style={{
            background: `${theme.success}10`,
            border: `1px solid ${theme.success}25`,
          }}
        >
          MCP server configured! Authenticate to connect your Memberstack account.
        </div>

        {ms.error && <div className="ms-plugin-error-box">{ms.error}</div>}

        <button
          className="ms-plugin-btn ms-plugin-btn--primary"
          onClick={ms.authenticate}
          disabled={ms.loading}
        >
          {ms.loading ? (
            <><span className="ms-plugin-spinner" /> Please wait...</>
          ) : (
            'Authenticate with Memberstack'
          )}
        </button>
      </div>
    );
  }

  // Error state
  if (ms.status === 'error') {
    return (
      <div>
        {ms.error && <div className="ms-plugin-error-box">{ms.error}</div>}
        <button
          className="ms-plugin-btn ms-plugin-btn--secondary"
          style={{ borderColor: theme.border }}
          onClick={ms.refresh}
          disabled={ms.loading}
        >
          {ms.loading ? <><span className="ms-plugin-spinner" /> Retrying...</> : 'Retry'}
        </button>
      </div>
    );
  }

  return null;
}
