import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../index'
import { Contact } from '../models/Contact'

describe('Contact API - Basic Tests', () => {
  beforeEach(async () => {
    // Clear contacts collection before each test
    await Contact.deleteMany({})
  })

  it('should create contact successfully', async () => {
    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a test message for contact form'
    }

    const response = await request(app)
      .post('/api/v1/contact')
      .send(contactData)
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.contactId).toBeDefined()
    
    // Check if saved in database
    const count = await Contact.countDocuments()
    expect(count).toBe(1)
  })

  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/v1/contact/health')
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe('healthy')
  })

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/v1/contact')
      .send({})
      .expect(422)

    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return contacts list', async () => {
    // Create test contact
    await Contact.create({
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a test message'
    })

    const response = await request(app)
      .get('/api/v1/contact')
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.contacts).toHaveLength(1)
    expect(response.body.data.total).toBe(1)
  })
})