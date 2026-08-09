import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ExamFullscreenManager (Sprint 11A) — SATU sumber kebenaran untuk fullscreen.
 *
 * State: IDLE → REQUESTING → ACTIVE → EXIT_REQUESTED → SUBMITTING → FINISHED.
 *
 * Aturan penting:
 * - Keluar fullscreen yang DISENGAJA (tab tetap terlihat) → EXIT_REQUESTED → dialog konfirmasi.
 * - Force close / app background / tab tersembunyi (visibilitychange, pagehide, freeze)
 *   TIDAK pernah dianggap intentional exit; tidak ada submit dan tidak ada dialog.
 * - Tidak ada counter pelanggaran dan tidak ada banner.
 */
export type ExamFullscreenPhase =
  "IDLE" | "REQUESTING" | "ACTIVE" | "EXIT_REQUESTED" | "SUBMITTING" | "FINISHED";

type Options = {
  /** Workspace siap dan attempt masih berjalan. */
  enabled: boolean;
};

export function useExamFullscreen({ enabled }: Options) {
  const [phase, setPhase] = useState<ExamFullscreenPhase>("IDLE");
  const phaseRef = useRef<ExamFullscreenPhase>("IDLE");
  const hiddenRef = useRef(false);

  const apply = useCallback((next: ExamFullscreenPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const request = useCallback(async () => {
    if (phaseRef.current === "SUBMITTING" || phaseRef.current === "FINISHED") return false;
    if (document.fullscreenElement) {
      apply("ACTIVE");
      return true;
    }
    const el = document.documentElement;
    if (typeof el.requestFullscreen !== "function") {
      // Peramban tanpa Fullscreen API: ujian tetap berjalan normal.
      apply("ACTIVE");
      return false;
    }
    apply("REQUESTING");
    try {
      await el.requestFullscreen({ navigationUI: "hide" });
      apply("ACTIVE");
      return true;
    } catch {
      // Ditolak (butuh gestur). Bukan pelanggaran, bukan intentional exit.
      apply("IDLE");
      return false;
    }
  }, [apply]);

  const cancelExit = useCallback(() => {
    if (phaseRef.current !== "EXIT_REQUESTED") return;
    void request();
  }, [request]);

  const beginSubmit = useCallback(() => apply("SUBMITTING"), [apply]);

  const finish = useCallback(() => apply("FINISHED"), [apply]);

  /** Keluar fullscreen secara eksplisit (mis. saat meninggalkan Workspace). */
  const release = useCallback(() => {
    apply("FINISHED");
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, [apply]);

  // Permintaan awal saat Workspace mounted.
  useEffect(() => {
    if (!enabled) return;
    if (phaseRef.current === "SUBMITTING" || phaseRef.current === "FINISHED") return;
    void request();
  }, [enabled, request]);

  // Sinkronisasi peramban.
  useEffect(() => {
    if (!enabled) return;
    const onChange = () => {
      const current = phaseRef.current;
      if (current === "SUBMITTING" || current === "FINISHED") return;
      if (document.fullscreenElement) {
        apply("ACTIVE");
        return;
      }
      // Tab tersembunyi / app di background → bukan intentional exit.
      if (hiddenRef.current || document.hidden) {
        apply("IDLE");
        return;
      }
      if (current === "ACTIVE") apply("EXIT_REQUESTED");
      else apply("IDLE");
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [enabled, apply]);

  // Penanda background. Saat kembali terlihat, fullscreen diminta ulang diam-diam.
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      hiddenRef.current = document.hidden;
      if (document.hidden) return;
      const current = phaseRef.current;
      if (current === "IDLE" || current === "REQUESTING") void request();
    };
    const onHide = () => {
      hiddenRef.current = true;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [enabled, request]);

  return {
    phase,
    isExitRequested: phase === "EXIT_REQUESTED",
    isActive: phase === "ACTIVE",
    request,
    cancelExit,
    beginSubmit,
    finish,
    release,
  };
}
