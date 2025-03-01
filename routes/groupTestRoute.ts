import express from 'express';
import { adminAuthentication, authenticate, authenticateWithoutReturn } from '../middlewares/authMiddleware';
import {createGroupTest, verifyGroupTestPayment, getGroupTests, getGroupTestMailStatus, addPaticipants, getOwnedGroupTests,
     getDetailGroupTest, modifyGroupTest, resendMail, editEmail, getSingleTest, 
     submitTest, examTestReport} from '../controllers/groupTestController';
import { checkCache } from '../middlewares/cache';

const router = express.Router();

router.get('/', authenticateWithoutReturn, getGroupTests);
router.post('/',  authenticate, createGroupTest);
router.get('/single/:testId', authenticate, getSingleTest);
router.post('/verify-payment',  authenticate, verifyGroupTestPayment);
router.get('/mail-status', authenticate, getGroupTestMailStatus);
router.get('/add-me', authenticate, addPaticipants);
router.get('/resend-mails', authenticate, resendMail);
router.put('/edit-mail', authenticate, editEmail);
router.get('/owned-tests', authenticate, getOwnedGroupTests);
router.get('/owned-tests/:testId', authenticate, checkCache, getDetailGroupTest);
router.put('/owned-tests/:testId', authenticate, modifyGroupTest);
router.post('/submit-test', authenticate, submitTest);
router.get('/exam-report/:testId', authenticateWithoutReturn, checkCache, examTestReport);

export default router