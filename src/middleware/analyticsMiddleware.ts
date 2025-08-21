import { Request, Response, NextFunction } from 'express'
import { analyticsService } from '../services/AnalyticsService'

export interface AnalyticsOptions {
  skipBots?: boolean
  skipAdmins?: boolean
  skipPaths?: string[]
  trackOnlyPublic?: boolean
}

const defaultOptions: AnalyticsOptions = {
  skipBots: true,
  skipAdmins: true,
  skipPaths: [
    '/api',
    '/health',
    '/favicon.ico',
    '/.well-known',
    '/robots.txt',
    '/sitemap.xml',
  ],
  trackOnlyPublic: true,
}

export const analyticsMiddleware = (options: AnalyticsOptions = {}) => {
  const config = { ...defaultOptions, ...options }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if path should be ignored
      if (shouldSkipPath(req.path, config.skipPaths || [])) {
        return next()
      }

      // Skip API routes if trackOnlyPublic is enabled
      if (config.trackOnlyPublic && req.path.startsWith('/api')) {
        return next()
      }

      // Skip bot requests if configured
      if (config.skipBots && isBot(req.get('User-Agent') || '')) {
        return next()
      }

      // Skip admin users if configured
      if (config.skipAdmins && isAdminUser(req)) {
        return next()
      }

      // Track page view asynchronously to avoid blocking the response
      setImmediate(async () => {
        try {
          const analyticsData = await analyticsService.trackPageView(req, {
            title: extractTitle(req),
            timestamp: new Date(),
          })

          // Optional: Log for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Analytics tracked:', {
              path: req.path,
              visitor: analyticsData.visitorId.substring(0, 8),
              device: analyticsData.deviceInfo.deviceType,
              country: analyticsData.locationInfo.country,
            })
          }
        } catch (error) {
          // Log error but don't throw to avoid affecting user experience
          console.error('Analytics tracking error:', error)
        }
      })

      next()
    } catch (error) {
      // Never block request due to analytics errors
      console.error('Analytics middleware error:', error)
      next()
    }
  }
}

// Helper function to determine if path should be skipped
function shouldSkipPath(path: string, skipPaths: string[]): boolean {
  return skipPaths.some(skipPath => {
    if (skipPath.endsWith('*')) {
      return path.startsWith(skipPath.slice(0, -1))
    }
    return path === skipPath || path.startsWith(skipPath)
  })
}

// Simple bot detection
function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /postman/i,
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

// Check if request is from admin user
function isAdminUser(req: Request): boolean {
  // Check if user has admin token/session
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return false

    // This would need to be integrated with your auth system
    // For now, we'll skip this check
    return false
  } catch {
    return false
  }
}

// Extract page title from request (would typically come from frontend)
function extractTitle(req: Request): string | undefined {
  // This could be enhanced to extract title from HTML response
  // or receive it from frontend via custom header
  return req.get('X-Page-Title') || undefined
}

// Event tracking middleware for specific events
export const trackEvent = (eventData: {
  eventType: string
  eventCategory: string
  eventAction: string
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Track event asynchronously
      setImmediate(async () => {
        try {
          await analyticsService.trackEvent(req, {
            ...eventData,
          })
        } catch (error) {
          console.error('Event tracking error:', error)
        }
      })

      next()
    } catch (error) {
      console.error('Event tracking middleware error:', error)
      next()
    }
  }
}

// Real-time visitor count middleware
export const updateVisitorCount = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Add visitor count to response headers for client-side display
      const stats = await analyticsService.getRealtimeStats()
      res.setHeader('X-Active-Visitors', stats.activeVisitors.toString())
      
      next()
    } catch (error) {
      console.error('Visitor count middleware error:', error)
      next()
    }
  }
}