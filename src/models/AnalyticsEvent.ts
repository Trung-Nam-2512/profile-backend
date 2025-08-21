import mongoose, { Schema, Document } from 'mongoose'

export interface IAnalyticsEvent extends Document {
  sessionId: string
  visitorId: string
  session: mongoose.Types.ObjectId
  visitor: mongoose.Types.ObjectId
  eventType: string
  eventCategory: string
  eventAction: string
  eventLabel?: string
  eventValue?: number
  customData?: Record<string, any>
  url: string
  timestamp: Date
  userAgent: string
  ipAddress: string
  createdAt: Date
  updatedAt: Date
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
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
    eventType: {
      type: String,
      required: true,
      maxlength: 50,
      index: true,
      enum: [
        'click',
        'scroll',
        'form_submit',
        'form_error',
        'download',
        'video_play',
        'video_pause',
        'search',
        'share',
        'contact',
        'navigation',
        'error',
        'performance',
        'custom'
      ]
    },
    eventCategory: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },
    eventAction: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },
    eventLabel: {
      type: String,
      maxlength: 200,
    },
    eventValue: {
      type: Number,
    },
    customData: {
      type: Schema.Types.Mixed,
      validate: {
        validator: function(value: any) {
          return !value || JSON.stringify(value).length <= 5000 // Max 5KB
        },
        message: 'Custom data too large'
      }
    },
    url: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
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
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 })
AnalyticsEventSchema.index({ eventCategory: 1, eventAction: 1, timestamp: -1 })
AnalyticsEventSchema.index({ sessionId: 1, timestamp: 1 })
AnalyticsEventSchema.index({ timestamp: -1, eventType: 1 })

// TTL index for data retention
// AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }) // 1 year

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema)