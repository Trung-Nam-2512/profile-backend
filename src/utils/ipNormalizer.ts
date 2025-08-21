import { Request } from 'express'

/**
 * Normalizes IP address from request, handling IPv6 mapped IPv4 addresses
 * and proxy headers like X-Forwarded-For
 */
export function normalizeIp(req: Request): string {
  // Check for forwarded IP first (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for']
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded

  if (forwardedIp) {
    // Take the first IP if comma-separated list
    const ip = forwardedIp.split(',')[0]?.trim()
    if (ip) {
      return normalizeIpAddress(ip)
    }
  }

  // Fallback to connection remote address
  const remoteAddress =
    req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1'
  return normalizeIpAddress(remoteAddress)
}

/**
 * Normalizes an IP address string
 * Converts IPv6-mapped IPv4 addresses to IPv4 format
 */
function normalizeIpAddress(ip: string): string {
  // Handle IPv6-mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    const ipv4 = ip.substring(7)
    // Validate it's actually an IPv4 address
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ipv4)) {
      return ipv4
    }
  }

  // Return as-is for pure IPv6 or IPv4
  return ip
}
