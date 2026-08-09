import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";
import { RequireAuth } from "@/middleware";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil — LPK Learning" },
      { name: "description", content: "Profil pengguna LPK Learning." },
      { property: "og:title", content: "Profil — LPK Learning" },
      { property: "og:description", content: "Profil pengguna LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppLayout>
      <RequireAuth>
        <PagePlaceholder title="Profil" description="Data dan pengaturan akun." />
      </RequireAuth>
    </AppLayout>
  );
}
