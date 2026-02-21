# LELE PFM — Contexte Complet pour Claude Code Terminal

## Date de dernière mise à jour : 9 février 2026

---

## 1. QU'EST-CE QUE CE PROJET ?

**LELE PFM** (Personal Finance Management) est une application mobile de gestion de finances personnelles.
Elle est dérivée du **LELE HCM Portal V3** (application web entreprise de gestion du capital humain).

L'idée : transposer la puissance analytique de HCM vers les particuliers — chaque individu gère son argent avec le même niveau de rigueur qu'une entreprise gère ses employés.

**Méthode utilisée :** BMAD v6.0.0-alpha.22 (multi-agent : Analyst → PM → Architect → Scrum Master → Developer)

---

## 2. ÉTAT ACTUEL — OÙ EN EST-ON ?

### Phases BMAD complétées :
1. ✅ **Phase Analyst (Mary)** — Product Brief terminé
2. ✅ **Phase PM (John)** — PRD complet (11 EPICs, 92 User Stories)
3. ✅ **Phase Architect (Winston)** — Architecture technique détaillée
4. ✅ **Phase Scrum Master (Bob)** — Sprint Planning (10 sprints, 21 semaines)
5. ✅ **Phase Developer (Amelia)** — Sprint 0 (Infrastructure & Setup) terminé

### Sprint 0 livré — Le code source existe dans `lele-pfm/`
### Sprint 1 à faire — Auth + Dashboard + Navigation (première version testable)

### Supabase
- **Compte existant** de l'utilisateur
- **Projet créé** : `ghkywsxyfrrdcxyrxnjj`
- **Project URL** : `https://ghkywsxyfrrdcxyrxnjj.supabase.co`
- **Anon Key** : ⚠️ PAS ENCORE RÉCUPÉRÉE — aller dans Settings → API sur le dashboard Supabase
- **Les migrations SQL** sont prêtes dans `lele-pfm/supabase/migrations/` mais PAS ENCORE exécutées

---

## 3. DOCUMENTS DE RÉFÉRENCE (dans `docs/`)

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `PFM_CONTEXTE_DECISIONS.md` | 3 087 | Toutes les décisions validées (38 sections). **DOCUMENT SOURCE DE VÉRITÉ N°1** |
| `LELE_PFM_PRD_COMPLET.md` | 2 825 | PRD détaillé — 11 EPICs, 92 User Stories, NFR, timeline |
| `LELE_PFM_ARCHITECTURE_TECHNIQUE.md` | 6 096 | Architecture — 8 ADR, 16 tables DDL, Engine 10 étapes, patterns, sécurité |
| `LELE_PFM_SPRINT_PLANNING.md` | 2 489 | Planning — 10 sprints, 21 semaines, 404 SP, milestones, risques |

**⚠️ TOUJOURS lire `PFM_CONTEXTE_DECISIONS.md` en premier — c'est la source de vérité pour TOUTES les règles métier.**

---

## 4. LES 10 RÈGLES MÉTIER CRITIQUES (NE JAMAIS VIOLER)

### Règle 1 — EKH n'est JAMAIS un type budgétaire
EKH (Score de Compétence Financière) est TOUJOURS calculé à partir du comportement, JAMAIS saisi manuellement ni budgété comme 5ème type.

### Règle 2 — 4 types de transactions UNIQUEMENT
1. **Dépense Fixe** (loyer, assurance)
2. **Dépense Variable** (courses, essence)
3. **Dépense Imprévue** (réparation auto)
4. **Versement Épargne-Dette** (épargne, remboursement crédit)
PAS de 5ème type. Jamais.

### Règle 3 — 8 catégories COICOP ONU (immuables)
```
01. Alimentation et boissons non alcoolisées
02. Transport
03. Logement, eau, électricité, gaz
04. Santé
05. Loisirs et culture
06. Éducation
07. Assurances
08. Autres dépenses
```
Codes UN-standard. On ne les modifie pas, on ne les supprime pas, on n'en ajoute pas.

### Règle 4 — Distribution Waterfall P1→P2→P3→P4 (PAS hardcodé 67/33)
```
P1 = Fonds d'Urgence
P2 = Remboursement Dette
P3 = Investissement
P4 = Plaisir
```
Les pourcentages sont CONFIGURABLES par l'utilisateur (défaut: P1=30%, P2=35%, P3=20%, P4=15%).
**INTERDIT** : constantes PRIME_RATIO, TRESO_RATIO, ou tout ratio hardcodé 67/33.

