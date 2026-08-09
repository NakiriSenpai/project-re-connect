import { Loader2, Maximize, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Gate lifecycle Exam Workspace (Sprint 11 FINAL).
 * Ditampilkan hanya bila orientasi atau fullscreen belum terverifikasi.
 */
export function WorkspaceGate({
  needsRotate,
  lockSupported,
  pending,
  onEnter,
}: {
  needsRotate: boolean;
  lockSupported: boolean;
  pending: boolean;
  onEnter: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-background/95 p-6 text-center backdrop-blur">
      <div className="grid size-16 place-items-center rounded-2xl border border-border bg-surface glow-primary">
        {needsRotate ? (
          <RotateCw className="size-7 text-primary" />
        ) : (
          <Maximize className="size-7 text-primary" />
        )}
      </div>

      <div className="max-w-md space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground">
          {needsRotate ? "Putar Perangkat" : "Mode Ujian"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {needsRotate
            ? "Putar perangkat ke mode landscape untuk mengikuti ujian."
            : "Ujian berjalan dalam mode layar penuh. Tekan tombol di bawah untuk masuk."}
        </p>
        {needsRotate && !lockSupported ? (
          <p className="text-xs text-warning">
            Peramban ini tidak dapat mengunci orientasi otomatis. Aktifkan rotasi otomatis pada
            perangkat, lalu putar ke landscape.
          </p>
        ) : null}
      </div>

      <Button size="lg" className="h-12 px-8" disabled={pending} onClick={onEnter}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {needsRotate ? "Kunci Landscape" : "Masuk Mode Ujian"}
      </Button>
    </div>
  );
}
