import { memo, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AudioButton } from "./audio-manager";

/** Batang soal (teks, gambar, audio) — dipakai Exam dan Review. */
export const QuestionStem = memo(function QuestionStem({
  questionId,
  number,
  total,
  sectionTitle,
  sectionInstruction,
  text,
  imageUrl,
  audioUrl,
  right,
}: {
  questionId: string;
  number: number;
  total: number;
  sectionTitle?: string | undefined;
  sectionInstruction?: string | null | undefined;
  text: string;
  imageUrl: string | null;
  audioUrl: string | null;
  right?: ReactNode;
}) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="shrink-0 bg-primary-muted text-foreground">
          Soal {number} dari {total}
        </Badge>
        {right}
      </div>
      {sectionTitle ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/80">{sectionTitle}</span>
          {sectionInstruction ? ` — ${sectionInstruction}` : ""}
        </p>
      ) : null}
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground sm:text-base">
        {text}
      </p>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Gambar soal nomor ${number}`}
          loading="lazy"
          draggable={false}
          className="max-h-40 w-auto max-w-[min(100%,20rem)] rounded-xl border border-border object-contain sm:max-h-48"
        />
      ) : null}

      {audioUrl ? (
        <AudioButton audioKey={`${questionId}:soal`} src={audioUrl} label="Dengarkan audio" />
      ) : null}
    </div>
  );
});

/** Judul panel jawaban (kanan). */
export function AnswerPanelHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {right}
    </div>
  );
}

/** Kerangka satu pilihan jawaban (nomor + konten). */
export function AnswerShell({
  index,
  selected,
  tone,
  onClick,
  disabled,
  children,
}: {
  index: number;
  selected?: boolean;
  tone?: "correct" | "wrong" | undefined;
  onClick?: (() => void) | undefined;
  disabled?: boolean;
  children: ReactNode;
}) {
  const className = cn(
    "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-150",
    tone === "correct"
      ? "border-success bg-success/12"
      : tone === "wrong"
        ? "border-destructive bg-destructive/12"
        : selected
          ? "border-primary bg-primary-muted glow-primary"
          : "border-border bg-card",
    onClick && "hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-60",
  );
  const inner = (
    <>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums",
          tone === "correct"
            ? "border-success bg-success text-success-foreground"
            : tone === "wrong"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
        )}
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">{children}</span>
    </>
  );

  if (!onClick) return <div className={className}>{inner}</div>;
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {inner}
    </button>
  );
}
