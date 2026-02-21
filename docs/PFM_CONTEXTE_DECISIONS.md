# LELE PFM - Contexte et Décisions Validées
## Document de référence pour la déclinaison individuelle

**Date de création :** 6 février 2026
**Projet :** HCM-PORTAL V3-individuel (déclinaison PFM)
**Méthode :** BMAD v6.0.0-alpha.22

---

# 1. VISION VALIDÉE

LELE PFM transpose la puissance analytique de LELE HCM vers les personnes physiques pour permettre à chaque individu de gérer son argent et ses investissements avec le même niveau de rigueur qu'une entreprise gère son capital humain.

## 4 Axes de Différenciation
1. **Optimisation active des coûts** avec économies mesurables chaque semaine (pas du reporting passif)
2. **5 Dimensions / 10 KPIs** de santé financière personnelle avec scoring et benchmarking
3. **Analyse de risque grade institutionnel** (VAR, stress testing) accessible aux particuliers
4. **DataScanner IA** pour extraction automatique depuis documents financiers personnels

---

# 2. MODÈLE 5 DIMENSIONS / 10 INDICATEURS (VALIDÉ)

## Structure validée : symétrie parfaite, compatible moteur HCM

| Dimension | Indicateur 1 | Code | Indicateur 2 | Code |
|-----------|-------------|------|-------------|------|
| **ÉPARGNER** | Régularité d'Épargne | REG | Fonds d'Urgence | SEC |
| **EMPRUNTER** | Maîtrise de la Dette | DET | Fiabilité de Paiement | PAI |
| **DÉPENSER** | Précision Budgétaire | PRE | Structure des Dépenses | STR |
| **PLANIFIER** | Croissance Patrimoine | PAT | Protection / Assurance | PRO |
| **COMPÉTENCE** | Littératie Financière | LIT | Engagement Financier Actif | ENG |

→ Score Global de Santé Financière /100
→ Système de notation par tranches identique à HCM (Excellent ≤10%, Très Bien ≤33%, Bien ≤54%, Correct ≤79%, À améliorer >79%)
→ Formules de calcul : à définir et certifier par Financial Auditor en phase développement

### Alignement avec les frameworks de référence
- FHN (Financial Health Network) : 4 dimensions (Spend, Save, Borrow, Plan) + 1 dimension différenciante (Compétence)
- CFPB Financial Well-Being Scale : score 0-100
- Lusardi & Mitchell "Big Three" : intégrés dans LIT
- Standards wealth management : ratios objectifs dans DET, SEC, PAT

---

# 3. MAPPING DES 12 PROFILS UTILISATEUR (VALIDÉ)

## Transposition des 12 secteurs HCM vers 12 profils PFM

### Méthode de calcul UL : Probabilité × Impact (recommandation validée)
**Formule : UL_Personnel = Revenu_Annuel × (Probabilité_Choc × Impact_Moyen)**
**Coefficient d'ajustement contextuel : 0,5 à 1,5 (basé sur Pages 4-5)**

| # | Secteur HCM | Taux UL HCM | Profil PFM | Proba choc/an | Impact revenu | Taux UL PFM |
|---|-------------|-------------|------------|---------------|---------------|-------------|
| 1 | Electronics industry | 46 000 | Entrepreneur / Startup | 20% | 100% | 20% |
| 2 | Glass factory | 38 000 | Freelance / Indépendant | 40% | 40% | 16% |
| 3 | Metal industry | 18 000 | Investisseur actif / Trader | 80% | 15% | 12% |
| 4 | Banking sector | 18 000 | Artisan / Commerçant | 15% | 70% | 10,5% |
| 5 | Maintenance | 16 000 | Salarié CDD / Intérim | 25% | 35% | 8,75% |
| 6 | Electrical appliances | 12 000 | Cadre supérieur / Dirigeant | 10% | 50% | 5% |
| 7 | Food-processing | 11 000 | Salarié CDI secteur privé | 5% | 60% | 3% |
| 8 | Telecom | 8 000 | Professionnel libéral | 3% | 50% | 1,5% |
| 9 | Public sector | 9 000 | Salarié grande entreprise | 3% | 40% | 1,2% |
| 10 | Service/distribution | 9 000 | Fonctionnaire / Secteur public | 0,5% | 30% | 0,15% |
| 11 | Insurances | 18 000 | Retraité avec pension | 1% | 10% | 0,1% |
| 12 | No choice | 9 000 | Étudiant / Sans revenu fixe | 30% | 20% | 6% |

### Sources de calibration
- Taux de faillite startup : 20,4% an 1, 49,4% sur 5 ans
- Taux licenciement France : 1,1% annuel (BLS)
- Freelance sans travail : 66% (enquêtes)
- Traders perdants : 74-89% (AMF/ESMA)
- Fonctionnaires : 0,3% perte d'emploi
- Défaillances France 2024 : 67 830 jugements
- Étudiants en insécurité : 58%

### Statut : V1 — Hypothèses de travail, à valider par Financial Auditor en Sprint 2

---

# 4. ADAPTATION MODULE 1 : HCM Performance Plan → Personal Financial Planner

## Structure conservée : 6 pages input + 10 pages reporting + 1 rapport global

### 6 Pages d'Input Adaptées

| Page | HCM (Entreprise) | PFM (Individu) |
|------|-------------------|-----------------|
| Page 1 | Company Info + Secteur (12 secteurs) | Profil Financier Personnel (12 profils) + situation familiale + pays + devise |
| Page 2 | 8 Business Lines (staff + budget) | Sources de Revenus (max 8) + Postes de Dépenses (max 8) — **Voir Section 10 pour détail complet** |
| Page 3 | Employee Engagement (heures + historique 5 ans CA/Dépenses) | Historique Financier Personnel (3-5 ans revenus/dépenses) |
| Page 4 | Risk Data (6 catégories : opérationnel, crédit, marché, liquidité, réputation, stratégique) | Risk Data Personnel (6 catégories : emploi, endettement, marché, liquidité, santé/imprévu, longévité) |
| Page 5 | Qualitative Assessment (échelle 1-5) | Auto-évaluation Financière (échelle 1-5, questions adaptées) |
| Page 6 | 6 Domaines Socioéconomiques | 6 Leviers d'Amélioration Financière |

### Mapping des 6 Catégories de Risque

| # | Risque HCM | Risque PFM | Description PFM |
|---|-----------|-----------|-----------------|
| 1 | Opérationnel | Emploi | Stabilité de l'emploi, probabilité de perte de revenu |
| 2 | Crédit | Endettement | Ratio dette/revenu, crédits en cours |
| 3 | Marché | Marché | Exposition aux fluctuations si investissements |
| 4 | Liquidité | Liquidité | Part d'actifs non convertibles rapidement |
| 5 | Réputationnel | Santé / Imprévu | Couverture santé, événements coûteux imprévus |
| 6 | Stratégique | Longévité | Adéquation épargne retraite / espérance de vie |

### Mapping des 6 Leviers d'Amélioration

| # | Domaine HCM | Levier PFM | Alimente Dimension → Indicateur |
|---|------------|-----------|-------------------------------|
| 1 | Conditions de Travail | Sécurisation | ÉPARGNER → SEC |
| 2 | Organisation du Travail | Organisation Budgétaire | DÉPENSER → PRE |
| 3 | Communication 3C | Culture Financière | COMPÉTENCE → LIT |
| 4 | Gestion du Temps | Discipline d'Épargne | ÉPARGNER → REG |
| 5 | Formation | Formation Investissement | COMPÉTENCE → ENG |
| 6 | Stratégie | Stratégie Patrimoniale | PLANIFIER → PAT |

### Moteur de Calcul : PersonalFinanceEngine (10 étapes)

| Étape | CFOCalculationEngine (HCM) | PersonalFinanceEngine (PFM) |
|-------|---------------------------|----------------------------|
| 1 | Potentiels & Écarts (CA/Dépenses) | Potentiels & Écarts (Revenus/Dépenses perso) |
| 2 | Expected Losses = moyenne écarts | Expected Losses = moyenne écarts personnels |
| 3 | Écart-type (volatilité 5 ans) | Écart-type (volatilité 3-5 ans) |
| 4 | UL = Effectifs × Taux_Secteur | UL = Revenu_Annuel × (Proba × Impact) |
| 5 | Seuil historique = StdDev + UL | Seuil historique = StdDev + UL |
| 6 | VAR = UL + EL historique | VAR Personnel = UL + EL historique |
| 7 | PRL = VAR × 95% | PRL = VAR × 95% |
| 8 | Forecast EL = VAR × 4,5% | Forecast EL = VAR × 4,5% |
| 9 | Plan 3 ans (30%/60%/100%) + 67%/33% | Plan 3 ans (30%/60%/100%) + 70%/30% |
| 10 | Distribution par 5 KPI × Business Lines | Distribution par 5 Dimensions × 10 Indicateurs |

### Distribution
- HCM : 67% Trésorerie / 33% Primes
- PFM : 70% Épargne Sécurisée / 30% Investissement Variable

### Courbe d'apprentissage trimestrielle (identique)
- T1 : 20%, T2 : 23%, T3 : 27%, T4 : 30%

### Pages de Reporting Adaptées

| Page | HCM | PFM |
|------|-----|-----|
| 7 | Calculated Results (UL, EL, VAR, etc.) | Vos Résultats Financiers (mêmes 6 métriques) |
| 8 | Employee Engagement Planning | Plan d'Épargne 3 ans |
| 9 | IPLE Accounts | Comptes de Distribution (épargne/investissement) |
| 10 | Economic Breakdown | Ventilation Économique Personnelle |
| 11 | Risk Threshold | Seuil de Risque Personnel |
| 12 | IPLE Plan 3 ans | Plan Financier Personnel 3 ans |
| 13 | Real-Time Dashboard | Dashboard Temps Réel |
| 14 | Priority Actions N+1 | Actions Prioritaires N+1 |
| 15 | Priority Actions N+2 | Actions Prioritaires N+2 |
| 16 | Priority Actions N+3 | Actions Prioritaires N+3 |
| 17 | Global Reporting (14 sections, PDF) | Rapport Global Personnel (PDF) |

---

# 5. MODULES PFM (VUE D'ENSEMBLE)

| Module HCM | Module PFM | Statut analyse |
|-----------|-----------|----------------|
| M1 : Performance Plan | M1 : Personal Financial Planner | ✅ Analysé en détail |
| M3 : Cost Savings | M3 : Personal Savings Engine | ❌ À analyser |
| M4 : Performance Cards | M4 : Financial Health Cards | ❌ À analyser |
| DataScanner | Document Scanner PFM | ❌ À analyser |
| Dashboard CEO | Personal Dashboard | ❌ À analyser |

---

# 6. ARCHITECTURE TECHNIQUE (VUE D'ENSEMBLE)

- Frontend : React 18 + TypeScript + Vite + Tailwind + shadcn/ui (réutilisation)
- Backend : Supabase (PostgreSQL + Auth + Edge Functions + RLS)
- Moteur calcul : CFOCalculationEngine → PersonalFinanceEngine
- DataScanner : Module IA Gemini adapté documents personnels
- Calendrier : FiscalCalendarEngine → PersonalBudgetCalendar
- Multi-tenant : Schema-per-company → Schema-per-user
- Devises : 48 devises conservées
- Méthode : BMAD v6.0 avec 10 agents + Financial Auditor

---

# 7. RÔLES PFM (4 rôles)

| Rôle HCM | Rôle PFM | Accès |
|---------|---------|-------|
| CEO | OWNER | Tous modules : Lecture/Écriture/Admin |
| RH Manager | PARTNER | M2 Wellness + M3 Épargne : Lecture/Écriture |
| Consultant | ADVISOR | Tous modules : Lecture + Recommandations |
| Employee | MEMBER | M4 Health Cards : Lecture seule |

---

# 8. ROADMAP SPRINTS (10 sprints / 21 semaines)

| Sprint | Durée | Focus |
|--------|-------|-------|
| S0 | 2 sem | Auth + Profil utilisateur individuel |
| S1 | 2 sem | Personal Dashboard + Budget Calendar |
| S2 | 3 sem | Module 3 PFM : Savings Engine |
| S3 | 2 sem | Module 1 PFM : Financial Planner |
| S4 | 2 sem | Module 4 PFM : Health Cards + 5 KPIs |
| S5 | 2 sem | DataScanner PFM |
| S6 | 2 sem | Risk Engine (VAR, Stress Testing) |
| S7 | 2 sem | Multi-user (Partner, Advisor, Member) |
| S8 | 2 sem | Abonnements + Notifications + PDF |
| S9 | 2 sem | Tests E2E + Documentation + Polish |

---

# 9. PROCHAINES ÉTAPES BMAD

1. ✅ Phase Analyst (Mary) : Product Brief — TERMINÉ
2. ✅ Phase PM (John) : PRD avec epics et user stories — TERMINÉ (LELE_PFM_PRD_COMPLET.md — 2825 lignes, 11 EPICs, 92 User Stories)
3. ✅ Phase Architect (Winston) : Architecture technique — TERMINÉ (LELE_PFM_ARCHITECTURE_TECHNIQUE.md — 6096 lignes, 12 sections, 8 ADR, 16 tables DDL, 10-step engine, audit 20/20)
4. ✅ Phase Scrum Master (Bob) : Sprint Planning — TERMINÉ (LELE_PFM_SPRINT_PLANNING.md — 2489 lignes, 10 sprints, 21 semaines, 404 SP, 108 US, audit 20/20)
5. ✅ Phase Developer (Amelia) : Sprint 0 — TERMINÉ (lele-pfm/ — 69 fichiers, 9569 lignes, 16 tables SQL, PersonalFinanceEngine 10 étapes, 160 tests unitaires, CI/CD GitHub Actions)

---

---

# 10. DEEP DIVE PAGE 2 : Business Lines → Revenus & Dépenses (VALIDÉ)

## Vue d'ensemble

La Page 2 HCM (1 section, 8 Business Lines) devient en PFM **2 sections distinctes** :
- **Section A** : Sources de Revenus (max 8 lignes)
- **Section B** : Postes de Dépenses (max 8 lignes)

Total maximum : **16 lignes de saisie** (vs 8 en HCM)

### Justification de la séparation en 2 sections
1. Le **taux d'épargne** (métrique fondamentale FHN/CFPB) nécessite revenus et dépenses séparés
2. La **distribution PPR** change de logique : revenus → investissements (30%) / dépenses → économies (70%)
3. Les indicateurs **PRE** et **STR** nécessitent la décomposition par postes de dépenses

---

## Section A — Sources de Revenus (max 8 lignes)

### 4 champs de saisie par ligne

| # | Champ | Type UI | Exemple | Obligatoire |
|---|-------|---------|---------|-------------|
| 1 | Nom de la source | Texte libre | "Salaire Société X" | Oui |
| 2 | Type de revenu | Dropdown (8 choix) | "Salaire CDI" | Oui |
| 3 | Montant mensuel net | Nombre (devise) | 2 850 | Oui |
| 4 | Fréquence | Dropdown (4 choix) | "Mensuel" | Oui |

### Dropdown "Type de revenu" (8 choix)

| # | Type | Nature contractuelle (déduite auto) | Coefficient risque (déduit auto) |
|---|------|-------------------------------------|----------------------------------|
| 1 | Salaire CDI / Fonctionnaire | Garanti | 0.95 |
| 2 | Salaire CDD / Intérim / Mission | Récurrent | 0.70 |
| 3 | Freelance / Indépendant | Aléatoire | 0.50 |
| 4 | Revenus locatifs / Fonciers | Récurrent | 0.75 |
| 5 | Dividendes / Intérêts / Plus-values | Aléatoire | 0.40 |
| 6 | Pension / Retraite / Rente | Garanti | 0.90 |
| 7 | Allocations / Aides sociales | Garanti | 0.85 |
| 8 | Autre revenu | Aléatoire | 0.50 |

> **Principe clé** : La nature contractuelle et le coefficient de risque sont **déduits automatiquement** du type sélectionné. L'utilisateur ne saisit jamais de score subjectif. C'est objectif et vérifiable.

### Dropdown "Fréquence" (4 choix)

| Fréquence | Conversion annuelle |
|-----------|-------------------|
| Mensuel | × 12 |
| Trimestriel | × 4 |
| Annuel | × 1 |
| Irrégulier | Montant = estimation mensuelle moyenne |

### Champs calculés automatiquement par ligne (non saisis)
- `montantAnnuel` = montant × facteur de fréquence
- `incomeRate` = montantAnnuel / totalRevenusAnnuels × 100

---

## Section B — Postes de Dépenses (max 8 lignes)

### 5 champs de saisie par ligne

| # | Champ | Type UI | Exemple | Obligatoire |
|---|-------|---------|---------|-------------|
| 1 | Nom du poste | Texte libre | "Loyer appartement" | Oui |
| 2 | Catégorie | Dropdown (8 choix) | "Logement" | Oui |
| 3 | Montant mensuel | Nombre (devise) | 950 | Oui |
| 4 | Nature | Dropdown (3 choix) | "Fixe" | Oui |
| 5 | Compressibilité | Dropdown (3 choix) | "Incompressible" | Oui |

### Dropdown "Catégorie" (8 choix)

| # | Catégorie | Alimente dimension → indicateur |
|---|-----------|-------------------------------|
| 1 | Logement | DÉPENSER → STR |
| 2 | Alimentation / Courses | DÉPENSER → STR |
| 3 | Transport / Mobilité | DÉPENSER → STR |
| 4 | Santé / Assurances | PLANIFIER → PRO |
| 5 | Éducation / Formation | COMPÉTENCE → LIT |
| 6 | Loisirs / Abonnements | DÉPENSER → PRE |
| 7 | Remboursement crédits | EMPRUNTER → DET |
| 8 | Autre dépense | — |

### Dropdown "Nature" (3 choix) — Standard bancaire international

| Nature | Définition | Coeff. optimisation (déduit auto) |
|--------|-----------|----------------------------------|
| Fixe | Montant identique chaque mois (loyer, assurance, crédit) | 0.10 |
| Semi-variable | Base fixe + partie variable (énergie, téléphone) | 0.45 |
| Variable | Montant différent chaque mois (courses, loisirs) | 0.85 |

### Dropdown "Compressibilité" (3 choix)

| Compressibilité | Définition | Multiplicateur (déduit auto) |
|-----------------|-----------|------------------------------|
| Incompressible | Impossible à réduire à court terme | × 0.2 |
| Ajustable | Réductible avec effort | × 0.6 |
| Supprimable | Peut être éliminé | × 1.0 |

### Champs calculés automatiquement par ligne (non saisis)
- `montantAnnuel` = montant × 12
- `expenseRate` = montantAnnuel / totalDépensesAnnuelles × 100
- `potentielOptimisation` = expenseRate × coeff_nature × multiplicateur_compressibilité

---

## Bloc Résumé (calculé automatiquement, bas de page)

### Métriques Revenus

| Métrique | Formule | Standard international |
|----------|---------|----------------------|
| Revenu mensuel total | Σ montantsMensuels_revenus | — |
| Revenu annuel total | Σ montantsAnnuels_revenus | — |
| Nombre de sources | count(lignes_revenus) | — |
| **HHI Concentration** | Σ (incomeRate_i / 100)² | Herfindahl-Hirschman (Markowitz) |
| Score diversification | HHI < 0.25 → "Diversifié" / < 0.50 → "Concentré" / ≥ 0.50 → "Très concentré" | Théorie moderne du portefeuille |
| Stabilité moyenne pondérée | Σ (coeff_risque_i × incomeRate_i) / 100 | Scoring bancaire |

### Métriques Dépenses

| Métrique | Formule | Standard international |
|----------|---------|----------------------|
| Dépenses mensuelles totales | Σ montantsMensuels_dépenses | — |
| Dépenses annuelles totales | Σ montantsAnnuels_dépenses | — |
| **Taux de charges fixes** | Σ dépenses(nature=Fixe) / revenu_mensuel × 100 | Banque de France, Bâle III |
| **Reste-à-vivre** | revenu_mensuel - Σ dépenses(nature=Fixe) | Banque de France |
| Potentiel optimisation total | Σ potentielOptimisation_i | — |

### Métriques Synthèse

| Métrique | Formule | Standard international |
|----------|---------|----------------------|
| **Taux d'épargne** | (revenu_total - dépenses_totales) / revenu_total × 100 | FHN, CFPB |
| **Capacité d'épargne mensuelle** | revenu_mensuel - dépenses_mensuelles | — |
| Statut | > 20% → "Excellent" / > 10% → "Bon" / > 0% → "Fragile" / ≤ 0% → "Déficitaire" | Règle 50/30/20 |

---

## Flux de données Page 2 → PersonalFinanceEngine

### Section A (Revenus) alimente :
- `totalRevenus` → Étape 1 (Potentiels & Écarts)
- `HHI` → Étape 4 (ajuste coefficient contextuel 0.5-1.5)
- `stabilité pondérée` → Étape 4 (ajuste Proba dans UL)
- `incomeRate par source` → Étape 10 (distribue les 30% investissement variable)

### Section B (Dépenses) alimente :
- `totalDépenses` → Étape 1 (Potentiels & Écarts)
- `taux charges fixes` → Indicateur PRE (Précision Budgétaire)
- `potentielOptimisation` → Étape 10 (distribue les 70% économie sécurisée)
- `catégorie` → Indicateurs STR, PRO, LIT, DET (mapping direct aux dimensions)

### Distribution PPR révisée :
- **HCM** : PPR = gainsN × indicatorRate × budgetRate / staffCount
- **PFM** : PPR_économie = gainsN × dimensionRate × expenseRate × coeff_optimisation
- **PFM** : PPR_investissement = gainsN × dimensionRate × incomeRate (sources stables prioritaires)

---

## Comparatif synthétique HCM vs PFM Page 2

| Aspect | HCM Page 2 | PFM Page 2 |
|--------|-----------|-----------|
| Sections | 1 (Business Lines) | 2 (Revenus + Dépenses) |
| Lignes max | 8 | 8 + 8 = 16 |
| Champs saisie/ligne | 4 | 4 (revenus) + 5 (dépenses) |
| Dropdowns/ligne | 0 | 2 (revenus) + 3 (dépenses) |
| Champs calculés auto/ligne | 2 | 2 (revenus) + 3 (dépenses) |
| Métriques résumé | 4 | 11 |
| Standards internationaux | Aucun | HHI, Charges fixes, Reste-à-vivre, Taux épargne FHN |

