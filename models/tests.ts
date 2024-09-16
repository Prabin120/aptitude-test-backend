import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

interface ITest{
    readonly _id: string;
    title: string;
    description: string;
    questions: mongoose.Types.ObjectId[];
    testTime?: Date;
    duration: number;
};

const testSchema = new mongoose.Schema<ITest>({
    _id: {type: String, default: uuidv4},
    title: {type: String, index: true, unique: true, required: true},
    description: {type: String, required: true},
    questions: [{type: Number, required: true}],
    testTime: {type: Date},
    duration: {type: Number} //in minutes
},{
    timestamps: true
});

const Test = mongoose.model<ITest>('Test', testSchema);
export default Test