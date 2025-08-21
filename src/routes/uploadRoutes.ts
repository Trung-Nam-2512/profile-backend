import { Router } from 'express'
import { UploadController } from '../controllers/UploadController'
import { authGuard, requireAdmin } from '../middleware/authGuard'
import { uploadSingle, uploadMultiple } from '../middleware/upload'

const router = Router()
const uploadController = new UploadController()

// Upload single image (ADMIN only)
// POST /api/v1/upload/image
router.post(
  '/image',
  authGuard,
  requireAdmin,
  uploadSingle,
  uploadController.uploadImage
)

// Upload multiple images (ADMIN only)
// POST /api/v1/upload/images
router.post(
  '/images',
  authGuard,
  requireAdmin,
  uploadMultiple,
  uploadController.uploadImages
)

export { router as uploadRoutes }
