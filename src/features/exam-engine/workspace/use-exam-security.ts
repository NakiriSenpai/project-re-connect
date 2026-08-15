import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Secure Mode Exam (final).
 *
 * Violation dihitung dari dua sumber saja:
 * 1. `visibilitychange` → dokumen benar-benar hidden (pindah aplikasi/tab background).
 * 2. Percobaan meninggalkan route ujian (Android back / browser back / navigasi),
 *    dilaporkan pemanggil lewat `registerViolation()`.
 *
 * TIDAK dihitung: rotasi layar, orientation lock, dialog internal (Daftar Soal,
 * submit, tandai soal), kontrol audio, maupun navigasi antar soal.
 * Fullscreen API tidak dipakai sama sekali. Timer & attempt logic tidak disentuh.
 */
export const MAX_EXAM_VIOLATIONS = 3;

export function useExamSecurity({
  enabled,
  onLimitReached,
}: {
  enabled: boolean;
  onLimitReached: () => void;
}) {
  const [violations, setViolations] = useState(0);
  const [paused, setPaused] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const limitRef = useRef(onLimitReached);
  limitRef.current = onLimitReached;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const countRef = useRef(0);

  const registerViolation = useCallback(() => {
    if (!enabledRef.current || countRef.current >= MAX_EXAM_VIOLATIONS) return;
    countRef.current += 1;
    const next = countRef.current;
    setViolations(next);
    setPaused(true);
    if (next >= MAX_EXAM_VIOLATIONS) {
      setLimitReached(true);
      limitRef.current();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.hidden) registerViolation();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, registerViolation]);

  const resume = useCallback(() => setPaused(false), []);

  return {
    violations,
    paused,
    limitReached,
    resume,
    registerViolation,
    max: MAX_EXAM_VIOLATIONS,
  };
}
