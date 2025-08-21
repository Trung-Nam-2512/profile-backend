import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export class AppError extends Error implements ApiError {
  statusCode: number
  code: string
  isOperational: boolean

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const createError = (
  message: string,
  statusCode: number,
  code: string
) => {
  return new AppError(message, statusCode, code)
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_SERVER_ERROR'
  const message = err.message || 'Something went wrong'

  // Don't expose stack trace in production
  const isDevelopment = process.env.NODE_ENV === 'development'

  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(isDevelopment && { stack: err.stack }),
    },
  }

  // Log error for debugging (but not sensitive data)
  console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`)

  res.status(statusCode).json(errorResponse)
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
  })
}
