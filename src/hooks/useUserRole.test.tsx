import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserRole } from './useUserRole';
import { supabase } from '@/integrations/supabase/client';

// ✅ Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null role when no userId provided', () => {
    const { result } = renderHook(() => useUserRole(undefined));

    expect(result.current.role).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('should start with loading state when userId is provided', () => {
    const mockUserId = 'user-123';

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    } as any);

    const { result } = renderHook(() => useUserRole(mockUserId));

    // Initial state should be loading
    expect(result.current.loading).toBe(true);
  });

  it('should fetch and return user role', async () => {
    const mockUserId = 'user-123';
    const mockRole = 'CEO';

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { role: mockRole },
            error: null
          })),
        })),
      })),
    } as any);

    const { result } = renderHook(() => useUserRole(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.role).toBe(mockRole);
  });

  it('should handle error when fetching role fails', async () => {
    const mockUserId = 'user-123';
    const mockError = new Error('Database error');

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: mockError
          })),
        })),
      })),
    } as any);

    const { result } = renderHook(() => useUserRole(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.role).toBe(null);
  });
});
