export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type EndpointStatus = "working" | "broken" | "unverified";

export type Endpoint = {
  url: string;
  method: HttpMethod;
  description: string;
  authRequired: boolean;
  corsEnabled: boolean;
  status: EndpointStatus;
  lastVerified: string;
};

export type DomainResult = {
  domain: string;
  cached: boolean;
  lastScanned: string;
  endpoints: Endpoint[];
};

export type ScanResponse =
  | { domain: string; found: true; result: DomainResult }
  | { domain: string; found: false };

export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0];
  value = value.split("?")[0];
  return value;
}

export const SUGGESTED_DOMAINS = [
  "github.com",
  "spotify.com",
  "pokeapi.co",
  "openweathermap.org",
] as const;
