/**
 * I:UM TWA Orientation Bridge
 *
 * Jembatan PostMessage antara web (PWA/TWA) dan native Android I:UM.
 * Native Activity yang melakukan physical orientation change — web hanya mengirim
 * command. TIDAK ada Fullscreen API dan TIDAK ada screen.orientation.lock di sini.
 *
 * Di browser biasa bridge ini adalah no-op total: tidak error, tidak popup.
 */

export type NativeOrientation = "portrait" | "landscape";

const TWA_ORIGIN = "android-app://com.ium.ium";
const COMMAND_TYPE = "IUM_SET_ORIENTATION";
const LOG_PREFIX = "[I:UM TWA Bridge]";

type OrientationCommand = {
  type: typeof COMMAND_TYPE;
  orientation: NativeOrientation;
};

let port: MessagePort | null = null;
let initialized = false;
let queue: OrientationCommand[] = [];

function log(...args: unknown[]) {
  if (typeof console === "undefined") return;
  console.info(LOG_PREFIX, ...args);
}

function flushQueue() {
  if (!port || queue.length === 0) return;
  const pending = queue;
  queue = [];
  for (const command of pending) {
    try {
      port.postMessage(command);
      log("orientation command sent (flushed)", command.orientation);
    } catch {
      /* diabaikan */
    }
  }
}

function handleMessage(event: MessageEvent) {
  // MESSAGE SECURITY: hanya handshake dari native Android I:UM yang diterima.
  if (event.origin !== TWA_ORIGIN) return;
  const incomingPort = event.ports?.[0];
  if (!incomingPort) return;

  port = incomingPort;
  try {
    port.start?.();
  } catch {
    /* diabaikan */
  }
  log("TWA channel ready");
  flushQueue();
}

/** Pasang listener handshake sekali saja. Aman dipanggil berulang. */
export function initOrientationBridge(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("message", handleMessage);
}

/**
 * Kirim perintah orientasi ke native Android.
 * Bila channel belum siap, command di-queue dan dikirim saat handshake tiba.
 * Di browser biasa command hanya mengendap di queue (no-op, tanpa efek samping).
 */
export function setNativeOrientation(orientation: NativeOrientation): void {
  if (typeof window === "undefined") return;
  if (orientation !== "portrait" && orientation !== "landscape") return;

  initOrientationBridge();

  const command: OrientationCommand = { type: COMMAND_TYPE, orientation };

  if (!port) {
    // Simpan hanya command terakhir agar tidak menumpuk / looping.
    queue = [command];
    log("orientation command queued", orientation);
    return;
  }

  try {
    port.postMessage(command);
    log("orientation command sent", orientation);
  } catch {
    queue = [command];
    log("orientation command queued", orientation);
  }
}
