import { Router } from 'express'
import { ProfileController } from '../controllers/ProfileController'
import { authGuard, requireAdmin } from '../middleware/authGuard'

const router = Router()
const profileController = new ProfileController()

// Public route
// GET /api/v1/profile
router.get('/', profileController.getProfile)

// Admin route
// PUT /api/v1/profile
router.put('/', authGuard, requireAdmin, profileController.upsertProfile)

export { router as profileRoutes }
