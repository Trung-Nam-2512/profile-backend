import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/AuthService'
import { RegisterSchema, LoginSchema } from '../types/User'
import { sendSuccess, sendError } from '../utils/response'
import { ZodError } from 'zod'

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input with Zod
      const validatedData = RegisterSchema.parse(req.body)

      // Register user
      const result = await this.authService.register(validatedData)

      // Return success response - only id and email as per requirements
      sendSuccess(
        res,
        {
          id: result.id,
          email: result.email,
        },
        201
      )
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input with Zod
      const validatedData = LoginSchema.parse(req.body)

      // Login user
      const result = await this.authService.login(validatedData)

      // Return success response with access token and user info
      sendSuccess(
        res,
        {
          accessToken: result.accessToken,
          user: result.user,
        },
        200
      )
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }
}
