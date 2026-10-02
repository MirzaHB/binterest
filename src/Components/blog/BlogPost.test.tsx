import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import BlogPost from './BlogPost';

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ isAdmin: () => false, getAccessToken: vi.fn() }),
}));

vi.mock('../../api/blog-api', () => ({
  getBlog: vi.fn().mockResolvedValue({ title: 'Test Post', tags: '' }),
  getBlogContent: vi.fn().mockResolvedValue([
    '# Intro to `fetch()`',
    '',
    '```bash',
    '# not a heading',
    '```',
    '',
    '## Setup',
    '',
    '## Setup',
  ].join('\n')),
  formatBlogDate: () => '',
  parseTags: () => [],
}));

const renderAt = (url: string) => {
  window.history.replaceState(null, '', url);
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/blog/:id" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

test('heading ids ignore inline formatting, skip code blocks and dedupe repeats', async () => {
  renderAt('/blog/test-post');

  expect(await screen.findByRole('heading', { name: 'Intro to fetch()' })).toHaveAttribute('id', 'intro-to-fetch');
  const [first, second] = screen.getAllByRole('heading', { name: 'Setup' });
  expect(first).toHaveAttribute('id', 'setup');
  expect(second).toHaveAttribute('id', 'setup-1');

  // One sidebar entry per real heading; the "# not a heading" code line is skipped
  // (queried directly: the sidebar is display:none below 900px, which hides it from role queries)
  await waitFor(() => expect(document.querySelectorAll(".toc-item")).toHaveLength(3));
});

test('a shared section link scrolls to that section once the post loads', async () => {
  renderAt('/blog/test-post#setup-1');

  await screen.findByRole('heading', { name: 'Intro to fetch()' });
  expect(window.scrollTo).toHaveBeenCalled();
});
