export type Tool = 'claude-code' | 'codex';

export interface ToolStatus {
  installed: boolean;
  configured: boolean;
}

export type PluginState = 'loading' | 'no-tools' | 'not-configured' | 'configured' | 'connected' | 'error';

export interface MemberstackApp {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface MemberstackState {
  status: PluginState;
  tools: Record<Tool, ToolStatus>;
  authenticated: boolean;
  apps: MemberstackApp[];
  error: string | null;
  loading: boolean;
}

export interface PluginContextValue {
  pluginId: string;
  project: {
    name: string;
    path: string;
    currentBranch: string;
    hasUncommittedChanges: boolean;
  } | null;
  actions: {
    showToast: (message: string, type?: 'success' | 'error') => void;
    refreshGitStatus: () => void;
    refreshBranches: () => void;
    focusTerminal: () => void;
    openUrl: (url: string) => void;
  };
  shell: {
    exec: (
      command: string,
      args: string[],
      options?: { timeout?: number }
    ) => Promise<{
      stdout: string;
      stderr: string;
      exit_code: number;
    }>;
  };
  storage: {
    read: () => Promise<Record<string, unknown>>;
    write: (data: Record<string, unknown>) => Promise<void>;
  };
  invoke: {
    call: <T = unknown>(
      command: string,
      args?: Record<string, unknown>
    ) => Promise<T>;
  };
  theme: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    accent: string;
    accentHover: string;
    action: string;
    actionHover: string;
    actionText: string;
    error: string;
    success: string;
  };
}
