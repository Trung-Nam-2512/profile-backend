import { Request, Response, NextFunction } from 'express'
import { ProjectService } from '../services/ProjectService'
import { UpsertProjectSchema, ProjectQuerySchema } from '../types/Project'
import { sendSuccess, sendError } from '../utils/response'
import { AppError } from '../utils/errorHandler'
import { ZodError } from 'zod'

export class ProjectController {
  private projectService: ProjectService

  constructor() {
    this.projectService = new ProjectService()
  }

  // GET /api/v1/projects?published=true&featured=true&page=1&limit=10 (public)
  getPublishedProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = ProjectQuerySchema.parse(req.query)
      const result = await this.projectService.getPublishedProjects(query)
      sendSuccess(res, result)
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(
          res,
          'Invalid query parameters',
          'VALIDATION_ERROR',
          400
        )
      }
      next(error)
    }
  }

  // GET /api/v1/projects/featured (public)
  getFeaturedProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 6
      const projects = await this.projectService.getFeaturedProjects(limit)
      sendSuccess(res, { projects })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/v1/projects/:slug (public)
  getProjectBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params
      if (!slug) {
        throw new AppError('Slug parameter is required', 400, 'INVALID_SLUG')
      }
      const project = await this.projectService.getProjectBySlug(slug)

      if (!project) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND')
      }

      // Only return published projects for public endpoint
      if (!project.published) {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND')
      }

      sendSuccess(res, { project })
    } catch (error) {
      next(error)
    }
  }

  // POST /api/v1/projects (ADMIN only)
  createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = UpsertProjectSchema.parse(req.body)
      const authorId = req.user!.id

      const project = await this.projectService.createProject(
        validatedData,
        authorId
      )

      sendSuccess(res, { project }, 201)
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }

  // PUT /api/v1/projects/:id (ADMIN only)
  updateProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        throw new AppError(
          'Project ID parameter is required',
          400,
          'INVALID_PROJECT_ID'
        )
      }
      const validatedData = UpsertProjectSchema.partial().parse(req.body)

      const project = await this.projectService.updateProject(id, validatedData)

      sendSuccess(res, { project })
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }

  // DELETE /api/v1/projects/:id (ADMIN only)
  deleteProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        throw new AppError(
          'Project ID parameter is required',
          400,
          'INVALID_PROJECT_ID'
        )
      }
      const authorId = req.user!.id
      const userRole = req.user!.role

      const deleted = await this.projectService.deleteProject(
        id,
        authorId,
        userRole
      )

      sendSuccess(res, { deleted })
    } catch (error) {
      next(error)
    }
  }
}
