import mongoose from "mongoose";
import slugify from "slugify";
import { v4 as uuidv4 } from 'uuid';

export interface ITest{
    readonly _id: string;
    title: string;
    slug: string;
    description: string;
    apti_list?: Object[];
    code_list?: Object[];
    type: "exam" | "practice"
    startDateTime?: Date;
    endDateTime?: Date;
    duration?: number;
    amount: number
};

const testSchema = new mongoose.Schema<ITest>({
    _id: {type: String, default: uuidv4},
    title: {type: String, index: true, unique: true, required: true},
    slug: {type: String, index: true, unique: true},
    description: {type: String, required: true},
    apti_list: [{type: Object}],
    code_list: [{type: Object}],
    type: {type: String, enum: ['exam', 'practice'], default: 'practice'},
    startDateTime: {type: Date},
    endDateTime: {type: Date},
    duration: {type: Number}, //in minutes
    amount: {type: Number, default: 0}
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