import { Request, Response, NextFunction } from 'express'
import { PostService } from '../services/PostService'
import { UpsertPostSchema, PostQuerySchema } from '../types/Post'
import { sendSuccess, sendError } from '../utils/response'
import { AppError } from '../utils/errorHandler'
import { ZodError } from 'zod'

export class PostController {
  private postService: PostService

  constructor() {
    this.postService = new PostService()
  }

  // GET /api/v1/posts?published=true&page=1&limit=10 (public)
  getPublishedPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = PostQuerySchema.parse(req.query)
      const result = await this.postService.getPublishedPosts(query)
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

  // GET /api/v1/posts/:slug (public)
  getPostBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params
      if (!slug) {
        throw new AppError('Slug parameter is required', 400, 'INVALID_SLUG')
      }
      const post = await this.postService.getPostBySlug(slug)

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND')
      }

      // Only return published posts for public endpoint
      if (!post.published) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND')
      }

      sendSuccess(res, { post })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/v1/posts/id/:id (ADMIN only)
  getPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        throw new AppError(
          'Post ID parameter is required',
          400,
          'INVALID_POST_ID'
        )
      }
      const post = await this.postService.getPostById(id)
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND')
      }
      sendSuccess(res, { post })
    } catch (error) {
      next(error)
    }
  }

  // POST /api/v1/posts (ADMIN only)
  createPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = UpsertPostSchema.parse(req.body)
      const authorId = req.user!.id

      const post = await this.postService.createPost(validatedData, authorId)

      sendSuccess(res, { post }, 201)
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }

  // PUT /api/v1/posts/:id (ADMIN only)
  updatePost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        throw new AppError(
          'Post ID parameter is required',
          400,
          'INVALID_POST_ID'
        )
      }
      const validatedData = UpsertPostSchema.partial().parse(req.body)

      const post = await this.postService.updatePost(id, validatedData)

      sendSuccess(res, { post })
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422)
      }
      next(error)
    }
  }

  // DELETE /api/v1/posts/:id (ADMIN only)
  deletePost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        throw new AppError(
          'Post ID parameter is required',
          400,
          'INVALID_POST_ID'
        )
      }
      const authorId = req.user!.id
      const userRole = req.user!.role

      const deleted = await this.postService.deletePost(id, authorId, userRole)

      sendSuccess(res, { deleted })
    } catch (error) {
      next(error)
    }
  }
}
