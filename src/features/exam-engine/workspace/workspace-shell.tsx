import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shell Exam Workspace (Sprint 11.2 — UNIFIED LAYOUT).
 *
 * SATU parent page flow: HEADER → CONTENT → NAVIGATION.
 * Hanya container terluar yang menjadi page scroll; tidak ada panel
 * dengan tinggi viewport sendiri, tidak ada overlay/fixed pada layout utama.
 */
export function WorkspaceShell({
  header,
  footer,
  aside,
  asideOpen = false,
  gate,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  /** Panel Daftar Soal kiri (desktop/tablet). */
  aside?: ReactNode;
  asideOpen?: boolean;
  /** Overlay orientation/fullscreen gate. */
  gate?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 w-full select-none overflow-y-auto overscroll-contain bg-background text-foreground"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
    >
      <div
        className={cn(
          "grid min-h-full w-full transition-[grid-template-columns] duration-300 ease-out",
          aside && asideOpen ? "grid-cols-[260px_minmax(0,1fr)]" : "grid-cols-[0px_minmax(0,1fr)]",
        )}
      >
        {aside ? (
          <div className="min-w-0 overflow-hidden border-border bg-background-elevated [&:not(:empty)]:border-r">
            <div className="w-[260px] p-3">{asideOpen ? aside : null}</div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex min-w-0 flex-col">
          <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background-elevated px-3 py-2">
            {header}
          </header>

          <main className="min-w-0 flex-1 p-2 sm:p-3">{children}</main>

          {footer ? (
            <footer className="grid min-h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border bg-background-elevated px-3 py-2">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>

      {gate}
    </div>
  );
}

/**
 * Body: SATU row Question + Answer (dua kolom sejajar, tinggi mengikuti konten
 * terbesar). `explanation` (Review) berada SETELAH row tersebut, tetap di
 * document flow yang sama.
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
    <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3">
      <div className="grid min-w-0 grid-cols-1 items-start gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] landscape:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">{question}</div>
        <div className="min-w-0">{answers}</div>
      </div>

      {explanation ? <div className="min-w-0">{explanation}</div> : null}
    </div>
  );
}
