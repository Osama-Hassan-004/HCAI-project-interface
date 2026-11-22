import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  UserCheck,
  WifiOff,
} from "lucide-react";
import { useI18n } from "@/src/i18n";
import type { Investigation } from "@/src/types";

import type { DebugFallbackReason } from "@/src/services/api";

interface TimeoutFallbackBannerProps {
  reason?: DebugFallbackReason;
  onTryAgain: () => void;
  onOpenHandover: () => void;
}

export function TimeoutFallbackBanner({
  reason = "timeout",
  onTryAgain,
  onOpenHandover,
}: TimeoutFallbackBannerProps) {
  const { t } = useI18n();

  const copyByReason: Record<
    DebugFallbackReason,
    { title: string; message: string }
  > = {
    timeout: {
      title: t.fallback.timeoutTitle,
      message: t.fallback.timeoutMessage,
    },
    401: {
      title: t.fallback.authErrorTitle,
      message: t.fallback.authErrorMessage,
    },
    422: {
      title: t.fallback.validationErrorTitle,
      message: t.fallback.validationErrorMessage,
    },
    502: {
      title: t.fallback.badGatewayTitle,
      message: t.fallback.badGatewayMessage,
    },
  };

  const activeCopy = copyByReason[reason] ?? copyByReason.timeout;

  return (
    <div
      role="alert"
      className="rounded-xl border p-4 sm:p-5 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-danger-bg)",
        borderColor: "var(--dd-danger-border)",
        color: "var(--dd-danger-text)",
      }}
    >
      <div className="flex items-start gap-3">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">{activeCopy.title}</h3>
          <p className="mt-1 text-sm leading-relaxed">{activeCopy.message}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer dd-theme-transition hover:opacity-95"
              style={{
                backgroundColor: "var(--dd-accent)",
                color: "var(--dd-accent-on)",
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.fallback.actionTryAgain}</span>
            </button>

            <a
              href="https://docs.python.org/3/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-danger-border)",
                color: "var(--dd-text)",
              }}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.fallback.actionOpenDocs}</span>
              <ExternalLink
                className="h-3 w-3 shrink-0 rtl:-scale-x-100"
                aria-hidden="true"
              />
            </a>

            <button
              type="button"
              onClick={onOpenHandover}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-danger-border)",
                color: "var(--dd-text)",
              }}
            >
              <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.fallback.actionAskInstructor}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InsufficientEvidenceNoticeProps {
  investigation: Investigation;
  missingInfo?: string[];
  onOpenHandover: () => void;
}

export function InsufficientEvidenceNotice({
  investigation,
  missingInfo = [],
  onOpenHandover,
}: InsufficientEvidenceNoticeProps) {
  const { t } = useI18n();

  const knownItems: string[] = [];
  if (investigation.case.code.trim()) {
    knownItems.push(t.fallback.knownCodePresent);
  }
  if (investigation.case.error.trim()) {
    knownItems.push(t.fallback.knownErrorPresent);
  }
  if (investigation.case.expectedBehavior.trim()) {
    knownItems.push(t.fallback.knownExpectedPresent);
  }
  if (investigation.case.actualOutput?.trim()) {
    knownItems.push(t.fallback.knownOutputPresent);
  }

  const unknownItems =
    missingInfo.length > 0 ? missingInfo : [t.fallback.unknownRuntimeFallback];

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border p-4 sm:p-5 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-demo-bg)",
        borderColor: "var(--dd-demo-border)",
        color: "var(--dd-demo-text)",
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">{t.fallback.insufficientTitle}</h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div
              className="rounded-lg border p-3 text-xs"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-border-subtle)",
                color: "var(--dd-text)",
              }}
            >
              <p className="font-semibold">{t.fallback.knownHeading}</p>
              {knownItems.length > 0 ? (
                <ul className="mt-1.5 list-disc space-y-1 ps-4">
                  {knownItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1" style={{ color: "var(--dd-text-muted)" }}>
                  {t.workspace.notProvided}
                </p>
              )}
            </div>

            <div
              className="rounded-lg border p-3 text-xs"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-border-subtle)",
                color: "var(--dd-text)",
              }}
            >
              <p className="font-semibold">{t.fallback.unknownHeading}</p>
              <ul className="mt-1.5 list-disc space-y-1 ps-4">
                {unknownItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed">
            <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.fallback.insufficientNoGuessNote}</span>
          </p>

          <div className="mt-3">
            <button
              type="button"
              onClick={onOpenHandover}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface)",
                borderColor: "var(--dd-demo-border)",
                color: "var(--dd-text)",
              }}
            >
              <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t.fallback.recommendHandoverBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
