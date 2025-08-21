import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { authGuard, requireAdmin } from '../middleware/authGuard'

const router = Router()
const userController = new UserController()

// All routes require admin access
router.use(authGuard, requireAdmin)

// GET /api/v1/users
router.get('/', userController.getUsers)

// GET /api/v1/users/stats
router.get('/stats', userController.getUserStats)

// PUT /api/v1/users/:id/status
router.put('/:id/status', userController.updateUserStatus)

// DELETE /api/v1/users/:id
router.delete('/:id', userController.deleteUser)

export { router as userRoutes }
