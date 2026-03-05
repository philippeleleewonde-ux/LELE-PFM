# CORRECTIONS LOG - LELE PFM

Ce fichier sert de memoire persistante pour toutes les corrections demandees.
Claude DOIT lire ce fichier au debut de chaque session pour ne rien oublier.

---

## Format

Chaque correction suit ce format :
- **Date** : date de la demande
- **Page/Composant** : ou se situe le probleme
- **Description** : ce qui a ete demande
- **Statut** : EN ATTENTE | EN COURS | FAIT
- **Commit** : reference du commit si fait

---

## Corrections en cours

(aucune pour le moment)

---

## Corrections terminees

### COR-001 : Budget d'investissement min/max + simulation gains (Phase3Scenarios)

- **Date** : mars 2026
- **Page/Composant** : `lele-pfm/src/components/investor-journey/Phase3Scenarios.tsx`
- **Description** : L'utilisateur n'etait pas accompagne sur le montant a investir minimum et maximum en fonction de la strategie validee. Ajout d'une carte InvestmentBudgetCard affichant montant min/recommande/max par mois, capital initial recommande + minimum, et simulation des gains en 3 scenarios (pessimiste, attendu, optimiste) avec valeur finale, gains totaux et rendement annuel.
- **Statut** : FAIT
- **Fichiers modifies** : Phase3Scenarios.tsx, strategy-generator.ts (computeInvestmentGuidance)

### COR-002 : CheckInModal - Bilan en 3 etapes avec donnees marche

- **Date** : mars 2026
- **Page/Composant** : `lele-pfm/src/components/investor-journey/CheckInModal.tsx`
- **Description** : Le bouton "Faire mon bilan" doit montrer un rapport d'execution complet. Workflow en 3 etapes : (1) Portefeuille - saisie montants investis et valeurs actuelles + comparaison vs projection, (2) Donnees marche - sentiment marche, tendance inflation/taux/devise + evenements marquants, (3) Rapport d'execution - resume portefeuille, conditions de marche, recommandation de strategie avec score de risque et impact projete.
- **Statut** : FAIT
- **Fichiers modifies** : CheckInModal.tsx, Phase5Dashboard.tsx

### COR-003 : Moteur de reevaluation de strategie

- **Date** : mars 2026
- **Page/Composant** : `lele-pfm/src/domain/calculators/strategy-generator.ts`
- **Description** : Algorithme evaluateStrategyAdjustment() qui analyse le sentiment de marche, indicateurs macro, evenements utilisateur, performance recente des check-ins. Produit un score de risque 0-100 et suggere un changement de strategie si necessaire.
- **Statut** : FAIT
- **Fichiers modifies** : strategy-generator.ts

### COR-004 : Nouveaux types investor-journey

- **Date** : mars 2026
- **Page/Composant** : `lele-pfm/src/types/investor-journey.ts`
- **Description** : Ajout des types MarketIndicators, MarketEvent, StrategyRecommendationResult, InvestmentAmountGuidance.
- **Statut** : FAIT
- **Fichiers modifies** : investor-journey.ts

---

## Vision globale du cycle investisseur

Le flux complet est :
1. **Recommandation** : montants min/max + simulation gains selon strategie
2. **Decision** : l'utilisateur investit et saisit les montants reels dans l'app
3. **Suivi** : a chaque RDV (rendez-vous periodique), saisie de donnees marche (sentiment, inflation, taux, devise, evenements)
4. **Reevaluation** : l'app propose de nouvelles strategies basees sur les donnees actualisees

Ce cycle se repete a chaque rendez-vous configure par l'utilisateur.
