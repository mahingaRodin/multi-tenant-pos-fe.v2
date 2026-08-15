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

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#4F46E5" />
      <rect x="14" y="12" width="36" height="28" rx="5" fill="#FFFFFF" />
      <rect x="18" y="16" width="28" height="16" rx="2.5" fill="#EEF2FF" />
      <rect x="21" y="20" width="12" height="3" rx="1.5" fill="#4F46E5" />
      <rect x="21" y="25.5" width="18" height="2.5" rx="1.25" fill="#C7D2FE" />
      <path d="M22 44h20l3 10H19z" fill="#FFFFFF" />
      <path d="M24 47.5h16M23.5 51h17" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="48" cy="48" r="4.5" fill="#6366F1" />
    </svg>
  );
}

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
      <Mark className={cn(s.img, "shrink-0")} />
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
