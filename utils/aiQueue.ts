
import Queue from "bull";
import AiCall from "../models/aiCall";

// Create a queue for AI logs
const aiLogQueue = new Queue('ai-logs', {
    redis: {
        port: 6379,
        host: 'localhost',
        // password: process.env.REDIS_PASSWORD // Uncomment if needed
    }
});

// Process the queue
aiLogQueue.process(async (job) => {
    const { username, prompt, response, apiKey } = job.data;
    try {
        await AiCall.create({ username, prompt, response, apiKey });
    } catch (error) {
        console.error("Failed to log AI call:", error);
    }
});

// Helper to add jobs
export const addAiLogJob = (data: { username: string, prompt: string, response: string, apiKey: string }) => {
    aiLogQueue.add(data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true
    }).catch(err => {
        console.error("Error adding AI log job:", err);
    });
}
