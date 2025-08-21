import nodemailer from 'nodemailer'
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'
import { AppError } from '../utils/errorHandler'

// Create DOMPurify instance for server-side sanitization
const window = new JSDOM('').window
const purify = DOMPurify(window)

export interface ContactMessageData {
  name: string
  email: string
  subject: string
  message: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Validate required environment variables in production
    if (process.env.NODE_ENV === 'production') {
      if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
      ) {
        throw new Error(
          'Missing required SMTP configuration in production environment'
        )
      }
    }

    // Create transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email config (SMTP) with security and timeouts
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Security and timeout settings
        connectionTimeout: 60000, // 1 minute
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 1 minute
        logger: process.env.NODE_ENV !== 'production',
        debug: process.env.NODE_ENV !== 'production',
      })
    } else {
      // Development - tạo transporter giả để tránh lỗi nhưng không gửi thật
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      })
    }
  }

  async sendContactMessage(data: ContactMessageData): Promise<void> {
    try {
      const { name, email, subject, message } = data

      // Sanitize all input data to prevent XSS
      const sanitizedName = purify.sanitize(name)
      const sanitizedEmail = purify.sanitize(email)
      const sanitizedSubject = purify.sanitize(subject)
      const sanitizedMessage = purify.sanitize(message.replace(/\n/g, '<br>'))

      // Email template with sanitized data
      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
            New Contact Message
          </h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${sanitizedName} (${sanitizedEmail})</p>
            <p><strong>Subject:</strong> ${sanitizedSubject}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6; color: #555;">${sanitizedMessage}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
            <p>This message was sent from your Nam’s Blog contact form.</p>
          </div>
        </div>
      `

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@profileblog.com',
        to: process.env.CONTACT_EMAIL || 'admin@local', // Your email
        subject: `Contact Form: ${subject}`,
        text: `
New Contact Message

From: ${name} (${email})
Subject: ${subject}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from your Nam’s Blog contact form.
        `,
        html: htmlTemplate,
        replyTo: email, // Allow replying directly to sender
      }

      const info = await this.transporter.sendMail(mailOptions)

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent successfully!')
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      throw new AppError(
        'Failed to send email. Please try again later.',
        500,
        'EMAIL_SEND_FAILED'
      )
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('❌ Email service connection failed:', error)
      return false
    }
  }
}
