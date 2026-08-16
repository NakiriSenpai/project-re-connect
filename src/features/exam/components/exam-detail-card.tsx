import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/features/media";
import { useUpdateExam } from "@/hooks/exam";
import { useCreateExamCategory, useExamCategories } from "@/hooks/exam/use-exam-category";
import { EXAM_DIFFICULTY_LABELS, toSlug } from "@/features/exam/exam.constants";
import type { ExamCategoryRow } from "@/services/exam/exam-category.service";
import type { ExamDifficulty, ExamRow } from "@/types/exam";

type Props = { exam: ExamRow };

/** Kartu "Detail Exam" — form inline pada halaman Edit Exam. */
export function ExamDetailCard({ exam }: Props) {
  const updateExam = useUpdateExam();
  const { data: categoryRows } = useExamCategories();
  const createCategory = useCreateExamCategory();
  const categoryOptions = useMemo(() => categoryRows ?? [], [categoryRows]);

  const [title, setTitle] = useState(exam.title);
  const [slug, setSlug] = useState(exam.slug);
  const [category, setCategory] = useState(exam.category);
  const [description, setDescription] = useState(exam.description ?? "");
  const [duration, setDuration] = useState(String(exam.duration_minutes));
  const [passingScore, setPassingScore] = useState(String(exam.passing_score));
  const [difficulty, setDifficulty] = useState<ExamDifficulty>(exam.difficulty);
  const [iconUrl, setIconUrl] = useState(exam.icon_url ?? "");
  const [changeIcon, setChangeIcon] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(exam.shuffle_questions);
  const [shuffleAnswers, setShuffleAnswers] = useState(exam.shuffle_answers);
  const [error, setError] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    setTitle(exam.title);
    setSlug(exam.slug);
    setCategory(exam.category);
    setDescription(exam.description ?? "");
    setDuration(String(exam.duration_minutes));
    setPassingScore(String(exam.passing_score));
    setDifficulty(exam.difficulty);
    setIconUrl(exam.icon_url ?? "");
    setChangeIcon(false);
    setShuffleQuestions(exam.shuffle_questions);
    setShuffleAnswers(exam.shuffle_answers);
  }, [exam]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const nextTitle = title.trim();
    const nextSlug = toSlug(slug || title);
    if (nextTitle.length < 3) return setError("Judul minimal 3 karakter.");
    if (nextSlug.length < 3) return setError("Slug minimal 3 karakter.");

    const scoreValue = Number(passingScore);
    const durationValue = Number(duration);
    if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      return setError("Passing score harus antara 0 dan 100.");
    }
    if (!Number.isFinite(durationValue) || durationValue < 1 || durationValue > 600) {
      return setError("Durasi harus antara 1 dan 600 menit.");
    }

    try {
      await updateExam.mutateAsync({
        id: exam.id,
        input: {
          title: nextTitle,
          slug: nextSlug,
          category,
          description: description.trim(),
          difficulty,
          passing_score: Math.round(scoreValue),
          duration_minutes: Math.round(durationValue),
          shuffle_questions: shuffleQuestions,
          shuffle_answers: shuffleAnswers,
          icon_url: iconUrl || null,
        },
      });
      toast.success("Detail exam disimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan detail exam.");
    }
  };

  const addCategory = async () => {
    try {
      const created = (await createCategory.mutateAsync({
        label: newCategory,
      })) as ExamCategoryRow;
      setCategory(created.slug);
      setNewCategory("");
      setCategoryOpen(false);
      toast.success("Kategori ditambahkan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah kategori.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold">Detail Exam</h2>

      <div className="space-y-1.5">
        <Label htmlFor="exam-title" className="text-xs font-medium">
          Judul Exam
        </Label>
        <Input id="exam-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exam-slug" className="text-xs font-medium">
          Slug
        </Label>
        <Input id="exam-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Kategori</Label>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Tambah kategori"
            onClick={() => setCategoryOpen(true)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exam-desc" className="text-xs font-medium">
          Deskripsi
        </Label>
        <Textarea
          id="exam-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exam-duration" className="text-xs font-medium">
            Durasi (menit)
          </Label>
          <Input
            id="exam-duration"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exam-score" className="text-xs font-medium">
            Passing Score
          </Label>
          <Input
            id="exam-score"
            inputMode="numeric"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Tingkat Kesulitan</Label>
        <Select value={difficulty} onValueChange={(v) => setDifficulty(v as ExamDifficulty)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXAM_DIFFICULTY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Icon Exam</Label>
        {iconUrl && !changeIcon ? (
          <div className="flex items-center gap-3 rounded-xl border border-border p-2">
            <img
              src={iconUrl}
              alt="Pratinjau icon exam"
              className="size-12 rounded-lg object-cover"
              loading="lazy"
            />
            <Button type="button" size="sm" variant="outline" onClick={() => setChangeIcon(true)}>
              Ganti Icon
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIconUrl("");
                setChangeIcon(false);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <MediaPicker
            allowed={["image"]}
            folder="exam/icons"
            label="Unggah icon exam"
            onChange={(asset) => {
              setIconUrl(asset?.url ?? "");
              setChangeIcon(false);
            }}
          />
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="shuffle-q" className="text-xs font-normal">
            Acak Soal
          </Label>
          <Switch id="shuffle-q" checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="shuffle-a" className="text-xs font-normal">
            Acak Jawaban
          </Label>
          <Switch id="shuffle-a" checked={shuffleAnswers} onCheckedChange={setShuffleAnswers} />
        </div>
      </div>

      <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
        Nilai total ujian selalu <span className="font-medium text-foreground">100</span> dan dibagi
        rata otomatis ke seluruh soal.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={updateExam.isPending}>
        {updateExam.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Simpan Detail
      </Button>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-category" className="text-xs font-medium">
              Nama Kategori
            </Label>
            <Input
              id="new-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="mis. EPS-TOPIK Reading"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setCategoryOpen(false)}>
              Batal
            </Button>
            <Button type="button" disabled={createCategory.isPending} onClick={() => void addCategory()}>
              {createCategory.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
