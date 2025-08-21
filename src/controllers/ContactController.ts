import { Request, Response, NextFunction } from 'express'
import { ContactService } from '../services/ContactService'
import { ContactMessageSchema } from '../types/Contact'
import { sendSuccess, sendError } from '../utils/response'
import { ZodError } from 'zod'

export class ContactController {
  private contactService: ContactService

  constructor() {
    this.contactService = new ContactService()
  }

  // POST /api/v1/contact (public)
  sendContactMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input
      const validatedData = ContactMessageSchema.parse(req.body)

      // Get client metadata
      const metadata = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      }

      // Security logging
      console.log(
        `[CONTACT-SECURITY] New contact submission from IP: ${metadata.ipAddress}, Email: ${validatedData.email}, UA: ${metadata.userAgent}`
      )

      // Save contact and send email
      const result = await this.contactService.sendContactMessage(
        validatedData,
        metadata
      )

      sendSuccess(
        res,
        {
          message: result.emailSent
            ? 'Your message has been sent successfully! I will get back to you soon.'
            : 'Your message has been received. We will get back to you soon.',
          // Removed contactId to prevent information disclosure
        },
        201
      )
    } catch (error) {
      // Security logging for failed attempts
      const clientIP = req.ip || req.connection.remoteAddress
      console.warn(
        `[CONTACT-SECURITY-FAIL] Contact submission failed from IP: ${clientIP}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )

      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }

  // GET /api/v1/contact (admin only - to be protected later)
  getContacts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const status = req.query.status as 'new' | 'read' | 'replied' | undefined

      const result = await this.contactService.getContacts(page, limit, status)

      sendSuccess(res, result)
    } catch (error) {
      next(error)
    }
  }

  // GET /api/v1/contact/stats (admin only)
  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.contactService.getStatistics()
      sendSuccess(res, stats)
    } catch (error) {
      next(error)
    }
  }

  // GET /api/v1/contact/:id (admin only)
  getContactById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        return sendError(res, 'Contact ID is required', 'MISSING_ID', 400)
      }
      const contact = await this.contactService.getContactById(id)
      sendSuccess(res, contact)
    } catch (error) {
      next(error)
    }
  }

  // PUT /api/v1/contact/:id/status (admin only)
  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      const { status } = req.body
      if (!id) {
        return sendError(res, 'Contact ID is required', 'MISSING_ID', 400)
      }
      const contact = await this.contactService.updateContactStatus(id, status)
      sendSuccess(res, contact)
    } catch (error) {
      next(error)
    }
  }

  // DELETE /api/v1/contact/:id (admin only)
  deleteContact = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        return sendError(res, 'Contact ID is required', 'MISSING_ID', 400)
      }
      await this.contactService.deleteContact(id)
      sendSuccess(res, { message: 'Contact deleted successfully' })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/v1/contact/health (for testing)
  healthCheck = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.contactService.getStatistics()
      sendSuccess(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        totalContacts: stats.total,
      })
    } catch (error) {
      next(error)
    }
  }
}
