import { UAParser } from 'ua-parser-js'

export interface DeviceInfo {
  browser: string
  browserVersion?: string
  os: string
  osVersion?: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot'
  deviceVendor?: string
  deviceModel?: string
  cpu?: string
  isBot: boolean
}

export class DeviceDetector {
  private parser: UAParser
  private botPatterns: RegExp[]

  constructor() {
    this.parser = new UAParser()
    this.botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /feed/i,
      /slurp/i,
      /index/i,
      /archiv/i,
      /search/i,
      /google/i,
      /facebook/i,
      /twitter/i,
      /linkedin/i,
      /whatsapp/i,
      /telegram/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /okhttp/i,
      /postman/i,
    ]
  }

  parseUserAgent(userAgent: string): DeviceInfo {
    const result = this.parser.setUA(userAgent).getResult()
    
    const isBot = this.detectBot(userAgent)
    
    const deviceType = this.determineDeviceType(result, isBot)
    
    return {
      browser: result.browser.name || 'Unknown',
      browserVersion: result.browser.version,
      os: result.os.name || 'Unknown',
      osVersion: result.os.version,
      deviceType,
      deviceVendor: result.device.vendor,
      deviceModel: result.device.model,
      cpu: result.cpu.architecture,
      isBot,
    }
  }

  private detectBot(userAgent: string): boolean {
    // Check against bot patterns
    for (const pattern of this.botPatterns) {
      if (pattern.test(userAgent)) {
        return true
      }
    }

    // Additional bot detection logic
    if (this.hasCommonBotCharacteristics(userAgent)) {
      return true
    }

    return false
  }

  private hasCommonBotCharacteristics(userAgent: string): boolean {
    // Very short user agents (likely bots)
    if (userAgent.length < 20) {
      return true
    }

    // Missing common browser characteristics
    if (!userAgent.includes('Mozilla') && 
        !userAgent.includes('AppleWebKit') && 
        !userAgent.includes('Gecko') &&
        !userAgent.includes('Edge')) {
      return true
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /^[a-zA-Z]+\/[\d.]+$/,  // Simple pattern like "Bot/1.0"
      /libwww/i,
      /lwp-trivial/i,
      /urllib/i,
      /python-requests/i,
      /node-fetch/i,
      /axios/i,
    ]

    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  private determineDeviceType(result: any, isBot: boolean): 'desktop' | 'mobile' | 'tablet' | 'bot' {
    if (isBot) {
      return 'bot'
    }

    const deviceType = result.device.type
    
    if (deviceType === 'mobile') {
      return 'mobile'
    }
    
    if (deviceType === 'tablet') {
      return 'tablet'
    }

    // Additional mobile/tablet detection based on OS
    const osName = (result.os.name || '').toLowerCase()
    if (osName.includes('android') || osName.includes('ios')) {
      // Check screen size if available, otherwise default based on OS
      return deviceType === 'tablet' ? 'tablet' : 'mobile'
    }

    return 'desktop'
  }

  extractScreenResolution(acceptLanguage?: string): string | undefined {
    // This would typically come from client-side JavaScript
    // For now, we'll return undefined as it needs to be sent from frontend
    return undefined
  }

  extractLanguage(acceptLanguage?: string): string | undefined {
    if (!acceptLanguage) return undefined
    
    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0]?.trim() || '')
      .filter(lang => lang.length > 0)
    
    return languages[0] || undefined
  }
}

export const deviceDetector = new DeviceDetector()