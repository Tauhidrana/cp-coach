import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Override displayed name (otherwise pulled from auth) */
  name?: string;
  /** Override avatar URL (otherwise pulled from auth google metadata) */
  src?: string | null;
};

export function UserAvatar({ className, name, src }: Props) {
  const { user, isGuest } = useAuth();
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const url =
    src ?? (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null;
  const display =
    name ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    (isGuest ? "Guest" : "Coder");
  const initial = display.charAt(0).toUpperCase();
  return (
    <Avatar className={cn("size-9 ring-1 ring-border/60", className)}>
      {url ? <AvatarImage src={url} alt={display} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className="bg-gradient-brand text-white text-sm font-semibold">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
