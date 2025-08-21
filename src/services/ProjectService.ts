import {
  ProjectRepository,
  ProjectQueryOptions,
} from '../repositories/ProjectRepository'
import { UpsertProjectDTO, ProjectQuery } from '../types/Project'
import { ProjectDocument } from '../models/Project'
import { AppError } from '../utils/errorHandler'

export class ProjectService {
  private projectRepository: ProjectRepository

  constructor() {
    this.projectRepository = new ProjectRepository()
  }

  async createProject(
    projectData: UpsertProjectDTO,
    authorId: string
  ): Promise<ProjectDocument> {
    // Ensure slug is unique
    if (await this.projectRepository.slugExists(projectData.slug)) {
      throw new AppError('Slug already exists', 409, 'SLUG_ALREADY_EXISTS')
    }

    return await this.projectRepository.create({
      ...projectData,
      authorId,
    })
  }

  async updateProject(
    id: string,
    projectData: Partial<UpsertProjectDTO>
  ): Promise<ProjectDocument | null> {
    // If updating slug, ensure it's unique
    if (
      projectData.slug &&
      (await this.projectRepository.slugExists(projectData.slug, id))
    ) {
      throw new AppError('Slug already exists', 409, 'SLUG_ALREADY_EXISTS')
    }

    const project = await this.projectRepository.update(id, projectData)
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }

    return project
  }

  async getProjectById(id: string): Promise<ProjectDocument | null> {
    return await this.projectRepository.findById(id)
  }

  async getProjectBySlug(slug: string): Promise<ProjectDocument | null> {
    return await this.projectRepository.findBySlug(slug)
  }

  async getPublishedProjects(query: ProjectQuery): Promise<{
    projects: unknown[]
    total: number
    page: number
    limit: number
  }> {
    const { page = 1, limit = 10, q, tag, featured } = query

    // For public endpoint, only show published projects with search/filter
    const options = {
      published: true,
      page,
      limit,
      q,
      tag,
      featured,
    }

    const projects = await this.projectRepository.findAllWithProjection(options)
    const total = await this.projectRepository.countProjects(options)

    return {
      projects,
      total,
      page,
      limit,
    }
  }

  async getFeaturedProjects(limit: number = 6): Promise<unknown[]> {
    return await this.projectRepository.findFeaturedProjects(limit)
  }

  async getAllProjects(options: ProjectQueryOptions): Promise<{
    projects: unknown[]
    total: number
    page: number
    limit: number
  }> {
    const projects = await this.projectRepository.findAllWithProjection(options)
    const total = await this.projectRepository.countProjects(options)

    return {
      projects,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
    }
  }

  async deleteProject(
    id: string,
    authorId: string,
    userRole: string
  ): Promise<boolean> {
    const project = await this.projectRepository.findById(id)
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND')
    }

    // Only admin or project author can delete
    if (userRole !== 'ADMIN' && project.authorId.toString() !== authorId) {
      throw new AppError(
        'Insufficient permissions',
        403,
        'INSUFFICIENT_PERMISSIONS'
      )
    }

    return await this.projectRepository.delete(id)
  }

  async checkProjectOwnership(
    projectId: string,
    authorId: string
  ): Promise<boolean> {
    const project = await this.projectRepository.findById(projectId)
    return project ? project.authorId.toString() === authorId : false
  }
}
