// src/consumer.ts
import { redis, prisma } from './db';
import { getLinkPreview, getPreviewFromContent } from "link-preview-js";

export class LeadService {
    async getLeads() {
        try {
            const leads = await prisma.article.findMany({
                // where: {
                //     pitched: false,
                // },
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

    async getContactedLeads() {
        try {
            const contactedLeads = await prisma.article.findMany({
                where: {
                    pitched: true,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
            return contactedLeads;
        } catch (err) {
            console.error('Error fetching contacted leads:', err);
            return [];
        }
    }

    async consumeLead() {
        let totalLeads = 0;
        try {
            while (true) {
                const data = await redis.lPop('lead_queue');
                if (!data) {
                    console.log('No more leads to consume');
                    break;
                }

                const lead = JSON.parse(data);

                try {
                    // Fetch preview data
                    const preview = await getLinkPreview(lead.url_link);
                    if ('title' in preview && 'description' in preview && 'images' in preview) {
                        lead.title = preview.title || lead.title;
                        lead.content = preview.description || lead.content;
                        lead.image_url = preview.images?.[0] || null;
                    }
                } catch (err) {
                    console.warn(`Could not fetch preview for URL ${lead.url_link}. Proceeding without preview data.`);
                }

                try {
                    const existingLead = await prisma.article.findUnique({
                        where: {
                            url_link: lead.url_link,
                        },
                    });

                    if (existingLead) {
                        console.info(`Lead with URL ${lead.url_link} already exists. Skipping.`);
                        continue;
                    }

                    await prisma.article.create({ data: lead });
                    console.log('Lead saved:', lead.url_link);
                    totalLeads++;
                } catch (err) {
                    console.error(`Error processing lead with URL ${lead.url_link}:`, err);
                }
            }
        } catch (err) {
            console.error('Unexpected error in consumeLead loop:', err);
        }
        return { totalLeads };
    }

    async updatePitched(id: string) {
        try {
            const currentLead = await prisma.article.findUnique({
                where: { id },
                select: { pitched: true },
            });

            if (!currentLead) {
                console.warn(`Lead with ID ${id} not found.`);
                return null;
            }

            const updatedLead = await prisma.article.update({
                where: { id },
                data: { pitched: !currentLead.pitched },
            });

            return updatedLead;
        } catch (err) {
            console.error(`Error toggling 'pitched' status for lead with ID ${id}:`, err);
            return null;
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