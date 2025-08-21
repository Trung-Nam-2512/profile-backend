import { z } from 'zod'

export const SocialLinkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  url: z.string().url('Invalid URL format'),
})

export const ExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  start: z.string().min(1, 'Start date is required'),
  end: z.string().optional(),
  description: z.string().optional(),
})

export const ProfileSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  bio: z.string().min(1, 'Bio is required'),
  avatarUrl: z.string().url().optional(),
  location: z.string().optional(),
  socials: z.array(SocialLinkSchema).default([]),
  skills: z.array(z.string()).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  contactEmail: z.string().email('Invalid email format'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const UpsertProfileSchema = ProfileSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
})

export type Profile = z.infer<typeof ProfileSchema>
export type UpsertProfileDTO = z.infer<typeof UpsertProfileSchema>
export type SocialLink = z.infer<typeof SocialLinkSchema>
export type Experience = z.infer<typeof ExperienceSchema>
