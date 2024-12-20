import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface IUserTest{
    readonly _id: string;
    user: string
    test: string
    aptitudeAnswers?: {[key: string]: string | [string]};
    codingAnswers?: object;
    marksAchieved?: number;
    paid: boolean;
    bookedTime: Date;
    duration: number;
    totalMarks?: number;
    attempted: boolean;
}

const userTestSchema = new mongoose.Schema<IUserTest>({
    _id: {type: String, default: uuidv4},
    user: {type: String, ref: 'User', required: true},
    test: {type: String, required: true},
    aptitudeAnswers: [{type: Object}],
    codingAnswers: [{type: Object}],
    marksAchieved: {type: Number},
    totalMarks: {type: Number},
    // paid: {type: Boolean, default: false},
    attempted: {type: Boolean, default: false}
},{ timestamps: true })

userTestSchema.index({user: 1, test: 1}, {unique: true})

const UserTest = mongoose.model('UserTest', userTestSchema)
export default UserTest