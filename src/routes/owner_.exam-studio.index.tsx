import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { RequireOwner } from "@/middleware";
import { ExamList } from "@/features/exam/components/exam-list";

export const Route = createFileRoute("/owner_/exam-studio/")({
  head: () => ({
    meta: [
      { title: "Exam Studio — LPK Learning" },
      { name: "description", content: "Susun ujian, section, dan soal LPK Learning." },
      { property: "og:title", content: "Exam Studio — LPK Learning" },
      { property: "og:description", content: "Susun ujian, section, dan soal LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerExamStudioPage,
});

function OwnerExamStudioPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <ExamList />
      </RequireOwner>
    </AppLayout>
  );
}
