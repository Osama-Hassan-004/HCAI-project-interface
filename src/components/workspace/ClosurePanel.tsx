import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  Flag,
  RotateCcw,
  Share2,
} from "lucide-react";
import { HashLink } from "@/src/components";
import { useI18n } from "@/src/i18n";
import type { ClosureSummary, Investigation } from "@/src/types";

export type ClosureStatusChoice = "resolved" | "unresolved" | "handed_over";

interface ClosurePanelProps {
  investigation: Investigation;
  isOpen: boolean;
  defaultStatusChoice?: ClosureStatusChoice;
  onOpenEditor: () => void;
  onTryAnotherTest: () => void;
  onFinishCase: (
    status: ClosureStatusChoice,
    summary: ClosureSummary
  ) => void;
  onReopenCase: () => void;
}

function buildInitialClosureDefaults(
  investigation: Investigation,
  unresolvedFallback: string
): ClosureSummary {
  if (investigation.closure) {
    return investigation.closure;
  }

  const selectedHyp = investigation.selectedHypothesisId
    ? investigation.hypotheses.find(
        (h) => h.id === investigation.selectedHypothesisId
      )
    : undefined;

  const evidenceParts: string[] = [];
  if (investigation.case.error.trim()) {
    evidenceParts.push(investigation.case.error.trim().split("\n").pop() ?? "");
  }
  const latestOutputFeedback = [...investigation.feedback]
    .reverse()
    .find((f) => f.newOutput?.trim());
  if (latestOutputFeedback?.newOutput) {
    evidenceParts.push(latestOutputFeedback.newOutput.trim());
  } else if (investigation.case.actualOutput?.trim()) {
    evidenceParts.push(investigation.case.actualOutput.trim());
  }

  return {
    reportedProblem:
      investigation.case.expectedBehavior.trim() ||
      investigation.title,
    confirmedCause: selectedHyp ? selectedHyp.title : unresolvedFallback,
    evidence: evidenceParts.filter(Boolean).join(" · "),
    appliedFix: "",
    verificationResult: "",
    reflection: "",
  };
}

