import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import { Request, Response } from "express";
import ICustomRequest from "../utils/customRequest";
import AiCallCount from "../models/aiCallCount";
import { addAiLogJob } from "../utils/aiQueue";
import AiCall from "../models/aiCall";

// Helper to get Gemini client
const getGeminiClient = (apiKey?: string) => new GoogleGenAI({
    apiKey: apiKey || process.env.GOOGLE_API_KEY,
});

const maxAiCalls = parseInt(process.env.MAX_AI_CALLS || "5");

async function runModel(prompt: string, apiKey?: string, model: string = "gemini-2.5-flash") {
    try {
        const client = getGeminiClient(apiKey);
        const response = await client.models.generateContent({
            model: model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
    } catch (error) {
        console.error("AI Model Error:", error);
        throw error;
    }
}

async function checkTokenCount(prompt: string, apiKey?: string, model: string = "gemini-2.5-flash") {
    try {
        const client = getGeminiClient(apiKey);
        const { totalTokens } = await client.models.countTokens({
            model: model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        });
        return totalTokens || Math.ceil(prompt.length / 4);
    } catch (error) {
        console.error("Token Count Error:", error);
        // Fallback to length based approximation if API fails (1 token ~= 4 chars)
        return Math.ceil(prompt.length / 4);
    }
}

const checkAiLimit = async (username: string) => {
    let aiCallCount = await AiCallCount.findOne({ username });

    if (!aiCallCount) {
        aiCallCount = await AiCallCount.create({
            username,
            count: maxAiCalls,
            planType: 'basic'
        });
    }

    const lastUpdated = new Date(aiCallCount.updatedAt).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    if (aiCallCount.count <= 0) {
        if (lastUpdated === today) {
            return { allowed: false, aiCallCount };
        }
        // Reset quota for new day
        aiCallCount.count = maxAiCalls;
        // Save to update date and count
        await aiCallCount.save();
    }

    return { allowed: true, aiCallCount };
}

// New Endpoint: Get AI Limit Status
export const getAiLimit = async (req: ICustomRequest, res: Response) => {
    const user = req.username;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { allowed, aiCallCount } = await checkAiLimit(user);
        return res.status(200).json({
            allowed,
            count: aiCallCount?.count || 0,
            max: maxAiCalls
        });
    } catch (error) {
        console.error("Get Limit Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getGenerateCodePrompt = async (language: string, prompt: string) => {
    const promptPath = path.join(__dirname, "../prompts/generateCode.txt");
    const promptText = await fs.readFile(promptPath, "utf-8");
    return promptText.replace("{language}", language).replace("{prompt}", prompt);
}

const getImproveCodePrompt = async (code: string) => {
    const promptPath = path.join(__dirname, "../prompts/improveCode.txt");
    const promptText = await fs.readFile(promptPath, "utf-8");
    return promptText.replace("{code}", code);
}

const getFixErrorPrompt = async (language: string, code: string, error: string) => {
    const promptPath = path.join(__dirname, "../prompts/fixError.txt");
    const promptText = await fs.readFile(promptPath, "utf-8");
    return promptText
        .replace("{language}", language)
        .replace("{code}", code)
        .replace("{error}", error);
}


export const aiGenerateCode = async (req: ICustomRequest, res: Response) => {
    const { language, prompt, apiKey } = req.body;
    const user = req.username;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        let aiCall;
        if (!apiKey) {
            const { allowed, aiCallCount } = await checkAiLimit(user);
            aiCall = aiCallCount;
            if (!allowed) {
                return res.status(405).json({ message: "No calls left for today" });
            }
        }
        const finalPrompt = await getGenerateCodePrompt(language, prompt);
        const response = await runModel(finalPrompt, apiKey);
        if (!apiKey && aiCall) {
            aiCall.count -= 1;
            await aiCall.save();
        }
        addAiLogJob({ username: user, prompt: finalPrompt, response, apiKey });
        return res.status(200).json({ response });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const aiImproveCode = async (req: ICustomRequest, res: Response) => {
    const { code, apiKey } = req.body;
    const user = req.username;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        let aiCall;
        if (!apiKey) {
            const { allowed, aiCallCount } = await checkAiLimit(user);
            aiCall = aiCallCount;
            if (!allowed) {
                return res.status(405).json({ message: "No calls left for today" });
            }
        }
        const finalPrompt = await getImproveCodePrompt(code);
        const response = await runModel(finalPrompt, apiKey);
        if (!apiKey && aiCall) {
            aiCall.count -= 1;
            await aiCall.save();
        }
        addAiLogJob({ username: user, prompt: finalPrompt, response, apiKey });
        return res.status(200).json({ response });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const chatWithAI = async (req: ICustomRequest, res: Response) => {
    // conversationId and context are optional but recommended
    const { messages, context, apiKey, conversationId } = req.body;
    const user = req.username;

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        let aiCall;
        if (!apiKey) {
            const { allowed, aiCallCount } = await checkAiLimit(user);
            aiCall = aiCallCount;
            if (!allowed) {
                return res.status(405).json({ message: "No calls left for today" });
            }
        }

        const history = messages.slice(0, -1).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n");
        const lastMessage = messages[messages.length - 1].content;

        const promptPath = path.join(__dirname, "../prompts/chatTutor.txt");
        let promptTemplate = await fs.readFile(promptPath, "utf-8");

        const finalPrompt = promptTemplate
            .replace("{context}", context || "General Chat")
            .replace("{history}", history)
            .replace("{message}", lastMessage);

        // Check tokens before sending
        // Gemini 1.5 Flash has 1M context window, but let's set a safe limit 
        // e.g. 30k tokens for chat to avoid indefinite costs or latency
        const TOKEN_LIMIT = 30000;
        const tokenCount = await checkTokenCount(finalPrompt, apiKey);

        if (tokenCount > TOKEN_LIMIT) {
            return res.status(413).json({
                message: "Context Limit Exceeded",
                error: "Conversation too long, please start a new chat."
            });
        }

        const response = await runModel(finalPrompt, apiKey);

        if (!apiKey && aiCall) {
            aiCall.count -= 1;
            await aiCall.save();
        }

        // Save conversationId in log
        // Save the actual user message and response, not the full prompt
        const userMessage = messages[messages.length - 1].content;
        const logEntry = new AiCall({
            username: user,
            prompt: userMessage, // Save only the user's message
            response: response,
            apiKey: apiKey,
            conversationId: conversationId,
            context: context ? (context.length > 50 ? context.substring(0, 50) + '...' : context) : 'Chat'
        });
        await logEntry.save();

        return res.status(200).json({ response });

    } catch (error) {
        console.error("AI Chat Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const aiFixError = async (req: ICustomRequest, res: Response) => {
    const { language, code, error, apiKey } = req.body;
    const user = req.username;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        let aiCall;
        if (!apiKey) {
            const { allowed, aiCallCount } = await checkAiLimit(user);
            aiCall = aiCallCount;
            if (!allowed) {
                return res.status(405).json({ message: "No calls left for today" });
            }
        }
        const finalPrompt = await getFixErrorPrompt(language, code, error);
        const response = await runModel(finalPrompt, apiKey);
        if (!apiKey && aiCall) {
            aiCall.count -= 1;
            await aiCall.save();
        }
        addAiLogJob({ username: user, prompt: finalPrompt, response, apiKey });
        return res.status(200).json({ response });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const aiChatHistory = async (req: ICustomRequest, res: Response) => {
    const user = req.username;
    const { page, conversationId } = req.query;
    const limit = 10; // Increased limit for chat history to show more context
    if (!user) {
        return res.status(400).json({ message: "Please login to use this feature" });
    }

    const query: any = { username: user };
    if (conversationId) {
        query.conversationId = conversationId;
    }

    const aiCalls = await AiCall.find(
        query,
        { prompt: 1, response: 1, createdAt: 1, conversationId: 1 }
    ).sort(
        { createdAt: -1 }
    ).skip(
        (Number(page) - 1) * limit
    ).limit(limit);

    // Reverse because we fetch newest first for pagination, but chat shows oldest first usually
    // However, frontend will handle order.
    return res.status(200).json({ aiCalls });
}

export const getConversationThreads = async (req: ICustomRequest, res: Response) => {
    const user = req.username;
    if (!user) {
        return res.status(400).json({ message: "Please login to use this feature" });
    }

    try {
        // Get unique conversation IDs with their latest message
        const conversations = await AiCall.aggregate([
            { $match: { username: user, conversationId: { $exists: true, $ne: null } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$prompt" },
                    lastResponse: { $first: "$response" },
                    lastUpdated: { $first: "$createdAt" },
                    context: { $first: "$context" },
                    messageCount: { $sum: 1 }
                }
            },
            { $sort: { lastUpdated: -1 } },
            { $limit: 20 }
        ]);

        return res.status(200).json({ conversations });
    } catch (error) {
        console.error("Get Conversations Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
