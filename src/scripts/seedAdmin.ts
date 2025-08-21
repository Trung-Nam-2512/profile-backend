import dotenv from 'dotenv'
import { connectDatabase, disconnectDatabase } from '../utils/database'
import { UserModel } from '../models/User'

// Load environment variables
dotenv.config()

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin user seeding...')

    // Connect to database
    await connectDatabase()

    const adminEmail = 'admin@local'
    const adminPassword = 'admin123'

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ email: adminEmail })

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return
    }

    // Create admin user
    const adminUser = new UserModel({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword, // Will be hashed by the model pre-save hook
      role: 'ADMIN',
    })

    await adminUser.save()

    console.log('✅ Admin user created successfully!')
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
    console.log('⚠️  Remember to change the password in production!')
  } catch (error) {
    console.error('❌ Error seeding admin user:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
    process.exit(0)
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedAdmin()
}

export { seedAdmin }
