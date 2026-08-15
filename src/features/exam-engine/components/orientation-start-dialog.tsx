import { useEffect, useState } from "react";
import { Check, Lightbulb, Smartphone, TabletSmartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ExamOrientationPreference } from "../workspace/use-orientation";

/**
 * Modal "Pilih Orientasi Ujian" (Sprint 22 — UI only).
 * Menggantikan konfirmasi mulai ujian lama. Tidak menyentuh attempt/exam logic:
 * hanya mengembalikan preferensi orientasi + memicu `onConfirm`.
 */
export function OrientationStartDialog({
  open,
  examTitle,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  examTitle: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (preference: ExamOrientationPreference) => void;
}) {
  const [value, setValue] = useState<ExamOrientationPreference>("portrait");

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setValue(window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-3xl p-5 sm:p-7">
        <DialogHeader className="items-center space-y-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-muted text-primary">
            <TabletSmartphone className="size-7" />
          </span>
          <DialogTitle className="text-center text-xl font-bold">Pilih Orientasi Ujian</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Silakan pilih orientasi layar yang paling nyaman untuk mengerjakan {examTitle}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <OrientationCard
            selected={value === "portrait"}
            onSelect={() => setValue("portrait")}
            title="Portrait"
            description="Tampilan vertikal, cocok untuk satu tangan."
            icon={<Smartphone className="size-10" strokeWidth={1.5} />}
          />
          <OrientationCard
            selected={value === "landscape"}
            onSelect={() => setValue("landscape")}
            title="Landscape"
            description="Tampilan horizontal, area lebih luas."
            icon={<Smartphone className="size-10 rotate-90" strokeWidth={1.5} />}
          />
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-primary-muted p-3.5">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Rekomendasi</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Untuk pengalaman terbaik, gunakan mode Landscape saat perangkatmu diputar horizontal.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Button
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-base font-semibold"
            disabled={pending}
            onClick={() => onConfirm(value)}
          >
            Mulai Ujian
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full rounded-2xl font-semibold text-primary"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrientationCard({
  selected,
  onSelect,
  title,
  description,
  icon,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center transition-all",
        selected
          ? "border-primary bg-primary-muted"
          : "border-border bg-card hover:border-primary/50",
      )}
    >
      {selected ? (
        <span className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      ) : null}
      <span className={cn(selected ? "text-primary" : "text-muted-foreground")}>{icon}</span>
      <span className="text-base font-bold text-foreground">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
    </button>
  );
}
