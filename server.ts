import "dotenv/config";
import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const UPSTREAM_TIMEOUT_MS = 20_000;

const VALID_LEVELS = new Set([1, 2, 3, 4]);
const VALID_PATHS = new Set(["conversation", "hypothesis_board"]);
const VALID_LANGS = new Set(["en", "ar"]);
const VALID_RESPONSE_STATUSES = new Set([
  "ok",
  "needs_clarification",
  "insufficient_evidence",
  "handover_recommended",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveUpstreamEndpoint(rawBaseUrl: string | undefined): URL | null {
  const trimmed = rawBaseUrl?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    const cleanPath = parsed.pathname.replace(/\/+$/, "");
    parsed.pathname = cleanPath.endsWith("/debug")
      ? cleanPath
      : `${cleanPath}/debug`;
    parsed.search = "";
    parsed.hash = "";
    return parsed;
  } catch {
    return null;
  }
}

function validateDebugRequestBody(body: unknown): Record<string, unknown> | null {
  if (!isRecord(body)) {
    return null;
  }

  const {
    code,
    error,
    expected_behavior,
    level,
    path: investigationPath,
    language,
    history,
    message,
    selected_hypothesis_id,
    rejected_hypothesis_ids,
    user_hypothesis,
  } = body;

  if (
    typeof code !== "string" ||
    typeof error !== "string" ||
    typeof expected_behavior !== "string"
  ) {
    return null;
  }

  if (typeof level !== "number" || !VALID_LEVELS.has(level)) {
    return null;
  }

  if (typeof investigationPath !== "string" || !VALID_PATHS.has(investigationPath)) {
    return null;
  }

  if (typeof language !== "string" || !VALID_LANGS.has(language)) {
    return null;
  }

  if (!Array.isArray(history)) {
    return null;
  }

  const sanitizedHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const item of history) {
    if (!isRecord(item)) {
      return null;
    }
    if (
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string"
    ) {
      return null;
    }
    sanitizedHistory.push({ role: item.role, content: item.content });
  }

  if (message !== undefined && typeof message !== "string") {
    return null;
  }
  if (
    selected_hypothesis_id !== undefined &&
    typeof selected_hypothesis_id !== "string"
  ) {
    return null;
  }
  if (user_hypothesis !== undefined && typeof user_hypothesis !== "string") {
    return null;
  }
  if (rejected_hypothesis_ids !== undefined) {
    if (
      !Array.isArray(rejected_hypothesis_ids) ||
      !rejected_hypothesis_ids.every((id) => typeof id === "string")
    ) {
      return null;
    }
  }

  return {
    code,
    error,
    expected_behavior,
    level,
    path: investigationPath,
    language,
    history: sanitizedHistory,
    ...(message !== undefined ? { message } : {}),
    ...(selected_hypothesis_id !== undefined ? { selected_hypothesis_id } : {}),
    ...(rejected_hypothesis_ids !== undefined ? { rejected_hypothesis_ids } : {}),
    ...(user_hypothesis !== undefined ? { user_hypothesis } : {}),
  };
}

function isValidUpstreamResponse(payload: unknown): boolean {
  if (!isRecord(payload)) {
    return false;
  }
  return (
    typeof payload.status === "string" &&
    VALID_RESPONSE_STATUSES.has(payload.status) &&
    typeof payload.provider === "string" &&
    typeof payload.is_demo === "boolean" &&
    typeof payload.level_applied === "number" &&
    VALID_LEVELS.has(payload.level_applied) &&
    typeof payload.message === "string"
  );
}

async function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/api/debug", async (req: Request, res: Response) => {
    const validatedPayload = validateDebugRequestBody(req.body);
    if (!validatedPayload) {
      res.status(422).json({
        detail: "Invalid DebugRequest payload.",
      });
      return;
    }

    const upstreamUrl = resolveUpstreamEndpoint(process.env.DETECTIVE_API_URL);
    if (!upstreamUrl) {
      res.status(502).json({
        detail: "Upstream debugging service URL is not configured or invalid.",
      });
      return;
    }

    const apiKey = process.env.DETECTIVE_API_KEY?.trim();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(validatedPayload),
        signal: controller.signal,
      });

      if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
        res.status(401).json({
          detail: "Upstream debugging service authentication failed.",
        });
        return;
      }

      if (upstreamResponse.status === 422 || upstreamResponse.status === 400) {
        res.status(422).json({
          detail: "Upstream debugging service rejected the request payload.",
        });
        return;
      }

      if (upstreamResponse.status === 504 || upstreamResponse.status === 408) {
        res.status(504).json({
          detail: "Upstream debugging service timed out.",
        });
        return;
      }

      if (!upstreamResponse.ok) {
        res.status(502).json({
          detail: `Upstream debugging service returned status ${upstreamResponse.status}.`,
        });
        return;
      }

      let upstreamJson: unknown;
      try {
        upstreamJson = await upstreamResponse.json();
      } catch {
        res.status(502).json({
          detail: "Upstream debugging service returned invalid JSON.",
        });
        return;
      }

      if (!isValidUpstreamResponse(upstreamJson)) {
        res.status(502).json({
          detail: "Upstream debugging service response did not match DebugResponse.",
        });
        return;
      }

      res.status(200).json(upstreamJson);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        res.status(504).json({
          detail: "Upstream debugging service timed out after 20 seconds.",
        });
        return;
      }

      res.status(502).json({
        detail: "Unable to reach upstream debugging service.",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (req: Request, res: Response, next) => {
      if (req.path.startsWith("/api/")) {
        next();
        return;
      }
      const indexHtml = path.join(distDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("Build output not found. Run npm run build first.");
      }
    });
  }

  return app;
}

const app = await createApp();
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Debugging Detective server listening on http://0.0.0.0:${PORT}`);
});
