import { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../utils/response'
import { AppError } from '../utils/errorHandler'

export class UploadController {
  // Upload single image
  uploadImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400, 'NO_FILE')
      }

      // Return image URL
      const imageUrl = `/uploads/images/${req.file.filename}`

      sendSuccess(res, {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      })
    } catch (error) {
      next(error)
    }
  }

  // Upload multiple images
  uploadImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const files = req.files as any[]

      if (!files || files.length === 0) {
        throw new AppError('No image files provided', 400, 'NO_FILES')
      }

      const images = files.map(file => ({
        url: `/uploads/images/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      }))

      sendSuccess(res, { images })
    } catch (error) {
      next(error)
    }
  }
}
