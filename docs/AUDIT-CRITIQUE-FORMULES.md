# 🚨 AUDIT CRITIQUE - Formules de Calcul des Performances

**Date**: 2026-01-31 (Mise à jour)
**Statut**: EN COURS - Diagnostic approfondi
**Impact**: Tous les salariés ont A+ malgré des coûts générés

---

## Historique des Corrections

| Date | Bug | Statut |
|------|-----|--------|
| 2026-01-31 | BUG 2: Grade simplifié (6 au lieu de 10) | ✅ CORRIGÉ |
| 2026-01-31 | BUG 3: calculateGlobalNote non utilisé | ✅ CORRIGÉ |
| 2026-01-31 | BUG 1: Math.max(0, économies) | ⚠️ À ANALYSER |

---

## Problème Principal Restant

### Tous les salariés ont A+ - Pourquoi?

**Observation**: Sophie Moreau (Studio de Production) a un **grade A+** alors qu'elle génère des **coûts**.

**Hypothèses analysées**:

#### Hypothèse 1: Math.max(0, économies) ❌ Non confirmée

Le plafonnement à 0 devrait donner une note de 0/10 = Grade E, pas A+.

```typescript
// Lignes 3374-3376 de PerformanceRecapPage.tsx
const ecoN1 = Math.max(0, indData.economiesRealisees || 0);
const ecoN2 = Math.max(0, indData.economiesRealiseesN2 || 0);
const empEconomies = ecoN1 + ecoN2;
```

Si économies = -500€ → Math.max(0, -500) = 0€
Note = 0 / PPR × 10 = 0/10 = **Grade E**

⚠️ **Donc ce n'est PAS la cause du A+**

---

#### Hypothèse 2: Les économies sources sont POSITIVES ✅ Probable

**Formule des économies** (`usePerformanceCalculations.ts`):

```typescript
// Ligne 121-128
export const calculateEconomiesRealiseesBrut = (
  pprPrevues: number,
  pertesConstatees: number
): number => {
  if (pertesConstatees < 0) return pprPrevues - 0;
  if (pertesConstatees > 0) return pprPrevues - pertesConstatees;
  if (pertesConstatees === 0) return pprPrevues - pertesConstatees;
  return 0;
};
```

**Économies = PPR - Pertes**

Si `pertesConstatees = 0` → `économies = PPR - 0 = PPR`
→ Note = PPR / PPR × 10 = **10/10 = A+**

**CAUSE RACINE IDENTIFIÉE**:
> Les `pertesConstatees` sont à **0** car les `cost_entries` ne sont pas enregistrés ou pas utilisés dans le calcul.

---

## Flux de Données - Analyse Complète

```
┌────────────────────────────────────────────────────────────────────┐
│ NIVEAU 1: SAISIE DES DONNÉES                                       │
│ Page: CostDataEntry.tsx                                            │
│ Table: module3_cost_entries                                        │
│ Champs: employee_id, kpi_type, compensation_amount, duration_*     │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼ (agrégation par employé/KPI)
┌────────────────────────────────────────────────────────────────────┐
│ NIVEAU 2: CALCUL DES PERFORMANCES                                  │
│ Hook: usePerformanceCalculations.ts                                │
│ Fonction: calculateIndicatorData()                                 │
│                                                                    │
│ Entrées:                                                           │
│   - kpiEntries (cost_entries pour l'employé/KPI)                   │
│   - member (données du salarié)                                    │
│   - params (recettes, dépenses, volume horaire)                    │
│   - pprSettings (PPR par indicateur)                               │
│                                                                    │
│ Calculs:                                                           │
│   fraisCollectes = SUM(compensation_amount)                        │
│   scoreFinancier = tempsCalcul × marge horaire                     │
│   pertesConstatees = (scoreFinancier + frais) - PPR                │
│   economiesRealisees = PPR - pertesConstatees                      │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼ (transfert via localStorage)
┌────────────────────────────────────────────────────────────────────┐
│ NIVEAU 3: BULLETIN DE PERFORMANCE                                  │
│ Page: PerformanceRecapPage.tsx                                     │
│ Sauvegarde: localStorage('hcm_bulletin_performances')              │
│                                                                    │
│ Calculs (lignes 3355-3427):                                        │
│   totalEconomies = SUM(Math.max(0, indData.economiesRealisees))    │
│   globalNote = calculateGlobalNote(totalEconomies, totalObjectif)  │
│   grade = calculateGrade(globalNote)                               │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼ (lecture depuis localStorage)
┌────────────────────────────────────────────────────────────────────┐
│ NIVEAU 4: CENTRE DE LA PERFORMANCE                                 │
│ Page: PerformanceCenterPage.tsx                                    │
│ Affichage: Note, Grade, Économies par employé                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Diagnostic: Sophie Moreau

### Scénarios Possibles

| # | Scénario | Conséquence | Probabilité |
|---|----------|-------------|-------------|
| 1 | Aucun cost_entry pour Sophie | frais=0, pertes=0, éco=PPR=100%=A+ | **HAUTE** |
| 2 | cost_entries existent mais mal liés | employee_id incorrect | Moyenne |
| 3 | PPR non configurés (=0) | éco=0-0=0, objectif=0 → A+ | Faible |
| 4 | kpi_type incorrect dans cost_entries | Données ignorées | Moyenne |

### Vérification Requise

```sql
-- 1. Vérifier les cost_entries de Sophie
SELECT * FROM module3_cost_entries
WHERE employee_id = (
  SELECT id FROM module3_team_members
  WHERE name ILIKE '%Sophie Moreau%'
);

