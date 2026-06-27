import { Link } from "@tanstack/react-router";
import { type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bug,
  ChevronRight,
  Globe,
  Languages,
  Mail,
  MapPin,
  Moon,
  Sun,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { useTheme } from "@/components/theme-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FooterItem = {
  label: string;
  href: string;
  suffix?: string;
};

const platformLinks: readonly FooterItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "Daily Sheet", href: "/sheet" },
  { label: "AI Coach", href: "/coach" },
  { label: "Contests", href: "/contests" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Profile", href: "/settings" },
  { label: "Leaderboard", href: "/auth" },
] as const;

const PORTFOLIO_URL = "https://tauhidrana.vercel.app/";
const REPORT_BUG_URL = "mailto:support@cpcoach.xyz?subject=Bug%20Report%20-%20CP%20Coach";

const infoItems = [
  { label: "Bangladesh", href: null, icon: MapPin },
  { label: "cpcoach.xyz", href: "https://cpcoach.xyz", icon: Globe },
  { label: "support@cpcoach.xyz", href: "mailto:support@cpcoach.xyz", icon: Mail },
] as const;

const footerGroups = [
  { title: "Platform", links: platformLinks },
] as const;


function FooterLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  const openInNewTab = href.startsWith("http");
  const classes = cn(
    "group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
    className,
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={classes}
      >
        <span className="relative">
          {children}
          <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-gradient-brand transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
        </span>
      </a>
    );
  }

  return (
    <Link to={href} className={classes}>
      <span className="relative">
        {children}
        <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-gradient-brand transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
      </span>
    </Link>
  );
}

function FooterNavGroup({ title, links }: { title: string; links: readonly FooterItem[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-foreground/85">
        {title}
      </h3>
      <ul className="mt-6 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink href={link.href} className="justify-between w-full">
              <>
                <span>{link.label}</span>
                {link.suffix ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-primary">
                    {link.suffix}
                  </span>
                ) : null}
              </>
            </FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LanguageSelector() {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/3 p-1 backdrop-blur-md">
      <span className="px-2 text-muted-foreground" aria-hidden="true">
        <Languages className="size-4" />
      </span>
      <button
        type="button"
        className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        aria-pressed={true}
        aria-label="Selected language English"
      >
        English
      </button>
      <button
        type="button"
        className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        aria-pressed={false}
        aria-label="Switch language to Bangla"
      >
        বাংলা
      </button>
    </div>
  );
}

function ThemeModePill() {
  const { resolved, setMode } = useTheme();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/3 p-1 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setMode("dark")}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
          resolved === "dark"
            ? "bg-white/8 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={resolved === "dark"}
      >
        <Moon className="size-3.5" />
        Dark
      </button>
      <button
        type="button"
        onClick={() => setMode("light")}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
          resolved === "light"
            ? "bg-white/8 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={resolved === "light"}
      >
        <Sun className="size-3.5" />
        Light
      </button>
    </div>
  );
}

