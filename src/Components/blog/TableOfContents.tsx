import React, { useState, useEffect } from 'react';
import './TableOfContents.css';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown content
    const extractedHeadings: Heading[] = [];
    const lines = content.split('\n');

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Simple clean ID from heading text: "Introduction" -> "introduction"
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        extractedHeadings.push({ id, text, level });
      }
    });

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    // Track scroll position to highlight active section
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id));
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(headings[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Use browser's native smooth scroll
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update URL without adding to browser history
      window.history.replaceState(null, '', `#${id}`);
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
            onClick={() => scrollToHeading(heading.id)}
            data-level={heading.level}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollToHeading(heading.id);
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
