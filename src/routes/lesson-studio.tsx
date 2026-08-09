import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";
import { RequireOwner } from "@/middleware";

export const Route = createFileRoute("/lesson-studio")({
  head: () => ({
    meta: [
      { title: "Lesson Studio — LPK Learning" },
      { name: "description", content: "Studio penyusunan materi LPK Learning." },
      { property: "og:title", content: "Lesson Studio — LPK Learning" },
      { property: "og:description", content: "Studio penyusunan materi LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LessonStudioPage,
});

function LessonStudioPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <PagePlaceholder title="Lesson Studio" description="Penyusun materi pembelajaran." />
      </RequireOwner>
    </AppLayout>
  );
}
