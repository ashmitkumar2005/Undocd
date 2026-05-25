#!/usr/bin/env node
import "dotenv/config";
import { Octokit } from "@octokit/rest";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OWNER = process.env.GITHUB_OWNER ?? "ashmitkumar2005";
const REPO = process.env.GITHUB_REPO ?? "Undocd";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const QUEUE_PATH = "endpoints/_queue.json";

if (!process.env.GITHUB_TOKEN) {
  console.error("error: GITHUB_TOKEN not set");
  process.exit(1);
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function readQueue() {
  try {
    const res = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: QUEUE_PATH,
      ref: BRANCH,
    });
    if (Array.isArray(res.data) || !("content" in res.data)) {
      throw new Error("queue path is not a file");
    }
    const text = Buffer.from(res.data.content, "base64").toString("utf-8");
    const queue = JSON.parse(text);
    return { queue: Array.isArray(queue) ? queue : [], sha: res.data.sha };
  } catch (err) {
    if (err.status === 404) return { queue: [], sha: undefined };
    throw err;
  }
}

async function writeQueue(queue, sha) {
  const content = Buffer.from(JSON.stringify(queue, null, 2) + "\n").toString("base64");
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: QUEUE_PATH,
    branch: BRANCH,
    message: `queue: drain (${queue.length} pending)`,
    content,
    sha,
  });
}

function runScan(url) {
  return new Promise((resolve) => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const child = spawn("node", [path.join(here, "scan.js"), url], {
      stdio: "inherit",
    });
    child.on("exit", (code) => resolve(code === 0));
  });
}

async function main() {
  const { queue, sha } = await readQueue();
  if (queue.length === 0) {
    console.log("queue is empty.");
    return;
  }
  console.log(`draining ${queue.length} url(s)...`);

  const remaining = [];
  for (const item of queue) {
    const url = typeof item === "string" ? item : item.url;
    if (!url) continue;
    console.log(`\n=== ${url} ===`);
    const ok = await runScan(url);
    if (!ok) {
      console.log(`scan failed, keeping in queue: ${url}`);
      remaining.push(item);
    }
  }

  const updatedQueue = await readQueue();
  const newlyAdded = updatedQueue.queue.filter((newItem) => {
    const newUrl = typeof newItem === "string" ? newItem : newItem.url;
    return !queue.some((oldItem) => {
      const oldUrl = typeof oldItem === "string" ? oldItem : oldItem.url;
      return oldUrl === newUrl;
    });
  });

  await writeQueue([...remaining, ...newlyAdded], updatedQueue.sha);
  console.log(`\ndone. ${remaining.length} retained, ${newlyAdded.length} new entries kept.`);
}

main().catch((err) => {
  console.error("drain failed:", err);
  process.exit(1);
});
