import mongoose, { Schema, Document } from 'mongoose'
import { Post } from '../types/Post'

export interface PostDocument extends Omit<Post, '_id'>, Document {}

const postSchema = new Schema<PostDocument>(
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
    featuredImage: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
postSchema.index({ slug: 1 }, { unique: true })
postSchema.index({ authorId: 1 })
postSchema.index({ published: 1 })
postSchema.index({ publishedAt: -1 })
postSchema.index({ published: 1, publishedAt: -1 }) // Compound index for published posts by date
postSchema.index({ tags: 1 }) // Index for tag filtering
postSchema.index({ title: 'text', content: 'text' }) // Text search index

// Auto-set publishedAt when published becomes true
postSchema.pre<PostDocument>('save', function (next) {
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date()
  } else if (!this.published) {
    this.publishedAt = undefined
  }
  next()
})

export const PostModel = mongoose.model<PostDocument>('Post', postSchema)
