# ADR-005: Stratégie de Fallback des Données - Centre de Performance

**Date**: 2026-01-31
**Statut**: Approuvé
**Décideurs**: Équipe Technique HCM
**Catégorie**: Architecture

## Contexte

Le Centre de Performance doit afficher les données de performance des employés de manière fiable, même en cas de problèmes de connectivité ou d'incohérence des données. Les données peuvent provenir de plusieurs sources avec différents niveaux de fraîcheur et de fiabilité.

## Décision

Nous implémentons une stratégie de fallback à **4 niveaux** avec priorités décroissantes :

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE 4 NIVEAUX                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  NIVEAU 1: localStorage 'hcm_bulletin_performances'       │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  • Source: PerformanceRecapPage après validation          │  │
│  │  • Fraîcheur: Immédiate (dernière validation utilisateur) │  │
│  │  • Fiabilité: Haute (données calculées et vérifiées)      │  │
│  │  • Cas d'usage: Affichage instantané après validation     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓ Si vide ou invalide               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  NIVEAU 2: PeriodResultsService (Supabase)                │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  • Source: Table module3_period_results                   │  │
│  │  • Fraîcheur: Période validée (verrouillée)               │  │
│  │  • Fiabilité: Très haute (données persistantes, auditées) │  │
│  │  • Cas d'usage: Consultation de périodes passées          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓ Si non trouvé                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  NIVEAU 3: PerformanceCacheService (Supabase)             │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  • Source: Table module3_performance_cache                │  │
│  │  • Fraîcheur: 60 minutes maximum                          │  │
│  │  • Fiabilité: Moyenne (cache temporaire)                  │  │
│  │  • Cas d'usage: Accélération du chargement                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓ Si expiré ou vide                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  NIVEAU 4: module3_cost_entries (Supabase)                │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  • Source: Saisies brutes des coûts                       │  │
│  │  • Fraîcheur: Temps réel                                  │  │
│  │  • Fiabilité: Données brutes (non agrégées)               │  │
│  │  • Cas d'usage: Fallback ultime, recalcul à la volée      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Flux de Données Détaillé

### 1. Chargement Initial

```typescript
async function loadPerformanceData(companyId: string, fiscalWeek: number) {
  // NIVEAU 1: localStorage (priorité maximale)
  const bulletinData = localStorage.getItem('hcm_bulletin_performances');
  if (bulletinData) {
    const parsed = JSON.parse(bulletinData);
    if (parsed.data?.length > 0 && parsed.fiscalWeek === fiscalWeek) {
      return { source: 'bulletin', data: parsed.data };
    }
  }

  // NIVEAU 2: PeriodResults (données validées)
  const periodResults = await periodResultsService.getPeriodResults(fiscalWeek, fiscalYear);
  if (periodResults?.employee_details?.length > 0) {
    return { source: 'period_results', data: periodResults.employee_details };
  }

  // NIVEAU 3: PerformanceCache (cache 60 min)
  const cachedData = await performanceCacheService.getFromCache(companyId);
  if (cachedData && !cacheService.isExpired(cachedData)) {
    return { source: 'cache', data: cachedData };
  }

  // NIVEAU 4: cost_entries (fallback ultime)
  const rawEntries = await supabase
    .from('module3_cost_entries')
    .select('*')
    .eq('company_id', companyId);

  return { source: 'cost_entries', data: calculateFromRaw(rawEntries) };
}
```

### 2. Mise à Jour des Données

| Événement | Action | Niveaux Affectés |
|-----------|--------|------------------|
| Saisie de coûts | Invalide cache | 3, 4 |
| Validation période | Écrit dans tous | 1, 2, 3, 4 |
| Changement de semaine | Efface localStorage | 1 |
| Expiration cache (60 min) | Recharge niveau 4 | 3 |

### 3. Synchronisation Smart Calendar

```typescript
// Écoute des événements calendrier
useCalendarEvent('DATA_ENTERED', (event) => {
  // Nouvelle saisie → invalider cache niveau 3
  performanceCacheService.invalidateCache(companyId);
});

useCalendarEvent('PERIOD_LOCKED', (event) => {
  // Période verrouillée → niveau 2 devient source de vérité
  periodResultsService.lockPeriod(fiscalWeek, fiscalYear);
});
```

## Conséquences

### Avantages

1. **Résilience**: L'application fonctionne même en cas de panne partielle
2. **Performance**: Chargement quasi-instantané via localStorage
3. **Cohérence**: Les données validées (niveau 2) sont immuables
4. **Flexibilité**: Possibilité de recalculer à tout moment via niveau 4

### Inconvénients

1. **Complexité**: 4 sources à maintenir et synchroniser
2. **Décalage possible**: Entre niveau 1 et niveau 4 (quelques secondes max)
3. **Stockage**: Duplication des données sur plusieurs niveaux

### Risques Mitigés

| Risque | Mitigation |
|--------|------------|
| Désynchronisation | Invalidation automatique + TTL cache |
| Données corrompues | Validation JSON + sanitization |
| Stockage excessif | Limite 60 min cache + nettoyage périodique |

## Métriques

- **Cache Hit Rate** cible: > 80%
- **Temps de chargement P95**: < 500ms
- **Fallback vers niveau 4**: < 5% des requêtes

## Références

- `src/modules/module3/pages/PerformanceCenterPage.tsx` - Implémentation principale
- `src/modules/module3/services/PerformanceCacheService.ts` - Service cache (niveau 3)
- `src/modules/module3/services/PeriodResultsService.ts` - Service période (niveau 2)
- `src/lib/fiscal/CalendarEventBus.ts` - Bus d'événements calendrier

---

*Document créé le 31 janvier 2026 - Version 3.1.0*
