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
              setShowFilterButton(true);
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
          className="relative px-8 py-4 rounded-full text-white font-medium transition-transform duration-300 ease-in-out transform hover:scale-110 active:scale-100 group"
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
          <span className="absolute inset-0 rounded-full bg-black z-0 shadow-inner shadow-black/60 group-hover:shadow-[0_0_0_6px_rgba(124,58,237,0.75)] transition-all duration-300 ease-in-out"></span>
          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out bg-[radial-gradient(at_51%_89%,hsla(266,45%,74%,1)_0px,transparent_50%),radial-gradient(at_100%_100%,hsla(266,36%,60%,1)_0px,transparent_50%),radial-gradient(at_22%_91%,hsla(266,36%,60%,1)_0px,transparent_50%)] z-10"></span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="relative z-20 w-7 h-7 text-white mr-2 animate-pulse group-hover:animate-[path_1.5s_linear_0.5s_infinite]"
          >
            <path
              className="fill-current stroke-current"
              d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
            />
            <path
              className="fill-current stroke-current"
              d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"
            />
            <path
              className="fill-current stroke-current"
              d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
            />
          </svg>
          <span className="relative z-20 text_button text-white text-base font-semibold">
            Filter the articles with AI
          </span>
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
