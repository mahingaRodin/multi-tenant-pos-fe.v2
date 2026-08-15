import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  to?: "/" | false;
  size?: "sm" | "md" | "lg";
  wordmark?: boolean;
  inverted?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { img: "size-8", text: "text-base" },
  md: { img: "size-9", text: "text-xl" },
  lg: { img: "size-11", text: "text-2xl" },
} as const;

export function BrandLogo({
  to = "/",
  size = "md",
  wordmark = true,
  inverted = false,
  className,
}: BrandLogoProps) {
  const s = sizeMap[size];
  const mark = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src="/logo.png"
        alt={wordmark ? "" : "POSify"}
        className={cn(s.img, "rounded-lg object-cover ring-1 ring-white/10")}
      />
      {wordmark && (
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            s.text,
            inverted ? "text-white" : "text-foreground",
          )}
        >
          POSify
        </span>
      )}
    </span>
  );

  if (!to) return mark;

  return (
    <Link to={to} className="inline-flex items-center" aria-label="POSify home">
      {mark}
    </Link>
  );
}
