import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/features/media/components/media-picker";
import { Switch } from "@/components/ui/switch";
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/exam";
import { useArchiveBankQuestion, useGrammarTags, useLessons, useTags } from "@/hooks/question-bank";
import {
  ANSWER_LABELS,
  CATEGORY_LABELS,
  EXAM_CATEGORIES,
  EXAM_DIFFICULTY_LABELS,
} from "@/features/exam/exam.constants";
import type { ExamDifficulty } from "@/types/exam";
import {
  ORIGIN_LABELS,
  QUESTION_TYPE_LABELS,
  VISIBILITY_LABELS,
  type QuestionType,
  type QuestionVisibility,
} from "@/types/question-bank";
import type { QuestionBankInput, QuestionSourceType } from "@/types/question-bank";
import type { AnswerLabel, MediaSlot, QuestionFormValue } from "./question-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Exam pemilik soal (Exam Studio). Kosong bila dipakai dari Lesson Studio. */
  examId?: string;
  sectionId: string;
  question?: QuestionFormValue | null;
  /** Asal soal saat dibuat (default: exam). */
  sourceType?: QuestionSourceType;
  /** ID entitas asal yang disimpan pada created_from. */
  createdFrom?: string | null;
  /** Lesson yang otomatis terhubung saat soal dibuat dari Lesson Studio. */
  defaultLessonId?: string | null;
  /** Override penyimpanan (dipakai Lesson Studio agar service form tetap satu). */
  onSubmitQuestion?: (input: QuestionBankInput, questionId: string | null) => Promise<void>;
  /** Teks bantuan pada header dialog. */
  description?: string;
  /** Status pending dari mutation eksternal. */
  submitting?: boolean;
};

type AnswerState = {
  label: AnswerLabel;
  text: string;
  image_url: string | null;
  audio_url: string | null;
};

const emptyAnswers = (): AnswerState[] =>
  ANSWER_LABELS.map((label) => ({ label, text: "", image_url: null, audio_url: null }));

const NO_LESSON = "none";

