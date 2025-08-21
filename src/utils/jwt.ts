import jwt from 'jsonwebtoken'

export interface JwtPayload {
  userId: string
  role: string
}

export const generateAccessToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined')
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  const payload = { userId, role }

  return jwt.sign(payload, secret, {
    expiresIn,
    subject: userId,
    algorithm: 'HS256',
  } as jwt.SignOptions)
}

export const verifyAccessToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined')
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & JwtPayload
    return {
      userId: decoded.userId,
      role: decoded.role,
    }
  } catch {
    throw new Error('Invalid or expired token')
  }
}
