import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { RequireOwner } from "@/middleware";
import { TenantList } from "@/features/tenant/components/tenant-list";

export const Route = createFileRoute("/owner_/tenants")({
  head: () => ({
    meta: [
      { title: "Manajemen Tenant — LPK Learning" },
      {
        name: "description",
        content: "Kelola tenant lembaga pelatihan dan akun admin pertamanya.",
      },
      { property: "og:title", content: "Manajemen Tenant — LPK Learning" },
      {
        property: "og:description",
        content: "Kelola tenant lembaga pelatihan dan akun admin pertamanya.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerTenantsPage,
});

function OwnerTenantsPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <TenantList />
      </RequireOwner>
    </AppLayout>
  );
}
