import { Router } from 'express'
import { ContactController } from '../controllers/ContactController'
import { authGuard, requireAdmin } from '../middleware/authGuard'

const router = Router()
const contactController = new ContactController()

// Public routes
// POST /api/v1/contact - Rate limiting removed for simplicity
router.post('/', contactController.sendContactMessage)

// GET /api/v1/contact/health (for testing)
router.get('/health', contactController.healthCheck)

// Admin routes
// GET /api/v1/contact/messages - List all contact messages (admin only)
router.get(
  '/messages',
  authGuard,
  requireAdmin,
  contactController.getContacts
)

// GET /api/v1/contact/stats - Get contact statistics (admin only)
router.get(
  '/stats',
  authGuard,
  requireAdmin,
  contactController.getStats
)

// GET /api/v1/contact/:id - Get single contact message (admin only)
router.get(
  '/:id',
  authGuard,
  requireAdmin,
  contactController.getContactById
)

// PUT /api/v1/contact/:id/status - Update contact status (admin only)
router.put(
  '/:id/status',
  authGuard,
  requireAdmin,
  contactController.updateStatus
)

// DELETE /api/v1/contact/:id - Delete a contact message (admin only)
router.delete(
  '/:id',
  authGuard,
  requireAdmin,
  contactController.deleteContact
)

export default router
