import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import { Request, Response } from "express";
import ICustomRequest from "../utils/customRequest";
import AiCallCount from "../models/aiCallCount";
import { addAiLogJob } from "../utils/aiQueue";

const AI = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});

const maxAiCalls = parseInt(process.env.MAX_AI_CALLS || "5");

async function runModel(prompt: string, model: string = "gemini-2.5-flash") {
    try {
        const response = await AI.models.generateContent({
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

export const aiGenerateCode = async (req: ICustomRequest, res: Response) => {
    const { language, prompt } = req.body;
    const user = req.username;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { allowed, aiCallCount } = await checkAiLimit(user);
        if (!allowed) {
            return res.status(405).json({ message: "No calls left for today" });
        }

        const promptPath = path.join(__dirname, "../prompts/generateCode.txt");
        const promptText = await fs.readFile(promptPath, "utf-8");
        const finalPrompt = promptText.replace("{language}", language).replace("{prompt}", prompt);

        const response = await runModel(finalPrompt);

        // Deduct credit only on success
        if (aiCallCount) {
            aiCallCount.count -= 1;
            await aiCallCount.save();
        }

        addAiLogJob({ username: user, prompt: finalPrompt, response });

        return res.status(200).json({ response });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const aiImproveCode = async (req: ICustomRequest, res: Response) => {
    const { code } = req.body;
    const user = req.username;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { allowed, aiCallCount } = await checkAiLimit(user);
        if (!allowed) {
            return res.status(405).json({ message: "No calls left for today" });
        }

        const promptPath = path.join(__dirname, "../prompts/codeImprovement.txt");
        const promptText = await fs.readFile(promptPath, "utf-8");
        const finalPrompt = promptText.replace("{code}", code);

        const response = await runModel(finalPrompt);

        // Deduct credit only on success
        if (aiCallCount) {
            aiCallCount.count -= 1;
            await aiCallCount.save();
        }

        addAiLogJob({ username: user, prompt: finalPrompt, response });

        return res.status(200).json({ response });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}
