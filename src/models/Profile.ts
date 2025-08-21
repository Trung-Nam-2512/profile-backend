import mongoose, { Schema, Document } from 'mongoose'
import { Profile } from '../types/Profile'

export interface ProfileDocument extends Omit<Profile, '_id'>, Document {}

const socialLinkSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
)

const experienceSchema = new Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    start: {
      type: String,
      required: true,
      trim: true,
    },
    end: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
)

const profileSchema = new Schema<ProfileDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    socials: [socialLinkSchema],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experiences: [experienceSchema],
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
)

// Only one profile document should exist
profileSchema.index({}, { unique: true })

export const ProfileModel = mongoose.model<ProfileDocument>(
  'Profile',
  profileSchema
)
