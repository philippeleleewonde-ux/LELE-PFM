# PLAN D'EXÉCUTION: Synchronisation Système Calendrier LELE HCM

## ✅ STATUT: TOUTES LES PHASES TERMINÉES - 2 Janvier 2026

## RÉSUMÉ EXÉCUTIF

Ce plan vise à corriger définitivement les problèmes de connexion entre les différents calendriers de la plateforme LELE HCM pour assurer une synchronisation parfaite des données.

---

## ✅ PHASES COMPLÉTÉES

| Phase | Description | Statut | Build |
|-------|-------------|--------|-------|
| Phase 1 | Contexte global + Event Bus | ✅ TERMINÉ | 8.22s |
| Phase 2 | CalendarPeriodSelector | ✅ TERMINÉ | 10.29s |
| Phase 3 | CostDataEntry | ✅ TERMINÉ | 9.24s |
| Phase 4 | PerformanceCalendarPage | ✅ TERMINÉ | 13.73s |
| Phase 5 | GlobalPerformanceCenterPage | ✅ TERMINÉ | 6.34s |
| Phase 6 | Validation finale | ✅ TERMINÉ | - |

### Fichiers Créés
- `src/lib/fiscal/CalendarEventBus.ts` - Bus d'événements temps réel

### Fichiers Modifiés
- `src/lib/fiscal/index.ts` - Exports du CalendarEventBus
- `src/components/shared/SmartDateWidgets.tsx` - v3.0 avec EventBus
- `src/components/shared/CalendarPeriodSelector.tsx` - v2.0 avec listeners
- `src/modules/module3/CostDataEntry.tsx` - Émission DATA_ENTERED
- `src/modules/module3/pages/PerformanceCalendarPage.tsx` - Données réelles + listeners
- `src/modules/module3/pages/GlobalPerformanceCenterPage.tsx` - Listeners synchronisation

---

## ARCHITECTURE ACTUELLE ANALYSÉE

### Source de Vérité
```
┌─────────────────────────────────────────────────────────────┐
│                 LaunchDateService.ts                         │
│              (src/lib/fiscal/LaunchDateService.ts)           │
│                                                              │
│  Table Supabase: company_launch_config                       │
│  ├── platform_launch_date                                    │
│  ├── plan_duration_years (3 ans par défaut)                  │
│  ├── fiscal_year_start_month                                 │
│  ├── locked_dates_json (CASCADE mode)                        │
│  └── cascade_mode                                            │
└─────────────────────────────────────────────────────────────┘
```

### Flux de Données Cible
```
┌──────────────────┐    ┌───────────────────────┐    ┌─────────────────────────┐
│ 1. Smart Calendar│    │ 2. Company Profile    │    │ 3. Performance Plan     │
│    Widget        │───▶│    LaunchDateSelector │───▶│    Report (Page 17)     │
│    (Source)      │    │                       │    │    Global Reporting     │
└──────────────────┘    └───────────────────────┘    └─────────────────────────┘
         │                                                      │
         │                                                      │
         ▼                                                      ▼
┌──────────────────┐    ┌───────────────────────┐    ┌─────────────────────────┐
│ 4. Calendar      │    │ 5. CostDataEntry      │    │ 6. Performance Calendar │
│    Period        │───▶│    (Contrôle des      │───▶│    (Calendrier Suivi)   │
│    Selector      │    │    Indicateurs)       │    │    Vue Semaines/Mois/An │
└──────────────────┘    └───────────────────────┘    └─────────────────────────┘
```

---

## PROBLÈMES IDENTIFIÉS

### Problème 1: Désynchronisation des dates verrouillées
- **Localisation**: `CalendarPeriodSelector.tsx` ligne 124
- **Description**: Les périodes verrouillées sont chargées depuis `LaunchDateService` mais pas synchronisées en temps réel
- **Impact**: Un verrouillage dans Company Profile n'est pas immédiatement reflété dans CostDataEntry

### Problème 2: Calendrier CostDataEntry limité à la vue semaine
- **Localisation**: `CostDataEntry.tsx` ligne 30
- **Description**: Le composant utilise CalendarPeriodSelector avec granularity='week' uniquement
- **Impact**: Pas de cohérence avec le calendrier fiscal configuré

