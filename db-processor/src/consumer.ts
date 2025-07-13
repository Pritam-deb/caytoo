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
        while (true) {
            const data = await redis.lPop('lead_queue');
            if (!data) {
                console.log('No more leads to consume');
                break;
            }

            const lead = JSON.parse(data);

            // Fetch preview data
            try {
                const preview = await getLinkPreview(lead.url_link);

                if ('title' in preview && 'description' in preview && 'images' in preview) {
                    lead.title = preview.title || lead.title;
                    lead.content = preview.description || lead.content;
                    lead.image_url = preview.images?.[0] || null;
                }
            } catch (err) {
                console.error('Error fetching preview for lead:', lead.url_link, err);
                continue;
            }

            // Check if lead already exists
            const existingLead = await prisma.article.findUnique({
                where: {
                    url_link: lead.url_link,
                },
            });

            if (existingLead) {
                console.error(`Lead with URL ${lead.url_link} already exists.`);
                continue;
            }

            console.log('Consuming lead:', lead);

            try {
                await prisma.article.create({ data: lead });
                console.log('Lead saved:', lead.url_link);
            } catch (err) {
                console.error('Error saving lead:', err);
            }
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