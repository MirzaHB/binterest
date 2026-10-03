import React from 'react';
import './MahoragaLoader.css';

interface MahoragaLoaderProps {
  /** What is being waited on, e.g. "Loading photos…". Also what screen readers announce. */
  label: string;
  /**
   * 'page'    - stands in for a whole page or section while it loads.
   * 'compact' - sits inside a card or form, e.g. while an upload is in flight.
   */
  size?: 'page' | 'compact';
}

// One spoke every 45°, each ending in a knob just past the rim.
const SPOKE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const RIM_RADIUS = 60;
const KNOB_RADIUS = 84;

const toPoint = (angle: number, radius: number) => {
  const rad = (angle * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
};

// The spokes and rings, drawn twice: once thick in the outline colour, then
// in gold on top, which is how a stroke gets an outline of its own.
const Frame: React.FC<{ className: string }> = ({ className }) => (
  <g className={className}>
    {SPOKE_ANGLES.map((angle) => {
      const end = toPoint(angle, KNOB_RADIUS);
      return <line key={angle} className="mahoraga-wheel-spoke" x1={0} y1={0} x2={end.x} y2={end.y} />;
    })}
    <circle className="mahoraga-wheel-rim" r={RIM_RADIUS} />
    <circle className="mahoraga-wheel-inner" r={28} />
  </g>
);

/**
 * Mahoraga's wheel seen from above, turning slowly. It is drawn rather than
 * cropped from the About Me animation so it stays sharp at any size and works
 * on either theme. The wheel is decorative, so the label is what screen readers
 * announce; under reduced motion it simply holds still.
 */
const MahoragaLoader: React.FC<MahoragaLoaderProps> = ({ label, size = 'page' }) => (
  <div className={`mahoraga-loader mahoraga-loader--${size}`} role="status" aria-live="polite">
    <svg className="mahoraga-wheel" viewBox="-100 -100 200 200" aria-hidden="true">
      <Frame className="mahoraga-wheel-outline" />
      <Frame className="mahoraga-wheel-gold" />
      {SPOKE_ANGLES.map((angle) => {
        const { x, y } = toPoint(angle, KNOB_RADIUS);
        return <circle key={angle} className="mahoraga-wheel-knob" cx={x} cy={y} r={11} />;
      })}
      <circle className="mahoraga-wheel-hub" r={13} />
      <circle className="mahoraga-wheel-hub-cap" r={5} />
    </svg>
    <p className="mahoraga-loader-label">{label}</p>
  </div>
);

export default MahoragaLoader;
