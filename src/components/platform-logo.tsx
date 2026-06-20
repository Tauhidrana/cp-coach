import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PlatformMeta } from "@/lib/platforms/registry";

/** Inline brand-ish glyph per platform — keeps things crisp & dependency-free. */
export function PlatformLogo({ p, size = 36, className }: { p: PlatformMeta; size?: number; className?: string }) {
  return (
    <div
      className={cn("grid place-items-center rounded-xl font-display font-bold tracking-tight select-none", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
        color: "#fff",
        boxShadow: `0 8px 24px -10px ${p.color}80`,
        fontSize: size * 0.34,
      }}
    >
      {p.short}
    </div>
  );
}

export function FloatingLogos({ platforms }: { platforms: PlatformMeta[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {platforms.map((p, i) => {
        const top = 10 + ((i * 73) % 70);
        const left = 5 + ((i * 137) % 88);
        const size = 32 + ((i * 13) % 20);
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
            className="absolute hidden md:block"
            style={{ top: `${top}%`, left: `${left}%` }}
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 6 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            >
              <PlatformLogo p={p} size={size} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
