import { env } from "~/env";

async function jellyseerrRequest(body: object): Promise<void> {
  if (!env.JELLYSEER_URL || !env.JELLYSEER_API_KEY) {
    console.log("[Jellyseerr] Skipping — JELLYSEER_URL or JELLYSEER_API_KEY not set");
    return;
  }

  const url = new URL("/api/v1/request", env.JELLYSEER_URL);
  console.log(`[Jellyseerr] POST ${url.toString()}`, JSON.stringify(body));

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": env.JELLYSEER_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 409) {
      console.log("[Jellyseerr] Already requested (409)");
    } else if (!res.ok) {
      const text = await res.text();
      console.error(`[Jellyseerr] Request failed: ${res.status} ${res.statusText} — ${text}`);
    } else {
      console.log(`[Jellyseerr] Request accepted (${res.status})`);
    }
  } catch (err) {
    console.error("[Jellyseerr] Network error:", err);
  }
}


export async function requestMovieOnJellyseerr(tmdbId: number): Promise<void> {
  await jellyseerrRequest({ mediaType: "movie", mediaId: tmdbId });
}

export async function requestSeriesOnJellyseerr(
  tmdbId: number,
  season: number,
): Promise<void> {
  await jellyseerrRequest({ mediaType: "tv", mediaId: tmdbId, seasons: [season] });
}
