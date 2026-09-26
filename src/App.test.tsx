import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import App from './App';

vi.mock('@azure/msal-react', () => ({
  useIsAuthenticated: () => false,
  useAccount: () => null,
  useMsal: () => ({
    accounts: [],
    instance: {
      acquireTokenSilent: vi.fn(),
      getAllAccounts: vi.fn(() => []),
      loginRedirect: vi.fn(),
      logoutRedirect: vi.fn(),
      setActiveAccount: vi.fn(),
    },
  }),
}));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  window.history.pushState({}, '', '/');
});

test('renders the portfolio home page', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /explore gallery/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /read blogs/i })).toBeInTheDocument();
});
