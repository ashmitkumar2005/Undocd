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

const now = new Date();
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 3600_000).toISOString();

const DB: Record<string, DomainResult> = {
  "github.com": {
    domain: "github.com",
    cached: true,
    lastScanned: hoursAgo(2),
    endpoints: [
      {
        url: "https://api.github.com/users/{username}",
        method: "GET",
        description: "Get a user's public profile",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(2),
      },
      {
        url: "https://api.github.com/users/{username}/repos",
        method: "GET",
        description: "List public repositories for a user",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(2),
      },
      {
        url: "https://api.github.com/repos/{owner}/{repo}",
        method: "GET",
        description: "Get a single repository's metadata",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(3),
      },
      {
        url: "https://api.github.com/search/repositories",
        method: "GET",
        description: "Search public repositories by keyword",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(4),
      },
      {
        url: "https://api.github.com/gists/public",
        method: "GET",
        description: "List recent public gists",
        authRequired: false,
        corsEnabled: true,
        status: "unverified",
        lastVerified: hoursAgo(72),
      },
    ],
  },
  "spotify.com": {
    domain: "spotify.com",
    cached: true,
    lastScanned: hoursAgo(11),
    endpoints: [
      {
        url: "https://open.spotify.com/get_access_token",
        method: "GET",
        description: "Anonymous access token used by the web player",
        authRequired: false,
        corsEnabled: false,
        status: "working",
        lastVerified: hoursAgo(11),
      },
      {
        url: "https://api.spotify.com/v1/search",
        method: "GET",
        description: "Search tracks, artists, albums by keyword",
        authRequired: true,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(11),
      },
      {
        url: "https://api.spotify.com/v1/tracks/{id}",
        method: "GET",
        description: "Fetch a single track's metadata",
        authRequired: true,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(12),
      },
      {
        url: "https://api.spotify.com/v1/browse/new-releases",
        method: "GET",
        description: "Newly released albums and singles",
        authRequired: true,
        corsEnabled: true,
        status: "broken",
        lastVerified: hoursAgo(36),
      },
    ],
  },
  "pokeapi.co": {
    domain: "pokeapi.co",
    cached: true,
    lastScanned: hoursAgo(1),
    endpoints: [
      {
        url: "https://pokeapi.co/api/v2/pokemon",
        method: "GET",
        description: "Paginated list of all Pokémon",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(1),
      },
      {
        url: "https://pokeapi.co/api/v2/pokemon/{name}",
        method: "GET",
        description: "Detailed data for a specific Pokémon",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(1),
      },
      {
        url: "https://pokeapi.co/api/v2/type/{name}",
        method: "GET",
        description: "Damage relations and Pokémon for a type",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(1),
      },
      {
        url: "https://pokeapi.co/api/v2/ability/{name}",
        method: "GET",
        description: "Ability description and Pokémon that have it",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(2),
      },
      {
        url: "https://pokeapi.co/api/v2/move/{name}",
        method: "GET",
        description: "Move details (power, accuracy, effect)",
        authRequired: false,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(2),
      },
    ],
  },
  "openweathermap.org": {
    domain: "openweathermap.org",
    cached: true,
    lastScanned: hoursAgo(8),
    endpoints: [
      {
        url: "https://api.openweathermap.org/data/2.5/weather",
        method: "GET",
        description: "Current weather by city, coordinates, or zip",
        authRequired: true,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(8),
      },
      {
        url: "https://api.openweathermap.org/data/2.5/forecast",
        method: "GET",
        description: "5-day / 3-hour forecast",
        authRequired: true,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(8),
      },
      {
        url: "https://api.openweathermap.org/geo/1.0/direct",
        method: "GET",
        description: "Geocode a city name to coordinates",
        authRequired: true,
        corsEnabled: true,
        status: "working",
        lastVerified: hoursAgo(9),
      },
    ],
  },
};

export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0];
  value = value.split("?")[0];
  return value;
}

export async function getMockEndpoints(
  rawInput: string
): Promise<DomainResult | null> {
  const domain = normalizeDomain(rawInput);
  await new Promise((r) => setTimeout(r, 1500));
  return DB[domain] ?? null;
}

export const SUGGESTED_DOMAINS = [
  "github.com",
  "spotify.com",
  "pokeapi.co",
  "openweathermap.org",
] as const;
