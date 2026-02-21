# LELE PFM — DOCUMENT DE PLANIFICATION SPRINT

## Phase Scrum Master (Bob) — BMAD v6.0.0-alpha.22

### Métadonnées

- **Project Owner:** LELE / Oncle
- **Scrum Master:** Bob (Agent BMAD)
- **Date:** 7 février 2026
- **Méthodologie:** BMAD v6.0.0-alpha.22 — Phase 4/5
- **Documents de référence:**
  - PFM_CONTEXTE_DECISIONS.md (3087 lignes, 38 sections)
  - LELE_PFM_PRD_COMPLET.md (2825 lignes, 11 EPICs, 92 US)
  - LELE_PFM_ARCHITECTURE_TECHNIQUE.md (6096 lignes, 12 sections)

---

# SECTION 1: RÉSUMÉ EXÉCUTIF

## 1.1 Scope Total du Projet

| Métrique | Valeur |
|----------|--------|
| **EPICs** | 11 |
| **User Stories** | 92+ |
| **Story Points totaux** | ~404 SP |
| **Durée totale** | 21 semaines (10 sprints) |
| **Équipe** | 5-7 ingénieurs (3-4 mobile, 1-2 backend, 1 QA) |
| **Vélocité cible** | 40-60 SP/sprint |
| **Story Points engagés** | 392 SP (404 total - 12 buffer) |

## 1.2 Chronologie & Jalons

| Jalon | Semaine | Sprint | Critères de Sortie |
|--------|---------|--------|-------------------|
| **Alpha Release** | 4 | S0-S1 | Auth biométrique, Dashboard, Navigation 4-tab, Profil financier |
| **Beta Release** | 10 | S2-S4 | Toutes transactions, Reporting MVP, Performance Engine |
| **Release Candidate** | 16 | S5-S7 | Calendrier Performance, Centre Performance, E2E tests |
| **General Availability (GA)** | 21 | S8-S9 | Production-ready, App Store/Play Store, Documentation |

## 1.3 Chemin Critique

```
S0: Infrastructure → S1: Auth + Dashboard → S2: COICOP + Transactions
    ↓
S3: PersonalFinanceEngine → S4: Journal Transactions
    ↓
S5: Pages Reporting MVP → S6: Récap Performance & Waterfall
    ↓
S7: Centre Performance → S8: Calendrier Performance (3 niveaux)
    ↓
S9: Optimisations + Stabilisation → GA
```

**Dépendances critiques:**
- EPIC 1 (Configuration) doit être complète avant EPIC 2 (Engine)
- EPIC 2 doit être complète avant EPIC 3 (Reporting)
- EPIC 7 (Journal) dépend de EPIC 5 (Transactions)
- EPIC 8 (Récap) dépend de EPIC 7 (Journal)
- EPIC 10 (Centre Performance) dépend de EPIC 9 (Reporting)
- EPIC 11 (Calendrier) est le dernier dans le chemin critique

## 1.4 Risques Clés & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-----------|--------|-----------|
| **Complexité du PersonalFinanceEngine** | HIGH | CRITICAL | Spike technique S1, POC 10-étapes dès S0 |
| **Synchronisation offline avec Supabase** | MEDIUM | HIGH | CDC setup en S0, testing early |
| **Accessibilité WCAG 2.1 AA** | MEDIUM | MEDIUM | Audit externe S4, composants accessible-ready |
| **Performance sur gros datasets (3 ans)** | MEDIUM | HIGH | Indexation PostgreSQL, virtualisation listes |
| **App Store/Play Store approval delays** | LOW | MEDIUM | Soumission intermédiaire S7 (RC) |
| **Intégration RGPD (compliance requise)** | LOW | CRITICAL | Audit légal S3, anonymisation data en place S4 |

## 1.5 Definition of Done (DoD)

### Pour une User Story
- ✅ Code revu en PR (min. 1 approbation)
- ✅ Tests unitaires (≥80% couverture)
- ✅ Tests d'intégration passing
- ✅ TypeScript strict mode (zéro `@ts-ignore`)
- ✅ Vérification accessibilité (WCAG 2.1 AA minimum)
- ✅ Clés i18n en place (français)
- ✅ Aucune régression sur features existantes
- ✅ Testé sur iOS + Android (physique ou émulateur)
- ✅ Documentation technique mise à jour
- ✅ Acceptance criteria validées avec Product Owner

### Pour un Sprint
- ✅ 100% des stories engagées au DoD
- ✅ Sprint Review réalisée (démo au Product Owner)
- ✅ Retrospective Sprint tenue
- ✅ Aucun bug P1/P2 ouvert (P3/P4 documentés)
- ✅ Métriques de performance validées
- ✅ Checklist sécurité complétée
- ✅ Burndown chart présenté

### Pour une Release (Alpha/Beta/RC/GA)
- ✅ DoD Sprint appliquée à 100%
- ✅ Tests E2E passants
- ✅ Tests de pénétration validés
- ✅ Conformité RGPD vérifiée
- ✅ Release notes préparées
- ✅ App Store/Play Store ready
- ✅ Sentry monitoring configuré
- ✅ PostHog analytics trackées

## 1.6 Definition of Ready (DoR)

Une User Story est **"Ready"** quand:
- ✅ Acceptance Criteria clairement définis
- ✅ Design technique revu (architecture, API)
- ✅ Dépendances identifiées et résolues
- ✅ Story Points estimés via Planning Poker
- ✅ Maquettes/wireframes disponibles (si UI)
- ✅ Contrats API définis (si backend)
- ✅ Data models finalisés
- ✅ Aucun blocker technique identifié

---

# SECTION 2: BACKLOG PRIORISÉ PAR EPIC

## 2.1 Vue d'Ensemble des 11 EPICs

| # | EPIC | Priorité | SP | Sprint(s) | Dépendances | Risque |
|---|------|----------|-----|-----------|-----------|--------|
| 1 | **Configuration Financière** (P1-P6) | **MUST** | 42 | S1-S2 | Auth, ProfileStore | 🟢 Bas |
| 2 | **PersonalFinanceEngine** (10 étapes) | **MUST** | 37 | S2-S3 | EPIC 1 complète | 🔴 ÉLEVÉ |
| 3 | **Pages de Reporting** (P7-P15) | **MUST** | 54 | S3-S5 | EPIC 2 complète | 🟡 Moyen |
| 4 | **Configuration Postes Dépenses** (COICOP) | **MUST** | 19 | S2 | Auth, DB | 🟢 Bas |
| 5 | **Saisie Transactions** (Wizard 3 étapes) | **MUST** | 28 | S2-S3 | EPIC 4 | 🟡 Moyen |
| 6 | **Vue d'Ensemble Configuration** | **SHOULD** | 7 | S3 | EPIC 4 | 🟢 Bas |
| 7 | **Journal Transactions & EPR** | **MUST** | 26 | S3-S4 | EPIC 5 | 🔴 ÉLEVÉ |
| 8 | **Récap Performance & Waterfall** | **MUST** | 26 | S4-S5 | EPIC 7 | 🔴 ÉLEVÉ |
| 9 | **Reporting & Dashboards** (5 blocs) | **MUST** | 32 | S5-S6 | EPIC 8 | 🟡 Moyen |
| 10 | **Centre Performance** (Hebdo + Mensuel) | **MUST** | 45 | S6-S7 | EPIC 8, 9 | 🔴 ÉLEVÉ |
| 11 | **Calendrier Performance** (3 niveaux) | **MUST** | 56 | S7-S8 | EPIC 10 | 🔴 CRITIQUE |

**Totaux:** 392 SP engagés / 404 SP total | Buffer 12 SP (3%)

### 2.2 Détail par EPIC

#### EPIC 1: Configuration Financière (42 SP, S1-S2)
- US 1.1: Profil financier (pays, devise, date fiscale) — 5 SP
- US 1.2: Revenus et sources (multi-devises) — 8 SP
- US 1.3: Budget annuel global — 5 SP
- US 1.4: Paramètres épargne (taux, objectifs) — 7 SP
- US 1.5: Préférences de reporting (périodicité, seuils) — 8 SP
- US 1.6: Intégrations externes (Wise, Crypto APIs) — 9 SP
**Dépendances:** AuthStore, ProfileStore opérationnels | **Risque:** Bas

#### EPIC 2: PersonalFinanceEngine (37 SP, S2-S3)
- Étape 1-2: Classement auto des transactions — 8 SP
- Étape 3-4: Calcul flux de trésorerie — 6 SP
- Étape 5-6: Allocation épargne — 7 SP
- Étape 7-8: Scoring performance — 7 SP
- Étape 9-10: Recommandations dynamiques — 9 SP
**Dépendances:** EPIC 1 complète, Journal Transactions | **Risque:** ÉLEVÉ (complexité algo)

#### EPIC 4: Configuration Postes Dépenses (19 SP, S2)
- US 4.1: Définir 8 postes COICOP — 3 SP
- US 4.2: Flexibilité par profil (F1/F2/F3) — 4 SP
- US 4.3: Sous-catégories personnalisées — 5 SP
- US 4.4: Icônes et couleurs — 3 SP
- US 4.5: Import/export configuration — 4 SP
**Dépendances:** Auth, DB | **Risque:** Bas

#### EPIC 5: Saisie Transactions (28 SP, S2-S3)
- US 5.1: Wizard 3 étapes (catégorie → montant → source) — 8 SP
- US 5.2: Auto-fill historique & prédictions — 5 SP
- US 5.3: Verrouillage hebdomadaire (lock semaine) — 4 SP
- US 5.4: Scan reçus (OCR) — 6 SP
- US 5.5: Import CSV transactions — 3 SP
- US 5.6: Sync offline-first + CDC — 2 SP
**Dépendances:** EPIC 4 | **Risque:** Moyen

#### EPIC 7: Journal Transactions & EPR (26 SP, S3-S4)
- US 7.1: Journal avec filtres (plage, catégorie, tag) — 8 SP
- US 7.2: Event Performance Record (EPR) pour chaque txn — 6 SP
- US 7.3: Edit/suppression avec historique — 5 SP
- US 7.4: Export PDF journal — 4 SP
- US 7.5: Vue récapitulatif hebdomadaire — 3 SP
**Dépendances:** EPIC 5 | **Risque:** ÉLEVÉ (historique complexe)

#### EPIC 8: Récap Performance & Waterfall (26 SP, S4-S5)
- US 8.1: Récapitulatif hebdomadaire (P-value, % atteint) — 7 SP
- US 8.2: Graphique waterfall (revenu → épargne) — 8 SP
- US 8.3: Comparaison semaine/mois — 5 SP
- US 8.4: Drill-down par poste dépense — 4 SP
- US 8.5: Export PNG/PDF récap — 2 SP
**Dépendances:** EPIC 7 | **Risque:** ÉLEVÉ (complexité visuelle)

#### EPIC 9: Reporting & Dashboards (32 SP, S5-S6)
- US 9.1: Dashboard 5 blocs (revenus, dépenses, épargne, ratio, trend) — 8 SP
- US 9.2: Pie chart dépenses par poste — 5 SP
- US 9.3: Trend mensuel (12 mois) — 6 SP
- US 9.4: Heatmap COICOP performance — 5 SP
- US 9.5: Synthèse objectives vs réalisé — 8 SP
**Dépendances:** EPIC 8 | **Risque:** Moyen

#### EPIC 10: Centre Performance (45 SP, S6-S7)
- US 10.1: Vue hebdomadaire (52 semaines) — 9 SP
- US 10.2: Vue mensuelle (24 mois historique) — 11 SP
- US 10.3: Drill-down détail semaine/mois — 8 SP
- US 10.4: Comparaisons YoY — 7 SP
- US 10.5: Export rapport mensuel — 5 SP
- US 10.6: Push notifs performance alerts — 5 SP
**Dépendances:** EPIC 8, 9 | **Risque:** ÉLEVÉ (virtualisation données)

#### EPIC 11: Calendrier Performance (56 SP, S7-S8)
- US 11.1: Calendrier 3 niveaux (année → mois → jour) — 15 SP
- US 11.2: Couleur par score performance (rouge/orange/vert) — 6 SP
- US 11.3: Données détaillées semaine sélectionnée — 8 SP
- US 11.4: Navigation temporelle fluide — 7 SP
- US 11.5: Annotations texte par jour — 6 SP
- US 11.6: Partage snapshots performance — 8 SP
- US 11.7: Intégration Apple Calendar / Google Calendar — 0 SP (S10+)
**Dépendances:** EPIC 10 | **Risque:** CRITIQUE (UX complexe)

#### EPIC 3: Pages de Reporting (54 SP, S3-S5)
- Synthèse 6 rapports configurables — 10 SP
- Graphiques interactifs (line, area, bar) — 12 SP
- Filtres dynamiques (date, catégorie, comparaison) — 8 SP
- Drill-down par dimension — 8 SP
- Export et partage (PDF, CSV, image) — 10 SP
- Responsivité mobile + dark mode — 6 SP
**Dépendances:** EPIC 2 complète | **Risque:** Moyen

#### EPIC 6: Vue d'Ensemble Configuration (7 SP, S3)
- US 6.1: Dashboard configuration centralisé — 4 SP
- US 6.2: Health check paramètres — 3 SP
**Dépendances:** EPIC 4 | **Risque:** Bas

---

# SECTION 3: DÉFINITIONS DE RÉFÉRENCE

## 3.1 Règles d'Estimation

### Échelle Fibonacci & Mapping Effort
```
1 SP  = Tâche triviale, bien comprise, 0 risque
        Exemple: Correction CSS, ajout clé i18n
        Effort: 4h dev + 2h test = 6h total

2 SP  = Tâche simple avec peu de complexité
        Exemple: Formulaire input basique
        Effort: 8h dev + 3h test = 11h total

3 SP  = Complexité modérée, quelques composants
        Exemple: Écran avec 2-3 calls API
        Effort: 12h dev + 4h test = 16h total

5 SP  = Complexité significative, architecture décision
        Exemple: Service avec state management
        Effort: 20h dev + 6h test = 26h total

8 SP  = Très complexe, plusieurs services, algo
        Exemple: Engine calcul financier, sync CDC
        Effort: 32h dev + 10h test = 42h total

13 SP = Epic-level, doit être splittée
        Exemple: Calendrier Performance entier
        Action: RE-DÉCOUPER EN STORIES < 8 SP
```

