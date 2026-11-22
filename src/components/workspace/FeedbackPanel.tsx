import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle2,
  GitCompare,
  HelpCircle,
  Info,
  LifeBuoy,
  RefreshCw,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/src/i18n";
import type {
  AssistanceLevel,
  FeedbackEvent,
  FeedbackType,
  Investigation,
  Path,
} from "@/src/types";

interface FeedbackPanelProps {
  investigation: Investigation;
  onRecordWorked: () => void;
  onRecordNewOutput: (
    type: "still_failing" | "different_result",
    newOutput: string,
    note?: string
  ) => void;
  onRecordNeedMoreHelp: () => void;
  onRequestLevelChange: (nextLevel: AssistanceLevel) => void;
  onSwitchPath: (nextPath: Path) => void;
  onOpenHandover: () => void;
  onOpenClosure: () => void;
}

export function FeedbackPanel({
  investigation,
  onRecordWorked,
  onRecordNewOutput,
  onRecordNeedMoreHelp,
  onRequestLevelChange,
  onSwitchPath,
  onOpenHandover,
  onOpenClosure,
}: FeedbackPanelProps) {
  const { dir, lang, t } = useI18n();

  const [pendingOutputType, setPendingOutputType] = useState<
    "still_failing" | "different_result" | null
  >(null);
  const [newOutputText, setNewOutputText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [outputError, setOutputError] = useState<string | null>(null);
  const [showWorkedNotice, setShowWorkedNotice] = useState(false);
  const [showNeedHelpOptions, setShowNeedHelpOptions] = useState(false);

  const handleWorkedClick = () => {
    setPendingOutputType(null);
    setShowNeedHelpOptions(false);
    setOutputError(null);
    setShowWorkedNotice(true);
    onRecordWorked();
  };

  const handleFailingOrDifferentClick = (
    type: "still_failing" | "different_result"
  ) => {
    setShowWorkedNotice(false);
    setShowNeedHelpOptions(false);
    setOutputError(null);
    setPendingOutputType(type);
  };

  const handleNeedHelpClick = () => {
    setPendingOutputType(null);
    setShowWorkedNotice(false);
    setOutputError(null);
    setShowNeedHelpOptions(true);
    onRecordNeedMoreHelp();
  };

  const handleSubmitNewOutput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingOutputType) {
      return;
    }
    const trimmedOutput = newOutputText.trim();
    if (!trimmedOutput) {
      setOutputError(t.feedback.newOutputRequired);
      return;
    }

    onRecordNewOutput(
      pendingOutputType,
      trimmedOutput,
      noteText.trim() || undefined
    );
    setNewOutputText("");
    setNoteText("");
    setOutputError(null);
    setPendingOutputType(null);
  };

  const nextHigherLevel: AssistanceLevel | null =
    investigation.level < 4
      ? ((investigation.level + 1) as AssistanceLevel)
      : null;

  const oppositePath: Path =
    investigation.path === "hypothesis_board"
      ? "conversation"
      : "hypothesis_board";
  const oppositePathLabel =
    oppositePath === "conversation"
      ? t.workspace.pathConversationTitle
      : t.workspace.pathHypothesisTitle;

  const getFeedbackLabel = (type: FeedbackType): string => {
    switch (type) {
      case "worked":
        return t.feedback.btnWorked;
      case "still_failing":
        return t.feedback.btnStillFailing;
      case "different_result":
        return t.feedback.btnDifferentResult;
      case "need_more_help":
        return t.feedback.btnNeedMoreHelp;
    }
  };

  const getFeedbackIcon = (type: FeedbackType) => {
    switch (type) {
      case "worked":
        return CheckCircle2;
      case "still_failing":
        return XCircle;
      case "different_result":
        return GitCompare;
      case "need_more_help":
        return LifeBuoy;
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

  return (
    <section
      aria-labelledby="feedback-panel-heading"
      className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <div>
        <h2
          id="feedback-panel-heading"
          className="text-base font-bold tracking-tight"
          style={{ color: "var(--dd-text)" }}
        >
          {t.feedback.title}
        </h2>
        <p
          className="mt-1 text-xs leading-relaxed"
          style={{ color: "var(--dd-text-muted)" }}
        >
          {t.feedback.subtitle}
        </p>
      </div>

      {/* Four Primary Feedback Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleWorkedClick}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
          style={{
            backgroundColor: "var(--dd-success-bg)",
            borderColor: "var(--dd-success-border)",
            color: "var(--dd-success-text)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.feedback.btnWorked}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFailingOrDifferentClick("still_failing")}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
          style={{
            backgroundColor: "var(--dd-danger-bg)",
            borderColor: "var(--dd-danger-border)",
            color: "var(--dd-danger-text)",
          }}
        >
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.feedback.btnStillFailing}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFailingOrDifferentClick("different_result")}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
          style={{
            backgroundColor: "var(--dd-demo-bg)",
            borderColor: "var(--dd-demo-border)",
            color: "var(--dd-demo-text)",
          }}
        >
          <GitCompare className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.feedback.btnDifferentResult}</span>
        </button>

        <button
          type="button"
          onClick={handleNeedHelpClick}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
          style={{
            backgroundColor: "var(--dd-info-bg)",
            borderColor: "var(--dd-info-border)",
            color: "var(--dd-info-text)",
          }}
        >
          <LifeBuoy className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.feedback.btnNeedMoreHelp}</span>
        </button>
      </div>

      {/* "It worked" confirmation (never closes automatically) */}
      {showWorkedNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border p-4 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-success-bg)",
            borderColor: "var(--dd-success-border)",
            color: "var(--dd-success-text)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold">{t.feedback.workedNoticeTitle}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {t.feedback.workedNoticeBody}
              </p>
              <button
                type="button"
                onClick={onOpenClosure}
                className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
                style={{
                  backgroundColor: "var(--dd-accent)",
                  color: "var(--dd-accent-on)",
                }}
              >
                <span>{t.feedback.openClosureFromWorked}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* New Output Capture for "Still failing" / "Different result" */}
      {pendingOutputType ? (
        <form
          onSubmit={handleSubmitNewOutput}
          noValidate
          className="mt-4 space-y-3 rounded-xl border p-4 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-border)",
          }}
        >
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--dd-text)" }}
          >
            {pendingOutputType === "still_failing"
              ? t.feedback.newOutputHeadingFailing
              : t.feedback.newOutputHeadingDifferent}
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.feedback.newOutputHint}
          </p>

          <div>
            <label
              htmlFor="feedback-new-output"
              className="block text-xs font-semibold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.feedback.newOutputLabel}
            </label>
            <textarea
              id="feedback-new-output"
              dir="ltr"
              rows={3}
              value={newOutputText}
              onChange={(e) => {
                setNewOutputText(e.target.value);
                if (outputError) {
                  setOutputError(null);
                }
              }}
              placeholder={t.feedback.newOutputPlaceholder}
              spellCheck={false}
              aria-invalid={outputError ? "true" : undefined}
              aria-describedby={outputError ? "feedback-output-err" : undefined}
              className="mt-1.5 w-full resize-y rounded-lg border px-3 py-2 text-left font-mono text-xs leading-5 dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-code-bg)",
                borderColor: outputError
                  ? "var(--dd-danger-border)"
                  : "var(--dd-code-border)",
                color: "var(--dd-code-text)",
              }}
            />
            {outputError ? (
              <p
                id="feedback-output-err"
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "var(--dd-danger-text)" }}
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{outputError}</span>
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="feedback-note"
              className="block text-xs font-semibold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.feedback.newOutputNoteLabel}
            </label>
            <input
              id="feedback-note"
              type="text"
              dir={dir}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.feedback.newOutputNotePlaceholder}
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
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.feedback.submitNewOutput}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingOutputType(null);
                setOutputError(null);
              }}
              className="inline-flex min-h-[40px] items-center rounded-lg border px-3.5 py-2 text-xs font-medium cursor-pointer dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text-secondary)",
              }}
            >
              {t.feedback.cancelNewOutput}
            </button>
          </div>
        </form>
      ) : null}

      {/* "I need more help" explicit user choices (NEVER auto-changes level) */}
      {showNeedHelpOptions ? (
        <div
          role="region"
          aria-live="polite"
          className="mt-4 rounded-xl border p-4 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-info-bg)",
            borderColor: "var(--dd-info-border)",
            color: "var(--dd-info-text)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.feedback.needHelpTitle}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {t.feedback.needHelpBody}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {nextHigherLevel ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNeedHelpOptions(false);
                      onRequestLevelChange(nextHigherLevel);
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
                    style={{
                      backgroundColor: "var(--dd-accent)",
                      color: "var(--dd-accent-on)",
                    }}
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {t.feedback.needHelpRaiseLevel.replace(
                        "{level}",
                        String(nextHigherLevel)
                      )}
                    </span>
                  </button>
                ) : (
                  <span className="text-xs font-medium">
                    {t.feedback.needHelpMaxLevelNote}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowNeedHelpOptions(false);
                    onSwitchPath(oppositePath);
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer dd-theme-transition"
                  style={{
                    backgroundColor: "var(--dd-surface)",
                    borderColor: "var(--dd-info-border)",
                    color: "var(--dd-text)",
                  }}
                >
                  <GitCompare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {t.feedback.needHelpSwitchPath.replace(
                      "{path}",
                      oppositePathLabel
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowNeedHelpOptions(false);
                    onOpenHandover();
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer dd-theme-transition"
                  style={{
                    backgroundColor: "var(--dd-surface)",
                    borderColor: "var(--dd-info-border)",
                    color: "var(--dd-text)",
                  }}
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.feedback.needHelpHandover}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recorded Feedback Log */}
      {investigation.feedback.length > 0 ? (
        <div
          className="mt-5 border-t pt-4"
          style={{ borderColor: "var(--dd-border-subtle)" }}
        >
          <h3
            className="text-xs font-semibold"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.feedback.recentFeedbackHeading}
          </h3>
          <ul className="mt-2.5 space-y-2">
            {investigation.feedback.map((item: FeedbackEvent) => {
              const Icon = getFeedbackIcon(item.type);
              return (
                <li
                  key={item.id}
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{
                    backgroundColor: "var(--dd-bg-subtle)",
                    borderColor: "var(--dd-border-subtle)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 font-semibold"
                      style={{ color: "var(--dd-text)" }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{getFeedbackLabel(item.type)}</span>
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ color: "var(--dd-text-muted)" }}
                    >
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>
                  {item.note ? (
                    <p
                      className="mt-1 flex items-start gap-1.5"
                      style={{ color: "var(--dd-text-secondary)" }}
                    >
                      <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>{item.note}</span>
                    </p>
                  ) : null}
                  {item.newOutput ? (
                    <pre
                      dir="ltr"
                      className="mt-1.5 overflow-x-auto rounded border px-2 py-1 text-left font-mono text-[11px]"
                      style={{
                        backgroundColor: "var(--dd-code-bg)",
                        borderColor: "var(--dd-code-border)",
                        color: "var(--dd-code-text)",
                      }}
                    >
                      {item.newOutput}
                    </pre>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
