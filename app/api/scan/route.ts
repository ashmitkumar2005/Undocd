import { NextResponse } from "next/server";
import {
  normalizeDomain,
  type DomainResult,
} from "@/lib/types";

const REPO_RAW =
  "https://raw.githubusercontent.com/ashmitkumar2005/Undocd/main/endpoints";

function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (domain === "localhost" || domain.startsWith("localhost:")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
    domain
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "missing url param" }, { status: 400 });
  }

  const domain = normalizeDomain(raw);
  if (!isValidDomain(domain)) {
    return NextResponse.json(
      { error: "invalid domain", domain },
      { status: 400 }
    );
  }

  const fileUrl = `${REPO_RAW}/${encodeURIComponent(domain)}.json`;

  try {
    const res = await fetch(fileUrl, { next: { revalidate: 300 } });
    if (res.status === 404) {
      return NextResponse.json(
        { domain, found: false },
        { status: 404 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream error", status: res.status, domain },
        { status: 502 }
      );
    }
    const data = (await res.json()) as DomainResult;
    return NextResponse.json({ domain, found: true, result: data });
  } catch (err) {
    return NextResponse.json(
      {
        error: "fetch failed",
        domain,
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 }
    );
  }
}
