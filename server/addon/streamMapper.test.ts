import { describe, expect, it } from "vitest";
import { PROVIDERS } from "./providerRegistry";
import { dedupeStreams, isPortugueseStream, mapNuvioStream } from "./streamMapper";

const fshd = PROVIDERS.find(provider => provider.id === "fshd")!;

describe("filtro e adaptação de streams", () => {
  it("aceita streams sem marcação individual quando o provider declara português", () => {
    expect(isPortugueseStream({ url: "https://example.test/video.m3u8" })).toBe(true);
  });

  it("rejeita um stream que se identifica explicitamente como idioma não português", () => {
    expect(isPortugueseStream({ url: "https://example.test/video.m3u8", language: "English" })).toBe(false);
  });

  it("preserva fonte, qualidade e cabeçalhos no formato Stremio", () => {
    const stream = mapNuvioStream(fshd, {
      url: "https://example.test/video.m3u8",
      quality: 1080,
      group: "pt-BR",
      headers: { Referer: "https://example.test/" },
    });

    expect(stream).toMatchObject({
      name: "PT-BR · FSHD · 1080p",
      url: "https://example.test/video.m3u8",
      behaviorHints: { proxyHeaders: { request: { Referer: "https://example.test/" } } },
    });
  });

  it("remove URLs duplicadas com os mesmos cabeçalhos", () => {
    const streams = [
      { name: "A", title: "A", url: "https://example.test/video.m3u8" },
      { name: "B", title: "B", url: "https://example.test/video.m3u8" },
    ];
    expect(dedupeStreams(streams)).toHaveLength(1);
  });
});
