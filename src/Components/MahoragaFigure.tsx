import React from 'react';
import './MahoragaFigure.css';

type MahoragaVariant = 'grid' | 'header';

interface MahoragaFigureProps {
  /**
   * 'grid'   - fills the empty third cell of the About Me card grid.
   * 'header' - small, sits beside the "About Me" heading on narrow screens.
   * Both are rendered; CSS shows whichever suits the current width.
   */
  variant: MahoragaVariant;
}

/**
 * Decorative Mahoraga with his dharma wheel spinning above his head.
 * Purely ornamental, so it is hidden from assistive tech and from pointer
 * events. The still frame is swapped in when the visitor prefers reduced motion.
 */
const MahoragaFigure: React.FC<MahoragaFigureProps> = ({ variant }) => (
  <div className={`mahoraga mahoraga--${variant}`} aria-hidden="true">
    <img className="mahoraga-anim" src="/mahoraga-peek.webp" alt="" />
    <img className="mahoraga-still" src="/mahoraga-peek-still.png" alt="" />
  </div>
);

export default MahoragaFigure;
