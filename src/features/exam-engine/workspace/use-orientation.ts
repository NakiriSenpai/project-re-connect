import { useCallback, useEffect, useState } from "react";

/**
 * ORIENTATION (Final Exam Experience).
 *
 * Keputusan arsitektur setelah audit APK/TWA:
 * - TIDAK ada Fullscreen API, TIDAK ada `screen.orientation.lock()` untuk ujian,
 *   TIDAK ada custom scheme / Activity kedua / native bridge.
 * - Preferensi orientasi user HANYA menentukan LAYOUT halaman ujian dan bisa
 *   diubah kapan saja dari dalam ujian (tombol "Ganti Tampilan").
 * - Satu-satunya pemakaian lock tersisa adalah kebijakan portrait untuk halaman
 *   NON-EXAM, supaya app shell tidak ikut sensor bebas saat auto-rotate menyala.
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

/** Preferensi LAYOUT ujian (bukan rotasi fisik perangkat). */
export type ExamOrientationPreference = "portrait" | "landscape";

const PREFERENCE_KEY = "ium-exam-orientation";
const PREFERENCE_EVENT = "ium-exam-orientation-change";

export function setExamOrientationPreference(pref: ExamOrientationPreference) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREFERENCE_KEY, pref);
  } catch {
    /* diabaikan */
  }
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT, { detail: pref }));
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
 * Orientation state untuk workspace ujian — READ ONLY untuk orientasi fisik,
 * READ/WRITE untuk preferensi layout.
 */
export function useOrientation(preference?: ExamOrientationPreference) {
  const [isLandscape, setIsLandscape] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [storedPref, setStoredPref] = useState<ExamOrientationPreference>("portrait");

  useEffect(() => {
    setStoredPref(getExamOrientationPreference());
    const onChange = () => setStoredPref(getExamOrientationPreference());
    window.addEventListener(PREFERENCE_EVENT, onChange);
    return () => window.removeEventListener(PREFERENCE_EVENT, onChange);
  }, []);

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

  const setPreference = useCallback((pref: ExamOrientationPreference) => {
    setExamOrientationPreference(pref);
  }, []);

  return {
    /** Orientasi nyata perangkat. */
    isLandscape,
    isSmallScreen,
    /** Preferensi layout aktif. */
    preference: preference ?? storedPref,
    setPreference,
  };
}
