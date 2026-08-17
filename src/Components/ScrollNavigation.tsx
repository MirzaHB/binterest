import React, { useState, useEffect } from 'react';
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

const ScrollNavigation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('about');

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
    <nav className="scroll-navigation">
      <div className="nav-line"></div>
      <ul className="nav-items">
        {NAV_ITEMS.map((item) => (
          <li
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => scrollToSection(item.id)}
          >
            <div className="nav-dot"></div>
            <span className="nav-label">{item.label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default ScrollNavigation;
