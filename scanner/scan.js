#!/usr/bin/env node
import "dotenv/config";
import { chromium } from "playwright";
import Groq from "groq-sdk";
import { Octokit } from "@octokit/rest";

const REQUIRED = ["GROQ_API_KEY", "GITHUB_TOKEN"];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`error: ${key} is not set. copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

const OWNER = process.env.GITHUB_OWNER ?? "ashmitkumar2005";
const REPO = process.env.GITHUB_REPO ?? "Undocd";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const MODEL = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";
const TIMEOUT_MS = Number(process.env.SCAN_TIMEOUT_MS ?? 20000);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function normalizeDomain(input) {
  let v = input.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, "");
  v = v.replace(/^www\./, "");
  v = v.split("/")[0];
  v = v.split("?")[0];
  return v;
}

function isApiLike(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const path = u.pathname.toLowerCase();
    if (
      path.endsWith(".js") ||
      path.endsWith(".css") ||
      path.endsWith(".png") ||
      path.endsWith(".jpg") ||
      path.endsWith(".jpeg") ||
      path.endsWith(".gif") ||
      path.endsWith(".svg") ||
      path.endsWith(".webp") ||
      path.endsWith(".ico") ||
      path.endsWith(".woff") ||
      path.endsWith(".woff2") ||
      path.endsWith(".ttf") ||
      path.endsWith(".html") ||
      path.endsWith(".map")
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

async function captureNetwork(targetUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  });
  const page = await context.newPage();

  const captured = [];
  page.on("request", (req) => {
    const url = req.url();
    if (!isApiLike(url)) return;
    const headers = req.headers();
    const resourceType = req.resourceType();
    if (resourceType === "image" || resourceType === "stylesheet" || resourceType === "font") return;
    captured.push({
      url,
      method: req.method(),
      resourceType,
      acceptHeader: headers["accept"] ?? null,
    });
  });

  try {
    await page.goto(targetUrl, {
      waitUntil: "networkidle",
      timeout: TIMEOUT_MS,
    });
  } catch (err) {
    console.warn(`warn: navigation timeout/error for ${targetUrl}: ${err.message}`);
  }

  await browser.close();

  const seen = new Set();
  const deduped = captured.filter((r) => {
    const key = `${r.method} ${r.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped;
}

const SYSTEM_PROMPT = `You analyze captured network traffic from a website and extract the public API endpoints a developer could realistically use.

Return ONLY valid JSON matching this schema:
{
  "endpoints": [
    {
      "url": "string (full URL with protocol, paths use {placeholder} for variable IDs)",
      "method": "GET | POST | PUT | DELETE | PATCH",
      "description": "one short sentence describing what this endpoint does",
      "authRequired": boolean,
      "corsEnabled": boolean
    }
  ]
}

Rules:
- Skip telemetry, analytics, advertising, error reporting, font/image CDNs.
- Skip pages, HTML routes, static assets.
- Skip login/auth submission endpoints unless they return tokens publicly.
- Only include endpoints that look like real JSON APIs a developer could call.
- Replace IDs / slugs in paths with {id}, {name}, {username}, etc.
- If you're not sure if it's an API, exclude it.
- Return at most 12 endpoints. Prefer quality over quantity.
- If nothing API-like is found, return {"endpoints": []}.`;

async function extractEndpointsWithLLM(domain, captured) {
  const sample = captured.slice(0, 80);
  const userMsg = `Domain: ${domain}\n\nCaptured network requests:\n${JSON.stringify(sample, null, 2)}`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn("warn: LLM returned non-JSON, falling back to empty list");
    return [];
  }
  if (!Array.isArray(parsed.endpoints)) return [];

  const now = new Date().toISOString();
  return parsed.endpoints
    .filter((e) => e && typeof e.url === "string" && typeof e.method === "string")
    .slice(0, 12)
    .map((e) => ({
      url: e.url,
      method: ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(e.method.toUpperCase())
        ? e.method.toUpperCase()
        : "GET",
      description: typeof e.description === "string" ? e.description : "",
      authRequired: Boolean(e.authRequired),
      corsEnabled: Boolean(e.corsEnabled),
      status: "unverified",
      lastVerified: now,
    }));
}

async function commitToRepo(domain, endpoints) {
  const path = `endpoints/${domain}.json`;
  const payload = {
    domain,
    cached: true,
    lastScanned: new Date().toISOString(),
    endpoints,
  };
  const content = Buffer.from(JSON.stringify(payload, null, 2) + "\n").toString("base64");

  let sha;
  try {
    const existing = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path, ref: BRANCH });
    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      sha = existing.data.sha;
    }
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    branch: BRANCH,
    message: `scan: ${domain} (${endpoints.length} endpoints)`,
    content,
    sha,
  });
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: node scan.js <url>");
    process.exit(1);
  }

  const domain = normalizeDomain(target);
  const visitUrl = target.startsWith("http") ? target : `https://${domain}`;

  console.log(`[1/4] capturing network traffic for ${visitUrl} ...`);
  const captured = await captureNetwork(visitUrl);
  console.log(`      captured ${captured.length} api-like requests`);

  if (captured.length === 0) {
    console.log("nothing captured. saving empty result.");
    await commitToRepo(domain, []);
    return;
  }

  console.log(`[2/4] asking ${MODEL} to extract endpoints ...`);
  const endpoints = await extractEndpointsWithLLM(domain, captured);
  console.log(`      LLM returned ${endpoints.length} endpoints`);

  console.log(`[3/4] committing endpoints/${domain}.json to ${OWNER}/${REPO} ...`);
  await commitToRepo(domain, endpoints);

  console.log(`[4/4] done. https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/endpoints/${domain}.json`);
}

main().catch((err) => {
  console.error("scan failed:", err);
  process.exit(1);
});
