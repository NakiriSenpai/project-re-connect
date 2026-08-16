import { type ReactNode } from "react";

/**
 * Shell Exam/Review Workspace (Sprint 22 — redesign UI).
 *
 * Struktur: HEADER → CONTENT (scroll) → BOTTOM ACTIONS.
 * Tidak ada panel samping; Daftar Soal selalu berupa modal terpusat.
 */
export function WorkspaceShell({
  header,
  footer,
  overlay,
  contentBlurred,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  /** Overlay secure mode. */
  overlay?: ReactNode;
  contentBlurred?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex w-full select-none flex-col overflow-hidden bg-background text-foreground"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
    >
      <div
        className={
          "flex min-h-0 flex-1 flex-col " +
          (contentBlurred ? "pointer-events-none select-none blur-md" : "")
        }
        aria-hidden={contentBlurred || undefined}
        inert={contentBlurred || undefined}
      >
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card px-3 py-2.5 sm:px-4">
          {header}
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {children}
        </main>

        {footer ? (
          <footer
            className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border bg-card px-3 py-2.5 sm:px-4"
            style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
          >
            {footer}
          </footer>
        ) : null}
      </div>

      {overlay}
    </div>
  );
}

/**
 * Body: portrait = satu kolom (soal lalu jawaban);
 * landscape = dua kolom (soal kiri lebih lebar, jawaban kanan).
 *
 * `layout` adalah preferensi tampilan user (bukan rotasi fisik). Bila tidak
 * diberikan, layout mengikuti orientasi/ukuran viewport nyata.
 */
export function WorkspaceBody({
  question,
  answers,
  explanation,
  layout,
}: {
  question: ReactNode;
  answers: ReactNode;
  explanation?: ReactNode;
  layout?: "portrait" | "landscape";
}) {
  const columns =
    layout === "portrait"
      ? "grid-cols-1"
      : layout === "landscape"
        ? "grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
        : "grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] landscape:max-lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]";

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-3 sm:gap-4">
      <div className={"grid min-w-0 items-start gap-3 sm:gap-4 " + columns}>
        <div className="min-w-0">{question}</div>
        <div className="min-w-0">{answers}</div>
      </div>

      {explanation ? <div className="min-w-0">{explanation}</div> : null}
    </div>
  );
}
