export type AssistanceLevel = 1 | 2 | 3 | 4;
// 1: Diagnostic Probes, 2: Conceptual Hint, 3: Pseudocode/Skeleton, 4: Reveal Solution

export type Path = "conversation" | "hypothesis_board";

export type Lang = "en" | "ar";

export interface CaseDetails {
  code: string;
  error: string;
  expectedBehavior: string;
  actualOutput?: string;
  sampleInput?: string;
}

export type HypothesisStatus =
  | "proposed"
  | "investigating"
  | "rejected"
  | "user_added";

export interface Hypothesis {
  id: string;
  title: string;
  explanation: string;
  evidence: string[];
  probe: string;
  status: HypothesisStatus;
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  level: AssistanceLevel;
  path: Path;
  createdAt: string;
  isDemo: boolean;
}

export type FeedbackType =
  | "worked"
  | "still_failing"
  | "different_result"
  | "need_more_help";

export interface FeedbackEvent {
  id: string;
  type: FeedbackType;
  note?: string;
  newOutput?: string;
  createdAt: string;
}

export interface ClosureSummary {
  reportedProblem: string;
  confirmedCause: string; // Confirmed cause or "unresolved"
  evidence: string;
  appliedFix: string;
  verificationResult: string;
  reflection?: string;
}

export type InvestigationStatus =
  | "open"
  | "resolved"
  | "unresolved"
  | "handed_over";

export interface Investigation {
  id: string;
  schemaVersion: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: InvestigationStatus;
  language: Lang;
  case: CaseDetails;
  path?: Path;
  level: AssistanceLevel;
  turns: ChatTurn[];
  hypotheses: Hypothesis[];
  selectedHypothesisId?: string;
  feedback: FeedbackEvent[];
  closure?: ClosureSummary;
}

export interface DebugHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface DebugRequest {
  code: string;
  error: string;
  expected_behavior: string;
  level: AssistanceLevel;
  path: Path;
  language: Lang;
  history: DebugHistoryItem[];
  message?: string;
  selected_hypothesis_id?: string;
  rejected_hypothesis_ids?: string[];
  user_hypothesis?: string;
}

export type DebugResponseStatus =
  | "ok"
  | "needs_clarification"
  | "insufficient_evidence"
  | "handover_recommended";

export interface DebugResponse {
  status: DebugResponseStatus;
  provider: string;
  is_demo: boolean;
  level_applied: AssistanceLevel;
  message: string;
  next_question?: string;
  missing_info?: string[];
  hypotheses?: Hypothesis[];
  suggested_actions?: string[];
}
