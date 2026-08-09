import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { RequireOwner } from "@/middleware";
import { UserList } from "@/features/users/components/user-list";

export const Route = createFileRoute("/owner_/users")({
  head: () => ({
    meta: [
      { title: "Manajemen User — LPK Learning" },
      { name: "description", content: "Kelola seluruh pengguna pada semua tenant LPK Learning." },
      { property: "og:title", content: "Manajemen User — LPK Learning" },
      {
        property: "og:description",
        content: "Kelola seluruh pengguna pada semua tenant LPK Learning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerUsersPage,
});

function OwnerUsersPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <UserList scope="owner" />
      </RequireOwner>
    </AppLayout>
  );
}
