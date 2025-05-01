import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ICoin {
    _id: string;
    username: string;
    balance: number;
    lifetimeEarnings: number;
    totalWithdraw: number;
}

const coinSchema = new mongoose.Schema<ICoin>({
    _id: {type: String, default: uuidv4},
    username: {type: String, index: true, required: true},
    balance: {type: Number, required: true},
    lifetimeEarnings: {type: Number, required: true},
    totalWithdraw: {type: Number, required: true},
}, {timestamps: true});

const Coin = mongoose.model<ICoin>('Coin', coinSchema);
export default Coin