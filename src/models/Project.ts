import mongoose, { Schema, Document } from 'mongoose'
import { Project } from '../types/Project'

export interface ProjectDocument extends Omit<Project, '_id'>, Document {}

const projectLinksSchema = new Schema(
  {
    demo: {
      type: String,
      trim: true,
    },
    repo: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
)

const projectSchema = new Schema<ProjectDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[a-z0-9-]+$/.test(v)
        },
        message:
          'Slug must contain only lowercase letters, numbers, and hyphens',
      },
    },
    excerpt: {
      type: String,
      trim: true,
    },
    contentMD: {
      type: String,
      required: true,
    },
    coverUrl: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    links: projectLinksSchema,
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    authorId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
projectSchema.index({ slug: 1 }, { unique: true })
projectSchema.index({ authorId: 1 })
projectSchema.index({ published: 1 })
projectSchema.index({ featured: 1 })
projectSchema.index({ publishedAt: -1 })
projectSchema.index({ published: 1, publishedAt: -1 })
projectSchema.index({ published: 1, featured: 1 })
projectSchema.index({ tags: 1 })
projectSchema.index({ title: 'text', contentMD: 'text' })

// Auto-set publishedAt when published becomes true
projectSchema.pre<ProjectDocument>('save', function (next) {
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date()
  } else if (!this.published) {
    this.publishedAt = undefined
  }
  next()
})

export const ProjectModel = mongoose.model<ProjectDocument>(
  'Project',
  projectSchema
)
