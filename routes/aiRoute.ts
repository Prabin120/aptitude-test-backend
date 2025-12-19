
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { aiGenerateCode, aiImproveCode, chatWithAI } from '../controllers/aiController';

const router = express.Router();

router.post('/generate', authenticate, aiGenerateCode);
router.post('/improve', authenticate, aiImproveCode);
router.post('/chat', authenticate, chatWithAI);

export default router;