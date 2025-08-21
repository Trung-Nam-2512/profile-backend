import { z } from 'zod'

export const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(/^[^@]+@local$/, 'Invalid email format'),
  ]),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const LoginSchema = z.object({
  email: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(/^[^@]+@local$/, 'Invalid email format'),
  ]),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const UserResponseSchema = UserSchema.omit({ password: true })

export type User = z.infer<typeof UserSchema>
export type RegisterDTO = z.infer<typeof RegisterSchema>
export type LoginDTO = z.infer<typeof LoginSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
