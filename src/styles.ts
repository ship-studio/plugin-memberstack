export const MS_STYLE_ID = 'ms-plugin-styles';

export const MEMBERSTACK_CSS = `
@keyframes msPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes msSpin {
  to { transform: rotate(360deg); }
}

@keyframes msFadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* Status dot on toolbar button */
.ms-plugin-status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid var(--bg-primary, #1a1a2e);
}

.ms-plugin-status-dot--loading {
  background: #888;
  animation: msPulse 1.5s ease-in-out infinite;
}

.ms-plugin-status-dot--error {
  background: var(--error, #ef4444);
}

.ms-plugin-status-dot--warning {
  background: #f59e0b;
}

.ms-plugin-status-dot--success {
  background: var(--success, #22c55e);
}

/* Modal overlay */
.ms-plugin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: msFadeIn 0.15s ease-out;
}

.ms-plugin-modal {
  width: 420px;
  max-height: 80vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: msFadeIn 0.2s ease-out;
}

.ms-plugin-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 600;
}

.ms-plugin-close-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  opacity: 0.4;
  line-height: 1;
  border-radius: 4px;
}

.ms-plugin-close-btn:hover {
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.06);
}

.ms-plugin-modal-body {
  padding: 14px 16px 16px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.5;
}

/* Tool detection badges */
.ms-plugin-tool-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.ms-plugin-tool-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

/* Buttons */
.ms-plugin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  transition: filter 0.12s, opacity 0.12s;
  width: 100%;
}

.ms-plugin-btn:hover {
  filter: brightness(0.9);
}

.ms-plugin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ms-plugin-btn--primary {
  background: #6C5CE7;
  color: #fff;
}

.ms-plugin-btn--secondary {
  background: transparent;
  border: 1px solid;
  color: inherit;
}

.ms-plugin-btn--danger {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.ms-plugin-btn--small {
  padding: 5px 10px;
  font-size: 11px;
  width: auto;
}

/* Spinner */
.ms-plugin-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: msSpin 0.6s linear infinite;
}

/* Connected state */
.ms-plugin-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 500;
}

.ms-plugin-status-bar .ms-plugin-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* App list */
.ms-plugin-apps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-top: 4px;
}

.ms-plugin-apps-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
}

.ms-plugin-app-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.ms-plugin-app-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.ms-plugin-app-name {
  font-weight: 500;
}

.ms-plugin-app-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ms-plugin-role-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ms-plugin-app-id {
  font-size: 10px;
  opacity: 0.35;
  font-family: monospace;
}

/* Empty/info states */
.ms-plugin-empty {
  text-align: center;
  padding: 20px 0;
  font-size: 12px;
  opacity: 0.5;
}

.ms-plugin-info-box {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.ms-plugin-error-box {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Actions row */
.ms-plugin-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
}

.ms-plugin-actions-row {
  display: flex;
  gap: 8px;
}

/* Skeleton loading */
.ms-plugin-skeleton {
  height: 38px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  animation: msPulse 1.5s ease-in-out infinite;
}

/* Auth waiting state */
.ms-plugin-auth-waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  text-align: center;
}

.ms-plugin-auth-waiting .ms-plugin-spinner {
  width: 20px;
  height: 20px;
  border-width: 2.5px;
}
`;
