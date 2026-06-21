import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  LayoutDashboard,
  LineChart,
  ListChecks,
  Sparkles,
  Trophy,
  Map,
  LogOut,
  Plug,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/platforms", label: "Platforms", icon: Plug },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/sheet", label: "Daily Sheet", icon: ListChecks },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
  { to: "/contests", label: "Contests", icon: Trophy },
  { to: "/roadmap", label: "Roadmap", icon: Map },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isGuest } = useAuth();

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    (isGuest ? "Guest" : "Coder");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/50 bg-sidebar/60 backdrop-blur-xl">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 h-16 border-b border-border/50">
          <BrandLogo className="size-9" />
          <span className="font-display text-lg font-semibold tracking-tight">CP Coach</span>
        </Link>
        <LazyMotion features={domAnimation} strict>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "text-foreground bg-sidebar-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  {active && (
                    <m.span
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-lg ring-1 ring-primary/30 bg-primary/5"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="size-4 relative" />
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </LazyMotion>
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="size-9 rounded-full bg-gradient-brand grid place-items-center text-sm font-semibold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {isGuest ? "Guest session" : user?.email}
              </div>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 glass-strong flex items-center px-4 justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <BrandLogo className="size-8" />
          <span className="font-display font-semibold">CP Coach</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border/50">
          <div className="grid grid-cols-7 gap-1 px-1 py-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={`flex flex-col items-center gap-1 py-1 text-[10px] ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label.split(" ")[0]}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-28 lg:pb-12">{children}</div>
      </main>
    </div>
  );
}
