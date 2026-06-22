import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That route doesn't exist in CP Coach. Head back home.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  // Automatic retry with backoff: 1s, 2s, 5s — then show the fallback.
  useEffect(() => {
    if (attempt >= 3) {
      setShowFinal(true);
      return;
    }
    const delays = [1000, 2000, 5000];
    const t = setTimeout(async () => {
      try {
        await router.invalidate();
        reset();
      } finally {
        setAttempt((a: number) => a + 1);
      }
    }, delays[attempt]);
    return () => clearTimeout(t);
  }, [attempt, router, reset]);

  if (!showFinal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Restoring your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">We're reconnecting</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something interrupted the last request. Your data is safe — try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              setAttempt(0);
              setShowFinal(false);
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm">
            Home
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CP Coach — Practice Smarter. Climb Faster." },
      {
        name: "description",
        content:
          "AI-powered competitive programming coach. Unified profile across Codeforces, CodeChef, LeetCode and AtCoder with personalized daily sheets, analytics, and an AI coach.",
      },
      { name: "author", content: "CP Coach" },
      { property: "og:site_name", content: "CP Coach" },
      { property: "og:title", content: "CP Coach — Practice Smarter. Climb Faster." },
      {
        property: "og:description",
        content:
          "AI-powered app for competitive programmers to analyze performance, track progress, and generate personalized practice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CP Coach — Practice Smarter. Climb Faster." },
      {
        name: "twitter:description",
        content:
          "AI-powered app for competitive programmers to analyze performance, track progress, and generate personalized practice.",
      },
      {
        name: "description",
        content:
          "AI-powered app for competitive programmers to analyze performance, track progress, and generate personalized practice.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/EsKhWk4aepQPvU6BSdXYnkV49n73/social-images/social-1782017576876-ChatGPT_Image_Jun_21,_2026,_10_09_52_AM.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/EsKhWk4aepQPvU6BSdXYnkV49n73/social-images/social-1782017576876-ChatGPT_Image_Jun_21,_2026,_10_09_52_AM.webp",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);

  const persister = useMemo(
    () =>
      typeof window === "undefined"
        ? undefined
        : createSyncStoragePersister({
            storage: window.localStorage,
            key: "cp-coach-query-cache",
            throttleTime: 1000,
          }),
    [],
  );

  return (
    <ThemeProvider>
      {persister ? (
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 30, // 30 min on-disk cache
            buster: "v1",
          }}
        >
          <Outlet />
          <ThemedToaster />
        </PersistQueryClientProvider>
      ) : (
        // SSR / no-window fallback — render without persistence
        <QueryClientFallback queryClient={queryClient}>
          <Outlet />
          <ThemedToaster />
        </QueryClientFallback>
      )}
    </ThemeProvider>
  );
}

function QueryClientFallback({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function ThemedToaster() {
  const { resolved } = useTheme();
  return <Toaster theme={resolved} />;
}
