import mongoose, { Document, Schema, Model } from "mongoose";
import slugify from "slugify";

// Interface for the Question model
interface IQuestion extends Document {
    slug: string;
    questionNo: number;
    title: string;
    description: string;
    type: 'MCQ' | 'MAQ';
    options: string[];
    answers: number[];
    marks: number;
    topics: string[];
    categories: string[];
    companies: string[];
    questionKind?: string
}

// Interface for the QuestionIdCounter model
interface IQuestionIdCounter extends Document {
    _id: string; // Change this to string
    seq: number;
}

// Schema for the QuestionIdCounter model
const QuestionIdCounterSchema = new Schema<IQuestionIdCounter>({
    _id: { type: String, required: true }, // Explicitly define _id as a string
    seq: { type: Number, default: 0, required: true },
});

// Create the Counter model
const Counter: Model<IQuestionIdCounter> = mongoose.model<IQuestionIdCounter>('QuestionIdCounter', QuestionIdCounterSchema);

// Schema for the Question model
const QuestionSchema = new Schema<IQuestion>({
    slug: { type: String, unique: true, index: true },
    questionNo: { type: Number, unique: true, index: true },
    title: { type: String, index: true, unique: true, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['MCQ', 'MAQ'], default: 'MCQ' },
    options: { type: [String], required: true },
    answers: { type: [Number], required: true },
    marks: { type: Number, required: true },
    topics: { type: [String], index: true },
    categories: { type: [String], index: true },
    companies: { type: [String], index: true }
}, {
    timestamps: true,
});

// Pre-save middleware to auto-increment questionNo
QuestionSchema.pre<IQuestion>('save', async function (next) {
    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'questionIdCounter' }, // This is now valid
            { $inc: { seq: 1 } },
            { new: true, upsert: true } // Create a new counter if it doesn't exist
        );

        if (!counter) {
            throw new Error('Failed to increment question ID counter');
        }

        this.questionNo = counter.seq;

        // Generate slug
        let generatedSlug = slugify(this.title, { lower: true, strict: true });
        if (generatedSlug.length > 30) {
            generatedSlug = generatedSlug.substring(0, 30);
        }

        // Ensure slug uniqueness
        let existingQuestion = await mongoose.model<IQuestion>('Question').findOne({ slug: generatedSlug });
        let suffix = 1;
        while (existingQuestion) {
            generatedSlug = `${generatedSlug}-${suffix}`;
            existingQuestion = await mongoose.model<IQuestion>('Question').findOne({ slug: generatedSlug });
            suffix++;
        }

        this.slug = generatedSlug;

        next();
    } catch (error) {
        next(error as mongoose.CallbackError);
    }
});

const Question: Model<IQuestion> = mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;