-- 2. Vérifier les PPR configurés
SELECT * FROM company_ppr_settings
WHERE company_id = 'VOTRE_COMPANY_ID';

-- 3. Vérifier le business_line de Sophie
SELECT m.name, m.business_line_id, bl.activity_name
FROM module3_team_members m
JOIN business_lines bl ON m.business_line_id = bl.id
WHERE m.name ILIKE '%Sophie Moreau%';
```

---

## Outil de Diagnostic Créé

Un utilitaire de diagnostic a été créé pour tracer les données:

**Fichier**: `src/modules/module3/utils/performanceDiagnostic.ts`

**Usage dans la console du navigateur**:
```javascript
// 1. Ouvrir DevTools (F12)
// 2. Aller sur Centre de Performance
// 3. Exécuter:
window.diagPerformance('Sophie Moreau')
```

**Résultat attendu**:
```
============================================================
DIAGNOSTIC: Sophie Moreau
============================================================
Source: hcm_bulletin_performances (localStorage)

DONNÉES BRUTES:
  Objectif total: 5000
  Économies totales: 5000  ← Si = Objectif → A+

CALCULS:
  Note calculée: 10
  Grade calculé: A+
  Note affichée: 10
  Grade affiché: A+
  Cohérent: ✅ OUI

INDICATEURS:
  ABS: Obj=1000, Éco=1000, Pertes=undefined  ← Pertes manquantes!
  QD: Obj=1000, Éco=1000, Pertes=undefined
  ...

PROBLÈMES DÉTECTÉS:
  ✓ Économies (5000) >= Objectif (5000) → A+ justifié
  ⚠️ CRITIQUE: Pertes non renseignées pour tous les indicateurs
============================================================
```

---

## Actions Correctives

### PRIORITÉ 1: Vérifier les données source

1. **Exécuter le diagnostic** dans le navigateur pour Sophie Moreau
2. **Vérifier cost_entries** dans Supabase
3. **Confirmer les PPR** dans company_ppr_settings

### PRIORITÉ 2: Si les données sont absentes

Le problème est que les coûts ne sont **pas saisis** dans CostDataEntry, pas un bug de calcul.

**Solution**: S'assurer que les coûts (absentéisme, défauts, accidents) sont saisis pour chaque salarié.

### PRIORITÉ 3: Si les données existent mais sont ignorées

Vérifier la correspondance:
- `employee_id` dans cost_entries = `id` dans team_members
- `kpi_type` = 'abs', 'qd', 'oa', 'ddp', 'ekh' (minuscules)
- `period_start`/`period_end` correspondent à la période sélectionnée

---

## Fichiers Impliqués

| Fichier | Rôle | Statut |
|---------|------|--------|
| `PerformanceRecapPage.tsx` | Calcul bulletin | ✅ Utilise calculateGlobalNote/calculateGrade |
| `PerformanceCenterPage.tsx` | Affichage grades | ✅ OK |
| `usePerformanceCalculations.ts` | Formules Excel | ✅ OK |
| `performanceDiagnostic.ts` | Diagnostic | ✅ CRÉÉ |
| `CostDataEntry.tsx` | Saisie coûts | 🔍 À VÉRIFIER (données saisies?) |

---

*Audit mis à jour par Claude - 31 janvier 2026*