### Critères d'Estimation
- **1 SP:** Pas de dépendances, code existant à adapter
- **3 SP:** 1-2 nouvelles composantes, call API unique
- **5 SP:** Architecture impliquée, interaction multi-services
- **8 SP:** Algo complexe OU intégration multi-couches
- **>13 SP:** TOUJOURS splitter en stories 3-5 SP

## 3.2 Vélocité & Capacité par Sprint

| Sprint | Durée | Jours dev | SP Cible | Buffer 20% | SP Engagés | Événements |
|--------|-------|----------|---------|-----------|-----------|-----------|
| **S0** | 2w | 10j | 45 | 9 | **36** | Kickoff, infra setup, daily |
| **S1** | 2w | 10j | 50 | 10 | **40** | Kickoff, daily, review |
| **S2** | 3w | 15j | 75 | 15 | **60** | Extended, daily, 2x review |
| **S3** | 2w | 10j | 50 | 10 | **40** | Kickoff, daily, review |
| **S4** | 2w | 10j | 50 | 10 | **40** | Daily, review, risque check |
| **S5** | 2w | 10j | 50 | 10 | **40** | Daily, review, perf test |
| **S6** | 2w | 10j | 45 | 9 | **36** | Daily, review, qa ramp |
| **S7** | 2w | 10j | 45 | 9 | **36** | Daily, review, release prep |
| **S8** | 2w | 10j | 40 | 8 | **32** | Daily, review, stabilisation |
| **S9** | 2w | 10j | 40 | 8 | **32** | Daily, review, GA release |
| **TOTAL** | **21w** | **105j** | **490** | **98** | **392** | |

**Notes:**
- S2 est 3 semaines (longueur exceptionnelle pour EPIC critique)
- Buffer 20% inclut: PTO, réunions, interruptions
- Estimation conservative: 40-60 SP réaliste selon équipe expérience
- Réajustement tous les 3 sprints basé sur vélocité réelle

## 3.3 Métriques de Succès

| Métrique | Cible | Seuil Alerte | Mesure |
|----------|-------|-------------|--------|
| **Vélocité réelle** | 40-60 SP/sprint | < 35 SP | Burndown sprint |
| **Couverture tests** | ≥ 80% | < 75% | Coveralls/codecov |
| **Build time** | < 5 min | > 8 min | CI/CD logs |
| **Bundle size** | < 8 MB (iOS), < 12 MB (Android) | > 10/15 MB | EAS build reports |
| **Accessibility score** | ≥ 95 (Lighthouse) | < 90 | axe DevTools scan |
| **Performance LCP** | < 2.5s | > 3.5s | Lighthouse/PostHog |
| **Crash rate** | < 0.1% | > 0.5% | Sentry dashboard |
| **API latency** | < 500ms (p95) | > 800ms | PostHog/CloudSQL metrics |

---

# SECTION 4: SPRINT 0 — INFRASTRUCTURE & SETUP (Semaines 1-2)

## 4.1 Objectif Sprint 0

**Établir une base technique solide pour démarrer le développement des 10 sprints suivants.**

Livrable: Environnement de développement complet, CI/CD pipelines fonctionnels, monitoring opérationnel, et architecture micro-services intégrée.

## 4.2 Backlog Détaillé Sprint 0

| # | Tâche | Catégorie | SP | Assignation | Pré-requis | DoD |
|---|-------|-----------|-----|------------|-----------|-----|
| **S0-01** | Initialiser projet Expo (RN 0.76+, TS 5.6+, Expo SDK 52+) | Setup | 3 | Tech Lead | Aucun | ✅ npm/yarn install OK, npx expo doctor clean, linter pass (ESLint + Prettier) |
| **S0-02** | Configurer Supabase (dev/staging/prod + service role keys) | Backend | 5 | Backend Lead | AWS account | ✅ 3 projets créés, .env.local + .env.staging + .env.production, test auth token |
| **S0-03** | Migrer schéma PostgreSQL (16 tables + RLS + indexation) | Backend | 8 | Backend Lead | S0-02 | ✅ DDL exécuté, 16 tables visibles en Supabase Studio, RLS policies testées, 12 indexes en place |
| **S0-04** | Configurer CI/CD GitHub Actions (9 stages: lint → test → build → deploy) | DevOps | 5 | DevOps | GitHub repo | ✅ Pipeline verte sur PR test, secrets configurés, artifact upload fonctionne |
| **S0-05** | Configurer Sentry (React Native SDK + source maps + replay) | Ops | 2 | DevOps | Sentry account | ✅ Erreurs capturées en dev, source maps uploadés, test error validation |
| **S0-06** | Configurer PostHog (EU data residency, RGPD-compliant, event tracking) | Ops | 2 | DevOps | PostHog account | ✅ Events trackés en staging, GDPR consent flow intégré, heatmap working |
| **S0-07** | Setup expo-sqlite (local DB + migrations framework) | Mobile | 3 | Mobile Lead | S0-01 | ✅ SQLite opérationnel, migrations jouées, data persisted entre applis restart |
| **S0-08** | Configurer EAS Build + Expo Updates (OTA updates ready) | DevOps | 3 | DevOps | Expo account, S0-01 | ✅ Build iOS réussi, Build Android réussi, Preview + Simulator builds OK |
| **S0-09** | Implémenter CalendarEventBus (pub/sub pattern, typé) | Tech | 2 | Mobile Lead | TypeScript, Zustand | ✅ EventBus opérationnel, 8 événements calendrier publiés, unit tests passing |
| **S0-10** | Setup Zustand stores (auth, profile, settings, offline sync) | Tech | 3 | Mobile Lead | TypeScript, RN | ✅ 4 stores créées, actions + selectors typées, devtools intégré, persist middleware |
| **S0-11** | Intégration React Query (v5, stale-while-revalidate, offline) | Tech | 1 | Mobile Lead | S0-02, S0-10 | ✅ QueryClient configuré, offline caching activé, Supabase adapter intégré |
| **S0-12** | Configurer TypeScript + ESLint + Prettier (strict mode) | Setup | 1 | Tech Lead | S0-01 | ✅ tsconfig strict: true, ESLint zero warnings, Prettier formatting unified |
| | **TOTAL SPRINT 0** | | **36 SP** | | | |

## 4.3 Détails Techniques Critiques

### S0-02: Supabase Configuration
```
Créer 3 projets Supabase:
1. Development (test + hot reload)
2. Staging (pré-production testing)
3. Production (GA + RGPD compliance)

.env.local:
  SUPABASE_URL_DEV=https://xxx.supabase.co
  SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=... (backend only)

.env.staging:
  SUPABASE_URL_STAGING=https://yyy.supabase.co
  (même pattern)

PostgreSQL: version 15+, 16 GB RAM min
```

### S0-03: Schéma PostgreSQL (16 tables)
```
Core tables:
1. users (auth.users linked)
2. profiles (extensions utilisateur)
3. financial_configs (EPIC 1)
4. expense_categories (EPIC 4 COICOP)
5. transactions (EPIC 5 core)
6. transaction_edits (historique)
7. weekly_locks (EPIC 5 verrouillage)
8. performance_records (EPIC 7 EPR)
9. journal_entries (EPIC 7 journal)
10. reporting_snapshots (EPIC 9)
11. performance_history (EPIC 10-11)
12. calendar_events (EPIC 11)
13. user_preferences (i18n, theme)
14. audit_logs (RGPD compliance)
15. offline_sync_queue (CDC)
16. feature_flags (product rollout)

RLS: Chaque table = RLS policy par user_id
Indexes: Sur user_id, created_at, category_id, week_start
```

### S0-04: CI/CD Pipeline (9 stages)
```
1. Lint (ESLint, Prettier, TypeScript compiler)
2. Test (Jest, >80% coverage)
3. Security (OWASP, dependency scan)
4. Build Preview (Expo)
5. Build iOS (EAS)
6. Build Android (EAS)
7. Deploy Staging (OTA update)
8. E2E tests (detox)
9. Deploy Production (GitHub releases)

Triggers: On PR, on merge main, manual dispatch
Matrix: node 20.x, macOS-latest (iOS), ubuntu-latest (Android)
```

## 4.4 Critères de Sortie Sprint 0

### Checklist de Sortie
- [ ] **Projet Expo compileert sans erreurs sur iOS et Android**
- [ ] **16 tables PostgreSQL créées avec RLS policies validées**
- [ ] **Pipeline CI/CD fonctionnelle (lint, test, build passing)**
- [ ] **Monitoring en place (Sentry + PostHog opérationnels)**
- [ ] **SQLite local opérationnel avec 3+ migrations testées**
- [ ] **EventBus + 4 Zustand stores initialisées et typées**
- [ ] **EAS Build réussi pour preview + simulator**
- [ ] **Expo Updates OTA configured**
- [ ] **TypeScript strict mode avec zéro erreurs compiler**
- [ ] **Documentation setup complétée (README, CONTRIBUTING.md)**

### Demo & Review
- Démo CI/CD pipeline (build vert)
- Démo Supabase Studio (16 tables + RLS)
- Démo Sentry integration (test error logged)
- Démo PostHog analytics (test event captured)
- Questions & feedback du Product Owner

## 4.5 Risques & Mitigations Sprint 0

| Risque | Probabilité | Impact | Mitigation |
|--------|-----------|--------|-----------|
| **EAS Build timeout (>30 min)** | MEDIUM | HIGH | Pré-configurer machines CI avec caches Expo, utiliser --expedited flag |
| **Supabase RLS complexité** | MEDIUM | MEDIUM | Tester chaque RLS policy individuellement, documentation dans code |
| **expo-sqlite incompatibilité** | LOW | HIGH | Backup plan: WatermelonDB + SQLite plugin |
| **TypeScript strict mode blockers** | MEDIUM | LOW | Identifier early, splitter en stories si blockers majeurs |
| **Offline sync queue architecture** | HIGH | MEDIUM | Spike technique jour 1, POC CDC replication dès S0 |
| **RGPD compliance complexité** | LOW | CRITICAL | Audit légal avant S2, data anonymisation framework |

---

# SECTION 5: SPRINT 1 — AUTH + DASHBOARD + NAVIGATION (Semaines 3-4)

## 5.1 Objectif Sprint 1

**Construire la fondation utilisateur: authentification biométrique sécurisée, navigation bottom-tab 4 écrans, dashboard KPI minimal, et stockage profil utilisateur.**

**Livrable:** Application fonctionnelle avec login/logout, profil personnel, et accès aux 4 modules principaux.

**Jalon:** **Alpha Release** — version déployable sur Expo Go pour testing interne.

## 5.2 Backlog Détaillé Sprint 1

| # | User Story / Tâche | EPIC | SP | Type | Pré-requis | Assignation | DoD |
|---|---|---|---|---|---|---|---|
| **S1-01** | Implémenter Supabase Auth (biometric + PIN + password) | EPIC 1 | 5 | Auth | S0-02 complète | Backend Lead | ✅ Email+password login, biometric (Face/Touch ID) fonctionne, PIN reset flow |
| **S1-02** | Design & implémentation UI Auth Screens (Login/Register/Reset) | EPIC 1 | 4 | Mobile | S0-01, Design mockups | Mobile Dev 1 | ✅ 3 screens responsive, input validation, error messages clairs |
| **S1-03** | Setup AuthStore (Zustand + Supabase session management) | EPIC 1 | 3 | Tech | S0-10, S1-01 | Mobile Lead | ✅ Session persistence, refresh token handling, logout cleanup |
| **S1-04** | Implémenter i18n (French base, structure multi-langue) | EPIC 1 | 3 | Tech | S0-01, i18n library choice | Mobile Dev 2 | ✅ 500+ clés i18n français, switch langue en app, persist choix |
| **S1-05** | Design token system (colors, spacing, typography, dark mode) | EPIC 1 | 3 | Tech | Design system | Mobile Dev 1 | ✅ Light + dark theme, 40+ tokens définis, utilisés dans 80% components |
| **S1-06** | Implémenter Navigation 4-tab (Home, Transactions, Reporting, Settings) | EPIC 1 | 3 | Mobile | S0-01, S1-03 | Mobile Dev 2 | ✅ 4 onglets + headers, icônes + labels, accessible (WCAG 2.1), animation smooth |
| **S1-07** | Design UI component library (Button, Card, Input, Modal, Chip) | EPIC 1 | 4 | Mobile | S1-05 | Mobile Dev 1 | ✅ 12 components reusables, Storybook stories, TypeScript props |
| **S1-08** | Profil utilisateur (nom, photo, pays, devise, date fiscale) | EPIC 1 | 4 | Mobile | S1-03, S1-07 | Mobile Dev 2 | ✅ Edit profile, photo upload (Supabase Storage), validation fields |
| **S1-09** | Setup ProfileStore (Zustand + sync avec Supabase) | EPIC 1 | 2 | Tech | S0-10, S1-08 | Mobile Lead | ✅ ProfileStore typée, hydration au launch, mutations + refetch |
| **S1-10** | DashboardScreen shell (6 KPI cards placeholder) | EPIC 1 | 4 | Mobile | S1-06, S1-07 | Mobile Dev 1 | ✅ 6 card placeholders, skeleton loading, responsive layout, dark mode |
| **S1-11** | Settings screen (app preferences, language, theme, notifications) | EPIC 1 | 3 | Mobile | S1-06, S1-07 | Mobile Dev 2 | ✅ Language toggle, dark/light switch, notification toggle, version display |
| **S1-12** | Accessibility audit & fixes (WCAG 2.1 AA) | EPIC 1 | 2 | QA | S1-01 through S1-11 | QA Eng | ✅ axe DevTools zero violations, labels + a11y hints, color contrast ≥ 4.5:1 |
| **S1-13** | Setup Firebase Cloud Messaging (push notifications) | EPIC 1 | 2 | Tech | Backend | Mobile Lead | ✅ FCM token management, push payload handling, silent notifications |
| **S1-14** | Spike: PersonalFinanceEngine architecture review | EPIC 2 | 3 | Tech | S0-03 schema | Tech Lead + Backend | ✅ 10-step algorithm documented, complexity assessment, 3 POCs attempted |
| **S1-15** | E2E tests (Detox) für auth flow (login → dashboard) | Testing | 2 | QA | S1-01 through S1-06 | QA Eng | ✅ 5+ E2E tests passing (iOS + Android), no flakiness |
| | **TOTAL SPRINT 1** | | **40 SP** | | | | |

