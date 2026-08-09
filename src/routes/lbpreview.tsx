import { createFileRoute } from "@tanstack/react-router";

import { LeaderboardPodium } from "@/features/leaderboard/components/leaderboard-podium";
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

function Preview() {
  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <LeaderboardPodium rows={rows} />
    </div>
  );
}
