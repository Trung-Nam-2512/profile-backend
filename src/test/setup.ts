import { beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer: MongoMemoryServer

beforeAll(async () => {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-key'
  process.env.JWT_EXPIRES_IN = '1h'

  // Start in-memory MongoDB instance for testing
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  // Close existing connection if any
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }

  await mongoose.connect(mongoUri)
})

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    if (collection) {
      await collection.deleteMany({})
    }
  }
})

afterAll(async () => {
  // Cleanup
  await mongoose.disconnect()
  await mongoServer.stop()
})
