import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Secure Mode Exam — state machine (final).
 *
 * ACTIVE → EXIT_DETECTED → SECURITY_BLOCKED → (tombol "Kembali ke Ujian") → ACTIVE
 *
 * Aturan:
 * - REF hanya dipakai sebagai latch de-duplikasi event (satu exit episode = satu violation).
 * - React STATE adalah satu-satunya sumber kebenaran untuk UI overlay & counter.
 * - Overlay TIDAK PERNAH hilang otomatis; hanya `resume()` yang menutupnya.
 * - `visibilitychange === "hidden"` adalah sinyal utama; `pagehide`/`freeze` fallback.
 * - `blur`/`focus`/`document.hasFocus()` TIDAK PERNAH membatalkan violation.
 * - Counter dipersist per attempt di sessionStorage (namespace khusus, tanpa clear global).
 *
 * TIDAK dihitung: rotasi layar, dialog internal, kontrol audio, navigasi antar soal.
 */
export const MAX_EXAM_VIOLATIONS = 3;

const STORAGE_PREFIX = "ium-exam-security:";

function storageKey(attemptId?: string) {
  return attemptId ? `${STORAGE_PREFIX}${attemptId}` : null;
}

function readPersisted(attemptId?: string) {
  const key = storageKey(attemptId);
  if (!key || typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(key);
    const value = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value > 0 ? Math.min(value, MAX_EXAM_VIOLATIONS) : 0;
  } catch {
    return 0;
  }
}

function persist(attemptId: string | undefined, value: number) {
  const key = storageKey(attemptId);
  if (!key || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    /* diabaikan */
  }
}

export function useExamSecurity({
  enabled,
  attemptId,
  onLimitReached,
}: {
  enabled: boolean;
  attemptId?: string;
  onLimitReached: () => void;
}) {
  const [violations, setViolations] = useState(() => readPersisted(attemptId));
  /** Overlay security sedang memblokir ujian (UI state, bukan ref). */
  const [securityBlocked, setSecurityBlocked] = useState(false);
  /** Violation tercatat saat aplikasi di background dan belum diakui user. */
  const [pendingViolation, setPendingViolation] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const limitRef = useRef(onLimitReached);
  limitRef.current = onLimitReached;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const attemptRef = useRef(attemptId);
  attemptRef.current = attemptId;
  const countRef = useRef(violations);
  /** Latch de-duplikasi: true = episode baru boleh dicatat. */
  const episodeActiveRef = useRef(true);

  // Restore counter bila attempt berubah (mis. recovery setelah refresh).
  useEffect(() => {
    const stored = readPersisted(attemptId);
    countRef.current = stored;
    setViolations(stored);
    if (stored >= MAX_EXAM_VIOLATIONS) setLimitReached(true);
  }, [attemptId]);

  const registerViolation = useCallback(() => {
    if (!enabledRef.current) return;
    if (countRef.current >= MAX_EXAM_VIOLATIONS) return;
    if (!episodeActiveRef.current) return; // satu exit episode = satu violation
    episodeActiveRef.current = false;

    countRef.current += 1;
    const next = countRef.current;
    persist(attemptRef.current, next);
    setViolations(next);
    setPendingViolation(true);
    setSecurityBlocked(true);

    if (next >= MAX_EXAM_VIOLATIONS) {
      setLimitReached(true);
      limitRef.current();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onHidden = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") return;
      registerViolation();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        registerViolation();
        return;
      }
      // Kembali ke aplikasi: JANGAN reset apa pun. Overlay tetap terbuka bila ada
      // pending violation; hanya tombol "Kembali ke Ujian" yang menutupnya.
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("freeze", onHidden);
    window.addEventListener("pagehide", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("freeze", onHidden);
      window.removeEventListener("pagehide", onHidden);
    };
  }, [enabled, registerViolation]);

  /** Hanya dipanggil dari tombol "Kembali ke Ujian". */
  const resume = useCallback(() => {
    setSecurityBlocked(false);
    setPendingViolation(false);
    episodeActiveRef.current = true;
  }, []);

  return {
    violations,
    /** Overlay tampil & konten ujian diblokir. */
    paused: securityBlocked,
    pendingViolation,
    limitReached,
    resume,
    registerViolation,
    max: MAX_EXAM_VIOLATIONS,
  };
}
