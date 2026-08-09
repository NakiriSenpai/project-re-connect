import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Library,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { PublishGateButton } from "@/features/content-io/components/publish-gate-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteQuestion,
  useDeleteSection,
  useExam,
  useExamQuestions,
  useExamSections,
  useReorderQuestions,
  useReorderSections,
} from "@/hooks/exam";
import {
  CATEGORY_LABELS,
  EXAM_DIFFICULTY_LABELS,
  EXAM_SECTION_LABELS,
  EXAM_STATUS_LABELS,
  formatPoints,
  pointsPerQuestion,
} from "@/features/exam/exam.constants";
import type { ExamQuestionWithAnswers, ExamSectionRow } from "@/types/exam";
import { QuestionFormDialog } from "./question-form-dialog";
import { SectionFormDialog } from "./section-form-dialog";
import { QuestionPickerDialog } from "@/features/question-bank/components/question-picker-dialog";

type Props = { examId: string };

export function ExamEditor({ examId }: Props) {
  const examQuery = useExam(examId);
  const sectionsQuery = useExamSections(examId);
  const questionsQuery = useExamQuestions(examId);

  const [sectionOpen, setSectionOpen] = useState(false);
  const [sectionEdit, setSectionEdit] = useState<ExamSectionRow | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionSectionId, setQuestionSectionId] = useState<string>("");
  const [questionEdit, setQuestionEdit] = useState<ExamQuestionWithAnswers | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const deleteSection = useDeleteSection();
  const deleteQuestion = useDeleteQuestion();
  const reorderSections = useReorderSections();
  const reorderQuestions = useReorderQuestions();

  const sections = sectionsQuery.data ?? [];
  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data]);
  const perQuestion = pointsPerQuestion(questions.length);

  const moveSection = async (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    try {
      await reorderSections.mutateAsync(next.map((s) => s.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengurutkan section.");
    }
  };

  const applyQuestionOrder = async (ordered: ExamQuestionWithAnswers[]) => {
    try {
      await reorderQuestions.mutateAsync(ordered.map((q) => q.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengurutkan soal.");
    }
  };

  const moveQuestionToNumber = async (questionId: string, targetNumber: number) => {
    const current = [...questions];
    const from = current.findIndex((q) => q.id === questionId);
    const to = Math.min(Math.max(targetNumber - 1, 0), current.length - 1);
    if (from < 0 || from === to) return;
    const [moved] = current.splice(from, 1);
    if (!moved) return;
    current.splice(to, 0, moved);
    await applyQuestionOrder(current);
  };

  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const current = [...questions];
    const from = current.findIndex((q) => q.id === dragId);
    const to = current.findIndex((q) => q.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = current.splice(from, 1);
    if (!moved) return;
    current.splice(to, 0, moved);
    setDragId(null);
    await applyQuestionOrder(current);
  };

  if (examQuery.isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }
  if (examQuery.isError || !examQuery.data) {
    return <p className="text-sm text-destructive">Exam tidak ditemukan.</p>;
  }

  const exam = examQuery.data;

  return (
    <section className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/owner/exam-studio">
          <ArrowLeft className="mr-1 size-4" /> Kembali ke daftar
        </Link>
      </Button>

      <header className="space-y-2 rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{exam.title}</h1>
            <p className="truncate text-xs text-muted-foreground">/{exam.slug}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant={exam.status === "published" ? "default" : "secondary"}>
              {EXAM_STATUS_LABELS[exam.status]}
            </Badge>
            <PublishGateButton
              kind="exam"
              entityId={exam.id}
              isPublished={exam.status === "published"}
              label="Exam"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <p>Kategori: {CATEGORY_LABELS[exam.category] ?? exam.category}</p>
          <p>Kesulitan: {EXAM_DIFFICULTY_LABELS[exam.difficulty]}</p>
          <p>Durasi: {exam.duration_minutes} menit</p>
          <p>Passing score: {exam.passing_score}</p>
          <p>Jumlah soal: {questions.length}</p>
          <p>
            Poin per soal:{" "}
            <span className="font-medium text-foreground">{formatPoints(perQuestion)}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Nilai total selalu 100 dan dibagi rata otomatis ke seluruh soal.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Section</h2>
        <Button
          size="sm"
          onClick={() => {
            setSectionEdit(null);
            setSectionOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" /> Section
        </Button>
      </div>

      {sectionsQuery.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : sections.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Belum ada section. Tambahkan section Reading atau Listening terlebih dahulu.
        </p>
      ) : (
        <ul className="space-y-4">
          {sections.map((section, index) => {
            const sectionQuestions = questions.filter((q) => q.section_id === section.id);
            return (
              <li key={section.id} className="space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{EXAM_SECTION_LABELS[section.type]}</Badge>
                      <p className="truncate font-medium">{section.title}</p>
                    </div>
                    {section.instruction ? (
                      <p className="mt-1 text-xs text-muted-foreground">{section.instruction}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Naikkan section"
                      onClick={() => void moveSection(index, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Turunkan section"
                      onClick={() => void moveSection(index, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSectionEdit(section);
                      setSectionOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 size-4" /> Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!window.confirm("Hapus section beserta seluruh soalnya?")) return;
                      try {
                        await deleteSection.mutateAsync(section.id);
                        toast.success("Section dihapus.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
                      }
                    }}
                  >
                    <Trash2 className="mr-1 size-4" /> Hapus
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setQuestionSectionId(section.id);
                      setQuestionEdit(null);
                      setQuestionOpen(true);
                    }}
                  >
                    <Plus className="mr-1 size-4" /> Soal Baru
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQuestionSectionId(section.id);
                      setPickerOpen(true);
                    }}
                  >
                    <Library className="mr-1 size-4" /> Ambil dari Bank
                  </Button>
                </div>

                {sectionQuestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada soal pada section ini.</p>
                ) : (
                  <ul className="space-y-2">
                    {sectionQuestions.map((question) => {
                      const number = questions.findIndex((q) => q.id === question.id) + 1;
                      return (
                        <li
                          key={question.id}
                          draggable
                          onDragStart={() => setDragId(question.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => void handleDrop(question.id)}
                          className="rounded-lg border bg-card p-3"
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="mt-1 size-4 shrink-0 cursor-grab text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {number}. {question.text}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {question.grammar_tags.length > 0
                                  ? `Tag: ${question.grammar_tags.map((t) => t.name).join(", ")} · `
                                  : ""}
                                {formatPoints(perQuestion)} poin
                              </p>
                              {question.explanation ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  Pembahasan: {question.explanation}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Input
                              className="h-8 w-20"
                              inputMode="numeric"
                              defaultValue={number}
                              aria-label="Pindah ke nomor"
                              onBlur={(e) => {
                                const value = Number(e.target.value);
                                if (Number.isFinite(value)) {
                                  void moveQuestionToNumber(question.id, value);
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">Nomor</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setQuestionSectionId(section.id);
                                setQuestionEdit(question);
                                setQuestionOpen(true);
                              }}
                            >
                              <Pencil className="mr-1 size-4" /> Ubah
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    "Lepas soal ini dari exam? Soal tetap tersimpan di Question Bank.",
                                  )
                                )
                                  return;
                                try {
                                  await deleteQuestion.mutateAsync(question.id);
                                  toast.success("Soal dilepas dari exam.");
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : "Gagal menghapus soal.",
                                  );
                                }
                              }}
                            >
                              <Trash2 className="mr-1 size-4" /> Hapus
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <SectionFormDialog
        open={sectionOpen}
        onOpenChange={setSectionOpen}
        examId={examId}
        section={sectionEdit}
      />
      {questionSectionId ? (
        <QuestionPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          examId={examId}
          sectionId={questionSectionId}
        />
      ) : null}
      {questionSectionId ? (
        <QuestionFormDialog
          open={questionOpen}
          onOpenChange={setQuestionOpen}
          examId={examId}
          sectionId={questionSectionId}
          question={questionEdit}
        />
      ) : null}
    </section>
  );
}
