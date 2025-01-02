import express from 'express';
import { changePassword, forgotPassword, login, logout, refreshToken, resetPassword, signUp, validToken } from '../controllers/authController';
import {adminAuthentication, authenticate} from '../middlewares/authMiddleware'
import {handleGoogleCallback, initiateGoogleLogin} from '../middlewares/passportSetup'

const router = express.Router();

router.post('/login', login);
router.post('/signup', signUp);
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', authenticate, changePassword)
router.get('/valid-token', authenticate, validToken)
router.get('/logout', authenticate, logout)
router.get('/refresh-token', refreshToken)
router.get('/google-login', initiateGoogleLogin)
router.get('/google-login/callback', handleGoogleCallback)
router.get('/valid-admin-access', adminAuthentication, 
    (req, res) => res.sendStatus(200)
)
export default router;