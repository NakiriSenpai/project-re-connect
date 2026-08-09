import { createFileRoute } from "@tanstack/react-router";

import { LeaderboardPodium, RoleBadge } from "@/features/leaderboard/components/leaderboard-podium";
import { RankAvatar } from "@/features/leaderboard/components/rank-avatar";
import { formatScore } from "@/features/leaderboard/utils";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/types/analytics";

export const Route = createFileRoute("/lbpreview")({
  component: Preview,
});

function mk(rank: number, name: string, exams: number, score: number): LeaderboardRow {
  return {
    rank,
    user_id: String(rank),
    display_name: name,
    username: null,
    avatar_url: null,
    role: "siswa",
    total_score: score,
    exams_taken: exams,
    first_qualified_at: null,
    is_current_user: false,
    total_rows: 10,
  };
}

const rows = [
  mk(1, "Bambang Wahyu Pratama Setiawan Nugroho", 100000, 1250000),
  mk(2, "Aqukinn", 2, 60),
  mk(3, "Verdian Adi palaka", 1250, 124800),
];

const GRID = "grid grid-cols-[3.25rem_minmax(0,1fr)_max-content_max-content] gap-x-2 sm:grid-cols-[4rem_minmax(0,1fr)_max-content_max-content] sm:gap-x-4";
const NUM = "min-w-[3rem] whitespace-nowrap text-right text-sm font-semibold tabular-nums text-primary sm:min-w-[4rem]";
const list = [
  mk(4, "Aqukinn", 2, 60),
  mk(5, "Bambang Wahyu Pratama Setiawan", 247, 12450),
  mk(6, "Bambang Wahyu Pratama Setiawan Nugroho", 100000, 1250000),
  mk(7, "Legion under the moonlight supercalifragilistic", 10000, 124800),
];

function Preview() {
  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <LeaderboardPodium rows={rows} />
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className={cn(GRID, "items-end border-b border-border px-3 py-2.5 text-[9px] leading-tight text-muted-foreground sm:text-[11px]")}>
          <span className="whitespace-nowrap">Peringkat</span>
          <span className="min-w-0 truncate">Siswa</span>
          <span className="min-w-[3rem] whitespace-nowrap text-right sm:min-w-[4rem]">Ujian</span>
          <span className="min-w-[3rem] whitespace-nowrap text-right sm:min-w-[4rem]">Total Skor</span>
        </div>
        <ul>
          {list.map((r) => (
            <li key={r.user_id} className={cn(GRID, "min-h-[3.75rem] items-center border-b border-border/60 px-3 py-2")}>
              <span className="text-sm font-bold tabular-nums text-foreground">{r.rank}</span>
              <div className="flex min-w-0 items-center gap-2.5">
                <RankAvatar row={r} className="size-9 shrink-0 ring-1 ring-border sm:size-11" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 break-words text-sm font-semibold leading-tight text-foreground" title={r.display_name}>{r.display_name}</p>
                  <div className="mt-1"><RoleBadge role={r.role} /></div>
                </div>
              </div>
              <span className={NUM}>{formatScore(r.exams_taken)}</span>
              <span className={NUM}>{formatScore(r.total_score)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
