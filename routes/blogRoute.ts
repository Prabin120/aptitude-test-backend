import express from 'express'
import { adminAuthentication } from '../middlewares/authMiddleware'
import {
    createBlog,
    updateBlog,
    deleteBlog,
    getBlog,
    getBlogs,
    getAdminBlogs,
    getAdminBlog,
} from '../controllers/blogController'

const router = express.Router()

// Public routes
router.get('/', getBlogs) // Get all published blogs
router.get('/:slug', getBlog) // Get single published blog

// Admin routes
router.get('/admin/all', adminAuthentication, getAdminBlogs) // Get all blogs (including drafts)
router.get('/admin/:slug', adminAuthentication, getAdminBlog) // Get single blog for editing
router.post('/', adminAuthentication, createBlog) // Create new blog
router.put('/:slug', adminAuthentication, updateBlog) // Update blog
router.delete('/:slug', adminAuthentication, deleteBlog) // Delete blog

export default router
