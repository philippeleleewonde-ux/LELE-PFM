import { Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface AIFeatureBadgeProps {
  feature: string;
  enabled: boolean;
  className?: string;
}

export function AIFeatureBadge({ feature, enabled, className = '' }: AIFeatureBadgeProps) {
  if (!enabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`opacity-50 ${className}`}>
              <Sparkles className="w-3 h-3 mr-1" />
              {feature}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cette fonctionnalité IA nécessite un plan Silver ou supérieur</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="default" className={`bg-gradient-to-r from-purple-500 to-blue-500 ${className}`}>
      <Sparkles className="w-3 h-3 mr-1" />
      {feature}
    </Badge>
  );
}
