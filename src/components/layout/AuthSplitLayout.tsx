import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/50">
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #4F46E5 0%, #4338CA 42%, #0F172A 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/30 to-transparent" />
        <div className="absolute left-8 top-8">
          <BrandLogo inverted size="md" />
        </div>
        <div className="absolute bottom-10 left-8 right-8 text-white">
          <p className="font-display text-3xl font-bold leading-tight">Industrial power. Refined control.</p>
          <p className="mt-2 max-w-md text-sm text-white/80">Multi-tenant POS for retailers — terminals, inventory, and live analytics.</p>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[440px] rounded-3xl border bg-card p-8 shadow-xl landing-fade-up sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
