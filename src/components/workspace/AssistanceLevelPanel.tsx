import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  HelpCircle,
  Lightbulb,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/src/i18n";
import type { AssistanceLevel } from "@/src/types";

interface AssistanceLevelPanelProps {
  currentLevel: AssistanceLevel;
  onSelectLevel: (nextLevel: AssistanceLevel) => void;
  externalLevel4Trigger?: number;
}

interface LevelOptionMeta {
  level: AssistanceLevel;
  icon: typeof HelpCircle;
  name: string;
  gives: string;
  withholds: string;
}

export function AssistanceLevelPanel({
  currentLevel,
  onSelectLevel,
  externalLevel4Trigger = 0,
}: AssistanceLevelPanelProps) {
  const { t } = useI18n();
  const [confirmLevel4Open, setConfirmLevel4Open] = useState(false);

  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const level4CancelRef = useRef<HTMLButtonElement | null>(null);
  const lastExternalTriggerRef = useRef(externalLevel4Trigger);

  useEffect(() => {
    if (externalLevel4Trigger > lastExternalTriggerRef.current) {
      lastExternalTriggerRef.current = externalLevel4Trigger;
      if (currentLevel !== 4) {
        setConfirmLevel4Open(true);
      }
    }
  }, [currentLevel, externalLevel4Trigger]);

  const levels: LevelOptionMeta[] = [
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

  const activeMeta =
    levels.find((item) => item.level === currentLevel) ?? levels[0];
  const ActiveIcon = activeMeta.icon;

  useEffect(() => {
    if (!confirmLevel4Open) {
      return;
    }
    level4CancelRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirmLevel4Open(false);
        optionRefs.current[3]?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmLevel4Open]);

  const handleActivateLevel = (level: AssistanceLevel) => {
    if (level === currentLevel) {
      return;
    }
    if (level === 4) {
      setConfirmLevel4Open(true);
      return;
    }
    onSelectLevel(level);
  };

  const handleRadioKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (index + 1) % levels.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (index - 1 + levels.length) % levels.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = levels.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetButton = optionRefs.current[nextIndex];
      targetButton?.focus();
    }
  };

  const handleConfirmLevel4 = () => {
    setConfirmLevel4Open(false);
    onSelectLevel(4);
    optionRefs.current[3]?.focus();
  };

  const handleCancelLevel4 = () => {
    setConfirmLevel4Open(false);
    optionRefs.current[currentLevel - 1]?.focus();
  };

  return (
    <section
      aria-labelledby="assistance-level-heading"
      className="rounded-xl border p-5 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="assistance-level-heading"
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--dd-text)" }}
          >
            {t.workspace.levelsHeading}
          </h2>
          <p
            className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed"
            style={{ color: "var(--dd-text-muted)" }}
          >
            <ShieldCheck
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--dd-accent-text)" }}
              aria-hidden="true"
            />
            <span>{t.workspace.levelsAgencyRule}</span>
          </p>
        </div>
      </div>

      {/* Prominent Current Level Readout (number + name + icon) */}
      <div
        className="mt-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 dd-theme-transition"
        style={{
          backgroundColor:
            currentLevel === 4 ? "var(--dd-demo-bg)" : "var(--dd-accent-soft)",
          borderColor:
            currentLevel === 4
              ? "var(--dd-demo-border)"
              : "var(--dd-info-border)",
          color:
            currentLevel === 4 ? "var(--dd-demo-text)" : "var(--dd-accent-text)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <ActiveIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold opacity-90">
              {t.workspace.currentLevelLabel}
            </p>
            <p className="text-sm font-bold">
              <span className="tabular-nums">
                {t.workspace.levelPrefix} {activeMeta.level}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{activeMeta.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Accessible Radiogroup of 4 Levels */}
      <div
        role="radiogroup"
        aria-labelledby="assistance-level-heading"
        className="mt-4 space-y-2.5"
      >
        {levels.map((item, index) => {
          const Icon = item.icon;
          const isSelected = item.level === currentLevel;
          return (
            <button
              key={item.level}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleActivateLevel(item.level)}
              onKeyDown={(e) => handleRadioKeyDown(e, index)}
              className="w-full rounded-lg border p-3.5 text-start cursor-pointer dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: isSelected
                  ? "var(--dd-bg-subtle)"
                  : "var(--dd-surface)",
                borderColor: isSelected
                  ? "var(--dd-accent)"
                  : "var(--dd-border-subtle)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: isSelected
                        ? "var(--dd-accent)"
                        : "var(--dd-border)",
                      backgroundColor: isSelected
                        ? "var(--dd-accent)"
                        : "transparent",
                      color: isSelected ? "var(--dd-accent-on)" : "transparent",
                    }}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : null}
                  </span>

                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{
                      color: isSelected
                        ? "var(--dd-accent-text)"
                        : "var(--dd-text-muted)",
                    }}
                    aria-hidden="true"
                  />

                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--dd-text)" }}
                  >
                    <span className="font-mono tabular-nums">
                      {item.level}.
                    </span>{" "}
                    {item.name}
                  </span>
                </div>

                {isSelected ? (
                  <span
                    className="text-xs font-semibold whitespace-nowrap"
                    style={{ color: "var(--dd-accent-text)" }}
                  >
                    {t.workspace.currentLevelLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 space-y-1 ps-7 text-xs leading-relaxed">
                <p style={{ color: "var(--dd-text-secondary)" }}>
                  <span className="font-semibold">
                    {t.workspace.givesLabel}:{" "}
                  </span>
                  {item.gives}
                </p>
                <p style={{ color: "var(--dd-text-muted)" }}>
                  <span className="font-semibold">
                    {t.workspace.withholdsLabel}:{" "}
                  </span>
                  {item.withholds}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explicit Level 4 Confirmation Dialog */}
      {confirmLevel4Open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={handleCancelLevel4}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-level4-title"
            aria-describedby="confirm-level4-desc"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border p-6 shadow-lg dd-theme-transition"
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
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>

              <div>
                <h3
                  id="confirm-level4-title"
                  className="text-base font-bold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {t.workspace.confirmLevel4Title}
                </h3>
                <p
                  id="confirm-level4-desc"
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {t.workspace.confirmLevel4Body}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmLevel4}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95"
                    style={{
                      backgroundColor: "var(--dd-accent)",
                      color: "var(--dd-accent-on)",
                    }}
                  >
                    <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.workspace.confirmLevel4Continue}</span>
                  </button>

                  <button
                    ref={level4CancelRef}
                    type="button"
                    onClick={handleCancelLevel4}
                    className="inline-flex min-h-[40px] items-center rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                    style={{
                      backgroundColor: "var(--dd-surface-muted)",
                      borderColor: "var(--dd-border)",
                      color: "var(--dd-text)",
                    }}
                  >
                    {t.workspace.confirmLevel4Cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
