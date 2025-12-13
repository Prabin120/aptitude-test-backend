import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const blogSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    slug: { type: String, unique: true, required: true, index: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    content: { type: String, required: true }, // HTML from rich text editor
    category: { type: String, enum: ['Tutorial', 'Guide'], required: true },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date },
}, { timestamps: true })

// Auto-generate slug from title if not provided
blogSchema.pre('save', function (next) {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
    // Set publishedAt when status changes to published
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date()
    }
    next()
})

const Blog = mongoose.model('Blog', blogSchema)

export default Blog
