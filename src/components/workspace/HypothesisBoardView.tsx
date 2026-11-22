import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  FlaskConical,
  HelpCircle,
  LayoutList,
  Loader2,
  MessageSquareMore,
  Plus,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { DemoBadge } from "@/src/components";
import { useI18n } from "@/src/i18n";
import {
  getDebugFallbackReason,
  submitDebugTurnWithRetry,
  type DebugFallbackReason,
} from "@/src/services/api";
import type {
  DebugResponse,
  Hypothesis,
  Investigation,
} from "@/src/types";
import type { FeedbackReopenTrigger } from "./ConversationalDiagnosisView";
import {
  InsufficientEvidenceNotice,
  TimeoutFallbackBanner,
} from "./FallbackNotice";

interface HypothesisBoardViewProps {
  investigation: Investigation;
  onUpdateHypotheses: (
    nextHypotheses: Hypothesis[],
    nextSelectedId: string | undefined
  ) => void;
  onSwitchToConversation: () => void;
  onOpenHandover: () => void;
  simulateTimeoutNonce?: number;
  feedbackReopenTrigger?: FeedbackReopenTrigger | null;
}

function createHypothesisId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `hyp_user_${crypto.randomUUID().slice(0, 6)}`;
  }
  return `hyp_user_${Date.now().toString(36)}`;
}

function looksLikeCodeOrError(text: string): boolean {
  return (
    /[()[\]{}=:_.]/.test(text) ||
    text.includes("Error") ||
    text.includes("Exception") ||
    text.includes("line ")
  );
}

