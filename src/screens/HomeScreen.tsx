import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Eye,
  FilePlus2,
  FolderSearch,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Lock,
  MessageSquareMore,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { CodeBlock, DemoBadge, HashLink } from "@/src/components";
import { useI18n } from "@/src/i18n";
import { debugApi } from "@/src/services/api";
import type { DebugResponse } from "@/src/types";

const SAMPLE_PYTHON_CODE = `def pairwise_diff(scores):
    diffs = []
    for i in range(len(scores)):
        diffs.append(scores[i + 1] - scores[i])
    return diffs

print(pairwise_diff([10, 14, 19]))`;

const SAMPLE_TRACEBACK = `Traceback (most recent call last):
  File "student_average.py", line 7, in <module>
    print(pairwise_diff([10, 14, 19]))
  File "student_average.py", line 4, in pairwise_diff
    diffs.append(scores[i + 1] - scores[i])
IndexError: list index out of range`;

export function HomeScreen() {
  const { dir, lang, t } = useI18n();
  const ForwardArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [previewResponse, setPreviewResponse] = useState<DebugResponse | null>(
    null
  );
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  const loadMockPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const response = await debugApi.submitDebugTurn({
        code: SAMPLE_PYTHON_CODE,
        error: "IndexError: list index out of range",
        expected_behavior: "Return consecutive score differences: [4, 5]",
        level: 1,
        path: "conversation",
        language: lang,
        history: [],
      });
      setPreviewResponse(response);
    } finally {
      setLoadingPreview(false);
    }
  }, [lang]);

  useEffect(() => {
    void loadMockPreview();
  }, [loadMockPreview]);

  const quickActions = [
    {
      to: "/new",
      icon: FilePlus2,
      title: t.home.quickActionNewTitle,
      body: t.home.quickActionNewBody,
      action: t.home.quickActionNewAction,
    },
    {
      to: "/investigations",
      icon: FolderSearch,
      title: t.home.quickActionListTitle,
      body: t.home.quickActionListBody,
      action: t.home.quickActionListAction,
    },
    {
      to: "/help",
      icon: BookOpen,
      title: t.home.quickActionHelpTitle,
      body: t.home.quickActionHelpBody,
      action: t.home.quickActionHelpAction,
    },
  ];

  const principles = [
    {
      icon: ShieldCheck,
      title: t.home.principle1Title,
      body: t.home.principle1Body,
    },
    {
      icon: Compass,
      title: t.home.principle2Title,
      body: t.home.principle2Body,
    },
    {
      icon: Lock,
      title: t.home.principle3Title,
      body: t.home.principle3Body,
    },
  ];

  const assistanceLevels = [
    {
      level: 1,
      icon: HelpCircle,
      title: t.home.level1Title,
      description: t.home.level1Desc,
    },
    {
      level: 2,
      icon: Lightbulb,
      title: t.home.level2Title,
      description: t.home.level2Desc,
    },
    {
      level: 3,
      icon: ListChecks,
      title: t.home.level3Title,
      description: t.home.level3Desc,
    },
    {
      level: 4,
      icon: Eye,
      title: t.home.level4Title,
      description: t.home.level4Desc,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
      {/* Welcome Banner & Agency Philosophy */}
      <section
        aria-labelledby="welcome-heading"
        className="rounded-xl border p-6 sm:p-10 dd-theme-transition"
        style={{
          backgroundColor: "var(--dd-surface)",
          borderColor: "var(--dd-border-subtle)",
        }}
      >
        <div className="max-w-3xl">
          <p
            className="text-xs font-semibold tracking-wide"
            style={{ color: "var(--dd-accent-text)" }}
          >
            {t.home.kicker}
          </p>

          <h1
            id="welcome-heading"
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              color: "var(--dd-text)",
              textWrap: "balance",
            }}
          >
            {t.home.heroTitle}
          </h1>

          <p
            className="mt-4 text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.home.heroDescription}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <HashLink
              to="/new"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold whitespace-nowrap dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              <span>{t.home.primaryCta}</span>
              <ForwardArrow className="h-4 w-4 shrink-0" aria-hidden="true" />
            </HashLink>

            <HashLink
              to="/help"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium whitespace-nowrap dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.home.secondaryCta}</span>
            </HashLink>
          </div>
        </div>

        <div
          className="mt-8 border-t pt-8"
          style={{ borderColor: "var(--dd-border-subtle)" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.home.principlesHeading}
          </h2>

          <div className="mt-5 grid gap-6 md:grid-cols-3">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3.5">
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      backgroundColor: "var(--dd-bg-subtle)",
                      borderColor: "var(--dd-border-subtle)",
                      color: "var(--dd-accent-text)",
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--dd-text)" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "var(--dd-text-muted)" }}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Three Quick-Action Cards */}
      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--dd-text)" }}
        >
          {t.home.quickActionsHeading}
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {quickActions.map((card) => {
            const Icon = card.icon;
            return (
              <HashLink
                key={card.to}
                to={card.to}
                className="group flex flex-col justify-between rounded-xl border p-6 dd-theme-transition hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--dd-surface)",
                  borderColor: "var(--dd-border-subtle)",
                }}
              >
                <div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg border"
                    style={{
                      backgroundColor: "var(--dd-accent-soft)",
                      borderColor: "var(--dd-info-border)",
                      color: "var(--dd-accent-text)",
                    }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <h3
                    className="mt-4 text-lg font-semibold"
                    style={{ color: "var(--dd-text)" }}
                  >
                    {card.title}
                  </h3>

                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: "var(--dd-text-muted)" }}
                  >
                    {card.body}
                  </p>
                </div>

                <div
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--dd-accent-text)" }}
                >
                  <span>{card.action}</span>
                  <ForwardArrow
                    className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </HashLink>
            );
          })}
        </div>
      </section>

      {/* Four Assistance Levels */}
      <section aria-labelledby="levels-heading">
        <div className="max-w-2xl">
          <h2
            id="levels-heading"
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--dd-text)" }}
          >
            {t.home.levelsHeading}
          </h2>
          <p
            className="mt-1.5 text-sm leading-relaxed"
            style={{ color: "var(--dd-text-muted)" }}
          >
            {t.home.levelsSubheading}
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assistanceLevels.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.level}
                className="rounded-xl border p-5 dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-surface)",
                  borderColor: "var(--dd-border-subtle)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--dd-accent-text)" }}
                    aria-hidden="true"
                  />
                  <span
                    className="font-mono text-xs tabular-nums"
                    style={{ color: "var(--dd-text-muted)" }}
                  >
                    0{item.level}
                  </span>
                </div>

                <h3
                  className="mt-3 text-sm font-semibold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {item.title}
                </h3>

                <p
                  className="mt-1.5 text-sm leading-relaxed"
                  style={{ color: "var(--dd-text-muted)" }}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sample Diagnostic Exchange (Exercises Mock API + Demo Badge + LTR Code in RTL) */}
      <section
        aria-labelledby="preview-heading"
        className="rounded-xl border p-6 sm:p-8 dd-theme-transition"
        style={{
          backgroundColor: "var(--dd-surface)",
          borderColor: "var(--dd-border-subtle)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="preview-heading"
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--dd-text)" }}
            >
              {t.home.previewHeading}
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--dd-text-muted)" }}
            >
              {t.home.previewSubheading}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadMockPreview()}
            disabled={loadingPreview}
            className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-lg border px-4 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer dd-theme-transition hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border)",
              color: "var(--dd-text)",
            }}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 shrink-0 ${loadingPreview ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{t.home.previewRefreshButton}</span>
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <CodeBlock
              code={SAMPLE_PYTHON_CODE}
              label={t.home.previewCodeLabel}
              variant="code"
            />
            <CodeBlock
              code={SAMPLE_TRACEBACK}
              label={t.home.previewTracebackLabel}
              variant="traceback"
              showLineNumbers={false}
            />
          </div>

          <div
            className="rounded-xl border p-5 dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-bg-subtle)",
              borderColor: "var(--dd-border-subtle)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <MessageSquareMore
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--dd-accent-text)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {t.home.previewMentorLabel}
                </span>
              </div>

              <span
                className="text-xs font-medium"
                style={{ color: "var(--dd-text-muted)" }}
              >
                {t.home.previewLevelLabel}
              </span>
            </div>

            {previewResponse ? (
              <div className="mt-4 space-y-4">
                <DemoBadge isDemo={previewResponse.is_demo} />

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {previewResponse.message}
                </p>

                {previewResponse.next_question ? (
                  <div
                    className="rounded-lg border p-3.5"
                    style={{
                      backgroundColor: "var(--dd-surface)",
                      borderColor: "var(--dd-border-subtle)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--dd-accent-text)" }}
                    >
                      {t.home.previewNextQuestionLabel}
                    </p>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "var(--dd-text)" }}
                    >
                      {previewResponse.next_question}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
