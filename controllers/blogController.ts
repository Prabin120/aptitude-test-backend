import { Request, Response } from 'express'
import Blog from '../models/blog'
import ICustomRequest from '../utils/customRequest'

// Create a new blog (Admin only)
const createBlog = async (req: ICustomRequest, res: Response) => {
    try {
        const { title, author, content, category, tags, featured, status, slug } = req.body

        if (!title || !content || !category) {
            return res.status(400).json({ message: 'Title, content, and category are required' })
        }

        // Generate slug from title if not provided
        const blogSlug = slug || title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        // Check if slug already exists
        const existingBlog = await Blog.findOne({ slug: blogSlug })
        if (existingBlog) {
            return res.status(400).json({ message: 'A blog with this slug already exists' })
        }

        const blog = await Blog.create({
            title,
            slug: blogSlug,
            author: author || req.username || 'Admin',
            content,
            category,
            tags: tags || [],
            featured: featured || false,
            status: status || 'draft',
            publishedAt: status === 'published' ? new Date() : undefined,
        })

        return res.status(201).json({ message: 'Blog created successfully', data: blog })
    } catch (error) {
        console.error('Create blog error:', error)
        return res.status(500).json({ message: 'Error creating blog' })
    }
}

// Update a blog (Admin only)
const updateBlog = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug } = req.params
        const { title, author, content, category, tags, featured, status, newSlug } = req.body

        const blog = await Blog.findOne({ slug })
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' })
        }

        // Check if new slug conflicts with existing
        if (newSlug && newSlug !== slug) {
            const existingBlog = await Blog.findOne({ slug: newSlug })
            if (existingBlog) {
                return res.status(400).json({ message: 'A blog with this slug already exists' })
            }
            blog.slug = newSlug
        }

        if (title) blog.title = title
        if (author) blog.author = author
        if (content) blog.content = content
        if (category) blog.category = category
        if (tags) blog.tags = tags
        if (typeof featured === 'boolean') blog.featured = featured
        if (status) {
            blog.status = status
            if (status === 'published' && !blog.publishedAt) {
                blog.publishedAt = new Date()
            }
        }

        await blog.save()

        return res.status(200).json({ message: 'Blog updated successfully', data: blog })
    } catch (error) {
        console.error('Update blog error:', error)
        return res.status(500).json({ message: 'Error updating blog' })
    }
}

// Delete a blog (Admin only)
const deleteBlog = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug } = req.params

        const blog = await Blog.findOneAndDelete({ slug })
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' })
        }

        return res.status(200).json({ message: 'Blog deleted successfully' })
    } catch (error) {
        console.error('Delete blog error:', error)
        return res.status(500).json({ message: 'Error deleting blog' })
    }
}

// Get a single blog by slug (Public)
const getBlog = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params

        const blog = await Blog.findOne({ slug, status: 'published' })
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' })
        }

        return res.status(200).json({ data: blog })
    } catch (error) {
        console.error('Get blog error:', error)
        return res.status(500).json({ message: 'Error fetching blog' })
    }
}

// Get all published blogs (Public)
const getBlogs = async (req: Request, res: Response) => {
    try {
        const { category, featured, limit = 20, page = 1 } = req.query

        const query: Record<string, unknown> = { status: 'published' }
        if (category) query.category = category
        if (featured === 'true') query.featured = true

        const blogs = await Blog.find(query)
            .sort({ publishedAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .select('-content') // Exclude content for list view

        const total = await Blog.countDocuments(query)

        return res.status(200).json({
            data: blogs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        })
    } catch (error) {
        console.error('Get blogs error:', error)
        return res.status(500).json({ message: 'Error fetching blogs' })
    }
}

// Get all blogs including drafts (Admin only)
const getAdminBlogs = async (req: ICustomRequest, res: Response) => {
    try {
        const { status, category, author, limit = 20, page = 1 } = req.query

        const query: Record<string, unknown> = {}
        if (status) query.status = status
        if (category) query.category = category
        if (author) query.author = author

        const blogs = await Blog.find(query)
            .sort({ updatedAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .select('-content')

        const total = await Blog.countDocuments(query)

        return res.status(200).json({
            data: blogs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        })
    } catch (error) {
        console.error('Get admin blogs error:', error)
        return res.status(500).json({ message: 'Error fetching blogs' })
    }
}

// Get single blog for editing (Admin only) - includes drafts
const getAdminBlog = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug } = req.params

        const blog = await Blog.findOne({ slug })
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' })
        }

        return res.status(200).json({ data: blog })
    } catch (error) {
        console.error('Get admin blog error:', error)
        return res.status(500).json({ message: 'Error fetching blog' })
    }
}

export {
    createBlog,
    updateBlog,
    deleteBlog,
    getBlog,
    getBlogs,
    getAdminBlogs,
    getAdminBlog,
}
