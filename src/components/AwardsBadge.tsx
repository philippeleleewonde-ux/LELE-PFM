import { CheckCircle2, TrendingUp, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorldFinanceLogo } from "@/components/WorldFinanceLogo";

/**
 * AwardsBadge Component
 *
 * Displays LELE HCM's World Finance Innovation Awards 2025 recognition
 * with multiple variants for different placements on the landing page.
 *
 * Variants:
 * - hero: Compact badge for hero section (above logo)
 * - trust-bar: Full-width strip with detailed awards info
 * - detailed: Complete section with all jury criteria
 */

interface AwardsBadgeProps {
  variant?: "hero" | "trust-bar" | "detailed";
  className?: string;
}

export function AwardsBadge({ variant = "hero", className }: AwardsBadgeProps) {

  // Hero Badge Variant - Compact, high-impact
  if (variant === "hero") {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-6 py-3 rounded-full",
        "bg-gradient-to-r from-brand-cyan/10 to-brand-navy/10",
        "border-2 border-primary/30",
        "shadow-elegant hover:shadow-glow transition-smooth",
        "dark:from-brand-cyan/20 dark:to-brand-navy/20",
        className
      )}>
        <WorldFinanceLogo size="sm" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm font-semibold text-primary">
            World Finance Innovation Awards
          </span>
          <span className="text-xs sm:text-sm font-bold text-foreground">
            Winner 2025
          </span>
        </div>
      </div>
    );
  }

  // Trust Bar Variant - Full-width strip
  if (variant === "trust-bar") {
    return (
      <div className={cn(
        "w-full bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5",
        "border-y border-primary/20",
        "py-6",
        "dark:from-primary/10 dark:via-accent/20 dark:to-primary/10",
        className
      )}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
            {/* Main Award */}
            <div className="flex items-center gap-3">
              <WorldFinanceLogo size="md" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Proud Winner
                </span>
                <span className="text-base sm:text-lg font-bold text-primary">
                  World Finance Innovation Awards 2025
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="hidden lg:block w-px h-12 bg-border" />

            {/* Key Achievements - Horizontal Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                ESG Integration Leader
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-foreground">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Sustainable Finance Pioneer
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                SASB & TCFD Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detailed Section Variant - Complete awards showcase
  if (variant === "detailed") {
    const achievements = [
      {
        icon: TrendingUp,
        title: "Innovation en Fintech ESG",
        description: "Fusion des indicateurs ESG, analyse coûts-bénéfices et engagements RH pour optimiser les pratiques durables."
      },
      {
        icon: Shield,
        title: "Conformité Réglementaire",
        description: "Solutions de reporting transparentes alignées sur SASB et TCFD pour exceller dans les exigences mondiales."
      },
      {
        icon: Globe,
        title: "Finance Verte Cloud",
        description: "Intégration ESG dans les flux comptables quotidiens avec reporting économique basé sur le cloud."
      },
      {
        icon: CheckCircle2,
        title: "Impact Mesurable",
        description: "Résultats prouvés en Amérique du Nord, générant conformité et impact commercial significatif."
      }
    ];

    return (
      <section className={cn(
        "w-full py-16 sm:py-20 bg-gradient-to-br from-background via-primary/5 to-background",
        className
      )}>
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <WorldFinanceLogo size="lg" />
              <h2 className="text-3xl sm:text-4xl font-bold text-primary">
                Reconnu pour l'Excellence
              </h2>
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">
              World Finance Innovation Awards 2025
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Lele-HCM a été distingué pour son excellence dans l'innovation fintech,
              la finance durable et la conformité réglementaire ESG.
            </p>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="group bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-smooth hover:shadow-elegant"
              >
                <achievement.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-smooth" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {achievement.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>

          {/* Additional Recognition */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <span className="text-sm text-muted-foreground">Critères du jury :</span>
              {[
                "Innovation Fintech",
                "Cadres Holistiques",
                "Impact Marché",
                "Analytique Pionnière",
                "Gestion Proactive"
              ].map((criteria, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {criteria}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