### Règle 5 — capRealToPrevu
```typescript
function capRealToPrevu(actual: number, planned: number): number {
  return Math.min(actual, planned);
}
```
Le réalisé ne dépasse JAMAIS le prévu. C'est un principe comptable fondamental.

### Règle 6 — Granularité hebdomadaire (Kakeibo)
52 semaines par an. Pas mensuel. Méthode Kakeibo japonaise (discipline budgétaire 100 ans).

### Règle 7 — Score /10 avec pondération
```
Score = (EKH/100×4) + (completion×3) + (budget_respect×2) + (variation_EPR×1)
```
Grades : A+ (9-10), A (8-8.9), B (7-7.9), C (6-6.9), D (5-5.9), E (0-4.9)

### Règle 8 — Formule flexibilité : (F1+F2+F3)/63 × 100
F1 = Fréquence (0-21), F2 = Modifiabilité (0-21), F3 = Substituabilité (0-21)
Maximum théorique = 63 → score 0-100%.

### Règle 9 — UL = Revenu × (Proba × Impact) × CoeffContextuel [0.5, 1.5]
Coefficient contextuel ajusté par : EKH, horizon, profil, situation familiale, dette.
Clamp entre 0.5 et 1.5.

### Règle 10 — 3 dimensions orthogonales
- **QUOI** : 4 types de transactions
- **OÙ** : 8 catégories COICOP
- **COMMENT** : Essentielle / Discrétionnaire
Ces 3 dimensions sont indépendantes et ne se mélangent jamais.

---

## 5. STACK TECHNIQUE

| Technologie | Version | Rôle |
|-------------|---------|------|
| React Native | 0.76+ | Framework mobile cross-platform |
| Expo SDK | 52+ | Build, OTA updates, modules natifs |
| TypeScript | 5.4+ | Typage strict |
| Expo Router | 4.0+ | Navigation (file-based routing) |
| Zustand | 5.x | State management |
| expo-sqlite | 14+ | Offline-first persistence locale |
| Supabase JS | 2.x | Backend API (PostgreSQL + Auth + RLS) |
| React Hook Form + Zod | 7.x / 3.x | Formulaires + validation runtime |
| Victory Native | 41+ | Charts/graphiques |
| React Native Reanimated | 3.x | Animations fluides |
| i18next | 23+ | Internationalisation (V1 = français) |
| Jest + Detox | latest | Tests unitaires + E2E |
| GitHub Actions | - | CI/CD pipeline |

### Architecture Mobile-First
- **Phase 1** : iOS + Android (React Native/Expo)
- **Phase 2** : Desktop Web (future)

### Architecture Offline-First
- Toutes les données stockées localement (expo-sqlite)
- Sync avec Supabase via CDC (Change Data Capture) au retour de connexion
- Résolution de conflits : last-write-wins

### PersonalFinanceEngine — 100% client-side
Le moteur de calcul tourne ENTIÈREMENT sur le téléphone (TypeScript).
Aucune donnée financière ne quitte l'appareil. Confidentialité totale.

---

## 6. STRUCTURE DU PROJET `lele-pfm/`

