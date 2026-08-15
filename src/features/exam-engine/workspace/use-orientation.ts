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
  requested?: string | undefined;
  supported: boolean;
  locked: boolean;
  errorName?: string | undefined;
  errorMessage?: string | undefined;
  type?: string | undefined;
  angle?: number | undefined;
  innerWidth?: number | undefined;
  innerHeight?: number | undefined;
  actualLandscape?: boolean | undefined;
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

function report(source: string, locked: boolean, error?: unknown, requested?: string) {
  const orientation = getOrientation();
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } })
    .userActivation;
  const diagnostics: OrientationLockDiagnostics = {
    source,
    requested,
    supported: isOrientationLockSupported(),
    locked,
    errorName: error instanceof Error ? error.name : undefined,
    errorMessage: error instanceof Error ? error.message : undefined,
    type: orientation?.type,
    angle: orientation?.angle,
    innerWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
    innerHeight: typeof window !== "undefined" ? window.innerHeight : undefined,
    actualLandscape: isLandscapeNow(),
    standalone: isStandaloneApp(),
    displayModeStandalone:
      typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
    userActivation: activation?.isActive,
  };
  lastDiagnostics = diagnostics;
  if (error) console.error("[ExamOrientation] lock failed", diagnostics);
  else console.info("[ExamOrientation] lock", diagnostics);
}

/**
 * Memanggil `lock()` SECARA SINKRON (tanpa await sebelumnya) supaya user activation
 * tetap utuh saat dipanggil dari event handler klik.
 * Fallback ke varian `-primary` hanya bila varian generik ditolak.
 */
function callLock(type: "landscape" | "portrait", source: string): Promise<boolean> {
  const orientation = getOrientation();
  if (!orientation || typeof orientation.lock !== "function") {
    report(`${source}:${type}`, false, undefined, type);
    return Promise.resolve(false);
  }
  try {
    return orientation
      .lock(type)
      .then(() => {
        report(`${source}:${type}`, true, undefined, type);
        return true;
      })
      .catch((error: unknown) => {
        report(`${source}:${type}`, false, error, type);
        // Beberapa WebView/TWA menolak nilai generik; coba varian primary sekali.
        try {
          return orientation
            .lock!(`${type}-primary`)
            .then(() => {
              report(`${source}:${type}-primary`, true, undefined, `${type}-primary`);
              return true;
            })
            .catch((err: unknown) => {
              report(`${source}:${type}-primary`, false, err, `${type}-primary`);
              return false;
            });
        } catch (err) {
          report(`${source}:${type}-primary`, false, err, `${type}-primary`);
          return false;
        }
      });
  } catch (error) {
    report(`${source}:${type}`, false, error, type);
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

/**
 * Orientation state untuk workspace ujian.
 *
 * TIDAK ADA orientation gate: lock hanya best-effort. Bila `screen.orientation.lock()`
 * ditolak (TWA/browser), ujian tetap berjalan dengan layout sesuai preferensi user —
 * tanpa modal "Putar Perangkat", tanpa tombol "Kunci Landscape", tanpa violation.
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

  // Best-effort auto-lock saat workspace dibuka. Kegagalan diabaikan diam-diam,
  // tetapi hasil AKTUAL selalu diverifikasi & dicatat untuk diagnostik TWA.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1024px)").matches) {
      void lockOrientation(pref, "mount").then((ok) => {
        report(`verify:${pref}`, ok, undefined, pref);
      });
    }
    return () => {
      void restoreOrientation();
    };
  }, [pref]);


  return {
    /** Orientasi nyata perangkat. */
    isLandscape,
    isSmallScreen,
    /** Preferensi yang dipilih user di modal "Pilih Orientasi Ujian". */
    preference: pref,
  };
}