## 5.3 Architecture de Sprint 1

### Authentification Flow
```typescript
// Supabase Auth + Biometric
Splash screen (check session)
  ↓
[Session exist?]
  ├→ Yes: Load AuthStore → Navigate Home
  └→ No: Show Auth screens
      ├→ Login: Email + Password OR Biometric/Face ID
      ├→ Register: Email + Password + Profile setup
      └→ Reset: Email validation → new password

AuthStore (Zustand):
  - user: User | null
  - session: Session | null
  - isLoading: boolean
  - login(email, password)
  - loginBiometric()
  - logout()
  - refreshSession()
```

### Navigation Structure
```
RootNavigator
├→ AuthStack (if !authenticated)
│  ├→ LoginScreen
│  ├→ RegisterScreen
│  └→ ResetPasswordScreen
│
└→ AppStack (if authenticated)
   ├→ BottomTab
   │  ├→ HomeTab → DashboardScreen (placeholder 6 KPIs)
   │  ├→ TransactionsTab → placeholder
   │  ├→ ReportingTab → placeholder
   │  └→ SettingsTab → SettingsScreen
   │
   └→ Modal Stacks
      ├→ ProfileModal
      ├→ NotificationsModal
      └→ AppInfoModal
```

## 5.4 Sprint 1 Exit Criteria

### Fonctionnel
- [ ] Login biométrique + password fonctionne
- [ ] Profil utilisateur créé et persisté
- [ ] Navigation 4-tab fluide et accessible
- [ ] Dashboard minimal avec 6 KPI placeholders
- [ ] Settings screen fonctionnelle
- [ ] Push notifications reçues et testées

### Technique
- [ ] AuthStore + ProfileStore typés et testés
- [ ] i18n français 500+ clés
- [ ] Design tokens appliqués (light/dark)
- [ ] CI/CD pipeline vert (S0 + S1)
- [ ] Coverage tests ≥ 80%
- [ ] TypeScript strict mode zéro erreurs

### Qualité
- [ ] Accessibility WCAG 2.1 AA validée (axe)
- [ ] E2E tests (Detox) auth flow passing
- [ ] Performance: LCP < 2.5s, TTI < 3s
- [ ] No P1/P2 bugs ouvertes

### Livrable
- [ ] Expo Go preview build (Alpha)
- [ ] Sprint Review avec Product Owner
- [ ] Retrospective tenue
- [ ] Release notes préparées (Alpha Release notes)

## 5.5 Risques Sprint 1

| Risque | Probabilité | Impact | Mitigation |
|--------|-----------|--------|-----------|
| **Biometric API compatibility (iOS vs Android)** | MEDIUM | MEDIUM | Fallback PIN code, test early on devices |
| **Supabase Auth session management** | LOW | HIGH | Deep dive S0, test refresh tokens early |
| **i18n performance avec 500+ clés** | LOW | LOW | Lazy load keys par module, monitoring |
| **Design token sprawl** | MEDIUM | LOW | 40-token strict limit, design review |
| **Navigation stack management** | MEDIUM | MEDIUM | Leverage React Navigation docs, reset handling POC |

## 5.6 Spike Technique: PersonalFinanceEngine (S1-14)

**Objectif:** Validater la faisabilité du 10-step algorithm sans unknowns.

**Deliverable:**
- Architecture document (3-4 pages)
- 3 POCs: (1) Step 1-2 classification, (2) Step 5-6 allocation, (3) Step 9-10 recommendations
- Complexity estimation (8 SP? 13 SP? Re-split required?)
- Dépendances données (quels historiques? quelle granularité?)
- Performance targets (< 1s pour 3 ans de données?)

---

# SECTION 6: SPRINT 2 — MODULE 3 PHASE 1 (Semaines 5-7, 3 SEMAINES)

## 6.1 Objectif Sprint 2

**3 semaines.** Implémenter la saisie de transactions complète (8 postes COICOP, wizard 3 étapes) et configurer le verrouillage hebdomadaire. Setup du modèle de synchronisation offline-first avec CDC (Change Data Capture).

**Livrable:** Utilisateurs peuvent saisir des transactions, catégoriser, et l'app sync en background. Semaine est verrouillée le dimanche soir (transactions non-modifiables).

**Jalon intermédiaire:** Toutes les dépendances pour EPIC 2 (Engine) résolues — prêt pour S3.

## 6.2 Backlog Détaillé Sprint 2 (60 SP, 3 semaines)

### Part A: EPIC 4 — Configuration Postes Dépenses (19 SP)

| # | User Story | SP | Type | Assignation | Pré-requis | DoD |
|---|---|---|---|---|---|---|
| **S2-A1** | Définir 8 postes COICOP (alimentation, transport, logement, etc.) | 3 | Backend | Backend Dev | S0-03 schema | ✅ DDL postes, seed data 8 catégories, descriptions français |
| **S2-A2** | Créer COICOP selector UI (listPickerModal, multiselect) | 4 | Mobile | Mobile Dev 1 | S1-07 lib | ✅ Picker avec icônes, scroll fluide, selected state, accessible |
| **S2-A3** | Implémenter flexibilité par profil (F1/F2/F3 presets) | 4 | Tech | Backend Dev | S2-A1 | ✅ 3 presets, user peut customiser, persist dans profileStore |
| **S2-A4** | Sous-catégories personnalisées (user creates custom sub-categories) | 5 | Mobile | Mobile Dev 1 | S2-A2 | ✅ Add/edit/delete subcategory, sync avec Supabase, validation unique name |
| **S2-A5** | Icônes + couleurs (36 icons, color palette) | 2 | Mobile | Design + Mobile Dev 2 | S1-05 tokens | ✅ Icon pack integrated, colors per COICOP, used in UI |
| **S2-A6** | Import/export configuration JSON | 1 | Backend | Backend Dev | S2-A1-A5 | ✅ Export JSON, import validates, restore works |

### Part B: EPIC 5 — Saisie Transactions (28 SP)

| # | User Story | SP | Type | Assignation | Pré-requis | DoD |
|---|---|---|---|---|---|---|
| **S2-B1** | Wizard 3 étapes: Catégorie → Montant → Source | 8 | Mobile | Mobile Dev 1-2 | S2-A complete | ✅ 3 screens smooth, validation, next/back navigation, confirmation |
| **S2-B2** | Auto-fill historique + ML prédictions | 5 | Tech | Backend + Mobile | S2-B1, transactions history | ✅ Top 5 suggestions, accuracy > 70%, persist choice |
| **S2-B3** | Verrouillage hebdomadaire (dimanche soir, lock semaine) | 4 | Backend | Backend Dev | S0-03 weekly_locks table | ✅ Lock trigger dimanche 23:59, UI shows locked state, edit blocked |
| **S2-B4** | Scan reçus (OCR avec Tesseract/Google Vision) | 6 | Tech | Mobile Dev 2 | S2-B1, camera permissions | ✅ Capture image, extract amount + date, populate wizard |
| **S2-B5** | Import CSV transactions (parse + validate) | 3 | Backend | Backend Dev | S0-03 | ✅ Parse CSV, validate columns (date, amount, category), batch insert |
| **S2-B6** | Sync offline-first + CDC tracker setup | 2 | Tech | Backend Dev | S0-03 offline_sync_queue | ✅ Queue created locally, sync on reconnect, CDC listener active |

### Part C: EPIC 1 — Configuration Financière Complément (9 SP)

| # | User Story | SP | Type | Assignation | Pré-requis | DoD |
|---|---|---|---|---|---|---|
| **S2-C1** | Profil financier complet (revenu, budget, devise, pays, date fiscale) | 5 | Mobile | Mobile Dev 2 | S1-08 | ✅ Edit screen, validation, multi-devise, fiscal year setting |
| **S2-C2** | Revenus et sources (salaire, freelance, investissement) | 3 | Mobile | Mobile Dev 1 | S2-C1 | ✅ Add/edit revenue source, currency, persistence |
| **S2-C3** | Budget annuel global (target savings %) | 1 | Mobile | Mobile Dev 2 | S2-C2 | ✅ Budget input, visual progress bar |

### Part D: Technical Debt & Infra (4 SP)

| # | Tâche | SP | Assignation | DoD |
|---|---|---|---|---|
| **S2-D1** | Optimisation bundle size (< 10 MB iOS, < 15 MB Android) | 2 | Mobile Lead | ✅ webpack analysis, lazy code splitting reviewed |
| **S2-D2** | Performance profiling (Lighthouse scores, FCP/LCP targets) | 2 | Mobile Lead | ✅ LCP < 2.5s validated, performance budget in CI |

**Totaux Part A-D:** 19 + 28 + 9 + 4 = **60 SP**

## 6.3 Architecture: Offline-First Sync & CDC

### CDC Tracker Architecture
```typescript
// Change Data Capture: PostgreSQL → SQLite → Supabase
1. User creates transaction offline
   → Stored in SQLite (expo-sqlite)
   → Queued in offline_sync_queue table (local)

2. When online:
   → Check CDC listener (Supabase realtime)
   → If remote changed: merge with conflict resolution (last-write-wins)
   → Upload local transactions to Supabase
   → Update SQLite from server state
   → Clear offline_sync_queue

3. Conflict resolution:
   → updated_at timestamp comparison
   → Manual merge UI if concurrent edits

Performance:
   → Index on (user_id, synced_at, created_at)
   → Batch sync (100 records max per request)
   → Exponential backoff (3s, 6s, 12s, 30s)
```

### Transaction Wizard Flow
```
Step 1: Category Selection
   ├→ COICOP picker (8 postes)
   ├→ OR custom subcategory
   └→ Next

Step 2: Amount & Details
   ├→ Amount input (number pad)
   ├→ Description (optional)
   ├→ Receipt attach (optional)
   └→ Next

Step 3: Source & Source
   ├→ Payment method (cash, card, bank transfer)
   ├→ Account (if multi-account)
   └→ Submit & confirm
```

## 6.4 Weekly Lock Mechanism

```typescript
// Pseudo-code: Weekly lock logic
EVERY Sunday 23:59:59 UTC:
  1. Identify all active users
  2. For each user:
     a. Find last complete week (Mon-Sun)
     b. Create weekly_lock record (week_start, week_end, locked=true)
     c. Trigger Supabase function: finalize_week_snapshot()
        - Calculate weekly P-value
        - Store in performance_history
        - Update dashboard KPIs

3. UI: When transaction.week_start is locked:
   - Show "Cette semaine est verrouillée" badge
   - Disable edit/delete buttons
   - Show unlock request flow (request to unlock, admin approval?)

4. Exception handling:
   - User can request unlock (create support ticket)
   - Admin can unlock manually
```

## 6.5 Sprint 2 Exit Criteria

### Fonctionnel
- [ ] 8 COICOP postes définis et sélectionnables
- [ ] Wizard 3 étapes fonctionne (category → amount → source)
- [ ] Auto-fill suggestions affichées et précises (>70%)
- [ ] OCR scan reçus fonctionne
- [ ] CSV import parsing validated
- [ ] Semaine verrouillée chaque dimanche 23:59

### Technique
- [ ] CDC tracker live, offline queue fonctionnelle
- [ ] Sync on reconnect fonctionne
- [ ] Conflict resolution tested
- [ ] Zustand stores (expense categories, transactions) typés
- [ ] React Query cached queries optimized

### Qualité
- [ ] Tests unitaires pour wizard logic ≥ 85% coverage
- [ ] E2E tests: create transaction flow
- [ ] Performance: OCR < 3s, sync < 2s
- [ ] Accessibility: WCAG 2.1 AA passed

### Livrable
- [ ] Expo build updated
- [ ] Data seed script pour 100 transactions de test
- [ ] Sprint 2 demo (transaction creation + lock)
- [ ] Release notes: Beta Release candidate

## 6.6 Risques Sprint 2

| Risque | Probabilité | Impact | Mitigation |
|--------|-----------|--------|-----------|
| **OCR accuracy < 70%** | MEDIUM | MEDIUM | Fallback manual entry, test on 20+ receipts, vendor evaluation (Google Vision vs Tesseract) |
| **CDC sync race conditions** | MEDIUM | HIGH | Extensive testing offline scenarios, load testing 1000 queued records |
| **Weekly lock edge cases (DST, timezone)** | LOW | MEDIUM | Timezone-aware timestamps (UTC), test in multiple timezones |
| **CSV import data corruption** | LOW | HIGH | Validation strict, rollback on error, user preview before import |
| **Performance: wizard < 1s per step** | MEDIUM | LOW | Profiling day 1, lazy load subcategories |

## 6.7 Dependencies Resolved for S3

✅ EPIC 4 complete → EPIC 5 (transactions) ready
✅ Transactions stored + synced → EPIC 2 (Engine) can read data
✅ Weekly lock in place → Performance snapshots can be created
✅ CDC tracker live → Multi-device sync ready for S3+

---

# SECTION 7: PROCHAINES ÉTAPES (S3-S9)

Les sprints S3 à S9 suivront une structure similaire:
- **S3:** PersonalFinanceEngine (10 étapes) + Journal Transactions
- **S4-S5:** Pages Reporting MVP + Récapitulatif Performance
- **S6-S7:** Centre Performance (hebdo/mensuel) + performances historiques
- **S8-S9:** Calendrier Performance (3 niveaux) + stabilisation GA

Chaque sprint inclura:
- Backlog détaillé (US avec AC, SP, DoD)
- Architecture & design decisions
- Exit criteria & risks
- Demo & review avec Product Owner

---

**Document version:** 1.0
**Date:** 7 février 2026
**Scrum Master:** Bob (Agent BMAD)
**Statut:** ✅ Approuvé pour démarrage S0

---

# LELE PFM — Plan de Sprint PART 2
## Sprints 3-10 / Semaines 8-21
**Méthodologie:** BMAD | **Scrum Master:** Bob | **Dernière MAJ:** 2025-02-07

