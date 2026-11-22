import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Info,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useI18n } from "@/src/i18n";
import type { Investigation } from "@/src/types";

interface HandoverPanelProps {
  investigation: Investigation;
  onFinishAsHandedOver: () => void;
}

export function HandoverPanel({
  investigation,
  onFinishAsHandedOver,
}: HandoverPanelProps) {
  const { dir, t } = useI18n();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );

  const handoverSummary = useMemo(() => {
    const feedbackTypeLabel = (type: string): string => {
      switch (type) {
        case "worked":
          return t.feedback.btnWorked;
        case "still_failing":
          return t.feedback.btnStillFailing;
        case "different_result":
          return t.feedback.btnDifferentResult;
        case "need_more_help":
          return t.feedback.btnNeedMoreHelp;
        default:
          return type;
      }
    };

    const hypothesisStatusLabel = (status: string): string =>
      status === "rejected"
        ? t.handover.summaryHypothesisRejected
        : t.handover.summaryHypothesisInvestigating;

    const feedbackOutputs = investigation.feedback
      .filter((f) => Boolean(f.newOutput?.trim()))
      .map((f) => `- [${feedbackTypeLabel(f.type)}] ${f.newOutput?.trim()}`);

    const actualParts: string[] = [];
    if (investigation.case.actualOutput?.trim()) {
      actualParts.push(investigation.case.actualOutput.trim());
    }
    if (feedbackOutputs.length > 0) {
      actualParts.push(feedbackOutputs.join("\n"));
    }

    const stepsTried: string[] = [];
    if (investigation.selectedHypothesisId) {
      const selected = investigation.hypotheses.find(
        (h) => h.id === investigation.selectedHypothesisId
      );
      if (selected) {
        stepsTried.push(
          `${t.handover.summarySelectedHypothesis}: ${selected.title}`
        );
      }
    }
    for (const h of investigation.hypotheses) {
      if (h.status === "investigating" || h.status === "rejected") {
        stepsTried.push(
          `- [${hypothesisStatusLabel(h.status)}] ${h.title} | ${t.handover.summaryProbePrefix}: ${h.probe}`
        );
      }
    }
    for (const f of investigation.feedback) {
      stepsTried.push(
        `- ${t.handover.summaryFeedbackPrefix}: ${feedbackTypeLabel(f.type)}${f.note ? ` (${f.note})` : ""}`
      );
    }

    return [
      `=== ${t.app.name} — ${t.handover.summaryHeaderTitle} ===`,
      `${t.handover.summaryLabelTitle}: ${investigation.title} (${investigation.id})`,
      ``,
      `1. ${t.handover.summaryLabelCode}:`,
      investigation.case.code.trim() || t.workspace.noCodeProvided,
      ``,
      `2. ${t.handover.summaryLabelError}:`,
      investigation.case.error.trim() || t.workspace.noTracebackRecorded,
      ``,
      `3. ${t.handover.summaryLabelActualOutput}:`,
      actualParts.length > 0
        ? actualParts.join("\n")
        : t.workspace.notProvided,
      ``,
      `4. ${t.handover.summaryLabelExpected}:`,
      investigation.case.expectedBehavior.trim() || t.workspace.notProvided,
      ``,
      `5. ${t.handover.summaryLabelStepsTried}:`,
      stepsTried.length > 0
        ? stepsTried.join("\n")
        : t.handover.summaryNoStepsYet,
      ``,
      `6. ${t.handover.summaryLabelUncertainty}:`,
      t.handover.summaryUncertaintyText,
    ].join("\n");
  }, [investigation, t]);

  const handleCopy = async () => {
    try {
      if (
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
      ) {
        setCopyState("failed");
        return;
      }
      await navigator.clipboard.writeText(handoverSummary);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <section
      id="human-handover-panel"
      aria-labelledby="handover-panel-heading"
      className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
          style={{
            backgroundColor: "var(--dd-info-bg)",
            borderColor: "var(--dd-info-border)",
            color: "var(--dd-info-text)",
          }}
        >
          <UserCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="handover-panel-heading"
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--dd-text)" }}
          >
            {t.handover.title}
          </h2>
          <p
            className="mt-0.5 text-xs leading-relaxed"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.handover.subtitle}
          </p>
        </div>
      </div>

      {/* Clear Referral Notice: Instructor/TA vs Official Python Docs */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-lg border p-3.5"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <h3
            className="flex items-center gap-1.5 text-xs font-bold"
            style={{ color: "var(--dd-text)" }}
          >
            <UserCheck
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--dd-accent-text)" }}
              aria-hidden="true"
            />
            <span>{t.handover.referralInstructorTitle}</span>
          </h3>
          <p
            className="mt-1.5 text-xs leading-relaxed"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.handover.referralInstructorBody}
          </p>
        </div>

        <div
          className="rounded-lg border p-3.5"
          style={{
            backgroundColor: "var(--dd-bg-subtle)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <h3
            className="flex items-center gap-1.5 text-xs font-bold"
            style={{ color: "var(--dd-text)" }}
          >
            <BookOpen
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--dd-accent-text)" }}
              aria-hidden="true"
            />
            <span>{t.handover.referralDocsTitle}</span>
          </h3>
          <p
            className="mt-1.5 text-xs leading-relaxed"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.handover.referralDocsBody}
          </p>
          <a
            href="https://docs.python.org/3/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--dd-accent-text)" }}
          >
            <span>{t.handover.openPythonDocsBtn}</span>
            <ExternalLink
              className="h-3 w-3 shrink-0 rtl:-scale-x-100"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>

      {/* Explicit Nothing-Sent Assurance */}
      <div
        className="mt-4 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed"
        style={{
          backgroundColor: "var(--dd-bg-subtle)",
          borderColor: "var(--dd-border-subtle)",
          color: "var(--dd-text-secondary)",
        }}
      >
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: "var(--dd-accent-text)" }}
          aria-hidden="true"
        />
        <span>{t.handover.nothingSentNotice}</span>
      </div>

      {/* Summary Preview + Explicit Copy Button */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            className="text-xs font-semibold"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.handover.summaryPreviewHeading}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              {copyState === "copied" ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{t.handover.copySummaryBtn}</span>
            </button>

            <button
              type="button"
              onClick={onFinishAsHandedOver}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            >
              <span>{t.handover.markHandedOverBtn}</span>
            </button>
          </div>
        </div>

        {copyState === "copied" ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-2 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--dd-success-text)" }}
          >
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.handover.copiedSuccess}</span>
          </p>
        ) : copyState === "failed" ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-2 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--dd-demo-text)" }}
          >
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.handover.copyFailedNotice}</span>
          </p>
        ) : null}

        <div
          dir={dir}
          className="mt-2.5 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border p-3.5 text-start font-mono text-xs leading-5"
          style={{
            backgroundColor: "var(--dd-code-bg)",
            borderColor: "var(--dd-code-border)",
            color: "var(--dd-code-text)",
          }}
        >
          {handoverSummary}
        </div>
      </div>
    </section>
  );
}
