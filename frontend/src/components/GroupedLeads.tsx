import Lead from "@/types/lead";

export function renderGroupedLeads(
  grouped: Record<string, Record<string, Lead[]>>,
  openCategories: Record<string, boolean>,
  setOpenCategories: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >,
  handleToggleContacted: (lead: Lead) => void
) {
  return Object.entries(grouped).map(([date, categories]) => (
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
            <span className="ml-2 text-2xl font-bold">
              {openCategories[date + category] ? "−" : "+"}
            </span>
          </h3>
          <div
            className={`grid gap-4 transition-all duration-500 ease-in-out overflow-hidden ${
              openCategories[date + category] ? "max-h-[2000px]" : "max-h-0"
            }`}
          >
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
                    {lead.category}
                  </span>
                  <h2 className="text-xl font-semibold">{lead.title}</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {lead.content}
                  </p>
                  <a
                    href={lead.url_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline text-sm mt-2"
                  >
                    Read the article
                  </a>
                  <label className="mt-2 inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={lead.pitched}
                      onChange={() => handleToggleContacted(lead)}
                    />
                    Contacted
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ));
}
