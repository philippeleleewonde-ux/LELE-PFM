import { cn } from "@/lib/utils";
import { Award } from "lucide-react";

/**
 * WorldFinanceLogo Component
 *
 * Displays the World Finance Innovation Awards 2025 logo.
 * Falls back to trophy icon if logo is not available.
 */

interface WorldFinanceLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export function WorldFinanceLogo({ className, size = "md" }: WorldFinanceLogoProps) {
  const logoPath = "/assets/world-finance-logo.png";

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Glow effect background */}
      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse -z-10" />

      {/* Logo Image with fallback to Trophy Icon */}
      <img
        src={logoPath}
        alt="World Finance Innovation Awards 2025"
        className={cn(
          sizeClasses[size],
          "object-contain relative z-10",
          "transition-smooth hover:scale-110"
        )}
        onError={(e) => {
          // Fallback to trophy icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "block";
        }}
      />

      {/* Fallback Trophy Icon (hidden by default) */}
      <Award
        className={cn(
          sizeClasses[size],
          "text-primary hidden",
          "transition-smooth hover:scale-110"
        )}
        strokeWidth={1.5}
      />
    </div>
  );
}
