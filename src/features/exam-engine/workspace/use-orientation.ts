import { useEffect, useState } from "react";

/**
 * ORIENTATION POLICY (final).
 *
 * - NON-EXAM (semua halaman, termasuk Review & Result): portrait, tidak
 *   mengikuti sensor perangkat. Dipaksa best-effort lewat `applyPortraitPolicy`.
 * - EXAM WORKSPACE (/ujian/:attemptId): mengikuti sensor perangkat. Layout
 *   Portrait/Landscape dipilih dari orientasi viewport nyata, TANPA tombol
 *   manual, TANPA fullscreen, TANPA CSS rotate, TANPA fake viewport.
 *
 * Catatan native: pada APK TWA saat ini, Activity dikunci portrait di
 * AndroidManifest, sehingga perubahan orientasi fisik per-route tidak dapat
 * dijamin dari sisi web. Lihat laporan limitasi.
 */

type OrientationApi = ScreenOrientation & {
  lock?: (o: string) => Promise<void>;
  unlock?: () => void;
};

function getOrientation(): OrientationApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window.screen as (Screen & { orientation?: OrientationApi }) | undefined)?.orientation;
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1024px)").matches;
}

/** Kunci portrait (best-effort) untuk halaman NON-EXAM. */
export function applyPortraitPolicy(_source = "app"): void {
  if (typeof window === "undefined") return;
  if (!isMobileViewport()) return;
  const orientation = getOrientation();
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    void orientation.lock("portrait").catch(() => undefined);
  } catch {
    /* diabaikan */
  }
}

/** Lepaskan kunci portrait supaya Exam Workspace bisa mengikuti sensor. */
function releasePortraitPolicy(): void {
  const orientation = getOrientation();
  if (!orientation || typeof orientation.unlock !== "function") return;
  try {
    orientation.unlock();
  } catch {
    /* diabaikan */
  }
}

export type ExamLayout = "portrait" | "landscape";

/**
 * Layout Exam berbasis sensor/viewport.
 *
 * Hanya dipakai oleh Exam Workspace. Satu listener `matchMedia` — tidak ada
 * `deviceorientation`, tidak ada setState per event sensor: state hanya
 * berubah saat media query benar-benar berpindah (portrait ⇄ landscape).
 */
export function useExamSensorLayout(): ExamLayout {
  const [layout, setLayout] = useState<ExamLayout>("portrait");

  useEffect(() => {
    releasePortraitPolicy();

    const query = window.matchMedia("(orientation: landscape)");
    const sync = (matches: boolean) => setLayout(matches ? "landscape" : "portrait");
    sync(query.matches);

    const onChange = (event: MediaQueryListEvent) => sync(event.matches);
    query.addEventListener("change", onChange);

    return () => {
      query.removeEventListener("change", onChange);
      applyPortraitPolicy("exam-unmount");
    };
  }, []);

  return layout;
}
