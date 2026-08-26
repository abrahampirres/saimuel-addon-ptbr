import type { Request, Response } from "express";
import { getLatestAddonMonitor, saveAddonMonitorRun } from "./db";
import { runAddonMonitor } from "./addon/monitoring";
import { sdk } from "./_core/sdk";

function publicOriginFromRequest(request: Request): string {
  const forwardedHost = request.headers["x-forwarded-host"];
  const hostHeader = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost ?? request.get("host");
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocolHeader = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const protocol = protocolHeader === "http" ? "http" : "https";

  if (!hostHeader || !/^[a-z0-9.-]+(?::\d+)?$/i.test(hostHeader)) {
    throw new Error("A publicação não forneceu um host público válido.");
  }
  return `${protocol}://${hostHeader}`;
}

export async function handleAddonMonitor(request: Request, response: Response) {
  try {
    const user = await sdk.authenticateRequest(request);
    if (!user.isCron || !user.taskUid) {
      return response.status(403).json({ error: "cron-only" });
    }

    const summary = await runAddonMonitor(publicOriginFromRequest(request));
    await saveAddonMonitorRun(summary);
    return response.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada no monitoramento.";
    console.error("[Addon monitor]", error);
    return response.status(500).json({
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getAddonMonitorStatus() {
  const latest = await getLatestAddonMonitor();
  if (!latest) {
    return {
      status: "pending" as const,
      label: "Aguardando a primeira verificação após a publicação",
      checkedAt: null,
      totalChecks: 0,
      failedChecks: 0,
    };
  }
  return {
    ...latest,
    label: latest.status === "healthy" ? "Todos os alvos verificados responderam" : latest.status === "degraded" ? "O addon responde; uma ou mais fontes estão indisponíveis" : "A rota pública do addon requer atenção",
  };
}
