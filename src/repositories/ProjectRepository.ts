import { ProjectModel, ProjectDocument } from '../models/Project'
import { UpsertProjectDTO } from '../types/Project'
import { FilterQuery } from 'mongoose'

export interface ProjectQueryOptions {
  published?: boolean
  featured?: boolean
  authorId?: string
  page?: number
  limit?: number
  q?: string
  tag?: string
}

export class ProjectRepository {
  async create(
    projectData: UpsertProjectDTO & { authorId: string }
  ): Promise<ProjectDocument> {
    const project = new ProjectModel(projectData)
    return await project.save()
  }

  async findById(id: string): Promise<ProjectDocument | null> {
    return await ProjectModel.findById(id).populate('authorId', 'name email')
  }

  async findBySlug(slug: string): Promise<ProjectDocument | null> {
    return await ProjectModel.findOne({ slug }).populate(
      'authorId',
      'name email'
    )
  }

  async findBySlugLean(slug: string): Promise<unknown> {
    return await ProjectModel.findOne({ slug }).lean()
  }

  async findAll(options: ProjectQueryOptions = {}): Promise<ProjectDocument[]> {
    const query: FilterQuery<ProjectDocument> = {}

    if (options.published !== undefined) {
      query.published = options.published
    }

    if (options.featured !== undefined) {
      query.featured = options.featured
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

    return await ProjectModel.find(query)
      .populate('authorId', 'name email')
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  }

  async findAllWithProjection(
    options: ProjectQueryOptions = {}
  ): Promise<unknown[]> {
    const query: FilterQuery<ProjectDocument> = {}

    if (options.published !== undefined) {
      query.published = options.published
    }

    if (options.featured !== undefined) {
      query.featured = options.featured
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

    return await ProjectModel.find(query)
      .select('-contentMD') // Exclude content field for list view
      .populate('authorId', 'name email')
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  }

  async findPublishedProjects(
    page: number = 1,
    limit: number = 10
  ): Promise<unknown[]> {
    const skip = (page - 1) * limit

    return await ProjectModel.find({ published: true })
      .select('-contentMD')
      .populate('authorId', 'name email')
      .sort({ featured: -1, publishedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  }

  async findFeaturedProjects(limit: number = 6): Promise<unknown[]> {
    return await ProjectModel.find({ published: true, featured: true })
      .select('-contentMD')
      .populate('authorId', 'name email')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean()
  }

  async countProjects(options: ProjectQueryOptions = {}): Promise<number> {
    const query: FilterQuery<ProjectDocument> = {}

    if (options.published !== undefined) {
      query.published = options.published
    }

    if (options.featured !== undefined) {
      query.featured = options.featured
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

    return await ProjectModel.countDocuments(query)
  }

  async update(
    id: string,
    projectData: Partial<UpsertProjectDTO>
  ): Promise<ProjectDocument | null> {
    return await ProjectModel.findByIdAndUpdate(id, projectData, {
      new: true,
    }).populate('authorId', 'name email')
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProjectModel.findByIdAndDelete(id)
    return !!result
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query: FilterQuery<ProjectDocument> = { slug }
    if (excludeId) {
      query._id = { $ne: excludeId }
    }
    const project = await ProjectModel.findOne(query).lean()
    return !!project
  }

  async countByAuthor(authorId: string): Promise<number> {
    return await ProjectModel.countDocuments({ authorId })
  }

  async countPublished(): Promise<number> {
    return await ProjectModel.countDocuments({ published: true })
  }
}