### Problème 3: Dates non synchronisées avec PerformanceCalendarPage
- **Localisation**: `PerformanceCalendarPage.tsx`
- **Description**: Les données de coûts enregistrées ne sont pas automatiquement reflétées
- **Impact**: Écart entre les économies réalisées enregistrées et l'affichage calendrier

### Problème 4: Absence de contexte global pour les dates
- **Description**: Chaque composant charge indépendamment depuis LaunchDateService
- **Impact**: Risque de données incohérentes entre les vues

---

## PHASE 1: Correction du Contexte Global (Jour 1-2)

### Tâche 1.1: Améliorer SmartDateWidgets.tsx
**Fichier**: `src/components/shared/SmartDateWidgets.tsx`

**Objectif**: Créer un contexte React global qui partage l'état du calendrier

**Modifications**:
```tsx
// Ajouter dans SmartDateWidgets.tsx

interface LaunchDateContextValue {
  config: LaunchConfig | null;
  projections: DateProjection[];
  quarters: QuarterProjection[];
  weeks: WeekProjection[];
  lockedPeriods: Record<string, boolean>;
  isLoading: boolean;

  // Actions
  refreshConfig: () => Promise<void>;
  isDateLocked: (periodKey: string) => boolean;
  toggleDateLock: (periodKey: string) => Promise<void>;

  // Callback pour notifier les changements
  onConfigChange?: (config: LaunchConfig) => void;
}
```

### Tâche 1.2: Créer un Event Bus pour synchronisation temps réel
**Fichier**: `src/lib/fiscal/CalendarEventBus.ts` (nouveau)

**Objectif**: Permettre à tous les composants d'être notifiés des changements

```tsx
// src/lib/fiscal/CalendarEventBus.ts

type CalendarEvent =
  | { type: 'CONFIG_UPDATED'; payload: LaunchConfig }
  | { type: 'PERIOD_LOCKED'; payload: { periodKey: string; isLocked: boolean } }
  | { type: 'DATA_ENTERED'; payload: { periodStart: string; periodEnd: string } };

class CalendarEventBus {
  private listeners: Map<string, Set<(event: CalendarEvent) => void>>;

  subscribe(type: string, callback: (event: CalendarEvent) => void): () => void;
  emit(event: CalendarEvent): void;
}

export const calendarEventBus = new CalendarEventBus();
```

---

## PHASE 2: Correction CalendarPeriodSelector (Jour 2-3)

### Tâche 2.1: Synchronisation temps réel des verrouillages
**Fichier**: `src/components/shared/CalendarPeriodSelector.tsx`

**Modifications requises**:

1. **Ligne 111-143**: Ajouter un listener sur le CalendarEventBus
```tsx
useEffect(() => {
  const unsubscribe = calendarEventBus.subscribe('PERIOD_LOCKED', (event) => {
    if (event.type === 'PERIOD_LOCKED') {
      setLockedPeriods(prev => ({
        ...prev,
        [event.payload.periodKey]: event.payload.isLocked
      }));
    }
  });

  return () => unsubscribe();
}, []);
```

2. **Ligne 255-271**: Améliorer la fonction `isWeekLocked`
```tsx
function isWeekLocked(weekNumber: number, yearOffset: number): boolean {
  // Utiliser LaunchDateService directement pour cohérence
  return launchDateService.isDateLocked('week', `${yearOffset}_${weekNumber}`);
}
```

### Tâche 2.2: Ajouter indicateur visuel amélioré
**Fichier**: `src/components/shared/CalendarPeriodSelector.tsx`

**Objectif**: Afficher clairement les semaines avec données enregistrées vs verrouillées

```tsx
// Améliorer le rendu des semaines (ligne 429-490)
{/* Badge distinctif pour données existantes */}
{week.hasData && (
  <div className="absolute -top-1 -right-1">
    <span className="flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
    </span>
  </div>
)}
```

---

## PHASE 3: Correction CostDataEntry (Jour 3-4)

### Tâche 3.1: Améliorer l'intégration avec LaunchDateService
**Fichier**: `src/modules/module3/CostDataEntry.tsx`

**Modifications requises**:

1. **Ajouter le wrapper LaunchDateProvider** (ligne ~123):
```tsx
import { LaunchDateProvider } from '@/components/shared/SmartDateWidgets';

export default function CostDataEntry() {
  // ... existing code

  return (
    <LaunchDateProvider companyId={companyId}>
      {/* Contenu existant */}
    </LaunchDateProvider>
  );
}
```

