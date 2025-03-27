import express from "express";
import { authenticate, authenticateWithoutReturn } from "../middlewares/authMiddleware";
import { editProfile, profile } from "../controllers/profileController";

const router = express.Router();

router.get('/profile', authenticateWithoutReturn, profile);
router.put('/profile', authenticate, editProfile);

export default router;