import Razorpay from "razorpay"
import crypto from "crypto"
import dotenv from "dotenv"

dotenv.config()

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
})

export interface IPaymentOrder{
    amount: number
    currency: string
    receipt: string
}

export const createOrder = async (options: IPaymentOrder) => {
    try {
        const order = await razorpayInstance.orders.create(options)
        if (order) {
            return order.id
        } else {
            return ""
        }
    } catch (error) {
        console.error(error)
        return ""
    }
}

export const verifyPayment = async (razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) => {
    try {        
        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
            .update(body.toString())
            .digest("hex")

        if (expectedSignature === razorpay_signature) {
            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
            if (payment.status !== 'captured') {
                return undefined;
            }
            return payment;
        }
        return undefined
    } catch (error) {
        console.error("Verification error:", error)
        return undefined
    }
}
