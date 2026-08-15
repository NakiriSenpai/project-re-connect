import { useCallback, useEffect, useState } from "react";

import { isStandaloneApp } from "@/lib/utils/app-mode";

/**
 * ORIENTATION STATE (Sprint 21.2) — tanpa Fullscreen API sama sekali.
 *
 * Perbedaan penting dari versi sebelumnya:
 * - `screen.orientation.lock()` bisa dipanggil LANGSUNG dari user gesture
 *   (tombol "Mulai Ujian"/"Lanjutkan Ujian") lewat `requestLandscapeFromGesture()`,
 *   sehingga transient user activation masih valid saat lock dijalankan.
 *   Di Chrome/TWA lock ditolak (`NotSupportedError`/`SecurityError`) bila dipanggil
 *   setelah navigasi + mount karena aktivasi sudah hilang.
 * - Auto-lock saat mount tetap dipertahankan sebagai fallback (berhasil di browser desktop/Chrome
 *   Android yang mengizinkan lock tanpa gesture).
 * - Error asli SELALU dicatat ke console dengan diagnostik, bukan ditelan diam-diam.
 *
 * CATATAN TWA: `screen.orientation.lock()` hanya berhasil bila Activity Android tidak
 * dikunci. PWABuilder membaca `orientation` dari manifest → manifest HARUS "any".
 */
type OrientationApi = ScreenOrientation & {
  lock?: (o: string) => Promise<void>;
  unlock?: () => void;
};

export type OrientationLockDiagnostics = {
  source: string;
  supported: boolean;
  locked: boolean;
  errorName?: string | undefined;
  errorMessage?: string | undefined;
  type?: string | undefined;
  angle?: number | undefined;
  standalone: boolean;
  displayModeStandalone: boolean;
  userActivation?: boolean | undefined;
};

let lastDiagnostics: OrientationLockDiagnostics | null = null;

/** Diagnostik lock terakhir (dipakai untuk pelaporan/debug, tanpa data sensitif). */
export function getLastOrientationDiagnostics() {
  return lastDiagnostics;
}

function getOrientation(): OrientationApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window.screen as (Screen & { orientation?: OrientationApi }) | undefined)?.orientation;
}

export function isOrientationLockSupported() {
  return typeof getOrientation()?.lock === "function";
}

/**
 * Landscape dianggap benar hanya bila viewport benar-benar lebih lebar dari tinggi
 * DAN (bila tersedia) `screen.orientation.type` menunjukkan landscape.
 * Promise `lock()` yang resolve TIDAK dianggap sukses.
 */
function isLandscapeNow() {
  if (typeof window === "undefined") return false;
  const byViewport = window.innerWidth > window.innerHeight;
  const type = getOrientation()?.type;
  if (!type) return byViewport;
  return byViewport && type.startsWith("landscape");
}

function report(source: string, locked: boolean, error?: unknown) {
  const orientation = getOrientation();
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } })
    .userActivation;
  const diagnostics: OrientationLockDiagnostics = {
    source,
    supported: isOrientationLockSupported(),
    locked,
    errorName: error instanceof Error ? error.name : undefined,
    errorMessage: error instanceof Error ? error.message : undefined,
    type: orientation?.type,
    angle: orientation?.angle,
    standalone: isStandaloneApp(),
    displayModeStandalone:
      typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
    userActivation: activation?.isActive,
  };
  lastDiagnostics = diagnostics;
  if (error) console.error("[ExamOrientation] landscape lock failed", diagnostics);
  else console.info("[ExamOrientation] landscape lock", diagnostics);
}

/**
 * Memanggil `lock()` SECARA SINKRON (tanpa await sebelumnya) supaya user activation
 * tetap utuh saat dipanggil dari event handler klik.
 */
function callLock(type: "landscape" | "portrait", source: string): Promise<boolean> {
  const orientation = getOrientation();
  if (!orientation || typeof orientation.lock !== "function") {
    report(`${source}:${type}`, false);
    return Promise.resolve(false);
  }
  try {
    return orientation
      .lock(type)
      .then(() => {
        report(`${source}:${type}`, true);
        return true;
      })
      .catch((error: unknown) => {
        report(`${source}:${type}`, false, error);
        return false;
      });
  } catch (error) {
    report(`${source}:${type}`, false, error);
    return Promise.resolve(false);
  }
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
 * Dipanggil LANGSUNG dari handler klik user (tanpa await/setTimeout sebelumnya).
 * Mengembalikan promise; caller boleh mengabaikannya agar navigasi tidak tertunda.
 */
export function requestOrientationFromGesture(pref: ExamOrientationPreference): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!window.matchMedia("(max-width: 1024px)").matches) return Promise.resolve(true);
  if (pref === "landscape" ? isLandscapeNow() : !isLandscapeNow()) return Promise.resolve(true);
  return callLock(pref, "gesture");
}

export function requestLandscapeFromGesture(): Promise<boolean> {
  return requestOrientationFromGesture("landscape");
}

/**
 * Mencoba mengunci orientasi dan MEMVERIFIKASI orientasi sebenarnya.
 * Fullscreen API TIDAK PERNAH dipanggil. Kegagalan lock TIDAK pernah fatal.
 */
export async function lockOrientation(
  pref: ExamOrientationPreference,
  source = "mount",
): Promise<boolean> {
  const matches = () => (pref === "landscape" ? isLandscapeNow() : !isLandscapeNow());
  if (matches()) return true;
  await callLock(pref, source);
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (matches()) return true;
  // TWA kadang butuh percobaan kedua setelah Activity siap.
  await callLock(pref, `${source}-retry`);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return matches();
}

export function lockLandscape(source = "mount") {
  return lockOrientation("landscape", source);
}

/** Kembalikan orientasi setelah keluar dari workspace ujian. */
export async function restoreOrientation(): Promise<void> {
  const orientation = getOrientation();
  if (!orientation) return;
  if (isStandaloneApp()) {
    await callLock("portrait", "restore");
    return;
  }
  try {
    orientation.unlock?.();
  } catch {
    /* diabaikan */
  }
}

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

  // Fallback auto-lock saat workspace ujian dibuka (browser & TWA), tanpa fullscreen.
  useEffect(() => {
    let active = true;
    if (window.matchMedia("(max-width: 1024px)").matches) {
      void lockOrientation(pref, "mount").then((ok) => {
        if (active && ok) setIsLandscape(pref === "landscape");
      });
    }
    return () => {
      active = false;
      void restoreOrientation();
    };
  }, [pref]);

  const lock = useCallback(async () => {
    const ok = await lockOrientation(pref, "gate");
    setIsLandscape(isLandscapeNow());
    return ok;
  }, [pref]);

  return {
    /** Orientasi nyata perangkat. */
    isLandscape,
    isSmallScreen,
    /** Fallback ringan: user memilih landscape tetapi perangkat masih portrait. */
    needsRotate: pref === "landscape" && isSmallScreen && !isLandscape,
    lockSupported: isOrientationLockSupported(),
    lock,
  };
}
