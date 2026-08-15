import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Secure Mode Exam (Sprint 22 — UI/UX layer).
 *
 * Violation HANYA dihitung dari `visibilitychange` → dokumen benar-benar hidden
 * (aplikasi/tab masuk background). Rotasi layar, keyboard, dialog internal, dan
 * kontrol audio TIDAK pernah dihitung. Fullscreen API tidak dipakai sama sekali.
 * Timer tetap berjalan; hook ini tidak menyentuh attempt/submit logic.
 */
export const MAX_EXAM_VIOLATIONS = 3;

export function useExamSecurity({
  enabled,
  onLimitReached,
  onViolation,
}: {
  enabled: boolean;
  onLimitReached: () => void;
  onViolation?: () => void;
}) {
  const [violations, setViolations] = useState(0);
  const [paused, setPaused] = useState(false);
  const limitRef = useRef(onLimitReached);
  const violationRef = useRef(onViolation);
  limitRef.current = onLimitReached;
  violationRef.current = onViolation;

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (!document.hidden) return;
      violationRef.current?.();
      setViolations((prev) => {
        const next = prev + 1;
        if (next >= MAX_EXAM_VIOLATIONS) limitRef.current();
        else setPaused(true);
        return next;
      });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  const resume = useCallback(() => setPaused(false), []);

  return { violations, paused, resume, max: MAX_EXAM_VIOLATIONS };
}
