import { supabase } from "@/lib/supabase/client";
import type {
  LeaderboardExamOption,
  LeaderboardRange,
  LeaderboardResult,
  LeaderboardRow,
} from "@/types/analytics";

export type LeaderboardParams = {
  range?: LeaderboardRange;
  examId?: string | null;
  tenantId?: string | null;
  page?: number;
  pageSize?: number;
};

function normalize(row: Record<string, unknown>): LeaderboardRow {
  return {
    rank: Number(row["rank"] ?? 0),
    user_id: String(row["user_id"] ?? ""),
    display_name: String(row["display_name"] ?? "Siswa"),
    username: (row["username"] as string | null) ?? null,
    avatar_url: (row["avatar_url"] as string | null) ?? null,
    average_score: Number(row["average_score"] ?? 0),
    exams_completed: Number(row["exams_completed"] ?? 0),
    last_submitted_at: (row["last_submitted_at"] as string | null) ?? null,
    is_current_user: Boolean(row["is_current_user"]),
    total_rows: Number(row["total_rows"] ?? 0),
  };
}

/** Peringkat siswa dalam tenant pemanggil. Agregasi dilakukan di database. */
export async function getLeaderboard({
  range = "all",
  examId = null,
  tenantId = null,
  page = 1,
  pageSize = 20,
}: LeaderboardParams = {}): Promise<LeaderboardResult> {
  const { data, error } = await supabase.rpc("leaderboard_ranking", {
    p_range: range,
    p_exam_id: examId,
    p_tenant_id: tenantId,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });

  if (error) throw new Error("Gagal memuat papan peringkat.");

  const rows = ((data as Record<string, unknown>[] | null) ?? []).map(normalize);
  const total = rows[0]?.total_rows ?? 0;
  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Peringkat pemanggil sendiri (agar tetap terlihat walau di luar halaman aktif). */
export async function getMyLeaderboardRank({
  range = "all",
  examId = null,
  tenantId = null,
}: LeaderboardParams = {}): Promise<LeaderboardRow | null> {
  const { data, error } = await supabase.rpc("leaderboard_my_rank", {
    p_range: range,
    p_exam_id: examId,
    p_tenant_id: tenantId,
  });

  if (error) throw new Error("Gagal memuat peringkat Anda.");
  const rows = (data as Record<string, unknown>[] | null) ?? [];
  return rows[0] ? normalize(rows[0]) : null;
}

/** Opsi filter exam — hanya exam yang benar-benar memiliki hasil pada tenant. */
export async function listLeaderboardExams(
  tenantId: string | null = null,
): Promise<LeaderboardExamOption[]> {
  const { data, error } = await supabase.rpc("leaderboard_exam_options", {
    p_tenant_id: tenantId,
  });
  if (error) throw new Error("Gagal memuat daftar ujian.");
  return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
    exam_id: String(row["exam_id"]),
    exam_title: String(row["exam_title"] ?? "Ujian"),
    result_count: Number(row["result_count"] ?? 0),
  }));
}
