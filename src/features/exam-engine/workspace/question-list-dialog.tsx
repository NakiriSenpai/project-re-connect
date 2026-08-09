import { Flag } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaletteStatus = "unanswered" | "answered" | "correct" | "wrong";

export type PaletteItem = {
  questionId: string;
  index: number;
  status: PaletteStatus;
  flagged: boolean;
};

export type PaletteGroup = {
  id: string;
  title: string;
  items: PaletteItem[];
};

const statusClass: Record<PaletteStatus, string> = {
  unanswered: "border-border bg-surface text-foreground",
  answered: "border-primary bg-primary text-primary-foreground",
  correct: "border-success bg-success text-success-foreground",
  wrong: "border-destructive bg-destructive text-destructive-foreground",
};

function Legend({ className, text }: { className: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded", className)} /> {text}
    </span>
  );
}

function PaletteLegend({ mode }: { mode: "exam" | "review" }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
      {mode === "exam" ? (
        <>
          <Legend className="bg-primary" text="Sudah dijawab" />
          <Legend className="border border-border bg-surface" text="Belum dijawab" />
        </>
      ) : (
        <>
          <Legend className="bg-success" text="Benar" />
          <Legend className="bg-destructive" text="Salah" />
          <Legend className="border border-border bg-surface" text="Tidak dijawab" />
        </>
      )}
      <span className="flex items-center gap-1.5">
        <Flag className="size-3 text-warning" /> Ditandai
      </span>
    </div>
  );
}

/** Grid nomor soal dikelompokkan per bagian — dipakai panel kiri dan popup. */
export function QuestionListPanel({
  groups,
  activeIndex,
  mode,
  onJump,
  columns = "auto",
}: {
  groups: PaletteGroup[];
  activeIndex: number;
  mode: "exam" | "review";
  onJump: (index: number) => void;
  columns?: "auto" | "compact";
}) {
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Soal (1–{total})
      </p>
      <PaletteLegend mode={mode} />
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.id} className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <div
              className={cn(
                "grid gap-1.5",
                columns === "compact"
                  ? "grid-cols-5"
                  : "grid-cols-5 sm:grid-cols-8 md:grid-cols-10",
              )}
            >
              {group.items.map((item) => (
                <button
                  key={item.questionId}
                  type="button"
                  aria-label={`Soal nomor ${item.index + 1}`}
                  aria-current={item.index === activeIndex}
                  onClick={() => onJump(item.index)}
                  className={cn(
                    "relative flex h-9 min-w-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
                    statusClass[item.status],
                    item.index === activeIndex &&
                      "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                >
                  {item.index + 1}
                  {item.flagged ? (
                    <Flag className="absolute -right-0.5 -top-0.5 size-3 fill-warning text-warning" />
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Daftar Soal sebagai popup terpusat (mobile/tablet). */
export function QuestionListDialog({
  open,
  onOpenChange,
  groups,
  activeIndex,
  mode,
  onJump,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: PaletteGroup[];
  activeIndex: number;
  mode: "exam" | "review";
  onJump: (index: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Daftar Soal</DialogTitle>
          <DialogDescription className="sr-only">
            Pilih nomor soal untuk berpindah.
          </DialogDescription>
        </DialogHeader>

        <QuestionListPanel
          groups={groups}
          activeIndex={activeIndex}
          mode={mode}
          onJump={(index) => {
            onJump(index);
            onOpenChange(false);
          }}
        />

        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
      </DialogContent>
    </Dialog>
  );
}
