import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider, } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { registerServiceWorker } from "@/lib/pwa/register-sw";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth/auth-context";
import { AppConfigProvider } from "@/contexts/config/app-config-context";
import { applyPortraitPolicy } from "@/features/exam-engine/workspace/use-orientation";
import { initOrientationBridge, setNativeOrientation } from "@/lib/twa/orientation-bridge";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "I:UM 이음 — Platform Belajar Bahasa Korea" },
      {
        name: "description",
        content: "Belajar bahasa Korea, hubungkan masa depan. Platform pembelajaran multi-tenant.",
      },
      { name: "theme-color", content: "#16162b" },
      { name: "application-name", content: "I:UM" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "I:UM" },
      { property: "og:title", content: "I:UM 이음 — Platform Belajar Bahasa Korea" },
      {
        property: "og:description",
        content: "Belajar bahasa Korea, hubungkan masa depan. Platform pembelajaran multi-tenant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Orientation policy global: semua halaman NON-EXAM dikunci portrait (best-effort).
 * Hanya workspace ujian (runner & review) yang boleh landscape sesuai pilihan user.
 */
const EXAM_WORKSPACE_PATTERN = /^\/ujian\/(review\/)?[^/]+\/?$/;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  // TWA bridge: pasang listener handshake sekali, lalu satu kali portrait di startup.
  useEffect(() => {
    initOrientationBridge();
    setNativeOrientation("portrait");
  }, []);

  useEffect(() => {
    const isExamWorkspace =
      EXAM_WORKSPACE_PATTERN.test(pathname) && !pathname.startsWith("/ujian/hasil");
    if (isExamWorkspace) return;
    applyPortraitPolicy(`route:${pathname}`);
  }, [pathname]);


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppConfigProvider>
            <ErrorBoundary>
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </ErrorBoundary>
            <Toaster />
          </AppConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
