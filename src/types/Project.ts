import { z } from 'zod'

export const ProjectLinksSchema = z.object({
  demo: z.string().url().optional(),
  repo: z.string().url().optional(),
})

export const ProjectSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  excerpt: z.string().optional(),
  contentMD: z.string().min(1, 'Content is required'),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  links: ProjectLinksSchema.default({}),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  publishedAt: z.date().optional(),
  authorId: z.string().min(1, 'Author ID is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const UpsertProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  excerpt: z.string().optional(),
  contentMD: z.string().min(1, 'Content is required'),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  links: ProjectLinksSchema.default({}),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
})

export const ProjectQuerySchema = z.object({
  published: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  featured: z
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

export const ProjectListResponseSchema = ProjectSchema.omit({ contentMD: true })

export type Project = z.infer<typeof ProjectSchema>
export type UpsertProjectDTO = z.infer<typeof UpsertProjectSchema>
export type ProjectQuery = z.infer<typeof ProjectQuerySchema>
export type ProjectLinks = z.infer<typeof ProjectLinksSchema>
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>
