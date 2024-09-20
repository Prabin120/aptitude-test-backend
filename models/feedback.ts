import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface IFeedback{
    readonly _id: string;
    user?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
};

const feedbackSchema = new mongoose.Schema<IFeedback>({
    _id: {type: String, default: uuidv4},
    user: {type: String, index: true},
    name: {type: String},
    email: {type: String},
    subject: {type: String},
    message: {type: String}
},{
    timestamps: true
});

const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
export default Feedback;