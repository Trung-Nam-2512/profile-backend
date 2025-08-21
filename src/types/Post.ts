import { z } from 'zod'

export const PostSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  publishedAt: z.date().optional(),
  authorId: z.string().min(1, 'Author ID is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const UpsertPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).default([]),
  published: z.boolean().optional().default(false),
})

export const PostQuerySchema = z.object({
  published: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10)),
  q: z.string().optional(),
  tag: z.string().optional(),
})

export const PostListResponseSchema = PostSchema.omit({ content: true })

export type PostListResponse = z.infer<typeof PostListResponseSchema>

export type Post = z.infer<typeof PostSchema>
export type UpsertPostDTO = z.infer<typeof UpsertPostSchema>
export type PostQuery = z.infer<typeof PostQuerySchema>
