import crypto from 'crypto'
import { Request } from 'express'

export interface FingerprintData {
  visitorId: string
  sessionId: string
  fingerprint: string
}

export class VisitorFingerprint {
  
  generateVisitorId(req: Request): string {
    // Create a stable visitor ID based on semi-permanent characteristics
    const components = [
      this.normalizeIP(req.ip || ''),
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
    ]

    const fingerprint = components.join('|')
    return this.hashString(fingerprint)
  }

  generateSessionId(visitorId: string, timestamp?: Date): string {
    // Create a unique session ID
    const time = timestamp || new Date()
    const randomString = crypto.randomBytes(8).toString('hex')
    const components = [
      visitorId,
      time.toISOString().split('T')[0], // Date only
      time.getHours().toString(), // Hour for session grouping
      randomString,
    ]

    return this.hashString(components.join('|'))
  }

  generateFingerprint(req: Request): FingerprintData {
    const visitorId = this.generateVisitorId(req)
    const sessionId = this.generateSessionId(visitorId)
    
    // More detailed fingerprint for fraud detection
    const detailedComponents = [
      visitorId,
      req.get('Accept') || '',
      req.get('Accept-Charset') || '',
      req.get('DNT') || '', // Do Not Track
      req.get('Connection') || '',
      this.extractTLSFingerprint(req),
    ]

    const fingerprint = this.hashString(detailedComponents.join('|'))

    return {
      visitorId,
      sessionId,
      fingerprint,
    }
  }

  // Check if this is likely a new session for existing visitor
  isNewSession(visitorId: string, lastSessionId: string, threshold: number = 30): boolean {
    // This would typically check against database
    // For now, we'll use a simple time-based heuristic
    const now = Date.now()
    const sessionTime = this.extractTimeFromSessionId(lastSessionId)
    
    if (!sessionTime) return true
    
    const diffMinutes = (now - sessionTime) / (1000 * 60)
    return diffMinutes > threshold
  }

  private normalizeIP(ip: string): string {
    // For privacy, we'll use only the first 3 octets for IPv4
    if (ip === '::1') return '127.0.0'
    
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7)
    }

    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }

    // For IPv6, use first 64 bits
    if (ip.includes(':')) {
      const segments = ip.split(':')
      return segments.slice(0, 4).join(':') + '::'
    }

    return ip
  }

  private hashString(input: string): string {
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex')
      .substring(0, 16) // Use first 16 characters
  }

  private extractTLSFingerprint(req: Request): string {
    // Extract TLS/SSL characteristics if available
    const tlsInfo = []
    
    if (req.connection && 'encrypted' in req.connection) {
      const socket = req.connection as any
      if (socket.getCipher) {
        const cipher = socket.getCipher()
        tlsInfo.push(cipher?.name || '')
        tlsInfo.push(cipher?.version || '')
      }
    }

    return tlsInfo.join('|')
  }

  private extractTimeFromSessionId(sessionId: string): number | null {
    // This is a simplified extraction - in practice you'd need
    // a more robust method to encode/decode timestamps
    try {
      // Assuming sessionId contains encoded timestamp
      // This is just a placeholder implementation
      return null
    } catch {
      return null
    }
  }

  // Utility to detect suspicious patterns
  detectSuspiciousActivity(
    visitorId: string,
    sessionData: {
      userAgent: string
      referrer?: string
      rapidPageViews?: boolean
      noJavaScript?: boolean
    }
  ): {
    score: number
    reasons: string[]
  } {
    const reasons: string[] = []
    let suspicionScore = 0

    // Check for bot-like user agent
    const userAgent = sessionData.userAgent.toLowerCase()
    const botKeywords = ['bot', 'crawler', 'spider', 'scraper']
    if (botKeywords.some(keyword => userAgent.includes(keyword))) {
      suspicionScore += 50
      reasons.push('Bot-like user agent')
    }

    // Check for missing referrer on non-direct traffic
    if (!sessionData.referrer && userAgent.length < 50) {
      suspicionScore += 20
      reasons.push('Short user agent without referrer')
    }

    // Check for rapid page views (possible scraping)
    if (sessionData.rapidPageViews) {
      suspicionScore += 30
      reasons.push('Rapid page navigation')
    }

    // Check for no JavaScript execution
    if (sessionData.noJavaScript) {
      suspicionScore += 15
      reasons.push('No JavaScript execution detected')
    }

    // Check for suspicious header patterns
    if (userAgent.length < 20 || userAgent.length > 1000) {
      suspicionScore += 25
      reasons.push('Unusual user agent length')
    }

    return {
      score: Math.min(suspicionScore, 100),
      reasons,
    }
  }
}

export const visitorFingerprint = new VisitorFingerprint()