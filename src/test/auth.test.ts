import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { authRoutes } from '../routes/authRoutes'
import { errorHandler, notFoundHandler } from '../utils/errorHandler'

// Create test app
const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data).toHaveProperty('email', userData.email)
      expect(response.body.data).not.toHaveProperty('password')
    })

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123'
      }

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('should return 422 for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123' // too short
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)

      expect(response.status).toBe(422)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const userData = {
        name: 'Login Test',
        email: 'login@example.com',
        password: 'password123'
      }

      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData)

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('accessToken')
      expect(typeof response.body.data.accessToken).toBe('string')
    })

    it('should return 401 for wrong password', async () => {
      const userData = {
        name: 'Wrong Password Test',
        email: 'wrong@example.com',
        password: 'password123'
      }

      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData)

      // Try to login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should return 422 for invalid input format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email-format',
          password: '123' // too short
        })

      expect(response.status).toBe(422)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
})