---

# SECTION 7: SPRINT 3 — MOTEUR + REPORTING DÉBUT (Semaines 8-9)

## 7.1 Objectif Sprint
**Le moteur de calcul PersonalFinanceEngine est opérationnel et testable en interne.**

Livrable principal: implémentation complète du moteur 10 étapes avec tous les KPIs calculés, écrans de reporting lisibles, et suite de tests unitaires validée.

## 7.2 Backlog Sprint 3

### 7.2.1 EPIC 2: PersonalFinanceEngine (34 SP)

#### US 2.1: Moteur — Étapes 1-3 (Potentiels, Écart Limité, Volatilité)
- **Épée:** 8 SP | **Complexité:** Haute | **Dépendan:** US 1.3, US 6.1
- **Critères d'acceptation:**
  - Étape 1: Calcul des potentiels bruts (%) par classe d'actif
  - Étape 2: Calcul Écart Limité (EL) sur 36 mois
  - Étape 3: Calcul volatilité annualisée (σ)
  - Tests unitaires ≥90% coverage
  - Performance <50ms par calcul
- **Tâches techniques:**
  - Intégrer données historiques ECB (30 ans)
  - Implémenter algo variance-covariance matrix
  - Mock offline data pour dev local
- **Risques:** Qualité données ECB, synchronisation timestamps
- **Notes:** Spike S2 obligatoire si données manquantes

#### US 2.2: Moteur — Étapes 4-6 (UL, VaR Historique, VaR95%)
- **Épée:** 8 SP | **Complexité:** Haute | **Dépendan:** US 2.1
- **Critères d'acceptation:**
  - Étape 4: Calcul Utilisation Limité (UL) cumulatif
  - Étape 5: VaR historique Monte Carlo (100k simulations)
  - Étape 6: VaR à 95% de confiance
  - Validation vs benchmarks Bloomberg
  - Performance <100ms (10k simulations parallélisées)
- **Tâches techniques:**
  - Web Workers pour simulations parallèles
  - Memoization des historiques
  - Logs détaillés pour audit
- **Risques:** Temps de calcul GPU vs CPU, stabilité numériques
- **Notes:** Requiert approuvé architecture parallelization (S2)

#### US 2.3: Moteur — Étape 7 (Potentiel Réalisé Limité)
- **Épée:** 5 SP | **Complexité:** Moyen | **Dépendan:** US 2.2
- **Critères d'acceptation:**
  - Étape 7: PRL = min(Potentiel, min(UL, VaR95%))
  - Edge case: PRL négatif si marché baisse
  - Tests avec données 2008 + 2020
- **Tâches techniques:**
  - Validation edge cases
  - Logging pour debugging
- **Risques:** Cas limites mathématiques
- **Notes:** Simple; peut être fait en parallèle avec US 2.2

#### US 2.4: Moteur — Étapes 8-10 (POB, Distribution, Ventilation 36m)
- **Épée:** 13 SP | **Complexité:** Très haute | **Dépendan:** US 2.3
- **Critères d'acceptation:**
  - Étape 8: POB = PRL × Poids portefeuille
  - Étape 9: Distribution mensuelle POB (36 mois)
  - Étape 10: Ventilation par classe d'actif cumulée
  - Excel export pour validation
  - Performance <200ms pour portefeuille complet
- **Tâches techniques:**
  - Aggregation query optimization
  - Waterfall chart prep (EPIC 8)
  - Monthly bucketing logic
- **Risques:** Mémorisation de 36 mois × 10 classes = 360 points de données
- **Notes:** Spike S2 si DB query >100ms

### 7.2.2 EPIC 1: Écrans Risk, EKH, Leviers (18 SP)

#### US 1.4: Écran Risk Dashboard (Read-only)
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Affichage KPIs: Potentiel, EL, Volatilité, VaR95%
  - Cartes coleur: rouge (<2%), orange (2-5%), vert (>5%)
  - Rafraîchissement données au démarrage
- **Tâches:** UI/Figma specs, connectivity check
- **Risques:** Connexion internet intermittente

#### US 1.5: Écran EKH (Historique d'Épargne)
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Timeline 36 mois: épargne accumulée, intérêts gagnés
  - Chart ligne + area
  - Filtrage par devise
- **Tâches:** ChartJS integration, date localization
- **Risques:** Performance avec 36 points de données

#### US 1.6: Écran Levers (Vecteurs de gains)
- **Épée:** 8 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Liste des 7 leviers avec impact potentiel
  - Actions interactives (expand pour détails)
  - Validation contre POB engine
- **Tâches:** Backend lever definitions, UI implementation
- **Risques:** Alignement PO sur définitions leviers

### 7.2.3 EPIC 6: Vue d'Ensemble (Read-only) (6 SP)

#### US 6.1: Vue d'Ensemble Portefeuille
- **Épée:** 6 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Composition actuelle (12 classes)
  - Allocation cible vs réelle (comparatif %)
  - Drift visualization
  - Read-only (modifications en S4 via Dashboard)
- **Tâches:** GraphQL query, UI cards
- **Risques:** Données stale si sync offline

### 7.2.4 EPIC 3: Dashboard Phase 1 (6 SP)

#### US 3.1: Dashboard P7 — 6 Cartes KPI Live
- **Épée:** 6 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - 6 cartes: Solde, Potentiel, EL, Volatilité, VaR95%, PRL
  - Rafraîchissement secondaire via WebSocket
  - Indicateurs couleur (feu tricolore)
  - Layout responsive (mobile 1 colonne, tablet 2)
- **Tâches:** Real-time subscription Supabase, card components
- **Risques:** Latence WebSocket >1s

## 7.3 Capacité & Répartition Sprint 3

| Catégorie | SP | % |
|-----------|----|----|
| EPIC 2 (Moteur) | 34 | 85% |
| EPIC 1 (Écrans) | 18 | - |
| EPIC 6 (Vue ensemble) | 6 | - |
| EPIC 3 (Dashboard) | 6 | - |
| **Total Planifié** | **64** | - |
| **Capacité Équipe** | **40** | 100% |
| **Buffer (20%)** | **8** | - |
| **Sélection réelle** | **40** | - |

**Stratégie:** Prioriser US 2.1-2.4 (moteur) + US 1.4, US 6.1, US 3.1. Reporter US 1.5, 1.6 en S4.

## 7.4 Critères de Sortie Sprint 3

- [x] Moteur 10 étapes implémenté & déployé en staging
- [x] Unit tests ≥85% coverage (moteur)
- [x] Performance benchmark ≤200ms/calcul complet
- [x] 50 testeurs internes invités (beta.lele.app)
- [x] Écrans Risk, EKH, Vue d'ensemble fonctionnels
- [x] 0 bugs critiques (P1) en backlog
- [x] DoD respecté (code review, tests, docs)

## 7.5 Risques & Mitigations Sprint 3

| # | Risque | Proba | Impact | Mit |
|---|--------|-------|--------|-----|
| R3-1 | Engine perf >500ms | Moyenne | Élevé | Spike S2, worker threads, profiling |
| R3-2 | Données ECB incomplètes | Faible | Élevé | Fallback historical data, mock data |
| R3-3 | Sync offline perd données | Faible | Critique | CDC audit trail activé S2 |
| R3-4 | VaR Monte Carlo instable | Moyenne | Moyen | Validation vs R/Python, seed fixes |

## 7.6 Dépendances Externes
- **S2 complete:** Architecture parallelization, spike ECB data
- **Backend:** API calculation ready (US 5.1)
- **Infrastructure:** Staging environment avec Real database

## 7.7 Milestone BETA (fin S3)
**Critères GO/NO-GO:**
- ✅ Moteur production-ready (performance <200ms)
- ✅ 50+ testeurs internes actifs
- ✅ Bug tracker Jira opérationnel
- ✅ Daily triage meeting en place
- ⚠️ Peut démarrer S4 même si US 1.5, 1.6 reportées

---

# SECTION 8: SPRINT 4 — JOURNAL + EPR + HEALTH CARDS (Semaines 10-11)

## 8.1 Objectif Sprint
**Implémenter le Journal des transactions avec EPR calcul, déployer les premières Health Cards de monitoring.**

Livrable: système complet de saisie transactionnel, EPR (Épargne Réalisée) fonctionnel, 3 dashboards supplémentaires.

## 8.2 Backlog Sprint 4

### 8.2.1 EPIC 7: EPR & Journal (32 SP)

#### US 7.1: EPR Calculation Engine
- **Épée:** 6 SP | **Complexité:** Haute | **Dépendan:** US 2.4
- **Critères d'acceptation:**
  - EPR = somme gains réalisés (intérêts + plus-values)
  - Chaque transaction taggée gain/perte
  - Calcul cumulé sur 36 mois
  - Tests: 2008, 2020 market crashes
- **Tâches:** Backend logic, gain calc formula, audit trail
- **Risques:** Arrondi multi-devise

#### US 7.2: getLastCompletedWeek() Helper
- **Épée:** 3 SP | **Complexité:** Moyen | **Dépendan:** US 3.1
- **Critères d'acceptation:**
  - Fonction retourne semaine complétée (Dim 00:00 → Dim 23:59 UTC)
  - Gère timezone utilisateur
  - Tests: frontière semaine, daylight saving
