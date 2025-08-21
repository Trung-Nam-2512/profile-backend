import { Response } from 'express'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  res.status(statusCode).json(response)
}

export const sendError = (
  res: Response,
  message: string,
  code: string,
  statusCode: number = 400
) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  }
  res.status(statusCode).json(response)
}
