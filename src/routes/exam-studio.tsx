import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";
import { RequireOwner } from "@/middleware";

export const Route = createFileRoute("/exam-studio")({
  head: () => ({
    meta: [
      { title: "Exam Studio — LPK Learning" },
      { name: "description", content: "Studio penyusunan ujian LPK Learning." },
      { property: "og:title", content: "Exam Studio — LPK Learning" },
      { property: "og:description", content: "Studio penyusunan ujian LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExamStudioPage,
});

function ExamStudioPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <PagePlaceholder title="Exam Studio" description="Penyusun soal dan ujian." />
      </RequireOwner>
    </AppLayout>
  );
}
