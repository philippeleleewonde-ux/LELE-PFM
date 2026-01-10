import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';
import { Target, Sparkles, TrendingUp, Award } from 'lucide-react';
import type { RoleDetails } from '@/data/roleDetails';

interface RoleTooltipProps {
  roleDetails: RoleDetails;
  children: React.ReactNode;
}

export const RoleTooltip = ({ roleDetails, children }: RoleTooltipProps) => {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={10}
            className="z-50 max-w-md"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-lg border border-primary/20 bg-card/95 backdrop-blur-sm p-5 shadow-2xl"
            >
              {/* Objective Section */}
              <div className="mb-4">
                <div className="flex items-start gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">Votre Mission</h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {roleDetails.objective}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="mb-4">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-primary mb-2">Fonctionnalités</h4>
                    <ul className="space-y-1.5">
                      {roleDetails.features.map((feature, index) => (
                        <li key={index} className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="mb-4">
                <div className="flex items-start gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-primary mb-2">Bénéfices Concrets</h4>
                    <ul className="space-y-1.5">
                      {roleDetails.benefits.map((benefit, index) => (
                        <li key={index} className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span>
                          <span className="leading-relaxed font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* USPs Section */}
              <div className="pt-3 border-t border-primary/10">
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-primary mb-1.5">LELE HCM Excellence</h4>
                    <ul className="space-y-1">
                      {roleDetails.usps.map((usp, index) => (
                        <li key={index} className="text-xs text-foreground/70 flex items-start gap-1.5">
                          <span className="text-primary/60">→</span>
                          <span className="leading-relaxed">{usp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tooltip Arrow */}
              <Tooltip.Arrow className="fill-card/95" />
            </motion.div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
