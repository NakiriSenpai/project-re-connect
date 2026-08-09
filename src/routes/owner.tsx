import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { OwnerDashboard } from "@/features/dashboard/components/owner-dashboard";
import { RequireOwner } from "@/middleware";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Dashboard Owner — LPK Learning" },
      { name: "description", content: "Pusat pengelolaan platform LPK Learning untuk pemilik." },
      { property: "og:title", content: "Dashboard Owner — LPK Learning" },
      {
        property: "og:description",
        content: "Pusat pengelolaan platform LPK Learning untuk pemilik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPage,
});

function OwnerPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <OwnerDashboard />
      </RequireOwner>
    </AppLayout>
  );
}
