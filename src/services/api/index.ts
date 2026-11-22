import { API_MODE, type ApiMode } from "@/src/config";
import type { DebugRequest, DebugResponse } from "@/src/types";
import { HttpDebugApi } from "./httpDebugApi";
import { MockDebugApi } from "./mockDebugApi";
import {
  DebugServiceTimeoutError,
  type DebugApiClient,
} from "./types";

const mockClient = new MockDebugApi();
const httpClient = new HttpDebugApi();

export function getActiveApiMode(): ApiMode {
  return API_MODE;
}

export const debugApi: DebugApiClient =
  API_MODE === "http" ? httpClient : mockClient;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SubmitWithRetryOptions {
  simulateTimeout?: boolean;
  onRetrying?: () => void;
}

/**
 * Executes a debug request with exactly ONE automatic retry on failure/timeout.
 * When simulateTimeout is enabled (mock mode only), both attempts simulate a
 * timeout so the UI can demonstrate the automatic retry and fallback banner.
 */
export async function submitDebugTurnWithRetry(
  request: DebugRequest,
  options?: SubmitWithRetryOptions
): Promise<DebugResponse> {
  const executeAttempt = async (): Promise<DebugResponse> => {
    if (API_MODE === "mock" && options?.simulateTimeout) {
      await delay(300);
      throw new DebugServiceTimeoutError();
    }
    return debugApi.submitDebugTurn(request);
  };

  try {
    return await executeAttempt();
  } catch {
    options?.onRetrying?.();
    await delay(250);
    return await executeAttempt();
  }
}

export {
  DebugServiceError,
  DebugServiceTimeoutError,
  getDebugFallbackReason,
  type DebugApiClient,
  type DebugFallbackReason,
} from "./types";
