import { INVESTIGATION_SCHEMA_VERSION } from "@/src/config";
import type {
  AssistanceLevel,
  CaseDetails,
  ChatTurn,
  ClosureSummary,
  FeedbackEvent,
  FeedbackType,
  Hypothesis,
  HypothesisStatus,
  Investigation,
  InvestigationStatus,
  Lang,
  Path,
} from "@/src/types";

const INVESTIGATIONS_STORAGE_KEY = "dd_investigations";

export interface InvestigationListQuery {
  status?: InvestigationStatus | "all";
  search?: string;
}

export interface InvestigationRepository {
  /** Mirrors GET /investigations */
  list(query?: InvestigationListQuery): Promise<Investigation[]>;
  /** Mirrors GET /investigations/:id */
  get(id: string): Promise<Investigation | null>;
  /** Mirrors POST /investigations or PUT /investigations/:id */
  save(investigation: Investigation): Promise<Investigation>;
  /** Mirrors DELETE /investigations/:id */
  delete(id: string): Promise<void>;
}

export interface StorageReadResult {
  items: Investigation[];
  skippedCorruptCount: number;
  migratedCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asValidIsoTimestamp(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return fallback;
}

function normalizeLevel(value: unknown): AssistanceLevel {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }
  return 1;
}

function normalizePath(value: unknown): Path | undefined {
  if (value === "conversation" || value === "hypothesis_board") {
    return value;
  }
  return undefined;
}

function normalizeLang(value: unknown): Lang {
  return value === "ar" ? "ar" : "en";
}

function normalizeStatus(value: unknown): InvestigationStatus {
  if (
    value === "open" ||
    value === "resolved" ||
    value === "unresolved" ||
    value === "handed_over"
  ) {
    return value;
  }
  return "open";
}

function normalizeCaseDetails(raw: unknown): CaseDetails | null {
  if (!isRecord(raw)) {
    return null;
  }
  const code = asString(raw.code);
  const error = asString(raw.error);
  const expectedBehavior = asString(raw.expectedBehavior);
  const actualOutput = asNonEmptyString(raw.actualOutput);
  const sampleInput = asNonEmptyString(raw.sampleInput);

  return {
    code,
    error,
    expectedBehavior,
    ...(actualOutput ? { actualOutput } : {}),
    ...(sampleInput ? { sampleInput } : {}),
  };
}

function normalizeTurns(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const now = new Date().toISOString();
  const turns: ChatTurn[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const id = asNonEmptyString(item.id);
    const content = asString(item.content);
    const role =
      item.role === "user" ||
      item.role === "assistant" ||
      item.role === "system"
        ? item.role
        : null;
    if (!id || !role) {
      continue;
    }
    turns.push({
      id,
      role,
      content,
      level: normalizeLevel(item.level),
      path: normalizePath(item.path) ?? "conversation",
      createdAt: asValidIsoTimestamp(item.createdAt, now),
      isDemo: Boolean(item.isDemo),
    });
  }
  return turns;
}

function normalizeHypothesisStatus(value: unknown): HypothesisStatus {
  if (
    value === "proposed" ||
    value === "investigating" ||
    value === "rejected" ||
    value === "user_added"
  ) {
    return value;
  }
  return "proposed";
}

function normalizeHypotheses(raw: unknown): Hypothesis[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const hypotheses: Hypothesis[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const id = asNonEmptyString(item.id);
    const title = asNonEmptyString(item.title);
    if (!id || !title) {
      continue;
    }
    const evidence = Array.isArray(item.evidence)
      ? item.evidence.filter((ev): ev is string => typeof ev === "string")
      : [];
    hypotheses.push({
      id,
      title,
      explanation: asString(item.explanation),
      evidence,
      probe: asString(item.probe),
      status: normalizeHypothesisStatus(item.status),
    });
  }
  return hypotheses;
}

function normalizeFeedbackType(value: unknown): FeedbackType | null {
  if (
    value === "worked" ||
    value === "still_failing" ||
    value === "different_result" ||
    value === "need_more_help"
  ) {
    return value;
  }
  return null;
}

