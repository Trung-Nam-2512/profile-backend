import { Request, Response, NextFunction } from 'express'
import { ProfileService } from '../services/ProfileService'
import { UpsertProfileSchema } from '../types/Profile'
import { sendSuccess, sendError } from '../utils/response'
import { AppError } from '../utils/errorHandler'
import { ZodError } from 'zod'

export class ProfileController {
  private profileService: ProfileService

  constructor() {
    this.profileService = new ProfileService()
  }

  // GET /api/v1/profile (public)
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const profile = await this.profileService.getProfile()

      if (!profile) {
        throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND')
      }

      sendSuccess(res, { profile })
    } catch (error) {
      next(error)
    }
  }

  // PUT /api/v1/profile (ADMIN only)
  upsertProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = UpsertProfileSchema.parse(req.body)

      const profile = await this.profileService.upsertProfile(validatedData)

      sendSuccess(res, { profile })
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }
}
