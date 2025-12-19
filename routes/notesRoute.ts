import express from "express";
import {
    createNote,
    deleteNote,
    getAllNotes,
    getNoteBySlug,
    updateNote
} from "../controllers/notesController";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

// Apply auth middleware to all note routes
router.use(authenticate);

router.post("/", createNote);
router.get("/", getAllNotes);
router.get("/:slug", getNoteBySlug);
router.put("/:slug", updateNote);
router.delete("/:slug", deleteNote);

export default router;
