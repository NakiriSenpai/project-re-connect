import { useEffect, useState } from "react";

/**
 * ORIENTATION (Sprint 21.3) — TANPA Fullscreen API dan TANPA orientation lock untuk ujian.
 *
 * Keputusan final setelah audit APK/TWA:
 * - `screen.orientation.lock()` pada TWA perangkat target hanya bekerja bila fullscreen aktif,
 *   dan fullscreen memicu education notification Android serta mengganggu Start Exam.
 * - Karena itu ujian TIDAK PERNAH meminta fullscreen maupun memaksa rotasi fisik.
 *   Preferensi orientasi user hanya menentukan LAYOUT ujian.
 * - Satu-satunya pemakaian lock tersisa adalah kebijakan portrait untuk halaman NON-EXAM,
 *   supaya app shell tidak ikut sensor bebas saat auto-rotate perangkat menyala.
 */

type OrientationApi = ScreenOrientation & {
  lock?: (o: string) => Promise<void>;
};

function getOrientation(): OrientationApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window.screen as (Screen & { orientation?: OrientationApi }) | undefined)?.orientation;
}

function isLandscapeNow() {
  if (typeof window === "undefined") return false;
  return window.innerWidth > window.innerHeight;
}

/** Preferensi orientasi yang dipilih user di modal "Pilih Orientasi Ujian". */
export type ExamOrientationPreference = "portrait" | "landscape";

const PREFERENCE_KEY = "ium-exam-orientation";

export function setExamOrientationPreference(pref: ExamOrientationPreference) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREFERENCE_KEY, pref);
  } catch {
    /* diabaikan */
  }
}

export function getExamOrientationPreference(): ExamOrientationPreference {
  if (typeof window === "undefined") return "portrait";
  try {
    const value = window.sessionStorage.getItem(PREFERENCE_KEY);
    if (value === "portrait" || value === "landscape") return value;
  } catch {
    /* diabaikan */
  }
  return isLandscapeNow() ? "landscape" : "portrait";
}

/**
 * Kebijakan orientasi halaman NON-EXAM: portrait (best-effort), tanpa fullscreen,
 * tanpa UI gate, tanpa error bila ditolak. Tidak dipakai di flow ujian.
 */
export function applyPortraitPolicy(_source = "app"): void {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 1024px)").matches) return;
  const orientation = getOrientation();
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    void orientation.lock("portrait").catch(() => undefined);
  } catch {
    /* diabaikan */
  }
}

/**
 * Orientation state untuk workspace ujian — READ ONLY.
 * Tidak ada lock, tidak ada fullscreen, tidak ada gate. Hanya melaporkan
 * orientasi nyata + preferensi user agar layout bisa menyesuaikan.
 */
export function useOrientation(preference?: ExamOrientationPreference) {
  const [isLandscape, setIsLandscape] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const pref = preference ?? getExamOrientationPreference();

  useEffect(() => {
    const landscapeQuery = window.matchMedia("(orientation: landscape)");
    const smallQuery = window.matchMedia("(max-width: 1024px)");
    const sync = () => {
      setIsLandscape(landscapeQuery.matches);
      setIsSmallScreen(smallQuery.matches);
    };
    sync();
    landscapeQuery.addEventListener("change", sync);
    smallQuery.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      landscapeQuery.removeEventListener("change", sync);
      smallQuery.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return {
    /** Orientasi nyata perangkat. */
    isLandscape,
    isSmallScreen,
    /** Preferensi yang dipilih user di modal "Pilih Orientasi Ujian". */
    preference: pref,
  };
}
