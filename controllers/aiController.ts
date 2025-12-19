import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import { Request, Response } from "express";
import ICustomRequest from "../utils/customRequest";
import AiCallCount from "../models/aiCallCount";
import { addAiLogJob } from "../utils/aiQueue";

const AI = (apiKey?: string) => new GoogleGenAI({
    apiKey: apiKey || process.env.GOOGLE_API_KEY,
});

const maxAiCalls = parseInt(process.env.MAX_AI_CALLS || "5");

async function runModel(prompt: string, apiKey?: string, model: string = "gemini-2.5-flash") {
    try {
        const response = await AI(apiKey).models.generateContent({
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
    const { messages, context, apiKey } = req.body; // messages is an array of { role: 'user' | 'model', content: string }
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

        const response = await runModel(finalPrompt, apiKey);

        if (!apiKey && aiCall) {
            aiCall.count -= 1;
            await aiCall.save();
        }

        addAiLogJob({ username: user, prompt: finalPrompt, response, apiKey });
        return res.status(200).json({ response });

    } catch (error) {
        console.error("AI Chat Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}
