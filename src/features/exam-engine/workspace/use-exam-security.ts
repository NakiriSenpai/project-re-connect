import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Secure Mode Exam (final — single source of truth).
 *
 * Satu "exit episode" = SATU violation, walaupun browser mengirim beberapa event
 * sekaligus (`visibilitychange` → `blur` → `pagehide` → `freeze`).
 *
 * Sumber violation:
 * 1. Aplikasi/tab masuk background (visibilitychange hidden, pagehide, freeze,
 *    atau blur yang benar-benar kehilangan fokus dokumen).
 * 2. Percobaan meninggalkan route ujian (Android back / browser back / navigasi),
 *    dilaporkan pemanggil lewat `registerViolation()`.
 *
 * TIDAK dihitung: rotasi layar, orientation lock/selection, dialog internal
 * (Daftar Soal, submit, tandai soal), kontrol audio, navigasi antar soal.
 * Fullscreen API tidak dipakai sama sekali. Timer & attempt logic tidak disentuh.
 *
 * Overlay tidak bisa tampil saat aplikasi masih di background, jadi violation
 * yang terjadi ketika hidden disimpan sebagai "pending" lalu ditampilkan saat
 * user kembali (visibilitychange → visible).
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
  /** Latch: true selama satu exit episode masih berlangsung (anti double count). */
  const episodeRef = useRef(false);
  /** Violation tercatat saat hidden, overlay ditampilkan saat user kembali. */
  const pendingRef = useRef(false);

  const registerViolation = useCallback(() => {
    if (!enabledRef.current || countRef.current >= MAX_EXAM_VIOLATIONS) return;
    if (episodeRef.current) return; // satu episode = satu violation
    episodeRef.current = true;

    countRef.current += 1;
    const next = countRef.current;
    setViolations(next);

    const visible = typeof document === "undefined" || document.visibilityState === "visible";
    if (next >= MAX_EXAM_VIOLATIONS) {
      setPaused(true);
      setLimitReached(true);
      limitRef.current();
      return;
    }
    if (visible) {
      setPaused(true);
      episodeRef.current = false; // episode navigasi selesai seketika
    } else {
      pendingRef.current = true; // tampilkan overlay saat kembali
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let blurTimer: ReturnType<typeof setTimeout> | undefined;

    const onHidden = () => {
      if (blurTimer) clearTimeout(blurTimer);
      registerViolation();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        onHidden();
        return;
      }
      // Kembali ke aplikasi: tutup episode, proses pending violation sekali saja.
      episodeRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        setPaused(true);
      }
    };

    const onBlur = () => {
      // `blur` juga muncul untuk fokus internal; hanya hitung bila dokumen
      // benar-benar kehilangan fokus/visibility sesaat kemudian.
      blurTimer = setTimeout(() => {
        if (document.visibilityState === "hidden" || !document.hasFocus()) registerViolation();
      }, 400);
    };

    const onFocus = () => {
      if (blurTimer) clearTimeout(blurTimer);
      if (document.visibilityState === "visible") {
        episodeRef.current = false;
        if (pendingRef.current) {
          pendingRef.current = false;
          setPaused(true);
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("freeze", onHidden);
    window.addEventListener("pagehide", onHidden);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("freeze", onHidden);
      window.removeEventListener("pagehide", onHidden);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, registerViolation]);

  const resume = useCallback(() => {
    episodeRef.current = false;
    pendingRef.current = false;
    setPaused(false);
  }, []);

  return {
    violations,
    paused,
    limitReached,
    resume,
    registerViolation,
    max: MAX_EXAM_VIOLATIONS,
  };
}
