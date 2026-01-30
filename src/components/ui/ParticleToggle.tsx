/**
 * Toggle pour activer/désactiver le background de particules
 */

import { useState, useEffect } from 'react';
import { Sparkles, SparklesIcon } from 'lucide-react';
import { Button } from './button';
import { areParticlesEnabled, setParticlesEnabled } from '@/lib/particles';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';

interface ParticleToggleProps {
  className?: string;
}

export function ParticleToggle({ className }: ParticleToggleProps) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(areParticlesEnabled());
  }, []);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    setParticlesEnabled(newState);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className={className}
          aria-label={enabled ? 'Désactiver les particules' : 'Activer les particules'}
        >
          {enabled ? (
            <Sparkles className="h-5 w-5 text-primary" />
          ) : (
            <SparklesIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{enabled ? 'Désactiver l\'animation' : 'Activer l\'animation'}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default ParticleToggle;
