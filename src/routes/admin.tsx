import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { RequireAdmin } from "@/middleware";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — LPK Learning" },
      { name: "description", content: "Panel administrasi lembaga LPK Learning." },
      { property: "og:title", content: "Admin — LPK Learning" },
      { property: "og:description", content: "Panel administrasi lembaga LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppLayout>
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>
    </AppLayout>
  );
}
