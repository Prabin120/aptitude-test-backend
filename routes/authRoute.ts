import express from 'express';
import { changePassword, forgotPassword, login, logout, refreshToken, resetPassword, signUp, validToken } from '../controllers/authController';
import {authenticate} from '../middlewares/authMiddleware'

const router = express.Router();

router.post('/login', login);
router.post('/signup', signUp);
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', authenticate, changePassword)
router.get('/valid-token', authenticate, validToken)
router.get('/logout', authenticate, logout)
router.get('/refresh-token', refreshToken)

export default router;