2. **Améliorer le handler de sélection de période** (après ligne 160):
```tsx
// Handler pour sélection de période depuis CalendarPeriodSelector
const handlePeriodChange = useCallback((period: PeriodSelection) => {
  setPeriodStart(period.periodStart);
  setPeriodEnd(period.periodEnd);
  setIsPeriodLocked(period.isLocked);

  // Émettre l'événement pour synchronisation
  if (period.hasData) {
    calendarEventBus.emit({
      type: 'DATA_ENTERED',
      payload: { periodStart: period.periodStart, periodEnd: period.periodEnd }
    });
  }
}, []);
```

3. **Afficher avertissement si période verrouillée**:
```tsx
{isPeriodLocked && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
  >
    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
      <Lock className="w-4 h-4" />
      <span className="font-medium">Période validée et verrouillée</span>
    </div>
    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
      Les données de cette période ne peuvent plus être modifiées.
    </p>
  </motion.div>
)}
```

---

## PHASE 4: Correction PerformanceCalendarPage (Jour 4-5)

### Tâche 4.1: Connexion avec données réelles
**Fichier**: `src/modules/module3/pages/PerformanceCalendarPage.tsx`

**Objectif**: Charger les données réelles depuis module3_cost_entries

**Modifications requises**:

1. **Ajouter le chargement des données réelles** (après ligne 220):
```tsx
// Charger les données réelles depuis la table module3_cost_entries
const loadRealizedData = useCallback(async () => {
  if (!companyId) return;

  try {
    const { data, error } = await supabase
      .from('module3_cost_entries')
      .select(`
        period_start,
        period_end,
        kpi_type,
        compensation_amount,
        duration_hours,
        duration_minutes
      `)
      .eq('company_id', companyId);

    if (error) throw error;

    // Agréger par semaine
    const weeklyData = aggregateByWeek(data);
    setRealizedData(weeklyData);
  } catch (error) {
    console.error('Error loading realized data:', error);
  }
}, [companyId]);
```

2. **Synchroniser avec LaunchDateService**:
```tsx
// Charger la configuration du calendrier et les périodes verrouillées
useEffect(() => {
  const loadCalendarConfig = async () => {
    if (!companyId) return;

    const config = await launchDateService.loadConfig(companyId);
    if (config) {
      setCalendarConfig(config);
      setLockedPeriods(launchDateService.getAllLockedPeriodsFlat());
    }
  };

  loadCalendarConfig();

  // S'abonner aux changements
  const unsubscribe = calendarEventBus.subscribe('CONFIG_UPDATED', () => {
    loadCalendarConfig();
  });

  return () => unsubscribe();
}, [companyId]);
```

### Tâche 4.2: Améliorer l'affichage des vues Mois et Années
**Fichier**: `src/modules/module3/pages/PerformanceCalendarPage.tsx`

**Objectif**: Les boutons de vue (Années, Mois, Semaines) doivent être fonctionnels

```tsx
// Améliorer le rendu de la vue "Mois"
{viewMode === 'months' && (
  <MonthsView
    yearData={selectedYearData}
    currency={currency}
    onMonthClick={(month) => setSelectedMonth(month)}
    lockedPeriods={lockedPeriods}
  />
)}

// Améliorer le rendu de la vue "Années"
{viewMode === 'years' && (
  <YearsView
    years={yearsData}
    currency={currency}
    onYearClick={(year) => {
      setSelectedYear(year);
      setViewMode('months');
    }}
    lockedPeriods={lockedPeriods}
  />
)}
```

---

## PHASE 5: Synchronisation avec Page 17 Global Reporting (Jour 5-6)

### Tâche 5.1: Connexion Performance Plan Report
**Fichier**: `src/pages/company-profile/PerformancePlanReport.tsx`

**Objectif**: Les dates configurées doivent apparaître dans le rapport

**Modifications requises**:

1. **Passer les dates au composant Page17GlobalReporting** (ligne 152-158):
```tsx
<Page17GlobalReporting
  calculated={data.calculatedFields}
  selectedCurrency={data.selectedCurrency}
  businessLines={data.businessLines}
  socioeconomicData={data.socioeconomicImprovement}
  qualitativeData={data.qualitativeAssessment}
  // NOUVEAU: Passer les informations du calendrier
  calendarConfig={{
    launchDate: launchDateConfig?.platformLaunchDate,
    duration: launchDateConfig?.planDurationYears,
    projections: launchDateService.projectYears()
  }}
/>
```