- **Tâches:** Utility function, timezone tests
- **Risques:** Edge case DST (changement heure d'été)

#### US 7.3: Journal des Transactions (Read)
- **Épée:** 8 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Liste transactionsfiltrées (date, devise, catégorie)
  - Tri: plus recent en haut
  - Performance: 1000 rows virtualized
  - Recherche texte (description)
- **Tâches:** FlatList virtualization, filtering logic, search debounce
- **Risques:** Performance 1000+ transactions

#### US 7.4: Transaction Detail Panel
- **Épée:** 8 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Detail complet: montant, devise, date, source, EPR contrib
  - Edit/Delete avec confirmation
  - Undo sur 30 sec
  - Audit log lien
- **Tâches:** Modal sheet, edit form, undo queue
- **Risques:** Undo avec offline sync

#### US 7.5: Transaction Quick-Add (Mobile optimisé)
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Bouton FAB déclenche modal
  - Champs: montant (numpad), devise, source, date
  - Validation client-side
  - Sync immédiat en ligne, queue si offline
- **Tâches:** FAB component, input validation, optimistic update
- **Risques:** UX numpad, clavier mobile

#### US 7.6: Transaction Batch Import (CSV)
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Upload CSV (Nom, Montant, Devise, Date)
  - Preview avant confirm
  - Bulk insert <1s (100 rows)
  - Error report par ligne
- **Tâches:** CSV parser, preview modal, error handling
- **Risques:** Encoding CSV (UTF-8 vs latin1)

### 8.2.2 EPIC 3: Health Cards Phase 2 (4 SP)

#### US 3.2: Dashboard P8 — Plan 3 ans (2 SP)
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Card montrant projection 36 mois (solde final estimé)
  - Slider: ajuster saving rate
  - Rafraîchissement auto quand épargne change
- **Tâches:** Slider UI, projection calc, live update
- **Risques:** Slider performance

#### US 3.3: Dashboard P9 — Épargne par Levier (2 SP)
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Breakdown pie chart: 7 leviers avec contribution %
  - Tap levier = drill-down actions
  - Drill-down lien vers Écran Leviers (US 1.6)
- **Tâches:** Pie chart, drill-down navigation
- **Risques:** Chart responsiveness

### 8.2.3 Technical Debt Sprint 4 (4 SP)

#### Performance Optimization Pass
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Profiling FlatList: reducer <10ms, render <16ms
  - Memory leak audit (DevTools)
  - Bundle size check (<1 MB JS)
  - Slow query audit (backend >100ms)
- **Tâches:** React DevTools, network profiler, DB explain plan
- **Risques:** Refactoring cascade si problèmes majeurs

## 8.3 Capacité Sprint 4

| Catégorie | SP | % |
|-----------|----|----|
| EPIC 7 | 32 | 80% |
| EPIC 3 | 4 | 10% |
| Technical | 4 | 10% |
| **Total** | **40** | 100% |

## 8.4 Critères de Sortie Sprint 4

- [x] EPR engine implémenté & testé
- [x] Journal transactions 100% fonctionnel (CRUD)
- [x] Batch import CSV opérationnel
- [x] 2 Health Cards (P8, P9) en production
- [x] Performance optimization pass complétée
- [x] 0 P1 bugs bloquants
- [x] User feedback from 50 beta testers intégrés

## 8.5 Risques Sprint 4

| # | Risque | Prob | Impact | Mit |
|---|--------|------|--------|-----|
| R4-1 | Undo complexity avec offline | Moyenne | Moyen | Design decision: local queue only |
| R4-2 | CSV encoding issues | Faible | Moyen | BOM detection, chardet lib |
| R4-3 | List virtualization bugs | Faible | Moyen | Extensive testing with 5k items |

---

# SECTION 9: SPRINT 5 — WATERFALL + RÉCAP PERF (Semaines 12-13)

## 9.1 Objectif Sprint
**Implémenter la Distribution Waterfall (P1→P4) et le récapitulatif de performance hebdomadaire.**

Livrable: visualisation waterfall complète, configuration dynamique, OCR spike évalué.

## 9.2 Backlog Sprint 5

### 9.2.1 EPIC 8: Waterfall Distribution (36 SP)

#### US 8.1: Waterfall Chain Definition (5 SP)
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Définis 6 étapes: P1 (Solde initial) → P2 (Gains) → P3 (Pertes) → P4 (Solde final) + distribution inter-périodes
  - Backend validation: chaque étape ≥0
  - Edge case: pertes > gains (solde final peut être négatif)
- **Tâches:** Schema definition, DB migration, tests
- **Risques:** Validation règles métier complexes

#### US 8.2: Waterfall Configuration UI
- **Épée:** 6 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Settings écran pour custom waterfall (thresholds, levier focus)
  - Persiste user preferences (Supabase RLS)
  - Defaults si nouvel utilisateur
- **Tâches:** Settings form, validation, persistence
- **Risques:** RLS security model

#### US 8.3: Waterfall Visualization Engine
- **Épée:** 8 SP | **Complexité:** Haute
- **Critères d'acceptation:**
  - SVG chart: bars connectées (6 étapes)
  - Couleurs: gains (vert), pertes (rouge), solde (gris)
  - Interactif: hover = value tooltip
  - Performance: <100ms render pour 36 mois data
  - Responsive: mobile stacking, tablet side-by-side
- **Tâches:** D3.js/Victory.js integration, SVG optimization, responsive testing
- **Risques:** SVG performance mobile

#### US 8.4: Waterfall Data Aggregation
- **Épée:** 7 SP | **Complexité:** Haute | **Dépendan:** US 2.4, US 7.1
- **Critères d'acceptation:**
  - Query P1 (solde baseline), P2 (sum gains), P3 (sum losses), P4 (P1+P2-P3)
  - Agrégation par période (semaine, mois, trimestre)
  - Validation: P4 = P1 + (P2 - P3)
  - Performance: <50ms query 36 mois
- **Tâches:** SQL query optimization, EXPLAIN plan review, caching strategy
- **Risques:** Large data aggregation slowness

#### US 8.5: Waterfall Validation Gate
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Logic check: P2 ≥ 0, P3 ≥ 0, P4 ≥ 0 (ou -X si allowed)
  - Anomaly detection: variation >20% vs prior week = flag
  - User notification: warning card si validation fail
  - Report button: contact support avec full context
- **Tâches:** Validation logic, anomaly detection, notification UI
- **Risques:** False positive anomalies

#### US 8.6: Waterfall Export (Multi-format)
- **Épée:** 5 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Export buttons: PDF, PNG (screenshot), JSON
  - PDF: chart + metadata (date, user, settings)
  - Share: email, WhatsApp, Drive
- **Tâches:** PDF generation (jsPDF), image capture (html2canvas), share intent
- **Risques:** File size >10 MB

### 9.2.2 EPIC 3: Performance Recap Phase 3 (3 SP)

#### US 3.5: Dashboard P10 — Ventilation Périodes
- **Épée:** 1 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Card: distribution 36 mois (36 mini-bars)
  - Tap bar = drill-down détail mois
- **Tâches:** Mini-chart component, navigation
- **Risques:** Chart cramp mobile

#### US 3.6: Dashboard P11 — Pertes Détail
- **Épée:** 1 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Card: top 5 pertes, montants, sources
  - Actionnable: tap = drill detail, tap source = filter journal
- **Tâches:** List component, filters
- **Risques:** Sorting/ranking logic

#### US 3.7: Dashboard P12 — Quick Actions
- **Épée:** 1 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - 4 action buttons: +Transaction, Review Waterfall, Export PDF, Settings
  - Smart placement (sticky bottom ou scrollable)
- **Tâches:** Button bar component, navigation
- **Risques:** Bottom safe area (notch) devices

### 9.2.3 Technical Spike: OCR Evaluation (4 SP)

#### Spike US 9-T1: DataScanner OCR Feasibility
- **Épée:** 4 SP | **Complexité:** Haute | **Optional**
- **Objectif:** Évaluer extraction transaction depuis photo reçu/invoice
- **Critères d'acceptation:**
  - POC: upload image → extract (montant, date, source)
  - Providers evaluated: AWS Textract, Google Vision, Tesseract
  - Accuracy >95%, latency <2s
  - Cost estimate: <$0.01/request
  - Decision: include en S6 ou backlog
- **Tâches:** API testing, cost calc, accuracy validation
- **Risques:** Accuracy dépend qualité image, complexité OCR, coûts

## 9.3 Capacité Sprint 5

| Catégorie | SP | % |
|-----------|----|----|
| EPIC 8 | 36 | 82% |
| EPIC 3 | 3 | 7% |
| Technical Spike | 4 | 9% |
| **Total** | **43** | 100% |
| **Capacité Équipe** | **40** | - |
| **Dépassement** | **3 SP** | - |

**Stratégie:** Report US 8.6 en S6 si dépassement (waterfall export moins critique).

## 9.4 Critères de Sortie Sprint 5

- [x] Moteur waterfall 6-étapes implémenté & testé
- [x] Configuration UI & persistence opérationels
- [x] Visualisation SVG responsive & performante
- [x] Validation gate actif (anomaly detection live)
- [x] 3 Health Cards (P10, P11, P12) en production
- [x] OCR spike rapport complété (décision prise)
- [x] 0 P1 bugs bloquants

## 9.5 Risques Sprint 5

| # | Risque | Prob | Impact | Mit |
|---|--------|------|--------|-----|
| R5-1 | SVG render lag >100ms | Moyenne | Moyen | Profile, try Canvas alternative |
| R5-2 | Anomaly false positives | Moyenne | Moyen | Tuning thresholds avec PO |
| R5-3 | OCR costs high | Faible | Moyen | Cap requests/month, cache results |

---

# SECTION 10: SPRINT 6 — REPORTING COMPLET (Semaines 14-15)

## 10.1 Objectif Sprint
**Livrer les 5 blocs de reporting complets: Smart Calendar, multi-devise, dark mode. Atteindre Release Candidate.**

Livrable: tous les dashboards (P1-P13) en production, i18n complet, accessibility AA standard.

## 10.2 Backlog Sprint 6

### 10.2.1 EPIC 9: Advanced Reporting (32 SP)

#### US 9.1: Smart Calendar Component
- **Épée:** 6 SP | **Complexité:** Haute
- **Critères d'acceptation:**
  - Calendrier 3 mois: jour = mini card solde/gains/pertes
  - Color coding: rouge (perte), orange (stable), vert (gains)
  - Tap jour = drill detail transactif
  - Swipe left/right = previous/next month
  - Performance: <16ms render
- **Tâches:** Calendar library (react-calendar/custom), color logic, swipe gesture
- **Risques:** Touch gesture recognition mobile

#### US 9.2: Multi-Currency Engine
- **Épée:** 8 SP | **Complexité:** Haute | **Dépendan:** US 6.1
- **Critères d'acceptation:**
  - Support USD, EUR, GBP, CHF, JPY (extensible)
  - ECB API rates refresh: daily 16h30 UTC
  - Fallback: cached rates si offline
  - Conversion formula: montant × rate (rounded to cents)
  - Display: symbol + amount (e.g., €1.234,56)
  - User setting: preferred currency + rounding rule
- **Tâches:** Currency enum, rate fetcher, conversion util, locale formatting
- **Risques:** Rate stale >24h, rounding edge cases

#### US 9.3: Multi-Currency Reporting
- **Épée:** 6 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Tous dashboards auto-convertis user currency
  - Charts: montrer devise sélectionnée
  - Export (CSV/PDF): include conversion rate used
  - Toggle: switch on-the-fly (no reload)
- **Tâches:** Redux currency state, component refactor, export update
- **Risques:** Stale context si toggle rapide

#### US 9.4: Dark Mode Theme
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Toggle settings: light/dark/system
  - Persist preference (Supabase)
  - All screens compliant (contrast WCAG AA)
  - Charts readable (light/dark palette)
  - No flash on load (read theme before render)
- **Tâches:** Tailwind dark mode setup, color palette audit, persistence
- **Risques:** Chart contrast issues

#### US 9.5: 5 Reporting Blocks Summary (5 SP)
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Bloc 1: Portfolio Overview (EPIC 6)
  - Bloc 2: Risk Dashboard (EPIC 1)
  - Bloc 3: Waterfall (EPIC 8)
  - Bloc 4: EPR & Gains (EPIC 7)
  - Bloc 5: Performance Timeline (Légende S7)
  - Responsive layout: vertical scroll mobile, grid tablet
- **Tâches:** Layout component, responsive testing
- **Risques:** Layout instability avec data

#### US 9.6: i18n Key Audit & Completion
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Scan codebase: trouver all hardcoded strings
  - Extract to i18n JSON (EN, FR, ES, DE)
  - Test: switch languages without reload
  - Coverage: ≥99% UI strings
- **Tâches:** i18next scan, string extraction, QA validation
- **Risques:** Missing strings in edge cases

### 10.2.2 EPIC 3: Dashboard Final Phase (4 SP)

#### US 3.8: Dashboard P13 — Plan Détaillé
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Card: expanded 36-month projection breakdown
  - Filterable by levier
  - Download CSV: plan details
- **Tâches:** Expandable card, CSV export
- **Risques:** Data size >1MB

#### US 3.9: Dashboard P14 — Calendrier Épargne
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Integration Smart Calendar (US 9.1)
  - Show target saving day (e.g., Friday)
  - Notification: remind if day passed
- **Tâches:** Calendar integration, notification logic
- **Risques:** Notification race conditions

### 10.2.3 Technical: Accessibility & i18n Pass (4 SP)

#### US 10-T1: WCAG AA Compliance Audit
- **Épée:** 2 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Axe DevTools scan: 0 violations
  - Manual testing: keyboard navigation, screen reader (VoiceOver iOS)
  - Focus indicators visible
  - Color contrast ≥4.5:1 (normal text)
  - Labels all inputs
- **Tâches:** Automated audit, manual testing, fixes
- **Risques:** Screen reader testing time-intensive

#### US 10-T2: i18n Integration Testing
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - RTL support (Arabic) testable
  - Number formatting per locale (1.234,56 vs 1,234.56)
  - Date formatting (DD/MM/YYYY vs MM/DD/YYYY)
  - All languages equal quality
- **Tâches:** Locale-specific testing, format validation
- **Risques:** RTL layout edge cases

## 10.3 Capacité Sprint 6

| Catégorie | SP | % |
|-----------|----|----|
| EPIC 9 | 32 | 80% |
| EPIC 3 | 4 | 10% |
| Technical | 4 | 10% |
| **Total** | **40** | 100% |

## 10.4 Critères de Sortie Sprint 6 (Release Candidate)

- [x] Tous dashboards P1-P14 en production
- [x] Multi-currency fully operational
- [x] Dark mode launch-ready
- [x] i18n ≥99% coverage (EN, FR)
- [x] WCAG AA audit passing
- [x] Performance budget: <3MB JS, <50 CLS
- [x] 200+ beta testers onboarded
- [x] 0 P1 bugs; <5 P2 bugs
- [x] Release notes draft ready

## 10.5 Milestone RC — Release Candidate (fin S6)
**Critères GO/NO-GO:**
- ✅ Feature complete (all Module 1 + 3 features)
- ✅ Performance targets achieved
- ✅ Beta feedback integrated (NPS >50)
- ✅ Legal/Privacy review complete (RGPD check)
- ⏳ AppStore/PlayStore pre-submission review passed

## 10.6 Risques Sprint 6

| # | Risque | Prob | Impact | Mit |
|---|--------|------|--------|-----|
| R6-1 | Dark mode colors untested | Moyenne | Moyen | Early design review |
| R6-2 | RTL layout breaks | Faible | Élevé | Early RTL testing |
| R6-3 | ECB API rate limits | Faible | Moyen | Cache aggressively |

---

# SECTION 11: SPRINT 7 — CENTRE PERFORMANCE (Semaines 16-17)

## 11.1 Objectif Sprint
**Déployer le Centre de Performance hebdomadaire et mensuel avec score d'efficacité /10.**

Livrable: hiérarchie complète d'écrans (Centre → Semaine → Jour → Détail), score intelligemment calculé, table 9-colonnes virtuelle, totals row.

## 11.2 Backlog Sprint 7

### 11.2.1 EPIC 10: Performance Center (36 SP)

#### US 10.1: Performance Hierarchy Structure
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - 4 niveaux: Centre (home) → Month view → Week view → Day view
  - Navigation: drill-down (tap month → weeks) et breadcrumb back
  - Data structure: month[].weeks[].days[]
  - Caching: pre-fetch current + next 2 months
- **Tâches:** Navigation state, data structure, cache logic
- **Risques:** State complexity avec deep navigation

#### US 10.2: Performance Score Calculation (/10)
- **Épée:** 6 SP | **Complexité:** Haute
- **Critères d'acceptation:**
  - Score formula: (Gains/Target) × (100% - DriftPenalty%) → /10
  - Weighted: Gains 50%, Levier diversity 30%, Compliance 20%
  - Real-time: update on each transaction
  - Edge case: 0 gains = score 0; negative gains = <5
  - Audit trail: log scoring inputs
- **Tâches:** Scoring engine, formula validation, logging
- **Risques:** Formula alignment with PO

#### US 10.3: WeeklyBudgetReport Calculation
- **Épée:** 5 SP | **Complexité:** Haute | **Dépendan:** US 7.2
- **Critères d'acceptation:**
  - Weekly snapshot: target spend, actual spend, variance %, score
  - Aggregation: daily data → weekly sum
  - Breakdown: 7 leviers per week
  - Performance: <100ms calculation
- **Tâches:** Aggregation query, variance calc, batch processing
- **Risques:** Large data aggregation

#### US 10.4: VirtualizedWeekList Component
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - FlatList: 52 weeks virtualized (memory <50MB)
  - Each row: week #, date, target, actual, variance, score
  - Swipe row: delete, archive, share
  - Sortable: score, date, variance
  - Performance: scroll 60fps
- **Tâches:** FlatList optimization, swipe actions, sorting
- **Risques:** Scroll jank with calculations

#### US 10.5: GlobalPerformanceCenter UI
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Summary cards: annual score, best week, worst week, trend
  - Year/Quarter/Month tabs
  - Mini chart: score trend (52 weeks line chart)
  - Action buttons: export, share, drill-down
- **Tâches:** Card components, chart integration, navigation
- **Risques:** Chart performance 52 points

#### US 10.6: 9-Column Performance Table
- **Épée:** 6 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Columns: Week, Score, Target, Actual, Variance%, Gains, Losses, EPR, Levier#
  - Horizontal scroll (mobile)
  - Column sorting (tap header)
  - Column pinning: Week column always visible
  - Export to CSV/Excel
- **Tâches:** DataTable component, horizontal scroll, pinning logic
- **Risques:** Mobile horizontal scroll UX

#### US 10.7: Totals Row & Summary Statistics
- **Épée:** 3 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Sticky footer: totals (sum Actual, sum Gains, avg Score, etc.)
  - Dynamically recalculate on sort
  - Export includes totals
- **Tâches:** Totals calculation, sticky positioning
- **Risques:** Sticky positioning mobile browsers

#### US 10.8: Performance Validation & Data Integrity
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Validate: actual ≤ target, gains ≥ 0 (or losses)
  - Warn: duplicate weeks detected
  - Reconciliation: match transactions sum = weekly actual
- **Tâches:** Validation logic, reconciliation query
- **Risques:** Data inconsistency from manual edits

### 11.2.2 EPIC 3: Dashboard Phase 4 (2 SP)

#### US 3.10: Dashboard P15 — Actions Prioritaires
- **Épée:** 1 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Card: top 3 action items (improve worst levier, review losses, rebalance)
  - Actionable: tap = drill-down screen
  - Refresh: daily or on demand
- **Tâches:** Recommendation engine, UI card
- **Risques:** Recommendation quality

#### US 3.11: Dashboard P16 — Rapport Global
- **Épée:** 1 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Card: 1-page summary (score, trend, top metric, CTA)
  - CTA: "View Full Report" → Centre Performance
  - Printable/Shareable
- **Tâches:** Summary card, print styles
- **Risques:** Print rendering mobile

### 11.2.3 Technical: Performance Budget Enforcement (2 SP)

#### US 11-T1: Performance Budget Enforcement
- **Épée:** 2 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - CI/CD check: JS bundle <2.5MB, CSS <200KB
  - LCP <2.5s, FID <100ms, CLS <0.1
  - Fail build if budget breached
  - Monthly report: trending
- **Tâches:** Lighthouse CI setup, budget config, reporting
- **Risques:** Tight budgets require aggressive optimization

## 11.3 Capacité Sprint 7

| Catégorie | SP | % |
|-----------|----|----|
| EPIC 10 | 36 | 82% |
| EPIC 3 | 2 | 5% |
| Technical | 2 | 5% |
| **Total** | **40** | 100% |

## 11.4 Critères de Sortie Sprint 7

- [x] Performance Centre fully operational (4 views)
- [x] Score calculation engine live & audited
- [x] WeeklyBudgetReport aggregation tested (100+ weeks)
- [x] 9-column table virtualized & performant
- [x] 2 Health Cards (P15, P16) in production
- [x] Performance budget <2.5MB JS
- [x] 0 P1 bugs

## 11.5 Risques Sprint 7

| # | Risque | Prob | Impact | Mit |
|---|--------|------|--------|-----|
| R7-1 | Score formula too complex | Moyenne | Moyen | Weekly stakeholder review |
| R7-2 | Table rendering lag | Faible | Moyen | React.memo, useMemo aggressive |
| R7-3 | Drill-down state bugs | Moyenne | Moyen | Navigation testing matrix |

---

# SECTION 12: SPRINT 8 — CALENDRIER PERFORMANCE (Semaines 18-19)

## 12.1 Objectif Sprint
**Déployer Calendrier Performance avec drill-down 3 niveaux, filtres multi-dimensionnels avancés.**

Livrable: calendrier visuel jour/semaine/mois, détail panels interactifs, FilterWidget réutilisable, syncoffline finalisée.

## 12.2 Backlog Sprint 8

### 12.2.1 EPIC 11: Performance Calendar (34 SP)

#### US 11.1: 3-Level Drill-Down Calendar
- **Épée:** 6 SP | **Complexité:** Haute
- **Critères d'acceptation:**
  - Level 1 (Month): 30-day grid, color-code days (score 0-10 → red/yellow/green)
  - Level 2 (Week): 7-day detail (daily score, gains, variance%)
  - Level 3 (Day): 24h timeline (transactions with amounts, sources, times)
  - Navigation: breadcrumb, swipe gestures
  - Performance: <100ms level transitions
- **Tâches:** Calendar component architecture, gesture handling, performance profiling
- **Risques:** Gesture conflict with scroll

#### US 11.2: WeekCell Visualization
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Cell size: 60×60px (mobile), 80×80px (tablet)
  - Visual encoding: background color (score), border (variance)
  - Badge: # transactions, gain/loss icon
  - Interactive: tap = drill detail, long-press = context menu
- **Tâches:** Custom cell component, touch handling
- **Risques:** Touch target size <44×44px accessibility

#### US 11.3: Detail Panels (Week & Day)
- **Épée:** 6 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Week panel: score breakdown by levier, table of daily totals, drill-day CTA
  - Day panel: timeline of transactions (time, amount, source, levier tag)
  - Edit/Delete on long-press transaction
  - Scroll: virtualized if >10 transactions/day
- **Tâches:** Panel components, virtualization, edit integration
- **Risques:** Edit form modal complexity

#### US 11.4: Performance Validation Badge
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Badge icon: ✅ (on-target), ⚠️ (variance >10%), ❌ (target missed)
  - Tooltip: brief reason (e.g., "Spending 15% over target")
  - Actionable: tap = recommendation card
- **Tâches:** Badge component, logic
- **Risques:** Badge placement on cell

#### US 11.5: FilterWidget Multi-Dimensional
- **Épée:** 8 SP | **Complexité:** Haute
- **Critères d'acceptation:**
  - Filters: Date range, Levier (multi-select), Min/Max score, Currency
  - UI: Toggle chips per filter dimension
  - Logic: AND across dimensions, OR within
  - Persist: save up to 5 filter presets
  - Performance: <50ms filter application
- **Tâches:** Filter state management, persistence, validation
- **Risques:** Filter UX mobile (too many options)

#### US 11.6: BudgetSettings Integration
- **Épée:** 5 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Allow edit target budget per levier per month
  - Sync immediately (real-time recalc of variances)
  - Undo/Redo for edits
  - Validation: total budget constraints
- **Tâches:** Settings form, state sync, undo logic
- **Risques:** Undo complexity

#### US 11.7: Orthogonal Dimensions & Advanced Features
- **Épée:** 2 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Support viewing same calendar by Levier (vs default by Date)
  - Toggle: "View by Date" vs "View by Levier"
  - Forecasting: overlay projected future scores
- **Tâches:** Dimension switching logic, forecast overlay
- **Risques:** UX clarity dual-view

#### US 11.8: Calendar Export & Sharing
- **Épée:** 1 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Export: iCal format (events = high-score days) + CSV (data dump)
  - Share: email PDF calendar snapshot, WhatsApp link
- **Tâches:** iCal generation, export UI
- **Risques:** iCal complexity (recurring events)

### 12.2.2 Technical: Offline Sync Finalization (8 SP)

#### US 12-T1: CDC (Change Data Capture) Conflict Resolution
- **Épée:** 4 SP | **Complexité:** Très haute
- **Critères d'acceptation:**
  - Conflict detection: same row edited on 2 devices simultaneously
  - Resolution strategy: Last-Write-Wins (LWW) timestamp-based
  - User notification: conflict dialog (keep local/remote/merge)
  - Audit trail: log all conflicts for support investigation
  - Tests: 10+ conflict scenarios (device offline, network split, etc.)
- **Tâches:** CDC logic implementation, conflict detection, notification UI, testing
- **Risques:** Complex edge cases (3-way merge), user confusion

#### US 12-T2: Sync Offline Finalization & Testing
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Full offline mode: 100% feature parity (except cloud exports)
  - Sync replay: queue all operations, replay on reconnect in order
  - Data validation post-sync: checksums match server
  - End-to-end tests: offline → online → offline scenarios
  - Performance: sync <2s for 1000 queued operations
- **Tâches:** Sync engine testing, integration tests, performance benchmarking
- **Risques:** Queue replay edge cases

## 12.3 Capacité Sprint 8

| Catégorie | SP | % |
|-----------|----|----|
| EPIC 11 | 34 | 77% |
| Technical | 8 | 18% |
| **Buffer** | **2** | 5% |
| **Total** | **44** | - |
| **Capacité Équipe** | **40** | - |
| **Dépassement** | **4 SP** | - |

**Stratégie:** Report US 11.7, 11.8 en S9 si surcharge (calendar core features prioritized).

## 12.4 Critères de Sortie Sprint 8

- [x] Performance Calendar fully operational (3-level drill-down)
- [x] All filters functional & performant
- [x] Offline sync tested & conflict resolution live
- [x] CDC audit trail implemented
- [x] <2s sync replay tested
- [x] 0 P1 bugs (sync integrity critical)
- [x] 300+ beta testers active

## 12.5 Risques Sprint 8

| # | Risque | Prob | Impact | Mit |
|---|--------|------|--------|-----|
| R8-1 | CDC conflict untested | Moyenne | Critique | Scenario matrix + automation testing |
| R8-2 | Calendar gesture conflicts | Faible | Moyen | UX testing with real users |
| R8-3 | Sync queue memory leak | Faible | Élevé | Memory profiling, aggressive cleanup |

---

# SECTION 13: SPRINT 9 — NOTIFICATIONS + EXPORTS + FREEMIUM (Semaine 20)

## 13.1 Objectif Sprint
**Déployer notifications push, exports PDF/CSV/iCal, freemium model.**

Livrable: système notifications multi-canal, export engine complet, subscription gating.

## 13.2 Backlog Sprint 9

### 13.2.1 Push Notifications Setup (8 SP)

#### US 13.1: APNs Configuration (iOS)
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Certificate setup: Dev + Production
  - Token management: store device tokens in Supabase
  - Test notifications: manual send via Apple Console
  - Payload: title, body, badge, deeplink
- **Tâches:** Certificate generation, backend token storage, testing
- **Risques:** Certificate expiry management

#### US 13.2: FCM Configuration (Android)
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Firebase setup: credentials, config
  - Token sync: store in Supabase on app start
  - Test notifications: manual send via Firebase Console
  - Deeplink: navigate to specific screen on tap
- **Tâches:** Firebase integration, token sync, deeplink routing
- **Risques:** FCM token refresh timing

### 13.2.2 Notification Triggers (10 SP)

#### US 13.3: Daily/Weekly Performance Alerts
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Trigger: daily (9 AM user timezone) + weekly (Monday 8 AM)
  - Message: "Your score this week: 7.5/10 — Review performance →"
  - User settings: enable/disable, timezone, frequency
  - No notification: if already viewed this session
- **Tâches:** Scheduled job (Cloud Function), message formatting, deduplication
- **Risques:** Timezone handling complexity

#### US 13.4: Budget Variance Warnings
- **Épée:** 3 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Trigger: variance >15% (real-time as transactions logged)
  - Message: "Spending 20% over target on Food levier"
  - Frequency cap: max 1 per day per levier
  - Action: tap → drill detail levier performance
- **Tâches:** Real-time trigger logic, dedup, deeplink
- **Risques:** Notification fatigue user tuning

#### US 13.5: Savings Milestone Celebrations
- **Épée:** 3 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Triggers: €500 saved, €1000 saved, goal achieved
  - Message: "Congratulations! You've saved €500 in 4 weeks 🎉"
  - Tone: celebratory, gamified
  - Frequency: 1 per milestone only
- **Tâches:** Milestone detection, celebration message
- **Risques:** User perception (spammy vs motivational)

### 13.2.3 PDF/CSV/iCal Exports (10 SP)

#### US 13.6: PDF Global Report Export
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Content: P15 (Global Report) rendered as PDF
  - Branding: LELE logo, user name, date generated
  - Size: <2MB
  - Export options: email, save to device, Drive, Dropbox
  - Signature field: optional (printable + sign)
- **Tâches:** PDF generation (jsPDF/pdfkit), email integration, cloud storage
- **Risques:** PDF rendering variations

#### US 13.7: CSV Bulk Exports
- **Épée:** 3 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Transactions CSV: date, amount, currency, source, levier, EPR
  - Performance CSV: week, score, target, actual, variance%, gains
  - Encoding: UTF-8 + BOM
  - Delimiter: configurable (comma vs semicolon for EU locales)
- **Tâches:** CSV generation, encoding, delimiter logic
- **Risques:** Encoding issues (Excel opening)

#### US 13.8: iCal Savings Calendar Export
- **Épée:** 3 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Generate iCal: events for saving days (configured user preference, e.g., Fridays)
  - Event details: target savings amount, estimated balance post-save
  - Repeat: recurring weekly (52 weeks)
  - Calendar app integration: "Add to Calendar" auto-opens native calendar
- **Tâches:** iCal generation, recurring event logic, integration
- **Risques:** iCal client compatibility

### 13.2.4 Freemium Model (4 SP)

#### US 13.9: Freemium Feature Gating
- **Épée:** 4 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Free tier: dashboards (P1-P7), journal, basic reporting
  - Premium tier: advanced reporting (P8-P16), exports, priority support
  - Premium features: Performance Center, Calendar, Multi-currency, Dark mode, Notifications
  - Paywall: modal on premium feature access (free users)
  - Trial: 14 days premium free on signup
- **Tâches:** Feature flags, paywall UI, subscription state
- **Risques:** PayWall UX (conversion rate)

### 13.2.5 Multi-User Collaboration (Optional - Backlog)

#### US 13.10: Multi-User Collaboration (OPTIONAL)
- **Épée:** 6 SP | **Optional** | **Backlog if time**
- **Critères d'acceptation:**
  - Invite: share read-only access to specific users (emails)
  - Permissions: view only (no edit/delete)
  - Real-time sync: changes visible to all authorized users
  - Audit log: track who viewed when
- **Tâches:** RLS policies, invite logic, audit
- **Risques:** Privacy/security model complexity

## 13.3 Capacité Sprint 9

| Catégorie | SP | % |
|-----------|----|----|
| Notifications | 18 | 56% |
| Exports | 10 | 31% |
| Freemium | 4 | 13% |
| **Total Planifié** | **32** | 100% |
| **Capacité Équipe** | **32** | 100% |
| **Optional (Multi-User)** | **6** | Backlog |

## 13.4 Critères de Sortie Sprint 9

- [x] Push notifications (APNs + FCM) live & tested
- [x] Daily/weekly performance alerts functional
- [x] Budget variance warnings real-time
- [x] PDF/CSV/iCal exports available
- [x] Freemium gating enforced
- [x] 14-day premium trial enabled
- [x] 0 P1 bugs; <3 P2 bugs
- [x] Preparation for GA submission (S10)

## 13.5 Risques Sprint 9

| # | Risque | Prob | Impact | Mit |
|---|--------|------|--------|-----|
| R9-1 | APNs/FCM certificate issues | Faible | Moyen | Early setup, support contact ready |
| R9-2 | Notification fatigue user churn | Média | Moyen | Tuning frequency, user feedback loop |
| R9-3 | Freemium conversion low | Faible | Élevé | A/B test paywall messaging |

---

# SECTION 14: SPRINT 10 — E2E TESTS + POLISH + STORE SUBMISSION (Semaine 21)

## 14.1 Objectif Sprint
**Atteindre General Availability (GA): qualité finale, tests E2E complets, soumission App Store + Play Store.**

Livrable: build final soumis aux stores, 100% E2E tests passing, support prêt.

## 14.2 Backlog Sprint 10

### 14.2.1 E2E Testing & Automation (16 SP)

#### US 14.1: E2E Test Suite — Core User Flows (10 SP)
- **Épée:** 10 SP | **Complexité:** Très haute | **Tech:** Detox + Jest
- **Critères d'acceptation:**
  - 20+ scenarios covering:
    - Signup/Login (email, biometric, PIN fallback)
    - Add transaction (single, bulk import, OCR)
    - View reports (all P dashboards, drill-downs)
    - Filter performance calendar
    - Export PDF/CSV
    - Settings (theme, currency, notifications)
  - Coverage: happy path + error cases (network offline, validation fail)
  - Execution: <10min full suite, <2min on real device
  - CI/CD: green = deploy allowed, red = halt
- **Tâches:** Test writing (Detox syntax), fixture data prep, CI integration
- **Risques:** Flaky tests (timing, gesture issues)

#### US 14.2: Accessibility E2E Tests (3 SP)
- **Épée:** 3 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Screen reader scenarios (VoiceOver iOS, TalkBack Android)
  - Keyboard navigation (Tab through 5 key screens)
  - Focus indicators visible
  - Color contrast validated (automated + manual spot-check)
- **Tâches:** Accessibility testing tools setup, test writing
- **Risques:** Screen reader unpredictability

#### US 14.3: Performance E2E Benchmarks (3 SP)
- **Épée:** 3 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - LCP <2.5s, FID <100ms, CLS <0.1
  - Memory profile: app <150MB startup, <200MB max
  - Battery: 12h usage on typical usage profile
  - Network: 2G (slow-3g) functional (degraded but usable)
- **Tâches:** Performance testing automation, benchmarking
- **Risques:** Device variability (old vs new phones)

### 14.2.2 Final Accessibility & Security Audit (10 SP)

#### US 14.4: WCAG AA Final Audit
- **Épée:** 3 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Axe scan: 0 violations (automated + manual review)
  - Manual testing: keyboard, screen reader, color contrast
  - Fix priority: critical before GA
  - Accessibility statement: LELE website + in-app link
- **Tâches:** Final audit, fix, re-test
- **Risques:** Last-minute issues found

#### US 14.5: Security Penetration Testing
- **Épée:** 4 SP | **Complexité:** Haute
- **Critères d'acceptation:**
  - Engagement: hire external security firm (3-5 days)
  - Scope: API endpoints, data storage, auth, encryption
  - Findings: critical = fix before GA, high = fix before S1 post-GA
  - Report: executive summary + detailed findings + remediation
- **Tâches:** Vendor selection, scope definition, remediation
- **Risques:** Unexpected critical findings delay GA

#### US 14.6: RGPD Compliance Verification
- **Épée:** 2 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Privacy Policy: reviewed by legal, posted on LELE website
  - Data handling: documented (collection, storage, deletion)
  - User rights: implemented (export data, delete account, opt-out)
  - Consent: explicit opt-in for notifications + analytics
  - DPA: Data Processing Agreement with Supabase signed
- **Tâches:** Legal review, policy updates, consent flow
- **Risques:** Legal delays

#### US 14.7: Performance Profiling Final Pass (1 SP)
- **Épée:** 1 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Profile on low-end device (iPhone SE, Android Pixel 4a)
  - Flamegraph: identify remaining slow functions
  - Optimize <100ms blocking work
  - Before/after comparison documented
- **Tâches:** Profiling, optimization, comparison
- **Risques:** Optimization scope creep

### 14.2.3 App Store & Play Store Submission (6 SP)

#### US 14.8: App Store Metadata & Screenshots
- **Épée:** 3 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - App name, subtitle, description (< 170 chars each)
  - Keywords: personal finance, budgeting, savings, investment, tracking
  - 5 screenshots: onboarding, dashboard, reporting, settings
  - Preview video: 30sec demo (optional, nice-to-have)
  - Age rating: 4+ (financial info, no ads/tracking/in-app chat)
  - Localization: EN, FR ready; ES, DE (post-GA)
- **Tâches:** Copywriting, screenshot creation, localization
- **Risques:** Screenshot translations

#### US 14.9: Play Store Metadata & Screenshots
- **Épée:** 3 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Title, short description, full description
  - 8 screenshots: more visual storytelling
  - Feature graphic (1024×500px)
  - Icon (512×512px) + hi-res icon
  - Permissions explanation (camera for OCR, storage, location if future feature)
  - Content rating: PEGI 3 (financial tool, no content flags)
  - Privacy policy: linked in Play Console
- **Tâches:** Asset creation, metadata entry
- **Risques:** Content policy compliance

### 14.2.4 Release & Post-GA (6 SP)

#### US 14.10: Release Notes & Documentation
- **Épée:** 2 SP | **Complexité:** Bas
- **Critères d'acceptation:**
  - Release notes: features, bug fixes, performance improvements (2-3 bullet points per category)
  - Known issues: none critical; documented any (none expected GA)
  - Troubleshooting guide: common issues + solutions (offline sync, biometric, export)
  - Tutorial video: 5min onboarding walkthrough (YouTube link)
- **Tâches:** Release notes drafting, guide creation
- **Risques:** Coverage gaps in documentation

#### US 14.11: Support & Monitoring Setup
- **Épée:** 2 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - Support email: support@lele.app monitored 24/7
  - Sentry setup: error tracking, alerting
  - Firebase Analytics: track key events (signup, transaction, export)
  - Dashboard: daily active users, session length, crash rate
  - Runbook: incident response procedures
- **Tâches:** Support processes, monitoring setup, runbook drafting
- **Risques:** Support volume spike

#### US 14.12: Store Submission & Review
- **Épée:** 2 SP | **Complexité:** Moyen
- **Critères d'acceptation:**
  - App Store submission: wait for Apple review (3-5 days typical)
  - Play Store submission: immediate approval (Google usually faster)
  - Resolve reviewer feedback (if any) within 2 days
  - Monitor crash reports post-GA
  - Post-GA hotfix plan: P1 bugs fixed within 4h, submitted same day
- **Tâches:** Submission, review management, hotfix protocols
- **Risques:** Apple rejection, Play Store policy issues

## 14.3 Capacité Sprint 10

| Catégorie | SP | % |
|-----------|----|----|
| E2E Testing | 16 | 40% |
| Accessibility & Security | 10 | 25% |
| Store Submission | 6 | 15% |
| Release & Monitoring | 6 | 15% |
| **Buffer** | **2** | 5% |
| **Total** | **40** | 100% |

## 14.4 Critères de Sortie Sprint 10 (General Availability)

- [x] 20+ E2E tests passing on real devices
- [x] Accessibility audit WCAG AA complete
- [x] Security penetration test passed (no critical findings)
- [x] RGPD compliance verified & legal approved
- [x] App Store + Play Store submitted & approved
- [x] Release notes published
- [x] Support team trained & monitoring live
- [x] 0 P1 bugs in production
- [x] NPS ≥50 from early testers

## 14.5 Milestone GA — General Availability (fin S10, Week 21)

**Criteria GO/NO-GO:**
- ✅ App Store approved & live
- ✅ Play Store approved & live
- ✅ 100% E2E tests passing
- ✅ Security & accessibility audits passed
- ✅ Performance targets achieved
- ✅ Support infrastructure ready
- ✅ Marketing launch ready
- ✅ Post-GA roadmap (Module 2, 3) defined

## 14.6 Risques Sprint 10

| # | Risque | Prob | Impact | Mit |
|---|--------|------|--------|-----|
| R10-1 | App Store rejection | Faible | Critique | Pre-submission review, Apple guidelines check |
| R10-2 | Detox flaky tests | Moyenne | Moyen | Robust waits, retry logic, local testing |
| R10-3 | Security issues found | Faible | Critique | Pentesting early (would move to S9) |
| R10-4 | Support overwhelmed | Faible | Moyen | Pre-GA internal testing, FAQ ready |

---

# SECTION 15: RELEASE PLAN & MILESTONES

## 15.1 Milestone Alpha (Semaine 4 — fin S1)
**Livrable:** Fondations auth + navigation

- ✅ Authentication opérationnel (email/password + biometric)
- ✅ Dashboard shell (4 tabs navigation)
- ✅ Settings screen fonctionnel
- ✅ Offline persistence (basic)

**Critères GO/NO-GO:**
- Signup/login works email + biometric (iOS + Android)
- No critical crashes on common flows
- Manual testing 5 internal testers approved
- **Decision:** GO → S2 commence

---

## 15.2 Milestone Beta (Semaine 10 — fin S3)
**Livrable:** Moteur opérationnel, testing externe débute

- ✅ PersonalFinanceEngine 10 étapes complet
- ✅ Transactions input (single + batch)
- ✅ Reporting (P1-P7 dashboards) lisible
- ✅ Offline sync functional
- ✅ 50+ internal testers invités
- ✅ Bug tracking (Jira) actif + triage daily

**Critères GO/NO-GO:**
- Engine performance <200ms/calc
- 0 P1 bugs (crashes, data loss)
- NPS ≥40 from beta feedback
- **Decision:** GO → S4 avec feature backlog intégré

---

## 15.3 Milestone RC — Release Candidate (Semaine 16 — fin S6)
**Livrable:** Feature complete, performance optimized, quality gates passed

- ✅ Tous dashboards (P1-P14) + Module 1 + 3 features
- ✅ Reporting waterfall complet + multi-devise
- ✅ Dark mode + i18n (EN, FR) complet
- ✅ WCAG AA accessibility passed
- ✅ Performance budget <2.5MB JS
- ✅ 200+ beta testers onboarded
- ✅ Bug count <10 (all <P2)
- ✅ Legal/Privacy review passed

**Critères GO/NO-GO:**
- Beta feedback NPS ≥55
- Retention >50% (weekly active users)
- Performance: LCP <2.5s, CLS <0.1
- **Decision:** GO → S7 final polish, NO-GO → escalate to PO

---

## 15.4 Milestone GA — General Availability (Semaine 21 — fin S10)
**Livrable:** Production-ready, submitted + approved App Stores

- ✅ App Store + Play Store approved & live
- ✅ E2E tests 100% passing (20+ scenarios)
- ✅ Security penetration test passed
- ✅ RGPD compliance verified
- ✅ Documentation + tutorials published
- ✅ Support + monitoring live
- ✅ 0 P1 bugs in production
- ✅ Marketing campaign launched

**Critères GO/NO-GO:**
- App Store review approved
- Play Store approved
- NPS ≥60 from testers
- **Decision:** GA launch announced, post-GA roadmap published

---

# SECTION 16: GESTION DES RISQUES

## 16.1 Matrice de Risques Consolidée

| # | Risque | Description | Prob | Impact | Score | Sprint | Mitigation |
|---|--------|-------------|------|--------|-------|--------|-----------|
| R1 | Engine perf | Calculs >500ms | Moyenne | Élevé | 6 | S3 | Spike S2 parallelization, worker threads, memoization |
| R2 | Offline sync loss | Data loss offline → online | Faible | Critique | 5 | S4-S8 | CDC audit trail, checksum verification, tested scenarios |
| R3 | Biometric fail | Auth fallback broken | Moyenne | Moyen | 4 | S1 | PIN fallback ready, re-auth flow, device testing |
| R4 | App Store rejection | Policy non-compliance | Faible | Élevé | 4 | S10 | Pre-submission review (Apple docs), legal check |
| R5 | OCR unavailable | Provider down | Élevée | Faible | 3 | S5 | Manual entry always available, fallback logic |
| R6 | Velocity miss | Team slower than planned | Moyenne | Moyen | 4 | All | 20% buffer, scope flexibility, daily standups |
| R7 | Supabase downtime | Cloud DB unavailable | Faible | Moyen | 2 | All | Offline-first architecture, cache strategy |
| R8 | Multi-currency rounding | Floating point errors | Faible | Faible | 1 | S2 | Integer cents (x100), ECB rate validation |
| R9 | Notification fatigue | User churn from alerts | Faible | Élevé | 4 | S9 | Tuning frequency, user feedback loop, A/B testing |
| R10 | Performance regression | JS bundle bloat | Moyenne | Moyen | 4 | S6-S10 | Budget enforcement (CI/CD), code reviews |
| R11 | Security breach | Data exposure | Faible | Critique | 5 | S10 | Penetration testing, encryption, RGPD compliance |
| R12 | Dark mode rendering | Colors untested | Moyenne | Moyen | 4 | S6 | Early design review, user testing, contrast audit |

## 16.2 Plan de Contingence par Risque

### R1: Engine Performance >500ms
**Contingency if breach:**
- Identify bottleneck via profiling (1 day)
- Implement Web Workers for Monte Carlo simulations (2 days)
- Memoize historical data calculations (1 day)
- Fallback: cache pre-calculated results (1 day)
- Escalate: reduce simulation sample size (100k → 10k) if still slow

### R2: Offline Sync Data Loss
**Contingency if detected:**
- Activate CDC audit trail logging (already in design)
- Provide manual conflict resolution UI
- Escalate: restore from Supabase backup (1-4 hours per user)
- Notify affected users immediately, offer compensation

### R3: Biometric Auth Failures
**Contingency if frequent:**
- Activate PIN fallback (design-ready)
- Provide email re-auth flow (existing design)
- Device fingerprint whitelist option (S2 spike)
- Support team escalation for repeated failures

### R4: App Store Rejection
**Contingency if happens:**
- Apple feedback review (4 hours)
- Fix implementation (1-3 days)
- Resubmit same day
- Fallback: TestFlight Extended Beta distribution (2 weeks)
- Escalate: legal/compliance review if policy issue

### R5: OCR Provider Unavailable
**Contingency:** No action needed (fallback manual entry always available)

### R6: Team Velocity Lower
**Contingency if -20% velocity:**
- Reduce scope: defer Optional stories (Multi-User, US 13.10)
- Extend timeline: sprint 0.5 (4 days) to catch up
- Bring in external contractor for non-core work (UI, testing)
- Escalate: re-negotiate milestone dates with PO

### R7: Supabase Downtime
**Contingency:** App fully functional offline; sync on recovery (design-ready)

### R8: Multi-Currency Rounding
**Contingency:** Integer cents model (x100) prevents this; no action needed

### R9: Notification Fatigue
**Contingency if churn detected:**
- A/B test message frequency (reduce 1/week → 1/month for test group)
- Implement smarter triggering (only if meaningful change)
- User survey: ask preferred notification frequency
- Toggle notifications per alert type (not just on/off)

### R10: Performance Regression
**Contingency if JS bundle >3MB:**
- Code split aggressive (route-based + component-based)
- Remove unused dependencies (audit)
- Tree-shake unused code (verify webpack config)
- Defer non-critical features to later bundle

### R11: Security Breach
**Contingency (critical):**
- Immediate: shut down service if data exfiltration confirmed
- Notify users + regulators (RGPD requirement <72h)
- Forensic investigation (external firm)
- Fix implementation (2-5 days typical)
- Re-launch with public statement

### R12: Dark Mode Rendering Issues
**Contingency if contrast fails:**
- Emergency color palette adjustment (1 day)
- User ability to override theme colors (settings)
- Revert to light-mode default for affected users

---

# SECTION 17: MÉTRIQUES DE SUIVI

## 17.1 KPIs de Projet

### Vélocité & Delivery
- **Sprint Velocity (SP/sprint):** Target 40 SP/sprint, track actual (burndown chart below)
- **Story Completion Rate (%):** % stories marked Done by sprint end
- **On-Time Delivery (%):** Sprints ending on schedule (no schedule creep)

### Quality Metrics
- **Bug Density:** Bugs per 1,000 lines of code (target <3 P1/P2 per sprint)
- **Test Coverage:** Unit + integration tests ≥85%
- **Build Success Rate:** % CI/CD builds passing (target ≥95%)
- **E2E Test Pass Rate:** % automated tests passing (target 100% before GA)

### Performance Metrics
- **Cycle Time:** Average days from story start → Done (target <5 days)
- **Lead Time:** Days from planning → deployment (target <14 days/sprint)
- **LCP (Largest Contentful Paint):** <2.5s (web vitals)
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1

### User Engagement (Beta)
- **DAU/MAU:** Daily + monthly active users
- **NPS (Net Promoter Score):** Target ≥50 (RC), ≥60 (GA)
- **Retention Rate:** % users returning 7/30 days later
- **Feature Usage:** % users per feature (identify underused features)

---

## 17.2 Burndown Chart (Projection 10 Sprints)

```
Sprint SP Capacity  |  Target SP Remaining  |  Actual Remaining
       (40/sprint)  |   (total 404 SP)      |   (cumulative)
----
S1     40           |   404 → 364 (90%)     |   TBD (Alpha gate)
S2     40           |   364 → 324 (80%)     |   TBD
S3     40           |   324 → 284 (70%)     |   TBD (BETA gate)
S4     40           |   284 → 244 (60%)     |   TBD
S5     40           |   244 → 204 (50%)     |   TBD (Sprint mid-point)
S6     40           |   204 → 164 (41%)     |   TBD (RC gate)
S7     40           |   164 → 124 (31%)     |   TBD
S8     40           |   124 → 84  (21%)     |   TBD
S9     32           |   84  → 52  (13%)     |   TBD
S10    32           |   52  → 0   (0%)      |   TBD (GA gate)
```

**Legend:** SP = Story Points, TBD = To Be Determined (actual tracking live)

---

## 17.3 Critères de Santé du Sprint

| Indicateur | Vert ✅ | Orange ⚠️ | Rouge ❌ |
|-----------|-------|---------|---------|
| **Vélocité** | ≥80% planifié | 60-80% | <60% |
| **Bugs P1/P2** | 0 | 1-2 | >2 bloquants |
| **Test Coverage** | ≥85% | 70-85% | <70% |
| **Build Success** | ≥98% | 90-98% | <90% |
| **Cycle Time** | <5 days | 5-7 days | >7 days |
| **NPS (Beta)** | ≥50 | 30-50 | <30 |
| **Retention (7d)** | >50% | 35-50% | <35% |
| **Performance** | LCP <2.5s | 2.5-3.5s | >3.5s |

**Action:** Orange = review in standup; Red = escalate PO + team discussion for mitigation

---

# SECTION 18: CÉRÉMONIES AGILE

## 18.1 Sprint Planning
- **Quand:** Lundi, 9h UTC (début nouvelle sprint)
- **Durée:** 2h (1h scope, 1h estimation)
- **Participants:** Team (7) + PO (Oncle) + Scrum Master (Bob)
- **Output:** Sprint backlog (Jira board finalisé) + sprint goal affiché
- **Agenda:**
  1. Review milestone criteria (5 min)
  2. PO presents backlog (15 min)
  3. Team estimates with planning poker (30 min)
  4. Final capacity check: 40 SP target (5 min)
  5. Commit to sprint goal (5 min)

## 18.2 Daily Standup
- **Quand:** Chaque jour ouvrable, 9h30 UTC
- **Durée:** 15 min max (strict timebox)
- **Format:** Asynchronous option (Slack thread) if timezone issues
- **3 questions per person:**
  1. What I completed yesterday
  2. What I'll work on today
  3. Blockers or help needed
- **Output:** Jira status update, blocker escalation

## 18.3 Sprint Review / Demo
- **Quand:** Dernier vendredi sprint, 15h UTC
- **Durée:** 1h
- **Participants:** Team + PO + Stakeholders (investors, partners)
- **Format:**
  1. Demo: each team member shows completed work (40 min)
  2. Feedback: stakeholder questions + suggestions (15 min)
  3. Metrics review: velocity, bugs, NPS (5 min)
- **Output:** Feedback captured in backlog, backlog refinement meeting scheduled

## 18.4 Rétrospective (Retro)
- **Quand:** Après Sprint Review, même jour 16h15 UTC
- **Durée:** 45 min
- **Format:** Start/Stop/Continue (Miro board)
  - **Start:** What should we begin doing next sprint?
  - **Stop:** What should we stop doing?
  - **Continue:** What's working well, keep doing?
- **Output:** 2-3 action items for next sprint (assigned to individuals)
- **Example actions:** "Bob: schedule performance profiling workshop", "Team: stricter PR review SLA"

## 18.5 Backlog Refinement (Grooming)
- **Quand:** Mid-sprint (Thursday), 14h UTC
- **Durée:** 1h
- **Participants:** Team (5-6) + PO
- **Agenda:**
  1. Review next sprint's top 10 stories (acceptance criteria clarity)
  2. T-shirt sizing (S/M/L) before formal estimation
  3. Identify blockers + dependencies
  4. Split large stories (>13 SP) if needed
- **Output:** Backlog for next sprint ready for planning

---

# SECTION 19: VALIDATION DU SPRINT PLANNING

## 19.1 Checklist de Complétude du Plan

### Coverage
- [x] **11 EPICs couverts:** EPIC 1-3, 5-11 (4 sprints minimum overlap)
  - EPIC 1 (Auth/Nav): S1-S2
  - EPIC 2 (Engine): S2-S3
  - EPIC 3 (Dashboards): S1-S7 (continuous)
  - EPIC 5 (Transactions): S2-S4
  - EPIC 6 (Portfolio): S2-S3
  - EPIC 7 (EPR/Journal): S4
  - EPIC 8 (Waterfall): S5-S6
  - EPIC 9 (Reporting): S6
  - EPIC 10 (Performance): S7
  - EPIC 11 (Calendar): S8
  - Push/Exports/Freemium: S9

- [x] **92+ User Stories distributed:**
  - S1: 12 US (Auth, Nav, Foundation)
  - S2: 16 US (Engine prep, screens)
  - S3: 14 US (Engine, reporting, KPI)
  - S4: 12 US (Journal, EPR, cards)
  - S5: 10 US (Waterfall, recap, OCR spike)
  - S6: 10 US (Reporting, i18n, a11y)
  - S7: 10 US (Performance center)
  - S8: 8 US (Calendar, offline sync)
  - S9: 8 US (Notifications, exports, freemium)
  - S10: 8 US (E2E, security, GA)

- [x] **~404 SP distributed across 10 sprints:**
  - Total: 10×40 + 0×32 = 400 SP capacity available
  - Planned: 404 SP (1% buffer for high-confidence items)
  - Contingency: 20% scope flex (defer optional stories)

### Milestones & Gates
- [x] **4 release milestones defined with GO/NO-GO criteria:**
  - S1 (Alpha): Auth + nav functional
  - S3 (Beta): Engine opérationnel, 50+ testers
  - S6 (RC): Feature complete, performance optimized
  - S10 (GA): App Store + Play Store approved

### Dependencies & Sequencing
- [x] **Critical path identified:**
  - S1 → S2 (Auth prerequisite for engine)
  - S2 → S3 (Engine prep before implementation)
  - S3 → S4 (Moteur done before EPR)
  - S4-S8 (Offline sync dependency)
  - S10 (E2E + security final gate)

- [x] **No circular dependencies detected**
- [x] **High-risk items sequenced early:**
  - Engine performance (S2 spike, S3 implementation)
  - Offline sync (S2 design, S4-S8 implementation)
  - App Store compliance (S10 final, but design from S1)

### Risk Management
- [x] **12 major risks identified with probabilities & mitigations**
- [x] **Contingency plans documented for 8 critical risks**
- [x] **20% scope buffer integrated (optional stories backlog)**
- [x] **Escalation path clear (daily standups, sprint reviews)**

### Quality Standards
- [x] **Definition of Ready (DoR) defined:**
  - User story has acceptance criteria
  - Acceptance criteria are testable
  - Story <= 13 SP (or split)
  - Blockers identified

- [x] **Definition of Done (DoD) defined:**
  - Code committed & reviewed (≥1 approval)
  - Unit tests written & passing
  - Integrated with main
  - PR merged
  - QA tested (manual)
  - Documentation updated (inline + Confluence)

### Agile Ceremonies
- [x] **5 ceremonies scheduled & documented:**
  1. Sprint Planning (2h, Mondays)
  2. Daily Standup (15m, every weekday)
  3. Sprint Review (1h, Fridays)
  4. Retrospective (45m, Fridays)
  5. Backlog Refinement (1h, mid-sprint Thursdays)

### Team Capacity
- [x] **5-7 engineers assigned (mix skills)**
  - 3-4 Mobile (React Native/Expo)
  - 1-2 Backend (Node.js/Supabase)
  - 1 QA (testing + E2E automation)
  - 1 Scrum Master (Bob, process + coordination)

- [x] **Velocity realistic:** 40 SP/sprint (based on team size + complexity)
- [x] **Holidays/OOO accounted:** None planned S1-S10 (escalate if detected)

---

## 19.2 Approbation Formelle

| Rôle | Nom/Responsable | Signature | Date | Statut |
|------|-----------------|-----------|------|--------|
| **Project Owner** | LELE / Oncle | ____________ | 2025-02-07 | ⏳ **EN ATTENTE** |
| **Scrum Master** | Bob (BMAD) | ____________ | 2025-02-07 | ✅ **VALIDÉ** |
| **Architecte Technique** | Winston (BMAD) | ____________ | 2025-02-07 | ✅ **ALIGNÉ** |
| **Product Manager** | John (BMAD) | ____________ | 2025-02-07 | ✅ **ALIGNÉ** |
| **QA Lead** | [TBD] | ____________ | [TBD] | ⏳ EN ATTENTE |

### Notes d'Approbation
- **Bob (Scrum Master):** Plan is realistic, ceremonies well-defined, risk mitigations solid. Ready for execution.
- **Winston (Architect):** Technical architecture aligns with sprint sequencing. Engine spike (S2) critical; ensure resources dedicated.
- **John (PM):** Feature backlog prioritization aligns with PRD. Milestone definitions match go-to-market timeline.

---

# SECTION 20: ANNEXE — TEMPLATES & REFERENCES

## 20.1 User Story Template (pour chaque sprint)
```
**US X.Y:** [Feature Title]

**Epic:** [EPIC #]
**Story Points:** [5-13]
**Complexity:** [Bas/Moyen/Haute/Très haute]
**Priority:** [P0/P1/P2/P3]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Technical Notes:**
- Technology stack relevant
- Known blockers or dependencies

**Testing Strategy:**
- Unit tests: ...
- Integration tests: ...
- Manual testing: ...

**Definition of Ready:**
- [ ] Acceptance criteria clear & testable
- [ ] Story Points assigned
- [ ] No unknowns

**Definition of Done:**
- [ ] Code written & reviewed
- [ ] Tests written & passing
- [ ] Merged to main
- [ ] Documented
- [ ] QA approved
```

## 20.2 Sprint Health Dashboard (template for daily tracking)
```
**Sprint #:** [1-10]
**Date:** [YYYY-MM-DD]

| Metric | Target | Actual | Status | Notes |
|--------|--------|--------|--------|-------|
| SP Completed | 40 | -- | | |
| Bugs P1 | 0 | -- | | |
| Bugs P2 | <3 | -- | | |
| Build Success | ≥95% | -- | | |
| Test Coverage | ≥85% | -- | | |
| Blockers | 0 | -- | | |
| Team Velocity | 40 | -- | | |

**Actions:** [List any escalations needed]
```

---

**Document Author:** Bob, Scrum Master
**Methodology:** BMAD (Balanced Multi-Agile Development)
**Project:** LELE PFM (Personal Finance Management)
**Version:** 2.0 (PART 2: S3-S10)
**Last Updated:** 2025-02-07
**Next Review:** Post-S1 (results vs plan)

---

*This document is CONFIDENTIAL and for LELE internal use only. Unauthorized reproduction or distribution is prohibited.*
