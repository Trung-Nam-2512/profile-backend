import { Router } from 'express'
import { ContactController } from '../controllers/ContactController'
import { authGuard, requireAdmin } from '../middleware/authGuard'
import rateLimit from 'express-rate-limit'
import { normalizeIp } from '../utils/ipNormalizer'

const router = Router()
const contactController = new ContactController()

// Rate limiting for contact form to prevent spam - Enhanced
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message:
        'Too many contact form submissions. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => `${normalizeIp(req)}-contact`, // Using custom IP handler for IPv6 support
})

// Admin rate limiting - More permissive for authenticated admins
const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 requests per 5 minutes for admins
  keyGenerator: req => `${req.user?.id || normalizeIp(req)}-admin`,
  skip: req => !req.user || req.user.role !== 'ADMIN',
})

// Public routes
// POST /api/v1/contact
router.post('/', contactRateLimit, contactController.sendContactMessage)

// GET /api/v1/contact/health (for testing)
router.get('/health', contactController.healthCheck)

// Admin routes
// GET /api/v1/contact - List all contact messages (admin only)
router.get(
  '/messages',
  authGuard,
  requireAdmin,
  adminRateLimit,
  contactController.getContacts
)

// GET /api/v1/contact/stats - Get contact statistics (admin only)
router.get(
  '/stats',
  authGuard,
  requireAdmin,
  adminRateLimit,
  contactController.getStats
)

// GET /api/v1/contact/:id - Get single contact message (admin only)
router.get(
  '/:id',
  authGuard,
  requireAdmin,
  adminRateLimit,
  contactController.getContactById
)

// PUT /api/v1/contact/:id/status - Update contact status (admin only)
router.put(
  '/:id/status',
  authGuard,
  requireAdmin,
  adminRateLimit,
  contactController.updateStatus
)

// DELETE /api/v1/contact/:id - Delete a contact message (admin only)
router.delete(
  '/:id',
  authGuard,
  requireAdmin,
  adminRateLimit,
  contactController.deleteContact
)

export default router