function normalizeFeedback(raw: unknown): FeedbackEvent[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const now = new Date().toISOString();
  const events: FeedbackEvent[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const id = asNonEmptyString(item.id);
    const type = normalizeFeedbackType(item.type);
    if (!id || !type) {
      continue;
    }
    const note = asNonEmptyString(item.note);
    const newOutput = asNonEmptyString(item.newOutput);
    events.push({
      id,
      type,
      ...(note ? { note } : {}),
      ...(newOutput ? { newOutput } : {}),
      createdAt: asValidIsoTimestamp(item.createdAt, now),
    });
  }
  return events;
}

function normalizeClosure(raw: unknown): ClosureSummary | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const reportedProblem = asString(raw.reportedProblem);
  const confirmedCause = asString(raw.confirmedCause);
  const evidence = asString(raw.evidence);
  const appliedFix = asString(raw.appliedFix);
  const verificationResult = asString(raw.verificationResult);
  const reflection = asNonEmptyString(raw.reflection);

  return {
    reportedProblem,
    confirmedCause: confirmedCause || "unresolved",
    evidence,
    appliedFix,
    verificationResult,
    ...(reflection ? { reflection } : {}),
  };
}

/**
 * Validates and safely migrates any stored investigation object (including legacy
 * unversioned / v0 records or partial objects) to INVESTIGATION_SCHEMA_VERSION.
 * Returns null if the entry is too corrupt to recover safely.
 */
export function migrateInvestigationRecord(
  raw: unknown
): { investigation: Investigation; migrated: boolean } | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = asNonEmptyString(raw.id);
  if (!id) {
    return null;
  }

  const rawSchemaVersion =
    typeof raw.schemaVersion === "number" && Number.isFinite(raw.schemaVersion)
      ? raw.schemaVersion
      : 0;

  // Reject records from unsupported incompatible future major schemas? Still recover fields safely if present,
  // or treat v0 -> v1 migration cleanly.
  const migrated = rawSchemaVersion < INVESTIGATION_SCHEMA_VERSION;

  const caseDetails =
    normalizeCaseDetails(raw.case) ??
    (typeof raw.code === "string" || typeof raw.error === "string"
      ? {
          code: asString(raw.code),
          error: asString(raw.error),
          expectedBehavior: asString(raw.expectedBehavior),
        }
      : null);

  if (!caseDetails) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asValidIsoTimestamp(raw.createdAt, now);
  const updatedAt = asValidIsoTimestamp(raw.updatedAt, createdAt);
  const title = asNonEmptyString(raw.title) ?? `Investigation ${id}`;
  const path = normalizePath(raw.path);
  const selectedHypothesisId = asNonEmptyString(raw.selectedHypothesisId);
  const closure = normalizeClosure(raw.closure);

  const investigation: Investigation = {
    id,
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    title,
    createdAt,
    updatedAt,
    status: normalizeStatus(raw.status),
    language: normalizeLang(raw.language),
    case: caseDetails,
    ...(path ? { path } : {}),
    level: normalizeLevel(raw.level),
    turns: normalizeTurns(raw.turns),
    hypotheses: normalizeHypotheses(raw.hypotheses),
    ...(selectedHypothesisId ? { selectedHypothesisId } : {}),
    feedback: normalizeFeedback(raw.feedback),
    ...(closure ? { closure } : {}),
  };

  return { investigation, migrated };
}

let lastRecoveryReport: { skippedCorruptCount: number; migratedCount: number } = {
  skippedCorruptCount: 0,
  migratedCount: 0,
};

export function getLastStorageRecoveryReport(): {
  skippedCorruptCount: number;
  migratedCount: number;
} {
  return { ...lastRecoveryReport };
}

