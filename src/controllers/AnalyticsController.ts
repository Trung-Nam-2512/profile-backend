import { Request, Response, NextFunction } from 'express'
import { analyticsService } from '../services/AnalyticsService'
import { Visitor } from '../models/Visitor'
import { Session } from '../models/Session'
import { PageView } from '../models/PageView'
import { AnalyticsEvent } from '../models/AnalyticsEvent'
import { sendSuccess, sendError } from '../utils/response'

export class AnalyticsController {

  // Dashboard overview
  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query
      
      const dateRange = this.parseDateRange(startDate as string, endDate as string)
      const stats = await analyticsService.getDashboardStats(dateRange)

      sendSuccess(res, stats)
    } catch (error) {
      next(error)
    }
  }

  // Get visitor list with pagination and filtering
  getVisitors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
      const country = req.query.country as string
      const deviceType = req.query.deviceType as string
      const { startDate, endDate } = req.query
      
      const dateFilter = this.parseDateRangeForQuery(startDate as string, endDate as string)
      
      const filter: any = { isBot: false }
      if (country) filter.country = country
      if (deviceType) filter.deviceType = deviceType
      if (dateFilter) filter.createdAt = dateFilter

      const [visitors, total] = await Promise.all([
        Visitor.find(filter)
          .sort({ lastVisit: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean(),
        Visitor.countDocuments(filter),
      ])

      sendSuccess(res, {
        visitors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Get visitor details
  getVisitorDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { visitorId } = req.params
      
      const [visitor, sessions, pageViews, events] = await Promise.all([
        Visitor.findOne({ visitorId }).lean(),
        Session.find({ visitorId }).sort({ sessionStart: -1 }).limit(10).lean(),
        PageView.find({ visitorId }).sort({ timestamp: -1 }).limit(50).lean(),
        AnalyticsEvent.find({ visitorId }).sort({ timestamp: -1 }).limit(20).lean(),
      ])

      if (!visitor) {
        return sendError(res, 'Visitor not found', 'VISITOR_NOT_FOUND', 404)
      }

      sendSuccess(res, {
        visitor,
        sessions,
        pageViews,
        events,
      })
    } catch (error) {
      next(error)
    }
  }

  // Get sessions with filtering
  getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
      const deviceType = req.query.deviceType as string
      const country = req.query.country as string
      const { startDate, endDate } = req.query
      
      const dateFilter = this.parseDateRangeForQuery(startDate as string, endDate as string)
      
      const filter: any = {}
      if (deviceType) filter['deviceInfo.deviceType'] = deviceType
      if (country) filter['locationInfo.country'] = country
      if (dateFilter) filter.sessionStart = dateFilter

      const [sessions, total] = await Promise.all([
        Session.find(filter)
          .populate('visitor', 'visitorId country city deviceType')
          .sort({ sessionStart: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean(),
        Session.countDocuments(filter),
      ])

      sendSuccess(res, {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Get session details
  getSessionDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params
      
      const [session, pageViews, events] = await Promise.all([
        Session.findOne({ sessionId })
          .populate('visitor')
          .lean(),
        PageView.find({ sessionId })
          .sort({ timestamp: 1 })
          .lean(),
        AnalyticsEvent.find({ sessionId })
          .sort({ timestamp: 1 })
          .lean(),
      ])

      if (!session) {
        return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404)
      }

      sendSuccess(res, {
        session,
        pageViews,
        events,
        journey: this.buildUserJourney(pageViews, events),
      })
    } catch (error) {
      next(error)
    }
  }

  // Get page analytics
  getPageAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query
      const dateFilter = this.parseDateRangeForQuery(startDate as string, endDate as string)
      
      const matchFilter: any = {}
      if (dateFilter) matchFilter.timestamp = dateFilter

      const pageStats = await PageView.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$path',
            views: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
            totalTimeSpent: { $sum: { $ifNull: ['$timeSpent', 0] } },
            avgScrollDepth: { $avg: { $ifNull: ['$scrollDepth', 0] } },
            exitPages: {
              $sum: { $cond: [{ $eq: ['$exitPage', true] }, 1, 0] }
            },
          }
        },
        {
          $project: {
            path: '$_id',
            views: '$views',
            uniqueVisitors: { $size: '$uniqueVisitors' },
            averageTimeSpent: { 
              $cond: [
                { $eq: ['$views', 0] },
                0,
                { $divide: ['$totalTimeSpent', '$views'] }
              ]
            },
            avgScrollDepth: { $round: ['$avgScrollDepth', 2] },
            bounceRate: {
              $cond: [
                { $eq: ['$views', 0] },
                0,
                { $multiply: [{ $divide: ['$exitPages', '$views'] }, 100] }
              ]
            }
          }
        },
        { $sort: { views: -1 } },
        { $limit: 50 },
      ])

      sendSuccess(res, { pages: pageStats })
    } catch (error) {
      next(error)
    }
  }

  // Get popular pages
  getPopularPages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50)
      const { startDate, endDate } = req.query
      
      const dateFilter = this.parseDateRangeForQuery(startDate as string, endDate as string)
      const matchFilter: any = {}
      if (dateFilter) matchFilter.timestamp = dateFilter

      const popularPages = await PageView.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$path',
            views: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
          }
        },
        {
          $project: {
            path: '$_id',
            views: '$views',
            uniqueVisitors: { $size: '$uniqueVisitors' }
          }
        },
        { $sort: { views: -1 } },
        { $limit: limit },
      ])

      sendSuccess(res, { pages: popularPages })
    } catch (error) {
      next(error)
    }
  }

  // Get real-time stats
  getRealtimeStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await analyticsService.getRealtimeStats()
      sendSuccess(res, stats)
    } catch (error) {
      next(error)
    }
  }

  // Get active visitors
  getActiveVisitors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      
      const activeVisitors = await Session.find({
        isActive: true,
        updatedAt: { $gte: fiveMinutesAgo }
      })
      .populate('visitor', 'country city deviceType browser os')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean()

      sendSuccess(res, { 
        count: activeVisitors.length,
        visitors: activeVisitors 
      })
    } catch (error) {
      next(error)
    }
  }

  // Get events
  getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
      const eventType = req.query.eventType as string
      const { startDate, endDate } = req.query
      
      const dateFilter = this.parseDateRangeForQuery(startDate as string, endDate as string)
      
      const filter: any = {}
      if (eventType) filter.eventType = eventType
      if (dateFilter) filter.timestamp = dateFilter

      const [events, total] = await Promise.all([
        AnalyticsEvent.find(filter)
          .populate('visitor', 'visitorId country city deviceType')
          .populate('session', 'sessionId deviceInfo locationInfo')
          .sort({ timestamp: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean(),
        AnalyticsEvent.countDocuments(filter),
      ])

      sendSuccess(res, {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Get country statistics
  getCountryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query
      const dateFilter = this.parseDateRangeForQuery(startDate as string, endDate as string)
      
      const matchFilter: any = { isBot: false }
      if (dateFilter) matchFilter.createdAt = dateFilter

      const countryStats = await Visitor.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$country', visitors: { $sum: 1 } } },
        { $sort: { visitors: -1 } },
        { $limit: 20 },
        {
          $project: {
            country: '$_id',
            visitors: '$visitors'
          }
        },
      ])

      sendSuccess(res, { countries: countryStats })
    } catch (error) {
      next(error)
    }
  }

  // Get device statistics
  getDeviceStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query
      const dateFilter = this.parseDateRangeForQuery(startDate as string, endDate as string)
      
      const matchFilter: any = { isBot: false }
      if (dateFilter) matchFilter.createdAt = dateFilter

      const deviceStats = await Visitor.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              deviceType: '$deviceType',
              browser: '$browser',
              os: '$os',
            },
            visitors: { $sum: 1 }
          }
        },
        { $sort: { visitors: -1 } },
        {
          $project: {
            deviceType: '$_id.deviceType',
            browser: '$_id.browser',
            os: '$_id.os',
            visitors: '$visitors'
          }
        },
      ])

      sendSuccess(res, { devices: deviceStats })
    } catch (error) {
      next(error)
    }
  }

  // Health check
  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [visitorCount, sessionCount, pageViewCount] = await Promise.all([
        Visitor.countDocuments(),
        Session.countDocuments(),
        PageView.countDocuments(),
      ])

      sendSuccess(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: {
          visitors: visitorCount,
          sessions: sessionCount,
          pageViews: pageViewCount,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Helper methods
  private parseDateRange(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    // Set end date to end of day (23:59:59.999)
    if (endDate) {
      end.setUTCHours(23, 59, 59, 999)
    }

    return { start, end }
  }

  private parseDateRangeForQuery(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    // Set end date to end of day (23:59:59.999)
    if (endDate) {
      end.setUTCHours(23, 59, 59, 999)
    }

    return { $gte: start, $lte: end }
  }

  private buildUserJourney(pageViews: any[], events: any[]) {
    // Combine and sort by timestamp
    const journey = [
      ...pageViews.map(pv => ({ ...pv, type: 'pageview' })),
      ...events.map(ev => ({ ...ev, type: 'event' })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return journey
  }

  // Placeholder methods for remaining endpoints
  getCityStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation similar to getCountryStats but for cities
    sendSuccess(res, { message: 'City stats endpoint - to be implemented' })
  }

  getBrowserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for browser statistics
    sendSuccess(res, { message: 'Browser stats endpoint - to be implemented' })
  }

  getTrafficSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for traffic sources
    sendSuccess(res, { message: 'Traffic sources endpoint - to be implemented' })
  }

  getTopReferrers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for top referrers
    sendSuccess(res, { message: 'Top referrers endpoint - to be implemented' })
  }

  getHourlyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for hourly trends
    sendSuccess(res, { message: 'Hourly trends endpoint - to be implemented' })
  }

  getDailyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for daily trends
    sendSuccess(res, { message: 'Daily trends endpoint - to be implemented' })
  }

  getMonthlyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for monthly trends
    sendSuccess(res, { message: 'Monthly trends endpoint - to be implemented' })
  }

  getPagePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for page performance
    sendSuccess(res, { message: 'Page performance endpoint - to be implemented' })
  }

  getLoadTimes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for load times
    sendSuccess(res, { message: 'Load times endpoint - to be implemented' })
  }

  getSuspiciousActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for suspicious activity
    sendSuccess(res, { message: 'Suspicious activity endpoint - to be implemented' })
  }

  getBotActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for bot activity
    sendSuccess(res, { message: 'Bot activity endpoint - to be implemented' })
  }

  getEventSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for event summary
    sendSuccess(res, { message: 'Event summary endpoint - to be implemented' })
  }

  exportToCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for CSV export
    sendSuccess(res, { message: 'CSV export endpoint - to be implemented' })
  }

  exportToJSON = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for JSON export
    sendSuccess(res, { message: 'JSON export endpoint - to be implemented' })
  }

  generateCustomReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Implementation for custom reports
    sendSuccess(res, { message: 'Custom report endpoint - to be implemented' })
  }
}