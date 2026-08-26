import { getActiveProviders, getEligibleProviders } from "./providerRegistry";
import { dedupeStreams, mapNuvioStream } from "./streamMapper";
import { invokeProvider } from "./providerRuntime";
import type { StremioStream, StremioType, StreamRequest } from "./types";

const CINEMETA_BASE_URL = "https://v3-cinemeta.strem.io";
const metadataCache = new Map<string, { expiresAt: number; tmdbId: string }>();

export function buildAddonManifest() {
  return {
    id: "community.saimuel.addon.ptbr",
    version: "2.0.0",
    name: "Saimuel Addon PT-BR",
    description: "Streams em português para filmes e séries, agregados de providers Nuvio elegíveis.",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    catalogs: [],
    behaviorHints: {
      configurable: false,
      configurationRequired: false,
    },
  };
}

export function parseStremioVideoId(stremioType: string, videoId: string): Omit<StreamRequest, "tmdbId"> {
  if (stremioType !== "movie" && stremioType !== "series") {
    throw new Error("Tipo Stremio não suportado.");
  }

  const [imdbId, seasonPart, episodePart] = decodeURIComponent(videoId).split(":");
  if (!/^tt\d{5,}$/i.test(imdbId)) throw new Error("Este addon aceita somente IDs IMDb.");

  const stremio = stremioType as StremioType;
  if (stremio === "movie") {
    return { stremioType: stremio, nuvioType: "movie", imdbId };
  }

  const season = Number(seasonPart);
  const episode = Number(episodePart);
  if (!Number.isInteger(season) || season < 0 || !Number.isInteger(episode) || episode < 1) {
    throw new Error("ID de episódio inválido. Esperado: tt1234567:temporada:episódio.");
  }
  return { stremioType: stremio, nuvioType: "tv", imdbId, season, episode };
}

async function resolveTmdbId(stremioType: StremioType, imdbId: string): Promise<string> {
  const cacheKey = `${stremioType}:${imdbId}`;
  const cached = metadataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.tmdbId;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(`${CINEMETA_BASE_URL}/meta/${stremioType}/${imdbId}.json`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Cinemeta respondeu HTTP ${response.status}.`);
    const payload = (await response.json()) as { meta?: { moviedb_id?: number | string } };
    const tmdbId = payload.meta?.moviedb_id?.toString();
    if (!tmdbId) throw new Error("Cinemeta não forneceu um ID TMDB para este título.");
    metadataCache.set(cacheKey, { tmdbId, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
    return tmdbId;
  } finally {
    clearTimeout(timer);
  }
}

export async function getStreamsForStremio(stremioType: string, videoId: string): Promise<StremioStream[]> {
  const partialRequest = parseStremioVideoId(stremioType, videoId);
  const tmdbId = await resolveTmdbId(partialRequest.stremioType, partialRequest.imdbId);
  const request: StreamRequest = { ...partialRequest, tmdbId };
  const providers = getActiveProviders().filter(provider => provider.supportedTypes.includes(request.nuvioType));

  const results = await Promise.allSettled(providers.map(provider => invokeProvider(provider, request)));
  const streams = results.flatMap((result, index) => {
    if (result.status === "rejected") {
      console.warn(`[Addon] ${providers[index]?.id} indisponível:`, result.reason instanceof Error ? result.reason.message : result.reason);
      return [];
    }
    return result.value.map(raw => mapNuvioStream(providers[index]!, raw)).filter((stream): stream is StremioStream => Boolean(stream));
  });

  return dedupeStreams(streams);
}

export function getPublicProviderStatus() {
  return getEligibleProviders().map(provider => ({
    id: provider.id,
    name: provider.name,
    credits: provider.credits,
    repository: `https://github.com/${provider.repository}`,
    languages: provider.declaredLanguages,
    status: provider.availability === "active" ? "Ativo" : "Em validação",
    note: provider.availabilityNote,
    integrity: "SHA-256 fixado",
  }));
}