```
lele-pfm/
├── package.json                          # Dépendances + scripts
├── tsconfig.json                         # TypeScript strict mode
├── app.json                              # Config Expo
├── babel.config.js                       # Babel + alias @/
├── .eslintrc.js                          # ESLint strict
├── .prettierrc                           # Prettier config
├── .env.example                          # Variables d'environnement
├── .gitignore
├── .github/workflows/ci.yml             # CI/CD GitHub Actions
│
├── src/
│   ├── app/                              # Expo Router (navigation)
│   │   ├── _layout.tsx                   # Root layout (providers)
│   │   └── (tabs)/
│   │       ├── _layout.tsx               # Bottom tab navigator (4 tabs)
│   │       ├── index.tsx                 # Dashboard (6 KPI cards)
│   │       ├── transactions.tsx          # Écran transactions
│   │       ├── performance.tsx           # Écran performance
│   │       └── settings.tsx              # Écran paramètres
│   │
│   ├── domain/                           # Logique métier (couche domaine)
│   │   ├── engine/
│   │   │   ├── personal-finance-engine.ts  # ⭐ MOTEUR 10 ÉTAPES
│   │   │   └── types.ts                    # Types du moteur
│   │   ├── calculators/
│   │   │   ├── epr-calculator.ts           # EPR = montant × (1-incomp) × (flex/100)
│   │   │   ├── score-calculator.ts         # Score /10 pondéré
│   │   │   ├── waterfall-distributor.ts    # Distribution P1→P4
│   │   │   └── flexibility-calculator.ts   # (F1+F2+F3)/63×100
│   │   ├── validators/
│   │   │   └── business-rules.ts           # Validation des 10 règles
│   │   └── utils/
│   │       ├── math-utils.ts
│   │       └── validation.ts
│   │
│   ├── infrastructure/                   # Couche technique
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Client Supabase + SecureStore
│   │   │   └── config.ts                   # URL + Anon Key
│   │   └── events/
│   │       └── calendar-event-bus.ts       # Pub/Sub pour sync temps réel
│   │
│   ├── stores/                           # État global (Zustand)
│   │   ├── profile-store.ts
│   │   ├── transaction-store.ts
│   │   ├── engine-store.ts
│   │   ├── performance-store.ts
│   │   ├── auth.store.ts
│   │   ├── app.store.ts
│   │   └── transaction.store.ts
│   │
│   ├── types/                            # Définitions TypeScript
│   │   ├── database.ts                     # 16 interfaces tables DB
│   │   ├── engine.ts                       # Types EngineInput/Output
│   │   └── index.ts                        # Re-exports
│   │
│   ├── hooks/                            # Hooks React personnalisés
│   │   ├── useBiometric.ts
│   │   ├── useTheme.ts
│   │   └── index.ts
│   │
│   ├── services/                         # Services (auth, etc.)
│   │   ├── auth.service.ts
│   │   └── index.ts
│   │
│   ├── theme/                            # Design system
│   │   ├── colors.ts                       # Palette light/dark
│   │   ├── typography.ts                   # Fonts, sizes
│   │   └── index.ts
│   │
│   ├── i18n/                             # Internationalisation
│   │   ├── index.ts                        # Config i18next
│   │   └── locales/fr.json                 # 100+ clés françaises
│   │
│   ├── utils/                            # Utilitaires
│   │   ├── constants.ts                    # COICOP, types, defaults
│   │   ├── format.ts                       # Formatage monétaire/dates
│   │   ├── formatting.ts
│   │   ├── errors.ts
│   │   └── validation.ts
│   │
│   └── constants/
│       └── index.ts
│
├── supabase/
│   └── migrations/
│       ├── 00001_initial_schema.sql        # ⭐ 16 tables DDL + RLS + indexes
│       └── 00002_seed_coicop.sql           # Seed 8 catégories COICOP
│
└── __tests__/
    └── unit/domain/
        ├── epr-calculator.test.ts
        ├── score-calculator.test.ts
        ├── waterfall-distributor.test.ts
        └── business-rules.test.ts
```

**Total : 69 fichiers, ~9 500 lignes de code**

---

## 7. BASE DE DONNÉES — 16 TABLES POSTGRESQL (Supabase)

| # | Table | Rôle | Clés |
|---|-------|------|------|
| 1 | `profiles` | Identité utilisateur + 12 profils | user_id (PK, Supabase Auth) |
| 2 | `revenues` | Sources de revenus (max 8) | revenue_id UUID, FK user_id |
| 3 | `expenses` | Dépenses par catégorie COICOP | expense_id UUID, FK user_id |
| 4 | `financial_history` | Historique 3-5 ans | history_id UUID, FK user_id |
| 5 | `financial_commitments` | Emprunts/crédits (max 5) | commitment_id UUID, FK user_id |
| 6 | `risk_assessment` | Scoring risque 6 domaines | risk_id UUID, FK user_id |
| 7 | `ekh_scores` | Compétence financière 6 domaines | ekh_id UUID, FK user_id |
| 8 | `improvement_levers` | Leviers d'optimisation (max 6) | lever_id UUID, FK user_id |
| 9 | `pfe_results` | Résultats moteur (10 étapes) | pfe_id UUID, FK user_id |
| 10 | `category_configs` | Flexibilité COICOP (F1/F2/F3) | config_id UUID, FK user_id |
| 11 | `transactions` | Dépenses hebdomadaires | transaction_id UUID, FK user_id |
| 12 | `weekly_performance` | EPR, waterfall, score, grade | recap_id UUID, FK user_id |
| 13 | `distribution_config` | Pourcentages P1/P2/P3/P4 | dist_id UUID, FK user_id |
| 14 | `audit_log` | Piste d'audit (immuable) | log_id UUID, FK user_id |
| 15 | `sync_queue` | File CDC pour sync offline | sync_id UUID |
| 16 | `notification_preferences` | Préférences push/email/SMS | pref_id UUID, FK user_id |

