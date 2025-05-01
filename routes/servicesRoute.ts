import express from "express";
import { validatorAccess } from "../middlewares/authMiddleware";
import { sentQuestionApprovedMail, sentQuestionRejectedMail } from "../controllers/servicesController";

const router = express.Router();

router.post('/question-rejected-mail', validatorAccess, sentQuestionRejectedMail);
router.post('/question-approaved-mail', validatorAccess, sentQuestionApprovedMail);

export default router;