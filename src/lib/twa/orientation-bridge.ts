/**
 * I:UM orientation bridge — custom URL scheme (TANPA JS bridge apa pun).
 *
 * Tidak ada requestFullscreen, tidak ada screen.orientation.lock, tidak ada
 * MessagePort, tidak ada window.AndroidOrientation, tidak ada reflection.
 *
 * Arsitektur:
 * - Orientasi fisik ditentukan oleh Activity Android yang membuka TWA.
 *   LauncherActivity = portrait, ExamLauncherActivity = landscape.
 * - Web hanya "meminta" Activity landscape dengan membuka custom scheme
 *   `ium-exam://exam/<attemptId>`; Android memetakannya ke
 *   https://<host>/ujian/<attemptId> lewat getLaunchingUrl().
 * - Kembali ke app utama (portrait) memakai `ium-app://main/<path>`.
 * - Di browser biasa semua fungsi ini no-op dan flow memakai SPA navigation.
 */

import { isStandaloneApp } from "@/lib/utils/app-mode";

export type NativeOrientation = "portrait" | "landscape";

const EXAM_LAUNCH_FLAG = "ium-exam-native-launch";

/** No-op. Dipertahankan untuk kompatibilitas call site. */
export function initOrientationBridge(): void {
  /* sengaja kosong */
}

/** No-op. Orientasi fisik ditentukan Activity native saat TWA diluncurkan. */
export function setNativeOrientation(_orientation: NativeOrientation): void {
  /* sengaja kosong */
}

/** True hanya bila berjalan sebagai installed app (TWA/PWA standalone). */
export function canUseNativeExamShell(): boolean {
  return isStandaloneApp();
}

/**
 * Buka ujian pada Activity landscape native.
 * Return `true` bila navigasi custom scheme dijalankan (caller tidak perlu
 * melakukan SPA navigate), `false` bila harus memakai SPA navigation biasa.
 */
export function openExamLandscape(attemptId: string): boolean {
  if (typeof window === "undefined") return false;
  if (!canUseNativeExamShell()) return false;
  try {
    window.localStorage.setItem(EXAM_LAUNCH_FLAG, attemptId);
  } catch {
    /* diabaikan */
  }
  try {
    window.location.href = `ium-exam://exam/${encodeURIComponent(attemptId)}`;
    return true;
  } catch {
    clearNativeExamLaunch();
    return false;
  }
}

/** True bila attempt ini dibuka lewat Activity landscape native. */
export function isNativeExamLaunch(attemptId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EXAM_LAUNCH_FLAG) === attemptId;
  } catch {
    return false;
  }
}

export function clearNativeExamLaunch(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(EXAM_LAUNCH_FLAG);
  } catch {
    /* diabaikan */
  }
}

/**
 * Kembali ke app utama (LauncherActivity, portrait) pada path tertentu.
 * Hanya dipakai satu kali saat ujian selesai — bukan untuk navigasi biasa.
 */
export function returnToPortraitApp(path: string): boolean {
  if (typeof window === "undefined") return false;
  if (!canUseNativeExamShell()) return false;
  clearNativeExamLaunch();
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  try {
    window.location.href = `ium-app://main/${normalized}`;
    return true;
  } catch {
    return false;
  }
}
