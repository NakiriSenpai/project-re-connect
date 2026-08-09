import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { RequireAuth } from "@/middleware";

export const Route = createFileRoute("/materi")({
  head: () => ({
    meta: [
      { title: "Materi — LPK Learning" },
      { name: "description", content: "Materi pembelajaran LPK Learning yang sudah terbit." },
      { property: "og:title", content: "Materi — LPK Learning" },
      {
        property: "og:description",
        content: "Materi pembelajaran LPK Learning yang sudah terbit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MateriLayout,
});

function MateriLayout() {
  return (
    <AppLayout>
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    </AppLayout>
  );
}
