import { useState } from 'react';
import { useTheme, useAppActions } from './context';
import type { UseMemberstackReturn } from './useMemberstack';

function roleBadgeColor(role: string): { bg: string; color: string } {
  const r = role.toUpperCase();
  if (r === 'OWNER') return { bg: 'rgba(108, 92, 231, 0.15)', color: '#6C5CE7' };
  if (r === 'ADMIN') return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
  return { bg: 'rgba(255, 255, 255, 0.06)', color: 'inherit' };
}

export function ConnectedView({ ms }: { ms: UseMemberstackReturn }) {
  const theme = useTheme();
  const actions = useAppActions();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div>
      {ms.error && <div className="ms-plugin-error-box">{ms.error}</div>}

      {/* Apps section */}
      <div className="ms-plugin-apps-header">
        <span className="ms-plugin-apps-title">Your Apps</span>
        <button
          className="ms-plugin-btn ms-plugin-btn--secondary ms-plugin-btn--small"
          style={{ borderColor: theme.border }}
          onClick={ms.fetchApps}
          disabled={ms.fetchingApps}
        >
          {ms.fetchingApps ? <span className="ms-plugin-spinner" /> : 'Refresh'}
        </button>
      </div>

      <div className="ms-plugin-app-list">
        {ms.fetchingApps && ms.apps.length === 0 ? (
          <>
            <div className="ms-plugin-skeleton" />
            <div className="ms-plugin-skeleton" />
            <div className="ms-plugin-skeleton" />
          </>
        ) : ms.apps.length === 0 ? (
          <div className="ms-plugin-empty">No apps found</div>
        ) : (
          ms.apps.map((app) => {
            const badge = roleBadgeColor(app.role);
            return (
              <div
                key={app.id}
                className="ms-plugin-app-item"
                style={{ background: theme.bgTertiary }}
              >
                <div>
                  <div className="ms-plugin-app-name">{app.name}</div>
                  <div className="ms-plugin-app-id">{app.id}</div>
                </div>
                <div className="ms-plugin-app-meta">
                  <span
                    className="ms-plugin-role-badge"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {app.role}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions */}
      <div className="ms-plugin-actions" style={{ borderTop: `1px solid ${theme.border}` }}>
        <button
          className="ms-plugin-btn ms-plugin-btn--primary"
          onClick={() => actions.openUrl('https://app.memberstack.com')}
        >
          Open Dashboard
        </button>

        <div className="ms-plugin-actions-row">
          {!confirmLogout ? (
            <button
              className="ms-plugin-btn ms-plugin-btn--secondary"
              style={{ borderColor: theme.border }}
              onClick={() => setConfirmLogout(true)}
              disabled={ms.loading}
            >
              Log Out
            </button>
          ) : (
            <>
              <button
                className="ms-plugin-btn ms-plugin-btn--danger"
                onClick={async () => {
                  await ms.logout();
                  setConfirmLogout(false);
                }}
                disabled={ms.loading}
              >
                {ms.loading ? <><span className="ms-plugin-spinner" /> Logging out...</> : 'Confirm Logout'}
              </button>
              <button
                className="ms-plugin-btn ms-plugin-btn--secondary ms-plugin-btn--small"
                style={{ borderColor: theme.border }}
                onClick={() => setConfirmLogout(false)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
