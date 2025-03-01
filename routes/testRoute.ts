import express from 'express';
import { adminAuthentication, authenticate, authenticateWithoutReturn } from '../middlewares/authMiddleware';
import {createTest, examTestReport, getSingleTest, getMyTests, submitTest, validateTestQuestion, 
    getAllTests, verifyTestPayment, registerTest, getGroupTest} from '../controllers/testController'
import {checkCache} from '../middlewares/cache';

const router = express.Router();

router.get('/', authenticateWithoutReturn, getAllTests);
router.post('/', adminAuthentication, createTest);
router.get('/my-tests', authenticate, getMyTests);
router.get('/:slug', authenticate, getSingleTest);
router.get('/exam-report/:slug', checkCache, authenticateWithoutReturn, examTestReport);
router.post('/submit-test', authenticate, submitTest)
router.post('/validate-questions', validateTestQuestion)
router.post('/create-order',  authenticate, registerTest);
router.post('/verify-payment',  authenticate, verifyTestPayment);
router.get('/group-test/:testId', authenticate, checkCache, getGroupTest);

export default router