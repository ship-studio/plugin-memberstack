import { useState, useEffect } from 'react';
import { useMemberstack } from './useMemberstack';
import { ToolbarButton } from './ToolbarButton';
import { Modal } from './Modal';
import { ConnectView } from './ConnectView';
import { ConnectedView } from './ConnectedView';
import { MS_STYLE_ID, MEMBERSTACK_CSS } from './styles';

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(MS_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = MS_STYLE_ID;
    style.textContent = MEMBERSTACK_CSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById(MS_STYLE_ID)?.remove();
    };
  }, []);
}

function MemberstackToolbar() {
  useInjectStyles();
  const ms = useMemberstack();
  const [showModal, setShowModal] = useState(false);

  const isConnected = ms.status === 'connected';

  const modalTitle = isConnected ? 'Memberstack — Connected' : 'Connect Memberstack';

  return (
    <>
      <ToolbarButton status={ms.status} onClick={() => setShowModal(true)} />
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={modalTitle}>
          {isConnected ? (
            <ConnectedView ms={ms} />
          ) : (
            <ConnectView ms={ms} />
          )}
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Module exports (required by Ship Studio plugin loader)
// ---------------------------------------------------------------------------

export const name = 'Memberstack';

export const slots = {
  toolbar: MemberstackToolbar,
};

export function onActivate() {
  console.log('[memberstack] Plugin activated');
}

export function onDeactivate() {
  console.log('[memberstack] Plugin deactivated');
  const styleEl = document.getElementById(MS_STYLE_ID);
  if (styleEl) styleEl.remove();
}
