import { Router, type Request, type Response } from "express";
import { buildAddonManifest, getPublicProviderStatus, getStreamsForStremio } from "./addon/stremio";
import { getAddonMonitorStatus } from "./scheduledAddonMonitor";

function sendJson(response: Response, body: unknown, status = 200) {
  response.status(status).setHeader("Access-Control-Allow-Origin", "*").setHeader("Cache-Control", "no-store").json(body);
}

export function createStremioRouter() {
  const router = Router();

  router.get("/manifest.json", (_request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cache-Control", "public, max-age=300");
    response.json(buildAddonManifest());
  });

  router.get("/stream/:type/:videoId.json", async (request: Request, response: Response) => {
    try {
      const streams = await getStreamsForStremio(request.params.type, request.params.videoId);
      sendJson(response, { streams });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao preparar streams.";
      sendJson(response, { streams: [], error: message });
    }
  });

  router.get("/api/addon/status", async (_request, response) => {
    sendJson(response, {
      providers: getPublicProviderStatus(),
      monitor: await getAddonMonitorStatus(),
      embedPlay: {
        status: "Índice somente",
        note: "A API EmbedPlay não é usada como fonte de reprodução, pois o endpoint fornecido retorna apenas IDs e não URLs de stream verificáveis.",
      },
    });
  });

  router.get("/healthz", (_request, response) => {
    sendJson(response, { ok: true, addon: buildAddonManifest().id });
  });

  return router;
}
