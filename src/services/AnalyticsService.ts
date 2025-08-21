import { Request } from 'express'
import { Visitor, IVisitor } from '../models/Visitor'
import { Session, ISession } from '../models/Session'
import { PageView, IPageView } from '../models/PageView'
import { AnalyticsEvent, IAnalyticsEvent } from '../models/AnalyticsEvent'
import { deviceDetector } from '../utils/deviceDetector'
import { geoLocator } from '../utils/geolocator'
import { visitorFingerprint } from '../utils/visitorFingerprint'

export interface AnalyticsData {
  visitorId: string
  sessionId: string
  deviceInfo: any
  locationInfo: any
  pageView: {
    url: string
    path: string
    title?: string
    referrer?: string
  }
}

export interface DashboardStats {
  totalVisitors: number
  totalPageViews: number
  totalSessions: number
  averageSessionDuration: number
  bounceRate: number
  uniqueVisitorsToday: number
  pageViewsToday: number
  topPages: Array<{
    path: string
    views: number
    averageTime: number
  }>
  topCountries: Array<{
    country: string
    visitors: number
    percentage: number
  }>
  deviceBreakdown: Array<{
    deviceType: string
    count: number
    percentage: number
  }>
  trafficSources: Array<{
    source: string
    visitors: number
    percentage: number
  }>
}

export class AnalyticsService {
  
  async trackPageView(req: Request, customData?: any): Promise<AnalyticsData> {
    try {
      // Generate visitor and session identifiers
      const fingerprint = visitorFingerprint.generateFingerprint(req)
      
      // Parse device information
      const deviceInfo = deviceDetector.parseUserAgent(req.get('User-Agent') || '')
      
      // Get location information
      const locationInfo = geoLocator.getLocationFromRequest(req)
      
      // Extract UTM parameters
      const utmData = this.extractUTMParameters(req)
      
      // Find or create visitor
      const visitor = await this.findOrCreateVisitor({
        visitorId: fingerprint.visitorId,
        ipAddress: locationInfo.ip,
        userAgent: req.get('User-Agent') || '',
        deviceInfo,
        locationInfo,
        referrer: req.get('Referer'),
        utmData,
      })

      // Find or create session
      const session = await this.findOrCreateSession({
        sessionId: fingerprint.sessionId,
        visitorId: fingerprint.visitorId,
        visitor: visitor._id,
        entryPage: req.originalUrl || req.url,
        referrer: req.get('Referer'),
        deviceInfo,
        locationInfo,
        utmData,
      })

      // Track page view
      const pageView = await this.createPageView({
        sessionId: fingerprint.sessionId,
        visitorId: fingerprint.visitorId,
        session: session._id,
        visitor: visitor._id,
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        path: req.path,
        title: customData?.title,
        referrer: req.get('Referer'),
        userAgent: req.get('User-Agent') || '',
        ipAddress: locationInfo.ip,
      })

      // Update visitor and session counters
      await this.updateCounters(visitor._id, session._id)

      return {
        visitorId: fingerprint.visitorId,
        sessionId: fingerprint.sessionId,
        deviceInfo,
        locationInfo,
        pageView: {
          url: pageView.url,
          path: pageView.path,
          title: pageView.title,
          referrer: pageView.referrer,
        },
      }
    } catch (error) {
      console.error('Error tracking page view:', error)
      throw error
    }
  }

  async trackEvent(req: Request, eventData: {
    eventType: string
    eventCategory: string
    eventAction: string
    eventLabel?: string
    eventValue?: number
    customData?: any
    sessionId?: string
    visitorId?: string
  }): Promise<IAnalyticsEvent> {
    const fingerprint = eventData.sessionId && eventData.visitorId 
      ? { sessionId: eventData.sessionId, visitorId: eventData.visitorId }
      : visitorFingerprint.generateFingerprint(req)

    // Get location information
    const locationInfo = geoLocator.getLocationFromRequest(req)

    // Find session and visitor
    const session = await Session.findOne({ sessionId: fingerprint.sessionId })
    const visitor = await Visitor.findOne({ visitorId: fingerprint.visitorId })

    if (!session || !visitor) {
      throw new Error('Session or visitor not found for event tracking')
    }

    return await AnalyticsEvent.create({
      sessionId: fingerprint.sessionId,
      visitorId: fingerprint.visitorId,
      session: session._id,
      visitor: visitor._id,
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      eventAction: eventData.eventAction,
      eventLabel: eventData.eventLabel,
      eventValue: eventData.eventValue,
      customData: eventData.customData,
      url: req.protocol + '://' + req.get('host') + req.originalUrl,
      timestamp: new Date(),
      userAgent: req.get('User-Agent') || '',
      ipAddress: locationInfo.ip,
    })
  }

