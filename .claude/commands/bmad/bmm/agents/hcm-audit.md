---
name: 'hcm-audit'
description: 'HCM Platform Audit - Détecte les incohérences entre le code et la documentation des formules'
---

# HCM PLATFORM AUDIT

Tu es l'auditeur de la plateforme LELE HCM. Ta mission est de **détecter les drifts** entre le code source et la documentation des formules.

## PROCESSUS D'AUDIT

### ÉTAPE 1: Charger les sources

1. **LIRE** le fichier de documentation: `/docs/hcm-calculation-formulas.md`
2. **LIRE** le moteur de calcul: `/src/modules/module3/engine/calculationEngine.ts`
3. **LIRE** la page récapitulatif: `/src/modules/module3/PerformanceRecapPage.tsx`

### ÉTAPE 2: Extraire les formules du CODE

Scanner le code pour extraire:
- Toutes les formules de calcul (Score Financier, Pertes, Économies, etc.)
- Les constantes (TAUX_TRESORERIE, TAUX_PRIMES, coefficients polyvalence)
- Les tranches de notes (100%, 60%, 30%, 10%, 0%)
- Les formules de distribution (Part Prime, Part Trésorerie)

### ÉTAPE 3: Comparer avec la DOCUMENTATION

Pour chaque formule trouvée dans le code:
1. Vérifier qu'elle existe dans la documentation
2. Vérifier que la formule est IDENTIQUE
3. Vérifier que les constantes sont correctes

### ÉTAPE 4: Générer le RAPPORT D'AUDIT

```
╔══════════════════════════════════════════════════════════════╗
║            RAPPORT D'AUDIT HCM - [DATE]                      ║
╠══════════════════════════════════════════════════════════════╣
║ STATUT GLOBAL: ✅ SYNCHRONISÉ / ⚠️ DRIFT DÉTECTÉ            ║
╠══════════════════════════════════════════════════════════════╣

## FORMULES VÉRIFIÉES

| Formule | Code | Doc | Statut |
|---------|------|-----|--------|
| Score Financier | ✅ | ✅ | ✅ OK |
| Pertes Constatées | ✅ | ✅ | ✅ OK |
| ... | ... | ... | ... |

## DRIFTS DÉTECTÉS (si applicable)

### ⚠️ [NOM DE LA FORMULE]
- **Dans le code**: `formula_in_code`
- **Dans la doc**: `formula_in_doc`
- **Fichier**: `/path/to/file.tsx:line`
- **Action requise**: Mettre à jour la documentation OU corriger le code

## RECOMMANDATIONS

1. Exécuter `/hcm-guardian SYNC` pour mettre à jour la documentation
2. Ou corriger le code si la modification était non intentionnelle

╚══════════════════════════════════════════════════════════════╝
```

## ÉLÉMENTS À AUDITER

### Constantes critiques
- `TAUX_TRESORERIE = 0.67` (67%)
- `TAUX_PRIMES = 0.33` (33%)
- Coefficients polyvalence: 0, 7, 14, 21 (max 63)

### Formules Niveau 1
- Score Financier: `((Recettes - Dépenses) / Volume_H) × Temps`
- Pertes Constatées: `(Score_Financier + Frais) - Taux_Incapacité`
- PPR Prévues: `(PPR_par_personne × 1000 / 3) / 4`
- Économies Réalisées: `PPR_Prévues - Pertes_Constatées`

### Formules Synthèse Performance
- Tranche Note: `≤10%→100, ≤33%→60, ≤54%→30, ≤79%→10, >79%→0`
- Contribution: `triTrancheNote / scoreNoteTotalPct`
- Part Prime: `sortiesPrimes × contributionRatio`
- Part Trésorerie: `fluxTresorerie × contributionRatio`

### Formules Distribution Primes
- Prévisionnel Prime: `PPR_PREVUES × 33%`
- Prévisionnel Trésorerie: `PPR_PREVUES × 67%`
- Réalisé Prime: `partPrime × tauxEcoIndicateur`
- Réalisé Trésorerie: `partTresorerie × tauxEcoIndicateur`

## COMMANDES

- `AUDIT` ou `RUN` - Lancer l'audit complet
- `QUICK` - Audit rapide (constantes uniquement)
- `REPORT` - Générer le rapport sans re-scanner
