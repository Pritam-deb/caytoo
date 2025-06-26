"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Lead = {
  id: string;
  subject?: string;
  title: string;
  content: string;
  url_link: string;
  image?: string;
  date: string;
};

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    fetch("http://localhost:3001/get-leads")
      .then((res) => res.json())
      .then((data) => setLeads(data))
      .catch((err) => console.error("Error fetching leads:", err));
  }, []);

  return (
    <div className="min-h-screen p-8 font-sans bg-white text-black dark:bg-black dark:text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">Latest Leads</h1>
      <div className="grid gap-12">
        {Object.entries(
          leads.reduce((acc, lead) => {
            if (!acc[lead.date]) acc[lead.date] = {};
            const cat = lead.category || "Uncategorized";
            if (!acc[lead.date][cat]) acc[lead.date][cat] = [];
            acc[lead.date][cat].push(lead);
            return acc;
          }, {} as Record<string, Record<string, Lead[]>>)
        ).map(([date, categories]) => (
          <div key={date}>
            <h2 className="text-2xl font-bold mb-4">{date}</h2>
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3
                  className="text-xl font-semibold mb-2 cursor-pointer flex items-center justify-between hover:text-blue-600 transition-colors"
                  onClick={() =>
                    setOpenCategories((prev) => ({
                      ...prev,
                      [date + category]: !prev[date + category],
                    }))
                  }
                >
                  {category}
                  <svg
                    className={`w-5 h-5 ml-2 transition-transform duration-200 ${
                      openCategories[date + category] ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </h3>
                {openCategories[date + category] && (
                  <div className="grid gap-4">
                    {items.map((lead) => (
                      <div
                        key={lead.id}
                        className="border rounded-lg p-4 shadow-md flex flex-col sm:flex-row gap-4 bg-white dark:bg-zinc-900"
                      >
                        {lead.image && (
                          <img
                            src={lead.image}
                            alt={lead.title}
                            className="w-full sm:w-48 h-32 object-cover rounded"
                          />
                        )}
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {lead.subject}
                          </span>
                          <h2 className="text-xl font-semibold">
                            {lead.title}
                          </h2>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {lead.content}
                          </p>
                          <a
                            href={lead.url_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline text-sm mt-2"
                          >
                            Visit Link
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
