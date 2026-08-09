import { createFileRoute } from "@tanstack/react-router";

import { ExamStartList } from "@/features/exam-engine/components/exam-start-list";

export const Route = createFileRoute("/ujian/")({
  head: () => ({
    meta: [
      { title: "Daftar Ujian — LPK Learning" },
      { name: "description", content: "Pilih dan mulai ujian yang tersedia untuk Anda." },
      { property: "og:title", content: "Daftar Ujian — LPK Learning" },
      { property: "og:description", content: "Pilih dan mulai ujian yang tersedia untuk Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UjianIndexPage,
});

function UjianIndexPage() {
  return <ExamStartList />;
}
