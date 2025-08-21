import geoip from 'geoip-lite'
import { Request } from 'express'

export interface LocationInfo {
  ip: string
  country?: string
  city?: string
  region?: string
  timezone?: string
  latitude?: number
  longitude?: number
  isp?: string
}

export class GeoLocator {
  
  constructor() {
    // Update GeoIP database periodically
    this.setupAutoUpdate()
  }

  getLocationFromIP(ip: string): LocationInfo {
    try {
      // Normalize IP address
      const normalizedIP = this.normalizeIP(ip)
      
      if (!this.isPublicIP(normalizedIP)) {
        return this.getLocalLocationInfo(normalizedIP)
      }

      const geo = geoip.lookup(normalizedIP)
      
      if (!geo) {
        return { ip: normalizedIP }
      }

      return {
        ip: normalizedIP,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        timezone: geo.timezone,
        latitude: geo.ll?.[0],
        longitude: geo.ll?.[1],
      }
    } catch (error) {
      console.error('Error getting location from IP:', error)
      return { ip: ip || '127.0.0.1' }
    }
  }

  getLocationFromRequest(req: Request): LocationInfo {
    const ip = this.extractIPFromRequest(req)
    const location = this.getLocationFromIP(ip)
    return { ...location, ip }
  }

  private extractIPFromRequest(req: Request): string {
    // Try different headers in order of preference
    const possibleIPs = [
      req.headers['cf-connecting-ip'], // Cloudflare
      req.headers['x-real-ip'], // Nginx
      req.headers['x-forwarded-for'], // Proxy
      req.connection.remoteAddress,
      req.socket.remoteAddress,
      req.ip,
    ].filter(Boolean)

    for (const ip of possibleIPs) {
      if (typeof ip === 'string') {
        // Handle comma-separated IPs (x-forwarded-for)
        const firstIP = ip.split(',')[0]?.trim() || ''
        if (this.isValidIP(firstIP)) {
          return firstIP
        }
      }
    }

    return '127.0.0.1' // Fallback
  }

  private normalizeIP(ip: string): string {
    // Handle IPv6 mapped IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1'
    }

    // Remove IPv6 prefix for IPv4
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7)
    }

    return ip
  }

  private isValidIP(ip: string): boolean {
    // Simple IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    
    if (!ipv4Regex.test(ip)) {
      return false
    }

    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }

  private isPublicIP(ip: string): boolean {
    // Check for private IP ranges
    const privateRanges = [
      /^127\./, // Loopback
      /^10\./, // Private Class A
      /^192\.168\./, // Private Class C
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
      /^169\.254\./, // Link-local
      /^::1$/, // IPv6 loopback
      /^fc00:/, // IPv6 private
      /^fe80:/, // IPv6 link-local
    ]

    return !privateRanges.some(range => range.test(ip))
  }

  private getLocalLocationInfo(ip: string): LocationInfo {
    // Default location info for local/private IPs
    return {
      ip,
      country: 'US',
      city: 'Local',
      region: 'Local',
      timezone: 'America/New_York',
    }
  }

  private setupAutoUpdate(): void {
    // GeoIP-lite automatically updates, but we could add custom logic here
    // For production, consider using a more robust service like MaxMind
    console.log('GeoIP service initialized')
  }

  // Utility method to get distance between two coordinates
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}

export const geoLocator = new GeoLocator()