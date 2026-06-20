import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  hover = false,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass rounded-2xl p-6",
        hover && "transition-all hover:bg-white/[0.03] hover:border-white/10 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