export function QuestionFormDialog({
  open,
  onOpenChange,
  examId,
  sectionId,
  question = null,
  sourceType = "exam",
  createdFrom,
  defaultLessonId = null,
  onSubmitQuestion,
  description = "Soal baru otomatis tersimpan ke Question Bank sehingga dapat dipakai ulang.",
  submitting = false,
}: Props) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [generalTagIds, setGeneralTagIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<QuestionType>("reading");
  const [visibility, setVisibility] = useState<QuestionVisibility>("private");
  const [isArchived, setIsArchived] = useState(false);
  const [category, setCategory] = useState<string>("umum");
  const [difficulty, setDifficulty] = useState<ExamDifficulty>("sedang");
  const [lessonId, setLessonId] = useState<string>(NO_LESSON);
  const [explanation, setExplanation] = useState("");
  const [answers, setAnswers] = useState<AnswerState[]>(emptyAnswers());
  const [correct, setCorrect] = useState<AnswerLabel>("A");
  const [error, setError] = useState<string | null>(null);

  const grammarQuery = useGrammarTags();
  const tagQuery = useTags();
  const archiveQuestion = useArchiveBankQuestion();
  const lessonQuery = useLessons();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const pending = createQuestion.isPending || updateQuestion.isPending || submitting;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (question) {
      setText(question.text);
      setImageUrl(question.image_url);
      setAudioUrl(question.audio_url);
      setTagIds(question.grammar_tags.map((t) => t.id));
      setGeneralTagIds((question.tags ?? []).map((t) => t.id));
      setQuestionType(question.question_type ?? "reading");
      setVisibility(question.visibility ?? "private");
      setIsArchived(question.is_archived ?? false);
      setNewTags([]);
      setNewTag("");
      setCategory(question.category ?? "umum");
      setDifficulty(question.difficulty ?? "sedang");
      setLessonId(question.lesson_id ?? NO_LESSON);
      setExplanation(question.explanation ?? "");
      setAnswers(
        ANSWER_LABELS.map((label) => {
          const found = question.answers.find((a) => a.label === label);
          return {
            label,
            text: found?.text ?? "",
            image_url: found?.image_url ?? null,
            audio_url: found?.audio_url ?? null,
          };
        }),
      );
      setCorrect(question.answers.find((a) => a.is_correct)?.label ?? "A");
    } else {
      setText("");
      setImageUrl(null);
      setAudioUrl(null);
      setTagIds([]);
      setGeneralTagIds([]);
      setNewTags([]);
      setNewTag("");
      setQuestionType("reading");
      setVisibility("private");
      setIsArchived(false);
      setCategory("umum");
      setDifficulty("sedang");
      setLessonId(defaultLessonId ?? NO_LESSON);
      setExplanation("");
      setAnswers(emptyAnswers());
      setCorrect("A");
    }
  }, [open, question, defaultLessonId]);

  const setAnswer = (label: AnswerLabel, patch: Partial<AnswerState>) =>
    setAnswers((prev) => prev.map((a) => (a.label === label ? { ...a, ...patch } : a)));

  const toggleTag = (id: string) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const toggleGeneralTag = (id: string) =>
    setGeneralTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const addNewTag = () => {
    const value = newTag.trim();
    if (!value) return;
    setNewTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewTag("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (text.trim().length < 3) return setError("Teks soal minimal 3 karakter.");
    if (!explanation.trim()) return setError("Pembahasan wajib diisi.");
    if (tagIds.length === 0) return setError("Pilih minimal satu grammar tag.");

    const filled = answers.filter((a) => a.text.trim() || a.image_url || a.audio_url);
    if (filled.length < 2) return setError("Minimal dua pilihan jawaban harus diisi.");
    const correctFilled = filled.some((a) => a.label === correct);
    if (!correctFilled) return setError("Jawaban benar harus termasuk pilihan yang diisi.");

    const payload: QuestionBankInput = {
      text: text.trim(),
      image_url: imageUrl,
      audio_url: audioUrl,
      explanation: explanation.trim(),
      category,
      difficulty,
      lesson_id: lessonId === NO_LESSON ? null : lessonId,
      question_type: questionType,
      visibility,
      source_type: sourceType,
      created_from: createdFrom ?? examId ?? null,
      grammar_tag_ids: tagIds,
      tag_ids: generalTagIds,
      new_tags: newTags,
      answers: answers.map((a) => ({
        label: a.label,
        text: a.text.trim(),
        image_url: a.image_url,
        audio_url: a.audio_url,
        is_correct: a.label === correct,
      })),
    };

    try {
      if (onSubmitQuestion) {
        await onSubmitQuestion(payload, question?.question_id ?? null);
        if (question && isArchived !== (question.is_archived ?? false)) {
          await archiveQuestion.mutateAsync({ id: question.question_id, isArchived });
        }
        toast.success(question ? "Soal diperbarui." : "Soal ditambahkan ke Question Bank.");
      } else if (question) {
        await updateQuestion.mutateAsync({ id: question.question_id, input: payload });
        if (isArchived !== (question.is_archived ?? false)) {
          await archiveQuestion.mutateAsync({ id: question.question_id, isArchived });
        }
        toast.success("Soal diperbarui.");
      } else if (examId) {
        await createQuestion.mutateAsync({ examId, sectionId, input: payload });
        toast.success("Soal ditambahkan dan tersimpan ke Question Bank.");
      } else {
        throw new Error("Target penyimpanan soal tidak tersedia.");
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const mediaSlot = (
    label: string,
    kind: MediaSlot,
    value: string | null,
    onChange: (url: string | null) => void,
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border p-2 text-xs">
          <span className="min-w-0 flex-1 truncate">{value}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange(null)}>
            Hapus
          </Button>
        </div>
      ) : (
        <MediaPicker
          allowed={[kind]}
          folder="exam"
          label={`Unggah ${label.toLowerCase()}`}
          onChange={(asset) => onChange(asset?.url ?? null)}
        />
      )}
    </div>
  );

  const lessons = lessonQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{question ? "Ubah Soal" : "Tambah Soal"}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="q-text">Teks Soal</Label>
            <Textarea
              id="q-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pertanyaan di sini."
            />
          </div>

          {mediaSlot("Gambar Soal", "image", imageUrl, setImageUrl)}
          {mediaSlot("Audio Soal", "audio", audioUrl, setAudioUrl)}

          <div className="space-y-3">
            <Label>Pilihan Jawaban</Label>
            <RadioGroup value={correct} onValueChange={(v) => setCorrect(v as AnswerLabel)}>
              {answers.map((answer, answerIndex) => (
                <div key={answer.label} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={answer.label} id={`correct-${answer.label}`} />
                    <Label htmlFor={`correct-${answer.label}`} className="w-6 font-semibold">
                      {answerIndex + 1}
                    </Label>
                    <Input
                      value={answer.text}
                      onChange={(e) => setAnswer(answer.label, { text: e.target.value })}
                      placeholder={`Jawaban ${answerIndex + 1}`}
                    />
                  </div>
                  {mediaSlot(`Gambar ${answerIndex + 1}`, "image", answer.image_url, (url) =>
                    setAnswer(answer.label, { image_url: url }),
                  )}
                  {mediaSlot(`Audio ${answerIndex + 1}`, "audio", answer.audio_url, (url) =>
                    setAnswer(answer.label, { audio_url: url }),
                  )}
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Pilih lingkaran di depan huruf untuk menandai jawaban benar.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Grammar Tag (boleh lebih dari satu)</Label>
            <div className="flex flex-wrap gap-2">
              {(grammarQuery.data ?? []).map((tag) => {
                const active = tagIds.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    role="button"
                    tabIndex={0}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-xs"
                    onClick={() => toggleTag(tag.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleTag(tag.id);
                    }}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tag (bebas)</Label>
            <div className="flex flex-wrap gap-2">
              {(tagQuery.data ?? []).map((tag) => {
                const active = generalTagIds.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    role="button"
                    tabIndex={0}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-xs"
                    onClick={() => toggleGeneralTag(tag.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleGeneralTag(tag.id);
                    }}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
              {newTags.map((name) => (
                <Badge key={name} variant="default" className="px-3 py-1.5 text-xs">
                  {name}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Tag baru, mis. eps-topik"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addNewTag}>
                Tambah
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jenis Soal</Label>
              <Select
                value={questionType}
                onValueChange={(v) => setQuestionType(v as QuestionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as QuestionVisibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {question ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Version: v{question.version ?? 1}</span>
                <span>Origin: {ORIGIN_LABELS[question.origin ?? "manual"]}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="q-archive">Arsipkan soal</Label>
                  <p className="text-xs text-muted-foreground">
                    Soal tidak dihapus, hanya disembunyikan dari daftar aktif.
                  </p>
                </div>
                <Switch id="q-archive" checked={isArchived} onCheckedChange={setIsArchived} />
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {CATEGORY_LABELS[item] ?? item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kesulitan</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-explanation">Pembahasan</Label>
            <Textarea
              id="q-explanation"
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Jelaskan alasan jawaban benar."
            />
          </div>

          <div className="space-y-2">
            <Label>Lesson Reference</Label>
            <Select value={lessonId} onValueChange={setLessonId}>
              <SelectTrigger>
                <SelectValue placeholder="Tanpa lesson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LESSON}>Tanpa lesson</SelectItem>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Daftar lesson akan terisi setelah Lesson Studio tersedia.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Simpan Soal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
