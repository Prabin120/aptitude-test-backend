import express from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController";
import { authenticate } from "../middlewares/authMiddleware";

const router = express();

router.post('/create-order',  authenticate, createOrder);
router.post('/verify-payment',  authenticate, verifyPayment);

export default router