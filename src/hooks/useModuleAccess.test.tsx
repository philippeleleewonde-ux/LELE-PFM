import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useModuleAccess } from './useModuleAccess';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

// ✅ Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

// ✅ Mock useUserRole hook
vi.mock('./useUserRole', () => ({
  useUserRole: vi.fn(),
}));

// ✅ Mock types/modules
vi.mock('@/types/modules', () => ({
  MODULE_PERMISSIONS: {
    'CEO': {
      1: { canRead: true, canWrite: true, canAdmin: true },
      2: { canRead: true, canWrite: true, canAdmin: true },
    },
    'EMPLOYEE': {
      1: { canRead: true, canWrite: false, canAdmin: false },
      2: { canRead: false, canWrite: false, canAdmin: false },
    },
  },
}));

describe('useModuleAccess', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  it('should return loading state when role is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' } as any,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(useUserRole).mockReturnValue({
      role: null,
      loading: true,
    });

    const { result } = renderHook(
      () => useModuleAccess(1),
      { wrapper }
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.canRead).toBe(false);
  });

  it('should grant full access when user is CEO', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' } as any,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(useUserRole).mockReturnValue({
      role: 'CEO',
      loading: false,
    });

    const { result } = renderHook(
      () => useModuleAccess(1),
      { wrapper }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.canRead).toBe(true);
    expect(result.current.canWrite).toBe(true);
    expect(result.current.canAdmin).toBe(true);
    expect(result.current.role).toBe('CEO');
  });

  it('should grant limited access when user is EMPLOYEE', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' } as any,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(useUserRole).mockReturnValue({
      role: 'EMPLOYEE',
      loading: false,
    });

    const { result } = renderHook(
      () => useModuleAccess(1),
      { wrapper }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.canRead).toBe(true);
    expect(result.current.canWrite).toBe(false);
    expect(result.current.canAdmin).toBe(false);
  });

  it('should deny access to module when employee has no permission', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' } as any,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(useUserRole).mockReturnValue({
      role: 'EMPLOYEE',
      loading: false,
    });

    const { result } = renderHook(
      () => useModuleAccess(2), // Module 2: no access for EMPLOYEE
      { wrapper }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.canRead).toBe(false);
    expect(result.current.canWrite).toBe(false);
    expect(result.current.canAdmin).toBe(false);
  });
});
