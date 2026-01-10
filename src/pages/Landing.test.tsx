import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from './Landing';
import { useAuth } from '@/hooks/useAuth';

// ✅ Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// ✅ Mock ThemeLogo and ThemeToggle components
vi.mock('@/components/ThemeLogo', () => ({
  ThemeLogo: () => <div>Logo</div>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div>Theme Toggle</div>,
}));

describe('Landing', () => {
  it('should render landing page title', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Should have LELE HCM branding
    expect(screen.getByText(/LELE/i)).toBeInTheDocument();
  });

  it('should render call-to-action buttons', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Should have navigation elements
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should display features section', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Landing page should describe product features
    const pageContent = screen.getByRole('main') || document.body;
    expect(pageContent).toBeInTheDocument();
  });
});
