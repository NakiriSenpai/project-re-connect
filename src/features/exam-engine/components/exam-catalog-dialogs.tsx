import { BarChart3, CheckCircle2, ClipboardList, HelpCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Dialog informasi sistem ujian (tombol (i) pada header katalog). */
export function ExamInfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const points = [
    "Setiap set ujian memiliki batas waktu.",
    "Nilai kelulusan mengikuti passing score masing-masing ujian.",
    "Percobaan ulang tetap tercatat sebagai attempt.",
    "Statistik progres set ujian hanya menghitung set yang benar-benar diselesaikan.",
    "Nilai rata-rata menggunakan nilai attempt pertama dari setiap set ujian.",
    'Gunakan tombol "Mulai Ujian" untuk memulai attempt baru.',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" /> Informasi Ujian
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Halaman ini berisi kumpulan set ujian latihan EPS-TOPIK.
        </p>
        <ul className="space-y-2 text-sm">
          {points.map((point) => (
            <li key={point} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0 text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ExamStatsSummary = {
  totalAttempts: number;
  completedSets: number;
  passedSets: number;
  averageScore: number | null;
};

/** Popup ringkas statistik ujian user. */
export function ExamStatsDialog({
  open,
  onOpenChange,
  stats,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: ExamStatsSummary;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Total Attempt", value: String(stats.totalAttempts) },
    { label: "Set Selesai", value: String(stats.completedSets) },
    { label: "Set Lulus", value: String(stats.passedSets) },
    {
      label: "Rata-rata Nilai",
      value:
        stats.averageScore === null
          ? "—"
          : stats.averageScore.toLocaleString("id-ID", { maximumFractionDigits: 1 }),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" /> Statistik Ujian
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{row.value}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            <X className="mr-2 size-4" /> Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
