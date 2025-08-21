import { Request, Response, NextFunction } from 'express'
import { UserRepository } from '../repositories/UserRepository'
import { sendSuccess } from '../utils/response'
import { AppError } from '../utils/errorHandler'

export class UserController {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  // GET /api/v1/users (ADMIN only)
  getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10

      const users = await this.userRepository.findAll(page, limit)
      const total = await this.userRepository.countUsers()

      sendSuccess(res, {
        users,
        total,
        page,
        limit,
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/v1/users/stats (ADMIN only)
  getUserStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const total = await this.userRepository.countUsers()
      const admins = await this.userRepository.countByRole('ADMIN')
      const active = await this.userRepository.countActive()

      sendSuccess(res, {
        total,
        admins,
        active,
        inactive: total - active,
      })
    } catch (error) {
      next(error)
    }
  }

  // PUT /api/v1/users/:id/status (ADMIN only)
  updateUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      const { isActive } = req.body

      if (!id) {
        throw new AppError('User ID is required', 400, 'INVALID_USER_ID')
      }

      if (typeof isActive !== 'boolean') {
        throw new AppError('isActive must be a boolean', 400, 'INVALID_STATUS')
      }

      const user = await this.userRepository.updateStatus(id, isActive)
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND')
      }

      sendSuccess(res, { user })
    } catch (error) {
      next(error)
    }
  }

  // DELETE /api/v1/users/:id (ADMIN only)
  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      const currentUserId = req.user!.id

      if (!id) {
        throw new AppError('User ID is required', 400, 'INVALID_USER_ID')
      }

      // Prevent self-deletion
      if (id === currentUserId) {
        throw new AppError(
          'Cannot delete your own account',
          400,
          'CANNOT_DELETE_SELF'
        )
      }

      const user = await this.userRepository.findById(id)
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND')
      }

      // Prevent deleting other admins
      if (user.role === 'ADMIN') {
        throw new AppError(
          'Cannot delete admin users',
          403,
          'CANNOT_DELETE_ADMIN'
        )
      }

      const deleted = await this.userRepository.delete(id)
      sendSuccess(res, { deleted })
    } catch (error) {
      next(error)
    }
  }
}
