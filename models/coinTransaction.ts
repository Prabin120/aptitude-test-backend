import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ICoinTransaction {
    _id: string;
    username: string;
    amount: number;
    status: string;
    type: "withdrawal" | "earning";
    description: string;
}

const coinTransactionSchema = new mongoose.Schema<ICoinTransaction>({
    _id: {type: String, default: uuidv4},
    username: {type: String, index: true, required: true},
    amount: {type: Number, required: true},
    status: {type: String, required: true},
    type: {type: String, required: true},
    description: {type: String, required: true},
}, {timestamps: true});

const CoinTransaction = mongoose.model<ICoinTransaction>('CoinTransaction', coinTransactionSchema);
export default CoinTransaction