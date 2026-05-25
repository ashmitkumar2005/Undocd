# Undocd

An open-source search engine for publicly accessible API endpoints. Enter any URL, get back the endpoints — cached in this repo, scanned by AI on first lookup, shared with everyone.

## How it works

1. User enters a URL on the website
2. The frontend hits `/api/scan?url=<domain>` which reads from `endpoints/<domain>.json` in this repo
3. **Cached?** Results return instantly from `raw.githubusercontent.com`
4. **Not cached?** User clicks "request scan" → `/api/queue` appends the URL to `endpoints/_queue.json`
5. The scanner CLI (`scanner/scan.js`) drains the queue: launches Playwright, captures network requests, asks Groq's Llama 3.3 to extract endpoints, commits the result back to `endpoints/<domain>.json` via Octokit

The repo is the database. Every scan is a commit.

## Repo structure

```
/
├── app/                    # Next.js 16 frontend + API routes
│   ├── page.tsx
│   └── api/
│       ├── scan/route.ts   # GET /api/scan?url= → reads endpoints/<domain>.json
│       └── queue/route.ts  # POST /api/queue   → appends to _queue.json
├── components/             # shadcn/ui based UI components
├── lib/types.ts            # Shared types (Endpoint, DomainResult, ScanResponse)
├── endpoints/              # The "database" — one JSON file per domain
│   ├── github.com.json
│   ├── spotify.com.json
│   ├── pokeapi.co.json
│   ├── openweathermap.org.json
│   └── _queue.json         # Pending scan requests
└── scanner/                # Standalone Node CLI — runs locally
    ├── scan.js             # node scan.js <url> — full scan + commit
    ├── drain.js            # node drain.js — process every URL in _queue.json
    ├── package.json
    └── .env.example
```

## Running locally

### 1. Frontend

```bash
npm install
cp .env.example .env       # add your GitHub PAT for /api/queue to work
npm run dev                # → http://localhost:3000
```

The `/api/scan` route works without any keys (reads from public GitHub raw).
The `/api/queue` route requires `GITHUB_TOKEN` to write `_queue.json` back to the repo.

### 2. Scanner

The scanner runs on your machine on demand. It is intentionally not deployed yet.

```bash
cd scanner
npm install
npx playwright install chromium    # one-time
cp .env.example .env               # fill in GROQ_API_KEY + GITHUB_TOKEN
npm run scan -- https://pokeapi.co  # scan a single URL
npm run drain                       # process every URL in _queue.json
```

Required env vars:

| Var               | Where to get it                                                     |
|-------------------|---------------------------------------------------------------------|
| `GROQ_API_KEY`    | https://console.groq.com — free tier, no card required              |
| `GITHUB_TOKEN`    | Fine-scoped PAT with `contents:write` on `ashmitkumar2005/Undocd`   |

## Endpoint JSON shape

Each domain file looks like this:

```json
{
  "domain": "pokeapi.co",
  "cached": true,
  "lastScanned": "2026-05-26T00:00:00Z",
  "endpoints": [
    {
      "url": "https://pokeapi.co/api/v2/pokemon/{name}",
      "method": "GET",
      "description": "Detailed data for a specific Pokemon by name or id",
      "authRequired": false,
      "corsEnabled": true,
      "status": "working",
      "lastVerified": "2026-05-26T00:00:00Z"
    }
  ]
}
```

## Contributing

Pull requests welcome — for endpoint files (`endpoints/<domain>.json`), UI improvements, scanner tweaks, or a deployed scanner host.

## License

MIT — free to use, modify, and distribute.
