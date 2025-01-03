import { createClient } from 'redis';

const client = createClient({
    url: `redis://localhost:6379`,
});

client.on('error', (err) => console.error('Redis Client Error:', err));

(async () => {
    await client.connect(); // Connect to Redis
    console.log('Redis client connected');
})();

export default client;
