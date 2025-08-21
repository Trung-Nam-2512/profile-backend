import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { profileRoutes } from '../routes/profileRoutes'
import { errorHandler, notFoundHandler } from '../utils/errorHandler'

// Create test app
const app = express()
app.use(express.json())
app.use('/api/v1/profile', profileRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

describe('Profile Endpoints', () => {
  describe('GET /api/v1/profile', () => {
    it('should return 404 when profile does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/profile')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PROFILE_NOT_FOUND')
    })
  })

  describe('PUT /api/v1/profile', () => {
    it('should return 401 without authentication', async () => {
      const profileData = {
        name: 'John Doe',
        title: 'Software Developer',
        bio: 'Passionate developer with 5 years of experience',
        contactEmail: 'john@example.com'
      }

      const response = await request(app)
        .put('/api/v1/profile')
        .send(profileData)

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('should return 401 for unauthenticated request with invalid data', async () => {
      const invalidData = {
        name: '',
        title: '',
        bio: '',
        contactEmail: 'invalid-email'
      }

      const response = await request(app)
        .put('/api/v1/profile')
        .send(invalidData)

      // Auth check happens before validation, so 401 is expected
      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })
})