import mongoose, { Document, Schema } from "mongoose";

export interface INote extends Document {
    username: string;
    slug: string;
    domain: "aptitude" | "coding" | "general";
    content: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
    {
        username: { type: String, required: true },
        slug: { type: String, required: true },
        domain: {
            type: String,
            enum: ["aptitude", "coding", "general"],
            required: true,
            default: "general"
        },
        content: { type: String, required: true },
        tags: { type: [String], default: [] },
    },
    { timestamps: true }
);

// Compound index to ensure one note per user per slug
NoteSchema.index({ username: 1, slug: 1 }, { unique: true });

const Note = mongoose.model('Note', NoteSchema)
export default Note