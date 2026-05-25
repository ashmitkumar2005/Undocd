import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { normalizeDomain } from "@/lib/types";

const OWNER = process.env.GITHUB_OWNER ?? "ashmitkumar2005";
const REPO = process.env.GITHUB_REPO ?? "Undocd";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const QUEUE_PATH = "endpoints/_queue.json";

function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (domain === "localhost" || domain.startsWith("localhost:")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
    domain
  );
}

type QueueItem = { url: string; domain: string; queuedAt: string };

export async function POST(request: Request) {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "queue not configured (server missing GITHUB_TOKEN)" },
      { status: 503 }
    );
  }

  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const raw = body.url;
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  const domain = normalizeDomain(raw);
  if (!isValidDomain(domain)) {
    return NextResponse.json(
      { error: "invalid domain", domain },
      { status: 400 }
    );
  }

  const visitUrl = raw.startsWith("http") ? raw : `https://${domain}`;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  let queue: QueueItem[] = [];
  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: QUEUE_PATH,
      ref: BRANCH,
    });
    if (!Array.isArray(existing.data) && "content" in existing.data) {
      const text = Buffer.from(existing.data.content, "base64").toString(
        "utf-8"
      );
      const parsed = JSON.parse(text);
      queue = Array.isArray(parsed) ? parsed : [];
      sha = existing.data.sha;
    }
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status !== 404) {
      return NextResponse.json(
        { error: "failed to read queue" },
        { status: 502 }
      );
    }
  }

  if (queue.some((item) => item.domain === domain)) {
    return NextResponse.json({
      domain,
      queued: true,
      alreadyQueued: true,
      position: queue.findIndex((i) => i.domain === domain) + 1,
    });
  }

  const newItem: QueueItem = {
    url: visitUrl,
    domain,
    queuedAt: new Date().toISOString(),
  };
  const updated = [...queue, newItem];
  const content = Buffer.from(
    JSON.stringify(updated, null, 2) + "\n"
  ).toString("base64");

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: QUEUE_PATH,
      branch: BRANCH,
      message: `queue: + ${domain}`,
      content,
      sha,
    });
  } catch {
    return NextResponse.json(
      { error: "failed to write queue" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    domain,
    queued: true,
    alreadyQueued: false,
    position: updated.length,
  });
}
