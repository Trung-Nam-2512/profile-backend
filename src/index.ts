// src/index.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'

import { connectDatabase } from './utils/database'
import { errorHandler, notFoundHandler } from './utils/errorHandler'
import { sendSuccess } from './utils/response'

// Routes
import { authRoutes } from './routes/authRoutes'
import { postRoutes } from './routes/postRoutes'
import { profileRoutes } from './routes/profileRoutes'
import { projectRoutes } from './routes/projectRoutes'
import contactRoutes from './routes/contactRoutes'
import { userRoutes } from './routes/userRoutes'
import { uploadRoutes } from './routes/uploadRoutes'
import { analyticsRoutes } from './routes/analyticsRoutes'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 5002
// Support both development and production URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
// Allow all localhost ports for development + production domains
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production' 
  ? [
      'https://nguyentrungnam.com',
      'https://www.nguyentrungnam.com'
    ]
  : [
      /^http:\/\/localhost:\d+$/,  // All localhost ports for development
      'https://nguyentrungnam.com',
      'https://www.nguyentrungnam.com'
    ]
// Removed BACKEND_PUBLIC_ORIGIN - not needed for Cloudflare Tunnel setup

// 1) DB
connectDatabase()

// 1.5) Trust proxy settings for production (behind Nginx/Cloudflare)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true)
} else {
  // In development, trust localhost
  app.set('trust proxy', 'loopback')
}

// 2) Security (Helmet)
// - Cho phép nhúng ảnh cross-origin (fix CORP)
// - Tắt COEP để không chặn resource cross-origin
// - (Tuỳ chọn) CSP cho phép img-src từ backend
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // cho ảnh từ chính nó + data/blob + backend
        imgSrc: ["'self'", 'data:', 'blob:', '*'],
      },
    },
  })
)

// 3) CORS (cho API)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true)
      
      // Check if origin matches any allowed origins (string or regex)
      const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin)
        }
        return false
      })
      
      if (isAllowed) {
        return callback(null, true)
      }
      
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)

// 4) Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 5) Health / Base
app.get('/health', (req, res) => {
  sendSuccess(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})
app.get('/', (req, res) => {
  sendSuccess(res, { message: "Nam's Blog API" })
})

// 6) Static uploads (quan trọng cho ảnh)
//    - Dùng đường dẫn tuyệt đối
//    - Thêm CORP + Cache-Control
const uploadsDir = path.resolve(__dirname, '../uploads')
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      // CORS không bắt buộc cho <img>, nhưng để * cũng không sao (không gửi credential)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    },
  })
)

// 7) API Routes
// Nginx strips /api prefix, so backend uses direct paths
app.use('/auth', authRoutes)
app.use('/v1/posts', postRoutes)
app.use('/v1/profile', profileRoutes)
app.use('/v1/projects', projectRoutes)
app.use('/v1/contact', contactRoutes)
app.use('/v1/users', userRoutes)
app.use('/v1/upload', uploadRoutes)
app.use('/v1/analytics', analyticsRoutes)

// 8) Errors (đặt cuối)
app.use(notFoundHandler)
app.use(errorHandler)

// 9) Start
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Frontend allowed: ${FRONTEND_URL}`)
    console.log("Server running in", process.env.PORT )
  })
}

export default app
