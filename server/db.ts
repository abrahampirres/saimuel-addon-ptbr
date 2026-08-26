import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { addonMonitorRuns, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { MonitorSummary } from "./addon/monitoring";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function saveAddonMonitorRun(summary: MonitorSummary): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Monitoramento não registrado: banco indisponível");
    return;
  }

  await db.insert(addonMonitorRuns).values(summary.checks.map(check => ({
    runId: summary.runId,
    target: check.target,
    healthy: check.healthy ? 1 : 0,
    statusCode: check.statusCode,
    latencyMs: check.latencyMs,
    detail: check.detail,
  })));
}

export async function getLatestAddonMonitor() {
  const db = await getDb();
  if (!db) return undefined;

  const [latest] = await db.select().from(addonMonitorRuns).orderBy(desc(addonMonitorRuns.checkedAt)).limit(1);
  if (!latest) return undefined;

  const checks = await db.select().from(addonMonitorRuns).where(eq(addonMonitorRuns.runId, latest.runId));
  const failedChecks = checks.filter(check => check.healthy !== 1).length;
  const coreFailed = checks.some(check => (check.target === "manifest" || check.target === "addon-status") && check.healthy !== 1);
  return {
    status: coreFailed ? "down" as const : failedChecks > 0 ? "degraded" as const : "healthy" as const,
    checkedAt: latest.checkedAt,
    totalChecks: checks.length,
    failedChecks,
  };
}
