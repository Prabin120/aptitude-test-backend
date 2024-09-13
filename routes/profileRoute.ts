import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { changePassword, editProfile, profile } from "../controllers/profileController";

const router = express.Router();

router.get('/profile', authenticate, profile);
router.put('/profile', authenticate, editProfile);
router.post('/change-password', authenticate, changePassword);
// router.get('/test', authenticate, profile);

export default router;