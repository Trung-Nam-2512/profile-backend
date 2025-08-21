import { ContactRepository } from '../repositories/ContactRepository'
import { EmailService } from './EmailService'
import { ContactMessage } from '../types/Contact'
import { IContact } from '../models/Contact'
import { AppError } from '../utils/errorHandler'

export class ContactService {
  private contactRepository: ContactRepository
  private emailService: EmailService

  constructor() {
    this.contactRepository = new ContactRepository()
    this.emailService = new EmailService()
  }

  async sendContactMessage(
    contactData: ContactMessage,
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<{ contact: IContact; emailSent: boolean }> {
    let contact: IContact
    let emailSent = false

    try {
      // Lưu tin nhắn vào database trước
      contact = await this.contactRepository.create(contactData, metadata)

      // Chỉ gửi email khi có cấu hình SMTP
      if (this.isEmailConfigured()) {
        try {
          await this.emailService.sendContactMessage(contactData)
          emailSent = true
        } catch (emailError) {
          console.warn('Email sending failed but contact saved:', emailError)
          // Không throw error, chỉ log warning vì contact đã được lưu thành công
        }
      } else {
        console.info('Email service not configured, skipping email notification')
      }

      return { contact, emailSent }
    } catch (error) {
      // Nếu không lưu được contact, throw error
      throw error
    }
  }

  private isEmailConfigured(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    )
  }

  async getContacts(
    page: number = 1,
    limit: number = 10,
    status?: 'new' | 'read' | 'replied'
  ) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new AppError('Invalid pagination parameters', 400, 'INVALID_PARAMS')
    }

    return await this.contactRepository.findAll(page, limit, status)
  }

  async getContactById(id: string): Promise<IContact> {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid contact ID format', 400, 'INVALID_ID')
    }

    const contact = await this.contactRepository.findById(id)
    if (!contact) {
      throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND')
    }

    // Tự động đánh dấu là đã đọc khi lấy chi tiết
    if (contact.status === 'new') {
      await this.contactRepository.updateStatus(id, 'read')
      contact.status = 'read'
    }

    return contact
  }

  async updateContactStatus(
    id: string,
    status: 'new' | 'read' | 'replied'
  ): Promise<IContact> {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid contact ID format', 400, 'INVALID_ID')
    }

    const contact = await this.contactRepository.updateStatus(id, status)
    if (!contact) {
      throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND')
    }

    return contact
  }

  async deleteContact(id: string): Promise<void> {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid contact ID format', 400, 'INVALID_ID')
    }

    const deleted = await this.contactRepository.deleteById(id)
    if (!deleted) {
      throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND')
    }
  }

  async getStatistics() {
    return await this.contactRepository.getStatistics()
  }
}
