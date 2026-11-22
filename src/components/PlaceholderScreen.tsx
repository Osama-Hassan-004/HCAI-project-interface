import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { useI18n } from "@/src/i18n";
import { HashLink } from "./Router";

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
  identifier?: string;
}

export function PlaceholderScreen({
  title,
  subtitle,
  identifier,
}: PlaceholderScreenProps) {
  const { dir, t } = useI18n();
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
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
              backgroundColor: "var(--dd-accent-soft)",
              borderColor: "var(--dd-info-border)",
              color: "var(--dd-accent-text)",
            }}
          >
            <Layers className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--dd-text)" }}
            >
              {title}
            </h1>

            <p
              className="mt-2 text-base leading-relaxed"
              style={{ color: "var(--dd-text-secondary)" }}
            >
              {subtitle}
            </p>

            {identifier ? (
              <div
                className="mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs"
                style={{
                  backgroundColor: "var(--dd-surface-muted)",
                  borderColor: "var(--dd-border-subtle)",
                  color: "var(--dd-text-secondary)",
                }}
              >
                <span>{t.placeholders.investigationIdLabel}:</span>
                <code dir="ltr" className="font-mono font-medium">
                  {identifier}
                </code>
              </div>
            ) : null}

            <div
              className="mt-6 rounded-lg border p-4"
              style={{
                backgroundColor: "var(--dd-bg-subtle)",
                borderColor: "var(--dd-border-subtle)",
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--dd-text)" }}
              >
                {t.placeholders.foundationNoticeTitle}
              </p>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: "var(--dd-text-muted)" }}
              >
                {t.placeholders.foundationNoticeBody}
              </p>
            </div>

            <div className="mt-6">
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
