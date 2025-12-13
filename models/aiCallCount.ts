import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid";


const aiCallCountSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    username: { type: String, index: true, required: true },
    planType: { type: String, enum: ['basic', 'premium'], required: true },
    count: { type: Number, required: true, default: 5 },
}, { timestamps: true })

const AiCallCount = mongoose.model('AiCallCount', aiCallCountSchema)
export default AiCallCount