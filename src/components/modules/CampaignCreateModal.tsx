// ============================================================================
// CAMPAIGN CREATE MODAL
// Modal with title + date range pickers for creating a new satisfaction campaign
// ============================================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { AccessKeyService } from '@/modules/module2/services/AccessKeyService';

interface CampaignCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (surveyId: string) => void;
  hasActiveCampaign: boolean;
}

export function CampaignCreateModal({
  open,
  onOpenChange,
  onCreated,
  hasActiveCampaign,
}: CampaignCreateModalProps) {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [creating, setCreating] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isValid =
    title.trim().length > 0 &&
    startDate !== undefined &&
    endDate !== undefined &&
    endDate > startDate;

  const handleCreate = async () => {
    if (!isValid || !companyId) return;

    setCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const accessCode = `SAT-${Date.now().toString(36).toUpperCase()}`;

      const { data: survey, error } = await supabase
        .from('surveys')
        .insert({
          title: title.trim(),
          description: `Campagne du ${format(startDate!, 'dd/MM/yyyy')} au ${format(endDate!, 'dd/MM/yyyy')}`,
          access_code: accessCode,
          company_id: companyId,
          created_by: user.user?.id,
          is_active: true,
          is_anonymous: true,
          start_date: format(startDate!, 'yyyy-MM-dd'),
          end_date: format(endDate!, 'yyyy-MM-dd'),
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      // Generate access keys (batch of 200)
      await AccessKeyService.createKeysForSurvey(survey!.id, 200);

      toast({
        title: 'Campagne créée',
        description: `"${title.trim()}" — du ${format(startDate!, 'dd MMM yyyy', { locale: fr })} au ${format(endDate!, 'dd MMM yyyy', { locale: fr })}`,
      });

      // Reset
      setTitle('');
      setStartDate(undefined);
      setEndDate(undefined);
      onOpenChange(false);
      onCreated(survey!.id);
    } catch (err) {
      console.error('Campaign creation error:', err);
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de créer la campagne',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nouvelle campagne de satisfaction</DialogTitle>
          <DialogDescription>
            Définissez la période de collecte des réponses. Une seule campagne peut être active à la fois.
          </DialogDescription>
        </DialogHeader>

        {hasActiveCampaign && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
            Une campagne est déjà en cours. Vous pourrez planifier cette campagne pour une date future.
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="campaign-title">Titre de la campagne</Label>
            <Input
              id="campaign-title"
              placeholder="Ex: Enquête Satisfaction S1 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start date */}
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd MMM yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < today}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End date */}
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd MMM yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || today)}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Validation messages */}
          {startDate && endDate && endDate <= startDate && (
            <p className="text-sm text-red-500">La date de fin doit être postérieure à la date de début.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isValid || creating}
            className="bg-[#FF4530] hover:bg-[#ff5745] text-white"
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer la campagne
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
