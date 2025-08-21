import { Router } from 'express'
import { PostController } from '../controllers/PostController'
import { authGuard, requireAdmin } from '../middleware/authGuard'

const router = Router()
const postController = new PostController()

// Public routes
// GET /api/v1/posts?published=true&page=1&limit=10
router.get('/', postController.getPublishedPosts)

// GET /api/v1/posts/:slug
router.get('/:slug', postController.getPostBySlug)

// Protected routes (ADMIN only)
// POST /api/v1/posts
router.post('/', authGuard, requireAdmin, postController.createPost)

// GET /api/v1/posts/id/:id
router.get('/id/:id', authGuard, requireAdmin, postController.getPostById)

// PUT /api/v1/posts/:id
router.put('/:id', authGuard, requireAdmin, postController.updatePost)

// DELETE /api/v1/posts/:id
router.delete('/:id', authGuard, requireAdmin, postController.deletePost)

export { router as postRoutes }
