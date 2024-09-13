import express from 'express';
import { login, signUp, validToken } from '../controllers/authController';
import {authenticate} from '../middlewares/authMiddleware'

const router = express.Router();

router.post('/login', login);
router.post('/sign-up', signUp);
router.get('valid-token', authenticate, validToken)

export default router;