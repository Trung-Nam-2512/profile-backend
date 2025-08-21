import { Router } from 'express'
import { ProjectController } from '../controllers/ProjectController'
import { authGuard, requireAdmin } from '../middleware/authGuard'

const router = Router()
const projectController = new ProjectController()

// Public routes
// GET /api/v1/projects?published=true&featured=true&page=1&limit=10
router.get('/', projectController.getPublishedProjects)

// GET /api/v1/projects/featured
router.get('/featured', projectController.getFeaturedProjects)

// GET /api/v1/projects/:slug
router.get('/:slug', projectController.getProjectBySlug)

// Protected routes (ADMIN only)
// POST /api/v1/projects
router.post('/', authGuard, requireAdmin, projectController.createProject)

// PUT /api/v1/projects/:id
router.put('/:id', authGuard, requireAdmin, projectController.updateProject)

// DELETE /api/v1/projects/:id
router.delete('/:id', authGuard, requireAdmin, projectController.deleteProject)

export { router as projectRoutes }
