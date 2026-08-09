import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeaderboard, useLeaderboardExams, useMyRank } from "@/hooks/leaderboard";
import { cn } from "@/lib/utils";
import type { LeaderboardRange, LeaderboardRow } from "@/types/analytics";

import { RankAvatar } from "./rank-avatar";
import { formatScore } from "../utils";

const RANGE_OPTIONS: { value: LeaderboardRange; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "week", label: "Minggu ini" },
  { value: "month", label: "Bulan ini" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function PodiumCard({ row, place }: { row: LeaderboardRow; place: 0 | 1 | 2 }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-3 text-center",
        place === 0 ? "order-2 border-primary/50 bg-primary/10" : "border-border bg-card",
        place === 1 ? "order-1" : "",
        place === 2 ? "order-3" : "",
        row.is_current_user ? "ring-2 ring-primary" : "",
      )}
    >
      <span className="text-2xl leading-none">{MEDALS[place]}</span>
      <RankAvatar row={row} className={place === 0 ? "size-14" : "size-11"} />
      <p className="line-clamp-2 text-xs font-medium text-foreground">
        {row.is_current_user ? "Kamu" : row.display_name}
      </p>
      <p className="text-base font-semibold text-primary">{formatScore(row.average_score)}</p>
      <p className="text-[11px] text-muted-foreground">{row.exams_completed} ujian</p>
    </div>
  );
}

function RankRow({ row }: { row: LeaderboardRow }) {
  return (
    <li
      className={cn(
        "grid grid-cols-[2.25rem_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border px-3 py-2",
        row.is_current_user ? "border-primary/60 bg-primary/10" : "bg-card",
      )}
    >
      <span className="text-sm font-semibold text-muted-foreground">#{row.rank}</span>
      <RankAvatar row={row} className="size-9" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {row.is_current_user ? "Kamu" : row.display_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {row.username ? `@${row.username} · ` : ""}
          {row.exams_completed} ujian selesai
        </p>
      </div>
      <span className="text-sm font-semibold text-foreground">
        {formatScore(row.average_score)}
      </span>
    </li>
  );
}

/** Papan peringkat siswa dalam satu tenant (Sprint 12). */
export function LeaderboardView() {
  const [range, setRange] = useState<LeaderboardRange>("all");
  const [examId, setExamId] = useState<string>("all");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ range, examId: examId === "all" ? null : examId, page, pageSize: 20 }),
    [range, examId, page],
  );

  const { data, isLoading, isError, refetch, isFetching } = useLeaderboard(params);
  const { data: myRank } = useMyRank({ range, examId: examId === "all" ? null : examId });
  const { data: exams } = useLeaderboardExams();

  const rows = data?.rows ?? [];
  const podium = page === 1 ? rows.slice(0, 3) : [];
  const rest = page === 1 ? rows.slice(3) : rows;
  const showMyRank = myRank && !rows.some((r) => r.is_current_user);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Ranking belajar kamu</p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <Select
          value={range}
          onValueChange={(v) => {
            setRange(v as LeaderboardRange);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter periode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={examId}
          onValueChange={(v) => {
            setExamId(v);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter ujian">
            <SelectValue placeholder="Semua Ujian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Ujian</SelectItem>
            {(exams ?? []).map((e) => (
              <SelectItem key={e.exam_id} value={e.exam_id}>
                {e.exam_title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">Gagal memuat papan peringkat.</p>
            <Button onClick={() => void refetch()} disabled={isFetching}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-8 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Belum ada peringkat</p>
            <p className="text-sm text-muted-foreground">
              Selesaikan ujian untuk mulai masuk leaderboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {podium.length > 0 ? (
            <div className="grid grid-cols-3 items-end gap-2">
              {podium.map((row, index) => (
                <PodiumCard key={row.user_id} row={row} place={index as 0 | 1 | 2} />
              ))}
            </div>
          ) : null}

          {rest.length > 0 ? (
            <ul className="space-y-2">
              {rest.map((row) => (
                <RankRow key={row.user_id} row={row} />
              ))}
            </ul>
          ) : null}

          {showMyRank ? (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Peringkat kamu</p>
              <ul>
                <RankRow row={myRank} />
              </ul>
            </div>
          ) : null}

          {(data?.totalPages ?? 1) > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="text-xs text-muted-foreground">
                Halaman {page} dari {data?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