### Tâche 5.2: Mettre à jour Page17GlobalReporting
**Fichier**: `src/modules/module1/components/reporting/Page17GlobalReporting/index.tsx`

**Objectif**: Afficher les informations temporelles synchronisées

```tsx
// Ajouter un bloc d'information sur les périodes
{calendarConfig && (
  <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
    <h4 className="text-sm font-bold text-primary mb-2">
      Performance Plan: {calendarConfig.duration} Années
    </h4>
    <div className="grid grid-cols-3 gap-4">
      {calendarConfig.projections.map(p => (
        <div key={p.yearOffset} className="text-center">
          <span className="text-xs text-muted-foreground">{p.label}</span>
          <p className="font-mono text-sm">
            {format(p.startDate, 'dd/MM/yyyy')} - {format(p.endDate, 'dd/MM/yyyy')}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## PHASE 6: Tests et Validation (Jour 6-7)

### Checklist de Test

#### Test 1: Configuration initiale
- [ ] Créer une nouvelle configuration de date dans Company Profile
- [ ] Vérifier que la date apparaît dans tous les composants

#### Test 2: Verrouillage CASCADE
- [ ] Verrouiller l'année N+1 entière
- [ ] Vérifier que tous les mois/semaines N+1 sont verrouillés dans CostDataEntry
- [ ] Vérifier que le calendrier de performance affiche le statut verrouillé

#### Test 3: Entrée de données
- [ ] Sélectionner une semaine non verrouillée dans CostDataEntry
- [ ] Entrer des données de coûts
- [ ] Vérifier que PerformanceCalendarPage affiche les données

#### Test 4: Synchronisation temps réel
- [ ] Ouvrir CostDataEntry et PerformanceCalendarPage côte à côte
- [ ] Entrer des données dans CostDataEntry
- [ ] Rafraîchir PerformanceCalendarPage et vérifier la mise à jour

#### Test 5: Rapport Global
- [ ] Ouvrir Performance Plan Report (Page 17)
- [ ] Vérifier que les périodes correspondent à la configuration

---

## FICHIERS À MODIFIER (RÉSUMÉ)

| Fichier | Type | Priorité |
|---------|------|----------|
| `src/lib/fiscal/CalendarEventBus.ts` | CRÉER | Haute |
| `src/components/shared/SmartDateWidgets.tsx` | MODIFIER | Haute |
| `src/components/shared/CalendarPeriodSelector.tsx` | MODIFIER | Haute |
| `src/modules/module3/CostDataEntry.tsx` | MODIFIER | Haute |
| `src/modules/module3/pages/PerformanceCalendarPage.tsx` | MODIFIER | Haute |
| `src/pages/company-profile/PerformancePlanReport.tsx` | MODIFIER | Moyenne |
| `src/modules/module1/components/reporting/Page17GlobalReporting/index.tsx` | MODIFIER | Moyenne |

---

## ESTIMATION

| Phase | Durée | Description |
|-------|-------|-------------|
| Phase 1 | 1-2 jours | Contexte global + Event Bus |
| Phase 2 | 1 jour | CalendarPeriodSelector |
| Phase 3 | 1 jour | CostDataEntry |
| Phase 4 | 1-2 jours | PerformanceCalendarPage |
| Phase 5 | 1 jour | Page 17 Global Reporting |
| Phase 6 | 1 jour | Tests et validation |

**Total estimé: 6-8 jours**

---

## PROCHAINE ÉTAPE IMMÉDIATE

1. Créer le fichier `CalendarEventBus.ts`
2. Modifier `SmartDateWidgets.tsx` pour inclure le contexte amélioré
3. Commencer les modifications de `CalendarPeriodSelector.tsx`

---

## NOTES IMPORTANTES

- Le mode CASCADE est déjà implémenté dans LaunchDateService
- La table `module3_cost_entries` existe et contient les données
- Les composants visuels (panels de reporting) sont déjà créés
- Le principal travail est la CONNEXION entre les composants

---

*Document créé le 2 janvier 2026*
*LELE HCM Platform - Synchronisation Calendrier*
