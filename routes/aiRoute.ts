
import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { aiGenerateCode, aiImproveCode } from '../controllers/aiController';

const router = express.Router();

router.post('/generate', authenticate, aiGenerateCode);
router.post('/improve', authenticate, aiImproveCode);

export default router;