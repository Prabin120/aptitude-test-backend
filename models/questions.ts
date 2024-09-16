import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

interface IQuestion{
    readonly _id: string;
    questionNo: number;
    title: string;
    type: 'MCQ' | 'MAQ';
    options: string[];
    answer: string[];
    marks: number;
};

const questionSchema = new mongoose.Schema<IQuestion>({
    _id: {type: String, default: uuidv4},
    questionNo: {type: Number, required: true, unique: true, index: true},
    title: {type: String, index: true, unique: true, required: true},
    type: {type: String, enum: ['MCQ', 'MAQ'], default:'MCQ'},
    options: {type: [String], required: true},
    answer: {type: [String], required: true},
    marks: {type: Number, required: true}
},{
    timestamps: true
});

const Question = mongoose.model<IQuestion>('Question', questionSchema);
export default Question;