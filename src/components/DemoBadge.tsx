import { FlaskConical } from "lucide-react";
import { useI18n } from "@/src/i18n";

interface DemoBadgeProps {
  isDemo: boolean;
  className?: string;
}

export function DemoBadge({ isDemo, className = "" }: DemoBadgeProps) {
  const { t } = useI18n();

  if (!isDemo) {
    return null;
  }

  return (
    <div
      role="status"
      title={t.demo.badgeHint}
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium dd-theme-transition ${className}`}
      style={{
        backgroundColor: "var(--dd-demo-bg)",
        borderColor: "var(--dd-demo-border)",
        color: "var(--dd-demo-text)",
      }}
    >
      <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{t.demo.badgeText}</span>
    </div>
  );
}
