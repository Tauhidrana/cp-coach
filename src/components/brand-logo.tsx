import logoAsset from "@/assets/cp-coach-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="CP Coach logo"
      className={cn("object-contain", className)}
      draggable={false}
    />
  );
}
