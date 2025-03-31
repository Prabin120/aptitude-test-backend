import { createClient } from 'redis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';

const client = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Max Redis reconnection attempts reached');
                return new Error('Max Redis reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis Client Connected'));
client.on('reconnecting', () => console.log('Redis Client Reconnecting...'));
client.on('end', () => console.log('Redis Client Connection Ended'));

export const connectRedis = async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
            console.log('Redis client connected');
        }
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        throw error;
    }
};

export default client;
