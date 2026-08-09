import { useQuery } from "@tanstack/react-query";

import {
  getLeaderboard,
  getMyLeaderboardRank,
  listLeaderboardExams,
  type LeaderboardParams,
} from "@/services/leaderboard";
import { useAuth } from "@/hooks/auth";

/** Papan peringkat tenant (agregasi di database). */
export function useLeaderboard(params: LeaderboardParams) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["leaderboard", params],
    queryFn: () => getLeaderboard(params),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/** Peringkat user yang sedang masuk. */
export function useMyRank(params: LeaderboardParams) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["leaderboard-my-rank", params],
    queryFn: () => getMyLeaderboardRank(params),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/** Opsi filter exam pada leaderboard. */
export function useLeaderboardExams(tenantId: string | null = null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["leaderboard-exams", tenantId],
    queryFn: () => listLeaderboardExams(tenantId),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
