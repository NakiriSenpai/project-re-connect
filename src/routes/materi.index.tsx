import { createFileRoute } from "@tanstack/react-router";

import { MateriHome } from "@/features/materi/components/materi-home";

export const Route = createFileRoute("/materi/")({
  head: () => ({
    meta: [
      { title: "Materi — Belajar per Kategori | LPK Learning" },
      {
        name: "description",
        content: "Progres belajar, kategori materi, dan daftar materi terbit LPK Learning.",
      },
      { property: "og:title", content: "Materi — Belajar per Kategori | LPK Learning" },
      {
        property: "og:description",
        content: "Progres belajar, kategori materi, dan daftar materi terbit LPK Learning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MateriHome,
});
