import mongoose from "mongoose";
import slugify from "slugify";
import { v4 as uuidv4 } from 'uuid';

interface ITest{
    readonly _id: string;
    title: string;
    slug: string;
    description: string;
    apti_list?: string[];
    aptiMarks?: string
    code_list?: string[];
    codingMarks?: string
    type: "exam" | "practice"
    startDateTime?: Date;
    endDateTime?: Date;
    duration?: number;
};

const testSchema = new mongoose.Schema<ITest>({
    _id: {type: String, default: uuidv4},
    title: {type: String, index: true, unique: true, required: true},
    slug: {type: String, index: true, unique: true},
    description: {type: String, required: true},
    apti_list: [{type: String}],
    aptiMarks: {type: String},
    code_list: [{type: String}],
    codingMarks: {type: String},
    type: {type: String, enum: ['exam', 'practice'], default: 'practice'},
    startDateTime: {type: Date},
    endDateTime: {type: Date},
    duration: {type: Number} //in minutes
},{
    timestamps: true
});

testSchema.pre<ITest>('save', async function (next) {
    try {
        const generatedSlug = slugify(this.title, { lower: true, strict: true });
        this.slug = generatedSlug;
        next();
    } catch (error) {
        next(error as mongoose.CallbackError);
    }
});

const Test = mongoose.model<ITest>('Test', testSchema);
export default Test