  async getDashboardStats(dateRange?: { start: Date; end: Date }): Promise<DashboardStats> {
    const timeFilter = dateRange ? {
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    } : {}

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Aggregate stats in parallel
    const [
      totalVisitors,
      totalPageViews,
      totalSessions,
      sessionDurations,
      bouncedSessions,
      visitorsToday,
      pageViewsToday,
      topPages,
      topCountries,
      deviceBreakdown,
      trafficSources,
    ] = await Promise.all([
      Visitor.countDocuments({ isBot: false, ...timeFilter }),
      PageView.countDocuments(dateRange ? { timestamp: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
      Session.countDocuments(dateRange ? { sessionStart: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
      Session.aggregate([
        { $match: { duration: { $gt: 0 }, ...(dateRange ? { sessionStart: { $gte: dateRange.start, $lte: dateRange.end } } : {}) } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
      ]),
      Session.countDocuments({ bounced: true, ...(dateRange ? { sessionStart: { $gte: dateRange.start, $lte: dateRange.end } } : {}) }),
      Visitor.countDocuments({ 
        isBot: false,
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      PageView.countDocuments({ 
        timestamp: { $gte: today, $lt: tomorrow }
      }),
      this.getTopPages(dateRange ? { timestamp: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
      this.getTopCountries(timeFilter),
      this.getDeviceBreakdown(timeFilter),
      this.getTrafficSources(dateRange ? { sessionStart: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
    ])

    const averageSessionDuration = sessionDurations[0]?.avgDuration || 0
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0

    return {
      totalVisitors,
      totalPageViews,
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      uniqueVisitorsToday: visitorsToday,
      pageViewsToday,
      topPages,
      topCountries,
      deviceBreakdown,
      trafficSources,
    }
  }

  async getRealtimeStats(): Promise<{
    activeVisitors: number
    currentPageViews: { path: string; count: number }[]
    recentEvents: any[]
  }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000)

    const [activeVisitors, currentPageViews, recentEvents] = await Promise.all([
      Session.countDocuments({
        isActive: true,
        updatedAt: { $gte: fiveMinutesAgo }
      }),
      PageView.aggregate([
        { $match: { timestamp: { $gte: oneMinuteAgo } } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { path: '$_id', count: '$count' } },
      ]),
      AnalyticsEvent.find({ timestamp: { $gte: fiveMinutesAgo } })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean(),
    ])

    return {
      activeVisitors,
      currentPageViews,
      recentEvents,
    }
  }

  private async findOrCreateVisitor(data: any): Promise<IVisitor> {
    const existingVisitor = await Visitor.findOne({ 
      visitorId: data.visitorId 
    })

    if (existingVisitor) {
      // Update last visit and counters
      existingVisitor.lastVisit = new Date()
      existingVisitor.visitCount += 1
      await existingVisitor.save()
      return existingVisitor
    }

    // Create new visitor
    return await Visitor.create({
      visitorId: data.visitorId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      country: data.locationInfo.country,
      city: data.locationInfo.city,
      region: data.locationInfo.region,
      timezone: data.locationInfo.timezone,
      browser: data.deviceInfo.browser,
      browserVersion: data.deviceInfo.browserVersion,
      os: data.deviceInfo.os,
      osVersion: data.deviceInfo.osVersion,
      deviceType: data.deviceInfo.deviceType,
      language: deviceDetector.extractLanguage(data.acceptLanguage),
      referrer: data.referrer,
      utmSource: data.utmData?.source,
      utmMedium: data.utmData?.medium,
      utmCampaign: data.utmData?.campaign,
      isBot: data.deviceInfo.isBot,
      firstVisit: new Date(),
      lastVisit: new Date(),
    })
  }

  private async findOrCreateSession(data: any): Promise<ISession> {
    const existingSession = await Session.findOne({
      sessionId: data.sessionId,
      isActive: true,
    })

    if (existingSession) {
      // Update session activity
      existingSession.updatedAt = new Date()
      await existingSession.save()
      return existingSession
    }

    // End any existing active sessions for this visitor
    await Session.updateMany(
      { visitorId: data.visitorId, isActive: true },
      { 
        isActive: false,
        sessionEnd: new Date(),
        $inc: { 
          duration: Math.floor((Date.now() - new Date().getTime()) / 1000)
        }
      }
    )

    // Create new session
    return await Session.create({
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      visitor: data.visitor,
      sessionStart: new Date(),
      entryPage: data.entryPage,
      referrer: data.referrer,
      utmData: data.utmData,
      deviceInfo: {
        browser: data.deviceInfo.browser,
        os: data.deviceInfo.os,
        deviceType: data.deviceInfo.deviceType,
        screenResolution: data.deviceInfo.screenResolution,
      },
      locationInfo: data.locationInfo,
      isActive: true,
    })
  }

  private async createPageView(data: any): Promise<IPageView> {
    return await PageView.create(data)
  }

  private async updateCounters(visitorId: any, sessionId: any): Promise<void> {
    await Promise.all([
      Visitor.findByIdAndUpdate(visitorId, {
        $inc: { totalPageViews: 1 }
      }),
      Session.findByIdAndUpdate(sessionId, {
        $inc: { pageViews: 1 },
        updatedAt: new Date(),
      }),
    ])
  }

  private extractUTMParameters(req: Request): any {
    const query = req.query
    return {
      source: query.utm_source as string,
      medium: query.utm_medium as string,
      campaign: query.utm_campaign as string,
      term: query.utm_term as string,
      content: query.utm_content as string,
    }
  }

  private async getTopPages(filter: any) {
    return await PageView.aggregate([
      { $match: filter },
      { $group: {
        _id: '$path',
        views: { $sum: 1 },
        totalTime: { $sum: { $ifNull: ['$timeSpent', 0] } },
      }},
      { $project: {
        path: '$_id',
        views: '$views',
        averageTime: { 
          $cond: [
            { $eq: ['$views', 0] },
            0,
            { $divide: ['$totalTime', '$views'] }
          ]
        }
      }},
      { $sort: { views: -1 } },
      { $limit: 10 },
    ])
  }

  private async getTopCountries(filter: any) {
    const countries = await Visitor.aggregate([
      { $match: { isBot: false, ...filter } },
      { $group: { _id: '$country', visitors: { $sum: 1 } } },
      { $sort: { visitors: -1 } },
      { $limit: 10 },
      { $project: {
        country: '$_id',
        visitors: '$visitors'
      }},
    ])

    // Calculate total and add percentages
    const total = countries.reduce((sum, country) => sum + country.visitors, 0)
    return countries.map(country => ({
      ...country,
      percentage: total > 0 ? Math.round((country.visitors / total) * 100 * 100) / 100 : 0
    }))
  }

  private async getDeviceBreakdown(filter: any) {
    const devices = await Visitor.aggregate([
      { $match: { isBot: false, ...filter } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $project: {
        deviceType: '$_id',
        count: '$count'
      }},
      { $sort: { count: -1 } },
    ])

    // Calculate total and add percentages
    const total = devices.reduce((sum, device) => sum + device.count, 0)
    return devices.map(device => ({
      ...device,
      percentage: total > 0 ? Math.round((device.count / total) * 100 * 100) / 100 : 0
    }))
  }

  private async getTrafficSources(filter: any) {
    const sources = await Session.aggregate([
      { $match: filter },
      { $group: {
        _id: {
          $cond: [
            { $ne: ['$utmData.source', null] },
            '$utmData.source',
            {
              $cond: [
                { $ne: ['$referrer', null] },
                'referral',
                'direct'
              ]
            }
          ]
        },
        visitors: { $sum: 1 }
      }},
      { $project: {
        source: '$_id',
        visitors: '$visitors'
      }},
      { $sort: { visitors: -1 } },
      { $limit: 10 },
    ])

    // Calculate total and add percentages  
    const total = sources.reduce((sum, source) => sum + source.visitors, 0)
    return sources.map(source => ({
      ...source,
      percentage: total > 0 ? Math.round((source.visitors / total) * 100 * 100) / 100 : 0
    }))
  }
}

export const analyticsService = new AnalyticsService()