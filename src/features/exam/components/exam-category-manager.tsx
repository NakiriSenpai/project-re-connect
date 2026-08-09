import { useMemo, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateExamCategory,
  useDeleteExamCategory,
  useExamCategories,
  useUpdateExamCategory,
} from "@/hooks/exam/use-exam-category";
import { countExamsByCategory } from "@/services/exam/exam-category.service";
import type { ExamCategoryRow } from "@/services/exam/exam-category.service";

/** CRUD kategori ujian — sumber tunggal kategori untuk Exam & Exam Catalog. */
export function ExamCategoryManager() {
  const { data, isLoading } = useExamCategories();
  const createCategory = useCreateExamCategory();
  const updateCategory = useUpdateExamCategory();
  const deleteCategory = useDeleteExamCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamCategoryRow | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ category: ExamCategoryRow; count: number } | null>(null);

  const categories = useMemo(() => data ?? [], [data]);
  const pending = createCategory.isPending || updateCategory.isPending;

  const openCreate = () => {
    setEditing(null);
    setLabel("");
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (category: ExamCategoryRow) => {
    setEditing(category);
    setLabel(category.label);
    setError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, input: { label } });
        toast.success("Kategori diperbarui.");
      } else {
        await createCategory.mutateAsync({ label });
        toast.success("Kategori ditambahkan.");
      }
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const handleDelete = async (category: ExamCategoryRow) => {
    const used = await countExamsByCategory(category.slug);
    if (used > 0) {
      setBlocked({ category, count: used });
      return;
    }
    try {
      await deleteCategory.mutateAsync(category);
      toast.success("Kategori dihapus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <FolderTree className="size-4 shrink-0 text-primary" /> Kategori Ujian
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kategori tersimpan di database dan dipakai oleh form exam serta filter katalog.
          </p>
        </div>
        <Button size="sm" className="shrink-0" onClick={openCreate}>
          <Plus className="mr-1 size-4" /> Tambah
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat kategori…</p>
      ) : categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Belum ada kategori. Tambahkan kategori terlebih dahulu.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border bg-muted/20 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{category.label}</p>
                <p className="truncate text-xs text-muted-foreground">{category.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Ubah kategori ${category.label}`}
                  onClick={() => openEdit(category)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Hapus kategori ${category.label}`}
                  onClick={() => void handleDelete(category)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Kategori" : "Tambah Kategori"}</DialogTitle>
            <DialogDescription>
              Nama kategori tampil pada form exam dan filter katalog ujian.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="category-label">Nama kategori</Label>
            <Input
              id="category-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Persiapan EPS-TOPIK"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending} onClick={() => void handleSubmit()}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(blocked)} onOpenChange={(open) => !open && setBlocked(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kategori masih digunakan</DialogTitle>
            <DialogDescription>
              Kategori ini sedang digunakan oleh {blocked?.count ?? 0} ujian. Anda dapat
              menghapusnya setelah memindahkan ujian ke kategori lain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlocked(null)}>
              Batal
            </Button>
            <Button onClick={() => setBlocked(null)}>Kelola Ujian</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
