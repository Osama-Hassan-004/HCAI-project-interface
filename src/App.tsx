/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Footer, Header, useHashRoute } from "@/src/components";
import { I18nProvider, useI18n } from "@/src/i18n";
import {
  HelpExamplesScreen,
  HomeScreen,
  InvestigationDetailScreen,
  MyInvestigationsScreen,
  NewInvestigationScreen,
} from "@/src/screens";
import { ThemeProvider } from "@/src/theme";

function AppShell() {
  const { dir, t } = useI18n();
  const { route } = useHashRoute();

  const renderScreen = () => {
    switch (route.name) {
      case "home":
        return <HomeScreen />;
      case "new":
        return (
          <NewInvestigationScreen
            key={route.editId ?? route.exampleId ?? "new"}
            editId={route.editId}
            exampleId={route.exampleId}
          />
        );
      case "investigations":
        return <MyInvestigationsScreen />;
      case "help":
        return <HelpExamplesScreen />;
      case "investigation_detail":
        return <InvestigationDetailScreen id={route.id} />;
      case "not_found":
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div
      dir={dir}
      className="flex min-h-screen flex-col dd-theme-transition"
      style={{
        backgroundColor: "var(--dd-bg)",
        color: "var(--dd-text)",
      }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{
          backgroundColor: "var(--dd-accent)",
          color: "var(--dd-accent-on)",
        }}
      >
        {t.app.skipToContent}
      </a>

      <Header route={route} />

      <main id="main-content" className="flex-1">
        {renderScreen()}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </ThemeProvider>
  );
}
