import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Globe, Info, Trophy, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeaderboard, useLeaderboardExams, useLeaderboardPodium } from "@/hooks/leaderboard";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/types/analytics";

import { LeaderboardPodium, RoleBadge } from "./leaderboard-podium";
import { RankAvatar } from "./rank-avatar";
import { formatScore } from "../utils";

const PAGE_SIZE = 7;

function RankRow({ row }: { row: LeaderboardRow }) {
  return (
    <li
      className={cn(
        "grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_4.5rem] items-center gap-2 border-b border-border/60 px-3 py-2.5 last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)_5rem_6rem] sm:gap-3",
        row.is_current_user ? "bg-primary/10" : "",
      )}
    >
      <span className="text-sm font-bold text-foreground">{row.rank}</span>
      <div className="flex min-w-0 items-center gap-2">
        <RankAvatar row={row} className="size-8 shrink-0 ring-1 ring-border" />
        <span className="truncate text-sm font-semibold text-foreground">{row.display_name}</span>
        <RoleBadge role={row.role} />
      </div>
      <span className="text-right text-sm font-semibold text-primary sm:text-center">
        {row.exams_taken}
      </span>
      <span className="text-right text-sm font-semibold text-primary">
        {formatScore(row.total_score)}
      </span>
    </li>
  );
}

/** Papan peringkat siswa dalam satu tenant — skor attempt pertama per ujian. */
export function LeaderboardView() {
  const router = useRouter();
  const [examId, setExamId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const listParams = useMemo(
    () => ({ examId, page, pageSize: PAGE_SIZE, skip: 3 }),
    [examId, page],
  );

  const { data, isLoading, isError, refetch, isFetching } = useLeaderboard(listParams);
  const podium = useLeaderboardPodium(examId);
  const { data: exams } = useLeaderboardExams();

  const podiumRows = podium.data ?? [];
  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 1;
  const isEmpty = !podium.isLoading && podiumRows.length === 0;

  function selectMode(next: string | null) {
    setExamId(next);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      <header className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => router.history.back()}
          className="mt-1 text-foreground"
        >
          <ArrowLeft className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            Leaderboard
            <Trophy className="size-5 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">Lihat peringkat terbaik para siswa</p>
        </div>
        <Info className="mt-1 size-6 text-muted-foreground" />
      </header>

      {/* Mode: Semua / Per Exam */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => selectMode(null)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            examId === null
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
              : "text-muted-foreground",
          )}
        >
          <Globe className="size-4" />
          Semua
        </button>

        <Select
          value={examId ?? ""}
          onValueChange={(v) => selectMode(v)}
        >
          <SelectTrigger
            aria-label="Pilih ujian"
            className={cn(
              "h-auto justify-center gap-2 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm font-semibold shadow-none",
              examId ? "bg-primary/15 text-primary" : "text-muted-foreground",
            )}
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">
              <SelectValue placeholder="Per Exam" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {(exams ?? []).length === 0 ? (
              <SelectItem value="__none" disabled>
                Belum ada ujian
              </SelectItem>
            ) : null}
            {(exams ?? []).map((e) => (
              <SelectItem key={e.exam_id} value={e.exam_id}>
                {e.exam_title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Penjelasan logic */}
      <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
        <Users className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {examId ? (
            <>
              <p>Peringkat berdasarkan skor attempt pertama pada ujian yang dipilih.</p>
              <p>Attempt kedua dan seterusnya tidak dihitung.</p>
            </>
          ) : (
            <>
              <p>Peringkat berdasarkan total skor dari attempt pertama setiap ujian.</p>
              <p>Setiap ujian hanya dihitung satu kali berdasarkan attempt pertama.</p>
            </>
          )}
        </div>
      </div>

      {podium.isLoading || isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 items-end gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : isError || podium.isError ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Gagal memuat papan peringkat.</p>
          <Button
            onClick={() => {
              void refetch();
              void podium.refetch();
            }}
            disabled={isFetching}
          >
            Coba lagi
          </Button>
        </div>
      ) : isEmpty ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-8 text-center">
          <Trophy className="mx-auto size-8 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            {examId ? "Belum ada peserta" : "Belum ada peringkat"}
          </p>
          <p className="text-sm text-muted-foreground">
            {examId
              ? "Belum ada siswa yang mengerjakan ujian ini."
              : "Belum ada siswa yang menyelesaikan ujian."}
          </p>
        </div>
      ) : (
        <>
          <LeaderboardPodium rows={podiumRows} />

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_4.5rem] gap-2 border-b border-border px-3 py-2.5 text-[11px] text-muted-foreground sm:grid-cols-[2.5rem_minmax(0,1fr)_5rem_6rem] sm:gap-3">
              <span>Peringkat</span>
              <span>Siswa</span>
              <span className="text-right sm:text-center">Ujian</span>
              <span className="text-right">Total Skor</span>
            </div>
            {rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Tidak ada peringkat lain di halaman ini.
              </p>
            ) : (
              <ul>
                {rows.map((row) => (
                  <RankRow key={row.user_id} row={row} />
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 rounded-xl border-primary/50 text-primary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10">
          <TrendingUp className="size-5 text-primary" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Peringkat diperbarui real-time.</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Setiap kali ada siswa menyelesaikan attempt pertama pada suatu ujian, peringkat akan
            langsung menyesuaikan secara otomatis.
          </p>
        </div>
      </div>
    </div>
  );
}
