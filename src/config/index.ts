export type ApiMode = "mock" | "http";

/**
 * Single configuration switch between local mock responses and the
 * server-side HTTP proxy forwarding to the Python FastAPI backend.
 */
export const API_MODE: ApiMode = "mock";

/**
 * Same-origin server-side proxy route for the future HTTP implementation.
 * Never store or send upstream API secrets from browser code.
 */
export const API_DEBUG_ENDPOINT = "/api/debug";

export const INVESTIGATION_SCHEMA_VERSION = 1;
