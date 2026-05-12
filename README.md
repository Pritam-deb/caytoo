# GenLead

An automated sponsorship lead generation system that monitors Google Alerts via Gmail, uses AI to identify high-value sponsorship opportunities, and surfaces them in a clean dashboard for outreach tracking.

---

## What It Does

GenLead runs on a daily cadence:

1. **Reads your Gmail inbox** for Google Alert emails from `googlealerts-noreply@google.com`
2. **Extracts article links** from those alerts and pushes them into a Redis queue
3. **Analyses each article** using Gemini 2.5 Flash — scoring it against predefined sponsorship buying signals
4. **Saves qualified leads** (articles marked `Lead: Yes`) into PostgreSQL with metadata
5. **Displays leads** in a dashboard grouped by date and category, with contacted/uncontacted tracking

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Network                          │
│                                                                 │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │  news-worker │     │              Redis                   │  │
│  │  (Python /   │────▶│  google_alert_links  (queue)         │  │
│  │   FastAPI)   │     │  lead_queue          (queue)         │  │
│  └──────────────┘     │  article_processing  (flag)          │  │
│         │             │  last_gmail_alert_check (flag)       │  │
│         │             └──────────────┬───────────────────────┘  │
│         │                            │                          │
│         ▼                            ▼                          │
│    Gmail API              ┌──────────────────┐                  │
│    (Google Alerts)        │     engine        │                  │
│                           │    (Go / genai)   │                  │
│                           │                  │                  │
│                           │  3 fetcher        │                  │
│                           │  goroutines       │                  │
│                           │  4 processor      │                  │
│                           │  goroutines       │                  │
│                           │  1 monitor        │                  │
│                           │  goroutine        │                  │
│                           └────────┬─────────┘                  │
│                                    │  Gemini 2.5 Flash API      │
│                                    │  (external)                │
│                                    ▼                            │
│                           ┌──────────────────┐                  │
│                           │  db-processor    │                  │
│                           │  (Node / Express)│                  │
│                           └────────┬─────────┘                  │
│                                    │                            │
│                                    ▼                            │
│                           ┌──────────────────┐                  │
│                           │   PostgreSQL      │                  │
│                           │   (Article table) │                  │
│                           └──────────────────┘                  │
│                                    ▲                            │
│  ┌──────────────┐                  │                            │
│  │   frontend   │──────────────────┘                            │
│  │  (Next.js)   │  REST API calls to db-processor               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Services

### `news-worker` — Python / FastAPI
- Runs on startup and checks Redis for a `last_gmail_alert_check` flag
- If not run today, authenticates with Gmail via OAuth2 and reads Google Alert emails from the last 24 hours
- Extracts article URLs from email HTML bodies using regex
- Pushes structured payloads `{ category, date, url }` to the `google_alert_links` Redis queue
- Sets `article_processing = true` in Redis to signal the engine is about to receive work
- Port: `8000`

### `engine` — Go
- Connects to Redis on startup and listens on the `google_alert_links` queue using `BLPOP`
- Runs **3 fetcher goroutines** to pull messages off the queue concurrently
- Runs **4 processor goroutines** to analyse articles in parallel
- For each article, calls **Gemini 2.5 Flash** with a detailed sponsorship analysis prompt
- If the response contains `Lead: Yes`, marshals the lead and pushes it to the `lead_queue` Redis queue
- Runs a **monitor goroutine** every 5 seconds — when the queue, channel, and active job count are all zero, sets `article_processing = false` in Redis
- All analysis results are also appended to `lead_analysis_results.json` for debugging

### `db-processor` — Node.js / TypeScript / Express
- Reads leads from the `lead_queue` Redis queue on demand via the `/consume` endpoint
- Enriches each lead with title, description, and image using `link-preview-js`
- Deduplicates by `url_link` before inserting into PostgreSQL via Prisma
- Exposes a REST API consumed by the frontend
- Port: `3001`

| Endpoint | Method | Description |
|---|---|---|
| `/get-leads` | GET | All leads ordered by date desc |
| `/consume` | GET | Drain `lead_queue` from Redis into the DB |
| `/update-pitched` | PATCH | Toggle contacted status for a lead (`?id=...`) |
| `/check-processing` | GET | Returns `{ processing: bool }` from Redis flag |
| `/delete` | DELETE | Delete leads older than 4 days |

