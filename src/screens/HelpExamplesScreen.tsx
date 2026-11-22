import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  ExternalLink,
  Eye,
  FilePlus2,
  GitCompare,
  HelpCircle,
  LayoutList,
  Lightbulb,
  ListChecks,
  MessageSquareMore,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserCheck,
} from "lucide-react";
import { CodeBlock, HashLink } from "@/src/components";
import { useI18n } from "@/src/i18n";
import {
  BUILT_IN_EXAMPLES,
  type BuiltInExampleId,
} from "@/src/utils/caseIntake";

interface ExampleCardDescriptor {
  id: BuiltInExampleId;
  badge: string;
  title: string;
  description: string;
  expectedBehavior: string;
  icon: typeof Code2;
  toneBg: string;
  toneBorder: string;
  toneText: string;
}

export function HelpExamplesScreen() {
  const { dir, t } = useI18n();
  const ForwardArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const exampleCards: ExampleCardDescriptor[] = [
    {
      id: "syntax",
      badge: t.help.exampleSyntaxBadge,
      title: t.help.exampleSyntaxTitle,
      description: t.help.exampleSyntaxDesc,
      expectedBehavior: t.help.exampleSyntaxExpected,
      icon: Code2,
      toneBg: "var(--dd-demo-bg)",
      toneBorder: "var(--dd-demo-border)",
      toneText: "var(--dd-demo-text)",
    },
    {
      id: "runtime",
      badge: t.help.exampleRuntimeBadge,
      title: t.help.exampleRuntimeTitle,
      description: t.help.exampleRuntimeDesc,
      expectedBehavior: t.intake.exampleExpectedBehavior,
      icon: Terminal,
      toneBg: "var(--dd-danger-bg)",
      toneBorder: "var(--dd-danger-border)",
      toneText: "var(--dd-danger-text)",
    },
    {
      id: "logic",
      badge: t.help.exampleLogicBadge,
      title: t.help.exampleLogicTitle,
      description: t.help.exampleLogicDesc,
      expectedBehavior: t.help.exampleLogicExpected,
      icon: GitCompare,
      toneBg: "var(--dd-info-bg)",
      toneBorder: "var(--dd-info-border)",
      toneText: "var(--dd-info-text)",
    },
  ];

  const levels = [
    {
      level: 1,
      icon: HelpCircle,
      name: t.workspace.level1Name,
      gives: t.workspace.level1Gives,
      withholds: t.workspace.level1Withholds,
    },
    {
      level: 2,
      icon: Lightbulb,
      name: t.workspace.level2Name,
      gives: t.workspace.level2Gives,
      withholds: t.workspace.level2Withholds,
    },
    {
      level: 3,
      icon: ListChecks,
      name: t.workspace.level3Name,
      gives: t.workspace.level3Gives,
      withholds: t.workspace.level3Withholds,
    },
    {
      level: 4,
      icon: Eye,
      name: t.workspace.level4Name,
      gives: t.workspace.level4Gives,
      withholds: t.workspace.level4Withholds,
    },
  ];

  const limits = [
    {
      title: t.help.limit1Title,
      body: t.help.limit1Body,
    },
    {
      title: t.help.limit2Title,
      body: t.help.limit2Body,
    },
    {
      title: t.help.limit3Title,
      body: t.help.limit3Body,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--dd-text)", textWrap: "balance" }}
          >
            {t.help.title}
          </h1>
          <p
            className="mt-2 max-w-3xl text-sm leading-relaxed sm:text-base"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.help.subtitle}
          </p>
        </div>

        <HashLink
          to="/new"
          className="inline-flex min-h-[42px] items-center gap-2 self-start rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap dd-theme-transition hover:opacity-90 sm:self-auto"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border)",
            color: "var(--dd-text)",
          }}
        >
          <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.help.startBlankBtn}</span>
        </HashLink>
      </div>

      {/* Section 1: Built-in Example Cases (Syntax, Runtime, Logic without traceback) */}
      <section aria-labelledby="help-examples-heading">
        <div>
          <h2
            id="help-examples-heading"
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--dd-text)" }}
          >
            {t.help.examplesHeading}
          </h2>
          <p
            className="mt-1.5 text-sm leading-relaxed"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.help.examplesSubtitle}
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {exampleCards.map((card) => {
            const meta = BUILT_IN_EXAMPLES[card.id];
            const BadgeIcon = card.icon;

            return (
              <article
                key={card.id}
                className="flex flex-col justify-between rounded-xl border p-5 dd-theme-transition"
                style={{
                  backgroundColor: "var(--dd-surface)",
                  borderColor: "var(--dd-border-subtle)",
                }}
              >
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: card.toneBg,
                      borderColor: card.toneBorder,
                      color: card.toneText,
                    }}
                  >
                    <BadgeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{card.badge}</span>
                  </span>

                  <h3
                    className="mt-3 text-base font-bold leading-snug"
                    style={{ color: "var(--dd-text)" }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: "var(--dd-text-secondary)" }}
                  >
                    {card.description}
                  </p>

                  <div className="mt-4">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--dd-text-muted)" }}
                    >
                      {t.help.exampleCodeLabel}
                    </p>
                    <div className="mt-1.5">
                      <CodeBlock code={meta.code} variant="code" />
                    </div>
                  </div>

                  {meta.noTraceback ? (
                    <div className="mt-3.5">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--dd-text-muted)" }}
                      >
                        {t.help.exampleLogicEvidenceLabel}
                      </p>
                      <pre
                        dir="ltr"
                        className="mt-1.5 overflow-x-auto rounded-lg border px-3 py-2 text-left font-mono text-xs leading-5"
                        style={{
                          backgroundColor: "var(--dd-code-bg)",
                          borderColor: "var(--dd-code-border)",
                          color: "var(--dd-code-text)",
                        }}
                      >
                        {`${t.workspace.sampleInputFieldLabel}: ${meta.sampleInput}\n${t.workspace.actualOutputFieldLabel}: ${meta.actualOutput}`}
                      </pre>
                    </div>
                  ) : (
                    <div className="mt-3.5">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--dd-text-muted)" }}
                      >
                        {t.help.exampleTracebackLabel}
                      </p>
                      <div className="mt-1.5">
                        <CodeBlock
                          code={meta.error}
                          variant="traceback"
                          showLineNumbers={false}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3.5">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--dd-text-muted)" }}
                    >
                      {t.help.exampleExpectedLabel}
                    </p>
                    <p
                      className="mt-1 text-xs leading-relaxed"
                      style={{ color: "var(--dd-text)" }}
                    >
                      {card.expectedBehavior}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--dd-border-subtle)" }}>
                  <HashLink
                    to={`/new?example=${card.id}`}
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap dd-theme-transition hover:opacity-95"
                    style={{
                      backgroundColor: "var(--dd-accent)",
                      color: "var(--dd-accent-on)",
                    }}
                  >
                    <span>{t.help.loadExampleBtn}</span>
                    <ForwardArrow className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </HashLink>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 2: Assistance Levels & Investigation Paths */}
      <section aria-labelledby="help-levels-paths-heading">
        <h2
          id="help-levels-paths-heading"
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--dd-text)" }}
        >
          {t.help.levelsAndPathsHeading}
        </h2>

        <div className="mt-5 grid gap-6 lg:grid-cols-12">
          {/* Four Assistance Levels */}
          <div
            className="rounded-xl border p-5 sm:p-6 lg:col-span-7 dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-border-subtle)",
            }}
          >
            <h3
              className="text-base font-bold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.help.levelsHeading}
            </h3>
            <p
              className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed"
              style={{ color: "var(--dd-text-muted)" }}
            >
              <ShieldCheck
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--dd-accent-text)" }}
                aria-hidden="true"
              />
              <span>{t.help.levelsNote}</span>
            </p>

            <div className="mt-4 space-y-3">
              {levels.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.level}
                    className="rounded-lg border p-3.5"
                    style={{
                      backgroundColor: "var(--dd-bg-subtle)",
                      borderColor: "var(--dd-border-subtle)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--dd-accent-text)" }}
                        aria-hidden="true"
                      />
                      <h4
                        className="text-sm font-semibold"
                        style={{ color: "var(--dd-text)" }}
                      >
                        <span className="font-mono tabular-nums">
                          {item.level}.
                        </span>{" "}
                        {item.name}
                      </h4>
                    </div>
                    <p
                      className="mt-1.5 text-xs leading-relaxed"
                      style={{ color: "var(--dd-text-secondary)" }}
                    >
                      <span className="font-semibold">
                        {t.workspace.givesLabel}:{" "}
                      </span>
                      {item.gives}
                    </p>
                    <p
                      className="mt-0.5 text-xs leading-relaxed"
                      style={{ color: "var(--dd-text-muted)" }}
                    >
                      <span className="font-semibold">
                        {t.workspace.withholdsLabel}:{" "}
                      </span>
                      {item.withholds}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two Investigation Paths */}
          <div
            className="rounded-xl border p-5 sm:p-6 lg:col-span-5 dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-border-subtle)",
            }}
          >
            <h3
              className="text-base font-bold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.help.pathsHeading}
            </h3>
            <p
              className="mt-1 text-xs leading-relaxed"
              style={{ color: "var(--dd-text-muted)" }}
            >
              {t.help.pathsNote}
            </p>

            <div className="mt-4 space-y-4">
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--dd-bg-subtle)",
                  borderColor: "var(--dd-border-subtle)",
                }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquareMore
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--dd-accent-text)" }}
                    aria-hidden="true"
                  />
                  <h4
                    className="text-sm font-bold"
                    style={{ color: "var(--dd-text)" }}
                  >
                    {t.workspace.pathConversationTitle}
                  </h4>
                </div>
                <p
                  className="mt-1 text-xs font-semibold"
                  style={{ color: "var(--dd-accent-text)" }}
                >
                  {t.workspace.pathConversationSummary}
                </p>
                <p
                  className="mt-1.5 text-xs leading-relaxed"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {t.workspace.pathConversationDesc}
                </p>
              </div>

              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--dd-bg-subtle)",
                  borderColor: "var(--dd-border-subtle)",
                }}
              >
                <div className="flex items-center gap-2">
                  <LayoutList
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--dd-accent-text)" }}
                    aria-hidden="true"
                  />
                  <h4
                    className="text-sm font-bold"
                    style={{ color: "var(--dd-text)" }}
                  >
                    {t.workspace.pathHypothesisTitle}
                  </h4>
                </div>
                <p
                  className="mt-1 text-xs font-semibold"
                  style={{ color: "var(--dd-accent-text)" }}
                >
                  {t.workspace.pathHypothesisSummary}
                </p>
                <p
                  className="mt-1.5 text-xs leading-relaxed"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {t.workspace.pathHypothesisDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Limits of the Tool & Section 4: Human-Handover Policy */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Limits of the Tool */}
        <section
          aria-labelledby="help-limits-heading"
          className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-demo-border)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: "var(--dd-demo-bg)",
                borderColor: "var(--dd-demo-border)",
                color: "var(--dd-demo-text)",
              }}
            >
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="help-limits-heading"
                className="text-lg font-bold tracking-tight"
                style={{ color: "var(--dd-text)" }}
              >
                {t.help.limitsHeading}
              </h2>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text-muted)" }}
              >
                {t.help.limitsSubtitle}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {limits.map((limit) => (
              <li
                key={limit.title}
                className="flex items-start gap-2.5 rounded-lg border p-3.5"
                style={{
                  backgroundColor: "var(--dd-bg-subtle)",
                  borderColor: "var(--dd-border-subtle)",
                }}
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--dd-demo-text)" }}
                  aria-hidden="true"
                />
                <div>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--dd-text)" }}
                  >
                    {limit.title}
                  </h3>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: "var(--dd-text-secondary)" }}
                  >
                    {limit.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Human-Handover Policy */}
        <section
          aria-labelledby="help-handover-heading"
          className="rounded-xl border p-5 sm:p-6 dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-info-border)",
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
                id="help-handover-heading"
                className="text-lg font-bold tracking-tight"
                style={{ color: "var(--dd-text)" }}
              >
                {t.help.handoverHeading}
              </h2>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text-secondary)" }}
              >
                {t.help.handoverBody}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div
              className="rounded-lg border p-3.5"
              style={{
                backgroundColor: "var(--dd-bg-subtle)",
                borderColor: "var(--dd-border-subtle)",
              }}
            >
              <h3
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                <UserCheck
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--dd-accent-text)" }}
                  aria-hidden="true"
                />
                <span>{t.help.handoverRule1Title}</span>
              </h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text-secondary)" }}
              >
                {t.help.handoverRule1Body}
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
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                <BookOpen
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--dd-accent-text)" }}
                  aria-hidden="true"
                />
                <span>{t.help.handoverRule2Title}</span>
              </h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text-secondary)" }}
              >
                {t.help.handoverRule2Body}
              </p>
              <a
                href="https://docs.python.org/3/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline"
                style={{ color: "var(--dd-accent-text)" }}
              >
                <span>{t.help.openPythonDocsBtn}</span>
                <ExternalLink
                  className="h-3 w-3 shrink-0 rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </a>
            </div>

            <div
              className="rounded-lg border p-3.5"
              style={{
                backgroundColor: "var(--dd-bg-subtle)",
                borderColor: "var(--dd-border-subtle)",
              }}
            >
              <h3
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                <ShieldCheck
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--dd-accent-text)" }}
                  aria-hidden="true"
                />
                <span>{t.help.handoverRule3Title}</span>
              </h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--dd-text-secondary)" }}
              >
                {t.help.handoverRule3Body}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
