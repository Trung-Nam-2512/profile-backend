import { ProfileRepository } from '../repositories/ProfileRepository'
import { UpsertProfileDTO } from '../types/Profile'
import { ProfileDocument } from '../models/Profile'

export class ProfileService {
  private profileRepository: ProfileRepository

  constructor() {
    this.profileRepository = new ProfileRepository()
  }

  async getProfile(): Promise<ProfileDocument | null> {
    return await this.profileRepository.findProfile()
  }

  async upsertProfile(profileData: UpsertProfileDTO): Promise<ProfileDocument> {
    return await this.profileRepository.upsert(profileData)
  }

  async profileExists(): Promise<boolean> {
    return await this.profileRepository.exists()
  }
}
