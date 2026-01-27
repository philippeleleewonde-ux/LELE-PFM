/**
 * ============================================
 * PerformanceCountdownBanner - Bandeau Countdown Performance
 * ============================================
 *
 * Bandeau affichant le countdown jusqu'au lancement ou les informations
 * de progression du plan de performance.
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Calendar,
  Target,
  Clock,
  TrendingUp,
  ChevronRight,
  Settings,
  Flag,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  launchDateService,
  CountdownInfo,
  useLaunchDate,
  LaunchConfig,
} from '@/lib/fiscal/LaunchDateService';

// ============================================
// LIVE COUNTDOWN COMPONENT
// ============================================

interface LiveCountdownProps {
  targetDate: Date;
  label: string;
}

function LiveCountdown({ targetDate, label }: LiveCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calcul initial
    calculateTimeLeft();

    // Mise à jour chaque seconde
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-2">
      <Flag className="w-5 h-5 text-purple-500" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1 font-mono font-semibold text-sm">
          <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
            {timeLeft.days}j
          </span>
          <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
            {String(timeLeft.hours).padStart(2, '0')}h
          </span>
          <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
            {String(timeLeft.minutes).padStart(2, '0')}m
          </span>
          <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>
    </div>
  );
}

interface PerformanceCountdownBannerProps {
  companyId: string;
  onConfigureClick?: () => void;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
  /** Config externe - si fournie, utilise cette config au lieu de charger via le hook */
  externalConfig?: LaunchConfig | null;
}

