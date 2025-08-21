import {
  PostRepository,
  PostQueryOptions,
} from '../repositories/PostRepository'
import { UpsertPostDTO, PostQuery } from '../types/Post'
import { PostDocument } from '../models/Post'
import { AppError } from '../utils/errorHandler'

export class PostService {
  private postRepository: PostRepository

  constructor() {
    this.postRepository = new PostRepository()
  }

  async createPost(
    postData: UpsertPostDTO,
    authorId: string
  ): Promise<PostDocument> {
    // Ensure slug is unique
    if (await this.postRepository.slugExists(postData.slug)) {
      throw new AppError('Slug already exists', 409, 'SLUG_ALREADY_EXISTS')
    }

    return await this.postRepository.create({
      ...postData,
      authorId,
    })
  }

  async updatePost(
    id: string,
    postData: Partial<UpsertPostDTO>
  ): Promise<PostDocument | null> {
    // If updating slug, ensure it's unique
    if (
      postData.slug &&
      (await this.postRepository.slugExists(postData.slug, id))
    ) {
      throw new AppError('Slug already exists', 409, 'SLUG_ALREADY_EXISTS')
    }

    const post = await this.postRepository.update(id, postData)
    if (!post) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND')
    }

    return post
  }

  async getPostById(id: string): Promise<PostDocument | null> {
    return await this.postRepository.findById(id)
  }

  async getPostBySlug(slug: string): Promise<PostDocument | null> {
    return await this.postRepository.findBySlug(slug)
  }

  async getPublishedPosts(
    query: PostQuery
  ): Promise<{ posts: unknown[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, q, tag } = query

    // For public endpoint, only show published posts with search/filter
    const options = {
      published: true,
      page,
      limit,
      q,
      tag,
    }

    const posts = await this.postRepository.findAllWithProjection(options)
    const total = await this.postRepository.countPosts(options)

    return {
      posts,
      total,
      page,
      limit,
    }
  }

  async getAllPosts(
    options: PostQueryOptions
  ): Promise<{ posts: unknown[]; total: number; page: number; limit: number }> {
    const posts = await this.postRepository.findAllWithProjection(options)
    const total = await this.postRepository.countPosts(options)

    return {
      posts,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
    }
  }

  async deletePost(
    id: string,
    authorId: string,
    userRole: string
  ): Promise<boolean> {
    const post = await this.postRepository.findById(id)
    if (!post) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND')
    }

    // Only admin or post author can delete
    if (userRole !== 'ADMIN' && post.authorId.toString() !== authorId) {
      throw new AppError(
        'Insufficient permissions',
        403,
        'INSUFFICIENT_PERMISSIONS'
      )
    }

    return await this.postRepository.delete(id)
  }

  async checkPostOwnership(postId: string, authorId: string): Promise<boolean> {
    const post = await this.postRepository.findById(postId)
    return post ? post.authorId.toString() === authorId : false
  }
}