**RLS activé sur toutes les tables** : chaque utilisateur ne voit que ses propres données.
**Les migrations SQL sont dans** : `lele-pfm/supabase/migrations/`
**ELLES N'ONT PAS ENCORE ÉTÉ EXÉCUTÉES** sur Supabase.

---

## 8. PERSONALFINANCEENGINE — MOTEUR DE CALCUL (10 ÉTAPES)

Fichier : `src/domain/engine/personal-finance-engine.ts`

| Étape | Nom | Formule | Input | Output |
|-------|-----|---------|-------|--------|
| 1 | Potentiels | Revenu × (1 + progression%) | P2 revenus | Potentiel Fixe/Variable |
| 2 | Expected Loss | EL = Σ(Revenu × Proba × Impact) | P4 risques | Total EL par catégorie |
| 3 | Volatilité | σ = √(σ_rev² + σ_dep²) | P3 historique | Écart-type total |
| 4 | Unexpected Loss | UL = Rev × Σ(P×I) × Coeff[0.5,1.5] | Étapes 1-3 + EKH | UL ajusté |
| 5 | VaR Historique | Percentile 5% des variations | P3 historique | Seuil historique |
| 6 | VaR 95% | VaR = (UL+EL) × √σ × 1.645 | Étapes 4-5 | VaR personnalisée |
| 7 | PRL | Reste-à-vivre × seuil(5/10/15/30%) | Étape 6 + risque | Perte max acceptable |
| 8 | POB + Forecast | POB = (1-VaR/Rev)×100; EL_36m | Étape 6 | Prévision 36 mois |
| 9 | Distribution | Réserve + allocation par levier | P6 leviers + Étape 8 | Répartition par levier |
| 10 | Ventilation | Matrice 36m (5%→11% progression) | Étape 9 | 36 mois × 8 COICOP |

**Coefficient Contextuel (Étape 4) :**
```
Base = 1.0
EKH ≤ 2 → ×1.3 | EKH ≥ 4.5 → ×0.7
Horizon ≤ 3 ans → ×1.2 | > 10 ans → ×0.8
Salarié → ×0.9 | Freelance/Entrepreneur → ×1.2 | Retraité → ×0.7
Final = clamp(0.5, 1.5)
```

**Performance target : < 500ms pour les 10 étapes combinées.**

---

## 9. SPRINT PLANNING — PROCHAINES ÉTAPES

### Sprint 1 — À FAIRE MAINTENANT (Semaines 3-4)
**Objectif : Première version testable sur téléphone**

| Tâche | SP | Description |
|-------|----|-------------|
| Configurer Supabase (clé API, .env) | 2 | Connecter l'app au backend |
| Exécuter migrations SQL | 3 | Créer les 16 tables dans Supabase |
| Auth biométrique + PIN | 5 | Face ID / Touch ID + fallback PIN 6 digits |
| Dashboard 6 KPI cards (live) | 5 | Reste-à-vivre, EKH, Risque, VaR, Épargne, Score |
| Navigation bottom tabs (4 onglets) | 3 | Dashboard, Transactions, Performance, Settings |
| Écran profil financier | 5 | Formulaire 12 profils + situation familiale |
| Home screen widget | 3 | Widget iOS/Android (budget hebdomadaire) |

**Milestone Alpha** : Login + Dashboard + Navigation fonctionnels.

