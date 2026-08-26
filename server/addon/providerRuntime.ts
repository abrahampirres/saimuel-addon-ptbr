import { createHash } from "node:crypto";
import vm from "node:vm";
import type { NuvioStream, ProviderDescriptor, StreamRequest } from "./types";

type ProviderFunction = (
  tmdbId: string,
  mediaType: "movie" | "tv",
  season?: number,
  episode?: number
) => Promise<NuvioStream[]> | NuvioStream[];

const sourceCache = new Map<string, Promise<ProviderFunction>>();

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function compileProvider(source: string, provider: ProviderDescriptor): ProviderFunction {
  const module = { exports: {} as Record<string, unknown> };
  const sandbox: Record<string, unknown> = {
    module,
    exports: module.exports,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    console: {
      log: (...args: unknown[]) => console.info(`[Provider:${provider.id}]`, ...args),
      warn: (...args: unknown[]) => console.warn(`[Provider:${provider.id}]`, ...args),
      error: (...args: unknown[]) => console.warn(`[Provider:${provider.id}]`, ...args),
    },
    setTimeout,
    clearTimeout,
    TextEncoder,
    TextDecoder,
    URL,
    URLSearchParams,
    atob,
    btoa,
  };
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox, { name: `nuvio-provider-${provider.id}` });
  new vm.Script(source, { filename: `${provider.id}.js` }).runInContext(context, { timeout: 350 });

  const exported = module.exports as { getStreams?: unknown };
  const candidate = exported.getStreams ?? sandbox.getStreams;
  if (typeof candidate !== "function") {
    throw new Error(`Provider ${provider.id} não exportou getStreams.`);
  }
  return candidate as ProviderFunction;
}

async function loadProvider(provider: ProviderDescriptor): Promise<ProviderFunction> {
  const response = await withTimeout(fetch(provider.sourceUrl), 6_000, `Tempo excedido ao buscar ${provider.id}.`);
  if (!response.ok) throw new Error(`Fonte ${provider.id} respondeu HTTP ${response.status}.`);

  const source = await response.text();
  const digest = createHash("sha256").update(source).digest("hex");
  if (digest !== provider.sourceSha256) {
    throw new Error(`Integridade inválida para ${provider.id}; execução bloqueada.`);
  }
  return compileProvider(source, provider);
}

export async function invokeProvider(provider: ProviderDescriptor, request: StreamRequest): Promise<NuvioStream[]> {
  let cached = sourceCache.get(provider.id);
  if (!cached) {
    cached = loadProvider(provider).catch(error => {
      sourceCache.delete(provider.id);
      throw error;
    });
    sourceCache.set(provider.id, cached);
  }

  const getStreams = await withTimeout(cached, 7_000, `Tempo excedido ao preparar ${provider.id}.`);
  const result = await withTimeout(
    Promise.resolve(getStreams(request.tmdbId, request.nuvioType, request.season, request.episode)),
    13_000,
    `Tempo excedido em ${provider.id}.`
  );
  return Array.isArray(result) ? result : [];
}
