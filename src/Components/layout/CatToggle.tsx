import React from 'react';
import './CatToggle.css';

// oneko.js (public/oneko.js) owns the cat and exposes this control surface on
// window. It is a plain script rather than a component because it has to keep
// running across route changes.
interface OnekoApi {
  available: boolean;
  isEnabled: () => boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
}

declare global {
  interface Window {
    oneko?: OnekoApi;
  }
}

const CatToggle: React.FC = () => {
  // public/oneko.js is a plain <script> in <body>, so it runs during parsing —
  // before the CRA bundle, which is injected into <head> with defer. window.oneko
  // is therefore always present by the time this mounts, in dev and in a
  // production build alike, so these can read it directly.
  const [available] = React.useState(() => window.oneko?.available ?? false);
  const [enabled, setEnabled] = React.useState(() => window.oneko?.isEnabled() ?? false);
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<number | undefined>(undefined);

  const showToast = React.useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 6000);
  }, []);

  React.useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  React.useEffect(() => {
    // Clicking the cat itself also toggles it, so the button listens rather
    // than assuming it is the only thing that can change this.
    const onChange = (event: Event) => {
      const { enabled: isOn, viaCat } = (event as CustomEvent).detail;
      setEnabled(isOn);
      if (!isOn && viaCat) {
        showToast('🐾 Cat sent home. Bring it back with the paw above.');
      }
    };
    window.addEventListener('oneko:change', onChange);
    return () => window.removeEventListener('oneko:change', onChange);
  }, [showToast]);

  // Nothing to toggle when the visitor asked for reduced motion: oneko never
  // starts, so the button would be a dead control.
  if (!available) return null;

  const label = enabled ? 'Send the cat home' : 'Call the cat back';

  return (
    // Relative wrapper so the toast hangs off the button itself — its caret has
    // to land under the paw, and a viewport-anchored toast drifts away from it
    // as the nav's max-width kicks in on wide screens.
    <span className="cat-toggle-wrap">
      <button
        className={`theme-toggle-nav cat-toggle ${enabled ? '' : 'off'}`}
        onClick={() => {
          window.oneko?.toggle();
          setToast(null);
        }}
        title={label}
        aria-label={label}
        aria-pressed={enabled}
      >
        <span className="nav-icon">{enabled ? '🐈' : '🐾'}</span>
      </button>

      {toast && (
        <div className="cat-toast" role="status">
          {toast}
        </div>
      )}
    </span>
  );
};

export default CatToggle;
