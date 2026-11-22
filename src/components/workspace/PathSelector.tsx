import { ArrowLeft, ArrowRight, LayoutList, MessageSquareMore } from "lucide-react";
import { useI18n } from "@/src/i18n";
import type { Path } from "@/src/types";

interface PathSelectorProps {
  onSelectPath: (path: Path) => void;
}

export function PathSelector({ onSelectPath }: PathSelectorProps) {
  const { dir, t } = useI18n();
  const ForwardArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const pathCards: Array<{
    path: Path;
    icon: typeof MessageSquareMore;
    title: string;
    summary: string;
    description: string;
    actionLabel: string;
  }> = [
    {
      path: "conversation",
      icon: MessageSquareMore,
      title: t.workspace.pathConversationTitle,
      summary: t.workspace.pathConversationSummary,
      description: t.workspace.pathConversationDesc,
      actionLabel: t.workspace.pathConversationSelectBtn,
    },
    {
      path: "hypothesis_board",
      icon: LayoutList,
      title: t.workspace.pathHypothesisTitle,
      summary: t.workspace.pathHypothesisSummary,
      description: t.workspace.pathHypothesisDesc,
      actionLabel: t.workspace.pathHypothesisSelectBtn,
    },
  ];

  return (
    <section
      aria-labelledby="path-selector-heading"
      className="rounded-xl border p-6 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <h2
        id="path-selector-heading"
        className="text-xl font-bold tracking-tight"
        style={{ color: "var(--dd-text)" }}
      >
        {t.workspace.pathSelectorHeading}
      </h2>
      <p
        className="mt-1.5 text-sm leading-relaxed"
        style={{ color: "var(--dd-text-secondary)" }}
      >
        {t.workspace.pathSelectorSubtitle}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {pathCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              type="button"
              onClick={() => onSelectPath(card.path)}
              className="group flex flex-col justify-between rounded-xl border p-5 text-start cursor-pointer dd-theme-transition hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--dd-bg-subtle)",
                borderColor: "var(--dd-border)",
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
                  className="mt-4 text-base font-bold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {card.title}
                </h3>

                <p
                  className="mt-1 text-xs font-semibold"
                  style={{ color: "var(--dd-accent-text)" }}
                >
                  {card.summary}
                </p>

                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--dd-text-muted)" }}
                >
                  {card.description}
                </p>
              </div>

              <div
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: "var(--dd-accent-text)" }}
              >
                <span>{card.actionLabel}</span>
                <ForwardArrow
                  className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface PersistentPathToggleProps {
  activePath: Path;
  onSwitchPath: (path: Path) => void;
}

export function PersistentPathToggle({
  activePath,
  onSwitchPath,
}: PersistentPathToggleProps) {
  const { t } = useI18n();

  const options: Array<{
    path: Path;
    icon: typeof MessageSquareMore;
    label: string;
  }> = [
    {
      path: "conversation",
      icon: MessageSquareMore,
      label: t.workspace.pathConversationTitle,
    },
    {
      path: "hypothesis_board",
      icon: LayoutList,
      label: t.workspace.pathHypothesisTitle,
    },
  ];

  return (
    <div
      role="group"
      aria-label={t.workspace.pathSwitchLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-lg border p-1 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-bg-subtle)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = opt.path === activePath;
        return (
          <button
            key={opt.path}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSwitchPath(opt.path)}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer dd-theme-transition"
            style={{
              backgroundColor: isActive
                ? "var(--dd-surface)"
                : "transparent",
              color: isActive
                ? "var(--dd-accent-text)"
                : "var(--dd-text-muted)",
              boxShadow: isActive
                ? "0 1px 2px rgba(15, 23, 42, 0.08)"
                : "none",
            }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
