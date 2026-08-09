import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteExam, useExams } from "@/hooks/exam";
import {
  CATEGORY_LABELS,
  EXAM_CATEGORIES,
  EXAM_DIFFICULTY_LABELS,
  EXAM_STATUS_LABELS,
} from "@/features/exam/exam.constants";
import type { ExamRow, ExamStatus } from "@/types/exam";
import { ImportBundleDialog } from "@/features/content-io/components/import-bundle-dialog";
import { recordContentIoAudit } from "@/services/content/bundle/audit.service";
import { buildExamBundle, downloadBundle } from "@/services/content/bundle/bundle-export.service";
import { ExamFormDialog } from "./exam-form-dialog";

const PAGE_SIZE = 10;

const statusVariant: Record<ExamStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ExamList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"semua" | ExamStatus>("semua");
  const [category, setCategory] = useState<string>("semua");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ExamRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (exam: ExamRow) => {
    setExportingId(exam.id);
    try {
      const bundle = await buildExamBundle(exam.id, true);
      downloadBundle(bundle, `exam-${exam.slug}`);
      toast.success("Bundle exam berhasil diunduh.");
      void recordContentIoAudit({
        action: "export_exam",
        entity: exam.slug,
        count: 1,
        result: "success",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengekspor exam.");
    } finally {
      setExportingId(null);
    }
  };

  const params = useMemo(
    () => ({ search, status, category, page, pageSize: PAGE_SIZE }),
    [search, status, category, page],
  );
  const { data, isLoading, isError } = useExams(params);
  const deleteExam = useDeleteExam();

  const handleDelete = async (exam: ExamRow) => {
    if (!window.confirm(`Hapus exam "${exam.title}" beserta seluruh soalnya?`)) return;
    try {
      await deleteExam.mutateAsync(exam.id);
      toast.success("Exam dihapus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus exam.");
    }
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Exam Studio</h1>
        <p className="text-sm text-muted-foreground">
          Susun ujian, section, dan soal. Nilai total selalu 100.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" /> Tambah Exam
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1 size-4" /> Import
        </Button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari judul atau slug exam"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as "semua" | ExamStatus);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              {Object.entries(EXAM_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua kategori</SelectItem>
              {EXAM_CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {CATEGORY_LABELS[item] ?? item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Gagal memuat daftar exam.</p>
      ) : (data?.rows.length ?? 0) === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Belum ada exam. Tekan “Tambah Exam” untuk membuat yang pertama.
        </p>
      ) : (
        <ul className="space-y-3">
          {data?.rows.map((exam) => (
            <li key={exam.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{exam.title}</p>
                  <p className="truncate text-xs text-muted-foreground">/{exam.slug}</p>
                </div>
                <Badge variant={statusVariant[exam.status]}>
                  {EXAM_STATUS_LABELS[exam.status]}
                </Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Kategori</dt>
                  <dd>{CATEGORY_LABELS[exam.category] ?? exam.category}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Kesulitan</dt>
                  <dd>{EXAM_DIFFICULTY_LABELS[exam.difficulty]}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Durasi</dt>
                  <dd>{exam.duration_minutes} menit</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Passing Score</dt>
                  <dd>{exam.passing_score}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Dibuat</dt>
                  <dd>{formatDate(exam.created_at)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Nilai total</dt>
                  <dd>100 (otomatis)</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/owner/exam-studio/$examId" params={{ examId: exam.id }}>
                    Kelola Soal
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelected(exam);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="mr-1 size-4" /> Ubah
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={exportingId === exam.id}
                  onClick={() => void handleExport(exam)}
                >
                  <Download className="mr-1 size-4" />
                  {exportingId === exam.id ? "Menyiapkan…" : "Export"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void handleDelete(exam)}>
                  <Trash2 className="mr-1 size-4" /> Hapus
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-muted-foreground">
            Halaman {data.page} dari {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      ) : null}

      <ExamFormDialog open={formOpen} onOpenChange={setFormOpen} exam={selected} />
      <ImportBundleDialog open={importOpen} onOpenChange={setImportOpen} bundleType="exam" />
    </section>
  );
}
