import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from '../types/User'

export interface UserDocument extends Omit<User, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for email (unique and for queries)
userSchema.index({ email: 1 }, { unique: true })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Don't return password in JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

export const UserModel = mongoose.model<UserDocument>('User', userSchema)