export function LandingFooter() {
  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <footer className="relative z-10 mt-8 overflow-hidden border-t border-white/10 bg-[#030712]">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="pointer-events-none absolute left-[12%] top-20 size-72 rounded-full bg-primary/14 blur-[120px]" />
      <div className="pointer-events-none absolute right-[8%] top-32 size-80 rounded-full bg-accent/14 blur-[140px]" />

      <div className="relative mx-auto max-w-360 px-6 py-14 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="hidden gap-8 lg:grid lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1.1fr]"
        >
          <div className="space-y-6">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="rounded-[20px] border border-white/10 bg-white/3 p-2 shadow-glow">
                  <BrandLogo className="size-11" />
                </span>
                <span>
                  <span className="block text-xl font-semibold tracking-tight">CP Coach</span>
                  <span className="block text-sm text-muted-foreground">
                    AI-powered CP companion
                  </span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                AI-powered Competitive Programming companion that helps programmers practice
                smarter, track progress, analyze performance, and climb ratings faster.
              </p>
            </div>

            <div className="space-y-3">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/3 text-foreground/80">
                      <Icon className="size-4" />
                    </span>
                    {item.href ? (
                      <FooterLink href={item.href}>{item.label}</FooterLink>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <div className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-foreground/85">
                Social
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Made by{" "}
                  <a
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Kazi Tauhid Rana
                  </a>
                </p>
                <motion.a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm text-foreground transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="absolute inset-px rounded-full bg-[#07101f]/90" />
                  <Globe className="relative z-10 size-4" />
                  <span className="relative z-10">Visit Portfolio</span>
                </motion.a>
              </div>
            </div>

          </div>

          {footerGroups.map((group) => (
            <FooterNavGroup key={group.title} title={group.title} links={group.links} />
          ))}

          <div className="relative">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-brand opacity-30 blur-2xl" />
            <div className="glass-strong relative overflow-hidden rounded-[24px] border-white/10 p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
              <div className="absolute right-0 top-0 size-28 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Bug className="size-3.5" /> Support
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">
                  Report a Bug
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Found something broken or unexpected? Let us know and we'll fix it fast.
                </p>
                <a href={REPORT_BUG_URL} className="mt-5 inline-flex">
                  <Button className="h-10 rounded-full border-0 bg-gradient-brand px-5 text-white shadow-glow hover:opacity-95">
                    Report a Bug <ArrowRight className="size-4" />
                  </Button>
                </a>


                <div className="mt-6 rounded-[22px] border border-white/10 bg-white/3 p-4">
                  <div className="text-lg font-semibold">Stay Updated</div>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    Get product updates, feature releases, and contest insights.
                  </p>
                  <form className="mt-3 space-y-2.5" onSubmit={handleNewsletterSubmit}>
                    <label className="sr-only" htmlFor="newsletter-email">
                      Enter your email
                    </label>
                    <Input
                      id="newsletter-email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-10 rounded-xl border-white/10 bg-black/20 px-4 text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-primary/70"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      aria-label="Subscribe to newsletter"
                      className="h-10 w-full rounded-xl border-white/10 bg-white/4 text-foreground hover:bg-white/8"
                    >
                      Subscribe <ChevronRight className="size-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="space-y-6 lg:hidden"
        >
          <div className="glass-strong rounded-[24px] p-5">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="rounded-[18px] border border-white/10 bg-white/3 p-2">
                <BrandLogo className="size-10" />
              </span>
              <div>
                <div className="text-lg font-semibold tracking-tight">CP Coach</div>
                <div className="text-sm text-muted-foreground">AI-powered CP companion</div>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              AI-powered Competitive Programming companion that helps programmers practice smarter,
              track progress, analyze performance, and climb ratings faster.
            </p>

            <div className="mt-5 space-y-3">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/3 text-foreground/80">
                      <Icon className="size-4" />
                    </span>
                    {item.href ? (
                      <FooterLink href={item.href}>{item.label}</FooterLink>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Made by{" "}
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  Kazi Tauhid Rana
                </a>
              </p>
              <motion.a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm text-foreground transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute inset-px rounded-full bg-[#07101f]/90" />
                <Globe className="relative z-10 size-4" />
                <span className="relative z-10">Visit Portfolio</span>
              </motion.a>
            </div>

          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-brand opacity-25 blur-2xl" />
            <div className="glass-strong relative rounded-[24px] p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Bug className="size-3.5" /> Support
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                Report a Bug
              </h3>
              <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                Found something broken or unexpected? Let us know and we'll fix it fast.
              </p>
              <a href={REPORT_BUG_URL} className="mt-4 inline-flex">
                <Button className="h-10 rounded-full border-0 bg-gradient-brand px-5 text-white shadow-glow hover:opacity-95">
                  Report a Bug <ArrowRight className="size-4" />
                </Button>
              </a>

            </div>
          </div>

          <Accordion
            type="single"
            collapsible
            className="glass-strong rounded-[24px] border border-white/10 px-5"
          >
            {footerGroups.map((group) => (
              <AccordionItem
                key={group.title}
                value={group.title}
                className="border-white/10 last:border-none"
              >
                <AccordionTrigger className="py-5 text-sm font-semibold uppercase tracking-[0.22em] hover:no-underline">
                  {group.title}
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="space-y-3">
                    {group.links.map((link) => (
                      <FooterLink
                        key={link.label}
                        href={link.href}
                        className="justify-between w-full"
                      >
                        <>
                          <span>{link.label}</span>
                          {link.suffix ? (
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-primary">
                              {link.suffix}
                            </span>
                          ) : null}
                        </>
                      </FooterLink>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="glass-strong rounded-[24px] p-5">
            <div className="text-lg font-semibold">Stay Updated</div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Get product updates, feature releases, and contest insights.
            </p>
            <form className="mt-3 space-y-2.5" onSubmit={handleNewsletterSubmit}>
              <label className="sr-only" htmlFor="newsletter-email-mobile">
                Enter your email
              </label>
              <Input
                id="newsletter-email-mobile"
                type="email"
                placeholder="Enter your email"
                className="h-10 rounded-xl border-white/10 bg-black/20 px-4 text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-primary/70"
              />
              <Button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="h-10 w-full rounded-xl border-0 bg-gradient-brand text-white shadow-glow hover:opacity-95"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </motion.div>

        <div className="mt-10 border-t border-white/10 pt-5">
                  <div className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              © 2026 CP Coach. All rights reserved. · Made by{" "}
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Kazi Tauhid Rana
              </a>
            </div>
            <div className="text-foreground/80">Practice Smarter. Climb Faster.</div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <LanguageSelector />
              <ThemeModePill />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
