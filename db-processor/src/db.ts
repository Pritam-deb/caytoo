// src/db.ts
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

export const prisma = new PrismaClient();

export const redis = createClient({
    socket: {
        host: 'localhost',
        port: 6379,
    },
});
redis.connect().catch(console.error);