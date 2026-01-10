// ============================================
// AUTH MIDDLEWARE - Supabase JWT Verification
// ============================================

import { Request, Response, NextFunction } from 'express'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid reading env vars before dotenv.config()
let supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email?: string
      }
    }
  }
}

/**
 * Middleware qui vérifie le token Supabase et attache user à req
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      })
      return
    }

    const token = authHeader.replace('Bearer ', '')

    // Vérifier le token avec Supabase
    const supabase = getSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })
      return
    }

    // Attacher l'user à la requête
    req.user = {
      id: user.id,
      email: user.email
    }

    next()
  } catch (error) {
    console.error('[Auth Middleware] Error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication verification failed'
    })
  }
}

/**
 * Middleware optionnel - ne bloque pas si pas de token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        req.user = {
          id: user.id,
          email: user.email
        }
      }
    }

    next()
  } catch (error) {
    // Ignorer les erreurs en mode optionnel
    next()
  }
}
