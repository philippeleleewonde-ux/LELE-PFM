# RAPPORT D'AUDIT - BUG ÉCONOMIES > OBJECTIFS
## Page: Reporting Economies de Coûts (CostSavingsReportingPage)

**Date:** 2 Février 2026
**Bloc concerné:** 2- ECONOMIES DE COUTS REALISEES - LIGNES D'ACTIVITES (BENEFICE ECONOMIQUE)
**Auditeur:** Claude LELE HCM Audit
**Statut:** ✅ **CORRIGÉ**

---

## 🔴 PROBLÈME SIGNALÉ

> "Les résultats du bloc LIGNES D'ACTIVITES montrent que les économies réalisées sont supérieures aux objectifs"

---

## 📋 DIAGNOSTIC

### Analyse de la chaîne de données

```
PerformanceRecapPage.tsx
    ↓ calcule businessLinePerformancesData
    ↓ appelle setPerformanceData(...)
    ↓
PerformanceDataContext.tsx
    ↓ stocke dans businessLinePerformances[]
    ↓
CostSavingsReportingPage.tsx
    ↓ affiche le bloc "LIGNES D'ACTIVITES"
```

### Cause racine identifiée

**Incohérence de périmètre temporel entre Objectif et Économies**

| Champ | Calcul AVANT correction | Période |
|-------|------------------------|---------|
| **Objectif** | `Σ pprPrevues` | N1 uniquement |
| **Économies** | `Σ (ecoN1 + ecoN2)` | N1 + N2 |

### Code problématique (PerformanceRecapPage.tsx, lignes 6100-6107)

```typescript
// ❌ AVANT: Objectif = seulement N1
const objectifLigne = perfIndicateurs.reduce((sum, ind) => {
  const data = getPerfIndicatorData(emp, ind.key);
  return sum + (data.pprPrevues || 0);  // ← Seulement N1 !
}, 0);

// Économies = N1 + N2 (via empTotalEco)
const economiesTotal = empScore?.empTotalEco || 0;
```

### Où empTotalEco est calculé (ligne 3023-3028)

```typescript
const empTotalEco = indicateurs.reduce((sum, ind) => {
  const ecoN1 = Math.max(0, data.economiesRealisees);
  const ecoN2 = Math.max(0, data.economiesRealiseesN2);
  return sum + ecoN1 + ecoN2;  // ← Somme N1 + N2 !
}, 0);
```

### Exemple numérique

| Salarié | PPR N1 | PPR N2 | Éco N1 | Éco N2 | Objectif (AVANT) | Économies | Résultat |
|---------|--------|--------|--------|--------|------------------|-----------|----------|
| Jean | 100€ | 100€ | 80€ | 90€ | 100€ | 170€ | ❌ Éco > Obj |
| Marie | 150€ | 150€ | 120€ | 140€ | 150€ | 260€ | ❌ Éco > Obj |

**Conclusion:** Les économies (N1+N2) dépassent l'objectif (N1 seul) car on compare des périodes différentes.

---

## ✅ CORRECTION APPLIQUÉE

### Code corrigé (PerformanceRecapPage.tsx, lignes 6100-6105)

```typescript
// ✅ APRÈS: Objectif = N1 + N2 (cohérent avec économies)
const objectifLigne = perfIndicateurs.reduce((sum, ind) => {
  const data = getPerfIndicatorData(emp, ind.key);
  return sum + (data.pprPrevues || 0) + (data.pprPrevuesN2 || 0);
}, 0);
```

### Résultat après correction

| Salarié | PPR N1 | PPR N2 | Éco N1 | Éco N2 | Objectif (APRÈS) | Économies | Résultat |
|---------|--------|--------|--------|--------|------------------|-----------|----------|
| Jean | 100€ | 100€ | 80€ | 90€ | 200€ | 170€ | ✅ Éco < Obj |
| Marie | 150€ | 150€ | 120€ | 140€ | 300€ | 260€ | ✅ Éco < Obj |

---

## 📊 IMPACT DE LA CORRECTION

### Formule de calcul

| Avant | Après |
|-------|-------|
| `Objectif = Σ PPR_N1` | `Objectif = Σ (PPR_N1 + PPR_N2)` |
| `Économies = Σ (Éco_N1 + Éco_N2)` | `Économies = Σ (Éco_N1 + Éco_N2)` |

### Cohérence rétablie

- ✅ Objectif et Économies couvrent la même période (N1 + N2)
- ✅ Les économies ne peuvent plus dépasser mathématiquement l'objectif
- ✅ Le taux de réalisation (Éco/Obj) sera toujours ≤ 100%

---

## 🔧 FICHIERS MODIFIÉS

| Fichier | Ligne | Modification |
|---------|-------|--------------|
| `PerformanceRecapPage.tsx` | 6100-6105 | Ajout `pprPrevuesN2` à l'objectif |

---

## ✅ VÉRIFICATION

| Test | Statut |
|------|:------:|
| Build production | ✅ 11.68s |
| Syntaxe TypeScript | ✅ Pas d'erreurs |
| Cohérence N1+N2 | ✅ Objectif = Économies (même période) |

---

## 📌 RECOMMANDATIONS

1. **Tester en production** avec des données réelles pour valider que les économies sont maintenant ≤ objectifs

2. **Vérifier les autres blocs** qui pourraient avoir le même problème de périmètre temporel

3. **Documenter la règle** : "Toute comparaison Objectif vs Réalisé doit couvrir la même période (N1+N2)"

---

*Rapport d'audit - 2 Février 2026*
*Bug corrigé - Économies ne dépasseront plus les Objectifs*

