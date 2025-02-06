import type { Response } from "express"
import Razorpay from "razorpay"
import crypto from "crypto"
import dotenv from "dotenv"
import Test from "../models/tests"
import Payment from "../models/payment"
import UserTest from "../models/userTest"
import ICustomRequest from "../utils/customRequest"
import User from "../models/user"

dotenv.config()

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
})

export const createOrder = async (req: ICustomRequest, res: Response) => {
    try {
        const { testId } = req.body
        const test = await Test.findById(testId)
        if(!test){
            return res.status(400).json({ success: false, msg: "Test not found!" })
        }
        const user = await User.findById(req.userId)
        if(!user){
            return res.status(400).json({ success: false, msg: "User not found!" })
        }
        const userTest = await UserTest.findOne({user: req.userId, test: testId})
        if(userTest){
            return res.status(400).json({ success: false, msg: "You have already taken this test!" })
        }
        if(test.type === 'practice'){
            await UserTest.create({ user: user, test: testId, paid: true })
            return res.status(200).json({ success: true, msg: "Registration Successful" })
        }
        const options = {
            amount: test.amount*100,
            currency: "INR",
            receipt: `order_${Date.now()}`,
        }
        const order = await razorpayInstance.orders.create(options)
        if (order) {
            return res.status(200).json({
                success: true,
                msg: "Order Created",
                order_id: order.id,
                amount: test.amount,
                key_id: process.env.RAZORPAY_KEY_ID,
                product_name: "AptiCode",
            })
        } else {
            return res.status(400).json({ success: false, msg: "Something went wrong!" })
        }
    } catch (error) {
        console.error(error)
        return res.status(400).json({ success: false, msg: "Something went wrong!" })
    }
}

export const verifyPayment = async (req: ICustomRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, testId } = req.body
        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
            .update(body.toString())
            .digest("hex")

        if (expectedSignature === razorpay_signature) {
            const user = await User.findById(userId)
            if (!user) {
                return res.status(400).json({ status: "failed", error: "User not found" })
            }
            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id)
            await Payment.create({ user: user, paymentId: razorpay_payment_id, paymentMethod: "razorpay", amount: payment.amount, paymentObject: payment, description: payment.description })
            await UserTest.create({ user: user, test: testId, paid: true })
            res.status(200).json({ status: "ok", message: "Payment verified successfully" })
        } else {
            res.status(400).json({ status: "failed", error: "Invalid signature" })
        }
    } catch (error) {
        console.error("Verification error:", error)
        res.status(500).json({ status: "error", error: "Internal server error" })
    }
}

