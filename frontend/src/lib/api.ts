import Lead from "@/types/lead";
import { useState } from "react";


export const handleToggleContacted = async (
    lead: Lead,
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
) => {
    try {
        const res = await fetch(`http://localhost:3001/update-pitched?id=${lead.id}`, {
            method: "PATCH",
        });

        if (res.ok) {
            const updated = await res.json();
            setLeads((prev) =>
                prev.map((l) => (l.id === updated.id ? updated : l))
            );
        }
    } catch (err) {
        console.error("Failed to update contacted status", err);
    }
};