import Razorpay from "razorpay";
import ICustomRequest from "../utils/customRequest";
import { Response } from "express";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

const createOrder = async (req: ICustomRequest, res: Response) => {
    console.log(req.body);
    try {
        const amount = req.body.amount;
        const options = {
            amount,
            currency: "INR",
            receipt: "razorUser@gmail.com",
        };

        const order = await razorpayInstance.orders.create(options);
        if (order) {
            return res.status(200).json({
                success: true,
                msg: "Order Created",
                order_id: order.id,
                amount: amount,
                key_id: process.env.RAZORPAY_KEY_ID,
                product_name: req.body.name,
                description: req.body.description,
            });
        } else {
            return res
                .status(400)
                .json({ success: false, msg: "Something went wrong!" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(400)
            .json({ success: false, msg: "Something went wrong!" });
    }
};

const verifyPayment = async (req: ICustomRequest, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    console.log(req.body);
    
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        res.status(200).json({ status: "ok" });
    } else {
        res.status(400).json({ error: "Invalid signature" });
    }
};

export { createOrder, verifyPayment };
