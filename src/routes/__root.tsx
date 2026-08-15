import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "POSify — Multi-tenant POS for retailers" },
      {
        name: "description",
        content:
          "POSify is a multi-tenant point-of-sale platform for stores, branches, cashiers, and customers — checkout, inventory, shifts, and analytics.",
      },
      { name: "theme-color", content: "#4F46E5" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/logo.png", type: "image/png", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "shortcut icon", href: "/logo.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
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

function RootComponent() {
  const applyTheme = useUIStore((s) => s.applyTheme);
  // re-render-safe; useRouter ensures we're inside provider
  useRouter();
  useEffect(() => {
    applyTheme();
    const markReady = () => useAuthStore.setState({ hasHydrated: true });
    void useAuthStore.persist.rehydrate();
    const unsub = useAuthStore.persist.onFinishHydration(markReady);
    if (useAuthStore.persist.hasHydrated()) markReady();
    const fallback = window.setTimeout(markReady, 50);
    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, [applyTheme]);
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-center" className="sm:!top-4" />
    </>
  );
}
