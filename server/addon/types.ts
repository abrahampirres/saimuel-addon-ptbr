export type StremioType = "movie" | "series";
export type NuvioMediaType = "movie" | "tv";

export type ProviderAvailability = "active" | "disabled-upstream";

export type ProviderDescriptor = {
  id: "fshd" | "megaembed" | "peachify" | "redeflix" | "animezey" | "videasy";
  name: string;
  credits: string;
  repository: string;
  sourceUrl: string;
  sourceSha256: string;
  supportedTypes: NuvioMediaType[];
  declaredLanguages: ["pt"] | ["en", "pt"] | ["en", "de", "it", "fr", "hi", "es", "pt"];
  availability: ProviderAvailability;
  availabilityNote: string;
  sourceVersion: string;
};

export type StreamRequest = {
  stremioType: StremioType;
  nuvioType: NuvioMediaType;
  imdbId: string;
  tmdbId: string;
  season?: number;
  episode?: number;
};

export type NuvioStream = {
  url?: string;
  name?: string;
  title?: string;
  quality?: string | number;
  type?: string;
  language?: string;
  lang?: string;
  group?: string;
  audio?: string;
  headers?: Record<string, string>;
  behaviorHints?: {
    proxyHeaders?: {
      request?: Record<string, string>;
    };
  };
  data?: NuvioStream;
};

export type StremioStream = {
  name: string;
  title: string;
  url: string;
  behaviorHints?: {
    notWebReady?: boolean;
    proxyHeaders?: {
      request?: Record<string, string>;
    };
  };
};
