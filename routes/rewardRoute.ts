import express from "express";
import { validatorAccess, authenticate } from "../middlewares/authMiddleware";
import { getCoinsData, getDashboard, getHistoryData, createDepositeOrder, verifyDepositCoins } from "../controllers/rewardsController";

const router = express.Router();

router.get('/coins', validatorAccess, getCoinsData);
router.get('/history', validatorAccess, getHistoryData);
router.get('/dashboard', validatorAccess, getDashboard);
router.post('/create-order', authenticate, createDepositeOrder);
router.post('/verify-payment',  authenticate, verifyDepositCoins);

export default router;