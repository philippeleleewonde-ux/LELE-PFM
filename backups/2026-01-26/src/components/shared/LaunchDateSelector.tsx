/**
 * ============================================
 * LELE HCM Widget Smart Calendar
 * ============================================
 *
 * Widget de calendrier intelligent pour le verrouillage
 * définitif des périodes de performance.
 *
 * FONCTIONNALITÉS:
 * - Configuration de la date de lancement
 * - Verrouillage individuel par période (N+1, N+2, N+3)
 * - Verrouillage global de toutes les périodes
 * - Propagation CASCADE aux SmartDateWidgets
 * - Design moderne et engageant
 *
 * @author LELE HCM Platform
 * @version 3.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Rocket,
  Target,
  CalendarDays,
  Check,
  ChevronRight,
  Sparkles,
  Clock,
  Flag,
  Trash2,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { launchDateService, DateProjection, LockedDateConfig } from '@/lib/fiscal/LaunchDateService';
import { calendarEventBus } from '@/lib/fiscal/CalendarEventBus';

interface LaunchDateSelectorProps {
  initialDate?: Date;
  initialDuration?: number;
  initialLockedPeriods?: LockedDateConfig;
  onSave: (date: Date, duration: number) => Promise<{ success: boolean; error?: string }>;
  onDelete?: () => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  onLockChange?: (lockedPeriods: LockedDateConfig) => Promise<{ success: boolean; error?: string }> | void;
  compact?: boolean;
  showProjections?: boolean;
}

export function LaunchDateSelector({
  initialDate,
  initialDuration = 3,
  initialLockedPeriods = {},
  onSave,
  onDelete,
  onCancel,
  onLockChange,
  compact = false,
  showProjections = true,
}: LaunchDateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [projections, setProjections] = useState<DateProjection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // États pour le verrouillage des périodes
  const [lockedPeriods, setLockedPeriods] = useState<LockedDateConfig>(initialLockedPeriods);
  const [lockingAll, setLockingAll] = useState(false);

  // États pour les dialogues de confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showModifyConfirm, setShowModifyConfirm] = useState(false);
  const [showLockAllConfirm, setShowLockAllConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ date: Date; duration: number } | null>(null);

  // Normaliser une date à midi pour éviter les problèmes de fuseau horaire
  const normalizeDate = useCallback((date: Date | undefined): Date | undefined => {
    if (!date) return undefined;
    // Créer une nouvelle date à midi en heure locale pour éviter les décalages UTC
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    console.log('[LaunchDateSelector] 📅 Normalizing date:', date.toISOString(), '→', normalized.toLocaleDateString('fr-FR'));
    return normalized;
  }, []);

  // Handler pour la sélection de date qui normalise immédiatement
  const handleDateSelect = useCallback((date: Date | undefined) => {
    const normalizedDate = normalizeDate(date);
    console.log('[LaunchDateSelector] 🗓️ Date selected:', date?.toISOString(), '→ normalized:', normalizedDate?.toLocaleDateString('fr-FR'));
    setSelectedDate(normalizedDate);
  }, [normalizeDate]);

  // Synchroniser selectedDate quand initialDate change (après rechargement depuis DB)
  useEffect(() => {
    if (initialDate) {
      const normalizedInitial = normalizeDate(initialDate);
      console.log('[LaunchDateSelector] 🔄 Syncing selectedDate with initialDate:', normalizedInitial?.toLocaleDateString('fr-FR'));
      setSelectedDate(normalizedInitial);
    }
  }, [initialDate, normalizeDate]);

  // Synchroniser duration quand initialDuration change
  useEffect(() => {
    setDuration(initialDuration);
  }, [initialDuration]);

  // Détecter si c'est une modification
  const isModification = initialDate !== undefined && selectedDate !== undefined &&
    initialDate.getTime() !== selectedDate.getTime();

  // Calculer si toutes les périodes sont verrouillées
  const allPeriodsLocked = projections.length > 0 && projections.every(p =>
    lockedPeriods[p.yearOffset]?.isLocked === true
  );

  // Compter les périodes verrouillées
  const lockedCount = Object.values(lockedPeriods).filter(p => p?.isLocked).length;

  // Calculer les projections quand la date change
  useEffect(() => {
    if (selectedDate) {
      launchDateService.setLaunchDate(selectedDate, duration);
      setProjections(launchDateService.projectYears());
    } else {
      setProjections([]);
    }
  }, [selectedDate, duration]);

  // Synchroniser les périodes verrouillées quand initialLockedPeriods change
  // (par exemple après chargement depuis Supabase)
  useEffect(() => {
    if (initialLockedPeriods && Object.keys(initialLockedPeriods).length > 0) {
      setLockedPeriods(initialLockedPeriods);
    }
  }, [initialLockedPeriods]);

  // Note: Les changements de verrouillage sont sauvegardés explicitement
  // lors du clic sur "Enregistrer" via executeSave, pas automatiquement

  // Toggle le verrouillage d'une période individuelle
  const togglePeriodLock = useCallback((yearOffset: number, projection: DateProjection) => {
    setLockedPeriods(prev => {
      const isCurrentlyLocked = prev[yearOffset]?.isLocked === true;
      const newLocked = { ...prev };

      if (isCurrentlyLocked) {
        // Déverrouiller
        newLocked[yearOffset] = {
          isLocked: false,
        };
      } else {
        // Verrouiller avec la date de fin de la période
        newLocked[yearOffset] = {
          isLocked: true,
          lockedDate: projection.endDate,
          lockedAt: new Date(),
        };
      }

      return newLocked;
    });
  }, []);

  // Verrouiller/Déverrouiller toutes les périodes
  const toggleAllLocks = useCallback(() => {
    if (allPeriodsLocked) {
      // Tout déverrouiller
      setLockedPeriods({});
    } else {
      // Demander confirmation avant de tout verrouiller
      setShowLockAllConfirm(true);
    }
  }, [allPeriodsLocked]);

  // Confirmer le verrouillage global
  const confirmLockAll = useCallback(() => {
    setLockingAll(true);
    const newLocked: LockedDateConfig = {};

    projections.forEach(p => {
      newLocked[p.yearOffset] = {
        isLocked: true,
        lockedDate: p.endDate,
        lockedAt: new Date(),
      };
    });

    setLockedPeriods(newLocked);
    setLockingAll(false);
    setShowLockAllConfirm(false);
  }, [projections]);

  // Gestion de la sauvegarde avec confirmation si modification
  const handleSave = async () => {
    if (!selectedDate) return;

    if (isModification) {
      setPendingSave({ date: selectedDate, duration });
      setShowModifyConfirm(true);
      return;
    }

    await executeSave(selectedDate, duration);
  };

  // Exécution effective de la sauvegarde
  const executeSave = async (date: Date, dur: number) => {
    setSaving(true);

    // Normaliser la date avant sauvegarde pour éviter les problèmes de fuseau horaire
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    console.log('[LaunchDateSelector] 💾 Saving normalized date:', normalizedDate.toLocaleDateString('fr-FR'), '(', normalizedDate.toISOString(), ')');

    // 1. Sauvegarder la date et la durée
    const result = await onSave(normalizedDate, dur);
    console.log('[LaunchDateSelector] 📋 onSave result:', JSON.stringify(result));
    console.log('[LaunchDateSelector] 📋 onLockChange provided:', !!onLockChange);
    console.log('[LaunchDateSelector] 📋 lockedPeriods state:', JSON.stringify(lockedPeriods, null, 2));

    // 2. Sauvegarder les périodes verrouillées si onLockChange est fourni
    if (result.success && onLockChange) {
      console.log('[LaunchDateSelector] 🔒 Calling onLockChange with lockedPeriods...');
      try {
        await onLockChange(lockedPeriods);
        // Émettre l'événement pour que les autres composants se mettent à jour (WeekCalendarSelector, etc.)
        console.log('[LaunchDateSelector] 🔒 Emitting PERIOD_LOCKED events:', lockedPeriods);
        // Émettre un événement pour chaque période (permet aux listeners de réagir)
        Object.entries(lockedPeriods).forEach(([yearOffset, data]) => {
          calendarEventBus.emitPeriodLocked(
            `year_${yearOffset}`,
            data?.isLocked ?? false,
            data?.lockedDate,
            true // cascadeMode
          );
        });
      } catch (e) {
        console.error('Error saving locked periods:', e);
      }
    }

    setSaving(false);
    setPendingSave(null);

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // Confirmation de modification
  const handleConfirmModify = async () => {
    setShowModifyConfirm(false);
    if (pendingSave) {
      await executeSave(pendingSave.date, pendingSave.duration);
    }
  };

  // Gestion de la suppression
  const handleDelete = async () => {
    if (!onDelete) return;

    setDeleting(true);
    const result = await onDelete();
    setDeleting(false);
    setShowDeleteConfirm(false);

    if (result.success) {
      setSelectedDate(undefined);
      setProjections([]);
      setLockedPeriods({});
      onCancel?.();
    }
  };

  const formatProjectionDate = (date: Date) => {
    return format(date, 'dd/MM/yy', { locale: fr });
  };

  // Mode compact (pour intégration dans un formulaire existant)
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4 text-primary" />
              Date de lancement
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP', { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={fr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-32">
            <Label className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              Durée
            </Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 an</SelectItem>
                <SelectItem value="2">2 ans</SelectItem>
                <SelectItem value="3">3 ans</SelectItem>
                <SelectItem value="5">5 ans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-6">
            <Button
              onClick={handleSave}
              disabled={!selectedDate || saving}
              className={cn(
                'transition-all',
                saved && 'bg-green-500 hover:bg-green-600'
              )}
            >
              {saving ? (
                'Enregistrement...'
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Enregistré
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </div>

        {/* Mini projections */}
        {showProjections && selectedDate && projections.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {projections.map((p) => (
              <Badge
                key={p.yearOffset}
                variant={p.isActive ? 'default' : 'secondary'}
                className="text-xs"
              >
                {p.label}: {formatProjectionDate(p.endDate)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mode complet - LELE HCM Widget Smart Calendar
  return (
    <TooltipProvider>
      <Card className="border border-border bg-card shadow-xl">
        <CardHeader className="border-b border-border pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border">
                  <CalendarDays className="w-7 h-7 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  LELE HCM Widget Smart Calendar
                  <Sparkles className="w-5 h-5 text-primary" />
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1 max-w-lg">
                  Après avoir réalisé votre plan de performance, bloquez définitivement les dates de votre calendrier de performance.
                </CardDescription>
              </div>
            </div>

            {/* Badge de statut de verrouillage global */}
            {selectedDate && projections.length > 0 && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300",
                allPeriodsLocked
                  ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                  : lockedCount > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              )}>
                {allPeriodsLocked ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {allPeriodsLocked
                    ? "Toutes périodes verrouillées"
                    : lockedCount > 0
                      ? `${lockedCount}/${projections.length} verrouillées`
                      : "Non verrouillé"
                  }
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Sélection de la date et durée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
                <CalendarDays className="w-5 h-5 text-primary" />
                Date de lancement plateforme
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-14 justify-start text-left font-normal text-base',
                      'bg-muted/50 border-border hover:bg-muted hover:border-primary/50',
                      'text-foreground transition-all duration-200',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                    {selectedDate ? (
                      format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
                    ) : (
                      <span>Choisir la date de démarrage</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    locale={fr}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Date à partir de laquelle vous commencez à exploiter la plateforme
              </p>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Target className="w-5 h-5 text-primary" />
                Durée du plan de performance
              </Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(parseInt(v))}
              >
                <SelectTrigger className="h-14 text-base bg-muted/50 border-border text-foreground hover:border-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 an - Court terme</SelectItem>
                  <SelectItem value="2">2 ans - Moyen terme</SelectItem>
                  <SelectItem value="3">3 ans - Standard (recommandé)</SelectItem>
                  <SelectItem value="5">5 ans - Long terme</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Horizon de planification des objectifs de performance
              </p>
            </div>
          </div>

          {/* Section de verrouillage - Périodes de Collecte des Données */}
          {showProjections && selectedDate && projections.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-border">
              {/* Header avec bouton de verrouillage global */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-xl text-foreground">Périodes de Collecte des Données</h3>
                </div>

                {/* Bouton Verrouiller/Déverrouiller Tout */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleAllLocks}
                      disabled={lockingAll}
                      size="lg"
                      className={cn(
                        "gap-2 px-6 font-semibold transition-all duration-300 shadow-lg",
                        allPeriodsLocked
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/25"
                          : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/25"
                      )}
                    >
                      {lockingAll ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : allPeriodsLocked ? (
                        <Unlock className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                      {allPeriodsLocked ? "Tout déverrouiller" : "Tout verrouiller"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>
                      {allPeriodsLocked
                        ? "Déverrouiller toutes les périodes pour permettre les calculs dynamiques"
                        : "Verrouiller toutes les périodes pour fixer définitivement vos objectifs"
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Liste des cartes de périodes - Layout horizontal moderne */}
              <div className="space-y-4">
                {projections.map((projection) => {
                  const isLocked = lockedPeriods[projection.yearOffset]?.isLocked === true;

                  return (
                    <div
                      key={projection.yearOffset}
                      className={cn(
                        'relative rounded-xl border-2 transition-all duration-300 overflow-hidden group',
                        isLocked
                          ? 'bg-green-500/5 dark:bg-green-500/10 border-green-500/30 shadow-sm'
                          : projection.isActive
                            ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 shadow-sm'
                            : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                      )}
                    >
                      {/* Effet de brillance au survol */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                      <div className="relative p-5">
                        {/* Ligne 1: Période + Statut + Dates */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4">

                          {/* Période + Statut */}
                          <div className="flex items-center gap-3 md:w-40 flex-shrink-0">
                            <Badge
                              className={cn(
                                "text-sm font-bold px-3 py-1.5",
                                isLocked
                                  ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50"
                                  : projection.isActive
                                    ? "bg-primary/20 text-primary border-primary/50"
                                    : "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {projection.label}
                            </Badge>
                            {projection.isActive && !isLocked && (
                              <Badge className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                En cours
                              </Badge>
                            )}
                            {isLocked && (
                              <Badge className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                                Verrouillé
                              </Badge>
                            )}
                          </div>

                          {/* Dates - DEMARRAGE et FIN côte à côte */}
                          <div className="flex flex-1 flex-col sm:flex-row gap-3">
                            {/* Démarrage */}
                            <div className="flex items-center gap-3 bg-muted/50 rounded-lg py-3 px-4 flex-1">
                              <CalendarIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Démarrage</span>
                              <div className="flex items-center gap-2 ml-auto">
                                <span className="font-mono font-bold text-foreground text-base">
                                  {formatProjectionDate(projection.startDate)}
                                </span>
                                {isLocked && <Lock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
                              </div>
                            </div>

                            {/* Fin de la période */}
                            <div className="flex items-center gap-3 bg-muted/50 rounded-lg py-3 px-4 flex-1">
                              <Flag className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin</span>
                              <div className="flex items-center gap-2 ml-auto">
                                <span className="font-mono font-bold text-foreground text-base">
                                  {formatProjectionDate(projection.endDate)}
                                </span>
                                {isLocked && <Lock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ligne 2: Bouton de verrouillage + Info (progression ou jours restants) */}
                        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Bouton de verrouillage */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => togglePeriodLock(projection.yearOffset, projection)}
                                className={cn(
                                  "flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg font-semibold text-sm",
                                  "border-2 transition-all duration-300 sm:w-auto w-full",
                                  isLocked
                                    ? "bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                                    : "bg-red-500/5 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                )}
                              >
                                {isLocked ? (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    Verrouillé
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-4 h-4" />
                                    Non verrouillé
                                  </>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>
                                {isLocked
                                  ? "Cliquez pour déverrouiller cette période (dates dynamiques)"
                                  : "Cliquez pour verrouiller cette période (date fixe)"
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>

                          {/* Barre de progression (si période active) */}
                          {projection.isActive && (
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground font-medium">Progression</span>
                                <span className="font-bold text-foreground">{projection.percentComplete}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all duration-500 rounded-full",
                                    isLocked ? "bg-green-500" : "bg-primary"
                                  )}
                                  style={{ width: `${projection.percentComplete}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Info jours restants (si période future) */}
                          {projection.isFuture && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
                              <Clock className="w-4 h-4" />
                              <span>Démarre dans <strong className="text-foreground">{projection.daysUntilStart} jours</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message explicatif */}
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl border",
                allPeriodsLocked
                  ? "bg-green-500/5 dark:bg-green-500/10 border-green-500/30"
                  : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
              )}>
                <div className="mt-0.5">
                  {allPeriodsLocked ? (
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="text-sm">
                  {allPeriodsLocked ? (
                    <>
                      <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                        Toutes vos périodes sont verrouillées
                      </p>
                      <p className="text-muted-foreground">
                        Les dates d'objectifs sont fixées. Tous les SmartDateWidgets du module
                        afficheront les dates verrouillées avec un cadenas vert.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        Mode dynamique actif
                      </p>
                      <p className="text-muted-foreground">
                        Les dates non verrouillées se recalculent automatiquement.
                        Verrouillez vos périodes pour fixer définitivement vos objectifs.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Indication de modification */}
          {isModification && initialDate && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Modification détectée
                </p>
                <p className="text-muted-foreground">
                  Date actuelle: {format(initialDate, 'd MMMM yyyy', { locale: fr })} →
                  Nouvelle date: {format(selectedDate!, 'd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            {/* Bouton Réinitialiser (gauche) */}
            <div>
              {onDelete && initialDate && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Suppression...' : 'Réinitialiser'}
                </Button>
              )}
            </div>

            {/* Boutons Annuler/Enregistrer (droite) */}
            <div className="flex items-center gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-border text-muted-foreground hover:bg-muted bg-transparent"
                >
                  Annuler
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!selectedDate || saving}
                size="lg"
                className={cn(
                  'min-w-[160px] font-semibold transition-all duration-300',
                  saved
                    ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25 text-white'
                    : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25'
                )}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </div>
                ) : saved ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Enregistré !
                  </>
                ) : (
                  <>
                    {isModification ? 'Modifier' : 'Enregistrer'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                Réinitialiser la configuration ?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-muted-foreground">
                <p>
                  Cette action va supprimer la date de lancement configurée
                  {initialDate && (
                    <span className="font-medium text-foreground">
                      {' '}({format(initialDate, 'd MMMM yyyy', { locale: fr })})
                    </span>
                  )}.
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  Les projections de périodes (N, N+1, N+2, N+3) ne seront plus disponibles
                  jusqu'à ce qu'une nouvelle date soit configurée.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-muted/80">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Suppression...' : 'Confirmer la réinitialisation'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmation de modification */}
        <AlertDialog open={showModifyConfirm} onOpenChange={setShowModifyConfirm}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                Confirmer la modification ?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-muted-foreground">
                <p>Vous allez modifier la date de lancement de la plateforme :</p>
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <p className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" />
                    <span>Ancienne date:</span>
                    <span className="font-medium text-foreground">
                      {initialDate && format(initialDate, 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Nouvelle date:</span>
                    <span className="font-medium text-foreground">
                      {pendingSave && format(pendingSave.date, 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </p>
                </div>
                <p className="text-amber-600 dark:text-amber-400">
                  Les projections de périodes seront recalculées en fonction de la nouvelle date.
                  {lockedCount > 0 && (
                    <span className="block mt-1">
                      {lockedCount} période(s) verrouillée(s) seront également recalculées.
                    </span>
                  )}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setPendingSave(null)}
                className="bg-muted border-border text-muted-foreground hover:bg-muted/80"
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmModify}
                className="bg-primary hover:bg-primary/90"
              >
                Confirmer la modification
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmation de verrouillage global */}
        <AlertDialog open={showLockAllConfirm} onOpenChange={setShowLockAllConfirm}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <ShieldCheck className="w-5 h-5" />
                Verrouiller toutes les périodes ?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-muted-foreground">
                <p>
                  Vous allez verrouiller <span className="font-bold text-foreground">{projections.length} périodes</span> :
                </p>
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  {projections.map(p => (
                    <div key={p.yearOffset} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{p.label}</span>
                      <span className="text-muted-foreground">
                        Fin: {formatProjectionDate(p.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Lock className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Une fois verrouillées, les dates d'objectifs seront fixes et tous les
                    SmartDateWidgets afficheront un cadenas vert.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-muted/80">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmLockAll}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                Tout verrouiller
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </TooltipProvider>
  );
}

export default LaunchDateSelector;
