import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { AuthButton } from "@/features/auth/components/auth-button";
import { MaintenanceGate } from "@/components/common/maintenance-gate";
import { useAuth } from "@/hooks/auth";
import { useAppConfig } from "@/hooks/config";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/auth";

type NavItem = { to: string; label: string; flag?: string };

/**
 * Bottom navigation hanya berisi FITUR APLIKASI (learning), bukan management.
 * Seluruh menu management tetap berada di dashboard masing-masing role.
 */
const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  owner: [
    { to: "/owner", label: "Beranda" },
    { to: "/ujian", label: "Ujian", flag: "exam_engine" },
    { to: "/materi", label: "Materi", flag: "lesson" },
    { to: "/profile", label: "Profil" },
  ],
  admin: [
    { to: "/admin", label: "Beranda" },
    { to: "/ujian", label: "Ujian", flag: "exam_engine" },
    { to: "/materi", label: "Materi", flag: "lesson" },
    { to: "/profile", label: "Profil" },
  ],
  guru: [
    { to: "/teacher", label: "Beranda" },
    { to: "/ujian", label: "Ujian", flag: "exam_engine" },
    { to: "/materi", label: "Materi", flag: "lesson" },
    { to: "/leaderboard", label: "Peringkat", flag: "leaderboard" },
    { to: "/profile", label: "Profil" },
  ],
  siswa: [
    { to: "/dashboard", label: "Beranda" },
    { to: "/materi", label: "Materi", flag: "lesson" },
    { to: "/ujian", label: "Ujian", flag: "exam_engine" },
    { to: "/leaderboard", label: "Peringkat", flag: "leaderboard" },
    { to: "/profile", label: "Profil" },
  ],
};

const STUDENT_NAV: NavItem[] = NAV_BY_ROLE.siswa;

/** Bottom navigation disembunyikan saat ujian berjalan di mode layar penuh. */
function useIsFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    handler();
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  return isFullscreen;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const { config, isFeatureEnabled, version } = useAppConfig();
  const isFullscreen = useIsFullscreen();

  const navItems = (role ? NAV_BY_ROLE[role] : STUDENT_NAV).filter(
    (item) => !item.flag || isFeatureEnabled(item.flag),
  );

  if (isFullscreen) {
    return (
      <MaintenanceGate>
        <div className="min-h-screen bg-background text-foreground">
          <main className="mx-auto w-full max-w-5xl px-3 py-3">{children}</main>
        </div>
      </MaintenanceGate>
    );
  }

  return (
    <MaintenanceGate>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt={`Logo ${config.appName}`}
                  className="h-7 w-auto max-w-[120px] object-contain"
                  loading="lazy"
                />
              ) : null}
              <span>{config.shortName}</span>
            </Link>
            <div className="flex items-center gap-1">
              <AuthButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
          {children}
          <p className="pt-8 text-center text-[11px] text-muted-foreground">
            {config.appName} · v{version}
          </p>
        </main>

        <nav
          aria-label="Navigasi utama"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:static md:border-t-0"
        >
          <ul className="mx-auto flex w-full max-w-5xl items-stretch justify-between px-2 md:justify-center md:gap-4 md:py-3">
            {navItems.map((item) => (
              <li key={item.to} className="flex-1 md:flex-none">
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-12 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors md:text-sm",
                    pathname === item.to
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </MaintenanceGate>
  );
}
