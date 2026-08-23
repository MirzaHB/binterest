import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import './ScrollNavigation.css';

interface NavItem {
  id: string;
  label: string;
}

// Module scope: a stable reference, so the scroll effect never re-subscribes.
const NAV_ITEMS: NavItem[] = [
  { id: 'about', label: 'About Me' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'socials', label: 'Socials' }
];

// How long the label takes to leave one dot and settle into the next. Shared
// with the CSS so the pop-out, the ride and the landing squash stay in step —
// if you change it, change --pill-trip in ScrollNavigation.css too.
const TRIP_MS = 620;

const ScrollNavigation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('about');

  const navRef = useRef<HTMLElement>(null);
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // null until the first measurement, so the pill never paints at y=0 and then
  // jumps down to the section it actually belongs to.
  const [pillY, setPillY] = useState<number | null>(null);
  const [pillLabel, setPillLabel] = useState<string>(NAV_ITEMS[0].label);
  // Bumped on every section change purely to re-key the pill body, which is
  // what restarts its keyframes. CSS animations do not replay on their own.
  const [trip, setTrip] = useState(0);
  const swapTimer = useRef<number | undefined>(undefined);
  const isFirstTrip = useRef(true);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;

      // The last section can be shorter than the scroll distance left below it,
      // so on tall viewports it never crosses the anchor line and would never
      // light up. Pin it once we've hit the bottom of the page.
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      if (atBottom) {
        setActiveSection(NAV_ITEMS[NAV_ITEMS.length - 1].id);
        return;
      }

      const anchor = window.scrollY + window.innerHeight / 3;

      // Default to the first section: while the hero is filling the viewport no
      // section has crossed the anchor yet, and leaving the previous value in
      // place would strand the highlight on whatever we last scrolled past.
      let current = NAV_ITEMS[0].id;

      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const section = document.getElementById(NAV_ITEMS[i].id);
        if (!section) continue;
        // Document-relative. offsetTop would be measured against .main-content,
        // which is position: relative, and so is off by a constant.
        const top = section.getBoundingClientRect().top + window.scrollY;
        if (top <= anchor) {
          current = NAV_ITEMS[i].id;
          break;
        }
      }

      setActiveSection(current);
    };

    // Coalesce to one layout read per frame instead of one per scroll event.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update(); // Set the initial state

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Where the pill has to land. Measured rather than derived from the gap and
  // dot size, so it stays correct if either changes — and read from the centre
  // of the dot's box, which is stable even mid scale-transition.
  useLayoutEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      const dot = dotRefs.current[activeSection];
      if (!nav || !dot) return;
      const dotBox = dot.getBoundingClientRect();
      setPillY(dotBox.top + dotBox.height / 2 - nav.getBoundingClientRect().top);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeSection]);

  // Restart the trip animation and swap the text partway through it.
  useEffect(() => {
    const label = NAV_ITEMS.find((item) => item.id === activeSection)?.label;
    if (label === undefined) return;

    // On mount the pill is already at its dot; there is no journey to play.
    if (isFirstTrip.current) {
      isFirstTrip.current = false;
      setPillLabel(label);
      return;
    }

    setTrip((n) => n + 1);

    // Swap at the midpoint, where the pill is squeezed at its smallest and the
    // change in text — and in the pill's width — is masked. Doing it at either
    // end would leave the bubble sitting in a dot reading the wrong section.
    window.clearTimeout(swapTimer.current);
    swapTimer.current = window.setTimeout(() => setPillLabel(label), TRIP_MS * 0.45);

    // Cancels a half-finished swap when the visitor scrolls straight past this
    // section into the next one.
    return () => window.clearTimeout(swapTimer.current);
  }, [activeSection]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <nav className="scroll-navigation" ref={navRef} aria-label="Page sections">
      <div className="nav-line"></div>
      <ul className="nav-items">
        {NAV_ITEMS.map((item) => (
          <li
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => scrollToSection(item.id)}
            aria-current={activeSection === item.id ? 'true' : undefined}
          >
            <div
              className="nav-dot"
              ref={(el) => {
                dotRefs.current[item.id] = el;
              }}
            ></div>
            <span className="nav-label">{item.label}</span>
          </li>
        ))}
      </ul>

      {/* The active section's label, hoisted out of the list so it can travel
          between dots. Hidden from screen readers because the per-item labels
          above already carry the same text, with aria-current marking this one. */}
      {pillY !== null && (
        <div
          className="nav-pill"
          aria-hidden="true"
          style={{ '--pill-y': `${pillY}px` } as React.CSSProperties}
        >
          <span className="nav-pill-body" key={trip}>
            {pillLabel}
          </span>
        </div>
      )}
    </nav>
  );
};

export default ScrollNavigation;