### `frontend` — Next.js 15 / React 19 / Tailwind CSS
- Fetches all leads from `db-processor` on load
- Polls `/check-processing` every 10 seconds — shows a **"Show Filtered Articles"** button when the engine finishes
- Clicking the button calls `/consume` to drain the Redis queue into the DB and reloads
- Leads are grouped by **date** then **category**, collapsible per category
- Toggle between **Uncontacted** and **Contacted** tabs
- Dark mode toggle
- Port: `3000`

---

## Data Flow

```
Gmail Inbox
    │
    │  Google Alert emails (daily)
    ▼
news-worker
    │
    │  { category, date, url } → redis: google_alert_links
    │  redis: article_processing = true
    ▼
engine (Go)
    │
    │  BLPop from google_alert_links
    │  → Gemini 2.5 Flash analysis
    │  → if Lead: Yes → redis: lead_queue
    │  → monitor sets article_processing = false when done
    ▼
db-processor (on /consume)
    │
    │  lPop from lead_queue
    │  → link-preview-js metadata enrichment
    │  → deduplicate by url_link
    │  → prisma.article.create
    ▼
PostgreSQL (Article table)
    │
    ▼
frontend (Next.js)
    │  GET /get-leads
    │  PATCH /update-pitched
    ▼
User Dashboard
```

---

## Lead Qualification

The engine analyses each article against these **buying signal categories**:

| Signal | Examples |
|---|---|
| Market Expansion | New regions, offices, local ops |
| Marketing & Brand Investment | Campaigns, rebrands, new agencies |
| New Marketing Leadership | CMO, Brand Manager, VP Marketing hires |
| Funding / M&A | Seed → Series E, IPO, acquisitions |
| Partnerships & Sponsorships | Ambassadors, co-brands, event sponsorships |
| Youth / Culture Engagement | Gen Z campaigns, gaming tie-ins, fan platforms |

**Target industries:** Forex/Trading, Betting & Gambling, Airlines, Automobiles, EVs, Banks, Crypto, Telecom, Manufacturing, PVC Pipes, Paints & Lubricants, Solar, Beverages, Luxury Goods, Travel & Tourism, Education, Insurance.

---

## Prerequisites

- Docker & Docker Compose
- Google Cloud project with Gmail API enabled
- `credentials.json` (OAuth2 Desktop app) in `news-worker/`
- `token.json` (generated via OAuth flow) in `news-worker/`
- `GEMINI_API_KEY` set in `engine/.env`

---

## Setup

### 1. Gmail OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID — type: **Desktop app**
3. Download and save as `news-worker/credentials.json`
4. Generate `token.json` by running locally (outside Docker):

```bash
cd news-worker
python3 gen_token.py
```

This opens a browser for Google sign-in and saves `token.json` in the same directory.

### 2. Gemini API key

Create `engine/.env`:

```env
GEMINI_API_KEY=your_key_here
```

Get a key from [Google AI Studio](https://aistudio.google.com/).

### 3. Run

```bash
docker compose up --build -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| DB Processor API | http://localhost:3001 |
| News Worker | http://localhost:8000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Database Schema

```prisma
model Article {
  id         String   @id @default(uuid())
  category   String?
  title      String
  content    String
  url_link   String   @unique
  image_url  String?
  created_at String
  updated_at String
  date       String
  pitched    Boolean  @default(false)
}
```

---

## Project Structure

```
caytoo/
├── docker-compose.yml
├── frontend/               # Next.js dashboard
│   └── src/
│       ├── app/            # Pages
│       ├── components/     # GroupedLeads, LeadCard
│       ├── lib/            # API calls, lead utilities
│       └── types/          # Lead type
├── engine/                 # Go AI processor
│   ├── cmd/engine/main.go  # Entry point, Redis queue workers
│   └── internal/processor/ # Gemini analysis logic
├── db-processor/           # Node.js REST API + DB layer
│   ├── src/
│   │   ├── index.ts        # Express routes
│   │   ├── consumer.ts     # Lead service (Redis → Postgres)
│   │   └── db.ts           # Prisma + Redis clients
│   └── prisma/schema.prisma
└── news-worker/            # Python Gmail reader
    ├── app/
    │   ├── main.py         # FastAPI app + lifespan
    │   ├── services/       # Gmail OAuth client
    │   └── tasks/          # Email reader task
    ├── credentials.json    # OAuth2 client secret (not committed)
    └── token.json          # OAuth2 token (not committed)
```
