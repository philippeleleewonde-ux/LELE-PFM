// ============================================================================
// CAMPAIGN TIMELINE
// Horizontal Gantt-style timeline showing campaign periods over the year
// ============================================================================

import { useMemo } from 'react';
import { format, differenceInDays, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, CheckCircle2, Clock, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Campaign, CampaignStatus } from '@/hooks/useCampaigns';

interface CampaignTimelineProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string) => void;
  year?: number;
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_CONFIG: Record<CampaignStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof CheckCircle2;
}> = {
  completed: {
    label: 'Terminée',
    color: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-500',
    border: 'border-green-500',
    icon: CheckCircle2,
  },
  active: {
    label: 'En cours',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    icon: Clock,
  },
  planned: {
    label: 'Planifiée',
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-400',
    border: 'border-gray-400',
    icon: CalendarClock,
  },
};

export function CampaignTimeline({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  year,
}: CampaignTimelineProps) {
  const displayYear = year || new Date().getFullYear();
  const yearStart = startOfYear(new Date(displayYear, 0, 1));
  const yearEnd = endOfYear(new Date(displayYear, 0, 1));
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;

  // Filter campaigns that have dates and overlap with the display year
  const timelineCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (!c.start_date || !c.end_date) return false;
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      // Check if campaign overlaps with the display year
      return start <= yearEnd && end >= yearStart;
    });
  }, [campaigns, yearStart, yearEnd]);

  // Campaigns without dates (legacy)
  const legacyCampaigns = campaigns.filter(c => !c.start_date || !c.end_date);

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">Aucune campagne</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Lancez votre première campagne de satisfaction pour suivre l'évolution dans le temps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Calendrier des campagnes — {displayYear}
        </CardTitle>
        <CardDescription>
          Cliquez sur une campagne pour afficher ses résultats détaillés
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Timeline ruler */}
        {timelineCampaigns.length > 0 && (
          <div className="mb-6">
            {/* Month headers */}
            <div className="flex border-b border-border pb-1 mb-3">
              {MONTHS_FR.map((month, i) => (
                <div
                  key={month}
                  className="text-xs text-muted-foreground font-medium text-center"
                  style={{ width: `${100 / 12}%` }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Campaign bars */}
            <div className="space-y-2 relative">
              {/* Month grid lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="border-l border-border/30 h-full"
                    style={{ width: `${100 / 12}%` }}
                  />
                ))}
              </div>

              {/* Today marker */}
              {isWithinInterval(new Date(), { start: yearStart, end: yearEnd }) && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{
                    left: `${(differenceInDays(new Date(), yearStart) / totalDays) * 100}%`,
                  }}
                >
                  <div className="absolute -top-4 -translate-x-1/2 text-[9px] font-bold text-red-500 whitespace-nowrap">
                    Aujourd'hui
                  </div>
                </div>
              )}

              {timelineCampaigns.map(campaign => {
                const start = new Date(campaign.start_date!);
                const end = new Date(campaign.end_date!);
                const clampedStart = start < yearStart ? yearStart : start;
                const clampedEnd = end > yearEnd ? yearEnd : end;
                const leftPct = (differenceInDays(clampedStart, yearStart) / totalDays) * 100;
                const widthPct = Math.max(1, (differenceInDays(clampedEnd, clampedStart) / totalDays) * 100);
                const config = STATUS_CONFIG[campaign.status];
                const isSelected = campaign.id === selectedCampaignId;

                return (
                  <div key={campaign.id} className="relative h-9 group">
                    <button
                      onClick={() => onSelectCampaign(campaign.id)}
                      className={cn(
                        'absolute h-8 rounded-md flex items-center px-3 gap-2 text-xs font-medium text-white transition-all cursor-pointer',
                        'hover:brightness-110 hover:shadow-md',
                        config.bg,
                        isSelected && 'ring-2 ring-offset-2 ring-offset-background ring-[#FF4530] shadow-lg',
                      )}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        minWidth: '80px',
                      }}
                      title={`${campaign.title}\n${format(start, 'dd MMM yyyy', { locale: fr })} → ${format(end, 'dd MMM yyyy', { locale: fr })}`}
                    >
                      <span className="truncate">{campaign.title}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Campaign cards list (below timeline) */}
        <div className="space-y-2 mt-4">
          {campaigns.map(campaign => {
            const config = STATUS_CONFIG[campaign.status];
            const StatusIcon = config.icon;
            const isSelected = campaign.id === selectedCampaignId;

            return (
              <button
                key={campaign.id}
                onClick={() => onSelectCampaign(campaign.id)}
                className={cn(
                  'w-full flex items-center gap-4 p-3 rounded-lg border transition-all text-left',
                  'hover:bg-accent/50',
                  isSelected
                    ? 'border-[#FF4530] bg-[#FF4530]/5 dark:bg-[#FF4530]/10 shadow-sm'
                    : 'border-border',
                )}
              >
                <StatusIcon className={cn('w-5 h-5 flex-shrink-0', config.color)} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{campaign.title}</span>
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] px-1.5 py-0', config.color)}
                    >
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {campaign.start_date && campaign.end_date
                      ? `${format(new Date(campaign.start_date), 'dd MMM yyyy', { locale: fr })} → ${format(new Date(campaign.end_date), 'dd MMM yyyy', { locale: fr })}`
                      : `Créée le ${format(new Date(campaign.created_at), 'dd MMM yyyy', { locale: fr })}`
                    }
                  </p>
                </div>

                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[#FF4530] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
