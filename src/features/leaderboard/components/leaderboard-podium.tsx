import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROLE_LABELS, isAppRole } from "@/types/auth";
import type { LeaderboardRow } from "@/types/analytics";

import { RankAvatar } from "./rank-avatar";
import { formatScore } from "../utils";

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const label = isAppRole(role) ? ROLE_LABELS[role] : "Siswa";
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary",
        className,
      )}
    >
      {label}
    </span>
  );
}

const STYLES = {
  1: {
    ring: "ring-2 ring-[#facc15]",
    glow: "shadow-[0_0_28px_rgba(250,204,21,0.45)]",
    text: "text-[#facc15]",
    border: "border-[#facc15]/45",
    bg: "bg-[#facc15]/[0.06]",
    badge: "border-[#facc15] text-[#facc15] bg-background",
  },
  2: {
    ring: "ring-2 ring-[#cbd5e1]",
    glow: "shadow-[0_0_22px_rgba(203,213,225,0.30)]",
    text: "text-[#cbd5e1]",
    border: "border-border",
    bg: "bg-card",
    badge: "border-[#cbd5e1] text-[#cbd5e1] bg-background",
  },
  3: {
    ring: "ring-2 ring-[#f97316]",
    glow: "shadow-[0_0_22px_rgba(249,115,22,0.32)]",
    text: "text-[#f97316]",
    border: "border-[#f97316]/35",
    bg: "bg-[#f97316]/[0.05]",
    badge: "border-[#f97316] text-[#f97316] bg-background",
  },
} as const;

type Place = 1 | 2 | 3;

function PodiumSlot({ row, place }: { row: LeaderboardRow | undefined; place: Place }) {
  const s = STYLES[place];
  const first = place === 1;
  const order = place === 1 ? "order-2" : place === 2 ? "order-1" : "order-3";

  if (!row) {
    return (
      <div className={cn("flex flex-col items-center", order)}>
        <div
          className={cn(
            "grid place-items-center rounded-full border border-dashed border-border text-xs text-muted-foreground",
            first ? "size-24" : "size-[4.5rem]",
          )}
        >
          —
        </div>
        <div
          className={cn(
            "mt-3 w-full rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground",
          )}
        >
          Belum ada
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", order)}>
      <div
        className={cn(
          "mb-1 grid size-7 place-items-center rounded-full border text-xs font-bold",
          s.badge,
        )}
      >
        {place}
      </div>

      <div className="relative">
        <RankAvatar
          row={row}
          className={cn(first ? "size-24" : "size-[4.5rem]", s.ring, s.glow)}
        />
        {first ? (
          <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-[#facc15] bg-background">
            <Crown className="size-3.5 text-[#facc15]" />
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-3 w-full rounded-xl border p-2.5 text-center",
          s.border,
          s.bg,
          first ? "-mt-2 pt-5" : "",
          row.is_current_user ? "ring-1 ring-primary" : "",
        )}
      >
        <div className="flex flex-wrap items-center justify-center gap-1">
          <p className="max-w-full truncate text-sm font-semibold text-foreground">
            {row.display_name}
          </p>
          <RoleBadge role={row.role} />
        </div>

        <div className="mt-2 grid grid-cols-2 divide-x divide-border">
          <div className="px-1">
            <p className="text-[10px] leading-tight text-muted-foreground">Ujian Dikerjakan</p>
            <p className={cn("text-base font-bold", s.text)}>{row.exams_taken}</p>
          </div>
          <div className="px-1">
            <p className="text-[10px] leading-tight text-muted-foreground">Total Skor</p>
            <p className={cn("text-base font-bold", s.text)}>{formatScore(row.total_score)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Podium #1–#3 (ranking global filter aktif; tidak berubah saat paginasi). */
export function LeaderboardPodium({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="grid grid-cols-3 items-end gap-2">
      <PodiumSlot row={rows[1]} place={2} />
      <PodiumSlot row={rows[0]} place={1} />
      <PodiumSlot row={rows[2]} place={3} />
    </div>
  );
}
