import mongoose, { Schema, Document } from 'mongoose'

export interface IVisitor extends Document {
  visitorId: string // Unique fingerprint
  ipAddress: string
  userAgent: string
  country?: string
  city?: string
  region?: string
  timezone?: string
  browser: string
  browserVersion?: string
  os: string
  osVersion?: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot'
  screenResolution?: string
  language?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  firstVisit: Date
  lastVisit: Date
  visitCount: number
  totalPageViews: number
  totalSessionDuration: number // in seconds
  isBot: boolean
  createdAt: Date
  updatedAt: Date
}

const VisitorSchema = new Schema<IVisitor>(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
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
    browser: {
      type: String,
      required: true,
      maxlength: 50,
    },
    browserVersion: {
      type: String,
      maxlength: 20,
    },
    os: {
      type: String,
      required: true,
      maxlength: 50,
    },
    osVersion: {
      type: String,
      maxlength: 20,
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
    language: {
      type: String,
      maxlength: 10,
    },
    referrer: {
      type: String,
      maxlength: 500,
    },
    utmSource: {
      type: String,
      maxlength: 100,
    },
    utmMedium: {
      type: String,
      maxlength: 100,
    },
    utmCampaign: {
      type: String,
      maxlength: 100,
    },
    firstVisit: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastVisit: {
      type: Date,
      required: true,
      default: Date.now,
    },
    visitCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalPageViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSessionDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Don't expose full IP in JSON responses
        if (ret.ipAddress) {
          const ipParts = ret.ipAddress.split('.')
          if (ipParts.length === 4) {
            ret.ipAddress = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.xxx`
          }
        }
        return ret
      }
    }
  }
)

// Compound indexes for analytics queries
VisitorSchema.index({ country: 1, createdAt: -1 })
VisitorSchema.index({ deviceType: 1, createdAt: -1 })
VisitorSchema.index({ isBot: 1, createdAt: -1 })
VisitorSchema.index({ firstVisit: -1 })
VisitorSchema.index({ lastVisit: -1 })

// Text search index
VisitorSchema.index({
  city: 'text',
  browser: 'text',
  os: 'text'
})

export const Visitor = mongoose.model<IVisitor>('Visitor', VisitorSchema)