import type { Request, Response } from "express"
import Razorpay from "razorpay"
import crypto from "crypto"
import dotenv from "dotenv"

dotenv.config()

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
})

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { amount, name, description } = req.body
        const options = {
            amount: Number(amount),
            currency: "INR",
            receipt: `order_${Date.now()}`,
        }

        const order = await razorpayInstance.orders.create(options)
        if (order) {
            return res.status(200).json({
                success: true,
                msg: "Order Created",
                order_id: order.id,
                amount: amount,
                key_id: process.env.RAZORPAY_KEY_ID,
                product_name: name,
                description: description,
            })
        } else {
            return res.status(400).json({ success: false, msg: "Something went wrong!" })
        }
    } catch (error) {
        console.error(error)
        return res.status(400).json({ success: false, msg: "Something went wrong!" })
    }
}

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
        const body = razorpay_order_id + "|" + razorpay_payment_id

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
            .update(body.toString())
            .digest("hex")

        if (expectedSignature === razorpay_signature) {
            // Payment is successful, you can update your database here
            res.status(200).json({ status: "ok", message: "Payment verified successfully" })
        } else {
            res.status(400).json({ status: "failed", error: "Invalid signature" })
        }
    } catch (error) {
        console.error("Verification error:", error)
        res.status(500).json({ status: "error", error: "Internal server error" })
    }
}

