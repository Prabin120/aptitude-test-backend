import express from 'express';
import { adminAuthentication, authenticate } from '../middlewares/authMiddleware';
import {createTest, examTestReport, getSingleTest, getTests, submitTest, validateTestQuestion} from '../controllers/testController'
import {checkCache} from '../middlewares/cache';

const router = express.Router();

router.get('/', getTests);
router.post('/', adminAuthentication, createTest);
router.get('/:slug', authenticate, checkCache, getSingleTest);
router.get('/exam-report/:slug', checkCache, examTestReport);
router.post('/submit-test', authenticate, submitTest)
router.post('/validate-questions', validateTestQuestion)

export default router