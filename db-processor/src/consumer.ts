// src/consumer.ts
import { redis, prisma } from './db';

export async function consumeLeads() {
    const data = await redis.lPop('lead_queue');
    if (!data) return;

    const lead = JSON.parse(data);
    console.log('Consuming lead:', lead);

    try {
        await prisma.article.create({ data: lead });
        console.log('Lead saved:', lead.url_link);
    } catch (err) {
        console.error('Error saving lead:', err);
    }
}