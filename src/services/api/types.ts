import type { DebugRequest, DebugResponse } from "@/src/types";

export type DebugFallbackReason = "timeout" | 401 | 422 | 502;

export class DebugServiceError extends Error {
  readonly reason: DebugFallbackReason;
  readonly httpStatus?: number;

  constructor(
    reason: DebugFallbackReason,
    message?: string,
    httpStatus?: number
  ) {
    super(message ?? `Debugging service error (${reason})`);
    this.name = "DebugServiceError";
    this.reason = reason;
    this.httpStatus = httpStatus;
  }
}

export class DebugServiceTimeoutError extends DebugServiceError {
  constructor(message = "Debugging service request timed out") {
    super("timeout", message, 504);
    this.name = "DebugServiceTimeoutError";
  }
}

export function getDebugFallbackReason(err: unknown): DebugFallbackReason | null {
  if (err instanceof DebugServiceTimeoutError) {
    return "timeout";
  }
  if (err instanceof DebugServiceError) {
    return err.reason;
  }
  return null;
}

export interface DebugApiClient {
  submitDebugTurn(request: DebugRequest): Promise<DebugResponse>;
}
