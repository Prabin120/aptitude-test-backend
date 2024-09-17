import express from 'express';
import { changePassword, login, logout, signUp, validToken } from '../controllers/authController';
import {authenticate} from '../middlewares/authMiddleware'

const router = express.Router();

router.post('/login', login);
router.post('/signup', signUp);
router.post('/change-password', authenticate, changePassword)
router.get('/valid-token', authenticate, validToken)
router.get('/logout', authenticate, logout)

export default router;