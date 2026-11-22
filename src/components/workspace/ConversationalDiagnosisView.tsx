import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Bot,
  Info,
  LayoutList,
  Lightbulb,
  Loader2,
  MessageSquareMore,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { CodeBlock, DemoBadge } from "@/src/components";
import { useI18n } from "@/src/i18n";
import {
  getDebugFallbackReason,
  submitDebugTurnWithRetry,
  type DebugFallbackReason,
} from "@/src/services/api";
import type {
  AssistanceLevel,
  ChatTurn,
  DebugResponse,
  Investigation,
} from "@/src/types";
import {
  InsufficientEvidenceNotice,
  TimeoutFallbackBanner,
} from "./FallbackNotice";

export interface FeedbackReopenTrigger {
  id: string;
  type: "still_failing" | "different_result";
  newOutput: string;
  note?: string;
}

interface ConversationalDiagnosisViewProps {
  investigation: Investigation;
  onAppendTurns: (newTurns: ChatTurn[]) => void;
  onRequestLevelChange: (nextLevel: AssistanceLevel) => void;
  onSwitchToBoard: () => void;
  onOpenHandover: () => void;
  simulateTimeoutNonce?: number;
  feedbackReopenTrigger?: FeedbackReopenTrigger | null;
}

function createTurnId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `turn_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function renderFormattedContent(content: string) {
  const parts = content.split(/(```python[\s\S]*?```)/g);
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith("```python")) {
          const codeBody = part
            .replace(/^```python\r?\n?/, "")
            .replace(/\r?\n?```$/, "");
          return (
            <CodeBlock
              key={index}
              code={codeBody}
              variant="code"
              showLineNumbers={false}
            />
          );
        }
        const trimmed = part.trim();
        if (!trimmed) {
          return null;
        }
        return (
          <p
            key={index}
            className="whitespace-pre-line text-sm leading-relaxed"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function ConversationalDiagnosisView({
  investigation,
  onAppendTurns,
  onRequestLevelChange,
  onSwitchToBoard,
  onOpenHandover,
  simulateTimeoutNonce = 0,
  feedbackReopenTrigger = null,
}: ConversationalDiagnosisViewProps) {
  const { dir, lang, t } = useI18n();
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fallbackReason, setFallbackReason] =
    useState<DebugFallbackReason | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    message?: string;
    appendStudentTurn?: boolean;
    offerTarget?: 2 | 3 | null;
  } | null>(null);
  const [clarificationItems, setClarificationItems] = useState<string[]>([]);
  const [insufficientItems, setInsufficientItems] = useState<string[] | null>(
    null
  );
  const [levelOffer, setLevelOffer] = useState<2 | 3 | null>(null);

  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const initialRequestedRef = useRef<string | null>(null);
  const lastTimeoutNonceRef = useRef(simulateTimeoutNonce);
  const lastFeedbackTriggerIdRef = useRef<string | null>(
    feedbackReopenTrigger?.id ?? null
  );

  const conversationTurns = useMemo(
    () =>
      investigation.turns.filter(
        (turn) => turn.path === "conversation" || turn.role === "system"
      ),
    [investigation.turns]
  );

  const assistantTurns = useMemo(
    () =>
      investigation.turns.filter(
        (turn) => turn.role === "assistant" && turn.path === "conversation"
      ),
    [investigation.turns]
  );

  const lastAssistantTurn =
    assistantTurns.length > 0
      ? assistantTurns[assistantTurns.length - 1]
      : undefined;

  const getLevelName = (level: AssistanceLevel): string => {
    switch (level) {
      case 1:
        return t.workspace.level1Name;
      case 2:
        return t.workspace.level2Name;
      case 3:
        return t.workspace.level3Name;
      case 4:
        return t.workspace.level4Name;
    }
  };

  const formatTimestamp = (iso: string): string => {
    try {
      return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  const requestMentorTurn = useCallback(
    async (
      studentMessage?: string,
      options?: {
        appendStudentTurn?: boolean;
        offerTarget?: 2 | 3 | null;
        simulateTimeout?: boolean;
      }
    ) => {
      setIsLoading(true);
      setIsRetrying(false);
      setFallbackReason(null);
      setErrorMessage(null);
      setLastFailedRequest({
        message: studentMessage,
        appendStudentTurn: options?.appendStudentTurn,
        offerTarget: options?.offerTarget,
      });

      const historyPayload = investigation.turns
        .filter(
          (turn): turn is ChatTurn & { role: "user" | "assistant" } =>
            turn.role === "user" || turn.role === "assistant"
        )
        .map((turn) => ({
          role: turn.role,
          content: turn.content,
        }));

      const nowUser = new Date().toISOString();
      const pendingTurns: ChatTurn[] = [];

      if (options?.appendStudentTurn && studentMessage?.trim()) {
        const userTurn: ChatTurn = {
          id: createTurnId(),
          role: "user",
          content: studentMessage.trim(),
          level: investigation.level,
          path: "conversation",
          createdAt: nowUser,
          isDemo: false,
        };
        pendingTurns.push(userTurn);
        historyPayload.push({ role: "user", content: userTurn.content });
      }

      try {
        const response: DebugResponse = await submitDebugTurnWithRetry(
          {
            code: investigation.case.code,
            error: investigation.case.error,
            expected_behavior: investigation.case.expectedBehavior,
            level: investigation.level,
            path: "conversation",
            language: lang,
            history: historyPayload,
            message: studentMessage,
            selected_hypothesis_id: investigation.selectedHypothesisId,
            rejected_hypothesis_ids: investigation.hypotheses
              .filter((h) => h.status === "rejected")
              .map((h) => h.id),
          },
          {
            simulateTimeout: options?.simulateTimeout,
            onRetrying: () => setIsRetrying(true),
          }
        );

        const formattedParts = [response.message];
        if (response.next_question) {
          formattedParts.push(
            `${t.conversation.focusedQuestionLabel}: ${response.next_question}`
          );
        }

        const assistantTurn: ChatTurn = {
          id: createTurnId(),
          role: "assistant",
          content: formattedParts.join("\n\n"),
          level: response.level_applied,
          path: "conversation",
          createdAt: new Date().toISOString(),
          isDemo: response.is_demo,
        };

        setClarificationItems(
          response.status === "needs_clarification" && response.missing_info
            ? response.missing_info
            : []
        );

        setInsufficientItems(
          response.status === "insufficient_evidence"
            ? response.missing_info ?? []
            : null
        );

        if (options?.offerTarget) {
          setLevelOffer(options.offerTarget);
        }

        onAppendTurns([...pendingTurns, assistantTurn]);
        if (options?.appendStudentTurn) {
          setReplyText("");
        }
      } catch (err) {
        const mappedReason = getDebugFallbackReason(err);
        if (mappedReason) {
          setFallbackReason(mappedReason);
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : t.conversation.errorTitle
          );
        }
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    },
    [
      investigation,
      lang,
      onAppendTurns,
      t.conversation.errorTitle,
      t.conversation.focusedQuestionLabel,
    ]
  );

  // Trigger opening mentor step automatically once when entering Conversational Diagnosis
  useEffect(() => {
    if (
      assistantTurns.length === 0 &&
      !isLoading &&
      !errorMessage &&
      !fallbackReason &&
      initialRequestedRef.current !== investigation.id
    ) {
      initialRequestedRef.current = investigation.id;
      void requestMentorTurn(undefined, { appendStudentTurn: false });
    }
  }, [
    assistantTurns.length,
    errorMessage,
    fallbackReason,
    investigation.id,
    isLoading,
    requestMentorTurn,
  ]);

  // Respond to mock-mode timeout simulation trigger
  useEffect(() => {
    if (simulateTimeoutNonce > lastTimeoutNonceRef.current) {
      lastTimeoutNonceRef.current = simulateTimeoutNonce;
      void requestMentorTurn(undefined, {
        appendStudentTurn: false,
        simulateTimeout: true,
      });
    }
  }, [requestMentorTurn, simulateTimeoutNonce]);

  // Respond when student submits "Still failing" or "Different result" with new output
  useEffect(() => {
    if (
      feedbackReopenTrigger &&
      feedbackReopenTrigger.id !== lastFeedbackTriggerIdRef.current
    ) {
      lastFeedbackTriggerIdRef.current = feedbackReopenTrigger.id;
      const taggedMessage = `[feedback:${feedbackReopenTrigger.type}] ${feedbackReopenTrigger.newOutput}`;
      void requestMentorTurn(taggedMessage, { appendStudentTurn: false });
    }
  }, [feedbackReopenTrigger, requestMentorTurn]);

  const handleSubmitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || isLoading) {
      return;
    }
    setLevelOffer(null);
    void requestMentorTurn(trimmed, { appendStudentTurn: true });
  };

  const handleQuickAnswer = () => {
    const trimmed = replyText.trim();
    if (trimmed && !isLoading) {
      setLevelOffer(null);
      void requestMentorTurn(trimmed, { appendStudentTurn: true });
      return;
    }
    replyInputRef.current?.focus();
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    replyInputRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
    });
  };

  const handleQuickHint = () => {
    if (isLoading) {
      return;
    }
    // Never changes the assistance level automatically; offers Level 2 when at Level 1
    const offerTarget = investigation.level === 1 ? 2 : null;
    void requestMentorTurn(t.conversation.internalHintPrompt, {
      appendStudentTurn: true,
      offerTarget,
    });
  };

  const handleQuickMoreDetail = () => {
    if (isLoading) {
      return;
    }
    // Never changes the assistance level automatically; offers next hint/skeleton level when applicable
    const offerTarget =
      investigation.level === 1 ? 2 : investigation.level === 2 ? 3 : null;
    void requestMentorTurn(t.conversation.internalMoreDetailPrompt, {
      appendStudentTurn: true,
      offerTarget,
    });
  };

  const handleAcceptLevelOffer = () => {
    if (!levelOffer) {
      return;
    }
    const target = levelOffer;
    setLevelOffer(null);
    onRequestLevelChange(target);
  };

  const levelChangedSinceLastAssistant =
    Boolean(lastAssistantTurn) &&
    lastAssistantTurn?.level !== investigation.level;

  return (
    <section
      aria-labelledby="conversation-view-heading"
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
            <MessageSquareMore className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="conversation-view-heading"
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--dd-text)" }}
            >
              {t.conversation.title}
            </h2>
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: "var(--dd-text-muted)" }}
            >
              {t.conversation.subtitle}
            </p>
          </div>
        </div>

        {levelChangedSinceLastAssistant ? (
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              void requestMentorTurn(undefined, { appendStudentTurn: false })
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--dd-accent-soft)",
              borderColor: "var(--dd-info-border)",
              color: "var(--dd-accent-text)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {t.conversation.askAtCurrentLevelBtn.replace(
                "{level}",
                String(investigation.level)
              )}
            </span>
          </button>
        ) : null}
      </div>

      {/* Chat Stream */}
      <div aria-live="polite" className="mt-5 space-y-4">
        {conversationTurns.length === 0 && !isLoading && !errorMessage ? (
          <div
            className="rounded-lg border p-5 text-center"
            style={{
              backgroundColor: "var(--dd-bg-subtle)",
              borderColor: "var(--dd-border-subtle)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--dd-text-secondary)" }}>
              {t.conversation.emptyPrompt}
            </p>
            <button
              type="button"
              onClick={() =>
                void requestMentorTurn(undefined, { appendStudentTurn: false })
              }
              className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              <span>{t.conversation.startDiagnosisBtn}</span>
            </button>
          </div>
        ) : null}

        {conversationTurns.map((turn) => {
          if (turn.role === "system") {
            return (
              <div
                key={turn.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-xs"
                style={{
                  backgroundColor: "var(--dd-bg-subtle)",
                  borderColor: "var(--dd-border-subtle)",
                  color: "var(--dd-text-muted)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{turn.content}</span>
                </div>
                <span className="tabular-nums shrink-0">
                  {formatTimestamp(turn.createdAt)}
                </span>
              </div>
            );
          }

          if (turn.role === "user") {
            return (
              <div
                key={turn.id}
                className="rounded-xl border p-4 ms-0 sm:ms-8 dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-accent-soft)",
                  borderColor: "var(--dd-info-border)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: "var(--dd-accent-text)" }}
                  >
                    <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.conversation.studentRoleLabel}</span>
                  </span>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "var(--dd-text-muted)" }}
                  >
                    {formatTimestamp(turn.createdAt)}
                  </span>
                </div>
                <p
                  className="mt-2 whitespace-pre-line text-sm leading-relaxed"
                  style={{ color: "var(--dd-text)" }}
                >
                  {turn.content}
                </p>
              </div>
            );
          }

          // Assistant turn — ALWAYS displays the visible Demo response badge when isDemo is true
          return (
            <article
              key={turn.id}
              className="rounded-xl border p-4 sm:p-5 me-0 sm:me-6 dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-bg-subtle)",
                borderColor: "var(--dd-border)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold"
                    style={{ color: "var(--dd-text)" }}
                  >
                    <Bot
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--dd-accent-text)" }}
                      aria-hidden="true"
                    />
                    <span>{t.conversation.mentorRoleLabel}</span>
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--dd-text-muted)" }}
                  >
                    · {t.workspace.levelPrefix} {turn.level} (
                    {getLevelName(turn.level)})
                  </span>
                </div>

                <span
                  className="text-xs tabular-nums"
                  style={{ color: "var(--dd-text-muted)" }}
                >
                  {formatTimestamp(turn.createdAt)}
                </span>
              </div>

              <div className="mt-2.5">
                <DemoBadge isDemo={turn.isDemo} />
              </div>

              <div className="mt-3">{renderFormattedContent(turn.content)}</div>
            </article>
          );
        })}

        {/* Missing info / clarification prompt */}
        {clarificationItems.length > 0 ? (
          <div
            className="rounded-lg border p-3.5 text-xs"
            style={{
              backgroundColor: "var(--dd-demo-bg)",
              borderColor: "var(--dd-demo-border)",
              color: "var(--dd-demo-text)",
            }}
          >
            <p className="font-semibold">{t.conversation.clarificationHeading}:</p>
            <ul className="mt-1.5 list-disc space-y-1 ps-5">
              {clarificationItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Insufficient evidence notice (states known & unknown, no guessing, recommends handover) */}
        {insufficientItems ? (
          <InsufficientEvidenceNotice
            investigation={investigation}
            missingInfo={insufficientItems}
            onOpenHandover={onOpenHandover}
          />
        ) : null}

        {/* Loading / Retrying State */}
        {isLoading ? (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm"
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
              {isRetrying ? t.fallback.retryingNotice : t.conversation.loading}
            </span>
          </div>
        ) : null}

        {/* Fallback Banner for Timeout / 401 / 422 / 502 */}
        {fallbackReason ? (
          <TimeoutFallbackBanner
            reason={fallbackReason}
            onTryAgain={() =>
              void requestMentorTurn(lastFailedRequest?.message, {
                appendStudentTurn: lastFailedRequest?.appendStudentTurn,
                offerTarget: lastFailedRequest?.offerTarget,
                simulateTimeout: false,
              })
            }
            onOpenHandover={onOpenHandover}
          />
        ) : null}

        {/* Error State */}
        {errorMessage ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
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
                <p className="font-semibold">{t.conversation.errorTitle}</p>
                <p className="mt-0.5 text-xs">{errorMessage}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void requestMentorTurn(lastFailedRequest?.message, {
                  appendStudentTurn: lastFailedRequest?.appendStudentTurn,
                  offerTarget: lastFailedRequest?.offerTarget,
                  simulateTimeout: false,
                })
              }
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-danger-border)",
                color: "var(--dd-danger-text)",
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.conversation.retryButton}</span>
            </button>
          </div>
        ) : null}

        {/* Optional Level Switch Offer (never auto-switches!) */}
        {levelOffer ? (
          <div
            role="region"
            aria-label={t.conversation.offerAcceptBtn.replace(
              "{level}",
              String(levelOffer)
            )}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 text-sm dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-info-bg)",
              borderColor: "var(--dd-info-border)",
              color: "var(--dd-info-text)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-medium">
                {levelOffer === 2
                  ? t.conversation.offerLevel2Body
                  : t.conversation.offerLevel3Body}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptLevelOffer}
                className="inline-flex min-h-[38px] items-center rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
                style={{
                  backgroundColor: "var(--dd-accent)",
                  color: "var(--dd-accent-on)",
                }}
              >
                {t.conversation.offerAcceptBtn.replace(
                  "{level}",
                  String(levelOffer)
                )}
              </button>

              <button
                type="button"
                onClick={() => setLevelOffer(null)}
                className="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-surface)",
                  borderColor: "var(--dd-info-border)",
                  color: "var(--dd-text)",
                }}
              >
                {t.conversation.offerIgnoreBtn.replace(
                  "{level}",
                  String(investigation.level)
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Contextual Quick Replies */}
      <div
        className="mt-5 border-t pt-4"
        style={{ borderColor: "var(--dd-border-subtle)" }}
      >
        <p
          className="text-xs font-semibold"
          style={{ color: "var(--dd-text-muted)" }}
        >
          {t.conversation.quickRepliesLabel}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleQuickAnswer}
            className="inline-flex min-h-[40px] items-center rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          >
            {t.conversation.quickReplyAnswer}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleQuickHint}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          >
            <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.conversation.quickReplyHint}</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleQuickMoreDetail}
            className="inline-flex min-h-[40px] items-center rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          >
            {t.conversation.quickReplyMoreDetail}
          </button>

          <button
            type="button"
            onClick={onSwitchToBoard}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer dd-theme-transition hover:opacity-90"
            style={{
              backgroundColor: "var(--dd-bg-subtle)",
              borderColor: "var(--dd-border-subtle)",
              color: "var(--dd-accent-text)",
            }}
          >
            <LayoutList className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.conversation.quickReplySwitchBoard}</span>
          </button>
        </div>

        {/* Student Reply Form */}
        <form onSubmit={handleSubmitReply} className="mt-4 space-y-3">
          <label
            htmlFor="conversation-reply-input"
            className="block text-xs font-semibold"
            style={{ color: "var(--dd-text)" }}
          >
            {t.conversation.replyLabel}
          </label>

          <textarea
            ref={replyInputRef}
            id="conversation-reply-input"
            dir={dir}
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t.conversation.replyPlaceholder}
            className="w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-bg)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || replyText.trim().length === 0}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              <Send
                className="h-4 w-4 shrink-0 rtl:-scale-x-100"
                aria-hidden="true"
              />
              <span>{t.conversation.sendReply}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
