import express from "express";
import { validatorAccess } from "../middlewares/authMiddleware";
import { getCoinsData, getDashboard, getHistoryData } from "../controllers/rewardsController";

const router = express.Router();

router.get('/coins', validatorAccess, getCoinsData);
router.get('/history', validatorAccess, getHistoryData);
router.get('/dashboard', validatorAccess, getDashboard);

export default router;