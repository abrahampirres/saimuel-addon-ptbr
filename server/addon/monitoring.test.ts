import { describe, expect, it } from "vitest";
import { summarizeChecks, type MonitorCheck } from "./monitoring";

const healthyCheck = (target: string): MonitorCheck => ({
  target,
  healthy: true,
  statusCode: 200,
  latencyMs: 30,
  detail: "Resposta compatível",
});

describe("resumo de monitoramento", () => {
  it("classifica o addon como saudável quando todos os alvos passam", () => {
    const summary = summarizeChecks([healthyCheck("manifest"), healthyCheck("healthz")], "run-1");
    expect(summary).toMatchObject({ runId: "run-1", status: "healthy", failedChecks: 0, totalChecks: 2 });
  });

  it("classifica falha de uma fonte externa como degradação, sem declarar o addon indisponível", () => {
    const summary = summarizeChecks([
      healthyCheck("manifest"),
      healthyCheck("healthz"),
      { ...healthyCheck("provider:megaembed"), healthy: false, detail: "Tempo excedido" },
    ], "run-2");
    expect(summary.status).toBe("degraded");
    expect(summary.failedChecks).toBe(1);
  });

  it("classifica falha do manifesto como indisponibilidade do addon", () => {
    const summary = summarizeChecks([
      { ...healthyCheck("manifest"), healthy: false, statusCode: 503 },
      healthyCheck("healthz"),
    ], "run-3");
    expect(summary.status).toBe("down");
  });
});
