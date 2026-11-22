import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileCode2,
  FlaskConical,
  GitCommitHorizontal,
  Info,
  Pencil,
} from "lucide-react";
import { CodeBlock, HashLink } from "@/src/components";
import { useI18n } from "@/src/i18n";
import type { Investigation } from "@/src/types";

interface CaseSummaryPanelProps {
  investigation: Investigation;
}

export function CaseSummaryPanel({ investigation }: CaseSummaryPanelProps) {
  const { t } = useI18n();
  const [codeExpanded, setCodeExpanded] = useState<boolean>(true);

  const selectedHypothesis = investigation.selectedHypothesisId
    ? investigation.hypotheses.find(
        (h) => h.id === investigation.selectedHypothesisId
      )
    : undefined;

  const triedProbes = investigation.hypotheses
    .filter(
      (h) =>
        (h.status === "investigating" || h.status === "rejected") &&
        h.probe.trim().length > 0
    )
    .map((h) => ({ id: h.id, title: h.title, probe: h.probe }));

  const hasCode = investigation.case.code.trim().length > 0;
  const hasError = investigation.case.error.trim().length > 0;
  const hasExpected = investigation.case.expectedBehavior.trim().length > 0;
  const hasSampleInput = Boolean(investigation.case.sampleInput?.trim());
  const hasActualOutput = Boolean(investigation.case.actualOutput?.trim());

  return (
    <section
      aria-labelledby="case-summary-heading"
      className="rounded-xl border p-5 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--dd-border-subtle)" }}>
        <div className="flex items-center gap-2">
          <FileCode2
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--dd-accent-text)" }}
            aria-hidden="true"
          />
          <h2
            id="case-summary-heading"
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--dd-text)" }}
          >
            {t.workspace.caseSummaryHeading}
          </h2>
        </div>

        <HashLink
          to={`/new?edit=${encodeURIComponent(investigation.id)}`}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 dd-theme-transition hover:opacity-90"
          style={{
            backgroundColor: "var(--dd-surface-muted)",
            borderColor: "var(--dd-border)",
            color: "var(--dd-text)",
          }}
        >
          <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t.workspace.editDetails}</span>
        </HashLink>
      </div>

      <div className="mt-4 space-y-4">
        {/* Python Code */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3
              className="text-xs font-semibold"
              style={{ color: "var(--dd-text-secondary)" }}
            >
              {t.workspace.codeFieldLabel}
            </h3>
            {hasCode ? (
              <button
                type="button"
                onClick={() => setCodeExpanded((prev) => !prev)}
                aria-expanded={codeExpanded}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium cursor-pointer dd-theme-transition hover:opacity-80"
                style={{ color: "var(--dd-accent-text)" }}
              >
                <span>
                  {codeExpanded ? t.workspace.hideCode : t.workspace.showCode}
                </span>
                {codeExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            ) : null}
          </div>

          {hasCode ? (
            codeExpanded ? (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg">
                <CodeBlock code={investigation.case.code} variant="code" />
              </div>
            ) : null
          ) : (
            <p
              className="mt-1.5 text-xs italic"
              style={{ color: "var(--dd-text-muted)" }}
            >
              {t.workspace.noCodeProvided}
            </p>
          )}
        </div>

        {/* Observed Error / Traceback */}
        <div>
          <h3
            className="text-xs font-semibold"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.workspace.errorFieldLabel}
          </h3>
          {hasError ? (
            <div className="mt-2 max-h-44 overflow-y-auto rounded-lg">
              <CodeBlock
                code={investigation.case.error}
                variant="traceback"
                showLineNumbers={false}
              />
            </div>
          ) : (
            <p
              className="mt-1.5 flex items-start gap-1.5 text-xs"
              style={{ color: "var(--dd-text-muted)" }}
            >
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.workspace.noTracebackRecorded}</span>
            </p>
          )}
        </div>

        {/* Expected Behavior */}
        <div>
          <h3
            className="text-xs font-semibold"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.workspace.expectedFieldLabel}
          </h3>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{
              color: hasExpected
                ? "var(--dd-text)"
                : "var(--dd-text-muted)",
            }}
          >
            {hasExpected
              ? investigation.case.expectedBehavior
              : t.workspace.notProvided}
          </p>
        </div>

        {/* Optional Runtime Evidence */}
        {hasSampleInput || hasActualOutput ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {hasSampleInput ? (
              <div>
                <h3
                  className="text-xs font-semibold"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {t.workspace.sampleInputFieldLabel}
                </h3>
                <pre
                  dir="ltr"
                  className="mt-1 overflow-x-auto rounded-md border px-2.5 py-1.5 text-left font-mono text-xs"
                  style={{
                    backgroundColor: "var(--dd-code-bg)",
                    borderColor: "var(--dd-code-border)",
                    color: "var(--dd-code-text)",
                  }}
                >
                  {investigation.case.sampleInput}
                </pre>
              </div>
            ) : null}

            {hasActualOutput ? (
              <div>
                <h3
                  className="text-xs font-semibold"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {t.workspace.actualOutputFieldLabel}
                </h3>
                <pre
                  dir="ltr"
                  className="mt-1 overflow-x-auto rounded-md border px-2.5 py-1.5 text-left font-mono text-xs"
                  style={{
                    backgroundColor: "var(--dd-code-bg)",
                    borderColor: "var(--dd-code-border)",
                    color: "var(--dd-code-text)",
                  }}
                >
                  {investigation.case.actualOutput}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Selected Hypothesis & Probes Already Tried */}
        <div
          className="grid gap-4 border-t pt-4 sm:grid-cols-2"
          style={{ borderColor: "var(--dd-border-subtle)" }}
        >
          <div>
            <h3
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "var(--dd-text-secondary)" }}
            >
              <GitCommitHorizontal
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{t.workspace.selectedHypothesisLabel}</span>
            </h3>
            <p
              className="mt-1 text-xs leading-relaxed"
              style={{
                color: selectedHypothesis
                  ? "var(--dd-text)"
                  : "var(--dd-text-muted)",
              }}
            >
              {selectedHypothesis
                ? selectedHypothesis.title
                : t.workspace.noHypothesisSelected}
            </p>
          </div>

          <div>
            <h3
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "var(--dd-text-secondary)" }}
            >
              <FlaskConical
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{t.workspace.probesTriedLabel}</span>
            </h3>
            {triedProbes.length > 0 ? (
              <ul
                className="mt-1 space-y-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text)" }}
              >
                {triedProbes.map((item) => (
                  <li key={item.id}>{item.probe}</li>
                ))}
              </ul>
            ) : (
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text-muted)" }}
              >
                {t.workspace.noProbesTried}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
