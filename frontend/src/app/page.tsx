"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
} from "lucide-react";
import Lead from "@/types/lead";
import { groupLeadsByDateAndCategory } from "@/lib/lead-utils";
import { renderGroupedLeads } from "@/components/GroupedLeads";
import { handleToggleContacted as handleToggleContactedApi } from "@/lib/api";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [hasStartedProcessing, setHasStartedProcessing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

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

  // Scrollbar visibility logic
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      document.documentElement.classList.add("scrolling");

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.documentElement.classList.remove("scrolling");
      }, 1000); // Hide scrollbar 1 second after scrolling stops
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
      document.documentElement.classList.remove("scrolling");
    };
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/get-leads")
      .then((res) => res.json())
      .then((data) => {
        setLeads(data);
      })
      .catch((err) => console.error("Error fetching leads:", err));
  }, []);

  useEffect(() => {
    if (!hasStartedProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/check-processing");
        const data = await res.json();
        if (!data.processing) {
          setShowFilterButton(true);
          setAiProcessing(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error checking processing status:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [hasStartedProcessing]);

  const contactedLeads = leads.filter((lead) => lead.pitched);
  const uncontactedLeads = leads.filter((lead) => !lead.pitched);

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-900"
      } min-h-screen font-mono transition-all duration-500`}
    >
      <header
        className={`sticky top-0 z-50 ${
          darkMode
            ? "bg-black/90 backdrop-blur-lg border-b border-white-500/40"
            : "bg-white"
        } shadow-xl transition-all`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 via-yellow-400 to-purple-600 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            GenLead
          </h1>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2 rounded-full shadow-lg hover:scale-110 hover:shadow-purple-500/50 transition-transform"
              onClick={async () => {
                setFilterLoading(true);
                try {
                  const res = await fetch("http://localhost:3001/consume");
                  const data = await res.text();
                  alert(data);
                  location.reload();
                } catch (err) {
                  console.error("Error calling consume endpoint:", err);
                  alert("Something went wrong while filtering articles.");
                } finally {
                  setFilterLoading(false);
                }
              }}
              disabled={filterLoading}
            >
              {filterLoading ? (
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
                <>
                  <Sparkles size={18} /> Show Filtered Articles
                </>
              )}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full bg-gradient-to-r from-red-500 to-yellow-400 text-black font-bold shadow-lg hover:scale-125 transition-transform"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* <button
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center gap-2"
        onClick={async () => {
          setLoading(true);
          try {
            const res = await fetch("http://localhost:8000/emails/links");
            const data = await res.json();
            if (res.ok && data.total_links !== undefined) {
              alert(`Found ${data.total_links} links.`);
              setAiProcessing(true);
              setHasStartedProcessing(true);
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
      </button> */}
      {/* {aiProcessing && !showFilterButton && (
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-6">
          <svg
            className="animate-spin h-5 w-5 text-green-600"
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
          <span>AI is doing its magic...</span>
        </div>
      )}
      {showFilterButton && (
        <button
          className="
    mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center gap-2"
          onClick={async () => {
            setFilterLoading(true);
            try {
              const res = await fetch("http://localhost:3001/consume");
              const data = await res.text();
              alert(data);
              location.reload();
            } catch (err) {
              console.error("Error calling consume endpoint:", err);
              alert("Something went wrong while filtering articles.");
            } finally {
              setFilterLoading(false);
            }
          }}
          disabled={filterLoading}
        >
          {filterLoading ? (
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
            "Get New Articles"
          )}
        </button>
      )} */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-4">
        <button
          onClick={() => setActiveTab("uncontacted")}
          className={`${
            activeTab === "uncontacted"
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              : "bg-gray-400 dark:bg-gray-700"
          } px-4 py-2 rounded-full font-medium shadow hover:scale-105 transition-transform`}
        >
          Uncontacted
        </button>
        <button
          onClick={() => setActiveTab("contacted")}
          className={`${
            activeTab === "contacted"
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              : "bg-gray-400 dark:bg-gray-700"
          } px-4 py-2 rounded-full font-medium shadow hover:scale-105 transition-transform`}
        >
          Contacted
        </button>
      </div>

      <div className="grid gap-12 px-6">
        {activeTab === "uncontacted" ? (
          <div>
            {/* <h2 className="text-2xl font-bold mb-4">Uncontacted</h2> */}
            {renderGroupedLeads(
              darkMode,
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
              darkMode,
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