### Auto-audit cohérence (4 corrections apportées)
1. ~~Score stabilité 1-5 subjectif~~ → Nature contractuelle déduite du type (objectif)
2. ~~Classification Essentiel/Confort/Luxe~~ → Nature Fixe/Semi-variable/Variable + Compressibilité (standard bancaire)
3. ~~expenseRate seul pour PPR~~ → expenseRate × coeff_optimisation (réaliste)
4. ~~Pas de mesure concentration~~ → HHI Herfindahl-Hirschman (Markowitz)

---

# 11. DEEP DIVE PAGE 3 : Employee Engagement → Historique Financier Personnel (VALIDÉ)

## Vue d'ensemble

La Page 3 est la page qui change le **moins** entre HCM et PFM.
Elle conserve la même architecture à 2 zones, et alimente les mêmes étapes du moteur (1, 2, 3).

---

## HCM Page 3 — Structure existante

### Interface TypeScript
```
EmployeeEngagementData {
  annualHoursPerPerson: number;       // 1 champ (1600-2200h typique)
  financialHistory: FinancialData[];  // 2-5 lignes
}
FinancialData {
  year: string;      // "N-1", "N-2"... "N-5"
  sales: number;     // CA en milliers (k€)
  spending: number;  // Dépenses en milliers (k€)
}
```

### Rôle dans CFOCalculationEngine
- Zone 1 (annualHoursPerPerson) → totalHours, engagementScore (métrique accessoire, NON utilisée dans les 10 étapes principales)
- Zone 2 (financialHistory) → **Étape 1** (Potentiels & Écarts), **Étape 2** (Expected Losses), **Étape 3** (Écart-type/Volatilité)
- Condition actuelle : nécessite exactement 5 ans (`if (sales.length < 5) return`)

---

## PFM Page 3 — Structure proposée

### Zone 1 — Engagement Financier Personnel (remplace Employee Engagement)

**2 champs de saisie :**

| # | Champ | Type UI | Exemple | Obligatoire |
|---|-------|---------|---------|-------------|
| 1 | Heures mensuelles de gestion financière | Nombre (heures) | 4 | Oui |
| 2 | Outils utilisés | Multi-select (6 choix) | "App bancaire, Tableur" | Non |

**Dropdown "Outils utilisés" (6 choix, multi-select) :**

| # | Outil | Poids ENG (déduit auto) |
|---|-------|------------------------|
| 1 | Application bancaire mobile | +0.5 |
| 2 | Tableur personnel (Excel/Sheets) | +1.0 |
| 3 | Application budgétaire (YNAB, Bankin, etc.) | +1.5 |
| 4 | Plateforme d'investissement (courtier en ligne) | +2.0 |
| 5 | Conseil financier professionnel | +2.5 |
| 6 | Aucun outil | +0.0 |

**Champs calculés automatiquement :**
- `heuresAnnuelles` = heuresMensuelles × 12
- `scoreEngagement_brut` = heuresAnnuelles × (1 + Σ poids_outils / 10)
- Alimente directement l'indicateur **ENG** (Engagement Financier Actif) de la dimension COMPÉTENCE

> **Amélioration vs HCM** : En HCM, `annualHoursPerPerson` n'alimentait pas le moteur principal. En PFM, la Zone 1 est connectée à l'indicateur ENG — transforme un champ passif en donnée active.

---

### Zone 2 — Historique Financier (tableau dynamique, 3 à 5 lignes)

**3 champs par ligne :**

| # | Champ | Type UI | HCM équivalent | Exemple PFM |
|---|-------|---------|----------------|-------------|
| 1 | Année | Texte auto-généré | "N-1", "N-2"... | "2025", "2024"... |
| 2 | Revenus annuels totaux | Nombre (devise) | Sales/Turnover (k€) | 42 000 € |
| 3 | Dépenses annuelles totales | Nombre (devise) | Total Spending (k€) | 36 500 € |

### Différences clés HCM → PFM

| Aspect | HCM | PFM | Argument |
|--------|-----|-----|----------|
| Unité monétaire | Milliers (k€) | Unité (€) | Les individus ne raisonnent pas en milliers |
| Labels années | "N-1", "N-2"... | Année réelle "2025", "2024"... | Plus intuitif pour un particulier |
| Minimum lignes | 2 ans | **3 ans** | 2 ans insuffisant pour écart-type fiable ; 3 = minimum statistique |
| Maximum lignes | 5 ans | 5 ans | Identique |
| Pré-remplissage | Non | **Oui** (année en cours depuis Page 2) | Revenus N-0 = totalRevenus_mensuel × 12, Dépenses N-0 = totalDépenses_mensuel × 12 |

---

### Indicateurs calculés en temps réel (affichés sur la page)

**Par ligne :**

| Indicateur | HCM | PFM |
|-----------|-----|-----|
| Résultat annuel | Profit/Loss en k€ (vert/rouge) | Épargne/Déficit en € (vert/rouge) |
| Marge | Marge bénéficiaire % | Taux d'épargne annuel % |

**Bloc Summary (enrichi vs HCM) :**

| Métrique | Présent en HCM ? | Standard |
|----------|------------------|----------|
| Revenu annuel moyen | Oui (Average Annual Sales) | — |
| Dépenses annuelles moyennes | Oui (Average Annual Spending) | — |
| **Tendance revenus** (↗ +X%/an ou ↘ -X%/an) | Non (AJOUT) | Analyse de tendance |
| **Tendance dépenses** (↗ +X%/an ou ↘ -X%/an) | Non (AJOUT) | Analyse de tendance |
| **Volatilité revenus** (Faible/Moyenne/Élevée) | Non (AJOUT) | Coefficient de variation (CV) |
| **Volatilité dépenses** (Faible/Moyenne/Élevée) | Non (AJOUT) | Coefficient de variation (CV) |
| **Taux d'épargne moyen sur la période** | Non (AJOUT) | FHN/CFPB |

> Les 5 métriques ajoutées sont du feedback UX uniquement — elles n'affectent pas le moteur de calcul mais aident l'utilisateur à contextualiser ses données.

---

## Flux de données Page 3 → PersonalFinanceEngine

### Zone 1 (Engagement) alimente :
- `scoreEngagement_brut` → Indicateur **ENG** (Engagement Financier Actif, dimension COMPÉTENCE)

### Zone 2 (Historique) alimente :
- `revenus[]` → **Étape 1** : taux moyen d'évolution, écarts potentiel vs réel par année
- `dépenses[]` → **Étape 1** : taux moyen d'évolution, écarts potentiel vs réel par année
- Écarts → **Étape 2** : `totalELHistorique` = moyenne écarts revenus + moyenne écarts dépenses
- Écarts → **Étape 3** : `stdDevRevenus` + `stdDevDépenses` (volatilité → alimente Étape 5 seuil historique)

### Adaptation moteur (unique changement de code)
```
// HCM : nécessite exactement 5 ans
if (sales.length < 5 || spending.length < 5) return;

// PFM : adapté pour 3-5 ans (minimum 3)
if (revenus.length < 3 || depenses.length < 3) return;
```
L'algorithme getAverageRate() et getStdDev() fonctionne avec n ≥ 2 éléments, donc 3-5 ne casse rien.

---

## Comparatif synthétique Page 3

| Aspect | HCM Page 3 | PFM Page 3 |
|--------|-----------|-----------|
| Zone 1 | Annual Hours per Person (1 champ) | Engagement financier (2 champs : heures + outils) |
| Zone 2 | Financial History (2-5 lignes × 2 champs) | Historique Financier (3-5 lignes × 2 champs) |
| Total champs saisie | 1 + (5×2) = **11 max** | 2 + (5×2) = **12 max** |
| Unité monétaire | Milliers (k€) | Unité (€) |
| Labels années | N-1, N-2... | 2025, 2024... |
| Minimum lignes | 2 ans | 3 ans |
| Pré-remplissage | Non | Oui (depuis Page 2) |
| Métriques Summary | 2 | 7 |
| Alimente moteur | Étapes 1, 2, 3 | Étapes 1, 2, 3 (identique) + indicateur ENG |
| Changement code moteur | — | 1 seule ligne (condition minimum 3 au lieu de 5) |

**Verdict :** Structure quasi identique. Adaptations = vocabulaire, unités, feedback UX enrichi, et connexion Zone 1 → indicateur ENG.

---

# 12. DEEP DIVE PAGE 4 : Risk Data → Risk Data Personnel (VALIDÉ)

## Vue d'ensemble

La Page 4 PFM conserve l'architecture HCM (2 zones, 6 catégories) mais **élève le rôle de la Zone 2** de simple reporting à composant actif du moteur. Les 6 catégories sont renommées en catégories PFM natives (pas de mapping forcé depuis Bâle II).

---

## HCM Page 4 — Structure existante

### Interface TypeScript
```
RiskData {
  totalUL: number;              // Total UL en k€
  yearsOfCollection: number;    // Années de collecte (1-20)
  riskCategories: {
    operationalRisk: number;    // Basel II QIS 2
    creditRisk: number;         // Client + Country risk
    marketRisk: number;         // Payment/settlement errors
    liquidityRisk: number;      // Transformation + illiquidity
    reputationalRisk: number;   // Organizational risk
    strategicRisk: number;      // Health + Insurance risk
  }
}
```

### Rôle dans CFOCalculationEngine — Étape 4
- Zone 1 : `ulExterne = totalUL / yearsOfCollection` (UL observée annualisée)
- Zone 1 : `ulInterne = totalStaff × pertesULSecteur` (UL modélisée)
- Zone 1 : `ulCalcul = (ulInterne + ulExterne) / 2 / 1000` (crédibilité actuarielle)
- Zone 2 : **NON utilisée dans le moteur** — reporting uniquement (distribution Bâle II, graphiques)

---

## PFM Page 4 — Structure proposée

### Zone 1 — Chocs Financiers Historiques (remplace UL Data)

**3 champs de saisie (vs 2 en HCM) :**

| # | Champ | Type UI | HCM équivalent | Exemple |
|---|-------|---------|----------------|---------|
| 1 | Montant total des chocs financiers subis | Nombre (devise) | Total UL (k€) | 6 000 € |
| 2 | Période couverte | Nombre (années, 1-20) | Years of Collection | 10 ans |
| 3 | Nombre de chocs | Nombre (1-20) | — (NOUVEAU) | 2 |

**Ajout du "Nombre de chocs" :** En HCM, totalUL/years donne une moyenne annuelle (pertes continues). Pour un individu, les chocs sont rares et violents. La fréquence modifie le profil de risque. Les assureurs utilisent systématiquement fréquence ET sévérité. Standard actuariel international.

**Aide contextuelle :** *"Additionnez : périodes de chômage (revenus perdus), dépenses médicales imprévues non couvertes, pertes d'investissement réalisées, réparations majeures imprévues, frais juridiques, etc."*

**Champs calculés automatiquement :**
- `chocAnnuelMoyen` = totalChocs / période (≡ ulExterne HCM)
- `sévéritéMoyenne` = totalChocs / nombreChocs
- `fréquenceAnnuelle` = nombreChocs / période
- Badge profil : "Faible fréquence, sévérité modérée" / etc.

---

### Zone 2 — 6 Catégories de Risque Personnel (RÉVISÉES)

**4 mappings solides + 2 révisés (catégories PFM natives, pas de mapping forcé Bâle II) :**

| # | HCM (Bâle II) | PFM (révisé) | Couvre | Standard |
|---|---------------|-------------|--------|----------|
| 1 | Opérationnel | **Revenu & Emploi** | Perte d'emploi, baisse revenu, invalidité pro | CFP, FHN, BdF |
| 2 | Crédit | **Endettement & Crédit** | Ratio dette/revenu, défaut, surendettement | Bâle III, FICO |
| 3 | Marché | **Marché & Inflation** | Fluctuations investissements + érosion pouvoir d'achat | VaR, IPC/CPI |
| 4 | Liquidité | **Liquidité & Urgence** | Cash disponible, fonds d'urgence, actifs bloqués | LCR Bâle III |
| 5 | ~~Réputationnel~~ | **Santé & Protection** | Coûts médicaux non couverts, invalidité, dépendance | OMS, CFP |
| 6 | ~~Stratégique~~ | **Longévité & Patrimoine** | Épargne retraite vs espérance de vie + biens non assurés | ISO 22222, CFP |

> Les catégories #5 et #6 ont été révisées car les mappings initiaux (Réputationnel→Santé, Stratégique→Longévité) étaient forcés. Les nouvelles catégories sont des catégories PFM natives couvrant 8 risques internationaux sur 10.
> Le risque **Comportemental** (absent) est couvert indirectement par les indicateurs LIT et ENG (dimension COMPÉTENCE).
> Le risque **Fiscal** (absent) sera intégré en V2.

### Saisie guidée par catégorie (innovation vs HCM)

En HCM, chaque catégorie = un montant brut en k€. En PFM, **saisie guidée** : l'utilisateur répond à une question simple, le système calcule le montant d'exposition.

| # | Catégorie PFM | Question posée | Type saisie | Formule → montant |
|---|--------------|---------------|-------------|-------------------|
| 1 | Revenu & Emploi | "Combien de mois sans revenu en cas de perte d'emploi ?" | Slider 0-24 mois | mois × revenuMensuel_principal (Page 2) |
| 2 | Endettement & Crédit | "Encours total de crédits en cours ?" | Montant direct (€) | Saisie directe |
| 3 | Marché & Inflation | "Montant placé en actifs volatils ?" | Montant direct (€) | Saisie + ajustement inflation auto (pays Page 1) |
| 4 | Liquidité & Urgence | "Montant disponible immédiatement en urgence ?" | Montant direct (€) | Gap = fonds recommandé (3× dépenses mensuelles) - montant saisi |
| 5 | Santé & Protection | "Reste à charge estimé en cas de problème santé majeur ?" | Montant direct (€) | Saisie directe |
| 6 | Longévité & Patrimoine | "Écart entre objectif retraite et épargne actuelle ? (0 = auto-estimation)" | Montant direct (€) ou 0 | Si 0 : estimation auto basée sur âge, revenu, pension estimée |

### Logique d'inversion Liquidité (#4)
Le champ #4 inverse la logique : l'utilisateur déclare sa **protection** (combien il a), le système calcule le **risque** (combien il manque).
```
fondsRecommandé = 3 × dépensesMensuelles (Page 2)
expositionLiquidité = max(0, fondsRecommandé - montantSaisi)
couvertureMois = montantSaisi / dépensesMensuelles
```

### Logique d'auto-estimation Longévité (#6)
Si l'utilisateur saisit 0, le système estime automatiquement :
```
annéesRetraite = âgeRetraite (62-67) - âge (Page 1)
objectifRemplacement = 70% × revenuMensuel
gapMensuel = objectifRemplacement - pensionEstimée
capitalNécessaire = gapMensuel × 12 × 25 × (1 + inflation)^annéesRetraite
expositionLongévité = capitalNécessaire - épargneRetraiteActuelle
```
Badge informatif : *"Estimation indicative. Consultez un conseiller pour une projection personnalisée."*

