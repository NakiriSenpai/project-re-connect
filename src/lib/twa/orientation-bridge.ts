/**
 * I:UM orientation bridge — NO-OP (aman untuk browser, PWA, dan TWA).
 *
 * Implementasi native bridge sebelumnya (window.AndroidOrientation dan
 * TWA PostMessage channel) DIHAPUS karena menyebabkan crash pada APK.
 *
 * Arsitektur final:
 * - Orientasi fisik dikendalikan sepenuhnya oleh native Android melalui
 *   mekanisme resmi Android Browser Helper
 *   (meta-data SCREEN_ORIENTATION -> TrustedWebActivityIntentBuilder
 *   .setScreenOrientation) saat TWA diluncurkan.
 * - Web TIDAK memanggil requestFullscreen(), TIDAK memanggil
 *   screen.orientation.lock() untuk ujian, dan TIDAK memakai JS bridge apa pun.
 * - Preferensi orientasi user hanya menentukan LAYOUT ujian di frontend.
 *
 * Fungsi di bawah dipertahankan agar call site frontend tidak perlu berubah.
 */

export type NativeOrientation = "portrait" | "landscape";

/** No-op. Dipertahankan untuk kompatibilitas call site. */
export function initOrientationBridge(): void {
  /* sengaja kosong */
}

/** No-op. Orientasi fisik ditentukan native saat TWA diluncurkan. */
export function setNativeOrientation(_orientation: NativeOrientation): void {
  /* sengaja kosong */
}
