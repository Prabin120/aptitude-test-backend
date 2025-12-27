
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/genai';
import slugify from 'slugify';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const GO_MONGO_URI = "mongodb+srv://prabinsharma120:wlqldDe2K4X2C2Al@cluster0.fhnky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // From docker-compose.dev.yml (go-app)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBsXmUS5glH4F7zpcBoSbMFiCCR1EALwts"; // Fallback to dev key if env missing

// Connect to MongoDB
mongoose.connect(GO_MONGO_URI)
    .then(() => console.log('Connected to Go Service MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Temporary Schema matching Go's Question Struct
const QuestionSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // We'll generate UUID
    questionNo: { type: String },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    tags: [String],
    companies: [String],
    sampleTestCases: [{
        input: String,
        output: String
    }],
    testCaseVariableNames: String, // "nums, target"
    codeTemplates: {
        type: Map,
        of: new mongoose.Schema({
            precode: String,
            template: String,
            postcode: String
        }, { _id: false })
    },
    fullSolutions: { type: Map, of: String },
    status: { type: String, default: 'live' }, // Auto-publish for now
    isPublic: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const QuestionModel = mongoose.model('Question', QuestionSchema, 'questions'); // Collection name 'questions'

// Gemini Setup
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateQuestion(topic: string, difficulty: string) {
    console.log(`Generating ${difficulty} question for ${topic}...`);

    const prompt = `
    Generate a unique coding interview question about "${topic}" with difficulty "${difficulty}".
    Return ONLY a JSON object with this exact structure (no markdown, no comments):
    {
        "title": "Problem Title",
        "description": "Problem description in markdown",
        "tags": ["${topic}", "Array"],
        "companies": ["Google", "Amazon"],
        "sampleTestCases": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]"}
        ],
        "testCaseVariableNames": "nums, target",
        "codeTemplates": {
            "javascript": {
                "precode": "",
                "template": "// Write your code here\\nfunction solve(nums, target) {\\n}",
                "postcode": ""
            },
            "python": {
                "precode": "",
                "template": "def solve(nums, target):\\n    pass",
                "postcode": ""
            }
        },
        "fullSolutions": {
            "javascript": "function solve(nums, target) { ... }",
            "python": "def solve(nums, target): ..."
        }
    }
    Make sure the Code Template function signatures match the test variables.
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        return data;
    } catch (error) {
        console.error("AI Generation Failed:", error);
        return null;
    }
}

async function main() {
    const topic = process.argv[2] || "Arrays";
    const count = parseInt(process.argv[3]) || 1;

    console.log(`Starting Batch Generation: ${count} questions for ${topic}`);

    for (let i = 0; i < count; i++) {
        const difficulty = ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)];
        const questionData = await generateQuestion(topic, difficulty);

        if (questionData) {
            // Post-processing
            const uuid = (await import('uuid')).v4();
            questionData._id = uuid;
            questionData.slug = slugify(questionData.title, { lower: true, strict: true }) + '-' + Math.floor(Math.random() * 1000);
            questionData.questionNo = Math.floor(Math.random() * 10000).toString(); // Temp random logic

            try {
                await QuestionModel.create(questionData);
                console.log(`SUCCESS: Created "${questionData.title}" (${questionData._id})`);
            } catch (dbErr) {
                console.error(`DB Error for "${questionData.title}":`, dbErr);
            }
        }

        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("Done.");
    mongoose.disconnect();
}

main();
