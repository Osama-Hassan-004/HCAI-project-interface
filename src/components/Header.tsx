import { useState } from "react";
import { Languages, Menu, Moon, SearchCode, Sun, X } from "lucide-react";
import { useI18n } from "@/src/i18n";
import { useTheme } from "@/src/theme";
import { HashLink, type AppRoute } from "./Router";

interface HeaderProps {
  route: AppRoute;
}

export function Header({ route }: HeaderProps) {
  const { lang, t, toggleLanguage } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: t.nav.home, active: route.name === "home" },
    { to: "/new", label: t.nav.newInvestigation, active: route.name === "new" },
    {
      to: "/investigations",
      label: t.nav.myInvestigations,
      active:
        route.name === "investigations" ||
        route.name === "investigation_detail",
    },
    { to: "/help", label: t.nav.helpExamples, active: route.name === "help" },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className="sticky top-0 z-30 border-b dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-surface)",
        borderColor: "var(--dd-border-subtle)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 lg:gap-8">
        {/* Zone 1: Brand wordmark */}
        <HashLink
          to="/"
          onClick={closeMenu}
          className="inline-flex min-h-[40px] min-w-0 items-center gap-2 text-sm font-bold tracking-tight sm:gap-2.5 sm:text-lg"
          style={{ color: "var(--dd-text)" }}
        >
          <SearchCode
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--dd-accent)" }}
            aria-hidden="true"
          />
          <span className="truncate">{t.app.name}</span>
        </HashLink>

        {/* Zone 2: Desktop Navigation */}
        <nav
          aria-label={t.nav.primaryNavLabel}
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => (
            <HashLink
              key={item.to}
              to={item.to}
              aria-current={item.active ? "page" : undefined}
              className="relative inline-flex min-h-[40px] items-center whitespace-nowrap shrink-0 transition-colors duration-150"
              style={{
                color: item.active
                  ? "var(--dd-accent-text)"
                  : "var(--dd-text-muted)",
              }}
            >
              <span>{item.label}</span>
              {item.active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-[13px] h-[2px]"
                  style={{ backgroundColor: "var(--dd-accent)" }}
                />
              ) : null}
            </HashLink>
          ))}
        </nav>

        {/* Zone 3: Theme & Language Controls + Mobile Menu Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDark ? t.controls.themeToggleToLight : t.controls.themeToggleToDark
            }
            title={
              isDark ? t.controls.themeToggleToLight : t.controls.themeToggleToDark
            }
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer dd-theme-transition hover:opacity-90 sm:gap-2 sm:px-3"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border-subtle)",
              color: "var(--dd-text-secondary)",
            }}
          >
            {isDark ? (
              <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isDark ? t.controls.themeLabelDark : t.controls.themeLabelLight}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={
              lang === "en"
                ? t.controls.switchToArabic
                : t.controls.switchToEnglish
            }
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer dd-theme-transition hover:opacity-90 sm:gap-2 sm:px-3"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border-subtle)",
              color: "var(--dd-text-secondary)",
            }}
          >
            <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {lang === "en"
                ? t.controls.switchToArabic
                : t.controls.switchToEnglish}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-primary-nav"
            aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border md:hidden cursor-pointer dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface-muted)",
              borderColor: "var(--dd-border-subtle)",
              color: "var(--dd-text)",
            }}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Navigation Drawer */}
      {mobileMenuOpen ? (
        <nav
          id="mobile-primary-nav"
          aria-label={t.nav.mobileNavLabel}
          className="border-t px-4 py-3 md:hidden dd-theme-transition"
          style={{
            backgroundColor: "var(--dd-surface)",
            borderColor: "var(--dd-border-subtle)",
          }}
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <HashLink
                  to={item.to}
                  onClick={closeMenu}
                  aria-current={item.active ? "page" : undefined}
                  className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium dd-theme-transition"
                  style={{
                    backgroundColor: item.active
                      ? "var(--dd-accent-soft)"
                      : "transparent",
                    color: item.active
                      ? "var(--dd-accent-text)"
                      : "var(--dd-text-secondary)",
                  }}
                >
                  {item.label}
                </HashLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