export function HypothesisBoardView({
  investigation,
  onUpdateHypotheses,
  onSwitchToConversation,
  onOpenHandover,
  simulateTimeoutNonce = 0,
  feedbackReopenTrigger = null,
}: HypothesisBoardViewProps) {
  const { dir, lang, t } = useI18n();

  const [boardLoading, setBoardLoading] = useState(false);
  const [boardRetrying, setBoardRetrying] = useState(false);
  const [boardFallbackReason, setBoardFallbackReason] =
    useState<DebugFallbackReason | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [boardResponse, setBoardResponse] = useState<DebugResponse | null>(
    null
  );

  const [probeLoading, setProbeLoading] = useState(false);
  const [probeRetrying, setProbeRetrying] = useState(false);
  const [probeFallbackReason, setProbeFallbackReason] =
    useState<DebugFallbackReason | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [probeResponse, setProbeResponse] = useState<DebugResponse | null>(
    null
  );

  const [feedbackFollowUp, setFeedbackFollowUp] =
    useState<DebugResponse | null>(null);

  const [rejectedExpanded, setRejectedExpanded] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [newProbe, setNewProbe] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  const initialFetchRef = useRef<string | null>(null);
  const lastFetchedProbeKeyRef = useRef<string | null>(null);
  const lastTimeoutNonceRef = useRef(simulateTimeoutNonce);
  const lastFeedbackTriggerIdRef = useRef<string | null>(
    feedbackReopenTrigger?.id ?? null
  );

  const activeHypotheses = useMemo(
    () =>
      investigation.hypotheses.filter((h) => h.status !== "rejected").slice(0, 6),
    [investigation.hypotheses]
  );

  const rejectedHypotheses = useMemo(
    () => investigation.hypotheses.filter((h) => h.status === "rejected"),
    [investigation.hypotheses]
  );

  const selectedHypothesis = useMemo(
    () =>
      investigation.selectedHypothesisId
        ? investigation.hypotheses.find(
            (h) => h.id === investigation.selectedHypothesisId
          )
        : undefined,
    [investigation.hypotheses, investigation.selectedHypothesisId]
  );

  const fetchBoardHypotheses = useCallback(
    async (options?: {
      simulateTimeout?: boolean;
      message?: string;
      isFeedbackFollowUp?: boolean;
    }) => {
      setBoardLoading(true);
      setBoardRetrying(false);
      setBoardFallbackReason(null);
      setBoardError(null);

      try {
        const response = await submitDebugTurnWithRetry(
          {
            code: investigation.case.code,
            error: investigation.case.error,
            expected_behavior: investigation.case.expectedBehavior,
            level: investigation.level,
            path: "hypothesis_board",
            language: lang,
            history: [],
            message: options?.message,
            selected_hypothesis_id: investigation.selectedHypothesisId,
            rejected_hypothesis_ids: investigation.hypotheses
              .filter((h) => h.status === "rejected")
              .map((h) => h.id),
          },
          {
            simulateTimeout: options?.simulateTimeout,
            onRetrying: () => setBoardRetrying(true),
          }
        );

        setBoardResponse(response);
        if (options?.isFeedbackFollowUp) {
          setFeedbackFollowUp(response);
        }

        const incoming = (response.hypotheses ?? []).slice(0, 3);
        if (incoming.length > 0 || investigation.hypotheses.length === 0) {
          const existingMap = new Map(
            investigation.hypotheses.map((h) => [h.id, h])
          );
          const mergedIncoming = incoming.map((item) => {
            const existing = existingMap.get(item.id);
            if (!existing) {
              return item;
            }
            return {
              ...item,
              status: existing.status,
            };
          });
          const userAdded = investigation.hypotheses.filter(
            (h) =>
              h.id.startsWith("hyp_user_") ||
              (h.status === "user_added" &&
                !mergedIncoming.some((m) => m.id === h.id))
          );
          const combined = [...mergedIncoming, ...userAdded];
          onUpdateHypotheses(combined, investigation.selectedHypothesisId);
        }
      } catch (err) {
        const mappedReason = getDebugFallbackReason(err);
        if (mappedReason) {
          setBoardFallbackReason(mappedReason);
        } else {
          setBoardError(
            err instanceof Error ? err.message : t.hypothesisBoard.errorTitle
          );
        }
      } finally {
        setBoardLoading(false);
        setBoardRetrying(false);
      }
    },
    [
      investigation.case.code,
      investigation.case.error,
      investigation.case.expectedBehavior,
      investigation.hypotheses,
      investigation.level,
      investigation.selectedHypothesisId,
      lang,
      onUpdateHypotheses,
      t.hypothesisBoard.errorTitle,
    ]
  );

  const fetchSelectedProbeGuidance = useCallback(
    async (target: Hypothesis, options?: { simulateTimeout?: boolean }) => {
      setProbeLoading(true);
      setProbeRetrying(false);
      setProbeFallbackReason(null);
      setProbeError(null);

      try {
        const isUserAdded =
          target.id.startsWith("hyp_user_") || target.status === "user_added";

        const response = await submitDebugTurnWithRetry(
          {
            code: investigation.case.code,
            error: investigation.case.error,
            expected_behavior: investigation.case.expectedBehavior,
            level: investigation.level,
            path: "hypothesis_board",
            language: lang,
            history: [],
            selected_hypothesis_id: isUserAdded ? undefined : target.id,
            user_hypothesis: isUserAdded ? target.title : undefined,
            rejected_hypothesis_ids: investigation.hypotheses
              .filter((h) => h.status === "rejected")
              .map((h) => h.id),
          },
          {
            simulateTimeout: options?.simulateTimeout,
            onRetrying: () => setProbeRetrying(true),
          }
        );

        setProbeResponse(response);
      } catch (err) {
        const mappedReason = getDebugFallbackReason(err);
        if (mappedReason) {
          setProbeFallbackReason(mappedReason);
        } else {
          setProbeError(
            err instanceof Error
              ? err.message
              : t.hypothesisBoard.selectedProbeError
          );
        }
      } finally {
        setProbeLoading(false);
        setProbeRetrying(false);
      }
    },
    [
      investigation.case.code,
      investigation.case.error,
      investigation.case.expectedBehavior,
      investigation.hypotheses,
      investigation.level,
      lang,
      t.hypothesisBoard.selectedProbeError,
    ]
  );

  // Initial board load when entering Hypothesis Board with no hypotheses yet
  useEffect(() => {
    if (
      investigation.hypotheses.length === 0 &&
      !boardLoading &&
      !boardError &&
      !boardFallbackReason &&
      !boardResponse &&
      initialFetchRef.current !== investigation.id
    ) {
      initialFetchRef.current = investigation.id;
      void fetchBoardHypotheses();
    }
  }, [
    boardError,
    boardFallbackReason,
    boardLoading,
    boardResponse,
    fetchBoardHypotheses,
    investigation.hypotheses.length,
    investigation.id,
  ]);

  // Keep probe guidance in sync when a hypothesis is selected or level/language changes
  useEffect(() => {
    if (!selectedHypothesis) {
      setProbeResponse(null);
      setProbeError(null);
      setProbeFallbackReason(null);
      lastFetchedProbeKeyRef.current = null;
      return;
    }
    const probeKey = `${selectedHypothesis.id}:${investigation.level}:${lang}`;
    if (lastFetchedProbeKeyRef.current !== probeKey) {
      lastFetchedProbeKeyRef.current = probeKey;
      void fetchSelectedProbeGuidance(selectedHypothesis);
    }
  }, [
    fetchSelectedProbeGuidance,
    investigation.level,
    lang,
    selectedHypothesis,
  ]);

  // Respond to mock-mode timeout simulation trigger
  useEffect(() => {
    if (simulateTimeoutNonce > lastTimeoutNonceRef.current) {
      lastTimeoutNonceRef.current = simulateTimeoutNonce;
      void fetchBoardHypotheses({ simulateTimeout: true });
    }
  }, [fetchBoardHypotheses, simulateTimeoutNonce]);

  // Respond when student submits "Still failing" or "Different result" with new output
  useEffect(() => {
    if (
      feedbackReopenTrigger &&
      feedbackReopenTrigger.id !== lastFeedbackTriggerIdRef.current
    ) {
      lastFeedbackTriggerIdRef.current = feedbackReopenTrigger.id;
      void fetchBoardHypotheses({
        message: `[feedback:${feedbackReopenTrigger.type}] ${feedbackReopenTrigger.newOutput}`,
        isFeedbackFollowUp: true,
      });
    }
  }, [feedbackReopenTrigger, fetchBoardHypotheses]);

  const handleInvestigate = (hypothesis: Hypothesis) => {
    const updatedList = investigation.hypotheses.map((item) => {
      if (item.id === hypothesis.id) {
        return { ...item, status: "investigating" as const };
      }
      if (item.status === "investigating") {
        return {
          ...item,
          status: item.id.startsWith("hyp_user_")
            ? ("user_added" as const)
            : ("proposed" as const),
        };
      }
      return item;
    });

    onUpdateHypotheses(updatedList, hypothesis.id);
  };

  const handleReject = (hypothesisId: string) => {
    const updatedList = investigation.hypotheses.map((item) =>
      item.id === hypothesisId
        ? { ...item, status: "rejected" as const }
        : item
    );
    const nextSelected =
      investigation.selectedHypothesisId === hypothesisId
        ? undefined
        : investigation.selectedHypothesisId;
    onUpdateHypotheses(updatedList, nextSelected);
  };

  const handleRestore = (hypothesisId: string) => {
    const updatedList = investigation.hypotheses.map((item) =>
      item.id === hypothesisId
        ? {
            ...item,
            status: item.id.startsWith("hyp_user_")
              ? ("user_added" as const)
              : ("proposed" as const),
          }
        : item
    );
    onUpdateHypotheses(updatedList, investigation.selectedHypothesisId);
  };

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      setTitleError(t.hypothesisBoard.addTitleRequired);
      return;
    }

    const customCard: Hypothesis = {
      id: createHypothesisId(),
      title: trimmedTitle,
      explanation:
        newExplanation.trim() || t.hypothesisBoard.defaultUserExplanation,
      evidence: newEvidence.trim()
        ? [newEvidence.trim()]
        : [t.hypothesisBoard.defaultUserEvidence],
      probe: newProbe.trim() || t.hypothesisBoard.defaultUserProbe,
      status: "user_added",
    };

    onUpdateHypotheses(
      [...investigation.hypotheses, customCard],
      investigation.selectedHypothesisId
    );

    setNewTitle("");
    setNewExplanation("");
    setNewEvidence("");
    setNewProbe("");
    setTitleError(null);
    setAddFormOpen(false);
  };

  return (
    <section
      aria-labelledby="hypothesis-board-heading"
      className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"
        style={{ borderColor: "var(--dd-border-subtle)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: "var(--dd-accent-soft)",
              borderColor: "var(--dd-info-border)",
              color: "var(--dd-accent-text)",
            }}
          >
            <LayoutList className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <h2
              id="hypothesis-board-heading"
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--dd-text)" }}
            >
              {t.hypothesisBoard.title}
            </h2>
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: "var(--dd-text-muted)" }}
            >
              {t.hypothesisBoard.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={boardLoading}
            onClick={() => void fetchBoardHypotheses()}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 shrink-0 ${boardLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>
              {t.hypothesisBoard.refreshBoardBtn.replace(
                "{level}",
                String(investigation.level)
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAddFormOpen((open) => !open)}
            aria-expanded={addFormOpen}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
            style={{
              backgroundColor: "var(--dd-accent)",
              color: "var(--dd-accent-on)",
            }}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.hypothesisBoard.addMyHypothesisBtn}</span>
          </button>
        </div>
      </div>

      {/* Demo Badge when board response came from mock */}
      {boardResponse ? (
        <div className="mt-4">
          <DemoBadge isDemo={boardResponse.is_demo} />
        </div>
      ) : null}

      {/* Add My Hypothesis Form */}
      {addFormOpen ? (
        <form
          onSubmit={handleAddSubmit}
          noValidate
          className="mt-4 space-y-3.5 rounded-xl border p-4 sm:p-5 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-info-border)",
          }}
        >
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--dd-text)" }}
          >
            {t.hypothesisBoard.addFormTitle}
          </h3>

          <div>
            <label
              htmlFor="add-hyp-title"
              className="block text-xs font-semibold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.hypothesisBoard.addTitleLabel}
            </label>
            <input
              id="add-hyp-title"
              type="text"
              dir={dir}
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (titleError) {
                  setTitleError(null);
                }
              }}
              placeholder={t.hypothesisBoard.addTitlePlaceholder}
              aria-invalid={titleError ? "true" : undefined}
              aria-describedby={titleError ? "add-hyp-title-err" : undefined}
              className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: titleError
                  ? "var(--dd-danger-border)"
                  : "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            />
            {titleError ? (
              <p
                id="add-hyp-title-err"
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "var(--dd-danger-text)" }}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{titleError}</span>
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="add-hyp-explanation"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.hypothesisBoard.addExplanationLabel}
              </label>
              <input
                id="add-hyp-explanation"
                type="text"
                dir={dir}
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder={t.hypothesisBoard.addExplanationPlaceholder}
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-surface)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="add-hyp-evidence"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.hypothesisBoard.addEvidenceLabel}
              </label>
              <input
                id="add-hyp-evidence"
                type="text"
                dir="ltr"
                value={newEvidence}
                onChange={(e) => setNewEvidence(e.target.value)}
                placeholder={t.hypothesisBoard.addEvidencePlaceholder}
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-left font-mono text-xs dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-code-bg)",
                  borderColor: "var(--dd-code-border)",
                  color: "var(--dd-code-text)",
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="add-hyp-probe"
              className="block text-xs font-semibold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.hypothesisBoard.addProbeLabel}
            </label>
            <input
              id="add-hyp-probe"
              type="text"
              dir={dir}
              value={newProbe}
              onChange={(e) => setNewProbe(e.target.value)}
              placeholder={t.hypothesisBoard.addProbePlaceholder}
              className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              className="inline-flex min-h-[40px] items-center rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              {t.hypothesisBoard.addSubmitBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddFormOpen(false);
                setTitleError(null);
              }}
              className="inline-flex min-h-[40px] items-center rounded-lg border px-4 py-2 text-xs font-medium cursor-pointer dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text-secondary)",
              }}
            >
              {t.hypothesisBoard.addCancelBtn}
            </button>
          </div>
        </form>
      ) : null}

      {/* Loading & Error States for Board */}
      {boardLoading ? (
        <div
          role="status"
          className="mt-4 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-border-subtle)",
            color: "var(--dd-text-secondary)",
          }}
        >
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            style={{ color: "var(--dd-accent-text)" }}
            aria-hidden="true"
          />
          <span>
            {boardRetrying
              ? t.fallback.retryingNotice
              : t.hypothesisBoard.loading}
          </span>
        </div>
      ) : null}

      {boardFallbackReason ? (
        <div className="mt-4">
          <TimeoutFallbackBanner
            reason={boardFallbackReason}
            onTryAgain={() => void fetchBoardHypotheses()}
            onOpenHandover={onOpenHandover}
          />
        </div>
      ) : null}

      {boardError ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--dd-danger-bg)",
            borderColor: "var(--dd-danger-border)",
            color: "var(--dd-danger-text)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">{t.hypothesisBoard.errorTitle}</p>
              <p className="mt-0.5 text-xs">{boardError}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void fetchBoardHypotheses()}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-danger-border)",
              color: "var(--dd-danger-text)",
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.hypothesisBoard.retryButton}</span>
          </button>
        </div>
      ) : null}

      {/* Feedback Reopen Guidance Card when student logged Still Failing / Different Result */}
      {feedbackFollowUp &&
      feedbackFollowUp.status !== "insufficient_evidence" ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border p-4 sm:p-5 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-info-bg)",
            borderColor: "var(--dd-info-border)",
            color: "var(--dd-text)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="text-xs font-bold"
              style={{ color: "var(--dd-info-text)" }}
            >
              {t.feedback.title} · {t.workspace.levelPrefix}{" "}
              {feedbackFollowUp.level_applied}
            </span>
            <DemoBadge isDemo={feedbackFollowUp.is_demo} />
          </div>
          <p
            className="mt-2 whitespace-pre-line text-sm leading-relaxed"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {feedbackFollowUp.message}
          </p>
          {feedbackFollowUp.next_question ? (
            <p
              className="mt-2 text-sm font-semibold"
              style={{ color: "var(--dd-text)" }}
            >
              {feedbackFollowUp.next_question}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Insufficient Evidence Notice (never guesses, states known & unknown, recommends handover) */}
      {boardResponse?.status === "insufficient_evidence" ? (
        <div className="mt-4">
          <InsufficientEvidenceNotice
            investigation={investigation}
            missingInfo={boardResponse.missing_info}
            onOpenHandover={onOpenHandover}
          />
        </div>
      ) : null}

      {/* Clarifying Question when evidence is weak/missing */}
      {boardResponse?.status === "needs_clarification" &&
      activeHypotheses.length === 0 ? (
        <div
          className="mt-4 rounded-xl border p-5 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-demo-bg)",
            borderColor: "var(--dd-demo-border)",
            color: "var(--dd-demo-text)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-bold">
                {t.hypothesisBoard.clarificationTitle}
              </h3>
              <p className="mt-1 text-xs leading-relaxed">
                {t.hypothesisBoard.clarificationNote}
              </p>
              <p
                className="mt-2.5 text-sm leading-relaxed"
                style={{ color: "var(--dd-text)" }}
              >
                {boardResponse.message}
              </p>
              {boardResponse.next_question ? (
                <p
                  className="mt-2 text-sm font-semibold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {boardResponse.next_question}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Active Suspect Cards */}
      <div className="mt-5 space-y-4">
        {activeHypotheses.length === 0 &&
        !boardLoading &&
        !boardError &&
        !boardFallbackReason ? (
          boardResponse?.status !== "needs_clarification" &&
          boardResponse?.status !== "insufficient_evidence" ? (
            <p
              className="rounded-lg border p-4 text-sm"
              style={{
                backgroundColor: "var(--dd-bg-subtle)",
                borderColor: "var(--dd-border-subtle)",
                color: "var(--dd-text-muted)",
              }}
            >
              {t.hypothesisBoard.emptyBoardNote}
            </p>
          ) : null
        ) : (
          activeHypotheses.map((hypothesis) => {
            const isSelected =
              investigation.selectedHypothesisId === hypothesis.id;
            const isUserAdded =
              hypothesis.status === "user_added" ||
              hypothesis.id.startsWith("hyp_user_");

            return (
              <article
                key={hypothesis.id}
                className="rounded-xl border p-4 sm:p-5 dd-theme-transition"
                style={{
                  backgroundColor: isSelected
                    ? "var(--dd-bg-subtle)"
                    : "var(--dd-surface)",
                  borderColor: isSelected
                    ? "var(--dd-accent)"
                    : "var(--dd-border)",
                }}
              >
                {/* Permanent Unconfirmed Label + Active Direction Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: "var(--dd-demo-text)" }}
                    >
                      <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{t.hypothesisBoard.unconfirmedLabel}</span>
                    </span>

                    {isUserAdded ? (
                      <span style={{ color: "var(--dd-text-muted)" }}>
                        · {t.hypothesisBoard.userAddedLabel}
                      </span>
                    ) : null}
                  </div>

                  {isSelected ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: "var(--dd-accent-text)" }}
                    >
                      <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{t.hypothesisBoard.activeDirectionLabel}</span>
                    </span>
                  ) : null}
                </div>

                <h3
                  className="mt-2.5 text-base font-bold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {hypothesis.title}
                </h3>

                <p
                  className="mt-1.5 text-sm leading-relaxed"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {hypothesis.explanation}
                </p>

                {/* Quoted Supporting Evidence */}
                {hypothesis.evidence.length > 0 ? (
                  <div className="mt-3.5">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--dd-text-muted)" }}
                    >
                      {t.hypothesisBoard.evidenceLabel}
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {hypothesis.evidence.map((ev, idx) => {
                        const isCode = looksLikeCodeOrError(ev);
                        return (
                          <li key={idx}>
                            {isCode ? (
                              <code
                                dir="ltr"
                                className="block overflow-x-auto rounded border px-2.5 py-1.5 text-left font-mono text-xs"
                                style={{
                                  backgroundColor: "var(--dd-code-bg)",
                                  borderColor: "var(--dd-code-border)",
                                  color: "var(--dd-code-text)",
                                }}
                              >
                                {ev}
                              </code>
                            ) : (
                              <span
                                className="block rounded border px-2.5 py-1.5 text-xs"
                                style={{
                                  backgroundColor: "var(--dd-bg-subtle)",
                                  borderColor: "var(--dd-border-subtle)",
                                  color: "var(--dd-text-secondary)",
                                }}
                              >
                                {ev}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                {/* Targeted Diagnostic Probe */}
                <div
                  className="mt-3.5 rounded-lg border p-3"
                  style={{
                    backgroundColor: "var(--dd-bg-subtle)",
                    borderColor: "var(--dd-border-subtle)",
                  }}
                >
                  <p
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: "var(--dd-accent-text)" }}
                  >
                    <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.hypothesisBoard.probeLabel}</span>
                  </p>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--dd-text)" }}
                  >
                    {hypothesis.probe}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleInvestigate(hypothesis)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
                    style={{
                      backgroundColor: isSelected
                        ? "var(--dd-accent-soft)"
                        : "var(--dd-accent)",
                      border: isSelected
                        ? "1px solid var(--dd-info-border)"
                        : "1px solid transparent",
                      color: isSelected
                        ? "var(--dd-accent-text)"
                        : "var(--dd-accent-on)",
                    }}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {isSelected
                        ? t.hypothesisBoard.investigatingActiveBtn
                        : t.hypothesisBoard.investigateBtn}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(hypothesis.id)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                    style={{
                      backgroundColor: "var(--dd-surface-muted)",
                      borderColor: "var(--dd-border)",
                      color: "var(--dd-text-secondary)",
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.hypothesisBoard.rejectBtn}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Selected Hypothesis Probe Guidance at Current Level */}
      {selectedHypothesis ? (
        <div
          aria-live="polite"
          className="mt-6 rounded-xl border p-4 sm:p-5 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-info-border)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              className="flex items-center gap-2 text-sm font-bold"
              style={{ color: "var(--dd-text)" }}
            >
              <FlaskConical
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--dd-accent-text)" }}
                aria-hidden="true"
              />
              <span>
                {t.hypothesisBoard.selectedProbePanelTitle} ·{" "}
                {t.workspace.levelPrefix} {investigation.level}
              </span>
            </h3>
            {probeResponse ? <DemoBadge isDemo={probeResponse.is_demo} /> : null}
          </div>

          {probeLoading ? (
            <p
              className="mt-3 flex items-center gap-2 text-sm"
              style={{ color: "var(--dd-text-secondary)" }}
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>
                {probeRetrying
                  ? t.fallback.retryingNotice
                  : t.hypothesisBoard.selectedProbeLoading}
              </span>
            </p>
          ) : probeFallbackReason ? (
            <div className="mt-3">
              <TimeoutFallbackBanner
                reason={probeFallbackReason}
                onTryAgain={() =>
                  void fetchSelectedProbeGuidance(selectedHypothesis)
                }
                onOpenHandover={onOpenHandover}
              />
            </div>
          ) : probeError ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: "var(--dd-danger-text)" }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{probeError}</span>
              </p>
              <button
                type="button"
                onClick={() => void fetchSelectedProbeGuidance(selectedHypothesis)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: "var(--dd-surface)",
                  borderColor: "var(--dd-danger-border)",
                  color: "var(--dd-danger-text)",
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.hypothesisBoard.retryButton}</span>
              </button>
            </div>
          ) : probeResponse ? (
            <div className="mt-3 space-y-2">
              <p
                className="whitespace-pre-line text-sm leading-relaxed"
                style={{ color: "var(--dd-text-secondary)" }}
              >
                {probeResponse.message}
              </p>
              {probeResponse.next_question ? (
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--dd-text)" }}
                >
                  {probeResponse.next_question}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Rejected Hypotheses (Collapsed by default, restorable) */}
      {rejectedHypotheses.length > 0 ? (
        <div
          className="mt-6 rounded-xl border dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <button
            type="button"
            aria-expanded={rejectedExpanded}
            onClick={() => setRejectedExpanded((prev) => !prev)}
            className="flex w-full min-h-[44px] items-center justify-between gap-3 px-4 py-3 text-sm font-semibold cursor-pointer"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            <span>
              {t.hypothesisBoard.rejectedSectionTitle} (
              <span className="tabular-nums">{rejectedHypotheses.length}</span>)
            </span>
            {rejectedExpanded ? (
              <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
          </button>

          {rejectedExpanded ? (
            <ul
              className="space-y-2.5 border-t px-4 py-3.5"
              style={{ borderColor: "var(--dd-border-subtle)" }}
            >
              {rejectedHypotheses.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
                  style={{
                    backgroundColor: "var(--dd-surface)",
                    borderColor: "var(--dd-border-subtle)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--dd-text-secondary)" }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--dd-text-muted)" }}
                    >
                      {t.hypothesisBoard.unconfirmedLabel}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(item.id)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                    style={{
                      backgroundColor: "var(--dd-surface-muted)",
                      borderColor: "var(--dd-border)",
                      color: "var(--dd-text)",
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.hypothesisBoard.restoreBtn}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Contextual Path Switch Action */}
      <div
        className="mt-6 flex justify-end border-t pt-4"
        style={{ borderColor: "var(--dd-border-subtle)" }}
      >
        <button
          type="button"
          onClick={onSwitchToConversation}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium cursor-pointer dd-theme-transition hover:opacity-90"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-border-subtle)",
            color: "var(--dd-accent-text)",
          }}
        >
          <MessageSquareMore className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t.hypothesisBoard.switchToConversationBtn}</span>
        </button>
      </div>
    </section>
  );
}
