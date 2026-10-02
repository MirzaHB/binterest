import React, { useState, useEffect } from 'react';
import { scrollTopFor, scrollToHeading } from './headings';
import './TableOfContents.css';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  // The rendered post body; headings (and their ids) are read from here
  containerRef: React.RefObject<HTMLElement | null>;
  // Re-read the headings whenever the post content changes
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ containerRef, content }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Read from the DOM rather than re-parsing the markdown, so every entry
    // uses exactly the id BlogPost rendered
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    setHeadings(Array.from(elements, (element) => ({
      id: element.id,
      text: element.textContent ?? '',
      level: Number(element.tagName[1]),
    })));
  }, [containerRef, content]);

  useEffect(() => {
    // Track scroll position to highlight active section
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id));

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && scrollTopFor(element) <= window.scrollY) {
          setActiveId(headings[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const goToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      scrollToHeading(element, 'smooth');

      // Update URL without adding to browser history. Keep React Router's
      // history state; replacing it with null breaks its back/forward tracking.
      window.history.replaceState(window.history.state, '', `#${id}`);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="table-of-contents">
      <div className="toc-track">
        {headings.map((heading) => (
          <div
            key={heading.id}
            className={`toc-item ${activeId === heading.id ? 'active' : ''}`}
            onClick={() => goToHeading(heading.id)}
            data-level={heading.level}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToHeading(heading.id);
              }
            }}
          >
            <div className="toc-dash"></div>
            <div className="toc-tooltip">{heading.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOfContents;