### Sprint 2 (Semaines 5-7) — Transactions + COICOP
### Sprint 3 (Semaines 8-9) — Moteur de calcul + Reporting
### Sprint 4-10 — Voir `LELE_PFM_SPRINT_PLANNING.md`

---

## 10. COMMANDES POUR DÉMARRER

```bash
# 1. Aller dans le projet
cd HCM-PORTAL\ V3-individuel/lele-pfm

# 2. Installer les dépendances
npm install

# 3. Configurer Supabase (copier .env.example → .env et ajouter les clés)
cp .env.example .env
# Éditer .env avec :
# EXPO_PUBLIC_SUPABASE_URL=https://ghkywsxyfrrdcxyrxnjj.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (clé anon depuis le dashboard)

# 4. Exécuter les migrations SQL sur Supabase
# Option A : via Supabase CLI
npx supabase init
npx supabase link --project-ref ghkywsxyfrrdcxyrxnjj
npx supabase db push

# Option B : copier-coller le SQL dans l'éditeur SQL du dashboard Supabase
# Fichier : supabase/migrations/00001_initial_schema.sql
# Puis : supabase/migrations/00002_seed_coicop.sql

# 5. Lancer l'app
npx expo start

# 6. Scanner le QR code avec Expo Go (iOS/Android)
```

---

## 11. ERREURS PASSÉES CORRIGÉES (19 erreurs + 4 systémiques)

### 4 erreurs systémiques (corrigées dans tout le projet) :
1. ❌ Prime/Trésorerie 67/33 → ✅ Waterfall P1→P4 configurable
2. ❌ Business Lines comme dimension → ✅ Temporal + COICOP
3. ❌ EKH budgété comme type → ✅ EKH calculé uniquement
4. ❌ 5 indicateurs → ✅ 4 types de transactions

### 19 erreurs ponctuelles corrigées dans les sections 31-37 du contexte.

---

## 12. VOCABULAIRE SPÉCIFIQUE

| Terme | Signification |
|-------|--------------|
| **EKH** | Score de Compétence Financière (calculé, JAMAIS budgété) |
| **EPR** | Économies Potentiellement Réalisables (montant × (1-incomp) × flex) |
| **POB** | Potentiel d'Optimisation Budgétaire (remplace PRL, framing positif) |
| **PRL** | Perte Réelle Limite (seuil max acceptable) |
| **VaR 95%** | Value at Risk à 95% de confiance |
| **UL** | Unexpected Loss (perte inattendue) |
| **EL** | Expected Loss (perte attendue) |
| **COICOP** | Classification internationale ONU des dépenses |
| **Kakeibo** | Méthode japonaise de budget hebdomadaire (100 ans d'existence) |
| **HHI** | Indice Herfindahl-Hirschman (concentration des revenus) |
| **capRealToPrevu** | Math.min(réalisé, prévu) — principe comptable |
| **CDC** | Change Data Capture (sync offline) |
| **RLS** | Row-Level Security (isolation des données par utilisateur) |

---

## 13. INFORMATIONS PROPRIÉTAIRE

- **Nom** : Oncle (LELE)
- **Email** : philippelele.ewonde@gmail.com
- **Supabase Project ID** : ghkywsxyfrrdcxyrxnjj
- **Supabase URL** : https://ghkywsxyfrrdcxyrxnjj.supabase.co

---

## 14. INSTRUCTIONS POUR CLAUDE CODE

Quand tu reprends ce projet dans le terminal :

1. **Lis ce fichier en premier** (`context/CLAUDE_CODE_CONTEXT.md`)
2. Si tu as besoin de détails sur une règle métier → lis `docs/PFM_CONTEXTE_DECISIONS.md`
3. Si tu as besoin de détails sur les user stories → lis `docs/LELE_PFM_PRD_COMPLET.md`
4. Si tu as besoin de détails techniques → lis `docs/LELE_PFM_ARCHITECTURE_TECHNIQUE.md`
5. Si tu as besoin du planning → lis `docs/LELE_PFM_SPRINT_PLANNING.md`
6. **RESPECTE TOUJOURS les 10 règles métier** de la Section 4
7. **Le code source est dans** `lele-pfm/` — Sprint 0 est fait, Sprint 1 est à faire
8. **Prochaine action** : configurer .env avec la clé Supabase, exécuter les migrations SQL, puis coder Sprint 1