export function readAndMigrateInvestigations(): StorageReadResult {
  if (typeof window === "undefined") {
    lastRecoveryReport = { skippedCorruptCount: 0, migratedCount: 0 };
    return { items: [], ...lastRecoveryReport };
  }

  try {
    const raw = window.localStorage.getItem(INVESTIGATIONS_STORAGE_KEY);
    if (!raw) {
      lastRecoveryReport = { skippedCorruptCount: 0, migratedCount: 0 };
      return { items: [], ...lastRecoveryReport };
    }

    const parsed: unknown = JSON.parse(raw);
    let candidateArray: unknown[] | null = null;

    if (Array.isArray(parsed)) {
      candidateArray = parsed;
    } else if (isRecord(parsed) && Array.isArray(parsed.items)) {
      candidateArray = parsed.items;
    }

    if (!candidateArray) {
      lastRecoveryReport = { skippedCorruptCount: 1, migratedCount: 0 };
      return { items: [], ...lastRecoveryReport };
    }

    const items: Investigation[] = [];
    let skippedCorruptCount = 0;
    let migratedCount = 0;

    for (const entry of candidateArray) {
      const result = migrateInvestigationRecord(entry);
      if (!result) {
        skippedCorruptCount += 1;
        continue;
      }
      if (result.migrated) {
        migratedCount += 1;
      }
      items.push(result.investigation);
    }

    // Persist migrated records cleanly if any v0 records were upgraded
    if (migratedCount > 0 && skippedCorruptCount === 0) {
      saveInvestigations(items);
    }

    lastRecoveryReport = { skippedCorruptCount, migratedCount };
    return { items, ...lastRecoveryReport };
  } catch {
    lastRecoveryReport = { skippedCorruptCount: 1, migratedCount: 0 };
    return { items: [], ...lastRecoveryReport };
  }
}

export function loadInvestigations(): Investigation[] {
  return readAndMigrateInvestigations().items;
}

export function saveInvestigations(investigations: Investigation[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      INVESTIGATIONS_STORAGE_KEY,
      JSON.stringify(investigations)
    );
  } catch {
    // Ignore storage quota or restricted environment failures
  }
}

export function getInvestigationById(id: string): Investigation | undefined {
  return loadInvestigations().find((item) => item.id === id);
}

export function upsertInvestigation(investigation: Investigation): Investigation {
  const existing = loadInvestigations();
  const normalized: Investigation = {
    ...investigation,
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
  };
  const index = existing.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    existing[index] = normalized;
  } else {
    existing.unshift(normalized);
  }
  saveInvestigations(existing);
  return normalized;
}

export function serializeInvestigationExport(investigation: Investigation): string {
  return JSON.stringify(
    {
      schemaVersion: INVESTIGATION_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      investigation,
    },
    null,
    2
  );
}

function matchesQuery(
  item: Investigation,
  query?: InvestigationListQuery
): boolean {
  if (!query) {
    return true;
  }
  if (query.status && query.status !== "all" && item.status !== query.status) {
    return false;
  }
  const needle = query.search?.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = [
    item.title,
    item.id,
    item.case.code,
    item.case.error,
    item.case.expectedBehavior,
    item.closure?.confirmedCause ?? "",
  ]
    .join("\n")
    .toLowerCase();
  return haystack.includes(needle);
}

/**
 * LocalStorage-backed async repository implementing the exact REST-style
 * interface (list, get, save, delete) expected by a future FastAPI backend.
 */
export const investigationRepository: InvestigationRepository = {
  async list(query?: InvestigationListQuery): Promise<Investigation[]> {
    const { items } = readAndMigrateInvestigations();
    return items
      .filter((item) => matchesQuery(item, query))
      .sort(
        (a, b) =>
          Date.parse(b.updatedAt || b.createdAt) -
          Date.parse(a.updatedAt || a.createdAt)
      );
  },

  async get(id: string): Promise<Investigation | null> {
    const { items } = readAndMigrateInvestigations();
    const found = items.find((item) => item.id === id);
    return found ?? null;
  },

  async save(investigation: Investigation): Promise<Investigation> {
    return upsertInvestigation(investigation);
  },

  async delete(id: string): Promise<void> {
    const { items } = readAndMigrateInvestigations();
    const filtered = items.filter((item) => item.id !== id);
    saveInvestigations(filtered);
  },
};
