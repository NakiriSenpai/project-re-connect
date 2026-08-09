import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CloudUpload, Database, Smartphone } from "lucide-react";

import { AppLayout } from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { useCloudinaryStatus, useSupabaseStatus } from "@/hooks/use-connection-status";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LPK Learning — Platform LMS Multi-Tenant" },
      {
        name: "description",
        content:
          "Fondasi platform pembelajaran multi-tenant untuk Lembaga Pelatihan Kerja: materi, ujian, dan peringkat dalam satu aplikasi.",
      },
      { property: "og:title", content: "LPK Learning — Platform LMS Multi-Tenant" },
      {
        property: "og:description",
        content: "Platform pembelajaran multi-tenant untuk Lembaga Pelatihan Kerja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Beranda,
});

function StatusBadge({ label, ok, loading }: { label: string; ok: boolean; loading: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
      <span
        aria-hidden
        className={
          loading
            ? "size-2 rounded-full bg-muted-foreground"
            : ok
              ? "size-2 rounded-full bg-chart-2"
              : "size-2 rounded-full bg-destructive"
        }
      />
      {label}: {loading ? "memeriksa…" : ok ? "terhubung" : "gagal"}
    </span>
  );
}

function Beranda() {
  const supabaseStatus = useSupabaseStatus();
  const cloudinaryStatus = useCloudinaryStatus();

  return (
    <AppLayout>
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Sprint 0 · Fondasi
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Platform LMS Multi-Tenant untuk Lembaga Pelatihan Kerja
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Fondasi aplikasi sudah siap: routing, tema terang/gelap, koneksi Supabase dan
            Cloudinary, serta dukungan PWA. Fitur pembelajaran menyusul pada sprint berikutnya.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label="Supabase"
            ok={supabaseStatus.data?.connected ?? false}
            loading={supabaseStatus.isPending}
          />
          <StatusBadge
            label="Cloudinary"
            ok={cloudinaryStatus.data?.connected ?? false}
            loading={cloudinaryStatus.isPending}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="min-h-12">
            <Link to="/dashboard">Buka Dasbor</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-12">
            <Link to="/login">Masuk</Link>
          </Button>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: BookOpen, title: "Materi & Ujian", text: "Struktur route siap dikembangkan." },
            { icon: Database, title: "Supabase", text: "Koneksi eksternal terkonfigurasi." },
            { icon: CloudUpload, title: "Cloudinary", text: "Helper unggah media tersedia." },
            { icon: Smartphone, title: "Mobile First", text: "Responsif dan ramah sentuhan." },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-lg border border-border p-4">
              <Icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-2 text-sm font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}
