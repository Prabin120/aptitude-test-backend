import express from 'express';
import { adminAuthentication } from '../middlewares/authMiddleware';
import {
    addQuestion, getAllQuestion, getQuestion, getQuestionByCategoty, getQuestionByCompany,
    getQuestionById, getQuestionByTopic, modifyQuestion, searchLikeQuestions
} from '../controllers/questionController';
import { addQuestionTag, getQuestionTagBasedOnCategory, getQuestionTagBasedOnCompany, getQuestionTagBasedOnTopic, getQuestionTags } from '../controllers/questionTagsController';
import { checkCache } from '../middlewares/cache';

const router = express.Router();

router.post('/questions', adminAuthentication, addQuestion);
router.get('/questions', checkCache, getAllQuestion);
router.get('/question/:slug', checkCache, getQuestion);
router.get('/question', checkCache, getQuestionById);
router.put('/question/:slug', adminAuthentication, modifyQuestion);

router.get('/questions/category/:category', checkCache, getQuestionByCategoty);
router.get('/questions/topic/:topic', checkCache, getQuestionByTopic);
router.get('/questions/company/:company', checkCache, getQuestionByCompany);

router.post('/question-tag', adminAuthentication, addQuestionTag);
router.get('/question-tag', checkCache, getQuestionTags);

router.get('/question-tag/category', checkCache, getQuestionTagBasedOnCategory);
router.get('/question-tag/topic', checkCache, getQuestionTagBasedOnTopic);
router.get('/question-tag/company', checkCache, getQuestionTagBasedOnCompany);

router.get('/questions/like', searchLikeQuestions);

export default router