// Shared by BlogPost (which assigns heading ids) and TableOfContents (which
// links to them), so a #section URL always points at a real element.

// Clears the sticky nav when a heading is scrolled to the top
const HEADER_OFFSET = 100;

// Just enough of the hast tree that react-markdown hands rehype plugins
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const textOf = (node: HastNode): string =>
  node.type === 'text' ? node.value ?? '' : (node.children ?? []).map(textOf).join('');

// "Intro to `fetch()`" -> "intro-to-fetch"
const slugify = (text: string): string =>
  text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Rehype plugin: gives every heading an id from its plain text, with -1, -2...
// on repeats. Working on the parsed tree means inline formatting is read as
// text, and lines starting with # inside code blocks are never mistaken for
// headings.
export const rehypeHeadingIds = () => (tree: HastNode) => {
  const seen = new Map<string, number>();

  const visit = (node: HastNode) => {
    if (node.type === 'element' && /^h[1-6]$/.test(node.tagName ?? '')) {
      const base = slugify(textOf(node)) || 'section';
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      node.properties = { ...node.properties, id: count ? `${base}-${count}` : base };
      return;
    }
    node.children?.forEach(visit);
  };

  visit(tree);
};

// The scroll position that puts a heading just below the sticky nav. Summed
// from layout offsets rather than getBoundingClientRect, so the page's fade-in
// transform doesn't throw it off mid-animation.
export const scrollTopFor = (element: HTMLElement): number => {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  return top - HEADER_OFFSET;
};

export const scrollToHeading = (element: HTMLElement, behavior: ScrollBehavior = 'auto') => {
  window.scrollTo({ top: scrollTopFor(element), behavior });
};
