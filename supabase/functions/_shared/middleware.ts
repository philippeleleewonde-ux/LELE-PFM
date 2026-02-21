// ============================================================================
// Security Middleware for Supabase Edge Functions
// ============================================================================
// Created: 2025-11-16
// Author: elite-saas-developer
// Purpose: Rate limiting, structured logging, error handling, security headers
// ============================================================================

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

export interface RequestContext {
  correlationId: string;
  user: {
    id: string;
    email?: string;
  };
  companyId: string;
  supabaseClient: SupabaseClient;
}

export interface MiddlewareConfig {
  requireAuth?: boolean;
  rateLimitPerMinute?: number;
  allowedRoles?: string[];
}

// ============================================================================
// CORS HEADERS
// ============================================================================

// Allowed origins for CORS — restrict to known frontend domains
const ALLOWED_ORIGINS = [
  'https://yhidlozgpvzsroetjxqb.supabase.co',  // Supabase project
  'https://lele-hcm.lovable.app',                // Lovable production
  'https://lele-hcm.vercel.app',                 // Vercel production (if used)
  'http://localhost:8080',                        // Local dev frontend
  'http://localhost:3000',                        // Local dev alt
  'http://localhost:5173',                        // Vite dev server
];

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

// Legacy export for backward compatibility — prefer getCorsHeaders(req)
export const corsHeaders = getCorsHeaders();

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export function getSecurityHeaders(req?: Request): Record<string, string> {
  return {
    ...getCorsHeaders(req),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

// Legacy export for backward compatibility — prefer getSecurityHeaders(req)
export const securityHeaders = getSecurityHeaders();

// ============================================================================
// STRUCTURED LOGGER
// ============================================================================

export const logger = {
  info: (msg: string, meta: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'info',
      message: msg,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },

  warn: (msg: string, meta: Record<string, any>) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message: msg,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },

  error: (msg: string, error: Error, meta: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'error',
      message: msg,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },
};

// ============================================================================
// RATE LIMITING (using Upstash Redis)
// ============================================================================

class RateLimiter {
  private redisUrl: string;
  private redisToken: string;

  constructor() {
    this.redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') || '';
    this.redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '';
  }

  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number }> {
    // If Redis not configured, allow all requests (with warning)
    if (!this.redisUrl || !this.redisToken) {
      logger.warn('Rate limiting disabled - Redis not configured', { key });
      return { allowed: true, remaining: limit };
    }

    try {
      // Increment counter using Redis INCR
      const incrResponse = await fetch(`${this.redisUrl}/incr/${key}`, {
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
      });

      const incrData = await incrResponse.json();
      const count = incrData.result as number;

      // Set expiration if this is first request in window
      if (count === 1) {
        await fetch(`${this.redisUrl}/expire/${key}/${windowSeconds}`, {
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
          },
        });
      }

      const remaining = Math.max(0, limit - count);
      const allowed = count <= limit;

      if (!allowed) {
        logger.warn('Rate limit exceeded', { key, count, limit });
      }

      return { allowed, remaining };
    } catch (error) {
      logger.error('Rate limit check failed', error as Error, { key });
      // Fail open - allow request if rate limiting fails
      return { allowed: true, remaining: limit };
    }
  }
}

export const rateLimiter = new RateLimiter();

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

