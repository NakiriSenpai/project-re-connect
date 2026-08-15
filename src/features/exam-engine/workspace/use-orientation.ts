import { useCallback, useEffect, useState } from "react";

import { isStandaloneApp } from "@/lib/utils/app-mode";

/**
 * ORIENTATION STATE (Sprint 21.1) — tanpa Fullscreen API sama sekali.
 *
 * - `isLandscape` selalu diverifikasi dari orientasi NYATA (matchMedia), bukan state React.
 * - `lock()` memanggil Screen Orientation API lalu memverifikasi hasilnya.
 * - Exam Workspace mencoba lock landscape OTOMATIS saat mount (browser & TWA).
 * - Saat workspace unmount, orientasi dikembalikan ke portrait (standalone) / di-unlock (browser).
 *
 * CATATAN TWA: `screen.orientation.lock()` hanya berhasil bila Activity Android tidak
 * dikunci. PWABuilder membaca `orientation` dari manifest → manifest HARUS "any",
 * bukan "portrait", agar lock landscape per-halaman bisa bekerja.
 */
type OrientationApi = ScreenOrientation & {
  lock?: (o: string) => Promise<void>;
  unlock?: () => void;
};

function getOrientation(): OrientationApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window.screen as (Screen & { orientation?: OrientationApi }) | undefined)?.orientation;
}

export function isOrientationLockSupported() {
  return typeof getOrientation()?.lock === "function";
}

async function tryLock(type: "landscape" | "portrait"): Promise<void> {
  const orientation = getOrientation();
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    await orientation.lock(type);
  } catch {
    /* ditolak peramban/perangkat — caller memverifikasi hasil nyata */
  }
}

/**
 * Mencoba mengunci landscape dan MEMVERIFIKASI orientasi sebenarnya.
 * Fullscreen API TIDAK PERNAH dipanggil (memicu system education toast di Android/TWA).
 */
export async function lockLandscape(): Promise<boolean> {
  if (window.matchMedia("(orientation: landscape)").matches) return true;
  await tryLock("landscape");
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (window.matchMedia("(orientation: landscape)").matches) return true;
  // TWA kadang butuh percobaan kedua setelah Activity siap.
  await tryLock("landscape");
  await new Promise((resolve) => setTimeout(resolve, 350));
  return window.matchMedia("(orientation: landscape)").matches;
}

/** Kembalikan orientasi setelah keluar dari workspace ujian. */
export async function restoreOrientation(): Promise<void> {
  const orientation = getOrientation();
  if (!orientation) return;
  if (isStandaloneApp()) {
    await tryLock("portrait");
    return;
  }
  try {
    orientation.unlock?.();
  } catch {
    /* diabaikan */
  }
}

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

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

  // Auto-lock landscape saat workspace ujian dibuka (browser & TWA), tanpa fullscreen.
  useEffect(() => {
    let active = true;
    if (window.matchMedia("(max-width: 1024px)").matches) {
      void lockLandscape().then((ok) => {
        if (active && ok) setIsLandscape(true);
      });
    }
    return () => {
      active = false;
      void restoreOrientation();
    };
  }, []);

  const lock = useCallback(async () => {
    const ok = await lockLandscape();
    setIsLandscape(ok || window.matchMedia("(orientation: landscape)").matches);
    return ok;
  }, []);

  return {
    /** Orientasi nyata perangkat. */
    isLandscape,
    isSmallScreen,
    /** Perlu gate rotasi hanya untuk layar kecil yang masih portrait. */
    needsRotate: isSmallScreen && !isLandscape,
    lockSupported: isOrientationLockSupported(),
    lock,
  };
}
