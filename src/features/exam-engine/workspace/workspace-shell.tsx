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
  gate,
  overlay,
  contentBlurred,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  /** Overlay orientation fallback (non-fatal). */
  gate?: ReactNode;
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
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card px-3 py-2.5 sm:px-4">
        {header}
      </header>

      <main
        className={
          "min-w-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 " +
          (contentBlurred ? "pointer-events-none blur-md" : "")
        }
      >
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

      {gate}
      {overlay}
    </div>
  );
}

/**
 * Body: portrait = satu kolom (soal lalu jawaban);
 * landscape/desktop = dua kolom (soal kiri lebih lebar, jawaban kanan).
 */
export function WorkspaceBody({
  question,
  answers,
  explanation,
}: {
  question: ReactNode;
  answers: ReactNode;
  explanation?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-3 sm:gap-4">
      <div className="grid min-w-0 grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] landscape:max-lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">{question}</div>
        <div className="min-w-0">{answers}</div>
      </div>

      {explanation ? <div className="min-w-0">{explanation}</div> : null}
    </div>
  );
}
