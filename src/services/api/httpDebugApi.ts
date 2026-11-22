import { API_DEBUG_ENDPOINT } from "@/src/config";
import type { DebugRequest, DebugResponse, Hypothesis } from "@/src/types";
import {
  DebugServiceError,
  DebugServiceTimeoutError,
  type DebugApiClient,
} from "./types";

export const HTTP_DEBUG_TIMEOUT_MS = 20_000;

const VALID_LEVELS = new Set([1, 2, 3, 4]);
const VALID_STATUSES = new Set([
  "ok",
  "needs_clarification",
  "insufficient_evidence",
  "handover_recommended",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidHypothesis(item: unknown): item is Hypothesis {
  if (!isRecord(item)) {
    return false;
  }
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.explanation === "string" &&
    Array.isArray(item.evidence) &&
    item.evidence.every((ev) => typeof ev === "string") &&
    typeof item.probe === "string" &&
    (item.status === "proposed" ||
      item.status === "investigating" ||
      item.status === "rejected" ||
      item.status === "user_added")
  );
}

function parseDebugResponse(payload: unknown): DebugResponse {
  if (!isRecord(payload)) {
    throw new DebugServiceError(
      502,
      "Invalid response payload from debugging service.",
      502
    );
  }

  if (
    typeof payload.status !== "string" ||
    !VALID_STATUSES.has(payload.status) ||
    typeof payload.provider !== "string" ||
    typeof payload.is_demo !== "boolean" ||
    typeof payload.level_applied !== "number" ||
    !VALID_LEVELS.has(payload.level_applied) ||
    typeof payload.message !== "string"
  ) {
    throw new DebugServiceError(
      502,
      "Response from debugging service did not match DebugResponse.",
      502
    );
  }

  const nextQuestion =
    typeof payload.next_question === "string"
      ? payload.next_question
      : undefined;

  const missingInfo =
    Array.isArray(payload.missing_info) &&
    payload.missing_info.every((item) => typeof item === "string")
      ? payload.missing_info
      : undefined;

  const hypotheses = Array.isArray(payload.hypotheses)
    ? payload.hypotheses.filter(isValidHypothesis)
    : undefined;

  const suggestedActions =
    Array.isArray(payload.suggested_actions) &&
    payload.suggested_actions.every((item) => typeof item === "string")
      ? payload.suggested_actions
      : undefined;

  return {
    status: payload.status as DebugResponse["status"],
    provider: payload.provider,
    is_demo: payload.is_demo,
    level_applied: payload.level_applied as DebugResponse["level_applied"],
    message: payload.message,
    ...(nextQuestion !== undefined ? { next_question: nextQuestion } : {}),
    ...(missingInfo !== undefined ? { missing_info: missingInfo } : {}),
    ...(hypotheses !== undefined ? { hypotheses } : {}),
    ...(suggestedActions !== undefined
      ? { suggested_actions: suggestedActions }
      : {}),
  };
}

/**
 * Full HTTP adapter targeting this application's own server-side proxy route
 * (/api/debug). The server-side proxy forwards requests to the Python FastAPI
 * backend using server-side secrets (DETECTIVE_API_URL, DETECTIVE_API_KEY);
 * no API key is ever referenced or stored in browser code.
 */
export class HttpDebugApi implements DebugApiClient {
  private readonly endpoint: string;
  private readonly timeoutMs: number;

  constructor(
    endpoint: string = API_DEBUG_ENDPOINT,
    timeoutMs: number = HTTP_DEBUG_TIMEOUT_MS
  ) {
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
  }

  async submitDebugTurn(request: DebugRequest): Promise<DebugResponse> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      this.timeoutMs
    );

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new DebugServiceError(
          401,
          "Authentication with the debugging service failed.",
          response.status
        );
      }

      if (response.status === 422 || response.status === 400) {
        throw new DebugServiceError(
          422,
          "The debugging service could not process the submitted request.",
          response.status
        );
      }

      if (response.status === 408 || response.status === 504) {
        throw new DebugServiceTimeoutError();
      }

      if (!response.ok) {
        throw new DebugServiceError(
          502,
          `Debugging proxy returned status ${response.status}.`,
          response.status
        );
      }

      let rawJson: unknown;
      try {
        rawJson = await response.json();
      } catch {
        throw new DebugServiceError(
          502,
          "Debugging proxy returned unreadable JSON.",
          502
        );
      }

      return parseDebugResponse(rawJson);
    } catch (err) {
      if (err instanceof DebugServiceError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new DebugServiceTimeoutError();
      }
      throw new DebugServiceError(
        502,
        "Could not reach the debugging service proxy.",
        502
      );
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }
}
