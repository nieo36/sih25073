import React from 'react';
import { Download, X, Zap } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const InstallBanner: React.FC = () => {
  const { showInstallBanner, promptInstall, dismissInstallPrompt, isInstalled } = usePWA();

  if (!showInstallBanner || isInstalled) return null;

  return (
    <aside
      aria-label="Install KreedAI PWA"
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        width: 'calc(100% - 24px)',
        maxWidth: '480px',
        background: '#ffffff',
        border: '3px solid #1a1a1a',
        boxShadow: '6px 6px 0px 0px #1a1a1a',
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            background: '#ffcc00',
            border: '2px solid #1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={22} color="#1a1a1a" />
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              color: '#1a1a1a',
            }}
          >
            Install KreedAI App
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.72rem',
              color: '#4a4a4a',
              marginTop: '0.15rem',
            }}
          >
            Instant camera launch & full offline AI scoring
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={promptInstall}
          style={{
            background: '#ffcc00',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
            boxShadow: '2px 2px 0px 0px #1a1a1a',
            padding: '0.45rem 0.75rem',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Download size={14} /> Install
        </button>

        <button
          type="button"
          onClick={dismissInstallPrompt}
          aria-label="Dismiss installation prompt"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#777777',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>
    </aside>
  );
};
