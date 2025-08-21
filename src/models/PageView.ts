import mongoose, { Schema, Document } from 'mongoose'

export interface IPageView extends Document {
  sessionId: string
  visitorId: string
  session: mongoose.Types.ObjectId
  visitor: mongoose.Types.ObjectId
  url: string
  path: string
  title?: string
  referrer?: string
  timestamp: Date
  timeSpent?: number // in seconds
  scrollDepth?: number // percentage (0-100)
  exitPage: boolean
  loadTime?: number // in milliseconds
  userAgent: string
  ipAddress: string
  createdAt: Date
  updatedAt: Date
}

const PageViewSchema = new Schema<IPageView>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    visitor: {
      type: Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    path: {
      type: String,
      required: true,
      maxlength: 500,
      index: true,
    },
    title: {
      type: String,
      maxlength: 200,
    },
    referrer: {
      type: String,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    timeSpent: {
      type: Number,
      min: 0,
      max: 86400, // Max 24 hours
    },
    scrollDepth: {
      type: Number,
      min: 0,
      max: 100,
    },
    exitPage: {
      type: Boolean,
      default: false,
      index: true,
    },
    loadTime: {
      type: Number,
      min: 0,
      max: 60000, // Max 60 seconds
    },
    userAgent: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for analytics queries
PageViewSchema.index({ path: 1, timestamp: -1 })
PageViewSchema.index({ timestamp: -1, timeSpent: -1 })
PageViewSchema.index({ sessionId: 1, timestamp: 1 })
PageViewSchema.index({ exitPage: 1, timestamp: -1 })

// Index for popular pages queries
PageViewSchema.index({ path: 1, timestamp: -1, timeSpent: -1 })

// TTL index for data retention (optional, can be configured)
// PageViewSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }) // 1 year

export const PageView = mongoose.model<IPageView>('PageView', PageViewSchema)