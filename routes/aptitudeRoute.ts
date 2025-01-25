import express from 'express';
import { adminAuthentication } from '../middlewares/authMiddleware';
import { addQuestion, getAllQuestion, getQuestion, getQuestionByCategoty, getQuestionByCompany, getQuestionById, getQuestionByTopic, modifyQuestion } from '../controllers/questionController';
import { addQuestionTag, getQuestionTags } from '../controllers/questionTagsController';
import {checkCache} from '../middlewares/cache';

const router = express.Router();

router.get('/questions/category/:category', checkCache, getQuestionByCategoty);
router.get('/questions/topic/:topic', checkCache, getQuestionByTopic);
router.get('/questions/company/:company', checkCache, getQuestionByCompany);
router.post('/questions',adminAuthentication, addQuestion);
router.get('/questions', checkCache, getAllQuestion); 
router.get('/question/:slug', checkCache, getQuestion);
router.get('/question', checkCache, getQuestionById);
router.put('/question',adminAuthentication, modifyQuestion);
router.post('/question-tag',adminAuthentication, addQuestionTag);
router.get('/question-tag', checkCache, getQuestionTags);

export default router