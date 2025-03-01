import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IGroupTest{
    readonly _id: string;
    organizer: string
    participants: string[]
    title: string;
    description: string;
    apti_list?: Object[];
    code_list?: Object[];
    startDateTime: Date;
    endDateTime: Date;
    duration: number;
    amount: number
    paid: boolean
    orderId: string
    totalParticipants: Number
}

const groupTestSchema = new mongoose.Schema<IGroupTest>({
    _id: {type: String, default: uuidv4},
    organizer: {type: String, index: true, required: true},
    participants: [{type: String, index: true}],
    title: {type: String, required: true},
    description: {type: String, required: true},
    apti_list: [{type: Object}],
    code_list: [{type: Object}],
    startDateTime: {type: Date},
    endDateTime: {type: Date},
    duration: {type: Number},
    amount: {type: Number, default: 0},
    paid: {type: Boolean, default: false},
    orderId: {type: String},
    totalParticipants: {type: Number}
},{ timestamps: true })

groupTestSchema.index({user: 1, title: 1})

const GroupTest = mongoose.model('GroupTest', groupTestSchema)
export default GroupTest