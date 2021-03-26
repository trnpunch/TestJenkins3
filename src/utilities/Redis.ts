import redis from 'redis';
import { promisify } from 'util';
require('dotenv').config();

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
});

export const get = promisify(client.get).bind(client);

export const set = async (key: string, value: any, time: number = 86400) => {
    return await client.setex(key, time, JSON.stringify(value));
};