import mongoose from 'mongoose'

export const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined')
    }

    await mongoose.connect(mongoUri)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect()
    console.log('MongoDB disconnected successfully')
  } catch (error) {
    console.error('MongoDB disconnection error:', error)
  }
}
