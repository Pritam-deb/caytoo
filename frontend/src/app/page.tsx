"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Lead from "@/types/lead";
import { groupLeadsByDateAndCategory } from "@/lib/lead-utils";
import { renderGroupedLeads } from "@/components/GroupedLeads";
import { handleToggleContacted as handleToggleContactedApi } from "@/lib/api";
export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);

  // Wrap the imported handler to match the expected signature
  const handleToggleContacted = (lead: Lead) => {
    handleToggleContactedApi(lead, setLeads);
  };
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [showFilterButton, setShowFilterButton] = useState(false);
  const [activeTab, setActiveTab] = useState<"uncontacted" | "contacted">(
    "uncontacted"
  );

  useEffect(() => {
    fetch("http://localhost:3001/get-leads")
      .then((res) => res.json())
      .then((data) => {
        setLeads(data);
      })
      .catch((err) => console.error("Error fetching leads:", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/check-processing");
        const data = await res.json();
        if (!data.processing) {
          setShowFilterButton(true);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error checking processing status:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const contactedLeads = leads.filter((lead) => lead.pitched);
  const uncontactedLeads = leads.filter((lead) => !lead.pitched);

  return (
    <div className="min-h-screen p-8 font-sans bg-white text-black dark:bg-black dark:text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">Latest Leads</h1>
      <button
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center gap-2"
        onClick={async () => {
          setLoading(true);
          try {
            const res = await fetch("http://localhost:8000/emails/links");
            const data = await res.json();
            if (res.ok && data.total_links !== undefined) {
              alert(`Found ${data.total_links} links.`);
            } else {
              alert("Something went wrong while fetching links.");
            }
          } catch (error) {
            console.error("Error fetching article links:", error);
            alert("Failed to fetch article links.");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
        ) : (
          "Find Articles"
        )}
      </button>
      {showFilterButton && (
        <button
          className="
          mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          onClick={async () => {
            try {
              const res = await fetch("http://localhost:3001/consume");
              const data = await res.text();
              alert(data);
            } catch (err) {
              console.error("Error calling consume endpoint:", err);
              alert("Something went wrong while filtering articles.");
            }
          }}
        >
          Filter articles
        </button>
      )}
      <div className="flex gap-4 mb-8 justify-center">
        <button
          onClick={() => setActiveTab("uncontacted")}
          className={`px-4 py-2 rounded ${
            activeTab === "uncontacted"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          Uncontacted
        </button>
        <button
          onClick={() => setActiveTab("contacted")}
          className={`px-4 py-2 rounded ${
            activeTab === "contacted"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          Contacted
        </button>
      </div>
      <div className="grid gap-12">
        {activeTab === "uncontacted" ? (
          <div>
            {/* <h2 className="text-2xl font-bold mb-4">Uncontacted</h2> */}
            {renderGroupedLeads(
              groupLeadsByDateAndCategory(uncontactedLeads),
              openCategories,
              setOpenCategories,
              handleToggleContacted
            )}
          </div>
        ) : (
          <div>
            {/* <h2 className="text-2xl font-bold mb-4">Contacted</h2> */}
            {renderGroupedLeads(
              groupLeadsByDateAndCategory(contactedLeads),
              openCategories,
              setOpenCategories,
              handleToggleContacted
            )}
          </div>
        )}
      </div>
    </div>
  );
}
