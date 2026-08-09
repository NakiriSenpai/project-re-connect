import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Flag, List, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { useAttemptSession, useSaveAnswer, useSetFlag, useSubmitAttempt } from "@/hooks/attempt";
import { ExamAttemptExpiredError } from "@/services/attempt";

import type { AnswerLabel } from "@/types/exam";
import type { AttemptAnswerRow } from "@/types/attempt";
import { ATTEMPT_STATUS_LABELS } from "@/types/attempt";
import {
  ExitFullscreenDialog,
  LeaveExamDialog,
  SubmitExamDialog,
} from "../components/exam-dialogs";
import { AudioButton, AudioManagerProvider, useAudioManager } from "./audio-manager";
import {
  QuestionListDialog,
  QuestionListPanel,
  type PaletteGroup,
  type PaletteItem,
} from "./question-list-dialog";
import { AnswerShell, QuestionStem } from "./question-stem";
import { useExamTimer } from "../hooks/use-exam-timer";
import { useExamFullscreen } from "./use-exam-fullscreen";
import { useAntiCopy } from "./use-anti-copy";
import { useOrientation } from "./use-orientation";
import { WorkspaceGate } from "./workspace-gate";
import { WorkspaceBody, WorkspaceShell } from "./workspace-shell";

type LocalAnswer = { label: AnswerLabel | null; flagged: boolean };

export function ExamWorkspace({ attemptId }: { attemptId: string }) {
  return (
    <AudioManagerProvider attemptId={attemptId} lockAfterPlay>
      <ExamWorkspaceInner attemptId={attemptId} />
    </AudioManagerProvider>
  );
}

