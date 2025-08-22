import { Router } from 'express'
import { AnalyticsController } from '../controllers/AnalyticsController'
import { authGuard, requireAdmin } from '../middleware/authGuard'

const router = Router()
const analyticsController = new AnalyticsController()

// Admin-only analytics routes - Rate limiting removed for simplicity
router.use(authGuard, requireAdmin)

// Dashboard overview
router.get('/dashboard', analyticsController.getDashboardStats)

// Detailed visitor analytics
router.get('/visitors', analyticsController.getVisitors)
router.get('/visitors/:visitorId', analyticsController.getVisitorDetails)

// Session analytics
router.get('/sessions', analyticsController.getSessions)
router.get('/sessions/:sessionId', analyticsController.getSessionDetails)

// Page analytics
router.get('/pages', analyticsController.getPageAnalytics)
router.get('/pages/popular', analyticsController.getPopularPages)

// Real-time analytics
router.get('/realtime', analyticsController.getRealtimeStats)
router.get('/realtime/visitors', analyticsController.getActiveVisitors)

// Event analytics
router.get('/events', analyticsController.getEvents)
router.get('/events/summary', analyticsController.getEventSummary)

// Geographic analytics
router.get('/geo/countries', analyticsController.getCountryStats)
router.get('/geo/cities', analyticsController.getCityStats)

// Device analytics
router.get('/devices', analyticsController.getDeviceStats)
router.get('/browsers', analyticsController.getBrowserStats)

// Traffic source analytics
router.get('/traffic/sources', analyticsController.getTrafficSources)
router.get('/traffic/referrers', analyticsController.getTopReferrers)

// Time-based analytics
router.get('/trends/hourly', analyticsController.getHourlyTrends)
router.get('/trends/daily', analyticsController.getDailyTrends)
router.get('/trends/monthly', analyticsController.getMonthlyTrends)

// Performance analytics
router.get('/performance/pages', analyticsController.getPagePerformance)
router.get('/performance/load-times', analyticsController.getLoadTimes)

// Security analytics
router.get('/security/suspicious', analyticsController.getSuspiciousActivity)
router.get('/security/bots', analyticsController.getBotActivity)

// Export functionality
router.get('/export/csv', analyticsController.exportToCSV)
router.get('/export/json', analyticsController.exportToJSON)

// Custom reports
router.post('/reports/custom', analyticsController.generateCustomReport)

// Analytics health check
router.get('/health', analyticsController.healthCheck)

export { router as analyticsRoutes }