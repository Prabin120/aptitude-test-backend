import mongoose, { mongo } from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface IUserScore{
    readonly _id: string;
    user: mongoose.Types.ObjectId;
    question: mongoose.Types.ObjectId;
    answer: string[];
    marks: number;
}

const userScoreSchema = new mongoose.Schema<IUserScore>({
    _id: {type: String, default: uuidv4},
    user: {type: mongoose.Schema.ObjectId, ref:'User', required: true, index: true},
    question: {type: mongoose.Schema.ObjectId, ref:'Question', required: true},
    answer: {type: [String], required: true},
    marks: {type: Number, required: true},
})