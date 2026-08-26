import { describe, expect, it } from "vitest";
import { PROVIDERS } from "./providerRegistry";
import { buildAddonManifest, parseStremioVideoId } from "./stremio";

describe("contrato Stremio", () => {
  it("publica apenas recursos e tipos necessários", () => {
    expect(buildAddonManifest()).toMatchObject({
      resources: ["stream"],
      types: ["movie", "series"],
      idPrefixes: ["tt"],
    });
  });

  it("converte um vídeo de filme para o contrato Nuvio", () => {
    expect(parseStremioVideoId("movie", "tt0133093")).toEqual({
      stremioType: "movie",
      nuvioType: "movie",
      imdbId: "tt0133093",
    });
  });

  it("extrai temporada e episódio no formato de série do Stremio", () => {
    expect(parseStremioVideoId("series", "tt0903747:1:1")).toEqual({
      stremioType: "series",
      nuvioType: "tv",
      imdbId: "tt0903747",
      season: 1,
      episode: 1,
    });
  });

  it("mantém exatamente os seis providers PT elegíveis, sem duplicidade", () => {
    expect(PROVIDERS.map(provider => provider.id)).toEqual(["fshd", "megaembed", "peachify", "redeflix", "animezey", "videasy"]);
    expect(new Set(PROVIDERS.map(provider => provider.id)).size).toBe(PROVIDERS.length);
    expect(PROVIDERS.every(provider => provider.declaredLanguages.includes("pt"))).toBe(true);
    expect(PROVIDERS.find(provider => provider.id === "videasy")?.availability).toBe("disabled-upstream");
  });
});
