import express from 'express';
// import { getTest, registerTest, scoreCard, setQuestions, setTest, submitTest, upcomingTest } from '../controllers/testController';
import { adminAuthentication, authenticate } from '../middlewares/authMiddleware';
// import {validateTestQuestion} from '../controllers/testController'

const router = express.Router();

// router.get('/', authenticate, getTest);
// router.post('/', authenticate, submitTest);
// router.get('/upcoming-test', authenticate, upcomingTest)
// router.post('/test-registration', authenticate, registerTest)
// router.post('/set-questions', adminAuthentication, setQuestions)
// router.post('/set-test', adminAuthentication, setTest)
// router.get('/score-card', authenticate, scoreCard)
// router.post('/validate-questions', adminAuthentication, validateTestQuestion)

export default router