import { PostModel, PostDocument } from '../models/Post'
import { UpsertPostDTO } from '../types/Post'
import { FilterQuery } from 'mongoose'

export interface PostQueryOptions {
  published?: boolean
  authorId?: string
  page?: number
  limit?: number
  q?: string
  tag?: string
}

export class PostRepository {
  async create(
    postData: UpsertPostDTO & { authorId: string }
  ): Promise<PostDocument> {
    const post = new PostModel(postData)
    return await post.save()
  }

  async findById(id: string): Promise<PostDocument | null> {
    return await PostModel.findById(id).populate('authorId', 'name email')
  }

  async findBySlug(slug: string): Promise<PostDocument | null> {
    return await PostModel.findOne({ slug }).populate('authorId', 'name email')
  }

  async findBySlugLean(slug: string): Promise<unknown> {
    return await PostModel.findOne({ slug }).lean()
  }

  async findAll(options: PostQueryOptions = {}): Promise<PostDocument[]> {
    const query: FilterQuery<PostDocument> = {}

    if (options.published !== undefined) {
      query.published = options.published
    }

    if (options.authorId) {
      query.authorId = options.authorId
    }

    // Text search
    if (options.q) {
      query.$text = { $search: options.q }
    }

    // Tag filter
    if (options.tag) {
      query.tags = { $in: [options.tag] }
    }

    const page = options.page || 1
    const limit = options.limit || 10
    const skip = (page - 1) * limit

    return await PostModel.find(query)
      .populate('authorId', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  }

  async findAllWithProjection(
    options: PostQueryOptions = {}
  ): Promise<unknown[]> {
    const query: FilterQuery<PostDocument> = {}

    if (options.published !== undefined) {
      query.published = options.published
    }

    if (options.authorId) {
      query.authorId = options.authorId
    }

    // Text search
    if (options.q) {
      query.$text = { $search: options.q }
    }

    // Tag filter
    if (options.tag) {
      query.tags = { $in: [options.tag] }
    }

    const page = options.page || 1
    const limit = options.limit || 10
    const skip = (page - 1) * limit

    return await PostModel.find(query)
      .select('-content') // Exclude content field for list view
      .populate('authorId', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  }

  async findPublishedPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<unknown[]> {
    const skip = (page - 1) * limit

    return await PostModel.find({ published: true })
      .select('-content') // Exclude content field for list view
      .populate('authorId', 'name email')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  }

  async countPosts(options: PostQueryOptions = {}): Promise<number> {
    const query: FilterQuery<PostDocument> = {}

    if (options.published !== undefined) {
      query.published = options.published
    }

    if (options.authorId) {
      query.authorId = options.authorId
    }

    // Text search
    if (options.q) {
      query.$text = { $search: options.q }
    }

    // Tag filter
    if (options.tag) {
      query.tags = { $in: [options.tag] }
    }

    return await PostModel.countDocuments(query)
  }

  async update(
    id: string,
    postData: Partial<UpsertPostDTO>
  ): Promise<PostDocument | null> {
    return await PostModel.findByIdAndUpdate(id, postData, {
      new: true,
    }).populate('authorId', 'name email')
  }

  async delete(id: string): Promise<boolean> {
    const result = await PostModel.findByIdAndDelete(id)
    return !!result
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query: FilterQuery<PostDocument> = { slug }
    if (excludeId) {
      query._id = { $ne: excludeId }
    }
    const post = await PostModel.findOne(query).lean()
    return !!post
  }

  async countByAuthor(authorId: string): Promise<number> {
    return await PostModel.countDocuments({ authorId })
  }

  async countPublished(): Promise<number> {
    return await PostModel.countDocuments({ published: true })
  }
}