export async function withAuth(
  req: Request,
  config: MiddlewareConfig = {}
): Promise<{ context: RequestContext; error?: Response }> {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

  const reqSecurityHeaders = getSecurityHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return {
      context: {} as RequestContext,
      error: new Response(null, {
        status: 204,
        headers: reqSecurityHeaders
      }),
    };
  }

  try {
    // ========================================================================
    // STEP 1: RATE LIMITING
    // ========================================================================

    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `ratelimit:${clientIp}`;
    const rateLimitPerMinute = config.rateLimitPerMinute || 60;

    const rateLimit = await rateLimiter.checkRateLimit(rateLimitKey, rateLimitPerMinute);

    if (!rateLimit.allowed) {
      logger.warn('Rate limit exceeded', {
        correlationId,
        ip: clientIp,
        limit: rateLimitPerMinute,
      });

      return {
        context: {} as RequestContext,
        error: new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: 60,
          }),
          {
            status: 429,
            headers: {
              ...reqSecurityHeaders,
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId,
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'Retry-After': '60',
            },
          }
        ),
      };
    }

    // ========================================================================
    // STEP 2: AUTHENTICATION
    // ========================================================================

    const requireAuth = config.requireAuth !== false; // Default true

    if (!requireAuth) {
      // No auth required - return minimal context
      logger.info('Request without auth', { correlationId });
      return {
        context: {
          correlationId,
          user: { id: 'anonymous' },
          companyId: '',
          supabaseClient: createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
          ),
        },
      };
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header', { correlationId });
      return {
        context: {} as RequestContext,
        error: new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Missing authorization header',
          }),
          {
            status: 401,
            headers: {
              ...reqSecurityHeaders,
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId,
            },
          }
        ),
      };
    }

    // Create Supabase client with user JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      logger.error('Invalid or expired token', authError || new Error('No user'), {
        correlationId
      });
      return {
        context: {} as RequestContext,
        error: new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Invalid or expired token',
          }),
          {
            status: 403,
            headers: {
              ...reqSecurityHeaders,
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId,
            },
          }
        ),
      };
    }

    logger.info('User authenticated', {
      correlationId,
      user_id: user.id,
    });

    // ========================================================================
    // STEP 3: RETRIEVE USER COMPANY_ID
    // ========================================================================

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      logger.error('Company not found for user', profileError || new Error('No company'), {
        correlationId,
        user_id: user.id,
      });
      return {
        context: {} as RequestContext,
        error: new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'User company not found',
          }),
          {
            status: 403,
            headers: {
              ...reqSecurityHeaders,
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId,
            },
          }
        ),
      };
    }

    const companyId = profile.company_id;

    logger.info('Company context retrieved', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      full_name: profile.full_name,
    });

    // ========================================================================
    // STEP 4: ROLE-BASED ACCESS CONTROL (if configured)
    // ========================================================================

    if (config.allowedRoles && config.allowedRoles.length > 0) {
      const { data: userRoles, error: rolesError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError || !userRoles || userRoles.length === 0) {
        logger.error('Failed to fetch user roles', rolesError || new Error('No roles'), {
          correlationId,
          user_id: user.id,
        });
        return {
          context: {} as RequestContext,
          error: new Response(
            JSON.stringify({
              error: 'Forbidden',
              message: 'User roles not found',
            }),
            {
              status: 403,
              headers: {
                ...securityHeaders,
                'Content-Type': 'application/json',
                'X-Correlation-ID': correlationId,
              },
            }
          ),
        };
      }

      const userRoleNames = userRoles.map((r) => r.role);
      const hasAllowedRole = userRoleNames.some((role) =>
        config.allowedRoles!.includes(role)
      );

      if (!hasAllowedRole) {
        logger.warn('User does not have required role', {
          correlationId,
          user_id: user.id,
          user_roles: userRoleNames,
          required_roles: config.allowedRoles,
        });
        return {
          context: {} as RequestContext,
          error: new Response(
            JSON.stringify({
              error: 'Forbidden',
              message: 'Insufficient permissions',
            }),
            {
              status: 403,
              headers: {
                ...securityHeaders,
                'Content-Type': 'application/json',
                'X-Correlation-ID': correlationId,
              },
            }
          ),
        };
      }

      logger.info('Role check passed', {
        correlationId,
        user_id: user.id,
        roles: userRoleNames,
      });
    }

    // ========================================================================
    // SUCCESS - Return context
    // ========================================================================

    return {
      context: {
        correlationId,
        user: {
          id: user.id,
          email: user.email,
        },
        companyId,
        supabaseClient,
      },
    };
  } catch (error) {
    logger.error('Middleware error', error as Error, { correlationId });
    return {
      context: {} as RequestContext,
      error: new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          correlation_id: correlationId,
        }),
        {
          status: 500,
          headers: {
            ...reqSecurityHeaders,
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
          },
        }
      ),
    };
  }
}

// ============================================================================
// ERROR RESPONSE HELPER
// ============================================================================

export function errorResponse(
  error: Error | string,
  status: number = 500,
  correlationId?: string
): Response {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;

  logger.error('Error response', typeof error === 'string' ? new Error(error) : error, {
    correlation_id: correlationId,
    status,
  });

  return new Response(
    JSON.stringify({
      error: status === 500 ? 'Internal Server Error' : 'Request Failed',
      message,
      ...(Deno.env.get('ENVIRONMENT') === 'development' && { stack }),
      correlation_id: correlationId,
    }),
    {
      status,
      headers: {
        ...getSecurityHeaders(),
        'Content-Type': 'application/json',
        ...(correlationId && { 'X-Correlation-ID': correlationId }),
      },
    }
  );
}

// ============================================================================
// SUCCESS RESPONSE HELPER
// ============================================================================

export function successResponse(
  data: any,
  correlationId?: string,
  additionalHeaders?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      ...data,
      metadata: {
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
        ...data.metadata,
      },
    }),
    {
      status: 200,
      headers: {
        ...getSecurityHeaders(),
        'Content-Type': 'application/json',
        ...(correlationId && { 'X-Correlation-ID': correlationId }),
        ...additionalHeaders,
      },
    }
  );
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// Example Edge Function using this middleware:

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuth, successResponse, errorResponse, logger } from "../_shared/middleware.ts";

serve(async (req) => {
  // Apply middleware with config
  const { context, error } = await withAuth(req, {
    requireAuth: true,
    rateLimitPerMinute: 100,
    allowedRoles: ['CEO', 'RH_MANAGER'],
  });

  // Return error if middleware failed
  if (error) return error;

  // Access authenticated context
  const { correlationId, user, companyId, supabaseClient } = context;

  try {
    // Your business logic here
    const { data, error: dbError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('company_id', companyId); // Scoped to user's company automatically

    if (dbError) throw dbError;

    logger.info('Request completed successfully', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      records_returned: data?.length || 0,
    });

    return successResponse({ data }, correlationId);
  } catch (err) {
    return errorResponse(err as Error, 500, correlationId);
  }
});
*/
