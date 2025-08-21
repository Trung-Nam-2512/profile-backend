import mongoose, { Schema, Document } from 'mongoose'

export interface IContact extends Document {
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied'
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index cho tìm kiếm nhanh
ContactSchema.index({ createdAt: -1 })
ContactSchema.index({ status: 1 })
ContactSchema.index({ email: 1 })

export const Contact = mongoose.model<IContact>('Contact', ContactSchema)
