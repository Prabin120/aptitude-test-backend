import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface IPayment{
    readonly _id: string;
    user: mongoose.Types.ObjectId;
    paymentId: string;
    paymentMethod: string;
    amount: number;
};

const paymentSchema = new mongoose.Schema<IPayment>({
    _id: {type: String, default: uuidv4},
    user: {type: mongoose.Schema.ObjectId, ref:'User', index: true, required: true},
    paymentId: {type: String, required: true},
    paymentMethod: {type: String, required: true},
    amount: {type: Number, required: true}
},{
    timestamps: true
});

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;