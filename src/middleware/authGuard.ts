import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from '../utils/errorHandler'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: string
      }
    }
  }
}

export const authGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      throw new AppError(
        'Authorization header is required',
        401,
        'MISSING_AUTH_HEADER'
      )
    }

    // Check if it's a Bearer token
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      throw new AppError('Bearer token is required', 401, 'INVALID_AUTH_FORMAT')
    }

    // Verify the token
    const payload = verifyAccessToken(token)

    // Attach user info to request
    req.user = {
      id: payload.userId,
      role: payload.role,
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else {
      next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'))
    }
  }
}

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED')
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'Insufficient permissions',
        403,
        'INSUFFICIENT_PERMISSIONS'
      )
    }

    next()
  }
}

// Convenience middleware for admin-only routes
export const requireAdmin = requireRole(['ADMIN'])
