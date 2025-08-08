import Lead from "@/types/lead";
import { Moon, Sun, ChevronDown, CheckCircle, Circle } from "lucide-react";

export function renderGroupedLeads(
  darkMode: boolean,
  grouped: Record<string, Record<string, Lead[]>>,
  openCategories: Record<string, boolean>,
  setOpenCategories: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >,
  handleToggleContacted: (lead: Lead) => void
) {
  // Sort dates in descending order (most recent first)
  const sortedEntries = Object.entries(grouped).sort(([dateA], [dateB]) => {
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return sortedEntries.map(([date, categories]) => (
    <section key={date}>
      <h2 className="text-xl font-bold mb-6 border-b border-gray-300 dark:border-gray-700 py-1">
        {date}
      </h2>
      {Object.entries(categories).map(([category, items]) => (
        <div
          key={category}
          className={`${
            darkMode
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
          } rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-transparent py-2`}
        >
          <h3
            className={`${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
            } py-2 px-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-transparent hover:border-purple-400`}
            onClick={() =>
              setOpenCategories((prev) => ({
                ...prev,
                [date + category]: !prev[date + category],
              }))
            }
          >
            {category}
            <span className="float-right text-gray-500 dark:text-gray-400 px-2 py-2">
              {openCategories[date + category] ? "-" : "+"}
            </span>
          </h3>
          <div
            className={`px-1 grid gap-4 transition-all duration-500 ease-in-out overflow-hidden ${
              openCategories[date + category] ? "max-h-[2000px]" : "max-h-0"
            }`}
          >
            {items.map((lead) => (
              <div
                key={lead.id}
                className={`${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100"
                } rounded-xl p-4 shadow-md transition-colors`}
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
                    {lead.category}
                  </span>
                  <h3 className="font-bold mb-1">{lead.title}</h3>
                  <p className="text-sm opacity-80 mb-2">{lead.content}</p>
                  <div className="flex items-center justify-between">
                    <a
                      href={lead.url_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-medium rounded-md shadow transition-colors duration-200 w-30 inline-flex items-center"
                    >
                      Read Article
                    </a>
                    <button
                      onClick={() => handleToggleContacted(lead)}
                      className={`flex items-center gap-2 px-2 py-2 rounded-full ${
                        lead.pitched
                          ? "bg-green-100 hover:bg-green-200 w-10"
                          : "bg-gray-100 hover:bg-gray-200 w-35"
                      } transition-colors`}
                    >
                      {!lead.pitched && (
                        <span className="text-sm text-gray-600">Contacted</span>
                      )}
                      {lead.pitched ? (
                        <CheckCircle className="text-green-500" />
                      ) : (
                        <Circle className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  ));
}
