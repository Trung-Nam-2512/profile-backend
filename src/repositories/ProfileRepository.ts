import { ProfileModel, ProfileDocument } from '../models/Profile'
import { UpsertProfileDTO } from '../types/Profile'

export class ProfileRepository {
  async upsert(profileData: UpsertProfileDTO): Promise<ProfileDocument> {
    // Find existing profile or create new one (should only be one profile)
    const existingProfile = await ProfileModel.findOne()

    if (existingProfile) {
      Object.assign(existingProfile, profileData)
      return await existingProfile.save()
    } else {
      const profile = new ProfileModel(profileData)
      return await profile.save()
    }
  }

  async findProfile(): Promise<ProfileDocument | null> {
    return await ProfileModel.findOne().lean()
  }

  async exists(): Promise<boolean> {
    const count = await ProfileModel.countDocuments()
    return count > 0
  }
}
