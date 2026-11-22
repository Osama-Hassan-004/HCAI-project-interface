import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock,
  FilePlus2,
  Flag,
  History,
  Info,
  Loader2,
  Share2,
  WifiOff,
} from "lucide-react";
import { HashLink } from "@/src/components";
import {
  AssistanceLevelPanel,
  CaseSummaryPanel,
  ClosurePanel,
  type ClosureStatusChoice,
  ConversationalDiagnosisView,
  FeedbackPanel,
  HandoverPanel,
  HypothesisBoardView,
  PathSelector,
  PersistentPathToggle,
  TimeoutFallbackBanner,
} from "@/src/components/workspace";
import type { FeedbackReopenTrigger } from "@/src/components/workspace/ConversationalDiagnosisView";
import { useI18n } from "@/src/i18n";
import {
  getActiveApiMode,
  getDebugFallbackReason,
  submitDebugTurnWithRetry,
  type DebugFallbackReason,
} from "@/src/services/api";
import { investigationRepository } from "@/src/storage";
import type {
  AssistanceLevel,
  ChatTurn,
  ClosureSummary,
  FeedbackEvent,
  Hypothesis,
  Investigation,
  Path,
} from "@/src/types";

interface InvestigationDetailScreenProps {
  id: string;
}

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function InvestigationDetailScreen({
  id,
}: InvestigationDetailScreenProps) {
  const { dir, lang, t } = useI18n();
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const isMockMode = getActiveApiMode() === "mock";

  const [investigation, setInvestigation] = useState<Investigation | undefined>(
    undefined
  );
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [level4ConfirmNonce, setLevel4ConfirmNonce] = useState(0);
  const [simulateTimeoutNonce, setSimulateTimeoutNonce] = useState(0);
  const [prePathLoading, setPrePathLoading] = useState(false);
  const [prePathRetrying, setPrePathRetrying] = useState(false);
  const [prePathFallbackReason, setPrePathFallbackReason] =
    useState<DebugFallbackReason | null>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const [feedbackReopenTrigger, setFeedbackReopenTrigger] =
    useState<FeedbackReopenTrigger | null>(null);
  const [closureOpen, setClosureOpen] = useState(false);
  const [closureDefaultStatus, setClosureDefaultStatus] =
    useState<ClosureStatusChoice>("resolved");

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCase(true);
    setClosureOpen(false);
    setPrePathFallbackReason(null);
    setPrePathRetrying(false);
    setPrePathLoading(false);
    setStatusAnnouncement("");
    setFeedbackReopenTrigger(null);

    void investigationRepository.get(id).then((loaded) => {
      if (cancelled) {
        return;
      }
      setInvestigation(loaded ?? undefined);
      setIsLoadingCase(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoadingCase) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border p-6 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border-subtle)",
            color: "var(--dd-text-secondary)",
          }}
        >
          <Loader2
            className="h-5 w-5 shrink-0 animate-spin"
            style={{ color: "var(--dd-accent-text)" }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{t.investigations.loading}</span>
        </div>
      </section>
    );
  }

  if (!investigation) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div
          className="rounded-xl border p-6 sm:p-8 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: "var(--dd-demo-bg)",
                borderColor: "var(--dd-demo-border)",
                color: "var(--dd-demo-text)",
              }}
            >
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h1
                className="text-xl font-bold tracking-tight sm:text-2xl"
                style={{ color: "var(--dd-text)" }}
              >
                {t.workspace.notFoundTitle}
              </h1>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--dd-text-secondary)" }}
              >
                {t.workspace.notFoundBody}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <HashLink
                  to="/new"
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap dd-theme-transition hover:opacity-95"
                  style={{
                    backgroundColor: "var(--dd-accent)",
                    color: "var(--dd-accent-on)",
                  }}
                >
                  <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.workspace.startNewAction}</span>
                </HashLink>

                <HashLink
                  to="/"
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap dd-theme-transition hover:opacity-90"
                  style={{
                    backgroundColor: "var(--dd-surface-muted)",
                    borderColor: "var(--dd-border)",
                    color: "var(--dd-text)",
                  }}
                >
                  <BackArrow className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.controls.backToHome}</span>
                </HashLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

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

  const getPathName = (path: Path): string =>
    path === "conversation"
      ? t.workspace.pathConversationTitle
      : t.workspace.pathHypothesisTitle;

  const getStatusMeta = () => {
    switch (investigation.status) {
      case "resolved":
        return {
          icon: CheckCircle2,
          label: t.workspace.statusResolved,
          bg: "var(--dd-success-bg)",
          border: "var(--dd-success-border)",
          text: "var(--dd-success-text)",
        };
      case "unresolved":
        return {
          icon: AlertCircle,
          label: t.workspace.statusUnresolved,
          bg: "var(--dd-demo-bg)",
          border: "var(--dd-demo-border)",
          text: "var(--dd-demo-text)",
        };
      case "handed_over":
        return {
          icon: Share2,
          label: t.workspace.statusHandedOver,
          bg: "var(--dd-info-bg)",
          border: "var(--dd-info-border)",
          text: "var(--dd-info-text)",
        };
      case "open":
      default:
        return {
          icon: CircleDot,
          label: t.workspace.statusOpen,
          bg: "var(--dd-info-bg)",
          border: "var(--dd-info-border)",
          text: "var(--dd-info-text)",
        };
    }
  };

  const handleSelectPath = (nextPath: Path) => {
    if (investigation.path === nextPath) {
      return;
    }
    setPrePathFallbackReason(null);
    setPrePathRetrying(false);
    const isInitialChoice = !investigation.path;
    const now = new Date().toISOString();
    const pathName = getPathName(nextPath);
    const noteText = isInitialChoice
      ? t.workspace.systemNoteChosePath.replace("{path}", pathName)
      : t.workspace.systemNoteSwitchedPath.replace("{path}", pathName);

    const systemTurn: ChatTurn = {
      id: createId("turn"),
      role: "system",
      content: noteText,
      level: investigation.level,
      path: nextPath,
      createdAt: now,
      isDemo: false,
    };

    const updated: Investigation = {
      ...investigation,
      path: nextPath,
      updatedAt: now,
      turns: [...investigation.turns, systemTurn],
    };

    void investigationRepository.save(updated);
    setInvestigation(updated);
    setStatusAnnouncement(noteText);
  };

  const handleSelectLevel = (nextLevel: AssistanceLevel) => {
    if (investigation.level === nextLevel) {
      return;
    }
    const now = new Date().toISOString();
    const noteText = t.workspace.systemNoteSwitchedLevel
      .replace("{level}", String(nextLevel))
      .replace("{levelName}", getLevelName(nextLevel));

    const systemTurn: ChatTurn = {
      id: createId("turn"),
      role: "system",
      content: noteText,
      level: nextLevel,
      path: investigation.path ?? "conversation",
      createdAt: now,
      isDemo: false,
    };

    const updated: Investigation = {
      ...investigation,
      level: nextLevel,
      updatedAt: now,
      turns: [...investigation.turns, systemTurn],
    };

    void investigationRepository.save(updated);
    setInvestigation(updated);
    setStatusAnnouncement(noteText);
  };

  // Any external request to raise level to 4 MUST still go through the Level 4 confirmation dialog
  const handleRequestLevelChange = (nextLevel: AssistanceLevel) => {
    if (nextLevel === 4 && investigation.level !== 4) {
      setLevel4ConfirmNonce((n) => n + 1);
      return;
    }
    handleSelectLevel(nextLevel);
  };

  const handleAppendTurns = (newTurns: ChatTurn[]) => {
    if (newTurns.length === 0) {
      return;
    }
    setInvestigation((prev) => {
      if (!prev) {
        return prev;
      }
      const updated: Investigation = {
        ...prev,
        updatedAt: new Date().toISOString(),
        turns: [...prev.turns, ...newTurns],
      };
      void investigationRepository.save(updated);
      return updated;
    });
  };

  const handleUpdateHypotheses = (
    nextHypotheses: Hypothesis[],
    nextSelectedId: string | undefined
  ) => {
    setInvestigation((prev) => {
      if (!prev) {
        return prev;
      }
      const updated: Investigation = {
        ...prev,
        updatedAt: new Date().toISOString(),
        hypotheses: nextHypotheses,
        selectedHypothesisId: nextSelectedId,
      };
      void investigationRepository.save(updated);
      return updated;
    });
  };

  const scrollToElement = (elementId: string) => {
    window.setTimeout(() => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(elementId)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleOpenHandover = () => {
    scrollToElement("human-handover-panel");
  };

  const handleOpenClosure = (
    defaultStatus: ClosureStatusChoice = "resolved"
  ) => {
    setClosureDefaultStatus(defaultStatus);
    setClosureOpen(true);
    scrollToElement("case-closure-panel");
  };

  const handleSimulateTimeout = async () => {
    if (!isMockMode) {
      return;
    }
    if (investigation.path) {
      setSimulateTimeoutNonce((n) => n + 1);
      return;
    }
    setPrePathLoading(true);
    setPrePathRetrying(false);
    setPrePathFallbackReason(null);
    try {
      await submitDebugTurnWithRetry(
        {
          code: investigation.case.code,
          error: investigation.case.error,
          expected_behavior: investigation.case.expectedBehavior,
          level: investigation.level,
          path: "conversation",
          language: lang,
          history: [],
        },
        {
          simulateTimeout: true,
          onRetrying: () => setPrePathRetrying(true),
        }
      );
    } catch (err) {
      const reason = getDebugFallbackReason(err);
      if (reason) {
        setPrePathFallbackReason(reason);
      }
    } finally {
      setPrePathLoading(false);
      setPrePathRetrying(false);
    }
  };

  const handleRecordWorked = () => {
    const now = new Date().toISOString();
    const feedbackItem: FeedbackEvent = {
      id: createId("fb"),
      type: "worked",
      createdAt: now,
    };
    const systemTurn: ChatTurn = {
      id: createId("turn"),
      role: "system",
      content: t.feedback.systemNoteWorked,
      level: investigation.level,
      path: investigation.path ?? "conversation",
      createdAt: now,
      isDemo: false,
    };

    const updated: Investigation = {
      ...investigation,
      updatedAt: now,
      feedback: [...investigation.feedback, feedbackItem],
      turns: [...investigation.turns, systemTurn],
    };

    void investigationRepository.save(updated);
    setInvestigation(updated);
  };

  const handleRecordNewOutput = (
    type: "still_failing" | "different_result",
    newOutput: string,
    note?: string
  ) => {
    const now = new Date().toISOString();
    const feedbackItem: FeedbackEvent = {
      id: createId("fb"),
      type,
      newOutput,
      ...(note ? { note } : {}),
      createdAt: now,
    };
    const typeLabel =
      type === "still_failing"
        ? t.feedback.btnStillFailing
        : t.feedback.btnDifferentResult;
    const systemTurn: ChatTurn = {
      id: createId("turn"),
      role: "system",
      content: t.feedback.systemNoteNewEvidence.replace("{type}", typeLabel),
      level: investigation.level,
      path: investigation.path ?? "conversation",
      createdAt: now,
      isDemo: false,
    };

    const updated: Investigation = {
      ...investigation,
      status: "open",
      updatedAt: now,
      case: {
        ...investigation.case,
        actualOutput: newOutput,
      },
      feedback: [...investigation.feedback, feedbackItem],
      turns: [...investigation.turns, systemTurn],
    };

    void investigationRepository.save(updated);
    setInvestigation(updated);
    setClosureOpen(false);
    setFeedbackReopenTrigger({
      id: feedbackItem.id,
      type,
      newOutput,
      note,
    });
  };

  const handleRecordNeedMoreHelp = () => {
    const now = new Date().toISOString();
    const feedbackItem: FeedbackEvent = {
      id: createId("fb"),
      type: "need_more_help",
      createdAt: now,
    };
    const systemTurn: ChatTurn = {
      id: createId("turn"),
      role: "system",
      content: t.feedback.systemNoteNeedHelp,
      level: investigation.level,
      path: investigation.path ?? "conversation",
      createdAt: now,
      isDemo: false,
    };

    const updated: Investigation = {
      ...investigation,
      updatedAt: now,
      feedback: [...investigation.feedback, feedbackItem],
      turns: [...investigation.turns, systemTurn],
    };

    void investigationRepository.save(updated);
    setInvestigation(updated);
  };

  const handleFinishCase = (
    status: ClosureStatusChoice,
    summary: ClosureSummary
  ) => {
    const now = new Date().toISOString();
    const statusLabel =
      status === "resolved"
        ? t.closure.statusOptionResolved
        : status === "handed_over"
          ? t.closure.statusOptionHandedOver
          : t.closure.statusOptionUnresolved;

    const systemTurn: ChatTurn = {
      id: createId("turn"),
      role: "system",
      content: t.closure.systemNoteClosed.replace("{status}", statusLabel),
      level: investigation.level,
      path: investigation.path ?? "conversation",
      createdAt: now,
      isDemo: false,
    };

    const updated: Investigation = {
      ...investigation,
      status,
      closure: summary,
      updatedAt: now,
      turns: [...investigation.turns, systemTurn],
    };

    void investigationRepository.save(updated);
    setInvestigation(updated);
    setClosureOpen(false);
    setStatusAnnouncement(systemTurn.content);
  };

  const handleReopenCase = () => {
    const now = new Date().toISOString();
    const systemTurn: ChatTurn = {
      id: createId("turn"),
      role: "system",
      content: t.closure.systemNoteReopened,
      level: investigation.level,
      path: investigation.path ?? "conversation",
      createdAt: now,
      isDemo: false,
    };

    const updated: Investigation = {
      ...investigation,
      status: "open",
      updatedAt: now,
      turns: [...investigation.turns, systemTurn],
    };

    void investigationRepository.save(updated);
    setInvestigation(updated);
    setClosureOpen(false);
    setStatusAnnouncement(systemTurn.content);
  };

  const handleTryAnotherTest = () => {
    setClosureOpen(false);
    if (investigation.status !== "open") {
      handleReopenCase();
    }
    scrollToElement("feedback-panel-section");
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

  const statusMeta = getStatusMeta();
  const StatusIcon = statusMeta.icon;
  const activePath = investigation.path;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="sr-only" role="status" aria-live="polite">
        {statusAnnouncement}
      </div>
      {/* Workspace Top Bar */}
      <div
        className="mb-6 flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between"
        style={{ borderColor: "var(--dd-border-subtle)" }}
      >
        <div className="min-w-0">
          <HashLink
            to="/investigations"
            className="inline-flex items-center gap-1.5 text-xs font-medium dd-theme-transition hover:opacity-80"
            style={{ color: "var(--dd-text-muted)" }}
          >
            <BackArrow className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.nav.myInvestigations}</span>
          </HashLink>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1
              className="text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: "var(--dd-text)" }}
            >
              {investigation.title}
            </h1>

            <span
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: statusMeta.bg,
                borderColor: statusMeta.border,
                color: statusMeta.text,
              }}
            >
              <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{statusMeta.label}</span>
            </span>

            <code
              dir="ltr"
              className="font-mono text-xs"
              style={{ color: "var(--dd-text-muted)" }}
            >
              {investigation.id}
            </code>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activePath ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--dd-text-muted)" }}
              >
                {t.workspace.pathSwitchLabel}:
              </span>
              <PersistentPathToggle
                activePath={activePath}
                onSwitchPath={handleSelectPath}
              />
            </div>
          ) : null}

          {isMockMode ? (
            <button
              type="button"
              onClick={() => void handleSimulateTimeout()}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text-secondary)",
              }}
            >
              <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.fallback.simulateTimeoutBtn}</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => handleOpenClosure("resolved")}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
            style={{
              backgroundColor: "var(--dd-accent)",
              color: "var(--dd-accent-on)",
            }}
          >
            <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.closure.openClosureBtn}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Reference & Control Column: Case Summary + Assistance Level Panel */}
        <aside className="space-y-6 lg:col-span-5">
          <CaseSummaryPanel investigation={investigation} />
          <AssistanceLevelPanel
            currentLevel={investigation.level}
            onSelectLevel={handleSelectLevel}
            externalLevel4Trigger={level4ConfirmNonce}
          />
        </aside>

        {/* Interactive Path, Test & Review, Handover, Closure & History Column */}
        <div className="space-y-6 lg:col-span-7">
          {!activePath ? (
            <div className="space-y-4">
              {prePathLoading ? (
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
                    {prePathRetrying
                      ? t.fallback.retryingNotice
                      : t.conversation.loading}
                  </span>
                </div>
              ) : null}

              {prePathFallbackReason ? (
                <TimeoutFallbackBanner
                  reason={prePathFallbackReason}
                  onTryAgain={() => setPrePathFallbackReason(null)}
                  onOpenHandover={handleOpenHandover}
                />
              ) : null}

              <PathSelector onSelectPath={handleSelectPath} />
            </div>
          ) : activePath === "conversation" ? (
            <ConversationalDiagnosisView
              investigation={investigation}
              onAppendTurns={handleAppendTurns}
              onRequestLevelChange={handleRequestLevelChange}
              onSwitchToBoard={() => handleSelectPath("hypothesis_board")}
              onOpenHandover={handleOpenHandover}
              simulateTimeoutNonce={simulateTimeoutNonce}
              feedbackReopenTrigger={feedbackReopenTrigger}
            />
          ) : (
            <HypothesisBoardView
              investigation={investigation}
              onUpdateHypotheses={handleUpdateHypotheses}
              onSwitchToConversation={() => handleSelectPath("conversation")}
              onOpenHandover={handleOpenHandover}
              simulateTimeoutNonce={simulateTimeoutNonce}
              feedbackReopenTrigger={feedbackReopenTrigger}
            />
          )}

          {/* Test & Review Feedback Panel */}
          <div id="feedback-panel-section">
            <FeedbackPanel
              investigation={investigation}
              onRecordWorked={handleRecordWorked}
              onRecordNewOutput={handleRecordNewOutput}
              onRecordNeedMoreHelp={handleRecordNeedMoreHelp}
              onRequestLevelChange={handleRequestLevelChange}
              onSwitchPath={handleSelectPath}
              onOpenHandover={handleOpenHandover}
              onOpenClosure={() => handleOpenClosure("resolved")}
            />
          </div>

          {/* Human Handover & Official Python Docs */}
          <HandoverPanel
            investigation={investigation}
            onFinishAsHandedOver={() => handleOpenClosure("handed_over")}
          />

          {/* User-Controlled Case Closure */}
          <ClosurePanel
            investigation={investigation}
            isOpen={closureOpen}
            defaultStatusChoice={closureDefaultStatus}
            onOpenEditor={() => handleOpenClosure("resolved")}
            onTryAnotherTest={handleTryAnotherTest}
            onFinishCase={handleFinishCase}
            onReopenCase={handleReopenCase}
          />

          {/* Investigation History / System Notes */}
          <section
            aria-labelledby="history-heading"
            className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-border-subtle)",
            }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--dd-border-subtle)" }}>
              <History
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--dd-accent-text)" }}
                aria-hidden="true"
              />
              <h2
                id="history-heading"
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--dd-text)" }}
              >
                {t.workspace.historyHeading}
              </h2>
            </div>

            <div aria-live="polite" className="mt-4">
              {investigation.turns.filter((turn) => turn.role === "system")
                .length === 0 ? (
                <p
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--dd-text-muted)" }}
                >
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.workspace.historyEmpty}</span>
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {investigation.turns
                    .filter((turn) => turn.role === "system")
                    .map((turn) => (
                    <li
                      key={turn.id}
                      className="flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm dd-theme-transition"
                      style={{
                        backgroundColor: "var(--dd-bg-subtle)",
                        borderColor: "var(--dd-border-subtle)",
                        color: "var(--dd-text-secondary)",
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <Info
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: "var(--dd-accent-text)" }}
                          aria-hidden="true"
                        />
                        <span>{turn.content}</span>
                      </div>

                      <span
                        className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums"
                        style={{ color: "var(--dd-text-muted)" }}
                      >
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>{formatTimestamp(turn.createdAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
