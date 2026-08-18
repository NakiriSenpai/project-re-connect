import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type Options<T> = {
  /** Nilai form yang dipantau. */
  value: T;
  /** Penyimpan; hanya dipanggil bila nilai berubah dari state tersimpan. */
  onSave: (value: T) => Promise<void>;
  /** Jeda debounce (ms). */
  delay?: number;
  /** Autosave hanya berjalan bila true (mis. validasi lolos). */
  enabled?: boolean;
};

/**
 * Autosave berbasis debounce. Membandingkan snapshot JSON nilai dengan
 * versi terakhir yang tersimpan agar tidak menyimpan ulang tanpa perubahan.
 */
export function useAutosave<T>({ value, onSave, delay = 800, enabled = true }: Options<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  /** Tandai nilai saat ini sebagai baseline tersimpan (tanpa memanggil server). */
  const markSaved = useCallback((next: T) => {
    savedRef.current = JSON.stringify(next);
    setStatus("saved");
    setError(null);
  }, []);

  useEffect(() => {
    const snapshot = JSON.stringify(value);
    if (savedRef.current === null) {
      savedRef.current = snapshot;
      return;
    }
    if (!enabled || snapshot === savedRef.current) return;

    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus("saving");
      void saveRef
        .current(value)
        .then(() => {
          savedRef.current = snapshot;
          setStatus("saved");
          setError(null);
        })
        .catch((err: unknown) => {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
        });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, delay]);

  return { status, error, markSaved };
}
