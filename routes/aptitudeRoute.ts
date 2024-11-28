import express from 'express';
import { adminAuthentication } from '../middlewares/authMiddleware';
import { addQuestion, getAllQuestion, getQuestion, getQuestionByCategoty, getQuestionByCompany, getQuestionById, getQuestionByTopic, modifyQuestion } from '../controllers/questionController';
import { addQuestionTag, getQuestionTags } from '../controllers/questionTagsController';

const router = express.Router();

router.get('/questions/category/:category', getQuestionByCategoty);
router.get('/questions/topic/:topic', getQuestionByTopic);
router.get('/questions/company/:company', getQuestionByCompany);
router.post('/questions',adminAuthentication, addQuestion);
router.get('/questions', getAllQuestion);
router.get('/question/:slug', getQuestion);
router.get('/question', getQuestionById);
router.put('/question',adminAuthentication, modifyQuestion);
router.post('/question-tag',adminAuthentication, addQuestionTag);
router.get('/question-tag', getQuestionTags);

export default router