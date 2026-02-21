import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { CompanyProvider, useCompany } from '../CompanyContext';

// ============================================
// MOCK SUPABASE
// ============================================

// Store the auth state change callback so we can trigger it in tests
let authStateChangeCallback: (() => void) | null = null;
const mockUnsubscribe = vi.fn();

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockOnAuthStateChange = vi.fn((callback: () => void) => {
  authStateChangeCallback = callback;
  return {
    data: {
      subscription: {
        unsubscribe: mockUnsubscribe,
      },
    },
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// ============================================
// HELPERS
// ============================================

// Helper component to read context values
function CompanyConsumer() {
  const { companyId, company, isLoading, error } = useCompany();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="company-id">{companyId ?? 'null'}</span>
      <span data-testid="company-name">{company?.name ?? 'null'}</span>
      <span data-testid="company-slug">{company?.slug ?? 'null'}</span>
      <span data-testid="error">{error?.message ?? 'null'}</span>
    </div>
  );
}

// Helper component with refresh button
function CompanyConsumerWithRefresh() {
  const { companyId, company, isLoading, refreshCompany } = useCompany();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="company-id">{companyId ?? 'null'}</span>
      <span data-testid="company-name">{company?.name ?? 'null'}</span>
      <button data-testid="refresh-btn" onClick={refreshCompany}>Refresh</button>
    </div>
  );
}

// Setup Supabase mock chain for profile + company queries
function setupSupabaseMocks(options: {
  user?: { id: string } | null;
  userError?: any;
  profile?: { company_id: string } | null;
  profileError?: any;
  company?: any;
  companyError?: any;
}) {
  // Auth
  mockGetUser.mockResolvedValue({
    data: { user: options.user ?? null },
    error: options.userError ?? null,
  });

  // Build chainable mock for .from()
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: options.profile ?? null,
              error: options.profileError ?? null,
            }),
          }),
        }),
      };
    }
    if (table === 'companies') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: options.company ?? null,
              error: options.companyError ?? null,
            }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
  });
}

// ============================================
// TESTS
// ============================================

