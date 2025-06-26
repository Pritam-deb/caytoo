// src/consumer.ts
import { redis, prisma } from './db';
import { getLinkPreview, getPreviewFromContent } from "link-preview-js";

export class LeadService {
    async getLeads() {
        try {
            const leads = await prisma.article.findMany({
                orderBy: {
                    created_at: 'desc',
                },
            });
            return leads;
        } catch (err) {
            console.error('Error fetching leads:', err);
            return [];
        }
    }

    async consumeLead() {
        const data = await redis.lPop('lead_queue');
        if (!data) {
            console.log('No leads to consume');
            return;
        };

        const lead = JSON.parse(data);
        // Fetch preview data
        const preview = await getLinkPreview(lead.url_link);

        if ('title' in preview && 'description' in preview && 'images' in preview) {
            lead.title = preview.title || lead.title;
            lead.content = preview.description || lead.content;
            lead.image_url = preview.images?.[0] || null;
        }

        console.log('Consuming lead:', lead);

        try {
            await prisma.article.create({ data: lead });
            console.log('Lead saved:', lead.url_link);
        } catch (err) {
            console.error('Error saving lead:', err);
        }
    }

    async deleteLead() {
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

        try {
            const result = await prisma.article.deleteMany({
                where: {
                    date: {
                        lt: fourDaysAgo.toISOString().split('T')[0],
                    },
                },
            });
            console.log(`Deleted ${result.count} old articles.`);
        } catch (err) {
            console.error('Error deleting old articles:', err);
        }
    }
}

export const leadService = new LeadService();