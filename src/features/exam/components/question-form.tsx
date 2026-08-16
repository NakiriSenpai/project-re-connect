import { useEffect, useState, type FormEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Music,
  Trash2,
  Type as TypeIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
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

export type QuestionFormProps = {
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
  /** Status pending dari mutation eksternal. */
  submitting?: boolean;
  /** Dipanggil setelah simpan berhasil. */
  onDone: () => void;
  onCancel?: () => void;
  /** Ubah nilai untuk memaksa reset state form. */
  resetKey?: string | number;
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

/**
 * Form soal (state, validasi, dan mutation) — dipakai inline oleh Exam Studio
 * dan di dalam dialog oleh Lesson Studio. Satu sumber logika soal.
 */
export function QuestionForm({
  examId,
  sectionId,
  question = null,
  sourceType = "exam",
  createdFrom,
  defaultLessonId = null,
  onSubmitQuestion,
  submitting = false,
  onDone,
  onCancel,
  resetKey,
}: QuestionFormProps) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
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
  const [answerMedia, setAnswerMedia] = useState<Record<string, MediaSlot | null>>({});
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
    setError(null);
    if (question) {
      setText(question.text);
      setImageUrl(question.image_url);
      setAudioUrl(question.audio_url);
      setShowImage(Boolean(question.image_url));
      setShowAudio(Boolean(question.audio_url));
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
      const next = ANSWER_LABELS.map((label) => {
        const found = question.answers.find((a) => a.label === label);
        return {
          label,
          text: found?.text ?? "",
          image_url: found?.image_url ?? null,
          audio_url: found?.audio_url ?? null,
        };
      });
      setAnswers(next);
      setAnswerMedia(
        Object.fromEntries(
          next.map((a) => [a.label, a.image_url ? "image" : a.audio_url ? "audio" : null]),
        ),
      );
      setCorrect(question.answers.find((a) => a.is_correct)?.label ?? "A");
    } else {
      setText("");
      setImageUrl(null);
      setAudioUrl(null);
      setShowImage(false);
      setShowAudio(false);
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
      setAnswerMedia({});
      setCorrect("A");
    }
  }, [question, defaultLessonId, resetKey]);

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

  /** Tukar isi dua pilihan jawaban (urutan label A–D tetap sesuai skema). */
  const swapAnswers = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= answers.length) return;
    setAnswers((prev) => {
      const next = [...prev];
      const a = next[index];
      const b = next[target];
      if (!a || !b) return prev;
      next[index] = { ...b, label: a.label };
      next[target] = { ...a, label: b.label };
      return next;
    });
  };

  const clearAnswer = (label: AnswerLabel) => {
    setAnswer(label, { text: "", image_url: null, audio_url: null });
    setAnswerMedia((prev) => ({ ...prev, [label]: null }));
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

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const lessons = lessonQuery.data ?? [];

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="q-text" className="text-xs font-medium">
          Teks Soal
        </Label>
        <Textarea
          id="q-text"
          rows={3}
          className="text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pertanyaan di sini."
        />
      </div>

      {/* Media soal — caption/teks selalu berada di atas kontrol media. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Gambar (Opsional)</Label>
          {showImage || imageUrl ? (
            <div className="space-y-2 rounded-lg border border-border p-2">
              {imageUrl ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate">{imageUrl}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setImageUrl(null);
                      setShowImage(false);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <MediaPicker
                  allowed={["image"]}
                  folder="exam"
                  label="Unggah gambar soal"
                  onChange={(asset) => setImageUrl(asset?.url ?? null)}
                />
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full border-dashed text-primary"
              onClick={() => setShowImage(true)}
            >
              + Tambah Gambar
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Audio (Opsional)</Label>
          {showAudio || audioUrl ? (
            <div className="space-y-2 rounded-lg border border-border p-2">
              {audioUrl ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate">{audioUrl}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAudioUrl(null);
                      setShowAudio(false);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <MediaPicker
                  allowed={["audio"]}
                  folder="exam"
                  label="Unggah audio soal"
                  onChange={(asset) => setAudioUrl(asset?.url ?? null)}
                />
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full border-dashed text-primary"
              onClick={() => setShowAudio(true)}
            >
              + Tambah Audio
            </Button>
          )}
        </div>
      </div>

      {/* Pilihan jawaban */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Pilihan Jawaban</Label>
        <RadioGroup
          value={correct}
          onValueChange={(v) => setCorrect(v as AnswerLabel)}
          className="gap-2"
        >
          {answers.map((answer, answerIndex) => {
            const media = answerMedia[answer.label] ?? null;
            return (
              <div key={answer.label} className="space-y-2 rounded-lg border border-border p-2">
                <div className="flex items-center gap-1.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-xs font-semibold">
                    {answerIndex + 1}
                  </span>
                  <Input
                    className="h-8 min-w-0 flex-1 text-sm"
                    value={answer.text}
                    onChange={(e) => setAnswer(answer.label, { text: e.target.value })}
                    placeholder={`Jawaban ${answerIndex + 1}`}
                  />
                  <IconAction
                    label="Mode teks"
                    active={media === null}
                    onClick={() =>
                      setAnswerMedia((prev) => ({ ...prev, [answer.label]: null }))
                    }
                  >
                    <TypeIcon className="size-3.5" />
                  </IconAction>
                  <IconAction
                    label="Mode gambar"
                    active={media === "image"}
                    onClick={() =>
                      setAnswerMedia((prev) => ({ ...prev, [answer.label]: "image" }))
                    }
                  >
                    <ImageIcon className="size-3.5" />
                  </IconAction>
                  <IconAction
                    label="Mode audio"
                    active={media === "audio"}
                    onClick={() =>
                      setAnswerMedia((prev) => ({ ...prev, [answer.label]: "audio" }))
                    }
                  >
                    <Music className="size-3.5" />
                  </IconAction>
                  <IconAction label="Naikkan" onClick={() => swapAnswers(answerIndex, -1)}>
                    <ChevronUp className="size-3.5" />
                  </IconAction>
                  <IconAction label="Turunkan" onClick={() => swapAnswers(answerIndex, 1)}>
                    <ChevronDown className="size-3.5" />
                  </IconAction>
                  <IconAction label="Kosongkan" onClick={() => clearAnswer(answer.label)}>
                    <Trash2 className="size-3.5 text-destructive" />
                  </IconAction>
                </div>

                {media === "image" ? (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Caption Gambar</Label>
                    <Textarea
                      rows={2}
                      className="text-sm"
                      value={answer.text}
                      onChange={(e) => setAnswer(answer.label, { text: e.target.value })}
                      placeholder="Teks pendamping gambar"
                    />
                    {answer.image_url ? (
                      <div className="flex items-center gap-2 rounded-md border border-border p-1.5 text-xs">
                        <span className="min-w-0 flex-1 truncate">{answer.image_url}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setAnswer(answer.label, { image_url: null })}
                        >
                          Hapus
                        </Button>
                      </div>
                    ) : (
                      <MediaPicker
                        allowed={["image"]}
                        folder="exam"
                        label="Unggah gambar jawaban"
                        onChange={(asset) =>
                          setAnswer(answer.label, { image_url: asset?.url ?? null })
                        }
                      />
                    )}
                  </div>
                ) : null}

                {media === "audio" ? (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Caption Audio</Label>
                    <Textarea
                      rows={2}
                      className="text-sm"
                      value={answer.text}
                      onChange={(e) => setAnswer(answer.label, { text: e.target.value })}
                      placeholder="Teks pendamping audio"
                    />
                    {answer.audio_url ? (
                      <div className="flex items-center gap-2 rounded-md border border-border p-1.5 text-xs">
                        <span className="min-w-0 flex-1 truncate">{answer.audio_url}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setAnswer(answer.label, { audio_url: null })}
                        >
                          Hapus
                        </Button>
                      </div>
                    ) : (
                      <MediaPicker
                        allowed={["audio"]}
                        folder="exam"
                        label="Unggah audio jawaban"
                        onChange={(asset) =>
                          setAnswer(answer.label, { audio_url: asset?.url ?? null })
                        }
                      />
                    )}
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <RadioGroupItem value={answer.label} id={`correct-${answer.label}`} />
                  <Label
                    htmlFor={`correct-${answer.label}`}
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Jadikan Kunci Jawaban
                  </Label>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {/* Grammar tag wajib untuk validasi soal. */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Grammar Tag</Label>
        <div className="flex flex-wrap gap-1.5">
          {(grammarQuery.data ?? []).map((tag) => {
            const active = tagIds.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                role="button"
                tabIndex={0}
                variant={active ? "default" : "outline"}
                className="cursor-pointer px-2 py-1 text-[11px]"
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

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Tag (bebas)</Label>
        <div className="flex flex-wrap gap-1.5">
          {(tagQuery.data ?? []).map((tag) => {
            const active = generalTagIds.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                role="button"
                tabIndex={0}
                variant={active ? "default" : "outline"}
                className="cursor-pointer px-2 py-1 text-[11px]"
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
            <Badge key={name} variant="default" className="px-2 py-1 text-[11px]">
              {name}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            className="h-8 text-sm"
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
          <Button type="button" size="sm" variant="outline" onClick={addNewTag}>
            Tambah
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Jenis Soal</Label>
          <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
            <SelectTrigger className="h-9 text-sm">
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
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as QuestionVisibility)}>
            <SelectTrigger className="h-9 text-sm">
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
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 text-sm">
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
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Kesulitan</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as ExamDifficulty)}>
            <SelectTrigger className="h-9 text-sm">
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

      {question ? (
        <div className="space-y-2 rounded-lg border border-border p-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Version: v{question.version ?? 1}</span>
            <span>Origin: {ORIGIN_LABELS[question.origin ?? "manual"]}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="q-archive" className="text-xs font-normal">
              Arsipkan soal
            </Label>
            <Switch id="q-archive" checked={isArchived} onCheckedChange={setIsArchived} />
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="q-explanation" className="text-xs font-medium">
          Pembahasan
        </Label>
        <Textarea
          id="q-explanation"
          rows={3}
          className="text-sm"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Jelaskan alasan jawaban benar."
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Materi Terkait</Label>
        <Select value={lessonId} onValueChange={setLessonId}>
          <SelectTrigger className="h-9 text-sm">
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
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Simpan Soal
        </Button>
      </div>
    </form>
  );
}

function IconAction({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted",
        active && "border-primary bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );
}
