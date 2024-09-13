import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { editProfile, profile } from "../controllers/profileController";

const router = express.Router();

router.get('/profile', authenticate, profile);
router.put('/profile', authenticate, editProfile);

export default router;