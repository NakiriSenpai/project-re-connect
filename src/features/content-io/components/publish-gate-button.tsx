import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSetExamStatus } from "@/hooks/exam";
import { useSetLessonStatus } from "@/hooks/lesson";
import { recordContentIoAudit } from "@/services/content/bundle/audit.service";
import {
  validateExam,
  validateLesson,
  type ValidationReport,
} from "@/services/content/bundle/bundle-validation.service";
import { ValidationReportDialog } from "./validation-report-dialog";

/** Tombol publish dengan validasi konten wajib (ERROR memblok publish). */
export function PublishGateButton({
  kind,
  entityId,
  isPublished,
  label,
}: {
  kind: "exam" | "lesson";
  entityId: string;
  isPublished: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const setExamStatus = useSetExamStatus();
  const setLessonStatus = useSetLessonStatus();

  const runValidation = async () => {
    setOpen(true);
    setLoading(true);
    setReport(null);
    try {
      const result = kind === "exam" ? await validateExam(entityId) : await validateLesson(entityId);
      setReport(result);
      if (!result.canPublish) {
        void recordContentIoAudit({
          action: "publish_blocked",
          entity: `${kind}:${entityId}`,
          count: result.errorCount,
          result: "blocked",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memvalidasi konten.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    try {
      if (kind === "exam") {
        await setExamStatus.mutateAsync({ id: entityId, status: "published" });
      } else {
        await setLessonStatus.mutateAsync({ id: entityId, status: "published" });
      }
      toast.success(`${label} berhasil dipublish.`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mempublish konten.");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={isPublished ? "outline" : "default"}
        className="min-h-11"
        onClick={() => void runValidation()}
      >
        <ShieldCheck className="mr-1 size-4" />
        {isPublished ? "Validasi ulang" : "Validasi & Publish"}
      </Button>
      <ValidationReportDialog
        open={open}
        onOpenChange={setOpen}
        title={`Validasi ${label}`}
        report={report}
        loading={loading}
        onConfirm={() => void publish()}
      />
    </>
  );
}
