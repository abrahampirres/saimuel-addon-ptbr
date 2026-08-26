import { createHash, randomUUID } from "node:crypto";
import { getActiveProviders } from "./providerRegistry";

export type MonitorCheck = {
  target: string;
  healthy: boolean;
  statusCode: number | null;
  latencyMs: number;
  detail: string;
};

export type MonitorSummary = {
  runId: string;
  status: "healthy" | "degraded" | "down";
  totalChecks: number;
  failedChecks: number;
  checks: MonitorCheck[];
};

const TIMEOUT_MS = 12_000;

async function timedFetch(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json, text/plain;q=0.9, */*;q=0.1" },
    });
    return { response, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timer);
  }
}

async function probeJsonEndpoint(target: string, url: string, validate: (body: unknown) => boolean): Promise<MonitorCheck> {
  try {
    const { response, latencyMs } = await timedFetch(url);
    if (!response.ok) {
      return { target, healthy: false, statusCode: response.status, latencyMs, detail: `HTTP ${response.status}` };
    }
    const body = (await response.json()) as unknown;
    const healthy = validate(body);
    return {
      target,
      healthy,
      statusCode: response.status,
      latencyMs,
      detail: healthy ? "Resposta compatível" : "Resposta inválida",
    };
  } catch (error) {
    return {
      target,
      healthy: false,
      statusCode: null,
      latencyMs: TIMEOUT_MS,
      detail: error instanceof Error && error.name === "AbortError" ? "Tempo excedido" : "Falha de rede",
    };
  }
}

async function probeProviderSource(provider: ReturnType<typeof getActiveProviders>[number]): Promise<MonitorCheck> {
  const target = `provider:${provider.id}`;
  try {
    const { response, latencyMs } = await timedFetch(provider.sourceUrl);
    if (!response.ok) {
      return { target, healthy: false, statusCode: response.status, latencyMs, detail: `HTTP ${response.status}` };
    }
    const source = await response.text();
    const digest = createHash("sha256").update(source).digest("hex");
    const healthy = digest === provider.sourceSha256;
    return {
      target,
      healthy,
      statusCode: response.status,
      latencyMs,
      detail: healthy ? "Fonte acessível e íntegra" : "Integridade alterada; execução bloqueada",
    };
  } catch (error) {
    return {
      target,
      healthy: false,
      statusCode: null,
      latencyMs: TIMEOUT_MS,
      detail: error instanceof Error && error.name === "AbortError" ? "Tempo excedido" : "Falha de rede",
    };
  }
}

export function summarizeChecks(checks: MonitorCheck[], runId = randomUUID()): MonitorSummary {
  const failedChecks = checks.filter(check => !check.healthy).length;
  const coreChecks = checks.filter(check => check.target === "manifest" || check.target === "addon-status");
  const coreFailed = coreChecks.some(check => !check.healthy);
  const status = coreFailed ? "down" : failedChecks > 0 ? "degraded" : "healthy";
  return { runId, status, totalChecks: checks.length, failedChecks, checks };
}

/** Runs only from the platform-signed scheduled callback after the site is published. */
export async function runAddonMonitor(publicOrigin: string): Promise<MonitorSummary> {
  const origin = new URL(publicOrigin).origin;
  if (origin.startsWith("http://") && !origin.includes("localhost")) {
    throw new Error("O monitoramento exige uma origem HTTPS publicada.");
  }

  const checks = await Promise.all([
    probeJsonEndpoint("manifest", `${origin}/manifest.json`, body => {
      const manifest = body as { id?: unknown; resources?: unknown; types?: unknown };
      return manifest.id === "community.saimuel.addon.ptbr" && Array.isArray(manifest.resources) && Array.isArray(manifest.types);
    }),
    probeJsonEndpoint("addon-status", `${origin}/api/addon/status`, body => {
      const status = body as { providers?: unknown; monitor?: unknown };
      return Array.isArray(status.providers) && typeof status.monitor === "object" && status.monitor !== null;
    }),
    ...getActiveProviders().map(probeProviderSource),
  ]);

  return summarizeChecks(checks);
}
