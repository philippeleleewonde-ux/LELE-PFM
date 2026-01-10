// ============================================
// HCM DATA SCANNER BACKEND - Express Server
// Port: 3001 (configurable via .env)
// ============================================

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config()

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import datascannerRoutes from './routes/datascanner.routes.ts'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.ts'

const app: Application = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080'

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// CORS configuration
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ============================================
// ROUTES
// ============================================

// Health check root
app.get('/', (_req, res) => {
  res.json({
    service: 'HCM Data Scanner Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/datascanner/health',
      extract_zone1: 'POST /api/datascanner/jobs/:jobId/zones/1/extract'
    }
  })
})

// API Routes
app.use('/api/datascanner', datascannerRoutes)

// 404 Handler
app.use(notFoundHandler)

// Error Handler (must be last)
app.use(errorHandler)

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 HCM DATA SCANNER BACKEND')
  console.log('='.repeat(60))
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`✅ Frontend URL: ${FRONTEND_URL}`)
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`✅ Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`)
  console.log(`✅ Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`)
  console.log('='.repeat(60) + '\n')
  console.log('📍 Endpoints:')
  console.log(`   GET  /                                         - API Info`)
  console.log(`   GET  /api/datascanner/health                  - Health Check`)
  console.log(`   POST /api/datascanner/jobs/:id/zones/1/extract - Extract Zone 1`)
  console.log('\n' + '='.repeat(60) + '\n')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...')
  process.exit(0)
})

export default app
