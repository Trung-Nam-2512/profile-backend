import { UserRepository } from '../repositories/UserRepository'
import { RegisterDTO, LoginDTO, UserResponse } from '../types/User'
import { AppError } from '../utils/errorHandler'
import { generateAccessToken } from '../utils/jwt'
import { Types } from 'mongoose'

export class AuthService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  async register(
    userData: RegisterDTO
  ): Promise<{ id: string; email: string; role: string }> {
    // Check if email already exists
    if (await this.userRepository.emailExists(userData.email)) {
      throw new AppError('Email already exists', 409, 'EMAIL_ALREADY_EXISTS')
    }

    // Create user (password will be hashed automatically by the model)
    const user = await this.userRepository.create(userData)

    return {
      id:
        user._id instanceof Types.ObjectId
          ? user._id.toString()
          : String(user._id),
      email: user.email,
      role: user.role,
    }
  }

  async login(
    credentials: LoginDTO
  ): Promise<{ accessToken: string; user: UserResponse }> {
    // Find user by email (including password for verification)
    const user = await this.userRepository.findByEmail(credentials.email)
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Verify password using the model method
    const isPasswordValid = await user.comparePassword(credentials.password)
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Generate JWT token with user ID and role
    const accessToken = generateAccessToken(
      user._id instanceof Types.ObjectId
        ? user._id.toString()
        : String(user._id),
      user.role
    )

    // Return user info without password
    const userResponse: UserResponse = {
      _id:
        user._id instanceof Types.ObjectId
          ? user._id.toString()
          : String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return { accessToken, user: userResponse }
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND')
    }

    return {
      _id:
        user._id instanceof Types.ObjectId
          ? user._id.toString()
          : String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
