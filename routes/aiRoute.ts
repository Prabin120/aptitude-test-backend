import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { aiGenerateCode, aiImproveCode, chatWithAI, aiFixError, aiChatHistory, getAiLimit, getConversationThreads } from '../controllers/aiController';

const router = express.Router();

router.post('/generate', authenticate, aiGenerateCode);
router.post('/improve', authenticate, aiImproveCode);
router.post('/chat', authenticate, chatWithAI);
router.post('/fix', authenticate, aiFixError);
router.get('/chat', authenticate, aiChatHistory);
router.get('/limit', authenticate, getAiLimit);
router.get('/conversations', authenticate, getConversationThreads);

export default router;