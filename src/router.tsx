import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // SWR: show cached data instantly, revalidate in background
        staleTime: 5 * 60 * 1000, // 5 min — data is fresh
        gcTime: 30 * 60 * 1000, // 30 min — keep in memory
        refetchOnWindowFocus: false, // don't thrash on tab focus
        refetchOnReconnect: "always",
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Hover/touch + viewport prefetch → near-instant navigation
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
    // Query owns freshness, not the router cache
    defaultPreloadStaleTime: 0,
  });

  return router;
};
