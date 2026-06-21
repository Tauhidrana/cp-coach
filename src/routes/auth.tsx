import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CP Coach" },
      { name: "description", content: "Sign in to CP Coach with Google or continue as guest." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"google" | "guest" | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onGoogle = async () => {
    setLoading("google");
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (res.error) {
      toast.error("Google sign-in failed. Please try again.");
      setLoading(null);
      return;
    }
    if (!res.redirected) navigate({ to: "/dashboard" });
  };

  const onGuest = async () => {
    setLoading("guest");
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      toast.error("Guest sign-in unavailable. Please try Google.");
      setLoading(null);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen relative grid place-items-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none opacity-60" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <Link to="/" className="absolute top-6 left-6 text-sm text-muted-foreground flex items-center gap-2 hover:text-foreground transition">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 shadow-glow ring-1 ring-primary/15">
          <div className="flex flex-col items-center text-center mb-8">
            <BrandLogo className="size-24 mb-4" />
            <h1 className="text-2xl font-display font-semibold">Welcome to CP Coach</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to unlock your personalized practice
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onGoogle}
              disabled={loading !== null}
              className="w-full h-11 bg-white text-zinc-900 hover:bg-white/90 border-0 font-medium"
            >
              {loading === "google" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <GoogleIcon /> Continue with Google
                </>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card/80 px-3 text-muted-foreground">or</span></div>
            </div>

            <Button
              onClick={onGuest}
              disabled={loading !== null}
              variant="outline"
              className="w-full h-11 border-border/60 bg-white/[0.02]"
            >
              {loading === "guest" ? <Loader2 className="size-4 animate-spin" /> : "Continue as Guest"}
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            GitHub sign-in is coming in a future release.
            <br />By continuing, you agree to a privacy-friendly experience.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
