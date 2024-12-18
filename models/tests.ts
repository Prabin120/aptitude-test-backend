import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

interface ITest{
    readonly _id: string;
    title: string;
    description: string;
    aptiQuestions: mongoose.Types.ObjectId[];
    codingQuestion?: string[];
    type: "exam" | "practice"
    testTime?: Date;
    duration?: number;
};

const testSchema = new mongoose.Schema<ITest>({
    _id: {type: String, default: uuidv4},
    title: {type: String, index: true, unique: true, required: true},
    description: {type: String, required: true},
    aptiQuestions: [{type: Number}],
    codingQuestion: [{type: String}],
    type: {type: String, enum: ['exam', 'practice'], default: 'practice'},
    testTime: {type: Date},
    duration: {type: Number} //in minutes
},{
    timestamps: true
});

const Test = mongoose.model<ITest>('Test', testSchema);
export default Test