function ExamWorkspaceInner({ attemptId }: { attemptId: string }) {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const {
    data,
    isLoading: sessionLoading,
    isError,
    error,
  } = useAttemptSession(attemptId, !authLoading && isAuthenticated);
  const expiredAttempt = error instanceof ExamAttemptExpiredError;
  // Exam Runner tidak pernah dirender sebelum attempt + snapshot tersedia.
  const isLoading = authLoading || (isAuthenticated && !isError && (sessionLoading || !data));

  // Attempt yang sudah lewat waktu: sudah difinalisasi di data layer → buka hasil.
  useEffect(() => {
    if (!expiredAttempt) return;
    toast.info("Waktu ujian telah habis.");
    void navigate({ to: "/ujian/hasil/$attemptId", params: { attemptId } });
  }, [expiredAttempt, attemptId, navigate]);

  const saveAnswer = useSaveAnswer();
  const setFlagMutation = useSetFlag();
  const submit = useSubmitAttempt();
  const { busy: audioBusy } = useAudioManager();
  const orientation = useOrientation();
  useAntiCopy();

  const [activeIndex, setActiveIndex] = useState(0);
  const [local, setLocal] = useState<Record<string, LocalAnswer>>({});
  const [listOpen, setListOpen] = useState(false);
  const [asideOpen, setAsideOpen] = useState(false);
  const [gatePending, setGatePending] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const attempt = data?.attempt;
  const snapshot = data?.snapshot;
  const isRunning = attempt?.status === "in_progress";

  useEffect(() => {
    if (!data) return;
    const restored: Record<string, LocalAnswer> = {};
    for (const row of data.answers as AttemptAnswerRow[]) {
      restored[row.question_id] = { label: row.selected_label, flagged: row.is_flagged };
    }
    setLocal(restored);
  }, [data]);

  // Fullscreen lifecycle: satu sumber kebenaran.
  const fullscreen = useExamFullscreen({ enabled: Boolean(isRunning) && !submitting });

  const finish = useCallback(
    async (reason: "manual" | "time_up") => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmSubmit(false);
      fullscreen.beginSubmit();
      try {
        await submit.mutateAsync({ attemptId, reason });
        fullscreen.finish();
        toast.success(
          reason === "time_up"
            ? "Waktu habis. Ujian dikumpulkan otomatis."
            : "Ujian berhasil dikumpulkan.",
        );
        void navigate({ to: "/ujian/hasil/$attemptId", params: { attemptId } });
      } catch (submitError) {
        submittingRef.current = false;
        setSubmitting(false);
        void fullscreen.request();
        toast.error(
          submitError instanceof Error ? submitError.message : "Gagal mengumpulkan ujian.",
        );
      }
    },
    [attemptId, fullscreen, navigate, submit],
  );

  const {
    label: timerLabel,
    remaining,
    isReady: timerReady,
  } = useExamTimer(attempt?.expires_at, Boolean(isRunning) && !submitting, attempt?.started_at);

  useEffect(() => {
    if (isRunning && timerReady && remaining <= 0) void finish("time_up");
  }, [isRunning, timerReady, remaining, finish]);

  // Guard navigasi (browser back / link) — attempt TIDAK pernah disubmit karena ini.
  const blocker = useBlocker({
    shouldBlockFn: () => Boolean(isRunning) && !submittingRef.current,
    withResolver: true,
    enableBeforeUnload: false,
  });

  const questions = useMemo(() => snapshot?.questions ?? [], [snapshot]);
  const current = questions[activeIndex];
  const section = snapshot?.sections.find((s) => s.section_id === current?.section_id);

  const paletteGroups: PaletteGroup[] = useMemo(() => {
    if (!snapshot) return [];
    const items: PaletteItem[] = questions.map((q, index) => ({
      questionId: q.question_id,
      index,
      status: local[q.question_id]?.label ? "answered" : "unanswered",
      flagged: Boolean(local[q.question_id]?.flagged),
    }));
    const groups: PaletteGroup[] = [];
    for (const s of snapshot.sections) {
      const list = items.filter((p) => questions[p.index]?.section_id === s.section_id);
      if (list.length > 0) groups.push({ id: s.section_id, title: s.title, items: list });
    }
    const grouped = new Set(groups.flatMap((g) => g.items.map((i) => i.questionId)));
    const rest = items.filter((p) => !grouped.has(p.questionId));
    if (rest.length > 0) groups.push({ id: "lainnya", title: "Lainnya", items: rest });
    return groups;
  }, [snapshot, questions, local]);

  const needGate =
    Boolean(isRunning) &&
    !submitting &&
    !fullscreen.isExitRequested &&
    (orientation.needsRotate || !fullscreen.isActive);

  const enterExamMode = useCallback(async () => {
    setGatePending(true);
    try {
      if (orientation.needsRotate) await orientation.lock();
      await fullscreen.request();
    } finally {
      setGatePending(false);
    }
  }, [fullscreen, orientation]);

  const openQuestionList = () => {
    if (orientation.isSmallScreen) setListOpen(true);
    else setAsideOpen((value) => !value);
  };

  const answeredCount = Object.values(local).filter((a) => a.label).length;
  const locked = audioBusy;

  const choose = (label: AnswerLabel) => {
    if (!current || locked || !isRunning) return;
    setLocal((prev) => ({
      ...prev,
      [current.question_id]: { label, flagged: prev[current.question_id]?.flagged ?? false },
    }));
    saveAnswer.mutate(
      { attemptId, questionId: current.question_id, questionIndex: activeIndex, label },
      { onError: () => toast.error("Jawaban gagal disimpan. Periksa koneksi Anda.") },
    );
  };

  const toggleFlag = () => {
    if (!current || locked || !isRunning) return;
    const next = !local[current.question_id]?.flagged;
    setLocal((prev) => ({
      ...prev,
      [current.question_id]: { label: prev[current.question_id]?.label ?? null, flagged: next },
    }));
    setFlagMutation.mutate({
      attemptId,
      questionId: current.question_id,
      questionIndex: activeIndex,
      flagged: next,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Memulihkan ujian…
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="font-medium text-foreground">Sesi Anda berakhir. Silakan masuk kembali.</p>
          <Button onClick={() => void navigate({ to: "/login" })}>Masuk</Button>
        </CardContent>
      </Card>
    );
  }

  if (isError || !attempt || !snapshot || !current) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="font-medium text-foreground">
            {error instanceof Error ? error.message : "Ujian tidak dapat dimuat."}
          </p>
          <Button onClick={() => void navigate({ to: "/ujian" })}>Kembali ke daftar ujian</Button>
        </CardContent>
      </Card>
    );
  }

  if (!isRunning) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">{snapshot.exam.title}</h1>
          <p className="text-sm text-muted-foreground">
            Attempt ini sudah selesai ({ATTEMPT_STATUS_LABELS[attempt.status]}).
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() =>
                void navigate({ to: "/ujian/hasil/$attemptId", params: { attemptId } })
              }
            >
              Lihat hasil
            </Button>
            <Button variant="outline" onClick={() => void navigate({ to: "/ujian" })}>
              Kembali ke daftar ujian
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <WorkspaceShell
        asideOpen={asideOpen && !orientation.isSmallScreen}
        aside={
          <QuestionListPanel
            groups={paletteGroups}
            activeIndex={activeIndex}
            mode="exam"
            columns="compact"
            onJump={setActiveIndex}
          />
        }
        gate={
          needGate ? (
            <WorkspaceGate
              needsRotate={orientation.needsRotate}
              lockSupported={orientation.lockSupported}
              pending={gatePending}
              onEnter={() => void enterExamMode()}
            />
          ) : null
        }
        header={
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {snapshot.exam.title}
                {section ? <span className="text-muted-foreground"> · {section.title}</span> : null}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {answeredCount}/{questions.length} terjawab · Auto Save aktif
              </p>
            </div>
            <Badge
              variant={remaining <= 60 ? "destructive" : "secondary"}
              className="shrink-0 tabular-nums text-sm"
            >
              {timerLabel}
            </Badge>
            <Button
              size="sm"
              variant="destructive"
              disabled={locked}
              onClick={() => setConfirmSubmit(true)}
            >
              Submit
            </Button>
          </>
        }
        footer={
          <>
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={locked || activeIndex === 0}
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="mr-1 size-4" /> Sebelumnya
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={locked}
              onClick={openQuestionList}
              className="px-6"
            >
              <List className="mr-1.5 size-4" /> Daftar Soal ({questions.length})
            </Button>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={locked || activeIndex >= questions.length - 1}
                onClick={() => setActiveIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                Berikutnya <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </>
        }
      >
        <WorkspaceBody
          question={
            <QuestionStem
              questionId={current.question_id}
              number={activeIndex + 1}
              total={questions.length}
              sectionTitle={section?.title}
              sectionInstruction={section?.instruction}
              text={current.text}
              imageUrl={current.image_url}
              audioUrl={current.audio_url}
              right={
                <Button
                  type="button"
                  size="sm"
                  variant={local[current.question_id]?.flagged ? "default" : "outline"}
                  disabled={locked}
                  onClick={toggleFlag}
                >
                  <Flag className="mr-1.5 size-4" />
                  {local[current.question_id]?.flagged ? "Ditandai" : "Tandai"}
                </Button>
              }
            />
          }
          answers={
            <div>
              <div className="space-y-2">
                {current.answers.map((answer, answerIndex) => (
                  <AnswerShell
                    key={answer.label}
                    index={answerIndex}
                    selected={local[current.question_id]?.label === answer.label}
                    disabled={locked}
                    onClick={() => choose(answer.label)}
                  >
                    {answer.text ? (
                      <span className="block text-sm text-foreground">{answer.text}</span>
                    ) : null}
                    {answer.image_url ? (
                      <img
                        src={answer.image_url}
                        alt={`Pilihan ${answerIndex + 1}`}
                        loading="lazy"
                        draggable={false}
                        className="max-h-20 w-auto max-w-[min(100%,10rem)] rounded-lg border border-border object-contain sm:max-h-24"
                      />
                    ) : null}
                    {answer.audio_url ? (
                      <span
                        className="block"
                        role="presentation"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AudioButton
                          size="sm"
                          audioKey={`${current.question_id}:${answer.label}`}
                          src={answer.audio_url}
                          label={`Audio pilihan ${answerIndex + 1}`}
                        />
                      </span>
                    ) : null}
                    {!answer.text && !answer.image_url && !answer.audio_url ? (
                      <span className="block text-sm text-muted-foreground">
                        Pilihan {answerIndex + 1}
                      </span>
                    ) : null}
                  </AnswerShell>
                ))}
              </div>
            </div>
          }
        />
      </WorkspaceShell>

      <QuestionListDialog
        open={listOpen}
        onOpenChange={setListOpen}
        groups={paletteGroups}
        activeIndex={activeIndex}
        mode="exam"
        onJump={setActiveIndex}
      />

      <SubmitExamDialog
        open={confirmSubmit}
        unanswered={questions.length - answeredCount}
        onOpenChange={setConfirmSubmit}
        onConfirm={() => void finish("manual")}
        pending={submitting}
      />

      <ExitFullscreenDialog
        open={fullscreen.isExitRequested && !submitting}
        pending={submitting}
        onStay={() => fullscreen.cancelExit()}
        onExit={() => void finish("manual")}
      />

      <LeaveExamDialog
        open={blocker.status === "blocked"}
        onStay={() => blocker.reset?.()}
        onLeave={() => {
          fullscreen.release();
          blocker.proceed?.();
        }}
      />
    </>
  );
}
