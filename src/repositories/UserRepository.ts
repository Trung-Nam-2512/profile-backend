import { UserModel, UserDocument } from '../models/User'
import { RegisterDTO } from '../types/User'

export class UserRepository {
  async create(userData: RegisterDTO): Promise<UserDocument> {
    const user = new UserModel(userData)
    return await user.save()
  }

  async findById(id: string): Promise<UserDocument | null> {
    return await UserModel.findById(id)
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await UserModel.findOne({ email })
  }

  async findByEmailWithoutPassword(
    email: string
  ): Promise<UserDocument | null> {
    return await UserModel.findOne({ email }).select('-password')
  }

  async findAll(page: number = 1, limit: number = 10): Promise<UserDocument[]> {
    const skip = (page - 1) * limit
    return await UserModel.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  }

  async update(
    id: string,
    userData: Partial<RegisterDTO>
  ): Promise<UserDocument | null> {
    return await UserModel.findByIdAndUpdate(id, userData, {
      new: true,
    }).select('-password')
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id)
    return !!result
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await UserModel.findOne({ email }).lean()
    return !!user
  }

  async countUsers(): Promise<number> {
    return await UserModel.countDocuments()
  }

  async countByRole(role: string): Promise<number> {
    return await UserModel.countDocuments({ role })
  }

  async countActive(): Promise<number> {
    return await UserModel.countDocuments({ isActive: true })
  }

  async updateStatus(
    id: string,
    isActive: boolean
  ): Promise<UserDocument | null> {
    return await UserModel.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).select('-password')
  }
}
