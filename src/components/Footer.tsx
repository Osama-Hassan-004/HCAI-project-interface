import { useI18n } from "@/src/i18n";
import { getActiveApiMode } from "@/src/services/api";

export function Footer() {
  const { t } = useI18n();
  const apiMode = getActiveApiMode();

  return (
    <footer
      className="border-t py-6 dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p style={{ color: "var(--dd-text-muted)" }}>
          {t.footer.philosophyNote}
        </p>
        <p style={{ color: "var(--dd-text-muted)" }}>
          <span>{t.footer.apiModeLabel}: </span>
          <span className="font-medium" style={{ color: "var(--dd-text-secondary)" }}>
            {apiMode === "mock" ? t.footer.apiModeMock : t.footer.apiModeHttp}
          </span>
        </p>
      </div>
    </footer>
  );
}
