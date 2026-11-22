import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Clock,
  Download,
  FilePlus2,
  FolderOpen,
  LayoutList,
  Loader2,
  MessageSquareMore,
  Pencil,
  Search,
  Share2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { HashLink } from "@/src/components";
import { useI18n } from "@/src/i18n";
import {
  getLastStorageRecoveryReport,
  investigationRepository,
  serializeInvestigationExport,
} from "@/src/storage";
import type {
  AssistanceLevel,
  Investigation,
  InvestigationStatus,
} from "@/src/types";

type StatusFilter = InvestigationStatus | "all";

export function MyInvestigationsScreen() {
  const { dir, lang, t } = useI18n();
  const ForwardArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [items, setItems] = useState<Investigation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<Investigation | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const [skippedCorruptCount, setSkippedCorruptCount] = useState(0);

  const deleteCancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      const [filtered, allItems] = await Promise.all([
        investigationRepository.list({
          status: statusFilter,
          search: searchQuery,
        }),
        investigationRepository.list(),
      ]);
      setItems(filtered);
      setTotalCount(allItems.length);
      setSkippedCorruptCount(getLastStorageRecoveryReport().skippedCorruptCount);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (!pendingDeleteItem) {
      return;
    }
    deleteCancelBtnRef.current?.focus();
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setPendingDeleteItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDeleteItem]);

  const getStatusMeta = (status: InvestigationStatus) => {
    switch (status) {
      case "resolved":
        return {
          icon: CheckCircle2,
          label: t.workspace.statusResolved,
          bg: "var(--dd-success-bg)",
          border: "var(--dd-success-border)",
          text: "var(--dd-success-text)",
        };
      case "unresolved":
        return {
          icon: AlertCircle,
          label: t.workspace.statusUnresolved,
          bg: "var(--dd-demo-bg)",
          border: "var(--dd-demo-border)",
          text: "var(--dd-demo-text)",
        };
      case "handed_over":
        return {
          icon: Share2,
          label: t.workspace.statusHandedOver,
          bg: "var(--dd-info-bg)",
          border: "var(--dd-info-border)",
          text: "var(--dd-info-text)",
        };
      case "open":
      default:
        return {
          icon: CircleDot,
          label: t.workspace.statusOpen,
          bg: "var(--dd-info-bg)",
          border: "var(--dd-info-border)",
          text: "var(--dd-info-text)",
        };
    }
  };

  const getLevelLabel = (level: AssistanceLevel): string => {
    switch (level) {
      case 1:
        return `${t.workspace.levelPrefix} 1 · ${t.workspace.level1Name}`;
      case 2:
        return `${t.workspace.levelPrefix} 2 · ${t.workspace.level2Name}`;
      case 3:
        return `${t.workspace.levelPrefix} 3 · ${t.workspace.level3Name}`;
      case 4:
        return `${t.workspace.levelPrefix} 4 · ${t.workspace.level4Name}`;
    }
  };

  const formatDateTime = (iso: string): string => {
    try {
      return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const startRename = (item: Investigation) => {
    setRenamingId(item.id);
    setRenameValue(item.title);
    setRenameError(null);
  };

  const handleRenameSubmit = async (
    event: FormEvent<HTMLFormElement>,
    item: Investigation
  ) => {
    event.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError(t.investigations.renameRequiredError);
      return;
    }
    setIsMutating(true);
    try {
      await investigationRepository.save({
        ...item,
        title: trimmed,
        updatedAt: new Date().toISOString(),
      });
      setRenamingId(null);
      setRenameValue("");
      setRenameError(null);
      setLiveAnnouncement(
        t.investigations.renamedAnnouncement.replace("{title}", trimmed)
      );
      await refreshList();
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteItem || isMutating) {
      return;
    }
    const deletedTitle = pendingDeleteItem.title;
    setIsMutating(true);
    try {
      await investigationRepository.delete(pendingDeleteItem.id);
      setPendingDeleteItem(null);
      setLiveAnnouncement(
        t.investigations.deletedAnnouncement.replace("{title}", deletedTitle)
      );
      await refreshList();
    } finally {
      setIsMutating(false);
    }
  };

  const handleExportJson = (item: Investigation) => {
    const json = serializeInvestigationExport(item);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `debugging-detective-${safeId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportNotice(
      t.investigations.exportSuccessNotice.replace("{title}", item.title)
    );
  };

  const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: t.investigations.filterAll },
    { value: "open", label: t.workspace.statusOpen },
    { value: "resolved", label: t.workspace.statusResolved },
    { value: "unresolved", label: t.workspace.statusUnresolved },
    { value: "handed_over", label: t.workspace.statusHandedOver },
  ];

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== "all";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--dd-text)", textWrap: "balance" }}
            >
              {t.investigations.title}
            </h1>
            <span
              className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tabular-nums"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text-secondary)",
              }}
            >
              {t.investigations.countLabel.replace(
                "{count}",
                String(totalCount)
              )}
            </span>
          </div>
          <p
            className="mt-2 max-w-2xl text-sm leading-relaxed"
            style={{ color: "var(--dd-text-secondary)" }}
          >
            {t.investigations.subtitle}
          </p>
        </div>

        <HashLink
          to="/new"
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap dd-theme-transition hover:opacity-95 sm:self-auto"
          style={{
            backgroundColor: "var(--dd-accent)",
            color: "var(--dd-accent-on)",
          }}
        >
          <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.investigations.startNewBtn}</span>
        </HashLink>
      </div>

      {/* Search & Status Filter Toolbar */}
      <div
        className="mt-6 rounded-xl border p-4 sm:p-5 dd-theme-transition"
        style={{
          backgroundColor: "var(--dd-surface)",
          borderColor: "var(--dd-border-subtle)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="investigations-search" className="sr-only">
              {t.investigations.searchLabel}
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 start-3.5"
              style={{ color: "var(--dd-text-muted)" }}
              aria-hidden="true"
            />
            <input
              id="investigations-search"
              type="search"
              dir={dir}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.investigations.searchPlaceholder}
              className="min-h-[42px] w-full rounded-lg border ps-10 pe-3.5 py-2 text-sm dd-theme-transition"
              style={{
                backgroundColor: "var(--dd-bg)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div
            role="group"
            aria-label={t.investigations.filterStatusLabel}
            className="flex flex-wrap items-center gap-2"
          >
            {statusFilterOptions.map((option) => {
              const active = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(option.value)}
                  className="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                  style={{
                    backgroundColor: active
                      ? "var(--dd-accent-soft)"
                      : "var(--dd-surface-muted)",
                    borderColor: active
                      ? "var(--dd-accent)"
                      : "var(--dd-border)",
                    color: active
                      ? "var(--dd-accent-text)"
                      : "var(--dd-text-secondary)",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Corrupt Storage Recovery Notice */}
      {skippedCorruptCount > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--dd-demo-bg)",
            borderColor: "var(--dd-demo-border)",
            color: "var(--dd-demo-text)",
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {t.investigations.corruptNotice.replace(
              "{count}",
              String(skippedCorruptCount)
            )}
          </span>
        </div>
      ) : null}

      {/* Export Confirmation Banner */}
      {exportNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--dd-success-bg)",
            borderColor: "var(--dd-success-border)",
            color: "var(--dd-success-text)",
          }}
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{exportNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="underline-offset-2 hover:underline cursor-pointer"
          >
            {t.investigations.renameCancelBtn}
          </button>
        </div>
      ) : null}

      {/* Investigations List / Loading / Empty States */}
      <div className="mt-6">
        {isLoading ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border p-6 dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-border-subtle)",
              color: "var(--dd-text-secondary)",
            }}
          >
            <Loader2
              className="h-5 w-5 shrink-0 animate-spin"
              style={{ color: "var(--dd-accent-text)" }}
              aria-hidden="true"
            />
            <span className="text-sm font-medium">
              {t.investigations.loading}
            </span>
          </div>
        ) : totalCount === 0 ? (
          <div
            className="rounded-xl border p-8 text-center dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-border-subtle)",
            }}
          >
            <FolderOpen
              className="mx-auto h-10 w-10"
              style={{ color: "var(--dd-text-muted)" }}
              aria-hidden="true"
            />
            <h2
              className="mt-4 text-lg font-bold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.investigations.emptyTitle}
            </h2>
            <p
              className="mx-auto mt-2 max-w-md text-sm leading-relaxed"
              style={{ color: "var(--dd-text-secondary)" }}
            >
              {t.investigations.emptyBody}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <HashLink
                to="/new"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap dd-theme-transition hover:opacity-95"
                style={{
                  backgroundColor: "var(--dd-accent)",
                  color: "var(--dd-accent-on)",
                }}
              >
                <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.investigations.startNewBtn}</span>
              </HashLink>
              <HashLink
                to="/help"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap dd-theme-transition hover:opacity-90"
                style={{
                  backgroundColor: "var(--dd-surface-muted)",
                  borderColor: "var(--dd-border)",
                  color: "var(--dd-text)",
                }}
              >
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.investigations.emptyBrowseHelpBtn}</span>
              </HashLink>
            </div>
          </div>
        ) : items.length === 0 && hasActiveFilters ? (
          <div
            className="rounded-xl border p-8 text-center dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-border-subtle)",
            }}
          >
            <Search
              className="mx-auto h-9 w-9"
              style={{ color: "var(--dd-text-muted)" }}
              aria-hidden="true"
            />
            <h2
              className="mt-3 text-base font-bold"
              style={{ color: "var(--dd-text)" }}
            >
              {t.investigations.noMatchesTitle}
            </h2>
            <p
              className="mx-auto mt-1.5 max-w-md text-sm"
              style={{ color: "var(--dd-text-secondary)" }}
            >
              {t.investigations.noMatchesBody}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold cursor-pointer dd-theme-transition hover:opacity-90"
              style={{
                backgroundColor: "var(--dd-surface-muted)",
                borderColor: "var(--dd-border)",
                color: "var(--dd-text)",
              }}
            >
              {t.investigations.resetFiltersBtn}
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const statusMeta = getStatusMeta(item.status);
              const StatusIcon = statusMeta.icon;
              const isRenaming = renamingId === item.id;
              const PathIcon =
                item.path === "hypothesis_board"
                  ? LayoutList
                  : item.path === "conversation"
                    ? MessageSquareMore
                    : SlidersHorizontal;
              const pathDisplay =
                item.path === "conversation"
                  ? t.workspace.pathConversationTitle
                  : item.path === "hypothesis_board"
                    ? t.workspace.pathHypothesisTitle
                    : t.investigations.pathNotChosen;

              return (
                <li
                  key={item.id}
                  className="rounded-xl border p-5 dd-theme-transition"
                  style={{
                    backgroundColor: "var(--dd-surface)",
                    borderColor: "var(--dd-border-subtle)",
                  }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left / Primary Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: statusMeta.bg,
                            borderColor: statusMeta.border,
                            color: statusMeta.text,
                          }}
                        >
                          <StatusIcon
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{statusMeta.label}</span>
                        </span>

                        <code
                          dir="ltr"
                          className="font-mono text-xs"
                          style={{ color: "var(--dd-text-muted)" }}
                        >
                          {item.id}
                        </code>
                      </div>

                      {isRenaming ? (
                        <form
                          onSubmit={(e) => void handleRenameSubmit(e, item)}
                          noValidate
                          className="mt-3 space-y-2"
                        >
                          <label
                            htmlFor={`rename-input-${item.id}`}
                            className="block text-xs font-semibold"
                            style={{ color: "var(--dd-text)" }}
                          >
                            {t.investigations.renameInputLabel}
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              id={`rename-input-${item.id}`}
                              type="text"
                              dir={dir}
                              value={renameValue}
                              onChange={(e) => {
                                setRenameValue(e.target.value);
                                if (renameError) {
                                  setRenameError(null);
                                }
                              }}
                              className="min-h-[38px] min-w-0 w-full rounded-lg border px-3 py-1.5 text-sm sm:w-auto sm:min-w-[220px] sm:flex-1 dd-theme-transition"
                              style={{
                                backgroundColor: "var(--dd-bg)",
                                borderColor: renameError
                                  ? "var(--dd-danger-border)"
                                  : "var(--dd-border)",
                                color: "var(--dd-text)",
                              }}
                            />
                            <button
                              type="submit"
                              disabled={isMutating}
                              className="inline-flex min-h-[38px] items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer dd-theme-transition hover:opacity-95 disabled:opacity-60"
                              style={{
                                backgroundColor: "var(--dd-accent)",
                                color: "var(--dd-accent-on)",
                              }}
                            >
                              {t.investigations.renameSaveBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingId(null);
                                setRenameError(null);
                              }}
                              className="inline-flex min-h-[38px] items-center rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer dd-theme-transition"
                              style={{
                                backgroundColor: "var(--dd-surface-muted)",
                                borderColor: "var(--dd-border)",
                                color: "var(--dd-text-secondary)",
                              }}
                            >
                              {t.investigations.renameCancelBtn}
                            </button>
                          </div>
                          {renameError ? (
                            <p
                              role="alert"
                              className="flex items-center gap-1.5 text-xs font-medium"
                              style={{ color: "var(--dd-danger-text)" }}
                            >
                              <AlertCircle
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{renameError}</span>
                            </p>
                          ) : null}
                        </form>
                      ) : (
                        <h2
                          className="mt-2.5 text-lg font-bold tracking-tight"
                          style={{ color: "var(--dd-text)" }}
                        >
                          {item.title}
                        </h2>
                      )}

                      {/* Path, Level, Last Updated */}
                      <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <PathIcon
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "var(--dd-accent-text)" }}
                            aria-hidden="true"
                          />
                          <dt
                            className="font-semibold"
                            style={{ color: "var(--dd-text-muted)" }}
                          >
                            {t.investigations.pathLabel}:
                          </dt>
                          <dd style={{ color: "var(--dd-text-secondary)" }}>
                            {pathDisplay}
                          </dd>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <SlidersHorizontal
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "var(--dd-accent-text)" }}
                            aria-hidden="true"
                          />
                          <dt
                            className="font-semibold"
                            style={{ color: "var(--dd-text-muted)" }}
                          >
                            {t.investigations.levelLabel}:
                          </dt>
                          <dd
                            className="tabular-nums"
                            style={{ color: "var(--dd-text-secondary)" }}
                          >
                            {getLevelLabel(item.level)}
                          </dd>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: "var(--dd-text-muted)" }}
                            aria-hidden="true"
                          />
                          <dt
                            className="font-semibold"
                            style={{ color: "var(--dd-text-muted)" }}
                          >
                            {t.investigations.updatedLabel}:
                          </dt>
                          <dd
                            className="tabular-nums"
                            style={{ color: "var(--dd-text-secondary)" }}
                          >
                            {formatDateTime(item.updatedAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Right / Card Actions */}
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <HashLink
                        to={`/investigation/${encodeURIComponent(item.id)}`}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap dd-theme-transition hover:opacity-95"
                        style={{
                          backgroundColor: "var(--dd-accent)",
                          color: "var(--dd-accent-on)",
                        }}
                      >
                        <span>
                          {item.status === "open"
                            ? t.investigations.actionContinue
                            : t.investigations.actionOpen}
                        </span>
                        <ForwardArrow
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      </HashLink>

                      <button
                        type="button"
                        onClick={() => startRename(item)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                        style={{
                          backgroundColor: "var(--dd-surface-muted)",
                          borderColor: "var(--dd-border)",
                          color: "var(--dd-text)",
                        }}
                      >
                        <Pencil
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{t.investigations.actionRename}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportJson(item)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                        style={{
                          backgroundColor: "var(--dd-surface-muted)",
                          borderColor: "var(--dd-border)",
                          color: "var(--dd-text)",
                        }}
                      >
                        <Download
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{t.investigations.actionExportJson}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPendingDeleteItem(item)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                        style={{
                          backgroundColor: "var(--dd-danger-bg)",
                          borderColor: "var(--dd-danger-border)",
                          color: "var(--dd-danger-text)",
                        }}
                      >
                        <Trash2
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{t.investigations.actionDelete}</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p
        className="mt-6 text-xs"
        style={{ color: "var(--dd-text-muted)" }}
      >
        {t.investigations.storageNote}
      </p>

      {/* Delete Confirmation Dialog */}
      {pendingDeleteItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setPendingDeleteItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-investigation-title"
            aria-describedby="delete-investigation-desc"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border p-6 shadow-lg dd-theme-transition"
            style={{
              backgroundColor: "var(--dd-surface)",
              borderColor: "var(--dd-danger-border)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: "var(--dd-danger-bg)",
                  borderColor: "var(--dd-danger-border)",
                  color: "var(--dd-danger-text)",
                }}
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>

              <div>
                <h2
                  id="delete-investigation-title"
                  className="text-base font-bold"
                  style={{ color: "var(--dd-text)" }}
                >
                  {t.investigations.deleteConfirmTitle}
                </h2>
                <p
                  id="delete-investigation-desc"
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--dd-text-secondary)" }}
                >
                  {t.investigations.deleteConfirmBody.replace(
                    "{title}",
                    pendingDeleteItem.title
                  )}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => void handleConfirmDelete()}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-95 disabled:opacity-60"
                    style={{
                      backgroundColor: "var(--dd-danger-bg)",
                      borderColor: "var(--dd-danger-border)",
                      color: "var(--dd-danger-text)",
                    }}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.investigations.deleteConfirmBtn}</span>
                  </button>

                  <button
                    ref={deleteCancelBtnRef}
                    type="button"
                    onClick={() => setPendingDeleteItem(null)}
                    className="inline-flex min-h-[40px] items-center rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer dd-theme-transition hover:opacity-90"
                    style={{
                      backgroundColor: "var(--dd-surface-muted)",
                      borderColor: "var(--dd-border)",
                      color: "var(--dd-text)",
                    }}
                  >
                    {t.investigations.deleteCancelBtn}
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
