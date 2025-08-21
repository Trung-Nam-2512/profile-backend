import mongoose, { Schema, Document } from 'mongoose'

export interface ISession extends Document {
  sessionId: string
  visitorId: string
  visitor: mongoose.Types.ObjectId
  sessionStart: Date
  sessionEnd?: Date
  duration: number // in seconds
  pageViews: number
  bounced: boolean
  entryPage: string
  exitPage?: string
  referrer?: string
  utmData?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
  deviceInfo: {
    browser: string
    os: string
    deviceType: string
    screenResolution?: string
  }
  locationInfo?: {
    country?: string
    city?: string
    region?: string
    timezone?: string
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    visitor: {
      type: Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true,
      index: true,
    },
    sessionStart: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    sessionEnd: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    pageViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    bounced: {
      type: Boolean,
      default: false,
      index: true,
    },
    entryPage: {
      type: String,
      required: true,
      maxlength: 500,
      index: true,
    },
    exitPage: {
      type: String,
      maxlength: 500,
      index: true,
    },
    referrer: {
      type: String,
      maxlength: 500,
      index: true,
    },
    utmData: {
      source: {
        type: String,
        maxlength: 100,
      },
      medium: {
        type: String,
        maxlength: 100,
      },
      campaign: {
        type: String,
        maxlength: 100,
      },
      term: {
        type: String,
        maxlength: 100,
      },
      content: {
        type: String,
        maxlength: 100,
      },
    },
    deviceInfo: {
      browser: {
        type: String,
        required: true,
        maxlength: 50,
      },
      os: {
        type: String,
        required: true,
        maxlength: 50,
      },
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'bot'],
        required: true,
      },
      screenResolution: {
        type: String,
        maxlength: 20,
      },
    },
    locationInfo: {
      country: {
        type: String,
        maxlength: 2,
        uppercase: true,
      },
      city: {
        type: String,
        maxlength: 100,
      },
      region: {
        type: String,
        maxlength: 100,
      },
      timezone: {
        type: String,
        maxlength: 50,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for analytics queries
SessionSchema.index({ sessionStart: -1, duration: -1 })
SessionSchema.index({ 'deviceInfo.deviceType': 1, sessionStart: -1 })
SessionSchema.index({ 'locationInfo.country': 1, sessionStart: -1 })
SessionSchema.index({ bounced: 1, sessionStart: -1 })
SessionSchema.index({ isActive: 1, sessionStart: -1 })

// TTL index for cleaning up old active sessions (24 hours)
SessionSchema.index({ updatedAt: 1 }, { 
  expireAfterSeconds: 86400,
  partialFilterExpression: { isActive: true }
})

export const Session = mongoose.model<ISession>('Session', SessionSchema)