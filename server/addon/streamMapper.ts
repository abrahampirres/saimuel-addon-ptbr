import type { NuvioStream, ProviderDescriptor, StremioStream } from "./types";

const explicitForeignLanguage = /\b(en|english|hi|hindi|ja|japanese|fr|french|de|german|it|italian|es|spanish|ar|arabic|ko|korean|ta|tamil|te|telugu)\b/i;
const portugueseLanguage = /\b(pt|pt[-_ ]?br|por|portugu[eê]s|dublado|legendado|brasil)\b/i;

function unwrap(stream: NuvioStream): NuvioStream {
  return stream.data ? { ...stream, ...stream.data, data: undefined } : stream;
}

function formatQuality(quality: NuvioStream["quality"]): string {
  if (typeof quality === "number") return `${quality}p`;
  const normalized = quality?.toString().trim();
  return normalized || "Auto";
}

/**
 * A provider's explicit PT declaration is the baseline. If the provider adds a
 * stream-level language tag, it must also be compatible with Portuguese.
 */
export function isPortugueseStream(stream: NuvioStream): boolean {
  const candidate = unwrap(stream);
  const languageFields = [candidate.language, candidate.lang, candidate.group, candidate.audio]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!languageFields) return true;
  if (portugueseLanguage.test(languageFields)) return true;
  return !explicitForeignLanguage.test(languageFields);
}

export function mapNuvioStream(provider: ProviderDescriptor, raw: NuvioStream): StremioStream | null {
  const stream = unwrap(raw);
  if (!stream.url || !/^https?:\/\//i.test(stream.url) || !isPortugueseStream(stream)) return null;

  const quality = formatQuality(stream.quality);
  const requestHeaders = stream.headers ?? stream.behaviorHints?.proxyHeaders?.request;
  const streamName = `PT-BR · ${provider.name} · ${quality}`;
  const sourceDetail = stream.title || stream.name || `Reprodução ${quality}`;

  return {
    name: streamName,
    title: `${sourceDetail}\nFonte: ${provider.name} · Créditos: ${provider.credits} · Idioma: PT/pt-BR declarado`,
    url: stream.url,
    behaviorHints: requestHeaders
      ? {
          notWebReady: true,
          proxyHeaders: { request: requestHeaders },
        }
      : { notWebReady: true },
  };
}

export function dedupeStreams(streams: StremioStream[]): StremioStream[] {
  const seen = new Set<string>();
  return streams.filter(stream => {
    const key = `${stream.url}|${JSON.stringify(stream.behaviorHints?.proxyHeaders?.request ?? {})}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
