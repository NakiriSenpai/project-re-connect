import { createFileRoute } from "@tanstack/react-router";

import { ExamWorkspace } from "@/features/exam-engine/workspace/exam-workspace";

export const Route = createFileRoute("/ujian/$attemptId")({
  head: () => ({
    meta: [
      { title: "Sedang Ujian — LPK Learning" },
      { name: "description", content: "Halaman pengerjaan ujian dengan timer dan auto save." },
      { property: "og:title", content: "Sedang Ujian — LPK Learning" },
      {
        property: "og:description",
        content: "Halaman pengerjaan ujian dengan timer dan auto save.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UjianRunnerPage,
});

function UjianRunnerPage() {
  const { attemptId } = Route.useParams();
  return <ExamWorkspace attemptId={attemptId} />;
}
