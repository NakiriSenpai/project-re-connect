import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { RequireOwner } from "@/middleware";
import { LessonList } from "@/features/lesson/components/lesson-list";

export const Route = createFileRoute("/owner_/lesson-studio/")({
  head: () => ({
    meta: [
      { title: "Lesson Studio — LPK Learning" },
      { name: "description", content: "CMS materi pembelajaran LPK Learning." },
      { property: "og:title", content: "Lesson Studio — LPK Learning" },
      { property: "og:description", content: "CMS materi pembelajaran LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerLessonStudioPage,
});

function OwnerLessonStudioPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <LessonList />
      </RequireOwner>
    </AppLayout>
  );
}
