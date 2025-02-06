import { Response, NextFunction } from 'express';
import ICustomRequest from '../utils/customRequest';
import client from '../utils/redis'; // Redis client instance
import { getCachingKey } from '../consts';

// Middleware to check the cache before fetching data
export async function checkCache(req: ICustomRequest, res: Response, next: NextFunction) {
  try {
    const key = req.originalUrl;
    // Fetch data from Redis
    const data = await client.get(key);
    if (data) {
      return res.json(JSON.parse(data));
    }
    // Data not found in cache, proceed to next middleware
    next();
  } catch (err) {
    // Log error and propagate to error handler
    console.error('Error accessing Redis cache:', err);
    next(err);
  }
}

export async function clearCache(keyString: string) {
  try {
    const key = getCachingKey[keyString];
    const listKeys = key.split(',').map((k) => k.trim());
    for (const k of listKeys) {
      await client.del(k);
    }
  } catch (err) {
    console.error('Error accessing Redis cache:', err);
  }
}