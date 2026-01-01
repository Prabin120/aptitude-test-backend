import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";


const aiCallSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    username: { type: String, index: true, required: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    apiKey: { type: String, required: false },
    conversationId: { type: String, index: true, required: false }, // Group messages by conversation
    context: { type: String, required: false }, // Store page context/slug
}, { timestamps: true })

const AiCall = mongoose.model('AiCall', aiCallSchema)
export default AiCall