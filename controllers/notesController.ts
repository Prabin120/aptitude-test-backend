import { Response } from "express";
import ICustomRequest from "../utils/customRequest";
import Note from "../models/notes";

const createNote = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug, domain, content, tags } = req.body;
        const username = req.username;

        if (!username) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!slug || !content || !domain) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if note already exists for this slug
        const existingNote = await Note.findOne({ username, slug });
        if (existingNote) {
            return res.status(409).json({ message: "Note already exists for this item. Use PUT to update." });
        }

        const newNote = await Note.create({
            username,
            slug,
            domain,
            content,
            tags
        });

        return res.status(201).json(newNote);
    } catch (error) {
        console.error("Error creating note:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getNoteBySlug = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug } = req.params;
        const username = req.username;

        if (!username) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const note = await Note.findOne({ username, slug });
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        return res.status(200).json(note);
    } catch (error) {
        console.error("Error fetching note:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getAllNotes = async (req: ICustomRequest, res: Response) => {
    try {
        const username = req.username;
        const { domain } = req.query;

        if (!username) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const filter: any = { username };
        if (domain) {
            filter.domain = domain;
        }

        const notes = await Note.find(filter).sort({ updatedAt: -1 });
        return res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching user notes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updateNote = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug } = req.params; // Identifier in URL
        const { content, tags, domain } = req.body;
        const username = req.username;

        if (!username) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const note = await Note.findOne({ username, slug });
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        if (content !== undefined) note.content = content;
        if (tags !== undefined) note.tags = tags;
        if (domain !== undefined) note.domain = domain;

        await note.save();
        return res.status(200).json(note);
    } catch (error) {
        console.error("Error updating note:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const deleteNote = async (req: ICustomRequest, res: Response) => {
    try {
        const { slug } = req.params;
        const username = req.username;

        if (!username) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const result = await Note.findOneAndDelete({ username, slug });
        if (!result) {
            return res.status(404).json({ message: "Note not found" });
        }

        return res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export {
    createNote,
    getNoteBySlug,
    getAllNotes,
    updateNote,
    deleteNote
};
