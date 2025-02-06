import express from 'express';
import { adminAuthentication, authenticate, authenticateWithoutReturn } from '../middlewares/authMiddleware';
import {createTest, examTestReport, getSingleTest, getMyTests, submitTest, validateTestQuestion, getAllTests} from '../controllers/testController'
import {checkCache} from '../middlewares/cache';

const router = express.Router();

router.get('/', authenticateWithoutReturn, getAllTests);
router.post('/', adminAuthentication, createTest);
router.get('/my-tests', authenticate, getMyTests);
router.get('/:slug', authenticate, checkCache, getSingleTest);
router.get('/exam-report/:slug', checkCache, authenticate, examTestReport);
router.post('/submit-test', authenticate, submitTest)
router.post('/validate-questions', validateTestQuestion)

export default router