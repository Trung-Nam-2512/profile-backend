import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'

const router = Router()
const authController = new AuthController()

// POST /api/auth/register
router.post('/register', authController.register)

// POST /api/auth/login
router.post('/login', authController.login)

export { router as authRoutes }
