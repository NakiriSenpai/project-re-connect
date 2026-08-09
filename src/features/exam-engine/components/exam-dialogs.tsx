import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ExamRow } from "@/types/exam";

type Props = {
  exam: ExamRow | null;
  questionCount?: number | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
};

/** Dialog konfirmasi sebelum attempt dibuat (BUG 6). */
export function StartExamDialog({
  exam,
  questionCount,
  open,
  onOpenChange,
  onConfirm,
  pending,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Mulai ujian?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm">
              <ul className="space-y-1">
                <li>
                  <span className="text-muted-foreground">Nama ujian:</span>{" "}
                  <span className="font-medium text-foreground">{exam?.title ?? "-"}</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Durasi:</span>{" "}
                  <span className="font-medium text-foreground">
                    {exam?.duration_minutes ?? 0} menit
                  </span>
                </li>
                <li>
                  <span className="text-muted-foreground">Jumlah soal:</span>{" "}
                  <span className="font-medium text-foreground">
                    {questionCount ?? "Sesuai paket ujian"}
                  </span>
                </li>
                <li>
                  <span className="text-muted-foreground">Passing score:</span>{" "}
                  <span className="font-medium text-foreground">{exam?.passing_score ?? 0}</span>
                </li>
              </ul>
              <div className="space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                <p>Ujian berjalan dalam mode layar penuh. Keluar dari layar penuh dicatat.</p>
                <p>Bila batas pelanggaran tercapai atau waktu habis, ujian dikumpulkan otomatis.</p>
                <p>Audio soal hanya dapat diputar satu kali (otomatis diulang 1 kali).</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onConfirm}>
            Mulai
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Dialog konfirmasi melanjutkan attempt aktif (BUG 16). */
export function ContinueExamDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anda memiliki ujian yang belum selesai</AlertDialogTitle>
          <AlertDialogDescription>
            Ujian akan dilanjutkan dari posisi terakhir. Jawaban yang sudah tersimpan tetap
            tersedia. Lanjutkan ujian?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batalkan</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Lanjutkan</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Dialog konfirmasi pengumpulan ujian (BUG 7). */
export function SubmitExamDialog({
  open,
  unanswered,
  onOpenChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  unanswered: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kumpulkan ujian?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-left text-sm">
              <p>Semua jawaban akan dikumpulkan.</p>
              <p>Waktu ujian tidak dapat dilanjutkan setelah dikumpulkan.</p>
              {unanswered > 0 ? (
                <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 font-medium text-amber-700 dark:text-amber-300">
                  Masih ada {unanswered} soal yang belum dijawab.
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Kembali Mengerjakan</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onConfirm}>
            Kumpulkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Konfirmasi keluar fullscreen yang disengaja (Sprint 11A). */
export function ExitFullscreenDialog({
  open,
  pending,
  onStay,
  onExit,
}: {
  open: boolean;
  pending?: boolean;
  onStay: () => void;
  onExit: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari mode ujian?</AlertDialogTitle>
          <AlertDialogDescription>
            Jika Anda keluar dari mode layar penuh, ujian akan dikumpulkan secara otomatis. Apakah
            Anda yakin ingin keluar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Tetap Mengerjakan</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onExit}>
            Keluar &amp; Kumpulkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Konfirmasi meninggalkan Workspace lewat navigasi peramban. Tidak pernah submit. */
export function LeaveExamDialog({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ujian sedang berlangsung</AlertDialogTitle>
          <AlertDialogDescription>
            Jika Anda meninggalkan halaman ini, ujian tetap tersimpan dan dapat dilanjutkan kembali.
            Apakah Anda ingin meninggalkan ujian?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Tetap di Ujian</AlertDialogCancel>
          <AlertDialogAction onClick={onLeave}>Tinggalkan Ujian</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
