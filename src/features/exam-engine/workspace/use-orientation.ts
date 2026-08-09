import { useCallback, useEffect, useState } from "react";

/**
 * ORIENTATION STATE (Sprint 11 FINAL) — terpisah dari fullscreen & exam lifecycle.
 *
 * - `isLandscape` selalu diverifikasi dari orientasi NYATA (matchMedia), bukan state React.
 * - `lock()` benar-benar memanggil Screen Orientation API lalu memverifikasi hasilnya.
 * - Perangkat besar (desktop/tablet lebar) tidak pernah dianggap butuh rotasi.
 */
type OrientationApi = ScreenOrientation & { lock?: (o: string) => Promise<void> };

function getOrientation(): OrientationApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window.screen as (Screen & { orientation?: OrientationApi }) | undefined)?.orientation;
}

export function isOrientationLockSupported() {
  return typeof getOrientation()?.lock === "function";
}

/**
 * Mencoba mengunci landscape dan MEMVERIFIKASI orientasi sebenarnya.
 *
 * Sebagian besar peramban mobile (Android/Chrome) HANYA mengizinkan
 * `screen.orientation.lock()` ketika dokumen berada dalam fullscreen. Karena
 * itu fullscreen diminta lebih dulu — tetap dalam gesture user yang sama.
 */
export async function lockLandscape(): Promise<boolean> {
  if (window.matchMedia("(orientation: landscape)").matches) return true;

  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* fullscreen ditolak — tetap coba lock di bawah */
    }
  }

  const orientation = getOrientation();
  if (orientation && typeof orientation.lock === "function") {
    try {
      await orientation.lock("landscape");
    } catch {
      /* ditolak peramban/perangkat — jatuh ke verifikasi manual di bawah */
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  return window.matchMedia("(orientation: landscape)").matches;
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
