import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  FileWarning,
  GitCompareArrows,
  HelpCircle,
  Info,
  Sparkles,
  Terminal,
} from "lucide-react";
import { CodeEditorField, HashLink, navigateTo } from "@/src/components";
import { useI18n } from "@/src/i18n";
import { investigationRepository } from "@/src/storage";
import type { Investigation } from "@/src/types";
import {
  analyzeCaseInput,
  buildBuiltInExampleValues,
  buildExampleCaseValues,
  buildInvestigationFromIntake,
  updateInvestigationFromIntake,
  valuesFromInvestigation,
  type BuiltInExampleId,
  type CaseIntakeValues,
  type IntakeFieldKey,
  type IntakeCheckIssue,
} from "@/src/utils/caseIntake";

const INITIAL_VALUES: CaseIntakeValues = {
  code: "",
  error: "",
  expectedBehavior: "",
  actualOutput: "",
  sampleInput: "",
  noTraceback: false,
};

interface NewInvestigationScreenProps {
  editId?: string;
  exampleId?: BuiltInExampleId;
}

export function NewInvestigationScreen({
  editId,
  exampleId,
}: NewInvestigationScreenProps) {
  const { dir, lang, t } = useI18n();
  const ForwardArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [existingInvestigation, setExistingInvestigation] = useState<
    Investigation | undefined
  >(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const [values, setValues] = useState<CaseIntakeValues>(() =>
    exampleId ? buildBuiltInExampleValues(exampleId, t) : INITIAL_VALUES
  );
  const [showRuntimeDetails, setShowRuntimeDetails] = useState<boolean>(() => {
    if (exampleId) {
      const prefilled = buildBuiltInExampleValues(exampleId, t);
      return Boolean(
        prefilled.actualOutput || prefilled.sampleInput || prefilled.noTraceback
      );
    }
    return false;
  });
  const [showInputCheck, setShowInputCheck] = useState<boolean>(false);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) {
      setExistingInvestigation(undefined);
      return;
    }
    let cancelled = false;
    void investigationRepository.get(editId).then((loaded) => {
      if (cancelled || !loaded) {
        return;
      }
      setExistingInvestigation(loaded);
      setValues(valuesFromInvestigation(loaded));
      setShowRuntimeDetails(
        Boolean(loaded.case.actualOutput || loaded.case.sampleInput)
      );
    });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const codeRef = useRef<HTMLTextAreaElement | null>(null);
  const errorRef = useRef<HTMLTextAreaElement | null>(null);
  const expectedRef = useRef<HTMLTextAreaElement | null>(null);
  const actualOutputRef = useRef<HTMLInputElement | null>(null);
  const sampleInputRef = useRef<HTMLInputElement | null>(null);
  const inputCheckRef = useRef<HTMLDivElement | null>(null);

  const activeIssues = useMemo(
    () => (showInputCheck ? analyzeCaseInput(values, t) : []),
    [showInputCheck, values, t]
  );

  const issuesByField = useMemo(() => {
    const map: Partial<Record<IntakeFieldKey, IntakeCheckIssue[]>> = {};
    for (const issue of activeIssues) {
      for (const fieldKey of issue.relatedFields) {
        const list = map[fieldKey] ?? [];
        list.push(issue);
        map[fieldKey] = list;
      }
    }
    return map;
  }, [activeIssues]);

  const updateField = <K extends keyof CaseIntakeValues>(
    key: K,
    nextValue: CaseIntakeValues[K]
  ) => {
    setClipboardNotice(null);
    setValues((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const focusField = (field: IntakeFieldKey) => {
    if (field === "actualOutput" || field === "sampleInput") {
      setShowRuntimeDetails(true);
    }
    window.requestAnimationFrame(() => {
      const targetMap: Record<
        IntakeFieldKey,
        HTMLTextAreaElement | HTMLInputElement | null
      > = {
        code: codeRef.current,
        error: errorRef.current,
        expectedBehavior: expectedRef.current,
        actualOutput: actualOutputRef.current,
        sampleInput: sampleInputRef.current,
      };
      const el = targetMap[field];
      if (el) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
        el.focus();
      }
    });
  };

  const handleUseExample = () => {
    setClipboardNotice(null);
    setShowInputCheck(false);
    setShowRuntimeDetails(true);
    setValues(buildExampleCaseValues(t));
  };

  const handlePasteCode = async () => {
    setClipboardNotice(null);
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.readText !== "function") {
        setClipboardNotice(t.intake.clipboardUnavailable);
        focusField("code");
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim().length > 0) {
        updateField("code", clipText);
      } else {
        setClipboardNotice(t.intake.clipboardUnavailable);
      }
      focusField("code");
    } catch {
      setClipboardNotice(t.intake.clipboardUnavailable);
      focusField("code");
    }
  };

  const createAndOpenInvestigation = async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const investigation = existingInvestigation
        ? updateInvestigationFromIntake(existingInvestigation, values, t)
        : buildInvestigationFromIntake(values, lang, t);
      await investigationRepository.save(investigation);
      navigateTo(`/investigation/${encodeURIComponent(investigation.id)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const detected = analyzeCaseInput(values, t);
    if (detected.length === 0) {
      void createAndOpenInvestigation();
      return;
    }

    setShowInputCheck(true);
    if (
      detected.some(
        (issue) =>
          issue.relatedFields.includes("actualOutput") ||
          issue.relatedFields.includes("sampleInput")
      )
    ) {
      setShowRuntimeDetails(true);
    }

    window.requestAnimationFrame(() => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      inputCheckRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    });
  };

  const hasCode = values.code.trim().length > 0;
  const hasTraceback = values.error.trim().length > 0;
  const hasExpected = values.expectedBehavior.trim().length > 0;

  // Contextual quick actions: never show all buttons at once
  const showUseExampleAction = !hasCode && !hasTraceback && !hasExpected;
  const showPasteCodeAction = !hasCode;
  const showAddTracebackAction = hasCode && !values.noTraceback && !hasTraceback;
  const showAddExpectedAction = hasCode && !hasExpected;
  const hasAnyQuickAction =
    showUseExampleAction ||
    showPasteCodeAction ||
    showAddTracebackAction ||
    showAddExpectedAction;

  const isRuntimeProminent =
    values.noTraceback ||
    Boolean(issuesByField.actualOutput?.length) ||
    Boolean(issuesByField.sampleInput?.length);
  const isRuntimeExpanded =
    isRuntimeProminent ||
    showRuntimeDetails ||
    values.actualOutput.trim().length > 0 ||
    values.sampleInput.trim().length > 0;

  const codeIssues = issuesByField.code ?? [];
  const errorIssues = issuesByField.error ?? [];
  const expectedIssues = issuesByField.expectedBehavior ?? [];
  const actualOutputIssues = issuesByField.actualOutput ?? [];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--dd-text)", textWrap: "balance" }}
        >
          {existingInvestigation ? t.intake.editTitle : t.intake.title}
        </h1>
        <p
          className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base"
          style={{ color: "var(--dd-text-secondary)" }}
        >
          {existingInvestigation ? t.intake.editSubtitle : t.intake.subtitle}
        </p>
      </div>

      {/* Contextual Quick Actions */}
      {hasAnyQuickAction ? (
        <div
          aria-label={t.intake.quickActionsLabel}
          className="mb-6 flex flex-wrap items-center gap-2.5 rounded-xl border px-4 py-3 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <span
            className="text-xs font-semibold me-1"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.intake.quickActionsLabel}:
          </span>

          {showUseExampleAction ? (
            <button
              type="button"
              onClick={handleUseExample}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-accent-soft)",
                borderColor: "var(--dd-info-border)",
                color: "var(--dd-accent-text)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.intake.actionUseExample}</span>
            </button>
          ) : null}

          {showPasteCodeAction ? (
            <button
              type="button"
              onClick={() => void handlePasteCode()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            >
              <ClipboardPaste
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{t.intake.actionPasteCode}</span>
            </button>
          ) : null}

          {showAddTracebackAction ? (
            <button
              type="button"
              onClick={() => focusField("error")}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.intake.actionAddTraceback}</span>
            </button>
          ) : null}

          {showAddExpectedAction ? (
            <button
              type="button"
              onClick={() => focusField("expectedBehavior")}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.intake.actionAddExpected}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {clipboardNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--dd-info-bg)",
            borderColor: "var(--dd-info-border)",
            color: "var(--dd-info-text)",
          }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{clipboardNotice}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Field 1: Python Code Snippet */}
        <div
          className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <label
            htmlFor="intake-code"
            className="block text-sm font-semibold"
            style={{ color: "var(--dd-text)" }}
          >
            {t.intake.codeLabel}
          </label>
          <p
            id="intake-code-hint"
            className="mt-1 text-xs leading-relaxed"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.intake.codeHint}
          </p>

          <div className="mt-3">
            <CodeEditorField
              ref={codeRef}
              id="intake-code"
              value={values.code}
              onChange={(e) => updateField("code", e.target.value)}
              placeholder={t.intake.codePlaceholder}
              rows={10}
              invalid={codeIssues.length > 0}
              aria-describedby={
                codeIssues.length > 0
                  ? "intake-code-hint intake-code-feedback"
                  : "intake-code-hint"
              }
            />
          </div>

          {codeIssues.length > 0 ? (
            <div
              id="intake-code-feedback"
              role="status"
              aria-live="polite"
              className="mt-3 space-y-2"
            >
              {codeIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed"
                  style={{
                    backgroundColor:
                      issue.severity === "conflict"
                        ? "var(--dd-danger-bg)"
                        : "var(--dd-demo-bg)",
                    borderColor:
                      issue.severity === "conflict"
                        ? "var(--dd-danger-border)"
                        : "var(--dd-demo-border)",
                    color:
                      issue.severity === "conflict"
                        ? "var(--dd-danger-text)"
                        : "var(--dd-demo-text)",
                  }}
                >
                  {issue.severity === "conflict" ? (
                    <GitCompareArrows
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{issue.title}</p>
                    <p className="mt-0.5">{issue.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Field 2: Observed Error / Traceback + No Traceback Toggle */}
        <div
          className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <label
                htmlFor="intake-traceback"
                className="block text-sm font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.intake.tracebackLabel}
              </label>
              <p
                id="intake-traceback-hint"
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text-muted)" }}
              >
                {t.intake.tracebackHint}
              </p>
            </div>

            <label
              htmlFor="intake-no-traceback"
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2.5 self-start rounded-lg border px-3 py-2 text-xs font-medium dd-theme-transition"
              style={{
                backgroundColor: values.noTraceback
                  ? "var(--dd-accent-soft)"
                  : "var(--dd-surface-muted)",
                borderColor: values.noTraceback
                  ? "var(--dd-info-border)"
                  : "var(--dd-border-subtle)",
                color: values.noTraceback
                  ? "var(--dd-accent-text)"
                  : "var(--dd-text-secondary)",
              }}
            >
              <input
                id="intake-no-traceback"
                type="checkbox"
                checked={values.noTraceback}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updateField("noTraceback", checked);
                  if (checked) {
                    setShowRuntimeDetails(true);
                  }
                }}
                className="h-4 w-4 accent-current"
              />
              <span>{t.intake.noTracebackToggle}</span>
            </label>
          </div>

          {values.noTraceback ? (
            <div
              className="mt-3 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed"
              style={{
                backgroundColor: "var(--dd-info-bg)",
                borderColor: "var(--dd-info-border)",
                color: "var(--dd-info-text)",
              }}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.intake.noTracebackHelper}</span>
            </div>
          ) : (
            <div className="mt-3">
              <textarea
                ref={errorRef}
                id="intake-traceback"
                dir="ltr"
                rows={5}
                value={values.error}
                onChange={(e) => updateField("error", e.target.value)}
                placeholder={t.intake.tracebackPlaceholder}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                aria-invalid={errorIssues.length > 0 ? "true" : undefined}
                aria-describedby={
                  errorIssues.length > 0
                    ? "intake-traceback-hint intake-traceback-feedback"
                    : "intake-traceback-hint"
                }
                className="w-full resize-y rounded-lg border px-3.5 py-3 text-left font-mono text-[13px] leading-6 dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-code-bg)",
                  borderColor:
                    errorIssues.length > 0
                      ? "var(--dd-danger-border)"
                      : "var(--dd-code-border)",
                  color: "var(--dd-code-error-text)",
                }}
              />

              {errorIssues.length > 0 ? (
                <div
                  id="intake-traceback-feedback"
                  role="status"
                  aria-live="polite"
                  className="mt-3 space-y-2"
                >
                  {errorIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed"
                      style={{
                        backgroundColor: "var(--dd-danger-bg)",
                        borderColor: "var(--dd-danger-border)",
                        color: "var(--dd-danger-text)",
                      }}
                    >
                      <GitCompareArrows
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold">{issue.title}</p>
                        <p className="mt-0.5">{issue.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Field 3: Expected Behavior */}
        <div
          className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <label
            htmlFor="intake-expected"
            className="block text-sm font-semibold"
            style={{ color: "var(--dd-text)" }}
          >
            {t.intake.expectedLabel}
          </label>
          <p
            id="intake-expected-hint"
            className="mt-1 text-xs leading-relaxed"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.intake.expectedHint}
          </p>

          <textarea
            ref={expectedRef}
            id="intake-expected"
            dir={dir}
            rows={3}
            value={values.expectedBehavior}
            onChange={(e) => updateField("expectedBehavior", e.target.value)}
            placeholder={t.intake.expectedPlaceholder}
            aria-invalid={expectedIssues.length > 0 ? "true" : undefined}
            aria-describedby={
              expectedIssues.length > 0
                ? "intake-expected-hint intake-expected-feedback"
                : "intake-expected-hint"
            }
            className="mt-3 w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-bg)",
              borderColor:
                expectedIssues.length > 0
                  ? "var(--dd-demo-border)"
                  : "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          />

          {expectedIssues.length > 0 ? (
            <div
              id="intake-expected-feedback"
              role="status"
              aria-live="polite"
              className="mt-3 space-y-2"
            >
              {expectedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed"
                  style={{
                    backgroundColor: "var(--dd-demo-bg)",
                    borderColor: "var(--dd-demo-border)",
                    color: "var(--dd-demo-text)",
                  }}
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">{issue.title}</p>
                    <p className="mt-0.5">{issue.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Field 4: Optional Actual Output & Sample Input (Prominent when noTraceback is ticked) */}
        <div
          className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
          style={{
            backgroundColor: isRuntimeProminent
              ? "var(--dd-surface)"
              : "var(--dd-bg-subtle)",
            borderColor: isRuntimeProminent
              ? "var(--dd-info-border)"
              : "var(--dd-border-subtle)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <FileWarning
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{
                  color: isRuntimeProminent
                    ? "var(--dd-accent-text)"
                    : "var(--dd-text-muted)",
                }}
                aria-hidden="true"
              />
              <div>
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {isRuntimeProminent
                    ? t.intake.runtimeSectionProminentTitle
                    : t.intake.runtimeSectionTitle}
                </h2>
                <p
                  className="mt-0.5 text-xs leading-relaxed"
                  style={{ color: "var(--dd-text-muted)" }}
                >
                  {t.intake.runtimeSectionHint}
                </p>
              </div>
            </div>

            {!isRuntimeProminent ? (
              <button
                type="button"
                onClick={() => setShowRuntimeDetails((open) => !open)}
                aria-expanded={isRuntimeExpanded}
                aria-label={
                  isRuntimeExpanded
                    ? t.intake.hideRuntimeDetails
                    : t.intake.showRuntimeDetails
                }
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-surface)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text-secondary)",
                }}
              >
                {isRuntimeExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            ) : null}
          </div>

          {isRuntimeExpanded ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="intake-sample-input"
                  className="block text-xs font-semibold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {t.intake.sampleInputLabel}
                </label>
                <input
                  ref={sampleInputRef}
                  id="intake-sample-input"
                  type="text"
                  dir="ltr"
                  value={values.sampleInput}
                  onChange={(e) => updateField("sampleInput", e.target.value)}
                  placeholder={t.intake.sampleInputPlaceholder}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-left font-mono text-[13px] dd-theme-transition"
                  style={{
                    backgroundColor: "var(--dd-code-bg)",
                    borderColor: "var(--dd-code-border)",
                    color: "var(--dd-code-text)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="intake-actual-output"
                  className="block text-xs font-semibold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {t.intake.actualOutputLabel}
                </label>
                <input
                  ref={actualOutputRef}
                  id="intake-actual-output"
                  type="text"
                  dir="ltr"
                  value={values.actualOutput}
                  onChange={(e) => updateField("actualOutput", e.target.value)}
                  placeholder={t.intake.actualOutputPlaceholder}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  aria-invalid={
                    actualOutputIssues.length > 0 ? "true" : undefined
                  }
                  aria-describedby={
                    actualOutputIssues.length > 0
                      ? "intake-actual-output-feedback"
                      : undefined
                  }
                  className="mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-left font-mono text-[13px] dd-theme-transition"
                  style={{
                    backgroundColor: "var(--dd-code-bg)",
                    borderColor:
                      actualOutputIssues.length > 0
                        ? "var(--dd-demo-border)"
                        : "var(--dd-code-border)",
                    color: "var(--dd-code-text)",
                  }}
                />
              </div>

              {actualOutputIssues.length > 0 ? (
                <div
                  id="intake-actual-output-feedback"
                  role="status"
                  aria-live="polite"
                  className="sm:col-span-2"
                >
                  {actualOutputIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed"
                      style={{
                        backgroundColor: "var(--dd-demo-bg)",
                        borderColor: "var(--dd-demo-border)",
                        color: "var(--dd-demo-text)",
                      }}
                    >
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold">{issue.title}</p>
                        <p className="mt-0.5">{issue.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Input Check Summary Panel (shown before continuing when issues exist) */}
        {showInputCheck && activeIssues.length > 0 ? (
          <div
            ref={inputCheckRef}
            role="region"
            aria-labelledby="input-check-heading"
            aria-live="polite"
            className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-demo-border)",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: "var(--dd-demo-text)" }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <h2
                  id="input-check-heading"
                  className="text-base font-bold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {t.intake.inputCheckTitle}
                </h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {t.intake.inputCheckSubtitle}
                </p>

                <ul className="mt-4 space-y-3">
                  {activeIssues.map((issue) => (
                    <li
                      key={issue.id}
                      className="flex items-start gap-2.5 rounded-lg border p-3.5 text-sm"
                      style={{
                        backgroundColor:
                          issue.severity === "conflict"
                            ? "var(--dd-danger-bg)"
                            : "var(--dd-demo-bg)",
                        borderColor:
                          issue.severity === "conflict"
                            ? "var(--dd-danger-border)"
                            : "var(--dd-demo-border)",
                        color:
                          issue.severity === "conflict"
                            ? "var(--dd-danger-text)"
                            : "var(--dd-demo-text)",
                      }}
                    >
                      {issue.severity === "conflict" ? (
                        <GitCompareArrows
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <AlertTriangle
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{issue.title}</p>
                        <p className="mt-1 text-xs leading-relaxed">
                          {issue.explanation}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <p
                  className="mt-4 flex items-start gap-2 text-xs leading-relaxed"
                  style={{ color: "var(--dd-text-muted)" }}
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.intake.inputCheckLimitedNotice}</span>
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void createAndOpenInvestigation()}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95 disabled:opacity-60"
                    style={{
                      backgroundColor: "var(--dd-accent)",
                      color: "var(--dd-accent-on)",
                    }}
                  >
                    <span>{t.intake.btnContinueAnyway}</span>
                    <ForwardArrow className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => focusField(activeIssues[0].field)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                    style={{
                      backgroundColor: "var(--dd-surface-muted)",
                      borderColor: "var(--dd-border)",
                      color: "var(--dd-text)",
                    }}
                  >
                    <span>{t.intake.btnAddMissingDetails}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowInputCheck(false)}
                    className="inline-flex min-h-[44px] items-center rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-80"
                    style={{ color: "var(--dd-text-muted)" }}
                  >
                    {t.intake.btnCancelCheck}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <HashLink
            to={
              existingInvestigation
                ? `/investigation/${encodeURIComponent(existingInvestigation.id)}`
                : "/"
            }
            className="inline-flex min-h-[44px] items-center rounded-lg border px-4 py-2.5 text-sm font-medium whitespace-nowrap dd-theme-transition hover:opacity-90"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text-secondary)",
            }}
          >
            {existingInvestigation ? t.intake.cancelEdit : t.intake.cancelToHome}
          </HashLink>

          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
            style={{
              backgroundColor: "var(--dd-accent)",
              color: "var(--dd-accent-on)",
            }}
          >
            <span>
              {existingInvestigation
                ? t.intake.saveChanges
                : t.intake.submitContinue}
            </span>
            <ForwardArrow className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}
