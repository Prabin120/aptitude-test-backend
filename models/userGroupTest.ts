import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IGroupUserTest{
    readonly _id: string;
    user: string
    test: string
    aptitudeAnswers?: {[key: string]: string | [string]};
    codingAnswers?: object;
    marksAchieved?: number;
    bookedTime: Date;
    duration: number;
    totalMarks?: number;
    attempted: boolean;
}

const groupUserTestSchema = new mongoose.Schema<IGroupUserTest>({
    _id: {type: String, default: uuidv4},
    user: {type: String, ref: 'User', required: true},
    test: {type: String, ref: 'GroupTest', required: true},
    aptitudeAnswers: [{type: Object}],
    codingAnswers: [{type: Object}],
    marksAchieved: {type: Number},
    totalMarks: {type: Number},
    attempted: {type: Boolean, default: false},
},{ timestamps: true })

groupUserTestSchema.index({user: 1, test: 1}, {unique: true})

const UserGroupTest = mongoose.model('UserGroupTest', groupUserTestSchema)
export default UserGroupTest