export function ClosurePanel({
  investigation,
  isOpen,
  defaultStatusChoice = "resolved",
  onOpenEditor,
  onTryAnotherTest,
  onFinishCase,
  onReopenCase,
}: ClosurePanelProps) {
  const { dir, t } = useI18n();

  const [statusChoice, setStatusChoice] =
    useState<ClosureStatusChoice>(defaultStatusChoice);
  const [formState, setFormState] = useState<ClosureSummary>(() =>
    buildInitialClosureDefaults(investigation, t.closure.unresolvedValue)
  );

  useEffect(() => {
    setStatusChoice(defaultStatusChoice);
  }, [defaultStatusChoice]);

  useEffect(() => {
    if (isOpen) {
      setFormState(
        buildInitialClosureDefaults(investigation, t.closure.unresolvedValue)
      );
    }
  }, [investigation, isOpen, t.closure.unresolvedValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resolvedCause =
      statusChoice === "unresolved" && !formState.confirmedCause.trim()
        ? "unresolved"
        : formState.confirmedCause.trim() || "unresolved";

    onFinishCase(statusChoice, {
      reportedProblem:
        formState.reportedProblem.trim() || investigation.title,
      confirmedCause:
        statusChoice === "unresolved" &&
        resolvedCause === t.closure.unresolvedValue
          ? "unresolved"
          : resolvedCause,
      evidence: formState.evidence.trim() || t.workspace.notProvided,
      appliedFix: formState.appliedFix.trim() || t.workspace.notProvided,
      verificationResult:
        formState.verificationResult.trim() || t.workspace.notProvided,
      ...(formState.reflection?.trim()
        ? { reflection: formState.reflection.trim() }
        : {}),
    });
  };

  const getStatusDisplay = (status: Investigation["status"]) => {
    switch (status) {
      case "resolved":
        return {
          icon: CheckCircle2,
          label: t.closure.statusOptionResolved,
          bg: "var(--dd-success-bg)",
          border: "var(--dd-success-border)",
          text: "var(--dd-success-text)",
        };
      case "handed_over":
        return {
          icon: Share2,
          label: t.closure.statusOptionHandedOver,
          bg: "var(--dd-info-bg)",
          border: "var(--dd-info-border)",
          text: "var(--dd-info-text)",
        };
      case "unresolved":
      default:
        return {
          icon: AlertCircle,
          label: t.closure.statusOptionUnresolved,
          bg: "var(--dd-demo-bg)",
          border: "var(--dd-demo-border)",
          text: "var(--dd-demo-text)",
        };
    }
  };

  // Saved Closure Summary State (when status is resolved/unresolved/handed_over)
  if (investigation.status !== "open" && investigation.closure && !isOpen) {
    const saved = investigation.closure;
    const statusMeta = getStatusDisplay(investigation.status);
    const StatusIcon = statusMeta.icon;

    return (
      <section
        id="case-closure-panel"
        aria-labelledby="closure-saved-heading"
        className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
        style={{
          backgroundColor: "var(--dd-surface)",
          borderColor: statusMeta.border,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--dd-border-subtle)" }}>
          <div>
            <h2
              id="closure-saved-heading"
              className="text-base font-bold tracking-tight"
              style={{ color: "var(--dd-text)" }}
            >
              {t.closure.savedSummaryHeading}
            </h2>
          </div>

          <span
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold"
            style={{
              backgroundColor: statusMeta.bg,
              borderColor: statusMeta.border,
              color: statusMeta.text,
            }}
          >
            <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{statusMeta.label}</span>
          </span>
        </div>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold" style={{ color: "var(--dd-text-muted)" }}>
              {t.closure.reportedProblemLabel}
            </dt>
            <dd className="mt-1" style={{ color: "var(--dd-text)" }}>
              {saved.reportedProblem}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold" style={{ color: "var(--dd-text-muted)" }}>
              {t.closure.confirmedCauseLabel}
            </dt>
            <dd className="mt-1" style={{ color: "var(--dd-text)" }}>
              {saved.confirmedCause === "unresolved"
                ? t.closure.unresolvedValue
                : saved.confirmedCause}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold" style={{ color: "var(--dd-text-muted)" }}>
              {t.closure.evidenceLabel}
            </dt>
            <dd className="mt-1" style={{ color: "var(--dd-text-secondary)" }}>
              {saved.evidence}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold" style={{ color: "var(--dd-text-muted)" }}>
              {t.closure.appliedFixLabel}
            </dt>
            <dd className="mt-1" style={{ color: "var(--dd-text-secondary)" }}>
              {saved.appliedFix}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold" style={{ color: "var(--dd-text-muted)" }}>
              {t.closure.verificationResultLabel}
            </dt>
            <dd className="mt-1" style={{ color: "var(--dd-text-secondary)" }}>
              {saved.verificationResult}
            </dd>
          </div>

          {saved.reflection ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold" style={{ color: "var(--dd-text-muted)" }}>
                {t.closure.reflectionLabel}
              </dt>
              <dd className="mt-1" style={{ color: "var(--dd-text-secondary)" }}>
                {saved.reflection}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderColor: "var(--dd-border-subtle)" }}>
          <button
            type="button"
            onClick={onReopenCase}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.closure.reopenCaseBtn}</span>
          </button>

          <HashLink
            to="/new"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap dd-theme-transition hover:opacity-95"
            style={{
              backgroundColor: "var(--dd-accent)",
              color: "var(--dd-accent-on)",
            }}
          >
            <FilePlus2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.closure.btnNewInvestigation}</span>
          </HashLink>
        </div>
      </section>
    );
  }

  return (
    <section
      id="case-closure-panel"
      aria-labelledby="closure-panel-heading"
      className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Flag
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: "var(--dd-accent-text)" }}
            aria-hidden="true"
          />
          <div>
            <h2
              id="closure-panel-heading"
              className="text-base font-bold tracking-tight"
              style={{ color: "var(--dd-text)" }}
            >
              {t.closure.panelTitle}
            </h2>
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: "var(--dd-text-muted)" }}
            >
              {t.closure.panelSubtitle}
            </p>
          </div>
        </div>

        {!isOpen ? (
          <button
            type="button"
            onClick={onOpenEditor}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
            style={{
              backgroundColor: "var(--dd-accent)",
              color: "var(--dd-accent-on)",
            }}
          >
            <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.closure.openClosureBtn}</span>
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t pt-5" style={{ borderColor: "var(--dd-border-subtle)" }}>
          {/* Final Status Choice */}
          <div>
            <span
              className="block text-xs font-semibold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.closure.statusSelectLabel}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  {
                    value: "resolved" as const,
                    label: t.closure.statusOptionResolved,
                    icon: CheckCircle2,
                  },
                  {
                    value: "unresolved" as const,
                    label: t.closure.statusOptionUnresolved,
                    icon: AlertCircle,
                  },
                  {
                    value: "handed_over" as const,
                    label: t.closure.statusOptionHandedOver,
                    icon: Share2,
                  },
                ]
              ).map((option) => {
                const Icon = option.icon;
                const active = statusChoice === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setStatusChoice(option.value);
                      if (
                        option.value === "unresolved" &&
                        !formState.confirmedCause.trim()
                      ) {
                        setFormState((prev) => ({
                          ...prev,
                          confirmedCause: t.closure.unresolvedValue,
                        }));
                      }
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition"
                    style={{
                      backgroundColor: active
                        ? "var(--dd-accent-soft)"
                        : "var(--dd-surface-muted)",
                      borderColor: active
                        ? "var(--dd-accent)"
                        : "var(--dd-border)",
                      color: active
                        ? "var(--dd-accent-text)"
                        : "var(--dd-text-secondary)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="closure-problem"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.closure.reportedProblemLabel}
              </label>
              <input
                id="closure-problem"
                type="text"
                dir={dir}
                value={formState.reportedProblem}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    reportedProblem: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-bg)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="closure-cause"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.closure.confirmedCauseLabel}
              </label>
              <input
                id="closure-cause"
                type="text"
                dir={dir}
                value={formState.confirmedCause}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    confirmedCause: e.target.value,
                  }))
                }
                placeholder={t.closure.confirmedCausePlaceholder}
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-bg)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="closure-evidence"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.closure.evidenceLabel}
              </label>
              <textarea
                id="closure-evidence"
                dir={dir}
                rows={2}
                value={formState.evidence}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    evidence: e.target.value,
                  }))
                }
                className="mt-1.5 w-full resize-y rounded-lg border px-3 py-2 text-sm dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-bg)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="closure-fix"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.closure.appliedFixLabel}
              </label>
              <textarea
                id="closure-fix"
                dir={dir}
                rows={2}
                value={formState.appliedFix}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    appliedFix: e.target.value,
                  }))
                }
                placeholder={t.closure.appliedFixPlaceholder}
                className="mt-1.5 w-full resize-y rounded-lg border px-3 py-2 text-sm dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-bg)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="closure-verification"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.closure.verificationResultLabel}
              </label>
              <input
                id="closure-verification"
                type="text"
                dir={dir}
                value={formState.verificationResult}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    verificationResult: e.target.value,
                  }))
                }
                placeholder={t.closure.verificationResultPlaceholder}
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-bg)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="closure-reflection"
                className="block text-xs font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.closure.reflectionLabel}
              </label>
              <textarea
                id="closure-reflection"
                dir={dir}
                rows={2}
                value={formState.reflection ?? ""}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    reflection: e.target.value,
                  }))
                }
                placeholder={t.closure.reflectionPlaceholder}
                className="mt-1.5 w-full resize-y rounded-lg border px-3 py-2 text-sm dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-bg)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.closure.btnFinishCase}</span>
            </button>

            <button
              type="button"
              onClick={onTryAnotherTest}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.closure.btnTryAnotherTest}</span>
            </button>

            <HashLink
              to="/new"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text-secondary)",
              }}
            >
              <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.closure.btnNewInvestigation}</span>
            </HashLink>
          </div>
        </form>
      ) : null}
    </section>
  );
}
