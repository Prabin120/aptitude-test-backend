import express from 'express';
import { adminAuthentication, authenticate } from '../middlewares/authMiddleware';
import {createTest, examTestReport, getSingleTest, getTests, submitTest, validateTestQuestion} from '../controllers/testController'

const router = express.Router();

router.get('/', getTests);
router.post('/', adminAuthentication, createTest);
router.get('/:slug', authenticate, getSingleTest);
router.get('/exam-report/:slug', examTestReport);
router.post('/submit-test', authenticate, submitTest)
router.post('/validate-questions', validateTestQuestion)

export default router