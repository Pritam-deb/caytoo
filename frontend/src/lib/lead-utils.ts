import Lead from "@/types/lead";


export function groupLeadsByDateAndCategory(leads: Lead[]) {
    return leads.reduce((acc, lead) => {
        if (!acc[lead.date]) acc[lead.date] = {};
        const cat = lead.category || "Uncategorized";
        if (!acc[lead.date][cat]) acc[lead.date][cat] = [];
        acc[lead.date][cat].push(lead);
        return acc;
    }, {} as Record<string, Record<string, Lead[]>>);
}