export function PerformanceCountdownBanner({
  companyId,
  onConfigureClick,
  variant = 'full',
  className,
  externalConfig,
}: PerformanceCountdownBannerProps) {
  const { config: hookConfig, loading, getProjections, hasLaunchDate: hookHasLaunchDate } = useLaunchDate(companyId);

  // Utiliser la config externe si fournie, sinon celle du hook
  const config = externalConfig !== undefined ? externalConfig : hookConfig;
  const hasLaunchDate = externalConfig !== undefined ? !!externalConfig?.platformLaunchDate : hookHasLaunchDate;
  const [countdown, setCountdown] = useState<CountdownInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mettre à jour les projections quand la config change
  useEffect(() => {
    if (config) {
      // Si config externe, mettre à jour le service avant de calculer
      if (externalConfig !== undefined && externalConfig) {
        launchDateService.setConfig(externalConfig);
      }
      const countdownInfo = launchDateService.getCountdown();
      if (countdownInfo) {
        setCountdown(countdownInfo);
      }
    }
  }, [config, externalConfig]);

  // Mettre à jour le temps chaque minute pour le countdown live
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={cn('animate-pulse bg-muted/50 rounded-lg h-16', className)} />
    );
  }

  // Pas de date configurée
  if (!hasLaunchDate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-500/5 p-4',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Date de lancement non configurée
              </p>
              <p className="text-sm text-muted-foreground">
                Définissez la date de démarrage de votre plan de performance
              </p>
            </div>
          </div>
          {onConfigureClick && (
            <Button
              variant="outline"
              onClick={onConfigureClick}
              className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurer
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  if (!countdown) return null;

  // Rendu selon le variant
  if (variant === 'minimal') {
    return (
      <MinimalBanner
        countdown={countdown}
        onConfigureClick={onConfigureClick}
        className={className}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <CompactBanner
        countdown={countdown}
        onConfigureClick={onConfigureClick}
        className={className}
      />
    );
  }

  // Version complète (full)
  return (
    <FullBanner
      countdown={countdown}
      onConfigureClick={onConfigureClick}
      className={className}
    />
  );
}

// ============================================
// VARIANTES DU BANNER
// ============================================

interface BannerVariantProps {
  countdown: CountdownInfo;
  onConfigureClick?: () => void;
  className?: string;
}

/**
 * Version minimale - Juste le countdown
 */
function MinimalBanner({ countdown, className }: BannerVariantProps) {
  const formatDate = (date: Date) => format(date, 'd MMM yyyy', { locale: fr });

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-2">
        <Rocket className="w-4 h-4 text-primary" />
        <span className="font-medium">{formatDate(countdown.launchDate)}</span>
      </div>
      <div className="h-4 w-px bg-border" />
      {countdown.isLaunched ? (
        <>
          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
            {countdown.percentComplete}% complété
          </Badge>
          <span className="text-muted-foreground">
            J+{countdown.daysElapsed}
          </span>
        </>
      ) : (
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
          J-{Math.abs(countdown.daysUntilLaunch)}
        </Badge>
      )}
    </div>
  );
}

/**
 * Version compacte - Une ligne avec infos essentielles
 */
function CompactBanner({ countdown, onConfigureClick, className }: BannerVariantProps) {
  const formatDate = (date: Date) => format(date, 'd MMMM yyyy', { locale: fr });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/20 p-3',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* Date de lancement */}
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Lancement</p>
              <p className="font-semibold">{formatDate(countdown.launchDate)}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Countdown ou Progression */}
          {countdown.isLaunched ? (
            <>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Progression</p>
                  <p className="font-semibold">{countdown.percentComplete}%</p>
                </div>
              </div>

              <div className="w-24">
                <Progress value={countdown.percentComplete} className="h-2" />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <p className="text-xs text-muted-foreground">Avant lancement</p>
                <p className="font-bold text-lg text-amber-600">
                  J-{Math.abs(countdown.daysUntilLaunch)}
                </p>
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-border" />

          {/* Prochain milestone - Countdown temps réel */}
          {countdown.nextMilestone && (
            <LiveCountdown
              targetDate={countdown.nextMilestone.date}
              label={countdown.nextMilestone.label}
            />
          )}
        </div>

        {onConfigureClick && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onConfigureClick}
                  className="shrink-0"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifier la date de lancement</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Version complète - Carte avec toutes les informations
 */
function FullBanner({ countdown, onConfigureClick, className }: BannerVariantProps) {
  const formatDate = (date: Date) => format(date, 'EEEE d MMMM yyyy', { locale: fr });
  const formatShortDate = (date: Date) => format(date, 'd MMM yyyy', { locale: fr });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-2 border-primary/20 overflow-hidden',
        className
      )}
    >
      {/* Header avec gradient animé */}
      <div className="relative bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 px-6 py-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                Plan Performance {countdown.isLaunched ? 'En Cours' : 'À Venir'}
                {countdown.isLaunched ? (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Actif
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Bientôt
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Lancement: {formatDate(countdown.launchDate)}
              </p>
            </div>
          </div>

          {onConfigureClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigureClick}
              className="bg-background/50 backdrop-blur-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Countdown principal */}
          <div className="text-center">
            <div className={cn(
              'text-5xl font-bold mb-1',
              countdown.isLaunched ? 'text-green-500' : 'text-amber-500'
            )}>
              {countdown.isLaunched
                ? `J+${countdown.daysElapsed}`
                : `J-${Math.abs(countdown.daysUntilLaunch)}`}
            </div>
            <p className="text-sm text-muted-foreground">
              {countdown.isLaunched
                ? "depuis le lancement"
                : "avant le lancement"}
            </p>
          </div>

          {/* Progression */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression du plan</span>
              <span className="text-sm font-bold text-primary">
                {countdown.percentComplete}%
              </span>
            </div>
            <Progress value={countdown.percentComplete} className="h-3 mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatShortDate(countdown.launchDate)}</span>
              <span>
                {countdown.daysElapsed} / {countdown.totalPlanDays} jours
              </span>
              <span>{formatShortDate(countdown.planEndDate)}</span>
            </div>
          </div>

          {/* Prochain milestone */}
          {countdown.nextMilestone && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Prochaine échéance</span>
              </div>
              <p className="font-semibold text-lg">{countdown.nextMilestone.label}</p>
              <p className="text-sm text-muted-foreground">
                {formatShortDate(countdown.nextMilestone.date)}
              </p>
              <Badge variant="outline" className="mt-2">
                <Clock className="w-3 h-3 mr-1" />
                {countdown.nextMilestone.daysRemaining} jours
              </Badge>
            </div>
          )}
        </div>

        {/* Années projetées */}
        {countdown.currentYear && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Période en cours</h4>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="default"
                className="text-lg px-4 py-2 bg-primary"
              >
                {countdown.currentYear.label}
              </Badge>
              <span className="text-muted-foreground">
                {formatShortDate(countdown.currentYear.startDate)} → {formatShortDate(countdown.currentYear.endDate)}
              </span>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Progression:</span>
                <span className="font-bold">{countdown.currentYear.percentComplete}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default PerformanceCountdownBanner;