### Champs calculés automatiquement (identique HCM + enrichi)
- `riskRate` par catégorie = montant / totalRiskExposure × 100
- Barres de progression visuelles (même UI que HCM)
- Total Risk Exposure en devise
- Ratio dette/revenu annuel (catégorie #2)
- Couverture urgence en mois (catégorie #4)

---

## 3 Rôles actifs Zone 2 dans le PersonalFinanceEngine (NOUVEAU vs HCM)

### Rôle 1 — Coefficient Contextuel (0.5-1.5)
```
riskConcentration = max(riskRate_i) / 100
coeff_risque = 0.5 + (riskConcentration × 2)    // borné 0.5-1.5
coeff_HHI = HHI_revenus (Page 2)                // concentration revenus
coeffContextuel_final = (coeff_risque + coeff_HHI) / 2
```

### Rôle 2 — Alimentation directe des indicateurs
| Catégorie | Alimente indicateur |
|-----------|-------------------|
| Revenu & Emploi | REG (régularité épargne impactée si emploi instable) |
| Endettement & Crédit | DET (Maîtrise de la Dette) |
| Marché & Inflation | PAT (Croissance Patrimoine — exposition) |
| Liquidité & Urgence | SEC (Fonds d'Urgence) |
| Santé & Protection | PRO (Protection / Assurance) |
| Longévité & Patrimoine | PAT (Croissance Patrimoine — projection) |

### Rôle 3 — Formule UL révisée (crédibilité actuarielle, identique HCM)
```
// PFM Step 4 :
ulInterne  = revenuAnnuel × (probaChoc × impactRevenu)    // profil Page 1
ulExterne  = totalChocs / période                           // Zone 1 Page 4
ulCalcul   = (ulInterne + ulExterne) / 2                    // crédibilité
ulAjusté   = ulCalcul × coeffContextuel                     // NOUVEAU: ajustement Zone 2
```

---

## Exemple concret : Marie, 34 ans, CDI 3 200 €/mois

### Zone 1 — Chocs historiques
| Champ | Valeur | Temps |
|-------|--------|-------|
| Montant total chocs | 6 000 € (chômage 2019 + panne voiture 2022) | 30 sec |
| Période | 10 ans | 5 sec |
| Nombre de chocs | 2 | 5 sec |
→ Choc annuel moyen : 600 €/an, Sévérité : 3 000 €, Fréquence : 0.2/an

### Zone 2 — 6 catégories
| # | Catégorie | Saisie Marie | Exposition calculée |
|---|-----------|-------------|-------------------|
| 1 | Revenu & Emploi | Slider: 5 mois | 16 000 € (5 × 3 200) |
| 2 | Endettement & Crédit | 145 500 € (immo + auto) | 145 500 € |
| 3 | Marché & Inflation | 1 200 € (PEA ETF) | 1 968 € (+inflation auto) |
| 4 | Liquidité & Urgence | 7 000 € (courant + Livret A) | 1 250 € (gap = 8 250 - 7 000) |
| 5 | Santé & Protection | 4 000 € | 4 000 € |
| 6 | Longévité & Patrimoine | 0 (auto-estimation) | 160 800 € (estimation) |
→ Total Risk Exposure : 329 518 € | Temps saisie total : ~2 min

---

## Comparatif synthétique Page 4

| Aspect | HCM Page 4 | PFM Page 4 |
|--------|-----------|-----------|
| Zone 1 | 2 champs (totalUL k€, years) | 3 champs (totalChocs €, période, nombreChocs) |
| Zone 2 | 6 champs numériques bruts (k€) | 6 champs guidés (questions + formules) |
| Total champs saisie | **8** | **9** |
| Unité monétaire | Milliers (k€) | Unité (€) |
| Labels | Jargon Bâle II | Questions en langage courant |
| Rôle Zone 2 moteur | **Aucun** (reporting) | **3 rôles** (coeff contextuel, indicateurs, UL ajusté) |
| Standards | Bâle II, QIS 2 | Crédibilité actuarielle, CFP, FHN, ISO 22222 |
| Innovation | — | Saisie guidée, auto-estimation longévité, inversion liquidité |

---

# 13. DEEP DIVE PAGE 5 : Qualitative Assessment → Auto-évaluation Financière (VALIDÉ)

## Vue d'ensemble

La Page 5 PFM conserve la même structure exacte (6 dropdowns, échelle 1-5) mais **change la nature des questions** : de "importance du risque" (doublon Page 4) à "niveau de maîtrise" (complémentaire à Page 4). En HCM, la Page 5 n'alimentait pas le moteur. En PFM, elle acquiert 3 rôles actifs.

---

## HCM Page 5 — Structure existante

### Interface TypeScript
```
QualitativeAssessment {
  operationalRiskIncidents: string | number;  // 1-5
  creditRiskAssessment: string | number;      // 1-5
  marketVolatility: string | number;          // 1-5
  liquidityPosition: string | number;         // 1-5
  reputationalFactors: string;                // 1-5
  strategicAlignment: string;                 // 1-5
}
```

### Échelle HCM (5 niveaux)
1 = "Not important at all", 2 = "Not very important", 3 = "Somewhat important", 4 = "Important", 5 = "Very important"

### Rôle dans CFOCalculationEngine
**NON utilisée dans les 10 étapes du moteur principal.** Stockée pour reporting uniquement.

---

## PFM Page 5 — Structure proposée

### Échelle PFM (5 niveaux — inversée vs HCM)
1 = "Pas du tout maîtrisé", 2 = "Peu maîtrisé", 3 = "Moyennement maîtrisé", 4 = "Bien maîtrisé", 5 = "Parfaitement maîtrisé"

> **Inversion clé :** En HCM, score élevé = risque important (négatif). En PFM, score élevé = maîtrise élevée (positif). Le moteur inverse pour le calcul de risque.

### Les 6 Questions PFM (face à face avec HCM)

**Question 1 — Revenu & Emploi**
- HCM : *"Losses related to Operational Risk (Basel II Committee, Loss event type classification, QIS 2 - Operational Risk Loss Data, 4 May 2001)"*
- PFM : *"À quel point maîtrisez-vous la stabilité de vos revenus ? (diversification des sources, compétences recherchées sur le marché, épargne de précaution en cas de perte d'emploi)"*

**Question 2 — Endettement & Crédit**
- HCM : *"Losses related to Credit counterparty risk or signature risk (Client risk and Country risk)"*
- PFM : *"À quel point maîtrisez-vous votre niveau d'endettement ? (connaissance de vos taux d'intérêt, plan de remboursement établi, ratio dette/revenu sous contrôle)"*

**Question 3 — Marché & Inflation**
- HCM : *"Losses related to Market risk (errors that can be made by processing payments or settling transactions)"*
- PFM : *"À quel point maîtrisez-vous vos placements et l'impact de l'inflation sur votre épargne ? (diversification du portefeuille, compréhension des produits financiers, horizon de placement défini)"*

**Question 4 — Liquidité & Urgence**
- HCM : *"Losses related to Transformation risk (large gap between different maturities of receivables and debts) and illiquidity"*
- PFM : *"À quel point maîtrisez-vous votre capacité à faire face à une urgence financière ? (fonds d'urgence constitué, accès rapide au cash, plan B en cas d'imprévu)"*

**Question 5 — Santé & Protection**
- HCM : *"Losses related to Organizational risk (Workforce, Equipment and Environment)"*
- PFM : *"À quel point maîtrisez-vous votre couverture santé et vos assurances ? (mutuelle adaptée, prévoyance souscrite, garanties connues, reste à charge anticipé)"*

**Question 6 — Longévité & Patrimoine**
- HCM : *"Losses related to Specific Health and Insurance Risk"*
- PFM : *"À quel point maîtrisez-vous votre préparation retraite et la protection de votre patrimoine ? (objectif retraite chiffré, épargne long terme en place, biens correctement assurés)"*

> Structure de chaque question PFM : **"À quel point maîtrisez-vous..."** + domaine + **(3 critères concrets entre parenthèses)** pour guider l'auto-évaluation.

---

## 3 Rôles actifs dans le PersonalFinanceEngine (NOUVEAU vs HCM)

### Rôle 1 — Ajustement du coefficient contextuel
```
scoreMaîtriseMoyen = moyenne(6 scores) / 5    // entre 0.2 et 1.0
coeffContextuel_final = coeffContextuel_Page4 × (1.5 - scoreMaîtriseMoyen)
// Maîtrise parfaite (1.0) → × 0.5 (risque réduit de moitié)
// Aucune maîtrise (0.2) → × 1.3 (risque augmenté de 30%)
// Borné entre 0.5 et 1.5
```

### Rôle 2 — Alimentation indicateur LIT (Littératie Financière)
```
scoreLIT_qualitatif = moyenne(6 scores) / 5
// Pondération : 40% qualitatif (Page 5) + 60% quantitatif (Pages 3+6)
```

### Rôle 3 — Détection d'incohérences Page 4 × Page 5
| Situation | Exemple | Feedback |
|-----------|---------|----------|
| Maîtrise haute + exposition haute | Endettement = 5 mais dette = 145 000 € | ⚠️ Vérification cohérence |
| Maîtrise basse + exposition basse | Marché = 1 mais actifs volatils = 0 € | ✅ Cohérent |
| Maîtrise basse + exposition haute | Liquidité = 2 mais gap urgence = 5 000 € | 🔴 Priorité identifiée |

---

## Exemple concret : Marie (suite)

| # | Question (résumée) | Réponse | Score | Cohérence Page 4 |
|---|-------------------|---------|-------|-------------------|
| 1 | Stabilité revenus | "Bien maîtrisé" | 4 | ✅ CDI stable |
| 2 | Endettement | "Moyennement maîtrisé" | 3 | ✅ Crédit immo 145k€ |
| 3 | Investissements | "Peu maîtrisé" | 2 | ✅ Débutante PEA |
| 4 | Urgence | "Moyennement maîtrisé" | 3 | ⚠️ Gap 1 250 € |
| 5 | Assurance/santé | "Bien maîtrisé" | 4 | ✅ Reste à charge 4k€ |
| 6 | Retraite/patrimoine | "Pas du tout maîtrisé" | 1 | 🔴 Gap 160 800 € |

Temps saisie : ~45 sec | scoreMaîtrise = 2.83/5 = 56.7%

---

## Comparatif synthétique Page 5

| Aspect | HCM Page 5 | PFM Page 5 |
|--------|-----------|-----------|
| Nombre de questions | 6 | 6 (identique) |
| Type UI | 6 dropdowns (1-5) | 6 dropdowns (1-5) |
| Échelle | Importance risque (négatif) | Niveau maîtrise (positif, inversé calcul) |
| Labels | Jargon Bâle II | Langage courant + 3 critères guides |
| Total champs saisie | **6** | **6** |
| Temps saisie | ~30 sec | ~45 sec |
| Rôle dans moteur | **Aucun** | **3 rôles** (coeff, LIT, incohérences) |
| Croisement Pages | Non | Oui (Page 4 × Page 5) |

---

# 14. DEEP DIVE — PAGE 6 : Leviers d'Amélioration Financière (remplace Socioeconomic Improvement) — VALIDÉ

## Structure HCM (SocioeconomicSection.tsx)

6 domaines clés ISEOR avec dropdown 1-5 ("Not important at all" → "Very important") :
1. keyArea1_workingConditions — environnement physique, charge, sécurité, équipement
2. keyArea2_workOrganization — organigramme, conception des postes
3. keyArea3_communication — 3C échanges, coordination, dialogue
4. keyArea4_timeManagement — adéquation formation-emploi
5. keyArea5_training — planification individuelle et d'équipe
6. keyArea6_strategy — formulation stratégie, traduction en actions concrètes

**Rôle moteur HCM :** Page la plus critique — alimente Step 9 (poids → 5 KPIs) + Step 10 (distribution PPR)

## Transposition PFM validée : 6 Leviers d'Amélioration Financière

| # | Domaine HCM | Levier PFM | Dimension/Code | Justification |
|---|------------|-----------|---------------|---------------|
| 1 | Conditions de Travail | **Sécurisation Financière** | ÉPARGNER / SEC | Conditions de base = filet de sécurité |
| 2 | Organisation du Travail | **Organisation Budgétaire** | DÉPENSER / PRE | Organisation = structurer ses flux |
| 3 | 3C Communication | **Culture Financière** | COMPÉTENCE / LIT | Communication = comprendre les produits financiers |
| 4 | Gestion du Temps | **Discipline d'Épargne** | ÉPARGNER / REG | Temps bien géré = épargne régulière |
| 5 | Formation | **Formation Investissement** | COMPÉTENCE / ENG | Formation pro → formation financière |
| 6 | Stratégie | **Stratégie Patrimoniale** | PLANIFIER / PAT | Stratégie d'entreprise → vision patrimoniale |

## 6 Questions PFM reformulées

1. "Dans quelle mesure souhaitez-vous améliorer votre **sécurité financière** ?" *(fonds d'urgence, couverture assurance, stabilité des revenus)*
2. "Dans quelle mesure souhaitez-vous améliorer votre **organisation budgétaire** ?" *(suivi des dépenses, respect du budget, catégorisation des charges)*
3. "Dans quelle mesure souhaitez-vous améliorer votre **culture financière** ?" *(compréhension des produits, lecture des contrats, veille économique)*
4. "Dans quelle mesure souhaitez-vous améliorer votre **discipline d'épargne** ?" *(régularité des versements, automatisation, résistance aux achats impulsifs)*
5. "Dans quelle mesure souhaitez-vous améliorer vos **compétences en investissement** ?" *(diversification, horizons de placement, rapport risque/rendement)*
6. "Dans quelle mesure souhaitez-vous améliorer votre **stratégie patrimoniale** ?" *(planification retraite, transmission, optimisation fiscale)*

## Échelle PFM (changement sémantique)

| Valeur | HCM (importance domaine) | PFM (priorité d'amélioration) |
|--------|-------------------------|------------------------------|
| 1 | Not important at all | Pas une priorité du tout |
| 2 | Not very important | Priorité faible |
| 3 | Somewhat important | Priorité moyenne |
| 4 | Important | Priorité élevée |
| 5 | Very important | Priorité maximale |

**Différence clé :** HCM = importance descriptive, PFM = volonté d'amélioration prescriptive. Score 5 = "concentrer mes efforts ici" → pilote la distribution des gains.

## Différence fondamentale Page 5 vs Page 6

| Aspect | Page 5 (Auto-évaluation) | Page 6 (Leviers) |
|--------|------------------------|-----------------|
| Question | "À quel point maîtrisez-vous..." | "Dans quelle mesure souhaitez-vous améliorer..." |
| Mesure | État actuel (diagnostic) | Intention future (prescription) |
| Score élevé = | "Je maîtrise bien" → risque bas | "Je veux améliorer" → allocation haute |
| Rôle moteur | Coefficient contextuel (ajuste UL) | Distribution des gains (pilote le plan) |
| Step moteur | Step 4 (via coefficient) | Step 9 + Step 10 (directement) |

## Step 9 PFM : Mapping des 5 indicateurs

| Indicateur HCM | Indicateur PFM | Levier source | Calcul |
|----------------|---------------|--------------|--------|
| Accidents (OA) | Sécurisation (SEC) | Levier 1 | weight_levier1 |
| Qualité (QD) | Précision Budget (PRE) | Levier 2 | weight_levier2 |
| Know-how (EKH) | Littératie (LIT+ENG) | Leviers 3+5 | weight_levier3 + weight_levier5 |
| Absentéisme (ABS) | Régularité Épargne (REG) | Levier 4 | weight_levier4 |
| Productivité (DDP) | Patrimoine (PAT) | Levier 6 | weight_levier6 |

Logique identique : conversion 1-5 → 0-4, somme des poids, taux relatifs (%). Fallback 20% uniforme conservé.

## Step 10 PFM : Distribution des gains (ventilation mensuelle)

| Terme HCM | Terme PFM |
|-----------|----------|
| PPR_total | Économies potentielles |
| taux_indicateur | taux_levier (Step 9) |
| taux_budget_ligne | taux_budget_poste (poids dépense/total) |
| effectif_ligne | **1** (individu unique) |
| Trimestriel 20/23/27/30% | **Mensuel** progression 5→11% |

Ventilation mensuelle : 5/6/7/7/8/8/9/9/9/10/11/11% = 100% (montée en compétence progressive)

## Exemple concret : Marie (suite)

| # | Levier | Réponse | Score | Cohérence Page 5 |
|---|--------|---------|-------|-------------------|
| 1 | Sécurisation | "Priorité moyenne" | 3 | ✅ Maîtrise 4/5 mais fonds insuffisant |
| 2 | Organisation Budgétaire | "Priorité élevée" | 4 | ✅ Variables mal catégorisées |
| 3 | Culture Financière | "Priorité élevée" | 4 | ✅ Maîtrise investissement 2/5 |
| 4 | Discipline d'Épargne | "Priorité moyenne" | 3 | ✅ Épargne non automatisée |
| 5 | Formation Investissement | "Priorité maximale" | 5 | ✅ PEA débutant |
| 6 | Stratégie Patrimoniale | "Priorité maximale" | 5 | ✅ Maîtrise retraite 1/5 |

Step 9 : SEC=2, PRE=3, LIT+ENG=7, REG=2, PAT=4 → Total=18
Taux : SEC=11.1%, PRE=16.7%, LIT+ENG=38.9%, REG=11.1%, PAT=22.2%
→ 38.9% des actions concentrées sur littératie + investissement (cohérent avec profil Marie)

## Comparatif synthétique Page 6

| Aspect | HCM Page 6 | PFM Page 6 |
|--------|-----------|-----------|
| Nombre de questions | 6 | 6 |
| Type UI | 6 dropdowns (1-5) | 6 dropdowns (1-5) |
| Échelle | Importance domaine | Priorité d'amélioration |
| Labels | Jargon ISEOR | Langage personnel + 3 critères |
| Total champs | **6** | **6** |
| Temps saisie | ~30 sec | ~30 sec |
| Rôle Step 9 | Poids → 5 KPIs entreprise | Poids → 5 KPIs personnels |
| Rôle Step 10 | PPR trimestrielle par ligne | Économies mensuelles par poste |
| Ventilation | 4 trimestres (20/23/27/30%) | 12 mois (5→11%) |
| effectif_ligne | staffCount (variable) | 1 (toujours) |

---

# 15. DEEP DIVE — PAGE 7 : Tableau de Bord Résultats (remplace Programming Data PRL) — VALIDÉ

## Structure HCM (Page 7 — interface réelle)

Titre : "7- Programming data of potentially recoverable loss accounts (PRL)"
Sous-titre : "Data analysis by the Online Analytical Processing Center (OLAPC) of your Sustainability Accounting FinTech (SAF)"
Boutons : Save + Export
Grille : 6 cartes KPI en 3×2

### Les 6 cartes HCM

| # | Titre HCM | Montant exemple | Description HCM |
|---|----------|----------------|----------------|
| 1 | Unexpected losses (UL) | 1 611,00 JPY | Maximum unexpected loss at 99% confidence level |
| 2 | Expected losses (EL) | 1 145,29 JPY | Annual expected losses based on historical data |
| 3 | VaR (UL + EL) | 2 756,29 JPY | Your total maximum loss (unexpected + expected) over a given period |
| 4 | Historic or current cost of the risk appetite threshold limit | 1 816,74 JPY | The amount of losses your business has tolerated so far |
| 5 | Potentially recoverable losses (PRL) | 2 618,47 JPY | Potentially recoverable losses through mitigation |
| 6 | Forecast expected Losses (EL) | 124,03 JPY | Projected expected losses for next period |

## Transposition PFM validée : 6 cartes résultats avec titres compréhensibles

**Décision : les titres PFM sont les descriptions en langage clair (pas de jargon UL/EL/VaR)**

| # | Titre HCM | Titre PFM (compréhensible) | Sous-description PFM |
|---|----------|---------------------------|---------------------|
| 1 | Unexpected losses (UL) | **Perte imprévue maximale** | Montant maximal d'un choc financier au seuil de confiance 95% |
| 2 | Expected losses (EL) | **Manque à gagner annuel estimé** | Écart entre vos finances réelles et leur potentiel optimal |
| 3 | VaR (UL + EL) | **Perte maximale totale sur la période** | Réserve minimale recommandée pour couvrir tous les risques |
| 4 | Historic risk appetite threshold | **Montant de pertes absorbé jusqu'à présent** | Ce que vous avez effectivement subi comme pertes sur votre historique |
| 5 | Potentially recoverable losses (PRL) | **Économies récupérables grâce à vos actions** | Montant que vous pouvez récupérer en suivant le plan d'optimisation |
| 6 | Forecast expected Losses (EL) | **Pertes projetées pour la prochaine période** | Ce que vous perdrez si vous ne changez rien |

## Changements techniques

- Seuil VaR : 99% (Bâle II) → **95%** (wealth management particulier)
- Unité : k€ → **€ réels** (pas de division /1000)
- Devise : dynamique selon choix Page 1 (EUR par défaut)
- Titre page : "Tableau de bord — Résultats de votre analyse financière"
- Sous-titre : "Analyse générée par le moteur PersonalFinanceEngine de LELE PFM"
- Boutons : **Save + Export** conservés à l'identique
- Grille : **3×2** conservée à l'identique

## Exemple concret : Marie

| # | Carte PFM | Montant Marie |
|---|----------|--------------|
| 1 | Perte imprévue maximale | 2 850 € |
| 2 | Manque à gagner annuel estimé | 2 140 € |
| 3 | Perte maximale totale sur la période | 4 990 € |
| 4 | Montant de pertes absorbé jusqu'à présent | 3 200 € |
| 5 | Économies récupérables grâce à vos actions | 4 734 € |
| 6 | Pertes projetées pour la prochaine période | 890 € |

→ Marie comprend immédiatement : "Je risque jusqu'à 4 990 € de pertes, mais je peux en récupérer 4 734 € en agissant."

---

# 16. DEEP DIVE — PAGE 8 : Plan d'Optimisation Financière sur 3 ans (remplace Employee Engagement Accounts) — VALIDÉ

## Structure HCM (Page 8 — interface réelle)

Titre : "8- Data Processing for Programming and Managing... Employee Engagement Accounts (EE)"
Sous-titre : "Plan de gains sur 3 ans basé sur les Pertes Potentiellement Récupérables"
Boutons : Save + Export

### Encadré principal
"Plan de Performance sur 3 Ans" / "Basé sur les Pertes Potentiellement Récupérables (PRL) de X JPY"

### Ligne 1 — Gains Projetés (Objectifs de récupération) — 3 cartes
- a- N+1 : 30% → PRL × 0.30
- b- N+2 : 60% → PRL × 0.60
- c- N+3 : 100% → PRL × 1.00

### Ligne 2 — Pertes Restantes à Récupérer (Annuellement) — 3 cartes
- d- Restant (N+1) → PRL − gainsN1
- e- Restant (N+2) → PRL − gainsN2
- f- Restant (N+3) → 0

## Transposition PFM validée (après audit cohérence internationale)

### 4 corrections appliquées suite à l'audit

**Correction 1 — Progression adaptative (remplace 30/60/100% fixe)**
La recherche comportementale (Thaler & Benartzi, "Save More Tomorrow") montre une courbe en S, pas linéaire.
Progression selon le score LIT (littératie financière) de l'utilisateur :

| Profil | Année 1 | Année 2 | Année 3 |
|--------|---------|---------|---------|
| Débutant (LIT < 2) | 20% | 50% | 85% |
| Intermédiaire (LIT 2-3) | 30% | 65% | 100% |
| Avancé (LIT > 3) | 40% | 75% | 100% |

**Correction 2 — Split dynamique par cascade financière (remplace 70/30 fixe)**
Principe du "financial waterfall" en gestion de patrimoine :

| Situation utilisateur | Vers Épargne | Vers Dette | Vers Investissement |
|----------------------|-------------|-----------|-------------------|
| Fonds urgence < 3 mois | 90% | 10% | 0% |
| Fonds urgence OK, dette > 40% revenus | 20% | 60% | 20% |
| Fonds urgence OK, dette maîtrisée | 40% | 0% | 60% |
| Tout sécurisé | 20% | 0% | 80% |

La cascade se réévalue chaque année selon l'état réel des indicateurs SEC et DET.

**Correction 3 — Correction inflation**
Toutes projections en € constants (année de référence = année en cours).
Taux d'inflation de référence : BCE 2% (paramétrable).
Formule : montant_réel = montant_nominal / (1 + inflation)^n

**Correction 4 — Terminologie positive (framing "gap to goal")**
- ~~"Pertes Potentiellement Récupérables (PRL)"~~ → **"Potentiel d'Optimisation Budgétaire (POB)"**
- ~~"Pertes Restantes à Récupérer"~~ → **"Marge de progression restante"**
- ~~"Gains Projetés"~~ → **"Économies projetées (Objectifs annuels)"**

## Structure PFM finale — Page 8

**Titre :** "Plan d'optimisation financière sur 3 ans"
**Encadré :** "Basé sur votre Potentiel d'Optimisation Budgétaire de X € (en € constants 2026)"

### Ligne 1 — Économies projetées (Objectifs annuels) — 3 cartes
- a- Année 1 (2027) : X% → POB × taux selon profil
- b- Année 2 (2028) : X% → POB × taux selon profil
- c- Année 3 (2029) : X% → POB × taux selon profil

### Ligne 2 — Marge de progression restante — 3 cartes
- d- Reste (2027) → POB − économiesN1
- e- Reste (2028) → POB − économiesN2
- f- Reste (2029) → 0 € (ou résiduel si profil débutant)

### Ligne 3 — Répartition dynamique (cascade financière) — NOUVEAU, absent en HCM
- g- Vers Épargne Sécurisée → % selon cascade
- h- Vers Remboursement Dette → % selon cascade
- i- Vers Investissement Variable → % selon cascade

## Exemple concret : Marie (intermédiaire, LIT = 2.83, fonds urgence insuffisant)

### Ligne 1 — Économies projetées (profil intermédiaire : 30/65/100%)
| Carte | Montant |
|-------|---------|
| Année 1 (2027) : 30% | 1 420 € |
| Année 2 (2028) : 65% | 3 077 € |
| Année 3 (2029) : 100% | 4 734 € |

### Ligne 2 — Marge de progression restante
| Carte | Montant |
|-------|---------|
| Reste (2027) | 3 314 € |
| Reste (2028) | 1 657 € |
| Reste (2029) | 0 € |

### Ligne 3 — Cascade financière Marie
Année 1 : fonds urgence insuffisant → cascade "90/10/0"
Année 2 : fonds urgence probablement OK → cascade réévaluée "40/0/60"
Année 3 : tout sécurisé → cascade "20/0/80"

| | Année 1 | Année 2 | Année 3 |
|---|---------|---------|---------|
| → Épargne sécurisée | 1 278 € (90%) | 1 231 € (40%) | 947 € (20%) |
| → Remboursement dette | 142 € (10%) | 0 € | 0 € |
| → Investissement variable | 0 € (0%) | 1 846 € (60%) | 3 787 € (80%) |

## Comparatif synthétique Page 8

| Aspect | HCM Page 8 | PFM Page 8 |
|--------|-----------|-----------|
| Titre page | Employee Engagement Accounts (EE) | Plan d'optimisation financière sur 3 ans |
| Base de calcul | PRL | POB (même formule, terminologie positive) |
| Progression | 30/60/100% fixe | **Adaptative** selon profil LIT (20-40% / 50-75% / 85-100%) |
| Lignes affichées | 2 (gains + restant) | **3** (économies + restant + cascade) |
| Cartes par ligne | 3 | 3 |
| Split gains | 67/33 fixe (non affiché) | **Cascade dynamique** (affiché, réévalué/an) |
| Inflation | Non corrigé | **Corrigé** en € constants |
| Labels temporels | N+1 / N+2 / N+3 | Années réelles (2027/2028/2029) |
| Terminologie | "Pertes restantes" (négatif) | "Marge de progression" (positif) |
| Save + Export | Oui | Oui |

---

# 17. DEEP DIVE — PAGE 9 : Répartition des Économies par Levier (remplace IPLE Accounts) — VALIDÉ

## Structure HCM (Page 9 — interface réelle)

Titre : "9- Data Processing for Programming and Managing... Incentivized Pay Leverage Effect (IPLE) Accounts"
Sous-titre : "Répartition du gain potentiel total entre les domaines clés"
Boutons : Save + Export

### Encadré principal
"Répartition du Gain Potentiel par Domaine Clé" / "Basé sur les sélections de la page 6 et un PRL de X JPY"

### 5 cartes verticales (1 par indicateur Step 9)
Chaque carte : Titre indicateur + Poids % + Montant total + ventilation N+1/N+2/N+3

| # | Indicateur HCM | Poids | Total | N+1 (30%) | N+2 (60%) | N+3 (100%) |
|---|---------------|-------|-------|-----------|-----------|------------|
| 1 | KEY AREA 1: Working conditions | 5.88% | 154,03 | 46,21 | 92,42 | 154,03 |
| 2 | KEY AREA 2: Organization of work | 11.76% | 308,06 | 92,42 | 184,83 | 308,06 |
| 3 | KEY AREAS 3+5: 3C & Training | 41.18% | 1 078,20 | 323,46 | 646,92 | 1 078,20 |
| 4 | KEY AREA 4: Working Time Management | 17.65% | 462,08 | 138,62 | 277,25 | 462,08 |
| 5 | KEY AREA 6: Strategy | 23.53% | ~616 | ~185 | ~370 | ~616 |

Formule : montant_indicateur = PRL × (poids_indicateur / poids_total) × progression

## Transposition PFM validée

### Titre PFM
"Répartition de vos économies par levier d'amélioration"
Encadré : "Basé sur vos priorités (page 6) et un Potentiel d'Optimisation de X € (en € constants 2026)"

### Mapping des 5 cartes

| # | Indicateur HCM | Levier PFM | Source Page 6 |
|---|---------------|-----------|---------------|
| 1 | KEY AREA 1: Working conditions | **Sécurisation Financière (SEC)** | Levier 1 |
| 2 | KEY AREA 2: Organization of work | **Organisation Budgétaire (PRE)** | Levier 2 |
| 3 | KEY AREAS 3+5: 3C & Training | **Littératie & Engagement (LIT+ENG)** | Leviers 3+5 |
| 4 | KEY AREA 4: Time Management | **Discipline d'Épargne (REG)** | Levier 4 |
| 5 | KEY AREA 6: Strategy | **Stratégie Patrimoniale (PAT)** | Levier 6 |

### Progression adaptative (cohérent avec Page 8 corrigée)
Pas de 30/60/100% fixe — taux selon profil LIT :
- Débutant : 20% / 50% / 85%
- Intermédiaire : 30% / 65% / 100%
- Avancé : 40% / 75% / 100%

## Exemple concret : Marie (POB = 4 734 €, intermédiaire, 30/65/100%)

| # | Levier PFM | Poids | Total | Année 1 | Année 2 | Année 3 |
|---|-----------|-------|-------|---------|---------|---------|
| 1 | Sécurisation Financière | 11.1% | 525 € | 158 € | 342 € | 525 € |
| 2 | Organisation Budgétaire | 16.7% | 791 € | 237 € | 514 € | 791 € |
| 3 | Littératie & Engagement | 38.9% | 1 842 € | 553 € | 1 197 € | 1 842 € |
| 4 | Discipline d'Épargne | 11.1% | 525 € | 158 € | 342 € | 525 € |
| 5 | Stratégie Patrimoniale | 22.2% | 1 051 € | 315 € | 683 € | 1 051 € |
| | **TOTAL** | **100%** | **4 734 €** | **1 420 €** | **3 077 €** | **4 734 €** |

## Comparatif synthétique Page 9

| Aspect | HCM Page 9 | PFM Page 9 |
|--------|-----------|-----------|
| Titre | Incentivized Pay Leverage Effect (IPLE) | Répartition des économies par levier |
| Base | PRL | POB |
| Nombre de cartes | 5 | 5 |
| Labels | Jargon ISEOR (Working conditions, etc.) | Langage clair (Sécurisation, Organisation, etc.) |
| Progression | 30/60/100% fixe | Adaptative selon profil LIT |
| Labels temporels | N+1 / N+2 / N+3 | Années réelles |
| Formule | PRL × poids × progression | POB × poids × progression (identique) |
| Inflation | Non corrigé | Corrigé (€ constants) |
| Save + Export | Oui | Oui |

---

# 18. DÉCISION STRATÉGIQUE — LANGUE DE L'APPLICATION — VALIDÉ

## Décision validée par le Project Owner

**Phase 1 (MVP) : Application entièrement en français**
- Tous les labels, descriptions, messages, tooltips, boutons en français
- Pas de système i18n en phase 1
- Cible : marché francophone (France, Belgique, Suisse, Afrique francophone)

**Phase 2 (post-MVP) : Internationalisation (i18n)**
- Ajout d'un système de traduction multi-langues
- Langues prioritaires à définir (anglais, espagnol, etc.)
- Architecture i18n à prévoir dès la phase développement (clés de traduction)

**Impact technique :** Prévoir dès le code des clés de traduction (ex: `t('page7.card1.title')`) même si en phase 1 elles retournent directement le français. Cela facilitera l'ajout des langues en phase 2 sans refactoring.

---

# 19. DEEP DIVE — PAGE 10 : Ventilation des Économies par Poste × Levier (remplace Economic Breakdown) — VALIDÉ

## Structure HCM (Page 10 — interface réelle + code source Page10EconomicBreakdown.tsx)

Titre : "10- Breakdown of the programmed economic benefit to loss events and risks induced as consequences"
Sous-titre : "Ventilation du gain total (VaR) par ligne d'activité et par type de risque"
Boutons : Save + Export

### Structure : matrice 2D — risques (lignes) × business lines (colonnes)

6 catégories de risque :
1. Operational Risk
2. Credit counterparty risk
3. Market risk
4. Transformation risk
5. Organizational risk
6. Specific Health and Insurance Risk

Chaque risque affiche : taux (Rate %) + grille de 8 business lines (4×2) avec montants

### Formule par cellule (code source)
cellValue = VaR × (lineWeight / 100) × (riskWeight / 100)
Où lineWeight = budgetRate de la business line, riskWeight = taux de l'indicateur (Step 9)

## Transposition PFM validée

### Titre PFM
"Ventilation de vos économies par poste de dépense et par levier d'amélioration"
Sous-titre : "Détail de votre potentiel d'optimisation par catégorie"

### Axes de la matrice

| Axe | HCM | PFM |
|-----|-----|-----|
| Lignes (risques) | 6 risques Bâle II | **5 leviers** (SEC, PRE, LIT+ENG, REG, PAT) |
| Colonnes (business lines) | 8 départements | **8 postes de dépenses** |
| Montant distribué | VaR | POB |
| Formule cellule | VaR × lineWeight × riskWeight | POB × posteWeight × levierWeight |
| effectif | staffCount (variable) | 1 (toujours) |

### Justification : postes de DÉPENSES (pas revenus)
C'est sur les dépenses qu'on agit. Le revenu est un input, la dépense est le levier d'optimisation.
Cohérent avec Activity-Based Costing (ABC) et Zero-Based Budgeting (ZBB).

### Mapping des 5 leviers PFM (lignes)

| # | Risque HCM | Levier PFM | Taux source |
|---|-----------|-----------|-------------|
| 1 | Operational Risk | **Sécurisation Financière (SEC)** | Step 9 taux_levier1 |
| 2 | Credit counterparty | **Organisation Budgétaire (PRE)** | Step 9 taux_levier2 |
| 3 | Market + Transformation | **Littératie & Engagement (LIT+ENG)** | Step 9 taux_levier3+5 |
| 4 | Organizational | **Discipline d'Épargne (REG)** | Step 9 taux_levier4 |
| 5 | Health and Insurance | **Stratégie Patrimoniale (PAT)** | Step 9 taux_levier6 |

### 8 postes de dépenses PFM (colonnes) — issus de Page 2
Exemple Marie : Logement (28.8%), Alimentation (15.3%), Transport (10.2%), Crédit immo (19.7%), Assurance/Santé (6.8%), Loisirs (8.5%), Abonnements (4.1%), Divers (6.8%)

## Exemple concret : Marie (POB = 4 734 €)

| Poste \ Levier | SEC (11.1%) | PRE (16.7%) | LIT+ENG (38.9%) | REG (11.1%) | PAT (22.2%) |
|----------------|------------|------------|----------------|------------|------------|
| Logement (28.8%) | 151 € | 228 € | 530 € | 151 € | 303 € |
| Alimentation (15.3%) | 80 € | 121 € | 282 € | 80 € | 161 € |
| Crédit immo (19.7%) | 103 € | 156 € | 362 € | 103 € | 207 € |
| Loisirs (8.5%) | 45 € | 67 € | 157 € | 45 € | 89 € |
| Abonnements (4.1%) | 21 € | 32 € | 75 € | 21 € | 43 € |
| Transport (10.2%) | 53 € | 81 € | 188 € | 53 € | 107 € |
| Assurance (6.8%) | 36 € | 54 € | 125 € | 36 € | 71 € |
| Divers (6.8%) | 36 € | 54 € | 125 € | 36 € | 71 € |

Lecture : Marie peut économiser 530 € sur son logement via la littératie financière (renégocier bail, comparer offres, optimiser charges).

### Valeur ajoutée PFM : chaque cellule = objectif actionnable
En HCM = reporting CFO. En PFM = feuille de route opérationnelle de l'utilisateur.

## Lien avec Pages 14-16 HCM (Actions Prioritaires N+1/N+2/N+3)

Le code source révèle 3 pages supplémentaires HCM :
- Page 14 : Priority Actions N+1 (gainsN1 × indicateurs × business lines × trimestres)
- Page 15 : Priority Actions N+2 (gainsN2 × idem)
- Page 16 : Priority Actions N+3 (gainsN3 × idem)

En PFM, cette ventilation annuelle est intégrée directement dans la Page 10 via un sélecteur "Année 1 / Année 2 / Année 3" plutôt que 3 pages séparées. Simplification UX pour le particulier.

## Comparatif synthétique Page 10

| Aspect | HCM Page 10 | PFM Page 10 |
|--------|-----------|-----------|
| Titre | Breakdown economic benefit | Ventilation économies par poste × levier |
| Matrice | 6 risques × 8 départements | 5 leviers × 8 postes dépenses |
| Montant distribué | VaR | POB |
| Formule | VaR × lineWeight × riskWeight | POB × posteWeight × levierWeight |
| effectif | staffCount (variable) | 1 |
| Pages N+1/N+2/N+3 | 3 pages séparées (14/15/16) | **1 page avec sélecteur année** |
| Ventilation temps | Trimestrielle T1-T4 | Mensuelle (en drill-down) |
| Rôle | Reporting CFO | Feuille de route actionnable |
| Save + Export | Oui | Oui |

---

# 20. DEEP DIVE — PAGE 11 : Évolution des Pertes par Poste (remplace Risk Appetite Threshold Breakdown) — VALIDÉ

## Structure HCM (Page 11 — interface réelle + code source Page11RiskThreshold.tsx)

Titre : "11- BREAKDOWN OF THE AMOUNT OF LOSSES RELATED TO RISK APPETITE THRESHOLD"
Sous-titre : "Ventilation des montants des pertes par ligne d'activité"
Boutons : Save + Export

### 3 sections, chacune avec grille 4×2 des 8 business lines

**Section 1 (ambre) — Pertes historiques**
"Breakdown of the amount of historical losses linked to the usual risk appetite threshold by line of activity according to their budget"
- Formule : historicRiskAppetite × (budget_ligne / budget_total)
- Total = historicRiskAppetite (= carte 4 de Page 7)

**Section 2 (bleu) — Pertes prévisionnelles**
"Breakdown of the amount of losses linked to the new risk appetite threshold by line of activity according to their budget"
- Formule : forecastEL × (budget_ligne / budget_total)
- Total = forecastEL (= carte 6 de Page 7)

**Section 3 (vert) — Marge de Qualité Totale**
"The Margin of Total Quality (Zero defect = Economy of the insurance)"
- Dans le code actuel : qualityMargin = newThreshold × weight (= Section 2, simplification)
- Représente l'économie si zéro défaut atteint

## Transposition PFM validée

### Titre PFM
"Évolution de vos pertes par poste de dépense"
Sous-titre : "Comparaison entre votre situation historique et vos objectifs"

### 3 sections PFM avec titres compréhensibles

**Section 1 (ambre) :** "Ce que vous avez perdu jusqu'à présent, par poste"
- seuilTolérance × poids_poste_dépense

**Section 2 (bleu) :** "Ce que vous perdrez si vous ne changez rien, par poste"
- pertesProjetées × poids_poste_dépense

**Section 3 (vert) :** "Ce que vous économiserez grâce à vos actions, par poste"
- **Correction vs HCM :** Section 1 − Section 2 (vraie marge d'optimisation, pas copie de Section 2)

### Formules

| Section | HCM | PFM |
|---------|-----|-----|
| 1 | historicRiskAppetite × budgetWeight | seuilTolérance × poidsPoste |
| 2 | forecastEL × budgetWeight | pertesProjetées × poidsPoste |
| 3 | = Section 2 (simplification code) | **Section 1 − Section 2** (vraie marge) |

## Exemple concret : Marie

Seuil tolérance historique = 3 200 € | Pertes projetées = 890 € | Marge = 2 310 €

| Poste | Poids | Historique | Projeté | Marge |
|-------|-------|-----------|---------|-------|
| Logement | 28.8% | 922 € | 256 € | 666 € |
| Crédit immo | 19.7% | 630 € | 175 € | 455 € |
| Alimentation | 15.3% | 490 € | 136 € | 353 € |
| Transport | 10.2% | 326 € | 91 € | 236 € |
| Loisirs | 8.5% | 272 € | 76 € | 196 € |
| Assurance | 6.8% | 218 € | 61 € | 157 € |
| Divers | 6.8% | 218 € | 61 € | 157 € |
| Abonnements | 4.1% | 131 € | 36 € | 95 € |
| **TOTAL** | **100%** | **3 200 €** | **890 €** | **2 310 €** |

## Comparatif synthétique Page 11

| Aspect | HCM Page 11 | PFM Page 11 |
|--------|-----------|-----------|
| Titre | Breakdown losses risk appetite threshold | Évolution de vos pertes par poste |
| Sections | 3 | 3 |
| Colonnes | 8 départements | 8 postes de dépenses |
| Section 3 | = Section 2 (simplification) | Section 1 − Section 2 (vraie marge) |
| Titres sections | Jargon risk appetite | Langage clair (perdu / perdrez / économiserez) |
| Save + Export | Oui | Oui |

---

# 21. DEEP DIVE — PAGE 12 : Plan d'Optimisation Détaillé sur 3 ans (remplace IPLE Plan) — VALIDÉ

## Structure HCM (Page 12 — interface réelle + code source Page12IPLEPlan.tsx)

Titre : "12- Breakdown of the Incentivized Pay Leverage Effect (IPLE) expected from the Financial Performance of Workstations over a 3-year plan"
Sous-titre : "Flux financiers attendus sur le plan de 3 ans"
Boutons : Save + Export

### Pour chaque année (N+1, N+2, N+3) — 2 blocs :

**Bloc A/C/E — Ventilation gains par indicateur socio-économique (5 cartes)**
Formule : gain_année × (poids_indicateur / total_poids)
Indicateurs : ABS, QD, OA, DDP, EKH
Puis split : Cash flows 67% (entreprise) + Primes 33% (employés)

**Bloc B/D/F — Ventilation IPLE par risque Bâle II (6 cartes)**
Formule : cashFlow × (ratio_risque / 84)
Ratios fixes : [30/10/5/14/13/12] normalisés sur 84

**Footer** : Total Cash-Flow 3 ans + Total Primes 3 ans

## Transposition PFM validée

### Titre PFM
"Plan d'optimisation détaillé sur 3 ans"
Sous-titre : "Répartition de vos économies par levier et par poste de dépense"

### Bloc A/C/E → "Économies par levier d'amélioration" (5 cartes)
ABS→REG, QD→PRE, OA→SEC, DDP→PAT, EKH→LIT+ENG
Formule identique avec poids dynamiques Step 9

### Bloc B/D/F → "Économies par poste de dépense" (remplace risques Bâle II)
Les 6 risques à ratios fixes sont remplacés par les 8 postes de dépenses avec poids dynamiques (Page 2).
Justification : en PFM il n'y a qu'un seul référentiel (les 5 leviers), pas 2 comme en HCM (socio + Bâle II). Le bloc B/D/F serait redondant avec A/C/E → on le remplace par la ventilation par poste.

### Split 67/33 → Cascade dynamique
- ~~Cash-Flow 67% / Primes 33%~~ → Cascade financière (Section 16)
- Réévaluée chaque année selon état SEC et DET

### Progression adaptative (pas 30/60/100% fixe)
Selon profil LIT : Débutant 20/50/85, Intermédiaire 30/65/100, Avancé 40/75/100

## Comparatif synthétique Page 12

| Aspect | HCM Page 12 | PFM Page 12 |
|--------|-----------|-----------|
| Titre | IPLE Financial Performance 3-year plan | Plan d'optimisation détaillé sur 3 ans |
| Bloc A (par an) | 5 indicateurs socio-économiques | 5 leviers PFM |
| Bloc B (par an) | 6 risques Bâle II (ratios fixes) | **8 postes de dépenses** (poids dynamiques) |
| Split | 67% Cash-Flow / 33% Primes (fixe) | Cascade dynamique réévaluée/an |
| Progression | 30/60/100% fixe | Adaptative selon profil LIT |
| Labels | N+1/N+2/N+3 | Années réelles |
| Footer | Total Cash-Flow + Total Primes | Total Épargne + Investissement + Dette |

---

# 22. DEEP DIVE — PAGE 13 : Calendrier d'Épargne Personnel (remplace Dashboard Incentivized Pay) — VALIDÉ

## Structure HCM (Page 13 — interface réelle + code source Page13Dashboard.tsx)

Titre : "13- Dashboard of the real-time driving plan and feedback of the internal financial performance scheduled for the counterpart of the Incentivized Pay (Bonus or variable salary)"
Sous-titre : "Tableau de bord consolidé du plan de performance financière"
Boutons : Save + Export

### 3 niveaux de détail

**Niveau 1 — Vue annuelle (3 cartes)**
N+1/N+2/N+3 : Total Annual Bonuses (33% des gains)

**Niveau 2 — Détail par année (3 cartes × 3 ans)**
By Quarter / By Month / By Week — montants UNIFORMES dans l'année

**Niveau 3 — Calendrier complet (code source)**
3 ans × 4 trimestres × 3 mois × 4 semaines = 144 cellules
Même montant hebdomadaire partout (weeklyBonus uniforme)

## Transposition PFM validée

### Titre PFM
"Calendrier de votre plan d'épargne et d'investissement"
Sous-titre : "Objectifs hebdomadaires, mensuels et trimestriels"

### Changements fondamentaux

1. **Objet** : Primes employés (33%) → **Totalité des économies** (100%)
2. **Montants** : Uniformes → **Progressifs** (5→11% par mois, montée en compétence)
3. **Cascade** : Non affiché → **Affiché** (épargne / dette / investissement)
4. **Niveau 3** : 144 cellules (trop granulaire) → **36 cellules** (12 mois × 3 ans)
5. **Cumul** : Non → **Oui** (colonne cumul depuis le début)

### Structure PFM

**Niveau 1** : 3 cartes annuelles + sous-texte répartition cascade
**Niveau 2** : Par trimestre (croissant) / Par mois (croissant) / Par semaine
**Niveau 3** : Calendrier mensuel 36 cellules avec montant + cascade + cumul

### Exemple Marie — Année 1 (1 420 €, cascade 90/10/0)

| Mois | % | Montant | Épargne | Dette | Cumul |
|------|---|---------|---------|-------|-------|
| Jan | 5% | 71 € | 64 € | 7 € | 71 € |
| Fév | 6% | 85 € | 77 € | 9 € | 156 € |
| Mar | 7% | 99 € | 89 € | 10 € | 256 € |
| ... | ... | ... | ... | ... | ... |
| Déc | 11% | 156 € | 141 € | 16 € | 1 420 € |

## Comparatif synthétique Page 13

| Aspect | HCM Page 13 | PFM Page 13 |
|--------|-----------|-----------|
| Titre | Dashboard Incentivized Pay (Bonus) | Calendrier d'épargne et investissement |
| Objet | Primes employés (33%) | Totalité des économies (100%) |
| Niveau 1 | 3 cartes annuelles | 3 cartes + cascade |
| Niveau 2 | Trim/Mois/Sem (uniformes) | Trim/Mois/Sem (progressifs) |
| Niveau 3 | 144 cellules | 36 cellules (mois seulement) |
| Montants | Uniformes | Croissants (5→11%) |
| Cascade | Non | Oui (épargne/dette/investissement) |
| Cumul | Non | Oui |
| Labels | N+1/N+2/N+3 | Années réelles |

---

# 23. DEEP DIVE — PAGES 14/15/16 : Actions Prioritaires N+1/N+2/N+3 → Page unique avec sélecteur (remplace Priority Actions) — VALIDÉ

## Structure HCM (Pages 14/15/16 — interface réelle + code source)

### Page 14 — Priority Actions N+1
Titre : "14- PRIORITY ACTIONS - N+1 / Action plan or progress plan by key areas of socio-economic improvement"
Sous-titre : "Distribution des objectifs d'économie de coûts pour l'année N+1 par ligne d'activité et par indicateur de performance"

### Éléments Page 14 HCM

**Timeline visuelle :** Barre de progression "Aujourd'hui" → Q1 courant, marqueurs N+1/N+2/N+3

**3 cartes résumé :**
- PPR de l'année N+1 : X (Économie de coûts prévue)
- Effectif total : X Employés
- Lignes d'activité : X Lignes configurées

**5 cartes indicateurs de contrôle par domaine clé :**
- Gestion du temps → Absentéisme → Taux %
- Mise en oeuvre stratégique → Productivité directe → Taux %
- Organisation du travail → Défauts de qualité → Taux %
- Conditions de travail → Accidents → Taux %
- Communication + Formation → Know-how → Taux %

**Grille détaillée :** 5 indicateurs × 8 business lines × 4 trimestres (PPR par personne par trimestre)

### Pages 15 et 16 : structure identique à Page 14 mais pour N+2 (gainsN2) et N+3 (gainsN3)

## Transposition PFM validée : fusion en 1 page avec sélecteur

### Décision : 3 pages HCM → 1 page PFM avec sélecteur d'année
Justification : pour un particulier, 3 pages quasi-identiques alourdissent la navigation. Un sélecteur "Année 1 / Année 2 / Année 3" est plus ergonomique.

### Titre PFM
"Actions prioritaires — [Année sélectionnée]"
Sous-titre : "Objectifs d'économie par levier et par poste de dépense"

### Mapping des éléments

**Timeline :** Conservée avec mois courant + années réelles (2027/2028/2029)

**3 cartes résumé :**
- ~~PPR année~~ → **Économies prévues Année X** (montant)
- ~~Effectif total~~ → **Supprimé** (individu = 1)
- ~~Lignes d'activité~~ → **Postes de dépenses : 8**

**5 cartes indicateurs → 5 cartes leviers PFM :**

| HCM | PFM |
|-----|-----|
| Gestion du temps → Absentéisme | **Discipline d'Épargne → REG** |
| Mise en oeuvre stratégique → Productivité | **Stratégie Patrimoniale → PAT** |
| Organisation du travail → Qualité | **Organisation Budgétaire → PRE** |
| Conditions travail → Accidents | **Sécurisation Financière → SEC** |
| Communication + Formation → Know-how | **Littératie & Engagement → LIT+ENG** |

**Grille détaillée :** 5 leviers × 8 postes dépenses × 12 mois (ventilation mensuelle progressive)

### Progression adaptative intégrée
Le sélecteur d'année applique automatiquement le taux du profil :
- Année 1 : 20-40% selon LIT
- Année 2 : 50-75% selon LIT
- Année 3 : 85-100% selon LIT

## Comparatif synthétique Pages 14/15/16

| Aspect | HCM Pages 14/15/16 | PFM Page unique |
|--------|-------------------|----------------|
| Nombre de pages | 3 séparées | **1 avec sélecteur** |
| Timeline | Trimestrielle Q1-Q4 | Mensuelle + mois courant |
| Carte effectif | Oui (70 employés) | Supprimée |
| Carte lignes | 8 business lines | 8 postes dépenses |
| Indicateurs | 5 ISEOR (ABS, QD, OA, DDP, EKH) | 5 leviers PFM |
| Grille | 5 × 8 × 4 trimestres | 5 × 8 × 12 mois |
| PPR par personne | Oui (÷ staffCount) | Non (individu = 1) |
| Progression | 30/60/100% fixe | Adaptative selon LIT |

---

## Section 24 — Page 17 : Global Reporting → Rapport Global de Santé Financière

**Fichier source HCM :** `src/modules/module1/components/reporting/Page17GlobalReporting.tsx` (269+ lignes)

### Structure HCM analysée (10 sections A-J)

| Section | Titre HCM | Contenu |
|---------|-----------|---------|
| A | VaR Distribution | Répartition VaR par ligne d'activité |
| B | Savings Distribution | Distribution des économies attendues |
| C | VaR Basel Risk | VaR par catégorie de risque Bâle II |
| D | Economic Breakdown | Ventilation économique risques × lignes |
| E | Risk Threshold | Seuil d'appétit au risque |
| F | IPLE Plan | Plan IPLE 3 ans |
| G | Dashboard | Tableau de bord primes/bonus |
| H | Priority Actions N+1 | Actions prioritaires année 1 |
| I | Priority Actions N+2 | Actions prioritaires année 2 |
| J | Priority Actions N+3 | Actions prioritaires année 3 |

**Fonctionnalités techniques HCM :**
- Calendrier fiscal configurable (mois de début)
- Sections repliables (lazy rendering via IntersectionObserver)
- Export PDF via `html2canvas` + `jsPDF` (import dynamique ~33MB)
- Rendu adaptatif (sections rendues au scroll)

### Version PFM : 8+1 sections (★ + A-H)

| PFM | Titre PFM | Transposition |
|-----|-----------|---------------|
| ★ | **Score Global de Santé Financière** | 🆕 NOUVEAU — Score /100 + radar 5 dimensions + jauge visuelle |
| A | Répartition du POB par poste de dépense | ← HCM Section A (VaR → POB, lignes → postes) |
| B | Distribution des économies attendues | ← HCM Section B (conservée) |
| C | POB par catégorie de risque personnel | ← HCM Section C (Bâle II → 6 risques individuels) |
| D | Ventilation économique leviers × postes | ← HCM Section D (risques×lignes → leviers×postes) |
| E | Marge de progression par poste | ← HCM Section E (seuil risque → marge progression) |
| F | Plan d'Optimisation 3 ans | ← HCM Section F (IPLE → Plan épargne/investissement) |
| G | Calendrier d'Épargne | ← HCM Section G (primes → versements mensuels) |
| H | **Actions Prioritaires (avec sélecteur d'année)** | ← HCM Sections H+I+J **fusionnées** (3 pages → 1 avec onglets N+1/N+2/N+3) |

### Décisions clés Page 17

1. **Section ★ (Score Global) ajoutée en première position** — absente dans HCM, elle donne à l'utilisateur sa note de santé financière globale /100 avec un radar chart des 5 dimensions (ÉPARGNER, EMPRUNTER, DÉPENSER, PLANIFIER, COMPÉTENCE) et une jauge visuelle colorée (rouge < 40 < orange < 70 < vert)

2. **Fusion H/I/J → H unique** — cohérent avec la décision des Pages 14/15/16, un sélecteur d'année plutôt que 3 sections identiques

3. **Export PDF enrichi** — couverture avec nom + date + score, table des matières, pied de page "Généré par LELE PFM — Usage personnel uniquement"

4. **Calendrier fiscal simplifié** — pas de mois de début configurable (année civile janvier-décembre pour les particuliers)

5. **Lazy loading conservé** — sections repliables avec chargement au scroll pour performance sur mobile

### Bilan complet de l'analyse des 18 pages

| Pages HCM (0-17) | Pages PFM | Statut |
|-------------------|-----------|--------|
| Page 0 : Welcome | Page 0 : Bienvenue | ✅ Adaptée |
| Page 1 : Company Info | Page 1 : Profil Personnel | ✅ Adaptée |
| Page 2 : Budget Rates | Page 2 : Revenus & Budget | ✅ Adaptée |
| Page 3 : Staff Metrics | Page 3 : Structure Financière | ✅ Adaptée |
| Page 4 : Evolution Rates | Page 4 : Taux d'Évolution | ✅ Adaptée |
| Page 5 : Qualitative Assessment | Page 5 : Auto-évaluation | ✅ Adaptée |
| Page 6 : Socioeconomic | Page 6 : Leviers d'Amélioration | ✅ Adaptée |
| Page 7 : Calculated Fields | Page 7 : Tableau de Bord (6 cartes) | ✅ Adaptée |
| Page 8 : Performance Plan | Page 8 : Plan de Performance 3 ans | ✅ Corrigée (4 corrections) |
| Page 9 : IPLE Accounts | Page 9 : Comptes d'Optimisation | ✅ Adaptée |
| Page 10 : Economic Breakdown | Page 10 : Ventilation Économique | ✅ Adaptée |
| Page 11 : Risk Threshold | Page 11 : Marge de Progression | ✅ Corrigée (bug Section 3) |
| Page 12 : IPLE Plan | Page 12 : Plan d'Optimisation | ✅ Adaptée |
| Page 13 : Dashboard | Page 13 : Calendrier d'Épargne | ✅ Adaptée (144→36 cellules) |
| Pages 14/15/16 : Priority Actions | Page 14 : Actions Prioritaires | ✅ Fusionnées (3→1 page) |
| Page 17 : Global Reporting | Page 15 : Rapport Global | ✅ Adaptée (10→8+1 sections) |

**Total : 18 pages HCM → 16 pages PFM** (fusion 14/15/16 + renumérotation)

---

## Section 25 — Fin de la Phase Analyste (Mary) — Transition vers Phase PM (John)

L'analyse exhaustive page par page des 18 pages du Module 1 HCM est **terminée et validée** par le Project Owner.

**Livrables produits par la phase Analyste :**
1. Product Brief (vision, 5D/10I, 12 profils, UL rates)
2. Deep Dive complet 18 pages avec mapping HCM → PFM
3. Document de contexte PFM_CONTEXTE_DECISIONS.md (Sections 1-24)

**Prochaine étape :** Analyse vision Module 3 (Cost Savings → Suivi & Optimisation) AVANT Phase PM

---

## Section 26 — Module 3 : Vision globale et page d'accueil

### Contexte stratégique
Module 3 HCM (Cost Savings) = **43 298 lignes, 64 fichiers** — 3,7× plus gros que Module 1.
C'est le **moteur d'exécution** : le plan d'optimisation créé au Module 1 est suivi et mesuré ici.
Module 3 dépend de Module 1 (imports currency, SupabaseService, types). L'inverse est faux.

### 3 Phases HCM → 3 Phases PFM

| Phase | HCM | PFM |
|-------|-----|-----|
| Phase 1 | Les données des employés de vos équipes | **Votre situation financière** (revenus, comptes, structure foyer) |
| Phase 2 | Les données des coûts générés au quotidien | **Vos dépenses réelles** (enregistrement mensuel par catégorie) |
| Phase 3 | Le calcul des performances de vos équipes | **Votre performance financière** (progrès vs plan) |

### Page d'accueil PFM
- Titre : "SUIVI & OPTIMISATION FINANCIÈRE"
- Sous-titre : "Suivez vos dépenses réelles et mesurez vos progrès"
- Badge : "Vos données restent privées et sécurisées"
- Footer : "LELE PFM — Module Suivi"
- Icônes : Wallet / Receipt / BarChart3

### Routes : 17 routes HCM → 14 routes PFM (mapping complet validé)

---

## Section 27 — Module 3, Phase 1 : Configuration (CORRIGÉE après audit financier)

### Erreurs initiales corrigées
1. ❌ Business lines → Revenue sources → ✅ **8 Postes de dépenses** (COICOP)
2. ❌ Teams → Bank accounts → ✅ **Sous-catégories de dépenses** (plan comptable)
3. ❌ Employees → Financial flows → ✅ **Dépenses récurrentes individuelles** (line items)

### Hiérarchie PFM (conforme normes internationales)

| Niveau | HCM | PFM | Standard |
|--------|-----|-----|----------|
| N1 | Business Line | **Poste de dépense** (8 catégories) | COICOP (ONU) |
| N2 | Équipe | **Sous-catégorie** | Plan comptable simplifié |
| N3 | Employé | **Dépense récurrente** | Line item budgeting |

### Attributs transposés (validés vs normes)

| Attribut HCM | Attribut PFM | Norme de référence |
|-------------|-------------|-------------------|
| Catégorie professionnelle | **Fixe / Variable** | Comptabilité analytique ✅ |
| Tech Level | **Essentielle / Discrétionnaire / Optimisable** | Règle 50/30/20 (CFP) ✅ |
| Taux d'incapacité | **Taux d'incompressibilité** | Stress testing EBA/BCE ✅ |
| Polyvalence F1/F2/F3 | **Flexibilité F1/F2/F3** (alternatives) | Élasticité de substitution ✅ |

### Formulaire PFM
1. Sélectionner un poste de dépense (8 postes du Module 1)
2. Sélectionner/créer une sous-catégorie
3. Nommer la sous-catégorie
4. Nature : Fixe/Variable + Essentielle/Discrétionnaire

---

## Section 28 — Module 3, Phase 2 : Contrôle des Indicateurs de Performance

**Fichier source HCM :** `src/modules/module3/CostDataEntry.tsx` (1 561 lignes)
**Formulaires spécialisés :** QualityDefectsForm.tsx, OccupationalAccidentForm.tsx, DirectProductivityForm.tsx

### Structure HCM : Wizard 3 étapes

**Étape 1 :** Ligne d'activité + Équipe + Calendrier hebdomadaire (WeekCalendarSelector)
**Étape 2 :** Sélection KPI (ABS / QD / OA / DDP, EKH calculé en Phase 3)
**Étape 3 :** Saisie : Employé + Date + Durée + Compensation → batch insert `module3_cost_entries`

### Version PFM : "Suivi de vos Dépenses"

**Étape 1 PFM :** Poste de dépense (8 COICOP) + Sous-catégorie + **Calendrier hebdomadaire CONSERVÉ**
**Étape 2 PFM :** Type transaction (Dépense fixe / Variable / Imprévue / Versement épargne-dette)
**Étape 3 PFM :** Date + Montant + Description + Moyen paiement + Essentiel/Discrétionnaire

### Innovation : pré-remplissage des dépenses fixes chaque semaine

### Mécanismes conservés
WeekCalendarSelector, calendarEventBus, Generate/Delete Demo, verrouillage par semaine

---

## Section 29 — DÉCISION STRATÉGIQUE : Granularité hebdomadaire

**La granularité de suivi PFM est HEBDOMADAIRE**, pas mensuelle.

**Justifications :** Kakeibo (1904), engagement SaaS (52 vs 12 connexions/an), objectifs actionnables, cohérence code HCM, course correction précoce.

**Impact rétroactif Module 1 :**
- Page 13 : 36 cellules → **156 cellules (52 semaines × 3 ans)**
- Pages 14-16 : mensuel → **objectifs hebdomadaires** avec recap mensuel auto

**Boucle fermée :** Module 1 PLANIFIE les objectifs hebdomadaires ↔ Module 3 MESURE les résultats hebdomadaires

---

## Section 30 — Module 3, Phase 3 : Vue d'Ensemble des Équipes (AnalysisConfigurationPage)

**Fichier source HCM :** `src/modules/module3/AnalysisConfigurationPage.tsx` (995 lignes)
**Rôle :** Bridge lecture seule Module 1 → Module 3 (aucune saisie, données transférées automatiquement)

### Structure HCM : 4 Stat Cards

| # | Card HCM | Card PFM |
|---|----------|----------|
| 1 | Lignes d'Activité (ex: 8) | **Postes de Dépenses** (8 catégories COICOP) |
| 2 | Total Employés (ex: 73) | **Total Sous-catégories** (ex: 45 flux récurrents) |
| 3 | Moy. Taux Incapacité (ex: 28%) | **Moy. Taux Incompressibilité** (charges fixes/revenu) |
| 4 | Moy. Coefficient Compétence (ex: 47%) | **Moy. Score Flexibilité** (potentiel optimisation) |

### Cards dépliables : par ligne d'activité → par poste de dépense

**Table des employés HCM (9 colonnes) → Table des sous-catégories PFM :**

| Col HCM | Col PFM |
|---------|---------|
| # | # |
| Nom employé | Nom sous-catégorie (ex: "Carburant") |
| Catégorie professionnelle | Type (Fixe / Variable) |
| Niveau Tech (Human/IA/Cobot) | Nature (Essentielle / Discrétionnaire) |
| Incapacité % | Incompressibilité % |
| F1 (Versatilité) | F1 (Élasticité substitution) |
| F2 (Versatilité) | F2 (Variabilité temporelle) |
| F3 (Versatilité) | F3 (Réductibilité progressive) |
| Coefficient Compétence | **Score Flexibilité** |

### Formule préservée identiquement
`Score = (F1 + F2 + F3) / 63 × 100`
Échelle F1/F2/F3 : {0, 7, 14, 21} → Score max = (21+21+21)/63 = 100%
→ La formule mathématique HCM est conservée à l'identique, seuls les labels changent

### Flux de données
`PFM Budget Plan / Page 3: Historique Financier` → `Vue d'Ensemble Structure Financière`
Auto-repair conservé : SupabaseService.loadCFOData() → données Module 1

### Validation financière
- Incompressibilité = charges incompressibles (EBA/BCE stress testing)
- Flexibilité F1/F2/F3 = élasticité de substitution (Marshall/Hicks)
- Score agrégé = capacité d'optimisation budgétaire du poste

---

## Section 31 — Module 3, Phase 3 : Alignement des Données par Ligne d'Activité (DataAlignmentPage)

**Fichier source HCM :** `src/modules/module3/DataAlignmentPage.tsx` (1 268 lignes)
**Interface Excel :** "2-Tri-TB Fixe-Données Risko M1"

### Objectif HCM
Calculer le **PPR (Pertes Potentiellement Récouvrables)** par salarié et par indicateur.
Aligne les données Module 1 (Financial History) avec les lignes d'activité de Module 3.

### Structure HCM

**4 Stat Cards :**
| # | Card | Source |
|---|------|--------|
| 1 | Lignes d'Activité (8, 73 salariés) | Module 3 teams |
| 2 | Annual Hours/Person (1 250) | M1 Page 3 Financial History |
| 3 | Sales/Turnover N-1 (5 000 k¥) | M1 Page 3 Financial History |
| 4 | Total Spending N-1 (4 900 k¥) | M1 Page 3 Financial History |

**Formule PPR/PERS (extraite de l'Excel) :**
```
PPR/PERS = (PPR_trimestre × indicator_rate × budget_rate) / nb_salariés / sales_N1
Où :
- PPR_trimestre = gainsN1 / 4
- indicator_rate = taux de l'indicateur (Page 14 Distribution)
- budget_rate = budget_ligne / budget_total
- nb_salariés = effectif de la ligne
- sales_N1 = chiffre d'affaires N-1
```

**5 KPIs HCM dans la matrice :**
ABS (Absentéisme), DFQ (Défauts Qualité), ADT (Accidents Travail), EPD (Productivité Directe), EKH (Écarts Know-How)

**Table par ligne d'activité (13 colonnes) :**
Informations Salarié (5 cols) + Données M1 (3 cols) + PPR PRÉVU/PERS (5 cols)

**Smart Calendar :** `getLastCompletedWeek()` pour afficher la dernière semaine avec données

### Version PFM : "Alignement du Budget par Poste de Dépense"

**Titre PFM :** "Alignement du Budget par Poste de Dépense"
**Sous-titre :** "Données Budget Plan + EPR PRÉVU/POSTE par catégorie — Semaine en cours"

**Transposition conceptuelle centrale :**
PPR (Pertes Potentiellement Récouvrables) → **EPR (Économies Potentiellement Réalisables)**
= montant que l'utilisateur PEUT économiser sur chaque poste, ventilé par type de dépense

**4 Stat Cards PFM :**
| # | Card PFM | Source |
|---|----------|--------|
| 1 | Postes de Dépenses (8 COICOP, X sous-catégories) | Module 3 config |
| 2 | Revenu Net Mensuel | PFM Budget Plan Page 3 |
| 3 | Total Dépenses N-1 | PFM Budget Plan Page 3 |
| 4 | Taux d'Épargne Actuel (%) | Calculé : (Revenu - Dépenses) / Revenu |

**Formule EPR/POSTE (transposition de PPR/PERS) :**
```
EPR/POSTE = (EPR_hebdo × category_rate × flexibility_rate)
Où :
- EPR_hebdo = objectif_épargne_annuel / 52
- category_rate = budget_catégorie / budget_total (pondération COICOP)
- flexibility_rate = score_flexibilité de la sous-catégorie (0-100%)
```

**4 Types de dépenses PFM + 1 calculé (CORRIGÉ après audit Section 32) :**
| KPI HCM | Type PFM | Couleur | Logique |
|---------|----------|---------|---------|
| ABS | **Dépense Fixe** | Jaune | Loyer, assurances, abonnements = récurrent prévisible |
| DFQ | **Dépense Variable** | Violet | Alimentation, transport, énergie = montant fluctuant |
| ADT | **Dépense Imprévue** | Rouge | Réparation, urgence médicale = aléatoire non planifié |
| EPD | **Versement Épargne/Dette** | Bleu | Épargne, remboursement crédit = stratégique volontaire |
| EKH | **Score Compétence Financière** | Vert | **CALCULÉ** (pas saisi) — dérivé du comportement utilisateur |

> Note : Nature (Essentielle/Discrétionnaire) = attribut transversal indépendant du type (classification double entrée)

**Table par poste de dépense (12 colonnes PFM — 5 info + 3 M1 + 4 EPR) :**

| Bloc | Col HCM | Col PFM |
|------|---------|---------|
| Info (5 cols) | # | # |
| | Nom salarié | Nom sous-catégorie |
| | Catégorie pro | Type (Fixe/Variable/Imprévue/Épargne) |
| | Niveau Tech | Nature (Essentielle/Discrétionnaire) |
| | Incapacité % | Incompressibilité % |
| Données M1 (3 cols) | Vol. Horaire | Budget hebdo alloué |
| | Sales N-1 | Dépense réelle N-1 |
| | Spending N-1 | Écart (Budget - Réel) |
| EPR (4 cols + TOTAL) | ABS/DFQ/ADT/EPD | Fixe/Variable/Imprévue/Épargne + **TOTAL** |

> 5ème colonne EPR = TOTAL (somme des 4), pas un 5ème type. EKH → calculé dans les pages d'analyse suivantes.

### Mécanismes conservés
- Smart Calendar (getLastCompletedWeek) → semaine en cours
- Cards dépliables avec expand/collapse all
- Data flow indicator (M1 → Alignement)
- Formatage monétaire avec createKCurrencyFormatter
- Footer navigation (← Vue d'ensemble | Récapitulatif →)
- Gestion empty state

### Cohérence financière
- EPR = concept de "savings potential" utilisé en comptabilité de gestion (management accounting)
- Pondération par catégorie COICOP = norme ONU de classification des dépenses
- Flexibility rate = élasticité-prix croisée (capacité de substitution ou réduction)
- Taux d'épargne = indicateur macroéconomique standard (BCE, Fed, OCDE)
- Division par 52 semaines = granularité hebdomadaire validée (Section 29)

---

## Section 32 — Module 3, Phase 3 : Récapitulatif des Coûts Enregistrés par Salarié (CostRecapByEmployeePage)

**Fichier source HCM :** `src/modules/module3/CostRecapByEmployeePage.tsx` (1 088 lignes)
**Route :** `/modules/module3/cost-recap`
**Source Excel :** "2- Les données des coûts générés au quotidien par votre activité"

### Objectif HCM
Journal exhaustif de tous les coûts enregistrés par les chefs d'équipe dans Phase 2 (CostDataEntry).
Lecture seule — aucune saisie, uniquement consultation et filtrage.

### Structure HCM

**4 Stat Cards :**
| # | Card | Contenu |
|---|------|---------|
| 1 | Total des Frais | Somme compensation_amount (devise M1) |
| 2 | Temps Total | Somme duration_hours + minutes |
| 3 | Salariés Concernés | Unique employees + nb entrées |
| 4 | Lignes d'Activité | Nb départements actifs |

**3 Filtres :**
- Recherche textuelle (nom salarié ou ligne d'activité)
- Filtre par ligne d'activité (Select)
- Filtre par indicateur KPI (Select : ABS, QD, OA, DDP, EKH)

**Table 7 colonnes :**
Ligne d'Activité | Indicateur | Nom du Salarié | Date | Durée | Frais | Détails (expand)

**Panneau détails dépliable (3 blocs) :**
1. Période d'analyse : début, fin, date événement
2. Temps & Coûts : durée, compensation, économies (vert), dépenses en trop (rouge)
3. Détails KPI spécifiques :
   - QD → types de défauts (badges)
   - OA → niveau responsabilité (high/medium/low)
   - DDP → jours concernés + temps récupéré/perdu

**Footer :** TOTAL heures + TOTAL frais

**Techniques :**
- Pagination 10K+ (PAGE_SIZE_MEMBERS=500, PAGE_SIZE_ENTRIES=500)
- Smart Calendar : filtre par dernière semaine complétée
- Enrichment : CostEntry → EnrichedCostEntry (join employee + business_line)
- Multi-devise via Module 1 factors.selectedCurrency

### Version PFM : "Journal des Transactions Hebdomadaires" (CORRIGÉE après audit financier)

**Titre PFM :** "Journal des Transactions de la Semaine"
**Rôle :** Consultation de toutes les transactions saisies en Phase 2 ("Suivi de vos Dépenses")

**⚠️ 3 ERREURS CORRIGÉES :**
1. ~~5 types de transactions~~ → **4 types** (cohérence Phase 2 ↔ Phase 3)
2. ~~"Discrétionnaire" comme type~~ → **Nature = attribut transversal**, pas un type
3. ~~"Éducation Financière" comme 5ème type~~ → **Score dérivé** (calculé comme EKH en HCM)

**Classification corrigée — 2 axes indépendants :**
- **AXE 1 — TYPE** (comment la dépense se comporte) : Fixe / Variable / Imprévue / Épargne-Dette
- **AXE 2 — NATURE** (le degré de nécessité) : Essentielle / Discrétionnaire
→ Standard comptable de classification par double entrée

**4 Types de transactions (identiques Phase 2 = Phase 3) :**
| # | Type PFM | Équivalent HCM | Description |
|---|----------|----------------|-------------|
| 1 | **Dépense Fixe** | ABS (récurrent, prévisible) | Loyer, assurances, abonnements |
| 2 | **Dépense Variable** | QD (régulier, montant fluctuant) | Alimentation, transport, énergie |
| 3 | **Dépense Imprévue** | OA (aléatoire, non planifié) | Réparation, urgence médicale, amende |
| 4 | **Versement Épargne/Dette** | DDP (stratégique, volontaire) | Épargne, remboursement crédit |

**5ème KPI (EKH) → Score de Compétence Financière :** dérivé du comportement utilisateur (régularité de connexion, respect du budget, diversification). Calculé en Phase 3 analyse, jamais saisi. Identique au pattern HCM où EKH est calculé, pas entré.

**4 Stat Cards PFM :**
| # | Card HCM | Card PFM |
|---|----------|----------|
| 1 | Total des Frais | **Total Dépensé cette semaine** |
| 2 | Temps Total | **Nombre de Transactions** (pas de durée en PFM) |
| 3 | Salariés Concernés | **Postes Impactés** (nb catégories COICOP touchées) |
| 4 | Lignes d'Activité | **Solde Restant** (budget hebdo - dépensé) |

> Note : Card 4 rompt la symétrie structurelle HCM (compteur → valeur monétaire) mais respecte la logique financière : le solde restant est le métrique #1 de toute appli budgétaire (standard Kakeibo, Mint, YNAB).

**3 Filtres PFM :**
- Recherche textuelle (nom sous-catégorie ou description)
- Filtre par poste COICOP (8 catégories)
- Filtre par type de transaction (**4 types** : Fixe / Variable / Imprévue / Épargne-Dette)

**Table 7 colonnes PFM :**
| Col HCM | Col PFM |
|---------|---------|
| Ligne d'Activité | Poste de Dépense (catégorie COICOP) |
| Indicateur KPI | Type Transaction (badge : **4 types**) |
| Nom du Salarié | Description (ex: "Carburant SP95 - Station Total") |
| Date | Date |
| Durée | **Moyen de Paiement** (CB/Espèces/Virement/Prélèvement) |
| Frais | Montant |
| Détails | Détails (expand) |

**Panneau détails PFM (3 blocs) :**
1. **Contexte :** Semaine, catégorie COICOP, sous-catégorie, **nature (Essentielle/Discrétionnaire)** ← affiché ici comme attribut
2. **Budget :** Montant, % du budget hebdo catégorie, écart vs objectif
3. **Analyse par type (4 types uniquement) :**
   - Fixe → fréquence récurrence, prochaine échéance
   - Variable → comparaison vs semaine précédente, tendance ↑↓
   - Imprévue → impact sur le fonds d'urgence, fréquence des imprévus
   - Épargne/Dette → progression vers objectif annuel (%)

**Footer PFM :** TOTAL transactions + TOTAL montant + Solde restant

### Mécanismes conservés
- Pagination 10K+ (identique — un utilisateur peut avoir beaucoup de transactions)
- Smart Calendar (getLastCompletedWeek) → filtre semaine courante
- Enrichment pattern (join transaction → catégorie + sous-catégorie)
- Multi-devise conservée
- Expand/collapse par transaction
- Empty state avec redirection vers Phase 2

### Adaptation clé : suppression du concept "durée"
En HCM, chaque coût a une durée (heures d'absence, heures perdues). En PFM, une transaction n'a pas de durée — elle a un **moyen de paiement**. La colonne "Durée" est remplacée par "Moyen de Paiement" (CB, Espèces, Virement, Prélèvement automatique). Le moyen de paiement est analytiquement significatif : CB = traçable, espèces = risque de sous-déclaration, prélèvement = automatisé.

### Impact rétroactif sur Section 31 (DataAlignmentPage)
La table des 5 colonnes EPR de la Section 31 doit être relue comme 4 colonnes de types + 1 colonne TOTAL (au lieu de 5 types distincts). Le mapping 5 KPIs → 5 types est remplacé par 4 KPIs → 4 types + EKH → calculé.

---

## Section 33 — Module 3, Phase 3 : Récapitulatif des Performances Réalisées (PerformanceRecapPage)

**Fichier source HCM :** `src/modules/module3/PerformanceRecapPage.tsx` (6 518 lignes)
**Route :** `/modules/module3/performance-recap`
**Source Excel :** Feuille L1 du fichier a1RiskoM3-S1M1.xls
**Rôle :** MOTEUR DE CALCUL CENTRAL — calcule les performances réalisées par salarié par indicateur

### Objectif HCM
Pour chaque salarié et chaque KPI, calculer :
- Les pertes constatées (combien l'entreprise a perdu)
- Les PPR prévues (combien on espérait récupérer)
- Les économies réalisées (PPR - pertes = gains effectifs)
- La distribution des gains (67% trésorerie / 33% primes salariés)

### Architecture HCM (6 518 lignes)

**3 Niveaux d'analyse :**
- **N1** (données brutes) : 13 colonnes — temps collecté, score financier, pertes, PPR, économies
- **N2** (données prises en compte) : 16 colonnes — ajoute code PRC, temps pris en compte, ajustements
- **TOTAL** (N1 + N2 combinés) : calculs internes uniquement

**5 Onglets KPI :** ABS, QD, OA, DDP, EKH — chacun avec sa propre table N1/N2

**Chaîne de calcul par salarié (formules Excel répliquées) :**
```
1. Temps Collecté = Σ(duration_hours + minutes) des cost_entries
2. Temps-Calcul = tempsCollecté + 0 (force conversion numérique)
3. Score Financier = ((recettes-dépenses)/volumeHoraire) × tempsCalcul × 1000
4. Pertes Constatées (brut) = SI((score+frais)=0, 0, SI(>0, (score+frais)-PPR))
5. Pertes Constatées = Pertes brut × (1 - tauxIncapacité/100)
6. PPR PRÉVUES = gainsN1/4 × indicatorRate × budgetRate / staffCount (par semaine)
7. ÉCONOMIES RÉALISÉES = PPR - Pertes (logique conditionnelle complexe)
8. Pertes en % = Pertes / Référence totale × 100
```

**Cas spéciaux :**
- DDP : gains = temps récupéré × marge, pertes = temps perdu × marge
- EKH : toutes les formules × coefficientCompétence (F1+F2+F3)/63

**Composants spécialisés :**
- `VirtualizedEKHTable` : table virtualisée (@tanstack/react-virtual) pour EKH
- `VirtualizedSynthesisTable` : synthèse éligibilité + distribution bonus
- `PeriodStatusDashboard` : tableau de bord statut des périodes
- `FiscalCalendarWidget` : widget calendrier fiscal

**Distribution des gains :** 67% trésorerie entreprise / 33% primes salariés
**Éligibilité :** salarié éligible SI totalÉconomies > 0

**Optimisations :**
- Pagination 10K+ (PAGE_SIZE=500)
- Calcul async par chunks (CHUNK_SIZE=50) pour ≥200 salariés
- Cache de performance (PerformanceCacheService)
- Virtualisation des tables (VirtualizedEKHTable, VirtualizedSynthesisTable)

**Navigation :** ← Récapitulatif des Coûts | Tableau de bord →

### Version PFM : "Bilan des Performances Budgétaires" (CORRIGÉE après audit financier)

**Titre PFM :** "Bilan de vos Performances Budgétaires de la Semaine"

**⚠️ 2 ERREURS CORRIGÉES :**
1. ~~Chaîne 8 étapes avec "Score Financier"~~ → **Chaîne 6 étapes** (comparaison directe €/€, pas de conversion temps→argent)
2. ~~Distribution 70/20/10 fixe~~ → **Waterfall configurable** par priorités (standard CFPB/Dave Ramsey)

**Transposition conceptuelle centrale :**

| Concept HCM | Concept PFM |
|-------------|-------------|
| Pertes Constatées (coûts subis) | **Dépassements Constatés** (dépenses au-dessus du budget) |
| PPR Prévues (récupérable) | **EPR Prévues** (économies prévues par le budget) |
| Économies Réalisées (PPR - Pertes) | **Économies Réalisées** (EPR - Dépassements) |
| ~~Score Financier (conversion temps→argent)~~ | **SUPPRIMÉ** — les transactions PFM sont déjà en € |
| Taux d'Incapacité | **Taux d'Incompressibilité** (part non réductible) |
| Coefficient Compétence | **Score Flexibilité** (capacité d'optimisation) |

**3 Niveaux d'analyse PFM :**
- **N1** (analyse brute) : toutes les transactions, totaux directs
- **N2** (analyse ajustée) : transactions filtrées par optimisabilité (PRC = flexibilité > 0)
- **TOTAL** : N1 + N2 combinés

**Code PRC en PFM :** En HCM, PRC = "Pris en Compte" (salarié a des données). En PFM, PRC = **"Poste Réductible Confirmé"** — la sous-catégorie a un score de flexibilité > 0, donc elle EST optimisable. Les postes avec flexibilité = 0 (incompressibles purs) ne sont PAS pris en compte en N2.

**4 Onglets par type de transaction + 1 calculé :**
| Onglet HCM | Onglet PFM |
|------------|------------|
| ABS (Absentéisme) | **Dépenses Fixes** |
| QD (Qualité) | **Dépenses Variables** |
| OA (Accidents) | **Dépenses Imprévues** |
| DDP (Productivité) | **Versements Épargne/Dette** |
| EKH (Know-How) | **Score Compétence Financière** (onglet spécial, calculé) |

> EKH conservé comme 5ème onglet CALCULÉ (pas saisi). Formule : Économies type × Score Flexibilité. Identique au pattern HCM.

**Chaîne de calcul PFM CORRIGÉE (6 étapes, pas 8) :**
```
POURQUOI 6 et pas 8 :
En HCM, les étapes 2-3 (Temps-Calcul + Score Financier) convertissent des HEURES en EUROS.
En PFM, les transactions sont DÉJÀ en euros → ces étapes sont inutiles.

1. Montant Réel = Σ(montant) des transactions de la semaine par type
2. Budget Prévu = objectif hebdomadaire par catégorie (depuis Module 1)
3. Écart = Montant Réel - Budget Prévu
4. Si Écart > 0 → DÉPASSEMENT CONSTATÉ (dépensé plus que prévu)
   Si Écart ≤ 0 → ÉCONOMIE RÉALISÉE (dépensé moins que prévu)
5. Dépassement Ajusté = Dépassement × (1 - tauxIncompressibilité/100)
   → Les postes incompressibles réduisent le dépassement imputable
6. Taux de Dépassement = Dépassement / Budget × 100
```

**Formules HCM CONSERVÉES telles quelles :**
- `(F1 + F2 + F3) / 63` = Score Flexibilité
- Structure N1/N2/Total avec code PRC
- EKH calculé = Économies × Score Flexibilité
- Logiques conditionnelles SI/ET pour les économies

**Formules HCM SUPPRIMÉES (inutiles en PFM) :**
- `Temps-Calcul = tempsCollecté + 0` (conversion type → inutile, déjà en €)
- `Score Financier = marge × temps × 1000` (conversion heures→euros → inutile)
- `DDP gains = temps récupéré × marge` (pas de concept "temps récupéré" en PFM)

**Distribution des économies PFM — WATERFALL CONFIGURABLE :**
Au lieu d'un split fixe (67/33 en HCM ou 70/20/10 incorrect), système en **cascade par priorités** :

```
Priorité 1 : FONDS D'URGENCE → remplir jusqu'à 3 mois de dépenses (objectif CFPB)
Priorité 2 : REMBOURSEMENT DETTE → tant que dette > 0 (méthode avalanche : taux le plus haut d'abord)
Priorité 3 : INVESTISSEMENT → épargne retraite, placements long terme
Priorité 4 : BUDGET PLAISIR → discrétionnaire, récompense personnelle
```

**Chaque niveau se remplit AVANT de passer au suivant.**
**Les priorités et seuils sont CONFIGURABLES par l'utilisateur** (car chaque situation est unique).
Exemples :
- Marie sans dette : P1 (urgence 60%) → P3 (investissement 30%) → P4 (plaisir 10%)
- Jean avec 3 crédits : P1 (urgence 20%) → P2 (dette 70%) → P4 (plaisir 10%)
→ Références : CFPB "Building Emergency Savings", Dave Ramsey "Baby Steps", NerdWallet "50/30/20 then waterfall"

**Éligibilité PFM :** les économies sont distribuées uniquement SI totalÉconomies > 0 (semaine excédentaire). Si totalÉconomies ≤ 0 → alerte dépassement, pas de distribution.

**Composants conservés (renommés) :**
- `VirtualizedEKHTable` → `VirtualizedCompetenceTable` (Score Compétence Financière)
- `VirtualizedSynthesisTable` → `VirtualizedSavingsSynthesis` (synthèse distribution épargne)
- `PeriodStatusDashboard` → conservé identique (statut semaines)
- `FiscalCalendarWidget` → conservé identique
- Pagination 10K+, calcul async, cache → tout conservé

### Mécanismes conservés
- Moteur de calcul 100% côté client TypeScript
- 3 niveaux N1/N2/Total
- Calcul async par chunks pour ≥200 transactions
- Virtualisation des tables
- Smart Calendar (getLastCompletedWeek)
- Debug logger pour audit trail
- Cache de performance

---

## Section 34 — CostSavingsReportingPage.tsx (1,944 lignes)

**Fichier** : `src/modules/module3/pages/CostSavingsReportingPage.tsx`
**Rôle HCM** : Dashboard de reporting final — visualisation des économies réalisées, distribution Prime/Trésorerie, allocation SCR par risque. Données en lecture seule depuis le moteur de calcul (PerformanceRecapPage via PerformanceDataContext).

### Architecture HCM : 5 BLOCS + 6 Graphiques

**Source de données** : Dual — `usePerformanceData()` context (priorité) ou calcul local fallback.

| Bloc | Titre HCM | Contenu |
|------|-----------|---------|
| 1 | Économies de Coûts Réalisées | 5 indicateurs (ABS/QD/OA/DDP/EKH) × Objectif vs Économies + BarChart |
| 2 | Économies par Lignes d'Activités | N business lines × Objectif vs Économies + BarChart |
| 3-1 | Primes des Salariés (33%) | 5 indicateurs × Prévisionnel/Réalisé Prime + BarChart |
| 3-2 | Trésorerie (67%) | 5 indicateurs × Prévisionnel/Réalisé Tréso + BarChart |
| 4-1 | Primes par Ligne d'Activité | N BL × Prévisionnel/Réalisé Prime + BarChart |
| 4-2 | Trésorerie par Ligne d'Activité | N BL × Prévisionnel/Réalisé Tréso + BarChart |
| 5 | SCR par Risque | 6 catégories risque × (%, Prévisionnel, Réalisé) + BarChart |

**Mécanismes transversaux HCM** :
- Smart Calendar : `getLastCompletedWeek()` pour période courante
- Period Validation : `PeriodResultsService.validateAndSavePeriod()` — verrouillage définitif
- Multi-devise : EUR par défaut, configurable
- Dark/light mode complet (Tailwind `dark:`)
- Print-ready pour auditeurs financiers
- Navigation → Centre de Performance (`/modules/module3/performance-center`)

**Formules clés HCM** :
- Bloc 1 : `objectif = PPR Prévues`, `économies = totalEconomies` (depuis contexte)
- Bloc 3 : `prevPrime = économies × 33%`, `prevTreso = économies × 67%`
- Bloc 5 SCR : `poids(i) = socioQual(i) / Σ(socioQual)`, `allocation(i) = totalTréso × poids(i)`
- SCR weights : `w205=s1/Σ`, `w206=s2/Σ`, `w207=(s3+s5)/Σ`, `w208=s4/Σ`, `w209=w207`, `w210=s6/Σ`

### Version PFM CORRIGÉE (2 erreurs détectées et corrigées)

**Titre PFM** : "Reporting des Économies Budgétaires"

#### BLOC 1 PFM — Économies par Type de Transaction ✅

| Col HCM | Col PFM |
|---------|---------|
| Domaines-Clés | Postes Budgétaires (description COICOP) |
| Indicateur (ABS/QD/OA/DDP/EKH) | Type (Fixes/Variables/Imprévues/Épargne-Dette + Score Compétence) |
| Objectif (PPR Prévues) | Objectif (EPR Prévues — budget hebdo Module 1) |
| Économies Réalisées | Économies Réalisées (EPR - Dépassements) |

- 4 types de transaction + EKH calculé = **5 lignes** (cohérent Sections 32-33)
- BarChart conservé : Objectif vs Économies, 5 barres colorées
- Ligne TOTAL conservée

#### BLOC 2 PFM — Économies par Catégorie COICOP ✅

| HCM | PFM |
|-----|-----|
| N Lignes d'activité (variable) | 8 Catégories COICOP ONU (fixe) |

Les 8 catégories COICOP (Section 29) :
1. Alimentation & Boissons
2. Logement & Énergie
3. Transport
4. Santé
5. Loisirs & Culture
6. Éducation
7. Restauration & Hôtellerie
8. Biens & Services Divers

Tableau : 8 catégories × (Objectif, Économies Réalisées) + Ligne TOTAL
BarChart conservé : 8 barres colorées, Objectif vs Économies

#### ⚠️ BLOC 3 PFM — Répartition des Économies en Cascade (CORRIGÉ — Erreur 1)

**Erreur détectée** : En HCM, le split 67/33 est un ratio CONSTANT appliqué uniformément → décomposable par indicateur (proportionnel). En PFM, le waterfall est SÉQUENTIEL avec des seuils → **pas décomposable** par type de transaction. 4 waterfalls séparés ≠ 1 waterfall sur le total (seuils globaux = non-linéaire).

~~Proposition initiale : "4 types × 3 colonnes par destination" avec 4 graphiques~~ → **FAUX**

**Version corrigée** :

Bloc 3 PFM = **UN SEUL waterfall flow sur le TOTAL des économies**

```
ENTRÉE : Total Économies de la semaine (Σ tous types, Σ toutes catégories)

SI Total Économies ≤ 0 → PAS DE DISTRIBUTION (alerte dépassement)
SI Total Économies > 0 → WATERFALL SÉQUENTIEL :

  ┌─────────────────────────────────────────────┐
  │ P1 — FONDS D'URGENCE                        │
  │ Seuil : objectif_urgence - solde_urgence     │
  │ Remplir jusqu'à X mois (défaut: 3, CFPB)    │
  │ → montant_P1 = MIN(économies_restantes, gap) │
  ├─────────────────────────────────────────────┤
  │ P2 — REMBOURSEMENT DETTE                     │
  │ Seuil : dette_totale restante                │
  │ Méthode avalanche (taux le plus haut d'abord)│
  │ → montant_P2 = MIN(économies_restantes, dette)│
  ├─────────────────────────────────────────────┤
  │ P3 — INVESTISSEMENT                          │
  │ % configurable du restant (défaut: 80%)      │
  │ Épargne retraite, placements long terme      │
  │ → montant_P3 = économies_restantes × %invest │
  ├─────────────────────────────────────────────┤
  │ P4 — BUDGET PLAISIR                          │
  │ Le surplus final                             │
  │ → montant_P4 = économies_restantes           │
  └─────────────────────────────────────────────┘
```

**Tableau PFM Bloc 3** : 4 lignes (destinations) × 3 colonnes
| Destination | Prévisionnel (si 100% objectif) | Réalisé (allocation effective) |
|-------------|-------------------------------|-------------------------------|
| P1 — Fonds d'Urgence | waterfall(EPR_total) → P1 | waterfall(Éco_réelles) → P1 |
| P2 — Remboursement Dette | waterfall(EPR_total) → P2 | waterfall(Éco_réelles) → P2 |
| P3 — Investissement | waterfall(EPR_total) → P3 | waterfall(Éco_réelles) → P3 |
| P4 — Budget Plaisir | waterfall(EPR_total) → P4 | waterfall(Éco_réelles) → P4 |
| **TOTAL** | **= Total EPR** | **= Total Économies** |

**Visualisation** : Waterfall Chart (cascade) au lieu de BarChart groupé — montre le flux séquentiel P1→P2→P3→P4. Recharts supporte `<BarChart>` avec barres empilées pour simuler un waterfall.

> Pas de sous-blocs 3-1/3-2. Un seul bloc unifié avec 4 destinations.

#### ⚠️ BLOC 4 PFM — Analyse de Contribution par COICOP (CORRIGÉ — Erreur 1 suite)

**Erreur détectée** : En HCM, Bloc 4 = distribution (Prime/Tréso) par BL → possible car ratio constant. En PFM, le waterfall est global → pas de distribution par COICOP. On ne peut pas dire "les économies Alimentation vont à P1, les économies Transport vont à P3" — elles vont toutes dans le MÊME waterfall.

~~Proposition initiale : "8 COICOP × (→P1, →P2, →P3, →P4)" avec BarChart stacked~~ → **FAUX**

**Version corrigée** :

Bloc 4 PFM change de nature : de DISTRIBUTION → **ANALYSE DE CONTRIBUTION**

Il répond à la question : "Quelle catégorie COICOP a le plus contribué aux économies ?"

**Tableau PFM Bloc 4** : 8 catégories COICOP × 4 colonnes
| Catégorie COICOP | Budget Prévu | Dépensé Réel | Économie Générée | % Contribution |
|------------------|-------------|-------------|-----------------|----------------|

**Graphique** : BarChart horizontal trié par contribution décroissante — permet de voir immédiatement quel poste budgétaire génère le plus d'économies (ou le plus de dépassements).

> C'est une vue ANALYTIQUE (entrée du waterfall), pas distributive (sortie du waterfall).
> Complémentaire au Bloc 2 : Bloc 2 = Objectif vs Réalisé, Bloc 4 = contribution relative + classement.

#### ⚠️ BLOC 5 PFM — Budget de Risque Personnel (CORRIGÉ — Erreur 2)

**Erreur détectée** : Le risk budgeting était appliqué à "total_économies" mais les économies traversent le waterfall et arrivent dans 4 destinations. Seul P3 (Investissement) est un pool ALLOCATABLE où la diversification par risque a un sens.

~~Proposition initiale : "allocation = total_économies × weight%" sur tout~~ → **FAUX**

**Version corrigée** :

Risk Budget appliqué **exclusivement à P3 (Investissement)** :
- P1 (Urgence) = objectif fixe → pas d'allocation à diversifier
- P2 (Dette) = remboursement → pas de choix d'allocation
- P3 (Investissement) = seul pool où la répartition par risque guide la diversification
- P4 (Plaisir) = consommation → pas de gestion de risque

**6 catégories de risque personnel** (transposition SCR) :

| # | HCM (SCR Assurantiel) | PFM (Risque Personnel) | Source questionnaire |
|---|----------------------|----------------------|---------------------|
| 1 | Risque Opérationnel | Risque de Perte de Revenu | Stabilité emploi |
| 2 | Risque de Contrepartie | Risque de Défaut | Créances, prêts |
| 3 | Risque de Marché | Risque d'Inflation | Pouvoir d'achat |
| 4 | Risque Transformation | Risque de Transition de Vie | Événements majeurs |
| 5 | Risque Organisation | Risque Structurel | Logement/transport |
| 6 | Risque Santé | Risque de Santé | Dépenses médicales |

**Formule CONSERVÉE** (identique HCM, pool changé) :
```
poids(i) = réponse_questionnaire(i) / Σ(toutes_réponses) × 100
allocation_risque(i) = montant_P3 × poids(i) / 100
```

**Tableau PFM Bloc 5** : 6 risques × 4 colonnes
| Risque Personnel | % | Prévisionnel (P3_prévu × %) | Réalisé (P3_réel × %) |
|-----------------|---|---------------------------|----------------------|

Graphique BarChart conservé : 6 barres, Prévisionnel vs Réalisé.

> Référence : Risk Budgeting (Evensky "Wealth Management"), Modern Portfolio Theory (Markowitz), CFPB "Investor Risk Tolerance Assessment"
> Source des poids : Module 1 Section D → questionnaire "Profil de Risque Personnel"

### Mécanismes conservés (identiques HCM)

| Mécanisme | Statut |
|-----------|--------|
| Smart Calendar (`getLastCompletedWeek`) | Conservé identique |
| Period Validation (`PeriodResultsService`) | Conservé — utilisateur valide sa propre semaine |
| Dual Data Source (contexte + fallback) | Conservé identique |
| Multi-devise (EUR défaut) | Conservé identique |
| Dark/light mode (Tailwind `dark:`) | Conservé identique |
| Print-ready design | Conservé — export personnel |
| Navigation → Centre de Performance | Conservé identique |

### Résumé des transformations par bloc

| Bloc | Transformation | Niveau |
|------|---------------|--------|
| 1 | 5 KPI → 4 Types + EKH calculé | Renommage |
| 2 | N BL → 8 COICOP fixe | Remplacement structurel |
| 3 | Split fixe 67/33 → Waterfall unique séquentiel | **Refonte architecturale** |
| 4 | Distribution/BL → Analyse de Contribution/COICOP | **Changement de nature** |
| 5 | SCR sur tréso → Risk Budget sur P3 uniquement | **Correction de périmètre** |

---

## Section 35 — PerformanceCenterPage.tsx + performanceCenter.ts (2,061 lignes)

**Fichiers** :
- `src/modules/module3/pages/PerformanceCenterPage.tsx` (1,127 lignes)
- `src/modules/module3/types/performanceCenter.ts` (934 lignes)

**Rôle HCM** : Centre de la Performance — affiche la Note /10 et le Grade (A+ à E) de chaque salarié, groupé par Ligne d'Activité. Permet de générer un Bulletin de Performance individuel.

### Architecture HCM

**Hiérarchie** : Entreprise → N Lignes d'Activité → M Salariés par ligne

**Types principaux** :
- `EmployeePerformance` : id, name, role, businessLineId, teamLeader, globalNote, grade, linePerformance, employeePerformance, indicators (5 KPIs)
- `BusinessLineWithEmployees` : business line avec tableau d'employés et totaux agrégés
- `IndicatorPerformanceDetail` : par KPI — objectif, économies, prevPrime, prevTreso, realPrime, realTreso

**Formules** :
- `calculateGlobalNote(eco, obj)` = `(économies / objectif) × 10`, plafonné à 10, arrondi au dixième
- `calculateGrade(note)` : A+ (9-10), A (8), B+ (7), B (6), C+ (5), C (4), D+ (3), D (2), E+ (1), E (0)
- `PRIME_RATIO = 0.33`, `TRESO_RATIO = 0.67` — constantes hardcodées de distribution
- `validatePrimeTresoRatio()` — vérifie conformité 33/67 avec tolérance 1%
- `capRealToPrevu()` = `Math.min(réalisé, prévu)` — principe comptable fondamental
- `sanitizeEmployeePerformances()` — nettoie localStorage pour conformité comptable

**Composants** :
- `VirtualizedEmployeeList` : @tanstack/react-virtual pour 10K+ employés
- Tableau 4 colonnes : Collaborateur | Note /10 | Grade | Bouton Bulletin
- Cards expandables par Business Line (toggle)
- `PerformanceBulletin` : rapport de performance individuel (composant séparé)

**Source de données (4 niveaux de priorité)** :
- P0 : localStorage `hcm_bulletin_performances` (transfert direct depuis PerformanceRecapPage)
- P1 : `module3_period_results` (période validée en DB)
- P2 : `PerformanceCacheService` (cache calculé)
- P3 : Fallback `module3_cost_entries` (calcul simplifié)

### Version PFM CORRIGÉE (2 erreurs détectées et corrigées)

**Titre PFM** : "Centre de Performance Budgétaire"

#### ⚠️ ERREUR 1 CORRIGÉE : PRIME_RATIO/TRESO_RATIO (33/67) → Waterfall

Les constantes `PRIME_RATIO = 0.33` et `TRESO_RATIO = 0.67` ainsi que toutes les fonctions qui en dépendent sont **incompatibles** avec le waterfall configurable validé (Sections 33-34).

**Éléments SUPPRIMÉS en PFM** :
- ~~`PRIME_RATIO = 0.33`~~ — pas de ratio fixe
- ~~`TRESO_RATIO = 0.67`~~ — pas de ratio fixe
- ~~`validatePrimeTresoRatio()`~~ — pas de ratio à valider
- ~~`calculateCappedPrimeTreso()`~~ — remplacé par waterfall
- ~~`prevPrime/realPrime/prevTreso/realTreso`~~ dans toutes les interfaces

**Éléments REMPLACÉS en PFM** :

| HCM | PFM |
|-----|-----|
| `PRIME_RATIO / TRESO_RATIO` | `WaterfallConfig { priorities: P1-P4, thresholds }` |
| `calculateCappedPrimeTreso(eco, ppr)` | `calculateWaterfallAllocation(totalEco, waterfallConfig)` |
| `prevPrime / realPrime` | `allocP1 / allocP2 / allocP3 / allocP4` (prévisionnel + réalisé) |
| `validatePrimeTresoRatio()` | `validateWaterfallTotals()` — vérifie que Σ(P1+P2+P3+P4) = total |

**Éléments CONSERVÉS en PFM** :
- `capRealToPrevu()` = `Math.min(réalisé, prévu)` — appliqué à CHAQUE destination P1-P4
- `sanitizeEmployeePerformances()` → renommé `sanitizeWeekPerformances()` — même logique de plafonnement

#### ⚠️ ERREUR 2 CORRIGÉE : Hiérarchie BL → Salariés → Temporelle (Mois → Semaines)

En PFM individuel, il n'y a **qu'un seul utilisateur**. Pas de salariés, pas de lignes d'activité, pas de team leaders. La performance se mesure **dans le temps**.

**Transformation hiérarchique** :

| HCM | PFM |
|-----|-----|
| `BusinessLineWithEmployees[]` | **`MonthWithWeeks[]`** |
| `EmployeePerformance` | **`WeekPerformance`** |
| N lignes d'activité (variable) | **12 mois** (fixe) |
| M salariés par ligne (variable) | **4-5 semaines par mois** |
| `VirtualizedEmployeeList` | **`VirtualizedWeekList`** |
| `PerformanceBulletin` (par salarié) | **`WeeklyBudgetReport`** (par semaine) |
| Note /10 par salarié | **Note /10 par semaine** |
| Grade A+-E par salarié | **Grade A+-E par semaine** |
| Avg note par BL | **Avg note par mois** |
| Team Leader | **N/A** (supprimé) |
| `toggleLine(lineId)` | **`toggleMonth(monthId)`** |

**Interfaces PFM** :

```
WeekPerformance {
  weekNumber: number           // S1 à S52
  periodLabel: string          // "S12 — 18/03 au 24/03"
  periodStart: Date
  periodEnd: Date
  globalNote: number           // (économies / objectif) × 10
  grade: string                // A+ à E
  previousGlobalNote?: number  // semaine précédente (tendance)
  totals: {
    objectif: number           // EPR prévues total
    economiesRealisees: number // EPR - Dépassements
    allocP1: number            // → Fonds d'urgence
    allocP2: number            // → Remboursement dette
    allocP3: number            // → Investissement
    allocP4: number            // → Budget plaisir
  }
  indicators: {
    depenseFixes: IndicatorDetail
    depenseVariables: IndicatorDetail
    depenseImprevues: IndicatorDetail
    versementsEpargneDette: IndicatorDetail
    scoreCompetence: IndicatorDetail  // calculé
  }
  isLocked: boolean            // semaine validée/verrouillée
}

MonthWithWeeks {
  monthKey: string             // "2026-01"
  label: string                // "Janvier 2026"
  weeks: WeekPerformance[]
  avgNote: number              // moyenne des notes du mois
  totalEconomies: number       // somme des économies du mois
}
```

**Formules CONSERVÉES** :
- `calculateGlobalNote(eco, obj)` = `(économies / objectif) × 10` — identique, universelle
- `calculateGrade(note)` — échelle A+ à E identique
- `capRealToPrevu()` — appliqué à chaque P1-P4
- Chaîne de priorité données P0→P1→P2→P3

### Description de l'interface PFM

**En-tête** : "Centre de Performance Budgétaire" + Badge semaine courante + période

**Structure visuelle** :

```
┌─────────────────────────────────────────────────────────┐
│ ← Retour    Centre de Performance Budgétaire            │
│              Performance budgétaire hebdomadaire         │
│                                          [S12 18/03-24/03] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ Janvier 2026 ──────────── Moy: 7.2/10 ── +245€ ──┐ │
│ │ ▼  (cliquer pour expand/collapse)                    │ │
│ │                                                      │ │
│ │  Semaine        │ Note    │ Grade │ Rapport          │ │
│ │  ─────────────────────────────────────────           │ │
│ │  S1 — 05/01-11/01 │ 8.5/10  │ [A]   │ [📄 Rapport]  │ │
│ │  S2 — 12/01-18/01 │ 7.0/10  │ [B+]  │ [📄 Rapport]  │ │
│ │  S3 — 19/01-25/01 │ 6.2/10  │ [B]   │ [📄 Rapport]  │ │
│ │  S4 — 26/01-01/02 │ 7.1/10  │ [B+]  │ [📄 Rapport]  │ │
│ │                                                      │ │
│ │  4 semaines • Virtualisé pour performances optimales │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ Février 2026 ──────────── Moy: 8.1/10 ── +312€ ──┐ │
│ │ ▶  (collapsed — cliquer pour ouvrir)                 │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ Mars 2026 ─────────────── Moy: 6.8/10 ── +189€ ──┐ │
│ │ ▶  (collapsed)                                       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                         │
│         [📊 Centre de Performance Globale →]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Card de mois (collapsed)** :
- Icône calendrier + "Février 2026"
- Note moyenne du mois : "Moy: 8.1/10"
- Total économies : "+312€"
- Chevron ▶ pour expand

**Card de mois (expanded)** :
- Tableau virtualisé des semaines du mois
- 4 colonnes : Semaine | Note /10 | Grade (badge coloré A+-E) | Bouton Rapport
- Indicateur de tendance ↑↓ par rapport à la semaine précédente
- Compteur : "4 semaines"

**Bouton "Rapport"** → ouvre le `WeeklyBudgetReport` (remplace PerformanceBulletin) :
- Détail de la semaine sélectionnée
- Performance par type de transaction (4 types + EKH)
- Allocation waterfall (P1→P2→P3→P4)
- Note et Grade avec explication
- Comparaison avec la semaine précédente

**Grades — Signification PFM** :
| Grade | Note | Label PFM |
|-------|------|-----------|
| A+ | 9-10 | Expert Budgétaire |
| A | 8 | Très bonne gestion |
| B+ | 7 | Bonne gestion |
| B | 6 | Gestion correcte |
| C+ | 5 | Passable |
| C | 4 | Insuffisant |
| D+ | 3 | Médiocre |
| D | 2 | Très insuffisant |
| E+ | 1 | Critique |
| E | 0 | Aucune discipline |

**Navigation** : → Centre de Performance Globale (`/modules/module3/global-performance-center`)

### Résumé des transformations

| Aspect | Transformation | Niveau |
|--------|---------------|--------|
| PRIME/TRESO ratios | 33/67 supprimés → waterfall P1-P4 | **Refonte logique** |
| Hiérarchie | BL → Salariés → Mois → Semaines | **Refonte structurelle** |
| Note /10 | Conservée identique | Aucun changement |
| Grades A+-E | Conservés + labels PFM | Cosmétique |
| capRealToPrevu | Conservé, appliqué à P1-P4 | Extension |
| VirtualizedList | Conservé, renommé WeekList | Renommage |
| PerformanceBulletin | → WeeklyBudgetReport | Renommage + contenu |
| Data priority P0-P3 | Conservé identique | Aucun changement |

---

---

## SECTION 36 — GlobalPerformanceCenterPage.tsx (1,465 lignes)
### « Centre de Performance Globale et par Indicateurs »

**Fichier analysé** : `src/modules/module3/pages/GlobalPerformanceCenterPage.tsx`
**Dépendance clé** : `performanceCenter.ts` (PRIME_RATIO, TRESO_RATIO, validatePrimeTresoRatio)
**Sous-composants** : 8 importés (ExecutiveSummaryGlobal, PerformanceChartsGlobal, StickyFooterGlobal, TopPerformersSection, AlertsSection, PrimesAnalysisSection, IndicatorRiskAnalysis, ChampionsSummaryTable) + 2 inline (EmployeeAnalysisSection, IndicatorEmployeeAnalysis)

### Architecture HCM

7 sections collapsibles + pagination 50 employés/section :
1. Executive Summary + Charts (2 sous-composants dashboard)
2. Top Performers (3 blocs verts — meilleurs employés)
3. Alertes (3 blocs orange/rouge — employés en difficulté)
4. Analyse Primes (2 blocs — distribution 33/67)
5. Analyse Risque par Indicateur (5 cartes)
6. Champions Summary (récapitulatif)
7. Section GLOBALE — table BL → Employés, 8 colonnes (Nom | Objectif | Économies | Prév.Prime | Prév.Tréso | Réal.Prime | Réal.Tréso | Contribution%)
8. 5 Sections INDICATEUR — tables BL → Employés, 10 colonnes (+ totalTemps + totalFrais + PPR), validatePrimeTresoRatio() par employé
9. Section TOTAL GÉNÉRAL — 5 indicateurs + GRAND TOTAL + validation conformité 33/67
10. Sticky Footer (totalEmployees, totalEconomies, tauxAtteinte)

### BLOC 1 — Executive Summary + Charts

| HCM | PFM |
|-----|-----|
| ExecutiveSummaryGlobal (KPIs enterprise) | **SummaryFinancierGlobal** (KPIs ménage) |
| PerformanceChartsGlobal (departments) | **ChartsPerformanceTemporel** (mois) |
| departmentsSummary avec contribution % | monthsSummary avec contribution % |
| totalEmployees en mini-KPI | totalWeeks (52) en mini-KPI |

Logique conservée : `tauxAtteinteGlobal = (économies / objectif) × 100` — ratio de variance universel.

### BLOC 2 — Top Performers + Alertes + Champions

| HCM | PFM |
|-----|-----|
| TopPerformersSection (top 3 employés) | **TopWeeksSection** (top 3 semaines) |
| AlertsSection (employés en difficulté) | **BudgetAlertsSection** (semaines en dépassement) |
| ChampionsSummaryTable (champions) | **BestWeeksSummaryTable** (meilleures semaines) |

Concept transférable directement : classement par performance, le sujet change (employé → semaine).

### BLOC 3 — Analyse Distribution + Risque

| HCM | PFM |
|-----|-----|
| PrimesAnalysisSection (analyse 33/67) | **WaterfallAnalysisSection** (analyse P1→P2→P3→P4) |
| IndicatorRiskAnalysis (5 cartes) | **TypeRiskAnalysis** (4 cartes par type) |

⚠️ **ERREUR CORRIGÉE (Primes → Waterfall)** : PrimesAnalysisSection entièrement remplacée par WaterfallAnalysisSection qui montre le flux séquentiel des économies P1→P2→P3→P4 avec seuils configurables. Visualisation cascade globale (pas de décomposition par type — cf. Section 34 ERREUR 1).

### BLOC 4 — Section Globale (table principale)

⚠️ **ERREUR CORRIGÉE (Mapping colonnes)** : Le mapping naïf Prév.Prime→P1, Prév.Tréso→P2, Réal.Prime→P3, Réal.Tréso→P4 est FAUX — il confond deux dimensions orthogonales (état prév/réal × destination waterfall).

**Colonnes PFM correctes (9 colonnes)** :

| Colonne | Rôle |
|---------|------|
| Semaine | Identifiant temporel (S1, S2...) |
| Budget Prévu | Le "prévisionnel" — ce qu'on planifie de dépenser |
| Dépenses Réelles | Le "réalisé" — ce qu'on a effectivement dépensé |
| Économies | = Budget − Dépenses (surplus disponible) |
| → P1 Urgence | Allocation waterfall séquentielle des économies réelles |
| → P2 Dette | Allocation waterfall séquentielle des économies réelles |
| → P3 Investissement | Allocation waterfall séquentielle des économies réelles |
| → P4 Plaisir | Allocation waterfall séquentielle des économies réelles |
| Contribution % | Part des économies dans le total mensuel |

Le prév/réal est capturé par Budget vs Dépenses (pas par les colonnes waterfall). Le waterfall (→P1...P4) montre l'allocation CUMULATIVE semaine après semaine (S3 hérite de l'état du waterfall après S1-S2). C'est le fonctionnement standard d'un cash waterfall en finance de projet.

⚠️ **ERREUR CORRIGÉE (Note /10 → Contribution %)** : La dernière colonne est Contribution % (part du total), PAS Note /10. Cette page montre la répartition (contribution), la Section 35 montre la performance individuelle (Note /10 + Grade). Les deux métriques sont complémentaires, pas substituables.

**Hiérarchie temporelle** :

| HCM | PFM |
|-----|-----|
| businessLinesData (N lignes d'activité) | **monthsData** (12 mois) |
| bl.employees (N employés) | **month.weeks** (4-5 semaines) |
| EmployeeAnalysisSection par BL | **WeekAnalysisSection par Mois** |
| EMPLOYEES_PER_SECTION = 50 | N/A (max 5 semaines/mois) |
| Badge "X salariés" | Badge "X semaines" |
| TOTAL LIGNE D'ACTIVITÉ | **TOTAL MOIS** |

### BLOC 5 — Sections par Type (5 HCM → 4+1 PFM)

| HCM | PFM |
|-----|-----|
| INDICATOR_CONFIGS (5) : abs, qd, oa, ddp, ekh | **TYPE_CONFIGS (4)** : fixe, variable, imprévu, épargne-dette |
| 5 sections colorées identiques | **4 sections transactionnelles + 1 section EKH différente** |
| totalTemps (heures) | ❌ SUPPRIMÉ (pas d'heures en PFM) |
| totalFrais (EUR par indicateur) | Remplacé par Budget Prévu par type |
| PPR PREVUES | **EPR Prévues** par type |
| validatePrimeTresoRatio() par employé | SUPPRIMÉ → validateBudgetAdherence() par semaine |
| AlertTriangle si ratio ≠ 33/67 | AlertTriangle si écart budget > seuil configurable |
| IndicatorEmployeeAnalysis | **TypeWeekAnalysis** |

**Table PFM par type (8 colonnes)** :
Semaine | Budget Prévu (type) | Dépenses Réelles (type) | EPR Prévues | Économies Réalisées | Écart | Taux d'Atteinte % | Contribution %

**Section EKH (format différent)** :
EKH = Score de Compétence Financière, CALCULÉ à partir du comportement sur les 4 types. PAS de table transactionnelle. Affiche :
- Score EKH global (/10) + Grade (A+ à E)
- Évolution temporelle (graphique semaine par semaine)
- Détail des 4 composantes du score (régularité, discipline, optimisation, tendance)

### BLOC 6 — Total Général

⚠️ **ERREUR CORRIGÉE (EKH ligne comptable → score séparé)** : EKH est un indicateur calculé, il ne génère PAS d'économies et ne traverse PAS le waterfall. L'inclure comme ligne avec EPR/Éco/→P1...P4 créerait un double comptage (Total 5 lignes ≠ Total réel).

**Table correcte — 4 lignes uniquement** :

| Ligne | EPR | Économies | Part % |
|-------|-----|-----------|--------|
| Dépenses Fixes | Σ type | Σ type | X% |
| Dépenses Variables | Σ type | Σ type | X% |
| Imprévues | Σ type | Σ type | X% |
| Versements Épargne-Dette | Σ type | Σ type | X% |
| **GRAND TOTAL** | **Σ** | **Σ** | **100%** |

Les colonnes waterfall (→P1, →P2, →P3, →P4) apparaissent UNIQUEMENT sur la ligne GRAND TOTAL car le waterfall est global et séquentiel (Section 34). Les lignes par type montrent EPR, Économies et Part% mais PAS de décomposition waterfall individuelle.

**Validation** : validatePrimeTresoRatio() → **validateWaterfallConformity()** vérifiant :
- Ordre séquentiel respecté (P1 rempli avant P2, etc.)
- Seuils configurables respectés
- Σ allocations = total économies

EKH affiché comme **badge/score séparé** dans le header du Total (score /10 + grade), JAMAIS comme ligne comptable.

### BLOC 7 — Sticky Footer

| HCM | PFM |
|-----|-----|
| StickyFooterGlobal | **StickyFooterGlobal** (conservé) |
| totalEmployees | **totalWeeks** (52) |
| totalEconomies | totalEconomies (conservé) |
| tauxAtteinte | tauxAtteinte (conservé) |

### Éléments conservés (validés)

1. **tauxAtteinteGlobal = (éco/obj) × 100** — ratio de variance universel
2. **contribution = (éco_part / éco_total) × 100** — ratio de contribution universel
3. **Mini-KPIs headers collapsibles** — format K/M, code couleur vert/amber/rouge
4. **Sections collapsibles** — 'global' ouvert par défaut, framer-motion animations
5. **CalendarEventBus** — DATA_ENTERED, CONFIG_UPDATED, PERIOD_LOCKED
6. **capRealToPrevu()** — Math.min(réalisé, prévu), principe comptable universel
7. **INDICATOR_STYLES → TYPE_STYLES** — pattern anti-purge Tailwind (classes statiques)
8. **Code couleur WCAG AA** — seuils ≥80% vert, ≥50% amber, <50% rouge
9. **Pagination + collapsible sections** — architecture UI conservée

### Erreurs détectées et corrigées dans cette section

| # | Erreur | Gravité | Correction |
|---|--------|---------|------------|
| 1 | PrimesAnalysisSection + PRIME_RATIO/TRESO_RATIO (3 niveaux validation) | CRITIQUE | → WaterfallAnalysisSection + validateWaterfallConformity() |
| 2 | Hiérarchie BL → Employés (3 endroits dans le code) | CRITIQUE | → Mois → Semaines (hiérarchie temporelle) |
| 3 | Mapping colonnes Prév/Réal confondu avec P1/P2/P3/P4 | CRITIQUE | Budget/Dépenses = prév/réal, waterfall = allocation des économies |
| 4 | Note /10 à la place de Contribution % | MOYENNE | Contribution % conservée (Note /10 = Section 35 uniquement) |
| 5 | EKH comme ligne comptable dans Total Général → double comptage | CRITIQUE | Total = 4 types seulement, EKH = score séparé |

### Résumé des transformations

| Aspect | Transformation | Niveau |
|--------|---------------|--------|
| PrimesAnalysisSection | → WaterfallAnalysisSection | **Refonte complète** |
| PRIME_RATIO/TRESO_RATIO + validation 3 niveaux | → validateWaterfallConformity() | **Refonte logique** |
| BL → Employés (businessLinesData) | → Mois → Semaines (monthsData) | **Refonte structurelle** |
| 5 indicateurs socio-économiques | → 4 types transactionnels + EKH calculé | **Refonte dimensionnelle** |
| Colonnes Prév.Prime/Tréso + Réal.Prime/Tréso | → Budget/Dépenses + waterfall P1-P4 | **Refonte colonnes** |
| totalTemps (heures) | SUPPRIMÉ | Suppression |
| Total Général 5 lignes + EKH | → 4 lignes types + EKH badge séparé | **Correction comptable** |
| Note /10 en dernière colonne | → Contribution % (cohérence avec la page) | **Correction métrique** |
| tauxAtteinte, contribution, capRealToPrevu | Conservés identiques | Aucun changement |
| CalendarEventBus, WCAG AA, framer-motion | Conservés identiques | Aucun changement |

---

---

## SECTION 37 — PerformanceCalendarPage.tsx (3,613 lignes)
### « Calendrier de Suivi des Performances »

**Fichier analysé** : `src/modules/module3/pages/PerformanceCalendarPage.tsx`
**Plus grande page du module** — et la plus directement transférable (~80%)
**10 composants** : FilterWidget, YearView, MonthView, WeekCell, WeekDetailPanel, MonthDetailPanel, YearDetailPanel, RatioValidationBadge, ProgressBar, Main Component

### Architecture HCM

Navigation drill-down 3 niveaux avec framer-motion :
- **Années** : YearView — 3 cartes N+1, N+2, N+3 (objectif/réalisé/écart/barre)
- **Mois** : MonthView — 12 cartes mois fiscaux (Déc→Nov), agrégation semaines
- **Semaines** : WeekCell × 52 — grille par mois, dates + obj/réal + barre + lock

Sources de données : usePerformanceData(), useGlobalPerformanceData(), module3_cost_entries (Supabase), launchDateService, CalendarEventBus (DATA_ENTERED, PERIOD_LOCKED)

### BLOC 1 — Structure temporelle (conservée quasi intégralement)

| HCM | PFM | Statut |
|-----|-----|--------|
| 3 niveaux : Années → Mois → Semaines | Identique | ✅ Conservé |
| 52 semaines/an, 4-5 semaines/mois | Identique (méthode Kakeibo) | ✅ Conservé |
| Année fiscale Déc→Nov (FISCAL_MONTHS) | Année civile Jan→Déc (configurable) | Adaptation |
| launchDate (Widget Smart Calendar) | startDate (date début suivi budgétaire) | Renommage |
| N+1, N+2, N+3 | Année 1, Année 2, Année 3 | Renommage |

### BLOC 2 — WeekData (structure de données semaine)

| HCM | PFM | Statut |
|-----|-----|--------|
| target (PPR objectif hebdo) | **budgetPrevu** (budget hebdo) | Renommage |
| actual (économies réalisées) | **economies** (budget − dépenses) | Renommage |
| variance = actual − target | **ecart** = economies − objectif | ✅ Conservé |
| isLocked / isCurrentWeek | Identique | ✅ Conservé |
| status: success/warning/critical/planned | Identique | ✅ Conservé |
| indicators: { abs, qd, oa, ddp, ekh } | **typeBreakdown**: { fixe, variable, imprevu, epargne_dette } | Dimension QUOI |
| byBusinessLine: [...] | **byCOICOP**: [...] (8 catégories de dépenses) | Dimension OÙ |
| hasRealData | Identique | ✅ Conservé |

⚠️ **ERREUR CORRIGÉE (Mapping dimensions)** : Le mapping initial `byBusinessLine → byTransactionType` était FAUX car redondant avec `typeBreakdown`. Les deux dimensions PFM sont orthogonales :
- Dimension QUOI : `indicators` (5 HCM) → `typeBreakdown` (4 types de transaction)
- Dimension OÙ : `byBusinessLine` (N départements) → `byCOICOP` (8 catégories COICOP ONU)

### BLOC 3 — WeekCell (cellule interactive — transfert quasi direct)

Tous les éléments conservés : dates début→fin, badge % atteinte, lock/unlock, objectif vs réalisé compact, barre de progression, badge "En cours" (semaine courante), code couleur ≥95%/≥85%/<85%, WCAG aria-label + aria-pressed.

### BLOC 4 — Panels de détail (3 slide-in)

**WeekDetailPanel** :

| HCM | PFM |
|-----|-----|
| Rapport Hebdomadaire | Rapport Budgétaire Hebdomadaire |
| Statut + Bloquer/Débloquer | ✅ Conservé |
| Objectif Cible vs Réalisé | Budget Prévu vs Dépenses Réelles |
| Taux de réalisation | ✅ Conservé |
| Analyse graphique (2 barres) | ✅ Conservé |
| Ventilation par Indicateur (5) | **Ventilation par Type de Transaction** (4) |
| Ventilation par Ligne d'Activité | **Ventilation par Catégorie COICOP** (8) |
| Télécharger Rapport PDF | ✅ Conservé |

**MonthDetailPanel** : Mêmes adaptations que WeekDetailPanel, agrégé au mois. Ventilation par Indicateur → par Type. Aucune ventilation BL.

**YearDetailPanel** :

| HCM | PFM |
|-----|-----|
| Tout comme Month/Week panels | Mêmes adaptations |
| RatioValidationBadge (33/67) | ⚠️ **WaterfallValidationBadge** (P1→P4 séquentiel) |
| Performance par Mois (grille 3×4) | ✅ Conservé |

⚠️ **ERREUR CORRIGÉE (RatioValidationBadge)** : Le badge valide le ratio Prime/Trésorerie à 33%/67% (ligne 2281). En PFM, les économies traversent le waterfall configurable P1→P2→P3→P4. Remplacé par WaterfallValidationBadge qui vérifie l'ordre séquentiel et les seuils configurés.

### BLOC 5 — FilterWidget

| HCM | PFM |
|-----|-----|
| Sélecteur année N+1/N+2/N+3 | ✅ Conservé |
| Toggle vue (Années/Mois/Semaines) | ✅ Conservé |
| selectedBusinessLine (dimension OÙ) | **selectedCOICOP** (8 catégories COICOP) |
| selectedIndicators (dimension QUOI) | **selectedTransactionTypes** (4 types) |
| selectedDomains (groupement) | **selectedNature** (Essentielle/Discrétionnaire) |

⚠️ **ERREUR CORRIGÉE (Filtres inversés)** : Le mapping initial croisait les dimensions :
- FAUX : BL → Type de Transaction / Indicateurs → COICOP
- CORRECT : BL → COICOP (dimension OÙ) / Indicateurs → Type de Transaction (dimension QUOI)

Les 3 dimensions PFM sont orthogonales :
- **QUOI** (métrique) : 4 types de transaction — remplace les 5 indicateurs HCM
- **OÙ** (catégorie) : 8 catégories COICOP — remplace les N lignes d'activité
- **COMMENT** (nature) : Essentielle / Discrétionnaire — remplace les domaines socio-économiques

### BLOC 6 — Données & Calculs

| HCM | PFM |
|-----|-----|
| pprSettings: { abs, qd, oa, ddp, ekh, total } | **budgetSettings**: { fixe, variable, imprevu, epargne_dette, total } |
| realSettings (5 indicateurs) | **depensesSettings** (4 types) |
| module3_cost_entries (Supabase) | **user_transactions** (Supabase) |
| getRealWeekData() : économie = target − cost | ✅ Conservé : économie = budget − dépenses |
| getRealWeekDataByPeriod() (matching dates) | ✅ Conservé |
| rate = (actual/target) × 100 | ✅ Conservé |
| equalShare = objHebdo / 5 | **equalShare = budgetHebdo / 4** |

⚠️ **ERREUR CORRIGÉE (EKH budgété)** : pprSettings incluait EKH comme 5ème dimension budgétée avec equalShare = objHebdo / 5, allouant 20% du budget à une dimension fictive. En PFM, EKH est un score calculé, jamais budgété. Corrigé : budgetSettings sans EKH, equalShare = budgetHebdo / 4.

### BLOC 7 — Système événementiel + UI (conservé intégralement)

Éléments conservés : CalendarEventBus (DATA_ENTERED, PERIOD_LOCKED), framer-motion (viewTransitionVariants), AnimatePresence mode="wait", légende couleur, Export + Imprimer, multi-devises (CURRENCY_CONFIG), responsive grid (1→4 colonnes), WCAG accessibilité.

### Erreurs détectées et corrigées dans cette section

| # | Erreur | Gravité | Correction |
|---|--------|---------|------------|
| 1 | RatioValidationBadge (33/67) dans YearDetailPanel | CRITIQUE | → WaterfallValidationBadge (P1→P4) |
| 2 | byBusinessLine dans WeekDetailPanel + données | CRITIQUE | → byCOICOP (8 catégories) — dimension OÙ |
| 3 | pprSettings inclut EKH comme dimension budgétée (÷5) | CRITIQUE | → budgetSettings sans EKH (÷4) |
| 4 | FilterWidget : dimensions BL↔Indicateurs croisées | MOYENNE | → BL→COICOP (OÙ), Indicateurs→Types (QUOI) |

### Résumé des transformations

| Aspect | Transformation | Niveau |
|--------|---------------|--------|
| RatioValidationBadge | → WaterfallValidationBadge | Refonte composant |
| byBusinessLine (données + UI) | → byCOICOP (8 catégories COICOP ONU) | Refonte dimension OÙ |
| pprSettings / realSettings (5 ind.) | → budgetSettings / depensesSettings (4 types) | Refonte dimension QUOI |
| FilterWidget (3 filtres) | → COICOP + Type + Nature (dimensions orthogonales) | Refonte filtres |
| EKH dans pprSettings (÷5) | SUPPRIMÉ — EKH = score calculé, pas budgété | Suppression |
| Hiérarchie Années→Mois→Semaines | Conservée intégralement | Aucun changement |
| WeekCell, ProgressBar, lock/unlock | Conservés intégralement | Aucun changement |
| CalendarEventBus, WCAG, devises | Conservés intégralement | Aucun changement |
| framer-motion, responsive, export | Conservés intégralement | Aucun changement |
| rate, variance, getRealWeekData | Conservés intégralement | Aucun changement |

---

**BILAN CUMULÉ DES ERREURS CORRIGÉES : 19**
Sections 31-32 : 4 erreurs | Section 33 : 2 erreurs | Section 34 : 2 erreurs | Section 35 : 2 erreurs | Section 36 : 5 erreurs | Section 37 : 4 erreurs

### ERREURS SYSTÉMIQUES RÉCURRENTES (résumé cross-sections)

| Erreur systémique | Sections impactées | Correction PFM |
|---|---|---|
| Prime/Trésorerie 33/67 → Waterfall | 35, 36, 37 | validateWaterfallConformity() / WaterfallValidationBadge |
| BL → Employees → Temporel/COICOP | 35, 36, 37 | Mois→Semaines (temporel) + byCOICOP (catégoriel) |
| EKH budgété/comptable → calculé | 36, 37 | EKH = score séparé, jamais dans pprSettings ni Total Général |
| 5 indicateurs HCM → 4 types PFM | 31, 35, 36, 37 | typeBreakdown + EPR par type (sans EKH) |

---

## SECTION 38 — DÉCISION STRATÉGIQUE : ARCHITECTURE PLATEFORME MOBILE-FIRST

### Décision validée par le Project Owner — 7 février 2026

### Contexte de la décision

Après l'analyse complète de 37 sections couvrant Module 1 (18 pages, Sections 1-24) et Module 3 (13 pages, Sections 25-37), le Project Owner a pris une **décision architecturale majeure** qui impacte l'ensemble de la stratégie technique du projet PFM.

### Énoncé de la décision

**La plateforme PFM (Personal Finance Management) sera développée en DEUX versions :**

| Version | Plateforme | Priorité | Phase |
|---------|-----------|----------|-------|
| **Application Mobile** | iOS (App Store) + Android (Google Play) | **PRIORITAIRE** | Phase 1 |
| **Application Desktop** | Web (navigateur) | Secondaire | Phase 2 |

### Justification stratégique

1. **Usage quotidien** : La gestion budgétaire personnelle (méthode Kakeibo, saisie hebdomadaire) nécessite un accès mobile permanent
2. **Saisie en temps réel** : L'utilisateur doit pouvoir saisir ses dépenses immédiatement (au moment de l'achat)
3. **Notifications** : Alertes budgétaires, rappels de saisie hebdomadaire, alertes waterfall — nécessitent push notifications natives
4. **Marché cible** : Le PFM individuel vise le grand public, majoritairement mobile-first
5. **Différenciation HCM → PFM** : Le HCM est un outil professionnel desktop ; le PFM est un compagnon financier quotidien mobile

### Impact sur l'analyse fonctionnelle

| Aspect | Impact | Détail |
|--------|--------|--------|
| **37 sections d'analyse** | ✅ AUCUN IMPACT | Toute la logique métier est indépendante de la plateforme |
| **19 erreurs corrigées** | ✅ VALIDÉES | Les corrections financières (waterfall, COICOP, EKH, 4 types) restent identiques |
| **4 erreurs systémiques** | ✅ VALIDÉES | Les corrections cross-sections s'appliquent identiquement |
| **Formules financières** | ✅ IDENTIQUES | (F1+F2+F3)/63×100, capRealToPrevu(), Note/10, Grades A+→E |
| **3 dimensions orthogonales** | ✅ IDENTIQUES | QUOI (4 types) × OÙ (8 COICOP) × COMMENT (2 natures) |

### Impact sur l'architecture technique

| Aspect | Stack HCM actuel (web) | Stack PFM Phase 1 (mobile) | Décision |
|--------|----------------------|---------------------------|----------|
| **Framework UI** | React 18 + TypeScript | À déterminer (React Native / Flutter / Swift+Kotlin natif) | **PRD Phase PM** |
| **Build** | Vite | Metro (RN) / Dart (Flutter) / Xcode+Gradle (natif) | **PRD Phase PM** |
| **Styling** | Tailwind CSS + shadcn/ui | StyleSheet (RN) / Material (Flutter) / SwiftUI+Compose (natif) | **PRD Phase PM** |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) | **Conservé identique** — Supabase est backend-agnostique | ✅ Pas d'impact |
| **État local** | React hooks + Context | À adapter selon framework mobile | **PRD Phase PM** |
| **Animations** | framer-motion | Animated API (RN) / Rive (Flutter) / Core Animation (natif) | **PRD Phase PM** |
| **Navigation** | React Router v6 | React Navigation (RN) / GoRouter (Flutter) / UIKit/Jetpack (natif) | **PRD Phase PM** |
| **Notifications** | Non implémenté (web) | **Push Notifications natives** (APNs + FCM) | **NOUVEAU** |
| **Stockage offline** | localStorage | SQLite / Realm / Hive | **NOUVEAU** |
| **Distribution** | URL web | App Store + Google Play | **NOUVEAU** |

### Capacités mobiles spécifiques à prévoir (nouvelles)

1. **Push Notifications** : Alertes budgétaires, rappels Kakeibo hebdomadaires, alertes waterfall
2. **Mode Offline** : Saisie de dépenses sans connexion, synchronisation différée
3. **Biométrie** : Face ID / Touch ID / Fingerprint pour sécuriser les données financières
4. **Widget iOS/Android** : Résumé budgétaire sur l'écran d'accueil
5. **Saisie rapide** : Interface optimisée pour saisir une dépense en < 10 secondes
6. **Appareil photo** : Scan de tickets/reçus (OCR) pour saisie automatique
7. **Haptic feedback** : Retour tactile sur les actions de validation/verrouillage

### Règle de conception Phase PM

> **Toute fonctionnalité décrite dans les Sections 1-37 doit être conçue MOBILE-FIRST.**
> La version desktop Phase 2 sera une adaptation responsive de l'expérience mobile, pas l'inverse.
> Le PRD doit spécifier les interactions tactiles (swipe, tap, long-press) avant les interactions souris/clavier.

### Choix du framework mobile — À trancher en Phase PM

| Option | Avantages | Inconvénients | Proximité HCM |
|--------|-----------|---------------|---------------|
| **React Native** | Réutilise TypeScript + logique React, écosystème HCM existant | Performances animations complexes, dépendance Meta | ★★★★★ |
| **Flutter** | Performances natives, UI pixel-perfect, Dart performant | Nouveau langage (Dart), pas de réutilisation React | ★★☆☆☆ |
| **Natif (Swift + Kotlin)** | Performances maximales, accès complet OS, meilleure UX native | Double codebase, coût ×2, pas de réutilisation | ★☆☆☆☆ |
| **Expo (React Native)** | Comme RN + déploiement simplifié OTA, EAS Build | Limitations modules natifs custom | ★★★★☆ |

**Recommandation préliminaire** : React Native (ou Expo) pour maximiser la réutilisation de la logique TypeScript existante dans les 37 sections analysées. Décision finale en Phase PM après benchmark.

---

**BILAN CUMULÉ : 37 SECTIONS ANALYSÉES + 1 DÉCISION STRATÉGIQUE**
- Module 1 : 18 pages → Sections 1-24
- Module 3 : 13 pages → Sections 25-37
- Section 38 : Décision Architecture Mobile-First
- **19 erreurs corrigées** | **4 erreurs systémiques documentées**
- **Décision majeure** : Mobile-First (iOS + Android) Phase 1, Desktop Phase 2

---

**Document mis à jour le 7 février 2026**
**Toutes les décisions ci-dessus ont été validées par le Project Owner**