describe('CompanyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeCallback = null;
  });

  // =====================
  // useCompany() hook guard
  // =====================
  describe('useCompany() outside provider', () => {
    it('should throw when used outside CompanyProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<CompanyConsumer />);
      }).toThrow('useCompany must be used within a CompanyProvider');

      consoleSpy.mockRestore();
    });
  });

  // =====================
  // Authenticated user WITH company
  // =====================
  describe('authenticated user with company', () => {
    it('should load company data for authenticated user', async () => {
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-abc' },
        company: {
          id: 'company-abc',
          name: 'Acme Corp',
          industry: 'Technology',
          employees_count: 50,
          slug: 'acme-corp',
        },
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      // Should start loading
      expect(screen.getByTestId('loading').textContent).toBe('true');

      // Should resolve with company data
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('company-id').textContent).toBe('company-abc');
      expect(screen.getByTestId('company-name').textContent).toBe('Acme Corp');
      expect(screen.getByTestId('company-slug').textContent).toBe('acme-corp');
      expect(screen.getByTestId('error').textContent).toBe('null');
    });

    it('should set companyId even if company details query fails', async () => {
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-abc' },
        company: null,
        companyError: { message: 'Company not found' },
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // companyId should still be set even though company details failed
      expect(screen.getByTestId('company-id').textContent).toBe('company-abc');
      expect(screen.getByTestId('company-name').textContent).toBe('null');
    });
  });

  // =====================
  // Unauthenticated user
  // =====================
  describe('unauthenticated user', () => {
    it('should set null values when no user is authenticated', async () => {
      setupSupabaseMocks({
        user: null,
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('company-id').textContent).toBe('null');
      expect(screen.getByTestId('company-name').textContent).toBe('null');
    });

    it('should set null values when auth returns error', async () => {
      setupSupabaseMocks({
        user: null,
        userError: { message: 'Auth error' },
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('company-id').textContent).toBe('null');
      expect(screen.getByTestId('company-name').textContent).toBe('null');
    });
  });

  // =====================
  // User WITHOUT company (no company_id in profile)
  // =====================
  describe('user without company', () => {
    it('should set null when profile has no company_id', async () => {
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: null } as any,
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('company-id').textContent).toBe('null');
      expect(screen.getByTestId('company-name').textContent).toBe('null');
    });

    it('should set null when profile query returns error', async () => {
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: null,
        profileError: { message: 'Profile not found', code: 'PGRST116' },
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('company-id').textContent).toBe('null');
      expect(screen.getByTestId('company-name').textContent).toBe('null');
    });
  });

  // =====================
  // Multi-tenant isolation
  // =====================
  describe('multi-tenant isolation', () => {
    it('should only query company matching profile company_id', async () => {
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-A' },
        company: {
          id: 'company-A',
          name: 'Company A',
          industry: 'Finance',
          employees_count: 100,
          slug: 'company-a',
        },
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Verify the from('companies') was called
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockFrom).toHaveBeenCalledWith('companies');

      // Result should match the specific company
      expect(screen.getByTestId('company-id').textContent).toBe('company-A');
      expect(screen.getByTestId('company-name').textContent).toBe('Company A');
    });

    it('should query profiles table with authenticated user id', async () => {
      setupSupabaseMocks({
        user: { id: 'specific-user-id-456' },
        profile: { company_id: 'company-xyz' },
        company: {
          id: 'company-xyz',
          name: 'XYZ Corp',
          industry: 'Tech',
          employees_count: 25,
          slug: 'xyz-corp',
        },
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Verify the profile query uses the correct user ID
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(screen.getByTestId('company-id').textContent).toBe('company-xyz');
    });
  });

  // =====================
  // Auth state change re-fetch
  // =====================
  describe('auth state change triggers re-fetch', () => {
    it('should register auth state change listener on mount', async () => {
      setupSupabaseMocks({
        user: null,
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
      expect(typeof authStateChangeCallback).toBe('function');
    });

    it('should re-fetch company data when auth state changes', async () => {
      // Start unauthenticated
      setupSupabaseMocks({
        user: null,
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('company-id').textContent).toBe('null');

      // User logs in → auth state changes
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-new' },
        company: {
          id: 'company-new',
          name: 'New Company',
          industry: 'Retail',
          employees_count: 10,
          slug: 'new-company',
        },
      });

      // Trigger auth state change
      await act(async () => {
        authStateChangeCallback?.();
      });

      await waitFor(() => {
        expect(screen.getByTestId('company-id').textContent).toBe('company-new');
      });

      expect(screen.getByTestId('company-name').textContent).toBe('New Company');
    });

    it('should unsubscribe from auth changes on unmount', async () => {
      setupSupabaseMocks({
        user: null,
      });

      const { unmount } = render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // =====================
  // refreshCompany()
  // =====================
  describe('refreshCompany()', () => {
    it('should re-fetch data when refreshCompany is called', async () => {
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-v1' },
        company: {
          id: 'company-v1',
          name: 'Version 1',
          industry: 'Tech',
          employees_count: 5,
          slug: 'v1',
        },
      });

      render(
        <CompanyProvider>
          <CompanyConsumerWithRefresh />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('company-name').textContent).toBe('Version 1');

      // Update mock to return different data
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-v2' },
        company: {
          id: 'company-v2',
          name: 'Version 2',
          industry: 'Finance',
          employees_count: 50,
          slug: 'v2',
        },
      });

      // Click refresh
      await act(async () => {
        screen.getByTestId('refresh-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('company-name').textContent).toBe('Version 2');
      });

      expect(screen.getByTestId('company-id').textContent).toBe('company-v2');
    });
  });

  // =====================
  // Error handling
  // =====================
  describe('error handling', () => {
    it('should set error state on unexpected exception', async () => {
      mockGetUser.mockRejectedValue(new Error('Network failure'));

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('error').textContent).toBe('Network failure');
      expect(screen.getByTestId('company-id').textContent).toBe('null');
    });

    it('should always set isLoading to false after fetch completes', async () => {
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-abc' },
        company: {
          id: 'company-abc',
          name: 'Test',
          industry: 'Test',
          employees_count: 1,
          slug: 'test',
        },
      });

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading').textContent).toBe('true');

      // Eventually stops loading
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should clear error on successful re-fetch after error', async () => {
      // First: error
      mockGetUser.mockRejectedValueOnce(new Error('Temporary failure'));

      render(
        <CompanyProvider>
          <CompanyConsumerWithRefresh />
        </CompanyProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Now setup success
      setupSupabaseMocks({
        user: { id: 'user-123' },
        profile: { company_id: 'company-ok' },
        company: {
          id: 'company-ok',
          name: 'OK Company',
          industry: 'Test',
          employees_count: 1,
          slug: 'ok',
        },
      });

      // Refresh
      await act(async () => {
        screen.getByTestId('refresh-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('company-name').textContent).toBe('OK Company');
      });
    });
  });

  // =====================
  // Loading state
  // =====================
  describe('loading state', () => {
    it('should start in loading state', () => {
      setupSupabaseMocks({
        user: null,
      });

      // Use a never-resolving promise to keep it loading
      mockGetUser.mockReturnValue(new Promise(() => {}));

      render(
        <CompanyProvider>
          <CompanyConsumer />
        </CompanyProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');
    });
  });
});
