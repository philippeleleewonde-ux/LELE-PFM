# LELE PFM — Product Requirements Document (PRD)

**Product Manager:** John (Phase PM — BMAD v6.0.0-alpha.22)
**Projet:** LELE PFM — Personal Finance Management
**Date:** 7 février 2026
**Version:** 1.0
**Basé sur:** 38 sections d'analyse fonctionnelle validées par le Project Owner
**Architecture:** Mobile-First (iOS + Android) — Phase 1

---

## TABLE DES MATIÈRES

1. Énoncé du Problème
2. Objectifs
3. Non-Objectifs
4. Architecture Technique Mobile-First
5. Exigences Non-Fonctionnelles
6. Métriques de Succès
7. **EPIC 1-3 : Module 1 — Personal Financial Planner**
8. **EPIC 4-11 : Module 3 — Personal Savings Engine**
9. Considérations Timeline
10. Questions Ouvertes

---

## 1. ÉNONCÉ DU PROBLÈME

### Situation Actuelle
Les individus gèrent leurs finances de manière **réactive** : outils de budgétisation basiques, feuilles de calcul manuelles, ou absence complète de suivi structuré. Les particuliers ne disposent **pas** de la puissance analytique que les entreprises utilisent pour l'optimisation financière.

### Solution Proposée
**LELE PFM** transpose le moteur analytique **enterprise-grade** du **LELE HCM Portal V3** (React 18 + TypeScript + Supabase) vers le domaine des finances personnelles, en application mobile native iOS + Android.

### 12 Profils Cibles

| # | Profil PFM | Taux UL | Proba × Impact |
|---|-----------|---------|----------------|
| 1 | Entrepreneur / Startup | 20% | 20% × 100% |
| 2 | Freelance / Indépendant | 16% | 40% × 40% |
| 3 | Investisseur actif / Trader | 12% | 80% × 15% |
| 4 | Artisan / Commerçant | 10.5% | 15% × 70% |
| 5 | Salarié CDD / Intérim | 8.75% | 25% × 35% |
| 6 | Cadre supérieur / Dirigeant | 5% | 10% × 50% |
| 7 | Salarié CDI secteur privé | 3% | 5% × 60% |
| 8 | Professionnel libéral | 1.5% | 3% × 50% |
| 9 | Salarié grande entreprise | 1.2% | 3% × 40% |
| 10 | Fonctionnaire / Secteur public | 0.15% | 0.5% × 30% |
| 11 | Retraité avec pension | 0.1% | 1% × 10% |
| 12 | Étudiant / Sans revenu fixe | 6% | 30% × 20% |

### Impact de l'Inaction
Sans résoudre ce problème, les utilisateurs continuent à perdre de l'argent sur des budgets mal structurés, manquent de visibilité sur leur Potentiel d'Optimisation Budgétaire (POB), n'ont aucune quantification de risque personnel, et fonctionnent en mode réactif plutôt que stratégique.

---

## 2. OBJECTIFS

| # | Objectif | Cible | Mesure |
|---|---------|-------|--------|
| G1 | Adhérence hebdomadaire au suivi budgétaire | ≥ 75% des WAU | Semaines complétées / semaines élapsées |
| G2 | Réalisation du POB en 12 mois | ≥ 45% | Économies réelles / POB identifié |
| G3 | Amélioration EKH (Score Compétence Financière) en 6 mois | +12 points | Progression EKH pré/post |
| G4 | App Store rating | ≥ 4.5 étoiles | iOS + Google Play (après 500+ avis) |
| G5 | Rétention MAU à M+3 | ≥ 60% | Cohorte installation |

---

## 3. NON-OBJECTIFS

| # | Non-Objectif | Raison | Roadmap |
|---|-------------|--------|---------|
| NG1 | Agrégation bancaire automatique (open banking) | Complexité réglementaire PSD2 | V2 (Plaid/Yapstone) |
| NG2 | Conseil financier personnalisé | Implications réglementaires CNCIF | V2+ (robo-advisor) |
| NG3 | Version desktop | Mobile-first = acquisition + engagement max | Phase 2 (PWA desktop) |
| NG4 | Internationalisation multi-langue | Prioriser profondeur FR | V2 (EN, ES, DE, IT) |
| NG5 | Multi-utilisateur familial | Ajout architectural significatif | V2 (partage partenaire) |

---

## 4. ARCHITECTURE TECHNIQUE MOBILE-FIRST

### Stack Recommandée

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Framework Mobile | **React Native (Expo)** | Réutilisation TypeScript HCM, écosystème mature |
| Backend | **Supabase** (PostgreSQL + Auth + Edge Functions + RLS) | Identique au HCM, infrastructure éprouvée |
| Stockage Local | **WatermelonDB / SQLite** | Sync offline, performances 10K+ transactions |
| Moteur Analytique | **PersonalFinanceEngine** (100% client-side TypeScript) | Réutilisable du HCM, confidentialité |
| Navigation | React Navigation v6 | Standard React Native |
| Animations | React Native Animated API | Remplace framer-motion (web) |
| Notifications | APNs (iOS) + FCM (Android) | Push notifications natives |

### Capacités Mobiles Natives

| Capacité | Détail |
|----------|--------|
| **Biométrie** | Face ID, Touch ID, Fingerprint (fallback PIN 6 digits) |
| **Widget Home Screen** | Résumé budget hebdomadaire (iOS 14+ / Android 12+) |
| **Saisie Rapide** | Accès < 10 secondes depuis raccourci |
| **Push Notifications** | Alertes budget, rappels Kakeibo hebdomadaires, alertes waterfall |
| **Mode Offline** | Saisie complète sans connexion, sync on reconnect |
| **OCR Receipt Scan** | Scan tickets/reçus (fournisseur TBD) |
| **Haptic Feedback** | Retour tactile validation/verrouillage |

### Données Clés

| Aspect | Spécification |
|--------|--------------|
| Multi-tenant | Schema-per-user (RLS Supabase enforced) |
| Granularité | **Hebdomadaire** (52 semaines/an, méthode Kakeibo) |
| Devises | 48 devises supportées (identique HCM) |
| Pattern événementiel | CalendarEventBus (DATA_ENTERED, CONFIG_UPDATED, PERIOD_LOCKED) |
| Performance | VirtualizedList 10K+ transactions, async chunk calculation |

---

## 5. EXIGENCES NON-FONCTIONNELLES

### Performance
| ID | Exigence | Cible |
|----|---------|-------|
| PER-001 | Lancement app (cold start) | < 2 secondes |
| PER-002 | Entrée transaction (tap → save) | < 10 secondes |
| PER-003 | Calcul hebdomadaire POB/EKH | < 500ms |
| PER-004 | Sync offline (50 transactions) | < 2 secondes |

### Sécurité
| ID | Exigence | Cible |
|----|---------|-------|
| SEC-001 | Authentification | Biometric + PIN fallback |
| SEC-002 | Chiffrement au repos | AES-256-GCM |
| SEC-003 | Chiffrement en transit | TLS 1.3 minimum |
| SEC-004 | Données financières | Zéro stockage clair |

### Accessibilité
| ID | Exigence | Cible |
|----|---------|-------|
| ACC-001 | Standard | WCAG 2.1 Level AA |
| ACC-002 | Screen readers | VoiceOver / TalkBack 100% écrans |
| ACC-003 | Dynamic text | Support 100%-200% |

### Confidentialité
| ID | Exigence | Cible |
|----|---------|-------|
| PRIV-001 | RGPD | Conformité complète |
| PRIV-002 | Local-first | Données sensibles jamais en cloud non chiffré |
| PRIV-003 | Partage tiers | Zéro partage |

### Scalabilité
| ID | Exigence | Cible |
|----|---------|-------|
| SCA-001 | Capacité transactions | 13,000 (5 ans × 52 sem × ~50/sem) |
| SCA-002 | Multi-devise | 48 devises |
| SCA-003 | i18n ready | Clés t('key') partout, V1 = FR |

---

## 6. MÉTRIQUES DE SUCCÈS

### Leading Indicators (réactifs)
| Métrique | Cible | Fréquence |
|----------|-------|-----------|
| WAU (Weekly Active Users) | +20% MoM M0-M3 | Quotidienne |
| Transactions/semaine | ≥ 15 par user | Hebdomadaire |
| % semaines complétées | ≥ 75% | Hebdomadaire |
| D1 retention | ≥ 45% | Quotidienne |

### Lagging Indicators (impact réel)
| Métrique | Cible | Fréquence |
|----------|-------|-----------|
| Amélioration taux épargne | +3.5% en 6 mois | Mensuelle |
| POB realization rate | ≥ 45% à M12 | Trimestrielle |
| Progression EKH | +12 points médiane | Trimestrielle |
| NPS | ≥ +35 à M6 | Mensuelle |
| App Store rating | ≥ 4.5 étoiles | Continu |

---


---

# PARTIE II — MODULE 1 : PERSONAL FINANCIAL PLANNER

# LELE PFM - PRD MODULE 1
## Personal Financial Planner
**Version:** 1.0
**Date:** 2026-02-07
**Product Manager:** John
**Méthodologie:** BMAD

---

## CONTEXTE MODULE 1

Le Module 1 "Personal Financial Planner" transpose les 18 pages HCM V3 en 16 pages PFM mobile-first (iOS + Android). Cette section couvre la configuration initiale du profil financier utilisateur, le moteur de calcul propriétaire et les 9 pages de reporting consolidé.

**Périmètre:**
- **EPIC 1:** Configuration Financière (Pages 1-6) - Profil, revenus/dépenses, historique, risques, auto-évaluation, leviers
- **EPIC 2:** Moteur de Calcul PersonalFinanceEngine (10 étapes) - Calculs probabilistes et distribution
- **EPIC 3:** Pages de Reporting (Pages 7-15) - Dashboards, plans, visualisations, export

**Contraintes Transversales:**
- Devise par défaut: EUR
- Langue: Français
- 4 types de transactions: Fixe, Variable, Imprévue, Versement Épargne-Dette
- EKH = Score Compétence Financière = CALCULÉ (jamais saisi)
- Granularité: Hebdomadaire (52 semaines/an)
- Note finale: (économies/objectif)×10, Grades A+ à E
- Formule conservée: (F1+F2+F3)/63×100
- capRealToPrevu() = Math.min(réalisé, prévu)

---

# EPIC 1: PROFIL & CONFIGURATION FINANCIÈRE
## Pages 1-6

---

## PAGE 1: PROFIL FINANCIER PERSONNEL

### Périmètre
Configuration initiale du profil utilisateur avec 12 profils pré-définis, situation familiale, pays de résidence et devise opérationnelle.

---

### User Story 1.1: Créer un profil financier initial

**En tant que** nouvel utilisateur,
**Je veux** sélectionner mon profil type et configurer ma situation familiale,
**Afin de** personnaliser les calculs et recommandations selon mon contexte.

#### Acceptance Criteria:
- [ ] Affichage de 12 profils avec icônes et descriptions (Salariat régulier, Freelance, Entrepreneur, Retraité, Étudiant, Parent monoparental, Couple biactif, Couple monoactif, Investisseur, PME/Dirigeant, Professions libérales, Commerçant)
- [ ] Possibilité de sélectionner un profil avec confirmation de bascule
- [ ] Saisie de la situation familiale: Célibataire, Marié(e), PACS, Concubinage, Divorcé(e), Veuf(ve)
- [ ] Champ "Nombre de personnes à charge" (0-5+)
- [ ] Sauvegarde du choix en base de données
- [ ] Message de confirmation "Profil créé: [Profil] - [Situation familiale] avec [N] personne(s) à charge"

---

### User Story 1.2: Configurer pays de résidence et devise

**En tant que** utilisateur avec profil créé,
**Je veux** spécifier mon pays de résidence et sélectionner ma devise opérationnelle,
**Afin que** tous les calculs s'effectuent dans la bonne monnaie et contexte fiscal/réglementaire.

#### Acceptance Criteria:
- [ ] Sélecteur de pays avec recherche (autocomplete) - défaut: France
- [ ] Affichage de la devise associée au pays (ex: FR → EUR)
- [ ] Possibilité de forcer une devise différente (multidevise)
- [ ] Validation du couple (pays, devise) et persistance
- [ ] Format d'affichage monétaire en fonction de la devise (ex: EUR avec séparateur virgule pour décimales)
- [ ] Affichage du taux de change actuel si devise ≠ EUR (mise à jour quotidienne)

---

### User Story 1.3: Modifier et valider le profil financier

**En tant que** utilisateur avec profil complété,
**Je veux** revenir à cette page pour mettre à jour mon profil, situation familiale ou devise,
**Afin que** mon application reste synchronisée avec mes changements de vie.

#### Acceptance Criteria:
- [ ] Bouton "Modifier" accessible sur chaque champ (Profil, Situation, Pays, Devise)
- [ ] Modal ou écran de modification avec pré-remplissage
- [ ] Validation des changements sans perte de données (transaction atomique)
- [ ] Historique des modifications stocké (audit trail)
- [ ] Alerte si modification de profil impact les données saisies (ex: passage Salariat → Freelance)
- [ ] Bouton "Enregistrer" avec confirmation

---

## PAGE 2: REVENUS & DÉPENSES

### Périmètre
Configuration des 8 sources de revenus max et 8 postes de dépenses max, catégorisation COICOP ONU, calcul HHI concentration, reste-à-vivre mensuel.

---

### User Story 2.1: Saisir revenus multiples et calculer HHI concentration

**En tant que** utilisateur avec revenu(s),
**Je veux** entrer jusqu'à 8 sources de revenus distinctes (salaire, freelance, rentes, dividendes, etc.),
**Afin que** le moteur calcule l'indice HHI de concentration et m'alerte sur les risques de dépendance.

#### Acceptance Criteria:
- [ ] Formulaire pour 8 postes de revenus max, avec champs: Type (Fixe/Variable), Montant mensuel, % progressif (défaut 0%), Variation Q1-Q4 (%) ou commentaire
- [ ] Types proposés: Salaire, Freelance, Rentes, Dividendes, Plus-values, Pension, Allocation, Autres
- [ ] Calcul automatique du TOTAL REVENUS (somme mensuelle)
- [ ] Calcul HHI = Σ(Yi/Ytotal)² × 10000, affichage: "HHI: [valeur]" avec seuil d'alerte >3500
- [ ] Alerte si HHI >3500: "⚠️ Concentration élevée. Diversifiez vos sources de revenus."
- [ ] Sauvegarde et validation: Au moins 1 revenu obligatoire
- [ ] Affichage: "Total revenus: [montant] EUR/mois | HHI: [valeur] | Dépendance: [niveau]"

---

### User Story 2.2: Saisir dépenses avec catégories COICOP ONU

**En tant que** utilisateur,
**Je veux** entrer jusqu'à 8 postes de dépenses avec catégories COICOP ONU (8 catégories nationales),
**Afin de** structurer mon budget et alimenter le calcul du reste-à-vivre.

#### Acceptance Criteria:
- [ ] Affichage des 8 catégories COICOP ONU: Alimentation, Transport, Logement, Santé, Loisirs, Éducation, Assurances, Autres
- [ ] Pour chaque poste (max 8): Catégorie (obligatoire), Montant mensuel, Type (Fixe/Variable), Variation (%), Notes
- [ ] Calcul automatique du TOTAL DÉPENSES (somme mensuelle)
- [ ] Reste-à-vivre = Total Revenus - Total Dépenses, affiché en grande police
- [ ] Alerte si Reste-à-vivre <0: "🔴 Déficit mensuel de [montant]. Ajustez vos dépenses."
- [ ] Alerte si Reste-à-vivre 0-500 EUR: "🟡 Marge faible. Envisagez d'augmenter revenus ou réduire dépenses."
- [ ] Validation: Au moins 1 dépense ou message "Pas de dépenses saisies"
- [ ] Affichage final: "Total dépenses: [montant] EUR/mois | Reste-à-vivre: [montant] EUR/mois"

---

### User Story 2.3: Gérer et simuler modifications revenus/dépenses

**En tant que** utilisateur avec budgets saisis,
**Je veux** modifier rapidement un revenu ou une dépense et voir l'impact sur le reste-à-vivre en temps réel,
**Afin de** tester différents scénarios financiers.

#### Acceptance Criteria:
- [ ] Édition inline (swipe ou clic) pour chaque ligne revenu/dépense
- [ ] Recalcul immédiat: Total Revenus, Total Dépenses, HHI, Reste-à-vivre
- [ ] Affichage d'un delta (Δ) en vert/rouge pour les changements
- [ ] Bouton "Simuler réduction dépenses" proposant -5%, -10%, -20%
- [ ] Bouton "Simuler augmentation revenus" proposant +5%, +10%, +15%
- [ ] Résumé de la simulation: "Scénario: Reste-à-vivre passant de [ancien] à [nouveau]"
- [ ] Possibilité d'annuler modifications ou les valider

---

## PAGE 3: HISTORIQUE FINANCIER

### Périmètre
Saisie optionnelle d'historique 3-5 ans, engagement financier, pré-remplissage automatique depuis P2.

---

### User Story 3.1: Charger l'historique financier depuis 3-5 ans

**En tant que** utilisateur,
**Je veux** optionnellement saisir ou importer mon historique financier sur 3-5 années antérieures,
**Afin que** le moteur de calcul dispose de données historiques pour affiner prévisions et détection d'anomalies.

#### Acceptance Criteria:
- [ ] Formulaire optionnel (non bloquant) avec: Année, Montant revenus annuels, Montant dépenses annuels
- [ ] Jusqu'à 5 années antérieures (N-1 à N-5)
- [ ] Champs: Année (liste déroulante 2021-2025), Total Revenus Annuels, Total Dépenses Annuelles
- [ ] Pré-remplissage: Si données P2 existent, proposer historique extrapolé (x12 pour annualisé)
- [ ] Bouton "Importer fichier CSV" avec template téléchargeable
- [ ] Validation: Au moins 1 année historique pour accéder au moteur
- [ ] Affichage de tendance: "Revenus en ▲ +3% vs année précédente" ou "▼"
- [ ] Stockage en base de données avec tampon temporel

---

### User Story 3.2: Saisir engagement financier et obligations

**En tant que** utilisateur,
**Je veux** déclarer mes engagements financiers (emprunts, crédits, loyers longs termes),
**Afin que** le moteur intègre ces éléments fixes dans le calcul du risque de défaillance.

#### Acceptance Criteria:
- [ ] Formulaire: Engagement (Type: Emprunt/Crédit/Loyer long terme), Montant mensuel, Durée restante (mois), Taux intérêt (%)
- [ ] Max 5 engagements
- [ ] Calcul du ratio "Dépenses fixes / Revenus" avec intégration engagements
- [ ] Alerte si ratio >60%: "⚠️ Charges fixes élevées. Capacité de manœuvre limité."
- [ ] Validation atomique: Au moins 1 engagement ou skip optionnel
- [ ] Affichage: "Total engagements: [montant]/mois | Ratio stabilité: [%]"

---

### User Story 3.3: Valider et confirmer historique avant passage au moteur

**En tant que** utilisateur,
**Je veux** confirmer que mes données P1, P2, P3 sont correctes avant de lancer les calculs,
**Afin de** garantir l'intégrité des résultats du PersonalFinanceEngine.

#### Acceptance Criteria:
- [ ] Page de synthèse: "Vérifiez vos données"
  - Profil + Situation familiale
  - Revenus total + HHI
  - Dépenses total + Reste-à-vivre
  - Historique (années saisies)
  - Engagements
- [ ] Boutons "Modifier" pour chaque section renvoyant à la page correspondante
- [ ] Bouton "Confirmer et continuer" activant P4
- [ ] Checksum de validation (hash des données)
- [ ] Message: "✅ Données validées. Passage à l'étape suivante..."

---

## PAGE 4: RISK DATA PERSONNEL

### Périmètre
3 champs zone 1 (identifiants), 6 catégories risque avec saisie guidée, auto-estimation longévité.

---

### User Story 4.1: Déclarer les données de risque zone 1 et catégorise risques

**En tant que** utilisateur,
**Je veux** remplir les données de risque (situation professionnelle, santé, stabilité) avec questions guidées,
**Afin que** le moteur évalue mes risques personnalisés (perte emploi, santé, stabilité résidentielle).

#### Acceptance Criteria:
- [ ] **Zone 1 (3 champs identifiants):**
  - Âge actuel (années) - champ numérique avec validation 18-99
  - Horizon temporel de planification (années) - 1, 3, 5, 10, 20, 30
  - Pays (pré-rempli P1)

- [ ] **6 Catégories de Risque (saisie guidée par questions):**
  1. **Risque Emploi** - Question: "Stabilité contrat" (CDI, CDD <2ans, CDD >2ans, Indépendant, Sans emploi) + "Secteur risque" (Oui/Non)
  2. **Risque Santé** - Question: "État santé" (Excellent, Bon, Moyen, Mauvais) + "Affections chroniques" (Oui/Non)
  3. **Risque Résidentiel** - Question: "Situation logement" (Propriétaire, Locataire, Autre) + "Stabilité loyer/charge" (Stable, Volatilité <±20%, >±20%)
  4. **Risque Familial** - Question: "Situations à risque" (Aucune, Séparation possible, Autres dépendants, Plusieurs)
  5. **Risque Endettement** - Question: "Ratio Dettes/Revenus" (Auto-calculé depuis P2)
  6. **Risque Inflation** - Question: "Adaptation salaire à inflation" (Automatique, Régulière, Rare, Jamais)

- [ ] Chaque question avec radio buttons ou toggle (Oui/Non avec explications en tooltip)
- [ ] Score de risque par catégorie: 1-5 (Très faible à Très élevé) calculé selon réponses
- [ ] Affichage des scores avec codes couleur: 1-2 vert, 3 jaune, 4-5 rouge
- [ ] Persistance des réponses en base

---

### User Story 4.2: Auto-estimer sa longévité et horizon temporel

**En tant que** utilisateur,
**Je veux** auto-estimer ma longévité probable (espérance de vie personnalisée) basée sur mes données,
**Afin que** le moteur ajuste l'horizon de planification et calcule les risques long terme.

#### Acceptance Criteria:
- [ ] Question: "Antécédents familiaux longévité" (Parents <75, 75-85, 85-95, >95)
- [ ] Question: "Habitudes de vie" (Sédentaire, Modérée, Active, Très active)
- [ ] Question: "Antécédents santé personnels" (cf. P4 Risque Santé)
- [ ] Calcul auto: Longévité estimée = Espérance nationale + ajustement (-15 à +15 ans selon réponses)
- [ ] Affichage: "Horizon de planification estimé: [Longévité] ans (âge [Âge actuel + Horizon])"
- [ ] Alerte si horizon <5ans: "⚠️ Horizon court. Stratégie conservative recommendée."
- [ ] Alerte si horizon >40ans: "✅ Horizon long. Potentiel d'accumulation élevé."
- [ ] Persistance du calcul

---

### User Story 4.3: Valider profil risque et générer score synthétique

**En tant que** utilisateur,
**Je veux** valider mon profil de risque global avant passage au moteur,
**Afin de** confirmer que les risques identifiés sont correctement représentés.

#### Acceptance Criteria:
- [ ] Synthèse des 6 catégories risque avec notation 1-5 et codes couleur
- [ ] Score synthétique: Moyenne arithmétique des 6 scores (1-5)
- [ ] Profil synthétique: "Profil risque [Conservative/Modéré/Agressif]" selon score moyen
- [ ] Radar visuel 5D (si ≥3 risques) montrant la distribution
- [ ] Bouton "Modifier risques" renvoyant à questions spécifiques
- [ ] Bouton "Confirmer et continuer" validant P4 et passant à P5
- [ ] Message: "✅ Profil risque enregistré. Score: [valeur]/5.0"

---

## PAGE 5: AUTO-ÉVALUATION COMPÉTENCES FINANCIÈRES

### Périmètre
6 questions d'auto-évaluation maîtrise financière (échelle 1-5), détection incohérence P4×P5.

---

### User Story 5.1: Répondre aux 6 questions d'auto-évaluation financière

**En tant que** utilisateur,
**Je veux** auto-évaluer ma maîtrise financière sur 6 domaines clés (échelle 1-5),
**Afin que** le système détecte les incohérences entre mon risque perçu et ma compétence réelle.

#### Acceptance Criteria:
- [ ] **6 Domaines d'auto-évaluation (réversés vs HCM pour PFM):**
  1. "Maîtrise du budget personnel (suivi recettes/dépenses)" - 1 (Faible) à 5 (Excellent)
  2. "Connaissance des produits financiers (assurance, épargne, crédit)" - 1-5
  3. "Gestion des risques financiers (diversification, couverture)" - 1-5
  4. "Planification financière long terme" - 1-5
  5. "Discipline épargne et investissement" - 1-5
  6. "Compréhension des impôts et obligations sociales" - 1-5

- [ ] Interface: Curseur (slider) 1-5 pour chaque domaine, avec labels (Faible, Moyen, Bon, Très Bon, Expert)
- [ ] Affichage en temps réel: Moyenne EKH = (Q1+Q2+Q3+Q4+Q5+Q6)/6
- [ ] Calcul automatique EKH (Score Compétence Financière), jamais saisi directement
- [ ] Persistance en base avec tampon temporel
- [ ] Affichage: "EKH (Compétence Financière): [valeur]/5.0"

---

### User Story 5.2: Détecter et signaler incohérences P4×P5

**En tant que** système,
**Je veux** analyser automatiquement les incohérences entre profil risque (P4) et compétence auto-déclarée (P5),
**Afin d'** alerter l'utilisateur sur des profils suspects ou contradictoires.

#### Acceptance Criteria:
- [ ] **Règles d'incohérence:**
  - Si Score Risque P4 ≥4 (élevé) ET EKH P5 ≥4 (expert) → Alerte: "⚠️ Vous déclarez expert malgré risques élevés. Revérifiez vos données."
  - Si Score Risque P4 ≤2 (faible) ET EKH P5 ≤1 (faible) → Suggestion: "Vous pouvez augmenter votre horizon de planification."
  - Si Écart (Risque - EKH) ≥2.5 → Alerte modérée: "Écart détecté entre votre profil risque et compétences."

- [ ] Affichage des alertes en modal avant confirmation
- [ ] Bouton "Réviser mes réponses" renvoyant à P4 ou P5
- [ ] Bouton "Continuer malgré tout" confirmant les données incohérentes
- [ ] Log de l'incohérence détectée (audit trail)

---

### User Story 5.3: Valider auto-évaluation et synchroniser avec moteur

**En tant que** utilisateur,
**Je veux** confirmer que mes auto-évaluations sont correctes avant lancement des calculs,
**Afin de** garantir que le PersonalFinanceEngine utilise l'EKH correct.

#### Acceptance Criteria:
- [ ] Synthèse: "Auto-évaluation financière"
  - 6 domaines avec scores
  - EKH calculé et affiché
  - Incohérences éventuelles listées
- [ ] Bouton "Modifier les réponses" (renvoi à P5.1)
- [ ] Bouton "Confirmer et lancer calculs" validant atomiquement
- [ ] Message: "✅ Auto-évaluation confirmée. EKH: [valeur]/5.0. Lancement moteur..."
- [ ] Flag de passage à EPIC 2 (PersonalFinanceEngine)

---

## PAGE 6: LEVIERS D'AMÉLIORATION

### Périmètre
6 leviers configurables, priorité 1-5, alimentation des étapes 9-10 du moteur.

---

### User Story 6.1: Sélectionner et prioriser 6 leviers d'amélioration

**En tant que** utilisateur,
**Je veux** choisir jusqu'à 6 leviers d'amélioration financière et les prioriser (1-5),
**Afin que** le moteur alimente les distributions d'économies (étapes 9-10) selon mes priorités.

#### Acceptance Criteria:
- [ ] **6 Leviers disponibles (checklist sélectionnable):**
  1. Réduction dépenses courantes (alimentation, transport, loisirs)
  2. Optimisation assurances (meilleur tarif, couverture adaptée)
  3. Augmentation revenus (promotion, activité complémentaire)
  4. Remboursement dettes (priorité endettement)
  5. Augmentation épargne (constitution fonds urgence)
  6. Optimisation fiscale (déductions, dispositifs)

- [ ] Interface: Checkboxes pour sélection (min 1, max 6), puis drag-and-drop ou chiffres 1-5 pour priorité
- [ ] Affichage: "Leviers sélectionnés: [N]/6 | Priorités: [Ordre]"
- [ ] Validation: Au moins 1 levier obligatoire
- [ ] Persistance en base avec tampon (alimentant P9-P10)
- [ ] Alerte si >3 leviers sélectionnés: "⚠️ Concentrez-vous sur 3 max pour efficacité."

---

### User Story 6.2: Configurer cibles d'amélioration par levier

**En tant que** utilisateur,
**Je veux** spécifier pour chaque levier sélectionné un objectif mensuel d'économies ou d'augmentation,
**Afin que** le moteur distribue les gains selon mes attentes (étapes 9-10).

#### Acceptance Criteria:
- [ ] Pour chaque levier sélectionné:
  - Objectif mensuel (montant EUR ou %)
  - Horizon (3 mois, 6 mois, 12 mois, 36 mois)
  - Notes (ex: "Réduire resto de 50 EUR/mois")

- [ ] Calcul total: Somme des objectifs tous leviers
- [ ] Validation: Objectif <Reste-à-vivre × 50% (limite raisonnable)
- [ ] Alerte si objectif global >Reste-à-vivre: "⚠️ Objectifs dépassent capacité. Réduisez ou étendez horizon."
- [ ] Affichage: "Économies cibles totales: [montant]/mois | Horizon: [durée]"
- [ ] Persistance en base

---

### User Story 6.3: Valider leviers et alimenter moteur (étapes 9-10)

**En tant que** utilisateur,
**Je veux** confirmer mes leviers et leurs cibles avant lancement du moteur complet,
**Afin que** le PersonalFinanceEngine distribue les économies selon mes paramètres (étapes 9-10).

#### Acceptance Criteria:
- [ ] Synthèse: "Leviers d'amélioration configurés"
  - Liste des leviers avec priorités et cibles
  - Total économies cibles
  - Horizon consolidé

- [ ] Bouton "Modifier leviers" (renvoi à P6.1)
- [ ] Bouton "Confirmer et finaliser" validant configuration P1-P6
- [ ] Message: "✅ Configuration complète validée. Lancement PersonalFinanceEngine..."
- [ ] Flag readiness pour EPIC 2 (P6 done → P7 unlock)

---

---

# EPIC 2: MOTEUR DE CALCUL PERSONALFINANCEENGINE
## 10 Étapes de Calcul

**Contexte:** Le PersonalFinanceEngine procède en 10 étapes pour transformer les données P1-P6 en distributions d'économies mensualisées (P9-P15).

---

### User Story 2.1: Calculer Potentiels, Expected Losses et Écart-type (Étapes 1-3)

**En tant que** moteur de calcul,
**Je veux** traiter les données P1-P6 pour estimer Potentiels (revenus scalaires), Expected Losses (pertes probabilistes) et Écart-type (volatilité),
**Afin de** disposer des paramètres de base pour calcul UL et VaR personnalisée.

#### Acceptance Criteria:

**Étape 1: Potentiels (Revenus Scalaires)**
- [ ] Calcul: Revenu Total (de P2) × (1 + Progression progressive P2)
- [ ] Distinction: Revenu Fixe vs Variable
  - Fixe: Utilisé tel quel
  - Variable: Applique coefficient volatilité basé sur Historique P3 (écart-type des variations Q1-Q4)
- [ ] Résultat: Potentiel_Fixe, Potentiel_Variable
- [ ] Persistance des valeurs

**Étape 2: Expected Losses (Pertes Probabilistes par Risque)**
- [ ] Pour chaque Catégorie Risque P4 (6 catégories):
  - Score risque (1-5) converti en Probabilité: Proba = Score / 5 × 0.8 (normalisation 0-0.8)
  - Impact estimé (selon catégorie):
    * Risque Emploi: Impact = 30-50% revenus fixe si Score ≥3
    * Risque Santé: Impact = 10-20% dépenses si Score ≥3
    * Risque Résidentiel: Impact = 15-25% loyer si Score ≥4
    * Risque Familial: Impact = 5-10% revenus si Score ≥4
    * Risque Endettement: Impact = Ratio Dettes / Revenus si Score ≥4
    * Risque Inflation: Impact = 2-5% revenus réels si Score ≥3
  - EL (Expected Loss) = Revenu affecté × Probabilité × Impact
- [ ] Total EL = Somme des EL par catégorie
- [ ] Affichage pour logs: "EL par risque: [Emploi: X, Santé: Y, ...]"

**Étape 3: Écart-type (Volatilité Revenus/Dépenses)**
- [ ] Calcul écart-type historique P3 (si données ≥2 années)
  - σ_revenus = STDEV(revenus annuels N-1 à N-5)
  - σ_dépenses = STDEV(dépenses annuelles N-1 à N-5)
- [ ] Si données insuffisantes, utiliser σ par défaut selon profil (Salariat: 5%, Freelance: 25%, Entrepreneur: 40%)
- [ ] Résultat: σ_total = √(σ_revenus² + σ_dépenses²)
- [ ] Persistance en base

**Outputs Étapes 1-3:**
- [ ] Variables système: `potentielFixe`, `potentielVariable`, `totalEL`, `ecartType`
- [ ] Logs détaillés pour audit
- [ ] Aucun affichage utilisateur à ce stade (métier)

---

### User Story 2.2: Calculer Unexpected Loss (UL) et Coefficient Contextuel (Étape 4)

**En tant que** moteur de calcul,
**Je veux** calculer la Perte Non Attendue (UL) selon la formule UL = Revenu × Proba × Impact × Coefficient Contextuel,
**Afin de** quantifier le risque ajusté au contexte personnel.

#### Acceptance Criteria:

**Étape 4: Unexpected Loss (UL)**
- [ ] Formule: UL = Revenu Potentiel × Σ(Proba × Impact) × Coefficient Contextuel
  - Σ(Proba × Impact) = somme pondérée des risques P4
  - Coefficient Contextuel = f(EKH, Horizon, Profil P1)

- [ ] **Coefficient Contextuel (0.5-1.5):**
  - Base: 1.0
  - Ajustement EKH (P5):
    * Si EKH ≤2: ×1.3 (compétence faible → UL majorer)
    * Si EKH 3-4: ×1.0 (compétence moyenne → neutre)
    * Si EKH ≥4.5: ×0.7 (compétence forte → UL réduire)
  - Ajustement Horizon (Zone 1 P4):
    * Si Horizon ≤3 ans: ×1.2 (court terme → volatilité plus importante)
    * Si Horizon 3-10 ans: ×1.0 (moyen terme → neutre)
    * Si Horizon >10 ans: ×0.8 (long terme → lissage)
  - Ajustement Profil P1:
    * Salariat régulier: ×0.9 (stabilité)
    * Freelance/Entrepreneur: ×1.2 (volatilité)
    * Retraité: ×0.7 (revenu stable)

- [ ] Coefficient final = Min(Max(coeff, 0.5), 1.5)
- [ ] UL = Revenu Potentiel × Σ(Proba × Impact) × Coefficient
- [ ] Persistance: `unexpectedLoss`, `coefficientContextuel`
- [ ] Logs: "UL calculée: [montant] EUR | Coefficient: [valeur]"

---

### User Story 2.3: Calculer seuil historique et VaR personnalisée à 95% (Étapes 5-6)

**En tant que** moteur de calcul,
**Je veux** établir un seuil historique (Value-at-Risk) basé sur l'historique P3 et calculer la VaR personnalisée à 95% (pas 99%),
**Afin de** quantifier le "worst case" dans 95% des cas.

#### Acceptance Criteria:

**Étape 5: Seuil Historique (Historical VaR)**
- [ ] Données: Historique P3 (3-5 années d'écarts revenus/dépenses)
- [ ] Calcul: Centile 5% des variations (worst 5th percentile)
  - Trier les variations annuelles du pire au meilleur
  - Seuil = Valeur à position 5% (ex: sur 60 mois de données, position 3)
- [ ] Si historique insuffisant, utiliser écart-type × 1.645 (1-sigma + 0.5σ pour ajust.)
- [ ] Résultat: `seuilHistorique` (montant EUR de perte annuelle)
- [ ] Persistence en base

**Étape 6: VaR Personnalisée à 95%**
- [ ] Formule: VaR95% = (UL_Étape4 + EL_Étape2) × √(Écart-type_Étape3) × Coefficient 95%
  - Coefficient 95% = 1.645 (approximation loi normale, pas 2.33 pour 99%)
- [ ] Alternative paramétrée: VaR95% = Revenu × Volatilité × 1.645 (si données historiques insuffisantes)
- [ ] Comparaison: VaR95% personnalisée vs Seuil Historique
  - Si VaR95% > 2× Seuil Historique → Alerte: "Risque actuel majeur détecté"
- [ ] Persistance: `vaRPersonnalisee95`, `comparaisonSeuilHistorique`
- [ ] Logs: "VaR95%: [montant] EUR | Seuil historique: [montant] EUR"

---

### User Story 2.4: Calculer PRL, POB, Forecast EL et distribuer par leviers (Étapes 7-10)

**En tant que** moteur de calcul,
**Je veux** calculer Perte Résiduelle Limite (PRL), Probabilité de Respect Budgétaire (POB), projeter Expected Loss sur 36 mois, puis distribuer les économies par leviers et mensualiser (Étapes 7-10),
**Afin de** générer un plan 3 ans d'économies progressives (5→11%).

#### Acceptance Criteria:

**Étape 7: PRL (Perte Résiduelle Limite)**
- [ ] Définition: Maximum perte acceptable par utilisateur selon sa tolérance au risque
- [ ] Calcul: PRL = Reste-à-vivre P2 × Seuil acceptabilité
  - Seuil = f(Score Risque P4, EKH P5)
  - Score Risque ≤2 & EKH ≥4 → Seuil 30% (peut perdre 30% du reste-à-vivre)
  - Score Risque 3-4 & EKH 2-3 → Seuil 15% (peut perdre 15%)
  - Score Risque ≥4 & EKH ≤2 → Seuil 5% (très prudent)
  - Autres cas → Seuil 10%
- [ ] PRL = Reste-à-vivre × Seuil
- [ ] Alerte si VaR95% > PRL: "🔴 Risque dépasse limite acceptée. Augmentez fonds urgence."
- [ ] Persistance: `perteResiduelleLimite`, `seuilAcceptabilite`

**Étape 8: POB (Probabilité de Respect Budgétaire) et Forecast EL**
- [ ] POB = (1 - VaR95% / Revenu Potentiel) × 100
  - Interprétation: Probabilité (%) que revenus couvrent dépenses + VaR
- [ ] Alerte si POB <75%: "⚠️ Risque budgétaire. Plan d'épargne recommandé."
- [ ] Forecast EL sur 36 mois (3 ans):
  - EL_annuel_Étape2 extrapolée sur 36 mois
  - Progression linéaire selon Horizon P4 (Zone 1)
  - EL_36mois = EL_annuel × 3 × (1 + Inflation annuelle)
- [ ] Persistance: `probabiliteRespectBudgetaire`, `forecastEL36mois`
- [ ] Logs: "POB: [%] | EL Forecast 36M: [montant]"

**Étape 9: Distribution par 5 Leviers (Priorités P6)**
- [ ] Données entrantes:
  - Leviers sélectionnés P6 (1-6 leviers, priorités 1-5, cibles économies)
  - Économies totales cibles P6 (somme objectifs)
  - Forecast EL 36M (Étape 8) + Reste-à-vivre marginal

- [ ] Calcul distribution:
  - Réserve Économies Disponibles = Forecast EL36M + (Reste-à-vivre P2 × 20%)
  - Pour chaque levier (par ordre priorité):
    * Allocation = Réserve × (Objectif levier / Objectif total)
    * Ajustement si allocation <Objectif: Réduction proportionnelle tous leviers

- [ ] Vérification: Σ Allocations ≤ Réserve
- [ ] Affichage détaillé (logs internes):
  ```
  Distribution 36 mois:
  Levier 1 [Priorité 1]: [montant] EUR × 36 mois
  Levier 2 [Priorité 2]: [montant] EUR × 36 mois
  ...
  Total: [montant] EUR
  ```
- [ ] Persistance: `distributionParLeviers` (array de structures)

**Étape 10: Ventilation Mensuelle (Progression 5→11%)**
- [ ] Règle: Économies progressent de 5% (mois 1) à 11% (mois 36) de façon linéaire
  - Progression mensuelle = 5% + (Mois - 1) × [(11% - 5%) / 35]
  - Mois 1: 5%, Mois 18: 8%, Mois 36: 11%

- [ ] Pour chaque levier distribué Étape 9:
  - Montant mensuel = Allocation levier / 36 × Progression mensuelle
  - Générer matrice 36 cellules (montants progressifs par mois)

- [ ] Ventilation par postes (8 catégories COICOP P2):
  - Répartition des montants leviers selon nature (ex: Levier "Réduction dépenses" → Alimentation 40%, Transport 30%, Loisirs 30%)
  - Création matrice 8 postes × 36 mois

- [ ] Formule conservée: (F1 + F2 + F3) / 63 × 100 appliquée aux totalisés
  - F1, F2, F3 = sommes par trimestre (12 mois chacun), résultat normalisé 0-100

- [ ] Génération structures:
  ```
  ventilationMensuelle = {
    par_levier: [
      { levier: "Réduction dépenses", mois: [5%, 5.17%, ..., 11%], montants: [...] },
      ...
    ],
    par_poste: [
      { poste: "Alimentation", mois: [montants...] },
      ...
    ],
    scoreFormule: (F1+F2+F3)/63*100
  }
  ```
- [ ] Persistance en base (alimentant P9-P15)

**Outputs Étapes 7-10:**
- [ ] Variables système persistées:
  - `perteResiduelleLimite`, `probabiliteRespectBudgetaire`
  - `distributionParLeviers`, `ventilationMensuelle`
  - `matrice36mois` (36 lignes × 8 postes + synthèses)

- [ ] Message de fin: "✅ PersonalFinanceEngine complété. Rapports générés (P7-P15)."
- [ ] Logs d'audit avec timestamps

---

---

# EPIC 3: PAGES DE REPORTING
## Pages 7-15

---

## PAGE 7: TABLEAU DE BORD (DASHBOARD)

### Périmètre
6 cartes KPI en langage clair, synthèse situation financière personnelle.

---

### User Story 7.1: Afficher 6 cartes KPI personnalisées

**En tant que** utilisateur,
**Je veux** consulter mon tableau de bord personnel avec 6 KPI clés en langage clair et visuels,
**Afin de** comprendre rapidement ma situation financière globale.

#### Acceptance Criteria:

**Carte 1: Reste-à-vivre Mensuel**
- [ ] Affichage: "[Montant] EUR / mois" en grand
- [ ] Couleur: Verde si ≥500, Orange si 200-499, Rouge si <200
- [ ] Détail au clic: "Revenus [X] - Dépenses [Y] = [Z]"
- [ ] Trend: Δ vs mois précédent (↑ ↓ =)

**Carte 2: Score Compétence Financière (EKH)**
- [ ] Affichage: "[EKH]/5.0" + barre de progression
- [ ] Couleur: Rouge <2, Orange 2-3, Jaune 3-4, Vert ≥4
- [ ] Interprétation: "Compétence: [Faible/Moyen/Bon/Expert]"
- [ ] Lien vers P5 (Auto-évaluation) pour mise à jour

**Carte 3: Risque Global**
- [ ] Affichage: "Profil [Conservative/Modéré/Agressif]" + radar 5D réduit
- [ ] Score synthétique P4 (1-5) visualisé
- [ ] Catégorie majeure: "[Catégorie risque] niveau [X/5]"
- [ ] Lien vers P4 (Risk Data) pour détails

**Carte 4: VaR Personnalisée (95%)**
- [ ] Affichage: "VaR 95%: [Montant] EUR/an"
- [ ] Explication: "Perte maximale probable (95% des cas)"
- [ ] Comparaison: "vs Reste-à-vivre: [%]"
- [ ] Alerte si VaR > 40% Reste-à-vivre: "⚠️ Risque élevé"

**Carte 5: Économies Cumulées (36 mois)**
- [ ] Affichage: "[Montant] EUR" sur 3 ans
- [ ] Décomposition: "Par levier: [Levier1] [X EUR], [Levier2] [Y EUR], ..."
- [ ] Barre progression mensuelle (36 mois)
- [ ] Lien vers P9 (Distribution par leviers)

**Carte 6: Score Global /100**
- [ ] Affichage: "[Score]/100" + notation lettre (A+ à E)
- [ ] Formule: (F1+F2+F3)/63×100
- [ ] Interprétation: "État financier: [Qualifié]"
- [ ] Historique: Graphique évolution sur 12 mois

---

### User Story 7.2: Naviguer et interagir avec le dashboard

**En tant que** utilisateur,
**Je veux** cliquer sur chaque KPI pour accéder aux détails ou modifications associées,
**Afin de** plonger rapidement dans les données pertinentes.

#### Acceptance Criteria:
- [ ] Chaque carte cliquable renvoyant à la page détail associée
  - Carte 1 → P2 (Revenus/Dépenses)
  - Carte 2 → P5 (Auto-évaluation)
  - Carte 3 → P4 (Risk Data)
  - Carte 4 → P11 (Évolution des Pertes)
  - Carte 5 → P9 (Distribution par leviers)
  - Carte 6 → P15 (Rapport Global)

- [ ] Navigation par swipe (mobile) ou bouton "Détails"
- [ ] Retour au dashboard via bouton "< Dashboard" ou geste retour
- [ ] Actualisations temps réel (auto-refresh ≤5s si changements)

---

## PAGE 8: PLAN D'OPTIMISATION 3 ANS

### Périmètre
Progression adaptative LIT (Ligne d'Intervention Temporelle), cascade financière dynamique sur 36 mois.

---

### User Story 8.1: Générer et afficher plan 3 ans avec progression LIT

**En tant que** utilisateur,
**Je veux** consulter mon plan d'optimisation financière sur 3 ans avec progression adaptative et cascade,
**Afin de** comprendre la trajectoire d'amélioration financière projetée.

#### Acceptance Criteria:
- [ ] **Progression LIT (Ligne d'Intervention Temporelle):**
  - Mois 1-12 (An 1): Prise connaissance, ajustements P1-P6
  - Mois 13-24 (An 2): Accélération, mise en œuvre leviers 1-3
  - Mois 25-36 (An 3): Consolidation, stabilisation, intégration leviers 4-6

- [ ] Affichage format timeline:
  ```
  [An 1: Actions] ─ [An 2: Accélération] ─ [An 3: Consolidation]
  ```

- [ ] **Cascade Financière Dynamique:**
  - Année 1: Reste-à-vivre initial → +5-8% via leviers prioritaires
  - Année 2: Reste-à-vivre + An1 → +8-10% via cumul leviers
  - Année 3: Reste-à-vivre + An1+An2 → +10-11% stabilisé

- [ ] Visualisation: Graphique en barres empilées (Année 1, 2, 3) montrant accumulation
- [ ] Chiffres détaillés cliquables pour explications
- [ ] Lien vers P12 (Plan détaillé 3 ans) pour granularité

---

### User Story 8.2: Configurer scénarios alternatifs du plan

**En tant que** utilisateur,
**Je veux** tester des variantes du plan (ex: allonger horizon, réduire objectifs),
**Afin de** adapter le plan à mes contraintes réelles.

#### Acceptance Criteria:
- [ ] Bouton "Simuler scénario alternative"
- [ ] Paramètres ajustables:
  - Horizon (24, 36, 48, 60 mois)
  - Progression économies (Custom min-max au lieu de 5-11%)
  - Leviers inclus (activer/désactiver subsets)

- [ ] Recalcul dynamique de la cascade avec affichage delta
- [ ] Comparaison: Scénario standard vs alternative
- [ ] Bouton "Valider scénario" ou "Revenir au standard"

---

## PAGE 9: RÉPARTITION DES ÉCONOMIES PAR LEVIER

### Périmètre
5 cartes visualisant la distribution des 36 mois d'économies par les 5-6 leviers sélectionnés.

---

### User Story 9.1: Visualiser distribution économies par levier (5 cartes)

**En tant que** utilisateur,
**Je veux** voir la répartition des économies cumulées par levier (sur 36 mois),
**Afin de** valider que mes priorités sont respectées.

#### Acceptance Criteria:
- [ ] **5 Cartes (1 par levier principal sélectionné, max 5):**
  1. **Réduction Dépenses Courantes**
     - Montant total 36M: [X EUR]
     - Composition: Alimentation [A%], Transport [B%], Loisirs [C%]
     - Courbe progression mensuelle visualisée

  2. **Optimisation Assurances**
     - Montant total 36M: [X EUR]
     - Économies mensuelles stables (Fixe)
     - Détail: Prime actuelle vs optimisée

  3. **Augmentation Revenus**
     - Montant total 36M: [X EUR]
     - Composition: Promotion [A%], Activité complémentaire [B%]
     - Progression progressive

  4. **Remboursement Dettes**
     - Montant total 36M: [X EUR]
     - Crédit/Emprunt affecté
     - Durée accélérée et intérêts économisés

  5. **Augmentation Épargne**
     - Montant total 36M: [X EUR]
     - Fonds urgence + Fonds long terme
     - Trajectoire vers [Objectif montant]

- [ ] Chaque carte avec:
  - Montant / mois moyen
  - Graphique progression 36 mois
  - Indicateur "En piste" ✓ ou "À risque" ⚠️
  - Lien vers détails (P12)

---

### User Story 9.2: Exporter répartition par levier

**En tant que** utilisateur,
**Je veux** exporter cette répartition en CSV ou PDF pour partage,
**Afin de** communiquer ma stratégie d'épargne.

#### Acceptance Criteria:
- [ ] Bouton "Exporter CSV" générant fichier: `leviers_economie_[Date].csv`
- [ ] Contenu: Levier, Montant total, Mois 1-36 (montants progressifs)
- [ ] Bouton "Partager PDF" avec mise en page optimisée
- [ ] Intégration optionnelle WhatsApp, Email, OneDrive

---

## PAGE 10: VENTILATION ÉCONOMIQUE (Fusion HCM Pages 14-16)

### Périmètre
Matrice 5 leviers × 8 postes (COICOP) sur 36 mois, synthèse fusion 3 pages HCM.

---

### User Story 10.1: Afficher matrice ventilation leviers × postes

**En tant que** utilisateur,
**Je veux** voir la ventilation croisée: 5 leviers × 8 postes COICOP (36 mois),
**Afin de** comprendre quels postes bénéficient de chaque levier.

#### Acceptance Criteria:
- [ ] **Matrice interactive:**
  - Colonnes: 8 catégories COICOP (Alimentation, Transport, Logement, Santé, Loisirs, Éducation, Assurances, Autres)
  - Lignes: 5 leviers (Réduction dépenses, Optimisation assurance, Aug. revenus, Remboursement dettes, Aug. épargne)
  - Cellules: Montants cumulés 36M (EUR)
  - Codes couleur: Intensité (blanc = 0, vert clair = petit montant, vert foncé = grand montant)

- [ ] Totaux:
  - En bas: Somme par poste (colonne)
  - À droite: Somme par levier (ligne)
  - Coin BA: Total général (= Économies 36M totales)

- [ ] Interactivité:
  - Clic cellule → détails (ex: "Levier 'Réduction dépenses' affecte Alimentation de 1200 EUR sur 36M")
  - Clic ligne levier → bascule vers P9 levier spécifique
  - Clic colonne poste → bascule vers P12 détails poste

---

### User Story 10.2: Synthétiser fusion 3 pages HCM (14-16)

**En tant que** système,
**Je veux** fusionner les 3 pages HCM (Pages 14-16) en une seule Page 10 PFM optimisée,
**Afin de** offrir une vue consolidée sans redondance.

#### Acceptance Criteria:
- [ ] Contenu Page 10 intègre:
  - Page HCM 14: Ventilation par levier (leviers = lignes)
  - Page HCM 15: Ventilation par poste (postes = colonnes)
  - Page HCM 16: Synthèse croisée (matrice complète)

- [ ] Onglets internes (mobile tabs) ou sections (scroll desktop) pour navigation:
  - Tab 1: Vue Matrice complète
  - Tab 2: Vue détaillée par levier
  - Tab 3: Vue détaillée par poste

- [ ] Chaque tab avec totaux et sous-totaux
- [ ] Export unique (PDF, CSV) de la fusion

---

## PAGE 11: ÉVOLUTION DES PERTES

### Périmètre
Historique, projeté, marge (VaR/PRL) sur 36 mois, Section 3 = Écart-type S1 vs S2.

---

### User Story 11.1: Afficher évolution historique, projetée et marges

**En tant que** utilisateur,
**Je veux** voir l'évolution Expected Loss sur 3 dimensions: Historique, Projeté, Marges (VaR/PRL),
**Afin de** anticiper les pertes futures et évaluer mes marges de sécurité.

#### Acceptance Criteria:
- [ ] **Section 1: Historique des Pertes (P3)**
  - Graphique: 3-5 années antérieures (annualisées)
  - Données: Perte réelle annuelle (écart négatif revenu/dépense)
  - Tendance: ▲ ▼ = (amélioration/détérioration/stable)
  - Affichage: "Perte moyenne historique: [X EUR/an]"

- [ ] **Section 2: Pertes Projetées (36 mois)**
  - Graphique: Projection Expected Loss (Étape 8, Forecast EL36M)
  - Format: EL mensuelle (barres) ou cumulée (ligne)
  - Courbe: EL décroissante si leviers actifs (amélioration)
  - Affichage: "EL projetée: [X EUR/an] → [Y EUR/an] (réduction [%])"

- [ ] **Section 3: Marges VaR/PRL**
  - Graphique: 2 lignes (VaR95% historique vs VaR95% projetée)
  - Bande marges: Entre 0 et PRL (zone verte safe, rouge risk)
  - Alerte si VaR > PRL: "🔴 Marge insuffisante"
  - Affichage: "VaR: [X EUR] vs PRL: [Y EUR] | Couverture: [%]"

  - **Détail Section 3: Écart-type S1 vs S2**
    * S1 = Écart-type historique (P3, Étape 3)
    * S2 = Écart-type projeté (avec leviers actifs, réduction ~15-25%)
    * Affichage: "Volatilité: S1=[X%] → S2=[Y%] (stabilisation: [Z%])"
    * Graphique comparatif (barres)

---

### User Story 11.2: Interagir et filtrer évolution pertes

**En tant que** utilisateur,
**Je veux** filtrer la vue par levier ou poste pour isoler impacts,
**Afin de** comprendre quels leviers réduisent le plus les pertes.

#### Acceptance Criteria:
- [ ] Filtre "Par levier" (checkboxes): Affiche EL que si levier coché actif
- [ ] Filtre "Par période": 12M, 24M, 36M
- [ ] Bouton "Réinitialiser filtres"
- [ ] Mise à jour graphiques en temps réel au changement filtre
- [ ] Affichage delta: "Impact levier [X]: Réduction EL de [Y%]"

---

## PAGE 12: PLAN DÉTAILLÉ 3 ANS

### Périmètre
Leviers + postes + cascade mensuelle (36 cellules), architecture détaillée du plan.

---

### User Story 12.1: Afficher plan détaillé avec leviers, postes et progression mensuelle

**En tant que** utilisateur,
**Je veux** consulter le plan détaillé sur 36 mois avec décomposition par levier, poste et mois,
**Afin de** suivre précisément ma trajectoire d'économies mois par mois.

#### Acceptance Criteria:
- [ ] **Structure 3 niveaux:**
  1. **Niveau 1: Leviers** (5-6 leviers sélectionnés)
     - Levier 1 [Priorité 1]
       - Montant total 36M: [X EUR]
       - Progression: 5% (M1) → 11% (M36)
       - Sous-total par an: [An1], [An2], [An3]

  2. **Niveau 2: Postes par levier** (8 catégories COICOP)
     - Sous Levier 1:
       - Alimentation: [Montant total 36M]
       - Transport: [Montant total 36M]
       - ... (6 autres postes)

  3. **Niveau 3: Mois** (36 cellules mensuelles)
     - Tableau: Levier × Poste × Mois
     - Cellule: Montant mensuel progressif
     - Exemple: Levier 1, Alimentation, Mois 1 = [EUR] (5% progression)
                Levier 1, Alimentation, Mois 36 = [EUR] (11% progression)

- [ ] Affichage format:
  - Accord / expansion (+ / -) pour chaque niveau
  - Totaux dynamiques: Somme apparentées
  - Couleur selon montant (gradient vert)

- [ ] **Matrice compacte (36 mois):**
  - Onglet "Tableau mensuel": 36 colonnes (Mois 1-36), lignes (leviers + postes)
  - Cellules numériques cliquables pour détail
  - Sommes colonnes et lignes
  - Scroll horizontal (mobile) pour tous mois visibles

---

### User Story 12.2: Ajouter annotations et adapter plan

**En tant que** utilisateur,
**Je veux** ajouter des notes sur certains mois/leviers et adapter le plan,
**Afin de** personnaliser avec mes contextes spécifiques.

#### Acceptance Criteria:
- [ ] Bouton "Ajouter note" par levier/mois
- [ ] Modal: Texte libre + Lien optionnel action (ex: "Demander augmentation en avril")
- [ ] Notes persistées avec date création/modification
- [ ] Affichage icône note sur cellules concernées
- [ ] Bouton "Adapter progression": Modifier progression 5-11% par levier spécifique
- [ ] Validation atomique: Adapter n'invalide pas autres leviers
- [ ] Message: "✅ Plan personnalisé. Enregistrement automatique."

---

## PAGE 13: CALENDRIER D'ÉPARGNE

### Périmètre
Montants progressifs mensuels (5→11%), 36 cellules mensuelles, visualisation calendrier.

---

### User Story 13.1: Afficher calendrier épargne mensuelle avec progression

**En tant que** utilisateur,
**Je veux** consulter un calendrier visuel de mes dépôts d'épargne prévisionnels mois par mois,
**Afin de** anticiper mon effort d'épargne mensuel.

#### Acceptance Criteria:
- [ ] **Format Calendrier:**
  - Vue mensuelle: 12 lignes (Mois 1-36), colonnes (Semaine 1-4 ou Jours 1-31)
  - Alternativement: Tableau 36 lignes (Mois 1-36), 1 colonne "Montant"

- [ ] **Cellules Montants:**
  - Mois 1-3: ~5% du Reste-à-vivre P2
  - Mois 4-12: Progression linéaire (5.5%-7%)
  - Mois 13-24: Progression (7.5%-9%)
  - Mois 25-36: Progression (9.5%-11%)

- [ ] Formule: Montant mois N = Reste-à-vivre × (5% + (N-1) × 0.17%)
  - Arrondi EUR

- [ ] Couleurs:
  - Vert foncé: Montant progressant comme prévu
  - Jaune: Mois proches
  - Gris: Mois futurs non actif

- [ ] Affichage Total: "Épargne cumulée 36M: [X EUR]"
- [ ] Affichage mensuel: Tableau synthétique (36 lignes, 3 colonnes: Mois, Montant, Cumulé)

---

### User Story 13.2: Exporter calendrier épargne et paramétrer rappels

**En tant que** utilisateur,
**Je veux** exporter ce calendrier et recevoir des rappels mensuels,
**Afin de** rester discipliné dans mon plan d'épargne.

#### Acceptance Criteria:
- [ ] Bouton "Exporter iCal" générant fichier calendrier (format .ics)
  - Événements: Chaque mois (ex: "Épargne Février: 156 EUR")
  - Rappel: 3 jours avant (notification)

- [ ] Bouton "Exporter PDF" avec calendrier imprimable
- [ ] Toggle "Activer notifications": Rappel push mensuel
  - Fréquence: Début/Fin mois (configurable)
  - Contenu: "Montant à épargner ce mois: [X EUR]"

- [ ] Lien optionnel: "Configurer prélèvement automatique" (intégration bancaire future)

---

## PAGE 14: ACTIONS PRIORITAIRES

### Périmètre
Fusion 3 pages HCM → 1 page PFM avec sélecteur année.

---

### User Story 14.1: Afficher actions prioritaires avec sélecteur année

**En tant que** utilisateur,
**Je veux** consulter les actions prioritaires (les plus impactantes) pour chaque année du plan (1, 2, 3),
**Afin de** savoir concrètement quoi faire maintenant.

#### Acceptance Criteria:
- [ ] **Sélecteur année:** Boutons "Année 1", "Année 2", "Année 3" (ou dropdownet)
- [ ] **Affichage actions année sélectionnée:**
  - Format liste (max 10 actions)
  - Chaque action: Titre, Description, Levier associé, Montant économies, Effort (1-5)
  - Exemple An 1:
    * Action 1: "Réduire abonnements mensuels inutilisés" - Levier Réduction dépenses - 50 EUR/mois - Effort 2/5
    * Action 2: "Demander augmentation salariale" - Levier Augmentation revenus - 300 EUR/mois - Effort 4/5
    * Action 3: "Optimiser assurance auto" - Levier Optimisation assurance - 60 EUR/mois - Effort 3/5

- [ ] Tri par Effort (croissant) ou par Impact (décroissant, défaut)
- [ ] Indicateur: "✓ Complétée", "○ En cours", "◯ À commencer"
- [ ] Bouton "Marquer complétée" changiant statut

---

### User Story 14.2: Planifier et suivre exécution actions prioritaires

**En tant que** utilisateur,
**Je veux** cliquer sur une action pour voir détails, l'assigner à une date, et suivre completion,
**Afin de** tenir un journal des actions réalisées.

#### Acceptance Criteria:
- [ ] Clic action → Modal détail:
  - Titre, Description détaillée
  - Levier, Montant estimé, Effort
  - Date cible (saisissable)
  - Statut (À commencer, En cours, Complétée)
  - Notes personnelles (field optionnel)

- [ ] Bouton "Assigner date" ouvrant sélecteur calendrier
- [ ] Bouton "Marquer complétée" → Statut changé, montant réel optionnel
- [ ] Historique: Affichage "Complétée le [date] - Gain réel: [montant]"
- [ ] Persistance: Synchro temps réel
- [ ] Message: "✅ Action complétée! Économies réelles: [montant EUR]"

---

## PAGE 15: RAPPORT GLOBAL

### Périmètre
8+1 sections, score /100, radar 5D, export PDF, synthèse stratégique.

---

### User Story 15.1: Générer et afficher rapport global 8+1 sections

**En tant que** utilisateur,
**Je veux** consulter un rapport global synthétisant mon plan financier personnel,
**Afin de** disposer d'une vue complète d'une seule page/document.

#### Acceptance Criteria:

**Rapport Global 9 sections (8+1 synthèse):**

1. **Synthèse Situation**
   - Profil (P1): [Profil], [Situation], [Pays], [Devise]
   - Revenus: [Montant total], [HHI], [Concentration]
   - Dépenses: [Montant total], [Reste-à-vivre]
   - Horizon planning: [Âge actuel] + [Horizon] = [Âge fin plan]

2. **Score Compétence Financière (EKH)**
   - EKH: [Valeur]/5.0
   - Profil compétence: [Faible/Moyen/Bon/Expert]
   - Sujets force: [Liste topics ≥4]
   - Sujets à améliorer: [Liste topics ≤3]

3. **Profil de Risque**
   - Score moyen: [X]/5.0
   - Profil: [Conservative/Modéré/Agressif]
   - Risques majeurs: [Top 2-3 catégories]
   - Historique volatilité: σ = [%]

4. **VaR et Pertes**
   - VaR 95%: [Montant EUR]/an
   - Expected Loss: [Montant EUR]/an
   - Perte Résiduelle Limite (PRL): [Montant EUR]
   - Couverture: "VaR couvre [%] de PRL" (alerte si <100%)

5. **Leviers et Objectifs**
   - Leviers sélectionnés: [Levier 1 (Priorité 1), Levier 2 (Priorité 2), ...]
   - Économies cibles: [Montant total 36M EUR]
   - Répartition: [Levier 1: X EUR, Levier 2: Y EUR, ...]

6. **Plan 3 Années**
   - Année 1 (Mois 1-12): Économies cumulées [A EUR], Progression 5-7%
   - Année 2 (Mois 13-24): Économies cumulées [B EUR], Progression 7-9%
   - Année 3 (Mois 25-36): Économies cumulées [C EUR], Progression 9-11%
   - Total 3 ans: [A+B+C EUR]
   - Formule Score: (A+B+C)/63×100 = [Score]/100

7. **Ventilation par Poste (COICOP)**
   - Table: 8 catégories, montants économies par poste, % du total
   - Poste major: [Catégorie] = [%]
   - Visualisation: Pie chart ou barres

8. **Actions Prioritaires**
   - An 1 Top 3 actions (effort croissant ou impact décroissant)
   - An 2 Top 3 actions
   - An 3 Top 3 actions

**+1 Synthèse Exécutive:**
- Score Global: [X]/100 avec notation (A+ à E)
- Interpretation: "État financier [Qualifié]"
- Recommandations clés: [2-3 suggestions]
- Message personalisé selon score/risque

---

### User Story 15.2: Afficher score global /100 et radar 5D

**En tant que** utilisateur,
**Je veux** voir mon score financier global /100 et un radar 5D synthétisant 5 dimensions clés,
**Afin de** comprendre ma position globale d'un coup d'œil.

#### Acceptance Criteria:
- [ ] **Score Global /100:**
  - Formule: (F1+F2+F3)/63×100 (F1, F2, F3 = sommes années)
  - Visualisation: Gauge 0-100 avec zones (0-20 E, 21-40 D, 41-60 C, 61-80 B, 81-100 A+)
  - Notation lettre: "A+", "A", "B+", "B", "C", "D", "E"
  - Affichage: "[Score] / 100 - Notation [Lettre]"
  - Couleur: Vert ≥80, Orange 50-80, Rouge <50

- [ ] **Radar 5D (Pentagon chart):**
  - 5 axes (0-100%):
    1. Stabilité revenus (inverse HHI: 100% si HHI <1000, décroît)
    2. Maîtrise budgétaire (inverse VaR/Revenus: 100% si VaR <20% revenus)
    3. Compétence financière (EKH × 20: 0-100)
    4. Capacité épargne (Reste-à-vivre / Revenu × 100)
    5. Couverture risque (100% si VaR <PRL, sinon PRL/VaR×100)

  - Visualisation: Pentagon coloré (vert = bon, rouge = faible)
  - Affichage moyennes axes + légende
  - Interprétation: "Points forts: [Axes ≥75]", "À améliorer: [Axes <50]"

---

### User Story 15.3: Exporter rapport en PDF

**En tant que** utilisateur,
**Je veux** exporter ce rapport global en PDF pour consultation hors ligne ou partage,
**Afin de** disposer d'une version pérenne et partageable.

#### Acceptance Criteria:
- [ ] Bouton "Exporter PDF" en haut rapport
- [ ] Fichier généré: `LELE_Rapport_Global_[Date].pdf`
- [ ] Mise en page optimisée:
  - Page 1: Synthèse exécutive + score + radar
  - Pages 2-4: Sections 1-8 formatées
  - Page 5: Avertissements légaux + Date génération + Signature numérique (optionnel)

- [ ] Styles: Logo LELE, couleurs brand, polices lisibles
- [ ] Intégration QR code vers portail utilisateur (optionnel)
- [ ] Telechargement direct ou envoi email

---

### User Story 15.4: Personnaliser et mettre à jour rapport

**En tant que** utilisateur,
**Je veux** télécharger régulièrement mon rapport (ex: mensuellement, trimestriellement),
**Afin de** suivre l'évolution et comparer versions.

#### Acceptance Criteria:
- [ ] Historique rapports: Affichage liste versions (dates, scores)
- [ ] Comparaison 2 versions: Affichage delta (score, EKH, VaR, etc.)
- [ ] Archivage: Conservation min 24 mois
- [ ] Mode "Mise à jour rapide": Re-générer avec données P2-P6 actuelles (sans reset)
- [ ] Alerte: "Données P4 ou P5 n'ont pas changé depuis [date]. À réviser?"

---

---

# NORMES TRANSVERSALES

## Transactions et Catégories

**4 Types de transactions:**
1. **Fixe** - Montant constant mensuel (ex: loyer, salaire)
2. **Variable** - Montant fluctuant (ex: restaurant, électricité saisonnière)
3. **Imprévue** - Coût exceptionnel (ex: réparation voiture, hospitalisation)
4. **Versement Épargne-Dette** - Montant dédié épargne/remboursement

**8 Catégories COICOP ONU (Classification):**
1. Alimentation et boissons non alcoolisées
2. Transport
3. Logement, eau, électricité, gaz
4. Santé
5. Loisirs et culture
6. Éducation
7. Assurances (santé, automobile, habitation, vie)
8. Autres dépenses (articles ménagers, vêtements, communication, etc.)

## Formules Clés

**Score EKH (Compétence Financière):**
```
EKH = (Q1 + Q2 + Q3 + Q4 + Q5 + Q6) / 6
Valeur: 1-5.0
Jamais saisi, toujours calculé
```

**Score Global /100 (Formule Conservée):**
```
Score = (F1 + F2 + F3) / 63 × 100
F1 = Économies An 1 (mois 1-12)
F2 = Économies An 2 (mois 13-24)
F3 = Économies An 3 (mois 25-36)
Résultat: 0-100, Notation A+ à E
```

**Coefficient Contextuel (UL, Étape 4):**
```
Coefficient = f(EKH, Horizon, Profil) ∈ [0.5, 1.5]
Min(Max(coeff, 0.5), 1.5)
```

**VaR Personnalisée 95% (Étape 6):**
```
VaR95% = (UL + EL) × √(Écart-type) × 1.645
(pas 99%, donc coefficient 1.645 vs 2.33)
```

**Progression Économies (Étape 10):**
```
Progression mensuelle = 5% + (Mois - 1) × [(11% - 5%) / 35]
Mois 1: 5%
Mois 18: ~8%
Mois 36: 11%
```

**Cap Réalisé vs Prévu:**
```
capRealToPrevu() = Math.min(réalisé, prévu)
Appliqué pour limiter gains au projeté
```

## Format Devise et Langue

- **Devise par défaut:** EUR (€)
- **Langue:** Français
- **Format montant:** [Montant] EUR (ex: 1.250,50 EUR)
- **Format date:** JJ/MM/AAAA (ex: 15/02/2026)
- **Granularité temporelle:** Hebdomadaire (52 semaines/an)

## Design Mobile-First

- Toutes les pages optimisées iOS + Android
- Priorité: Affichage verticale (portrait)
- Composants: Buttons, modals, tabs, accordions responsifs
- Tactilité: Hitbox min 44×44px
- Navigation: Bottom tabs ou top nav selon page
- Accessibilité: Contraste WCAG AA, labels explicites

---

# FIN MODULE 1 PRD

**Version:** 1.0
**Date de production:** 2026-02-07
**Statut:** DRAFT - En attente validation PM


---

# PARTIE III — MODULE 3 : PERSONAL SAVINGS ENGINE

# LELE PFM - PRD Module 3
## "Moteur d'Épargne Personnelle" (Personal Savings Engine)
**Approche BMAD - Product Manager: John**

---

## EPIC 4 : Phase 1 — Configuration des Postes de Dépenses

### Vue d'ensemble
Phase 1 établit la structure de catégorisation des dépenses selon la classification COICOP à 3 niveaux (N1: postes, N2: sous-catégories, N3: lignes d'articles), complétée par des attributs de flexibilité et d'essentialité permettant le calcul du score de flexibilité.

---

### US 4.1 : Afficher les 8 Postes COICOP comme Catégories Principales (N1)
**En tant que** utilisateur de LELE PFM,
**Je veux** voir les 8 postes de dépenses COICOP prédéfinis à l'écran de configuration,
**Afin de** comprendre la structure de suivi de mes finances par grande catégorie.

**Acceptance Criteria:**
- Les 8 postes COICOP s'affichent dans une liste verticale scrollable sur mobile
- Chaque poste affiche son code N1 (ex: "01"), son libellé français (ex: "Alimentation et boissons") et une icône distincte
- Les postes sont immuables (non modifiables, non suppressibles par l'utilisateur)
- L'ordre des postes respecte la classification officielle COICOP (01→12)
- Tap sur un poste ouvre l'accordéon affichant les sous-catégories N2 associées
- Visuellement, les postes COICOP fermés affichent un chevron droit ; ouverts affichent un chevron bas
- Mode sombre supporté avec contraste WCAG AA

---

### US 4.2 : Afficher les Sous-Catégories par Poste (N2: Plan Comptable Simplifié)
**En tant que** utilisateur,
**Je veux** explorer les sous-catégories (N2) au sein de chaque poste COICOP,
**Afin de** configurer mes dépenses à un niveau de détail approprié.

**Acceptance Criteria:**
- Chaque poste N1 contient entre 3 et 12 sous-catégories N2
- Chaque N2 affiche: code (ex: "01.1.1"), libellé français, et badge optionnel "Essentielle" ou "Discrétionnaire"
- Les sous-catégories N2 sont organisées en plan comptable simplifié (pas la hiérarchie complète COICOP)
- La saisie N2 est en mode édition: attributs F/V (Fixe/Variable), Essentialité, Taux d'incompressibilité modifiables
- Interaction sur N2: drag-and-drop natif iOS/Android pour réorganiser (optionnel selon UX test)
- Les changements d'attributs N2 sont sauvegardés automatiquement en base de données
- Validation: un N2 ne peut pas avoir des attributs contradictoires (ex: Fixe ET Imprévue simultanément)

---

### US 4.3 : Configurer les Dépenses Récurrentes Individuelles (N3: Line Items)
**En tant que** utilisateur,
**Je veux** ajouter, éditer et supprimer les dépenses récurrentes au niveau détaillé (N3),
**Afin de** pré-remplir automatiquement mes transactions fixes chaque semaine.

**Acceptance Criteria:**
- Bouton "Ajouter une dépense récurrente" accessible sous chaque N2
- Formulaire N3 sur 1-2 écrans mobile avec champs: Libellé, Montant €, Fréquence (Hebdomadaire/Bihebdo/Mensuel)
- Chaque N3 hérité les attributs F/V et Essentialité de son N2 parent (override possible)
- Les dépenses récurrentes sont sauvegardées et réutilisées chaque semaine de suivi
- Suppression N3: confirmation de l'utilisateur requise, archivage des transactions historiques associées
- Validation: montant N3 > 0€, fréquence obligatoire, libellé non vide
- Export/Import N3 (optionnel pour MVP) au format CSV

---

### US 4.4 : Paramétrer les Attributs de Flexibilité (F1, F2, F3, Taux Incompressibilité)
**En tant que** utilisateur,
**Je veux** définir les 3 facteurs de flexibilité (F1: Fréquence, F2: Modification Possible, F3: Substitution) et le taux d'incompressibilité pour chaque poste/sous-catégorie,
**Afin de** personnaliser le calcul du score de flexibilité qui pilote la stratégie d'épargne.

**Acceptance Criteria:**
- Écran dédié "Paramètres de Flexibilité" accessible via onglet de configuration
- F1 (Fréquence): slider 1→10 ou boutons radio (Quotidienne/Hebdo/Mensuelle/Annuelle), visual indicator
- F2 (Modification Possible): slider 0→10 ou 4 niveaux textuels (Impossible/Difficile/Possible/Facile)
- F3 (Substitution): slider 0→10 ou 4 niveaux (Aucune/Partielle/Possible/Entière)
- Taux d'incompressibilité: slider 0→100% avec étiquettes (Flexible/Partiellement Incompressible/Incompressible)
- Calcul en temps réel: Score = (F1+F2+F3)/63×100, affiché sous forme de jauge colorée (Rouge <33% / Jaune 33-66% / Vert >66%)
- Valeurs par défaut proposées basées sur le type de dépense (ex: Alimentation=F1:7, F2:4, F3:8, taux=60%)
- Sauvegarde automatique après 1 sec d'inactivité
- Historique des modifications stocké (optionnel) pour audit
- Support du mode sombre

---

### US 4.5 : Appliquer les Paramètres de Flexibilité à Niveaux Multiples (N1, N2, N3)
**En tant que** administrateur de mes finances,
**Je veux** appliquer les paramètres de flexibilité à différents niveaux hiérarchiques,
**Afin de** que les dépenses héritent des valeurs par défaut ou soient personnalisées finement.

**Acceptance Criteria:**
- Héritage en cascade: N3 hérite de N2, N2 hérite de N1, N1 a des valeurs par défaut globales
- Un paramètre modifié à un niveau surcharge tous les niveaux enfants (sauf si override local)
- Bouton "Réinitialiser aux défauts" pour chaque niveau (avec confirmation)
- Matrice visuelle 3×3 (F1 × F2 × F3) permettant de voir les 27 combinaisons possibles et leur score
- Aucune valeur N3 ne peut être vide; si non définie, elle utilise celle du N2 parent
- Version d'audit: timestamp + utilisateur pour chaque modification
- Bulk edit possible: sélectionner plusieurs N2 et appliquer les mêmes F1/F2/F3

---

## EPIC 5 : Phase 2 — Saisie des Transactions (Suivi Hebdomadaire)

### Vue d'ensemble
Phase 2 permet l'enregistrement hebdomadaire des transactions via un wizard 3 étapes, avec suivi des dépenses fixes (pré-remplies) et variables (saisies). L'interface utilise le WeekCalendarSelector et respecte la méthode Kakeibo.

---

### US 5.1 : Naviguer dans un Wizard 3 Étapes pour Enregistrer une Transaction
**En tant que** utilisateur mobile,
**Je veux** saisir une transaction via un processus guidé en 3 étapes,
**Afin de** saisir rapidement et sans erreur mes dépenses hebdomadaires.

**Acceptance Criteria:**
- Écran d'accueil du wizard affiche 3 étapes visuellement: Étape 1 (Poste COICOP) → Étape 2 (Type Transaction) → Étape 3 (Détails)
- Navigation entre étapes via boutons "Suivant" / "Précédent" (Suivant activé si étape valide)
- Barre de progression en haut indique l'étape courante (33%→66%→100%)
- Bouton "Annuler" à chaque étape confirme la sortie sans sauvegarde
- Bouton "Enregistrer" à l'étape 3 valide et sauvegarde la transaction
- Les données saisies persistent lors de la navigation arrière (pas de perte de données)
- Clavier mobile s'affiche/disparaît automatiquement selon le champ actif
- Accessibilité WCAG: focus order logique, labels associés, screen reader support

---

### US 5.2 : Sélectionner le Poste COICOP à l'Étape 1
**En tant que** utilisateur,
**Je veux** choisir le poste de dépenses COICOP qui correspond à ma transaction,
**Afin de** catégoriser correctement mes dépenses.

**Acceptance Criteria:**
- Étape 1 affiche une grille 2 colonnes (ou liste scrollable sur petit écran) des 8 postes COICOP
- Chaque poste affiche icône, code N1, et libellé français (ex: "01 - Alimentation et boissons")
- Sélection via tap sur le poste (feedback visuel: background coloré + checkmark)
- Une fois sélectionné, le poste reste mis en évidence lors du passage à l'étape 2
- Bouton "Suivant" activé uniquement si un poste est sélectionné
- Raccourci clavier optionnel: chiffres 1-8 pour sélectionner rapidement (Web/Desktop mode)

---

### US 5.3 : Sélectionner le Type de Transaction à l'Étape 2
**En tant que** utilisateur,
**Je veux** indiquer le type de transaction (Fixe/Variable/Imprévue/Épargne-Dette),
**Afin de** distinguer les dépenses et les allocations d'épargne.

**Acceptance Criteria:**
- Étape 2 affiche 4 options distinctes avec icônes, couleurs, et descriptions courtes:
  - "Dépense Fixe" (icône cadenas, couleur bleu): dépense répétitive planifiée
  - "Dépense Variable" (icône graphique, couleur orange): dépense flexible, non planifiée
  - "Dépense Imprévue" (icône alerte, couleur rouge): dépense non prévue
  - "Versement Épargne-Dette" (icône tirelire, couleur vert): allocation vers épargne ou remboursement dette
- Sélection mutuelle exclusive (un seul type par transaction)
- Visuellement, le type sélectionné à l'étape 2 déverrouille les options pertinentes à l'étape 3
- Si type="Dépense Fixe", la date est préremplie avec la date de dépense fixe N3 associée
- Si type="Versement Épargne-Dette", des champs spécifiques s'affichent (destination épargne/compte dette)

---

### US 5.4 : Compléter les Détails de la Transaction à l'Étape 3
**En tant que** utilisateur,
**Je veux** remplir les champs détails (Date, Montant, Description, Moyen de paiement, Nature),
**Afin de** disposer d'un enregistrement complet pour suivi et analyse.

**Acceptance Criteria:**
- Étape 3 affiche un formulaire avec 5 champs obligatoires + 1 optionnel:
  1. **Date** (picker calendrier: jour de la semaine actuelle par défaut, éditable)
  2. **Montant** (champ numérique Euro, clavier numérique, validation >0€)
  3. **Description** (champ texte libre, max 100 caractères, suggestion autocomplete optionnelle)
  4. **Moyen de Paiement** (dropdown: Carte Bancaire / Espèces / Virement / Prélèvement, défaut: Carte)
  5. **Nature** (radio buttons: Essentielle / Discrétionnaire, hérité du poste N2 par défaut)
  6. **Notes** (optionnel, champ texte libre, max 500 caractères, pour contexte additionnel)
- Date picker utilise WeekCalendarSelector: affiche la semaine courante en haut avec jours sélectionnables
- Montant accepte formats "25.50", "25,50", "2550" (centime par défaut si 4 chiffres)
- Description affiche suggestions basées sur les saisies récentes de même poste COICOP
- Moyen de paiement pré-sélectionné via settings utilisateur (optionnel)
- Validation avant enregistrement: date ≤ aujourd'hui, montant > 0, description non vide
- Bouton "Enregistrer" trigger la sauvegarde et affiche confirmation toast "Transaction enregistrée"
- Reset du formulaire après enregistrement pour nouvelle saisie (ou retour liste)

---

### US 5.5 : Gérer les Dépenses Fixes Pré-Remplies Chaque Semaine
**En tant que** utilisateur,
**Je veux** que mes dépenses fixes (N3 récurrentes) soient automatiquement saisies chaque semaine,
**Afin de** minimiser la saisie manuelle et garder un suivi précis.

**Acceptance Criteria:**
- À chaque début de semaine (lundi ou configurable), les dépenses fixes N3 marquées "Fixe" sont pré-enregistrées
- Les transactions pré-remplies s'affichent dans la liste des transactions hebdomadaires avec un badge "Automatique"
- Chaque transaction pré-remplie peut être éditée (montant, date, description), supprimée, ou dupliquée
- Les dépenses fixes mensuelisées/bihebdo sont saisies à la semaine correspondante calculée
- Un toggle "Activer pré-remplissage" permet à l'utilisateur de désactiver cette fonctionnalité globalement
- Historique: les transactions pré-remplies sont tracées (source: "auto", timestamp, dépense N3 associée)
- Notification optionnelle: "X dépenses fixes enregistrées cette semaine" affichée en haut de page

---

### US 5.6 : Verrouiller/Déverrouiller une Semaine via WeekCalendarSelector
**En tant que** utilisateur,
**Je veux** verrouiller une semaine après vérification pour éviter les modifications accidentelles,
**Afin de** sécuriser les données finalisées.

**Acceptance Criteria:**
- WeekCalendarSelector affiche une vue calendrier mobile-optimisée: 7 jours de la semaine en ligne
- Chaque jour affiche une petite icône d'état: "verrouillé" (cadenas fermé) ou "déverrouillé" (cadenas ouvert)
- Long-press (ou swipe) sur une semaine affiche un menu: "Verrouiller la semaine" / "Déverrouiller la semaine"
- Une semaine verrouillée empêche toute création/édition/suppression de transaction pour cette semaine
- Feedback visuel: semaine verrouillée affichée en gris/désaturée, interface non-interactive
- Toast de confirmation: "Semaine verrouillée jusqu'au [date]"
- Déverrouillage demande une confirmation biométrique (optionnel, basé sur settings utilisateur)
- L'admin de l'app peut forcer le verrouillage d'une semaine antérieure (optionnel)

---

### US 5.7 : Intégration CalendarEventBus pour Synchronisation des Transactions
**En tant que** système LELE PFM,
**Je veux** synchroniser les événements de transaction (création, édition, suppression) via un bus événementiel,
**Afin de** maintenir cohérence entre les vues et les recalculs en temps réel.

**Acceptance Criteria:**
- Chaque création/édition/suppression de transaction émet un événement CalendarEventBus du type:
  - `TransactionCreatedEvent(date, montant, poste, type)`
  - `TransactionUpdatedEvent(transactionId, champs_modifiés)`
  - `TransactionDeletedEvent(transactionId, date)`
- Les listeners abonnés (dashboard, récapitulatif, calcul EPR) reçoivent les événements instantanément
- Les événements incluent un timestamp et un hash de vérification d'intégrité
- Historique des événements stocké dans une table audit (optionnel mais recommandé)
- Replay des événements possible pour synchronisation offline→online
- Latence max 200ms entre émission et rafraîchissement de l'UI

---

## EPIC 6 : Phase 3 — Vue d'Ensemble (AnalysisConfigurationPage)

### Vue d'ensemble
AnalysisConfigurationPage sert de bridge en lecture seule entre Module 1 (Configuration) et Module 3 (Suivi), affichant les statistiques clés de la configuration des dépenses.

---

### US 6.1 : Afficher les 4 Stat Cards de Configuration
**En tant que** utilisateur,
**Je veux** voir un résumé rapide de ma configuration de dépenses,
**Afin de** valider que le paramétrage est correct avant de démarrer le suivi.

**Acceptance Criteria:**
- AnalysisConfigurationPage affiche 4 cartes statistiques en grille 2×2 (ou 1×4 en portrait slim):
  1. **Postes de Dépenses Configurés**: nombre total de postes N1 actifs avec icône (ex: "8/8 postes")
  2. **Total Sous-Catégories**: nombre total de N2 configurées (ex: "47 sous-catégories")
  3. **Moyenne Taux Incompressibilité**: moyenne pondérée du taux (ex: "62.3%")
  4. **Moyenne Score Flexibilité**: moyenne pondérée du score (F1+F2+F3)/63×100 (ex: "54.8/100")
- Chaque carte affiche:
  - Valeur principale en gros texte (gris foncé light mode, blanc dark mode)
  - Libellé explicite en texte plus petit
  - Icône pertinente (alignée top-right ou top-left)
  - Couleur de fond légère (ex: bleu clair, vert clair)
- Tap sur chaque carte ouvre le détail correspondant (voir US 6.2)
- Refresh en pull-down sur la page actualise les statistiques
- Pas de données en temps réel: les stats reflètent la configuration à T, pas les transactions actuelles

---

### US 6.2 : Afficher les Cards Dépliables avec Tableau des Sous-Catégories (9 Colonnes)
**En tant que** utilisateur,
**Je veux** explorer chaque statistique en détail via un tableau des sous-catégories,
**Afin de** vérifier les attributs de chaque N2 et détecter les anomalies.

**Acceptance Criteria:**
- Tap sur une Stat Card déploie un accordéon affichant un tableau scrollable horizontalement sur mobile
- Le tableau affiche 9 colonnes pour chaque N2:
  1. **Code N2** (ex: "01.1.1", largeur fixe 50px)
  2. **Libellé N2** (ex: "Pains et céréales", largeur flex)
  3. **Type F/V** (Fixe ou Variable, largeur 70px, badge coloré)
  4. **Essentialité** (Essentielle/Discrétionnaire, largeur 100px, icône)
  5. **Taux Incompressibilité** (ex: "65%", largeur 70px, jauge couleur)
  6. **F1 Fréquence** (ex: "7/10", largeur 60px)
  7. **F2 Modification** (ex: "4/10", largeur 60px)
  8. **F3 Substitution** (ex: "8/10", largeur 60px)
  9. **Score Flexibilité** (ex: "63/100", largeur 70px, jauge couleur rouge-jaune-vert)
- Les colonnes 6-8 sont résumées sur mobile: peut-être une "Moyenne F = (F1+F2+F3)/3" unique en place des 3
- Tri possible sur chaque colonne (tap sur header)
- Couleur des lignes alternée (blanc/gris clair) pour lisibilité
- Scroll vertical si >10 N2 dans un poste
- Export CSV optionnel: bouton "Exporter" en bas du tableau
- Mode sombre: texte blanc sur fond gris, bordures subtiles

---

### US 6.3 : Gérer la Lecture Seule de la Configuration
**En tant que** utilisateur,
**Je veux** visualiser la configuration sans pouvoir la modifier depuis cette page,
**Afin de** éviter les changements accidentels du paramétrage.

**Acceptance Criteria:**
- Aucun bouton "Éditer" visible sur AnalysisConfigurationPage
- Tap long (long-press) sur les champs n'affiche pas de menu contextuel
- Tous les éléments (cards, tableaux) sont non-interactifs sauf pour la navigation (tap → détail, swipe → retour)
- Un bandeau informatif en haut indique "Lecture seule - Modifier la configuration en Module 1"
- Lien ou bouton "Aller à la Configuration" redirige vers Module 1 si modification nécessaire
- Les données affichées sont synchronisées en temps réel avec Module 1 via une requête API GET (pas POST)

---

## EPIC 7 : Phase 3 — Alignement Budget & Journal des Transactions

### Vue d'ensemble
DataAlignmentPage et CostRecapByEmployeePage (renommée "CostRecapByCategory") affichent le journal des transactions enregistrées, les EPR calculés, et les statistiques hebdomadaires.

---

### US 7.1 : Calculer et Afficher les EPR (Économies Potentiellement Réalisables) par Poste
**En tant que** système,
**Je veux** calculer les EPR pour chaque poste COICOP et transaction,
**Afin de** quantifier l'impact potentiel de chaque dépense sur l'épargne.

**Acceptance Criteria:**
- Formule EPR/POSTE pour une semaine donnée:
  ```
  EPR_POSTE = Σ (EPR_hebdo × category_rate × flexibility_rate)
  où:
  - EPR_hebdo = montant dépense variable
  - category_rate = poids du poste dans stratégie épargne (défaut 1.0)
  - flexibility_rate = (taux_incompressibilité) / 100 ajusté par score flexibilité
  ```
- EPR calculé pour chaque transaction individuelle (N3):
  ```
  EPR_transaction = montant × (1 - taux_incompressibilité/100) × (score_flexibilité/100)
  ```
- Les EPR sont arrondis à 2 décimales (cents)
- Stockage EPR_transaction dans la table transactions (colonne EPR float)
- Recalcul automatique si montant, taux, ou score modifié
- EPR négatif ou nul affiché comme "0.00€" (pas de perte)
- Audit trail: timestamp du dernier recalcul stocké

---

### US 7.2 : Utiliser getLastCompletedWeek() pour Déterminer la Semaine de Référence
**En tant que** système,
**Je veux** identifier automatiquement la dernière semaine complète,
**Afin de** afficher les données les plus récentes et cohérentes.

**Acceptance Criteria:**
- Fonction `getLastCompletedWeek()` interroge la base et retourne:
  - `week_start_date` (lundi)
  - `week_end_date` (dimanche)
  - `is_locked` (booléen)
  - `completion_percentage` (%)
- Une semaine est "complète" si:
  - Toutes les dépenses fixes attendues sont saisies OU
  - Au moins 80% des jours ont une transaction enregistrée OU
  - État verrouillé = true
- Si aucune semaine complète: retourner la semaine courante par défaut
- Caching résultat 1 heure (TTL configurable)
- Fallback: si requête échoue, utiliser last_week_in_local_db

---

### US 7.3 : Afficher le Journal des Transactions avec 4 Stat Cards
**En tant que** utilisateur,
**Je veux** voir un résumé rapide de mes transactions pour la semaine,
**Afin de** constater d'un coup d'œil mon activité financière.

**Acceptance Criteria:**
- DataAlignmentPage affiche en haut 4 cartes statistiques (horizontale scrollable sur mobile narrow):
  1. **Total Dépensé**: montant total semaine (ex: "245.67€"), couleur orange
  2. **Nombre de Transactions**: count transactions (ex: "12"), couleur bleu
  3. **Postes Impactés**: nombre de postes COICOP distincts (ex: "5/8"), couleur vert
  4. **Solde Restant**: budget initial - total dépensé (ex: "+154.33€"), couleur gris (rouge si négatif)
- Chaque carte affiche valeur + libellé + petite icône
- Tap sur "Total Dépensé" trie tableau par montant décroissant
- Tap sur "Postes Impactés" filtre par poste ou affiche distribution pie chart optionnelle
- Format devise respecte settings utilisateur (€, symbole, séparants)

---

### US 7.4 : Afficher le Tableau des Transactions avec 3 Filtres
**En tant que** utilisateur,
**Je veux** filtrer et rechercher mes transactions rapidement,
**Afin de** trouver les dépenses pertinentes dans une longue liste.

**Acceptance Criteria:**
- DataAlignmentPage affiche un tableau scrollable (vertical) des transactions avec colonnes:
  1. **Date** (ex: "Lun 10/02", largeur 60px)
  2. **Libellé/Description** (ex: "Baguette Boulangerie", flex)
  3. **Poste COICOP** (ex: "Alimentation", largeur 90px, code + libellé court)
  4. **Type Transaction** (ex: "Variable", largeur 80px, badge couleur)
  5. **Nature** (ex: "Essentielle", largeur 80px, icône)
  6. **Montant** (ex: "2.50€", largeur 70px, aligné droite, gras)
  7. **Moyen de Paiement** (ex: "CB", largeur 50px, icône)
- Tap sur ligne ouvre un panneau détails (voir US 7.5)
- Swipe gauche: bouton "Éditer" et "Supprimer" (confirmation requise)
- Les 3 filtres disponibles:
  1. **Recherche textuelle**: input box top de page, cherche dans Description + Code N2 (regex case-insensitive)
  2. **Poste COICOP**: dropdown/checkbox list affichant 8 postes (sélection multiple possible)
  3. **Type Transaction**: checkbox list (Fixe / Variable / Imprévue / Épargne-Dette)
- Filtres combinent en AND logique (ex: poste=Alimentation AND type=Variable)
- Badge rouge "3" au-dessus des filtres indique nombre de filtres actifs
- Bouton "Réinitialiser" nettoie tous les filtres
- État des filtres persisté en sessionStorage (pas en DB)
- Tableau sans résultats affiche "Aucune transaction ne correspond aux filtres"

---

### US 7.5 : Afficher un Panneau Détails avec 3 Blocs par Transaction
**En tant que** utilisateur,
**Je veux** voir tous les détails d'une transaction dans un panneau coulissant,
**Afin de** auditer et éditer les données précises.

**Acceptance Criteria:**
- Tap sur ligne du tableau ouvre un bottom sheet (mobile) ou side panel (tablet) glissant de bas en haut
- Panneau affiche 3 blocs distincts:
  1. **Bloc Principal**:
     - Icône gros poste COICOP (top-left)
     - Montant en énorme police (ex: "45.99€", couleur accent)
     - Description sous montant
     - Type transaction (badge couleur)
  2. **Bloc Détails**:
     - Date de saisie (ex: "Lun 10 février 2025")
     - Heure saisie (ex: "14:32")
     - Nature (Essentielle/Discrétionnaire)
     - Moyen de paiement (CB/Espèces/Virement/Prélèvement)
     - Notes (si présentes)
  3. **Bloc Calculs** (en lecture seule):
     - EPR calculé pour cette transaction (ex: "8.95€")
     - Taux incompressibilité appliqué (ex: "80%")
     - Score flexibilité appliqué (ex: "56/100")
     - Contribution à l'économie totale (ex: "3.6%")
- Boutons en bas du panneau:
  - "Éditer" → rouvre le wizard 3 étapes avec pré-remplissage
  - "Dupliquer" → crée une copie pour même jour/semaine
  - "Supprimer" → confirmation avant suppression
  - "Fermer" (X en haut-droite)
- Swipe down = fermer le panneau
- Animation de ouverture/fermeture smooth (framer-motion)
- Mode sombre: fond gris foncé, texte blanc

---

### US 7.6 : Remplacer la Colonne "Durée" HCM par "Moyen de Paiement" PFM
**En tant que** Product Manager PFM,
**Je veux** adapter l'interface au contexte PFM (non-employé, pas de durée, mais moyen de paiement important),
**Afin de** que les colonnes reflètent les données métier pertinentes.

**Acceptance Criteria:**
- Colonne "Durée" du HCM (Cost Savings) n'apparaît JAMAIS dans le journal des transactions PFM
- Colonne "Moyen de Paiement" affiche l'une des 4 valeurs: "Carte Bancaire", "Espèces", "Virement", "Prélèvement"
- Chaque moyen de paiement a une icône distinctive (carte=💳, cash=💵, virement=🏦, prélèvement=📋)
- Icône seule affichée dans le tableau (label complet visible au hover sur desktop ou en panneau détails)
- Filtre "Moyen de Paiement" optionnel (voir US 7.4 variante)
- Rapports (EPIC 9) agrègent aussi par moyen de paiement si utile

---

## EPIC 8 : Phase 3 — Bilan des Performances (PerformanceRecapPage)

### Vue d'ensemble
PerformanceRecapPage synthétise les performances hebdomadaires et génère la distribution d'épargne par priorités (Fonds Urgence, Dette, Investissement, Plaisir) selon une chaîne de 6 étapes.

---

### US 8.1 : Exécuter la Chaîne de Calcul 6 Étapes (Pas 8)
**En tant que** système LELE PFM,
**Je veux** calculer les performances et épargnes via une séquence cohérente en 6 étapes,
**Afin de** obtenir des résultats fiables et auditables.

**Acceptance Criteria:**
- Chaîne de calcul 6 étapes (transactions déjà en €, pas de conversion):
  1. **Consolidation hebdo**: Σ(montants transactions semaine) par poste COICOP
  2. **Calcul EPR par poste**: Σ(EPR_transaction) via formule US 7.1
  3. **Agrégation par type transaction**: sommer EPR par (Fixe / Variable / Imprévue)
  4. **Calcul taux réduction**: (EPR_hebdo_total / total_dépenses) × 100
  5. **Ajustement distribution**: répartir EPR selon priorités P1→P4 (voir US 8.4)
  6. **Validation conformité**: vérifier totalEPR_distribué = totalEPR_calculé (voir US 8.6)
- Chaque étape sortie logée (logging.info) pour audit et debug
- Résultat final: objet JSON {semaine, totalEPR, P1, P2, P3, P4, validated: true/false}
- Stockage résultat en table performance_recap (clé: week_id)
- Recalcul déclenché si transaction modifiée dans la semaine
- Temps d'exécution cible <500ms (optimisé avec index DB)

---

### US 8.2 : Afficher les Données par 3 Niveaux Hiérarchiques (N1/N2/Total) avec Code PRC
**En tant que** utilisateur,
**Je veux** voir les performances au niveau global (Total), poste (N1), et sous-catégorie (N2),
**Afin de** identifier les postes d'économie prioritaires.

**Acceptance Criteria:**
- PerformanceRecapPage affiche un tableau hiérarchique scrollable:
  - Niveau 1: "TOTAL" (row totalisante, gras, couleur accent)
  - Niveau 2: 8 postes COICOP (N1), indentés 0px, clic → déplier/replier
  - Niveau 3: N2 sous chaque N1, indentés 15px
- Chaque ligne affiche colonnes (adaptées au niveau):
  - **Libellé** (ex: "Alimentation et boissons")
  - **Dépenses €** (montant consolidé)
  - **EPR €** (économies réalisables)
  - **Taux Réduction %** (EPR / dépenses)
  - **Code PRC** (Poste Réductible Confirmé: "PRC-01.1.1" pour N2, "PRC-01" pour N1, "PRC-TOTAL" pour Total)
- Code PRC utilisé comme clé unique pour rapports et cross-références
- Couleur ligne variant selon taux réduction (vert >20%, jaune 10-20%, rouge <10%)
- Les lignes N2 héritent couleur du N1 parent si aucun taux propre
- Tap sur chevron N1 déplie/replie les N2 (animation smooth)
- Persistance des états dépliés/repliés en sessionStorage

---

### US 8.3 : Afficher 4 Onglets de Résultats + 1 EKH Calculé
**En tant que** utilisateur,
**Je veux** naviguer entre différentes analyses (par type transaction, par nature, par moyen paiement, custom),
**Afin de** comprendre les sources et réductions d'économies.

**Acceptance Criteria:**
- 4 onglets principaux affichés sous le titre PerformanceRecapPage:
  1. **"Par Type"**: agrégation par type transaction (Fixe / Variable / Imprévue)
  2. **"Par Nature"**: agrégation par essentialité (Essentielle / Discrétionnaire)
  3. **"Par Moyen"**: agrégation par moyen de paiement (CB / Espèces / Virement / Prélèvement)
  4. **"Détail"**: tableau détaillé par N2 (voir US 8.2)
- Onglet 1-3 affichent un tableau résumé 4 colonnes: Catégorie, Dépenses €, EPR €, Taux %
- Chaque onglet coloré différemment (icône + couleur header)
- Swipe horizontal navigue entre onglets (mobile)
- 1 onglet supplémentaire "EKH" calculé:
  - **EKH (Extra Kitty Holdings)** = score de satisfaction épargne hebdomadaire
  - Formule: `EKH = (EPR_total / (budgetInit - fixesMandat)) × 100` capped at 100%
  - Affiché comme jauge 0→100 avec couleur et label (ex: "Excellent 92%")
  - EKH stocké séparé de la distribution P1→P4 (pas ligne comptable, pas ligne D)
- Tab EKH affiche simplement la jauge + 3 KPIs:
  - Taux épargne hebdo
  - Tendance vs semaine précédente (↑/↓/→)
  - Projection annuelle (EKH × 52 semaines)

---

### US 8.4 : Configurer la Distribution Waterfall (P1→P4) sans Hardcoding 67/33
**En tant que** administrateur de mes finances,
**Je veux** définir ma propre distribution d'épargne par priorités,
**Afin que** les économies réalisées soient allouées selon mes objectifs personnels.

**Acceptance Criteria:**
- Écran "Configuration Distribution" accessible depuis PerformanceRecapPage (bouton ⚙️ en haut)
- 4 sliders indépendants pour les priorités (P1, P2, P3, P4):
  - **P1 (Fonds Urgence)**: slider 0→100%, label descriptif "Réserve d'urgence (3 mois salaire)"
  - **P2 (Dette)**: slider 0→100%, label "Remboursement dettes (méthode avalanche)"
  - **P3 (Investissement)**: slider 0→100%, label "Épargne investissement (long terme)"
  - **P4 (Plaisir)**: slider 0→100%, label "Budget loisirs/achats discrétion"
- Validation: somme P1+P2+P3+P4 doit = 100% (champ total affiche "100%" en vert, ou "110% - Réduire de 10%" en orange)
- Si total <100%, reste allocation non assignée (affiché en gris)
- Valeurs par défaut proposées: P1=30%, P2=35%, P3=20%, P4=15% (recommandation basée sur bonnes pratiques)
- Bouton "Restaurer défauts" réinitialise
- Sauvegarde auto après 1 sec inactivité
- Ces % appliqués au calcul EPR: `P1_amount = totalEPR × (P1/100)`, etc.
- Distribution historisée (optionnel): changer % crée entry dans audit log

---

### US 8.5 : Afficher la Distribution des Économies par Priorités (Waterfall)
**En tant que** utilisateur,
**Je veux** visualiser comment mon épargne potentielle est allouée aux 4 priorités,
**Afin de** vérifier l'alignement avec mes objectifs.

**Acceptance Criteria:**
- Après configuration (US 8.4), PerformanceRecapPage affiche un bloc "Distribution Épargnes" sous les onglets
- Format waterfall horizontal (mobile-friendly):
  - Barre totale affiche totalEPR (ex: "127.45€") à gauche
  - 4 segments colorés P1/P2/P3/P4 stacked horizontalement (ou vertical en portrait)
  - Coleurs fixes: P1=bleu, P2=orange, P3=vert, P4=rose/pourpre
  - Chaque segment affiche (ex: "P1: 38.24€ (30%)")
  - Au total droite, affiche label "Total à investir"
- Tap sur segment affiche popup détail: montant exact, %ge, compte destination si configuré
- Formule affichée en légende: "Distribution = EPR × %priorités"
- Export PDF optionnel inclut ce waterfall

---

### US 8.6 : Valider l'Éligibilité de Distribution (totalÉconomies > 0)
**En tant que** système,
**Je veux** vérifier que la distribution ne s'active que si des économies sont détectées,
**Afin de** éviter une mauvaise allocation de zéro.

**Acceptance Criteria:**
- Fonction `validateWaterfallConformity()` retourne `{valid: boolean, message: string}`
- Distribution est éligible (valid=true) SI et seulement SI:
  - `totalEPR > 0.01€` (au moins 1 centime)
  - `getLastCompletedWeek()` retourne une semaine valide
  - Tous les paramètres F1/F2/F3/taux payés sont définis (pas null/undefined)
- Distribution inéligible (valid=false) affiche message à l'utilisateur:
  - "Aucune économie détectée cette semaine - Enregistrez des transactions pour calculer."
  - "Semaine incomplète - Veuillez verrouiller ou compléter 80% des jours."
  - "Configuration invalide - Vérifiez les paramètres de flexibilité."
- Boutons "Configurer Distribution" grisés si invalide
- Bloc waterfall caché si invalide (remplacé par CTA "Enregistrer des transactions")
- Validation logée (logging.warn) pour audit

---

## EPIC 9 : Phase 3 — Reporting & Dashboards

### Vue d'ensemble
CostSavingsReportingPage synthétise les données hebdomadaires via 5 blocs de rapports, avec support multi-devise et période custom.

---

### US 9.1 : Afficher 5 Blocs de Rapport Principaux
**En tant que** utilisateur,
**Je veux** consulter un rapport complet d'épargnes organisé en sections distinctes,
**Afin de** analyser ma performance financière de manière structurée.

**Acceptance Criteria:**
- CostSavingsReportingPage affiche 5 blocs principaux en vertical (mobile-optimisé):
  1. **"Économies par Type"** (voir US 9.2)
  2. **"Économies par COICOP"** (voir US 9.3)
  3. **"Waterfall Séquentiel Unique"** (voir US 9.4)
  4. **"Analyse Contribution"** (voir US 9.5)
  5. **"Risk Budget P3"** (voir US 9.6)
- Chaque bloc a:
  - Titre en H3 (ex: "Économies par Type")
  - Icône distinctive (top-left ou top-right)
  - Bouton "Détails" ou "Exporter" dans l'en-tête
  - Contenu principal (graphique, tableau, texte)
  - Petit légende en bas si applicable
- Les blocs se déploient/replient indépendamment (accordéon optionnel)
- Scroll vertical entre les 5 blocs
- Mode sombre supporté: fond gris foncé, texte blanc

---

### US 9.2 : Bloc "Économies par Type" — Graphique + Chiffres
**En tant que** utilisateur,
**Je veux** voir comment les économies se répartissent par type transaction,
**Afin de** identifier les catégories contribuant le plus à l'épargne.

**Acceptance Criteria:**
- Bloc affiche un graphique pie chart ou donut chart (lib: recharts, visx, ou chart.js) avec 4 tranches:
  - Dépense Fixe: couleur bleu clair
  - Dépense Variable: couleur orange
  - Dépense Imprévue: couleur rouge clair
  - Épargne-Dette: couleur vert clair
- Chaque tranche affiche %ge total + montant €:
  - Label externe: "Variable 45.2% (57.39€)"
- Interactivité:
  - Tap/hover sur tranche affiche tooltip détaillé
  - Tap sur légende déselect/reselect tranche
- Sous le graphique, tableau résumé 3 colonnes:
  - Type | Montant € | % du Total
- Total général en bas: "Total Économies: 127.45€"
- Export PNG: bouton "Télécharger" enregistre graphique

---

### US 9.3 : Bloc "Économies par COICOP" — Ranking des Postes
**En tant que** utilisateur,
**Je veux** voir quels postes COICOP contribuent le plus aux économies,
**Afin d'** ajuster ma stratégie par catégorie.

**Acceptance Criteria:**
- Bloc affiche un classement (ranking) horizontal bar chart (barres orientées droite):
  - Axe Y: 8 postes COICOP (ex: "Alimentation", "Loisirs", "Transport")
  - Axe X: montant EPR € (ex: 0→130€)
  - Chaque barre colorée par poste (icône du poste top-left)
  - Valeur affichée sur la barre ou à droite: "45.67€ (35.8%)"
- Barres triées décroissant (poste avec plus d'EPR en haut)
- Tap sur barre expande au-dessous: détail des N2 de ce poste
  - Affiche sous-tableau: N2_label | EPR € | Taux %
- Sous le graphique, totalisateur:
  - "Postes impactés: 5/8" + "EPR moyen par poste: 25.49€"
- Couleur grise pour postes avec EPR=0 (optionnel, ou masquer)

---

### US 9.4 : Bloc "Waterfall Séquentiel Unique" — Distribution P1→P2→P3→P4
**En tant que** utilisateur,
**Je veux** visualiser le flux séquentiel d'allocation d'épargne dans les 4 priorités,
**Afin de** comprendre comment les économies réalisées sont utilisées.

**Acceptance Criteria:**
- Bloc affiche un waterfall chart vertical (ou horizontal sur petit écran):
  - Colonne 1: "EPR Total" (barre pleine, ex: 127.45€)
  - Colonne 2: "P1 Fonds Urgence" (ex: 38.24€, 30%)
  - Colonne 3: "P2 Dette" (ex: 44.61€, 35%)
  - Colonne 4: "P3 Investissement" (ex: 25.49€, 20%)
  - Colonne 5: "P4 Plaisir" (ex: 19.11€, 15%)
  - Colonne 6: "Solde Non Alloué" (ex: 0€, gris si 0)
- Chaque colonne affiche:
  - Montant € en gros texte au centre/sommet de barre
  - %ge total en petit texte sous
  - Couleur distincte (bleu/orange/vert/rose/gris)
- Les colonnes sont connectées par des lignes/flèches indiquant le flux
- Interactivité: tap sur colonne affiche popup détail (compte destination, date visée, etc.)
- Formule affichée en légende: "P1 = EPR × 30%, P2 = EPR × 35%, etc."
- Comparaison optionnelle: "vs. semaine précédente: P1 +5%, P2 -2%, etc."

---

### US 9.5 : Bloc "Analyse Contribution" — Contribution par Poste au Total Épargne
**En tant que** utilisateur,
**Je veux** analyser quelle part de mon épargne provient de chaque poste COICOP,
**Afin de** valider que les plus gros postes contribuent proportionnellement.

**Acceptance Criteria:**
- Bloc affiche un tableau contributif:
  - Colonne 1: Poste COICOP (code + libellé, ex: "01 - Alimentation")
  - Colonne 2: EPR € (montant économie, ex: "45.67€")
  - Colonne 3: Contribution % (part du total, ex: "35.8%")
  - Colonne 4: Rang (ex: "1", "2", ... "8")
- Lignes triées décroissant par EPR
- Couleur alternée lignes (blanc/gris clair)
- Ligne Total en bas (gras): "TOTAL | 127.45€ | 100.0% | —"
- Sparkline optionnelle colonne 5: micro-graphique de tendance semaine-1 à semaine actuelle
- Calcul contribution: `% = (EPR_poste / totalEPR) × 100`
- Validation: somme des % = 100% exactement

---

### US 9.6 : Bloc "Risk Budget P3" — Analyse Risque pour Investissement (P3 uniquement)
**En tant que** utilisateur avec objectifs d'investissement,
**Je veux** analyser le budget risque alloué à P3 (Investissement),
**Afin de** évaluer l'exposition et l'adéquation de ma stratégie.

**Acceptance Criteria:**
- Bloc "Risk Budget P3" n'affiche que si P3 % > 0 (sinon masqué ou grisé)
- Contenu:
  - Montant P3 hebdo: "25.49€ / semaine" (gros texte)
  - Projection annuelle: "1,325.48€ / an" (petit texte)
  - Budget risque cible (configurable): ex "500€ - réserve prudente" vs "2000€ - agressif"
  - Jauge de couverture: (P3_hebdo_annuel / budget_cible_risque) × 100
    - <50%: rouge "Sous-budgétisé"
    - 50-100%: jaune "En cours"
    - >100%: vert "Objectif atteint"
- Tableau détail optionnel: historique P3 par 4 semaines précédentes
  - Semaine | P3 € | Cumul 4w | Tendance
- Alerte: si P3 trop faible relativement au budget cible, affiche CTA "Augmenter allocation P3"
- Note disclaimer: "P3 comporte des risques d'investissement; consulter conseiller avant allocation"

---

### US 9.7 : Smart Calendar, Period Validation, Multi-devise, Dark Mode
**En tant que** utilisateur avancé,
**Je veux** que la page rapports supporte les sélections de périodes custom, devises, et thèmes,
**Afin de** adapter l'affichage à mes préférences et besoins.

**Acceptance Criteria:**
- **Smart Calendar**: picker de dates en haut de page (au-dessus du titre)
  - Sélection par défaut: "Semaine courante"
  - Options: "Semaine précédente", "Mois courant", "Mois précédent", "Trimestre", "Année", "Custom"
  - Custom: deux date pickers (date_début, date_fin) avec validation
  - Affiche période active en haut: "Rapport: 10 - 16 février 2025" (ou "4 semaines" si multi-semaine)
- **Period Validation**:
  - Si sélection inclut plusieurs semaines, agrégation des données (somme EPR, moyenne %, etc.)
  - Si date_fin > aujourd'hui, affiche warning "Période future - données partielles"
  - Si date_début > date_fin, affiche erreur rouge "Dates invalides"
- **Multi-devise**:
  - Dropdown "Devise" (défaut: EUR) → permet sélectionner USD, GBP, CHF, etc.
  - Tous les montants € convertis au taux journalier (API externe ou rate cache)
  - Symbole devise affiché partout (ex: "$127.45" pour USD)
  - Format ajusté: 1,234.56$ vs 1.234,56€ selon convention locale
- **Dark Mode**:
  - Bascule theme via icône ☀️/🌙 en haut-droit
  - Palette: fond gris-900, texte blanc, couleurs adoucies (poste COICOP, waterfall, etc.)
  - Graphiques recharts/visx/chart.js adaptent automatiquement couleurs
  - Persistance: setting stocké en localStorage

---

## EPIC 10 : Phase 3 — Centre de Performance

### Vue d'ensemble
PerformanceCenterPage synthétise les performances par semaine avec notation /10 et grades, tandis que GlobalPerformanceCenterPage agrège à niveau mensuel. Le modèle hiérarchique Mois → Semaines remplace la granularité HCM (BL → Employés).

---

### US 10.1 : Afficher la Hiérarchie Temporelle Mois → Semaines
**En tant que** utilisateur,
**Je veux** naviguer par hiérarchie temporelle (mois contenants semaines),
**Afin de** analyser les performances à différents niveaux de détail.

**Acceptance Criteria:**
- PerformanceCenterPage affiche:
  - En haut: sélecteur de mois (ex: "Février 2025") avec chevrons ← / → pour mois précédent/suivant
  - Sous: liste des semaines du mois sélectionné (4-5 semaines selon mois)
  - Chaque semaine affiche: "Semaine du 10-16 février" ou numéro ISO "Sem 07"
- Hiérarchie inversée possible (GlobalPerformanceCenterPage affiche mois, tap → ouvre PerformanceCenterPage)
- VirtualizedWeekList (voir US 10.3) pour performances des semaines listées
- Caching: mois précédent/suivant pré-fetch en arrière-plan (optionnel optimisation)

---

### US 10.2 : Calculer et Afficher Note /10 et Grade (A+ à E) par Semaine
**En tant que** système,
**Je veux** générer une note et grade pour chaque semaine,
**Afin de** fournir un feedback simple et motivant à l'utilisateur.

**Acceptance Criteria:**
- Calcul de note /10 par semaine:
  ```
  Score = (EKH/100 × 4) + (taux_transactions_complétées × 3) + (respect_budgets × 2) + (variation_EPR × 1)
  Avec caps: EKH 0-100%, complétude 0-100%, respect 0-100%, variation -10% à +10%
  ```
- Conversion note → grade:
  - 9.0-10.0: A+ (emoji 🌟, couleur doré/jaune)
  - 8.0-8.9: A (emoji ⭐, couleur bleu foncé)
  - 7.0-7.9: B (emoji ✓, couleur vert)
  - 6.0-6.9: C (emoji ◐, couleur orange)
  - 5.0-5.9: D (emoji ▼, couleur orange foncé)
  - 0-4.9: E (emoji ✗, couleur rouge)
- Grade stocké en table performance_recap (champ grade TEXT)
- Note affichée avec décimale 1 (ex: "8.3/10 - Grade A")
- Évolution grade vs semaine précédente affichée en badge (↑/↓/→ + flèche couleur)

---

### US 10.3 : Utiliser WeeklyBudgetReport (Remplace PerformanceBulletin)
**En tant que** utilisateur,
**Je veux** consulter un rapport structuré par semaine (WeeklyBudgetReport),
**Afin de** avoir une synthèse hebdomadaire claire et complète.

**Acceptance Criteria:**
- WeeklyBudgetReport remplace PerformanceBulletin du HCM
- Chaque semaine affiche son rapport encapsulant:
  - En-tête: "Semaine 10-16 février 2025" + grade/note
  - 4 KPI cartes (semblables à EPIC 7 US 7.3):
    - Total Dépensé
    - Nombre Transactions
    - Postes Impactés
    - Solde Restant
  - Tableau performance (voir US 10.5): 9 colonnes synthétiques
  - Distribution waterfall (voir EPIC 8 US 8.5)
  - Comparaison semaine précédente: "+5% EPR", "-2% dépenses", etc.
- Format compact mobile (cards stacked) vs expanded tablet (grid 2×2)
- La structure réutilise composants des pages précédentes (EPIC 7-9) pour cohérence

---

### US 10.4 : Afficher VirtualizedWeekList pour Optimisation Performance
**En tant que** système mobile,
**Je veux** optimiser le rendu d'une longue liste de semaines via virtualisation,
**Afin de** éviter lag et consommation mémoire excessive.

**Acceptance Criteria:**
- VirtualizedWeekList utilise une libraire virtualisation (react-window, react-virtualized, ou équivalent)
- Render seulement 3-5 semaines visibles à l'écran + 2 buffer (scroll buffer)
- Chaque WeekCell (voir US 10.2 badge) créée/détruite dynamiquement
- Scroll fluide sans freeze (target 60 FPS)
- API: `<VirtualizedWeekList weeks={[]} height={600} onWeekSelect={handleClick} />`
- Supporte scroll autom. sur sélection (jump to semaine spécifique)
- Test: liste 52 semaines (1 an) doit être smooth sans lag

---

### US 10.5 : Afficher GlobalPerformanceCenterPage avec 7 Blocs + Sticky Footer
**En tant que** utilisateur,
**Je veux** voir un tableau de bord global synthétisant l'ensemble de mes performances mensuelles,
**Afin d'** évaluer les tendances et ajuster ma stratégie.

**Acceptance Criteria:**
- GlobalPerformanceCenterPage affiche 7 blocs principaux en vertical:
  1. **Sélecteur de Mois** (picker mois-année, ex "Février 2025")
  2. **4 Stat Cards Mensuels** (Total Dépensé, Transactions, Postes, Solde)
  3. **Tableau Détaillé 9 Colonnes** (voir US 10.6)
  4. **Waterfall Distribution P1→P4** (agrégé mois)
  5. **Graphique Tendance EPR** (courbe semaines du mois, X=semaine Y=EPR€)
  6. **Ranking Postes COICOP** (top 5 contribuant EPR)
  7. **Bloc Recommandations** (IA optionnelle: "Alimentation réductible de 8%", etc.)
- **Sticky Footer** en bas affiche en permanence:
  - Total mois à gauche: "Total Mois: 127.45€"
  - Bouton "Exporter Rapport" à droite
  - Sauvegarde du scroll position si retour page

---

### US 10.6 : Tableau 9 Colonnes — Synthèse Hebdomadaire pour Mois
**En tant que** utilisateur,
**Je veux** voir un tableau synthétisant chaque semaine du mois avec 9 métriques,
**Afin de** comparer rapidement les semaines et identifier les anomalies.

**Acceptance Criteria:**
- Tableau affiche 1 ligne par semaine du mois + 1 ligne TOTAL en bas:
  - **Col 1: Semaine** (ex: "Sem 07\n10-16 fév")
  - **Col 2: Budget Initial** (ex: "500€" ou "N/A" si non défini)
  - **Col 3: Dépenses Totales** (ex: "245.67€")
  - **Col 4: Économies Réalisées** (EPR total, ex: "127.45€")
  - **Col 5: → P1** (montant alloué à Fonds Urgence, ex: "38.24€")
  - **Col 6: → P2** (montant alloué à Dette, ex: "44.61€")
  - **Col 7: → P3** (montant alloué à Investissement, ex: "25.49€")
  - **Col 8: → P4** (montant alloué à Plaisir, ex: "19.11€")
  - **Col 9: Contribution %** (part contribution semaine / total mois, ex: "32.5%")
- Chaque cellule montants alignée droite, devise correcte
- Ligne TOTAL (gras): somme des cols 2-8, 100% colonne 9
- Tri possible sur colonnes (tap header): Col 3 descendant par défaut
- Couleur alternée lignes
- Tap sur ligne ouvre WeeklyBudgetReport détaillé (voir US 10.3)
- Formule visuelle: ligne couleur verte si contribution > moyenne, rouge si <moyenne

---

### US 10.7 : Total Général = 4 Lignes Types (EKH Séparé, Pas Ligne Comptable)
**En tant que** système PFM,
**Je veux** que le total général du mois soit structuré en 4 lignes (pas 5),
**Afin de** clarifier que EKH est une métrique, non une allocation.

**Acceptance Criteria:**
- Bloc "Totaux Mois" affiche 4 lignes distinctes:
  1. **Dépenses Totales**: Σ dépenses semaines (ex: "1023.45€")
  2. **Économies Réalisées**: Σ EPR semaines (ex: "509.80€")
  3. **Distribution par Priorités**: 4 cases (P1 total | P2 total | P3 total | P4 total) (ex: "152.94€ | 178.43€ | 101.96€ | 76.47€")
  4. **Performance Index EKH**: jauge + score /100 (ex: "EKH moyen mois: 87/100 - Grade A")
- EKH moyen = moyenne des EKH hebdo (voir EPIC 8 US 8.3)
- EKH n'est PAS une ligne de débit (pas champ comptable), c'est un KPI séparé
- Clairement séparé visuellement des 3 premières lignes (spacing, couleur, fond distinct)

---

### US 10.8 : Fonction validateWaterfallConformity() pour Cohérence
**En tant que** système,
**Je veux** valider que la distribution waterfall conforme aux règles,
**Afin de** éviter des incohérences comptables.

**Acceptance Criteria:**
- Fonction `validateWaterfallConformity(semaine_id)` retourne `{valid: boolean, errors: string[]}`
- Validations:
  1. P1 + P2 + P3 + P4 <= totalEPR (pas dépassement)
  2. Chaque Pi >= 0 (pas valeurs négatives)
  3. totalEPR >= 0 (logique)
  4. Aucune allocation si totalEPR < 0.01€
  5. Si configuration distribution inaccessible, utiliser défauts (30/35/20/15)
  6. Sum(P1, P2, P3, P4) % == 100% ± 0.01 (tolérance arrondi)
- Erreurs possibles:
  - "P1 + P2 + P3 + P4 = 102% > 100% - recalcul impossible"
  - "Semaine verrouillée - distribution non modifiable"
  - "EPR négatif - aucune allocation possible"
- Fonction logée (log.error ou log.warn) si invalide
- Affichage badge rouge "Waterfall invalide" en haut page si non-conforme
- CTA: "Corriger la distribution" ouvre config (voir US 8.4)

---

## EPIC 11 : Phase 3 — Calendrier de Suivi des Performances

### Vue d'ensemble
PerformanceCalendarPage est la plus grande page (3,613 lignes HCM), offrant une vue drill-down Années → Mois → Semaines avec interactivité richque, filtrage multi-dimensionnel, et support full mobile/web.

---

### US 11.1 : Afficher Drill-Down 3 Niveaux : Années → Mois → Semaines
**En tant que** utilisateur,
**Je veux** explorer les performances par zoom progressif (année → mois → semaine),
**Afin de** analyser des tendances long-terme jusqu'aux détails hebdo.

**Acceptance Criteria:**
- PerformanceCalendarPage affiche par défaut: vue "Années"
  - Grille calendrier affichant les 5 dernières années (scrollable horizontal)
  - Chaque année cliquable
- Tap sur année → affiche "Mois" pour l'année sélectionnée
  - Grille 3×4 (3 lignes, 4 colonnes) des 12 mois
  - Chaque mois cliquable
- Tap sur mois → affiche "Semaines" pour le mois sélectionné
  - Grille 2×3 (ou 3×2) des semaines du mois (4-5 semaines)
  - Chaque semaine affiche WeekCell (voir US 11.2)
- Navigation retour: breadcrumb "Années > 2025 > Février" cliquable, ou bouton back
- Chevron droite indique drill-down possible (masqué si dernier niveau)
- Animation transition smooth (fade ou slide) entre niveaux
- Persistence: dernier niveau affiché conservé si retour page

---

### US 11.2 : Créer WeekCell Interactif avec Lock/Unlock, Badge %, Couleur
**En tant que** utilisateur,
**Je veux** interagir rapidement avec chaque semaine via une cellule visuelle riche,
**Afin de** gérer les statuts et voir les performances d'un coup d'œil.

**Acceptance Criteria:**
- WeekCell: composant petit (120×120px ou ~2×2cm mobile) affichant:
  - Haut-droit: icône cadenas fermé (🔒) si verrouillé, ouvert (🔓) si déverrouillé
  - Centre haut: numéro semaine ISO ou "Sem 07"
  - Centre bas: dates "10-16 fév" (petit texte)
  - Bas: badge %ge EPR ou grade (ex: "87%", ou "A+")
  - Fond couleur selon grade:
    - A+ / A: vert clair
    - B: bleu clair
    - C: jaune clair
    - D: orange clair
    - E: rouge clair
    - Gris si pas de données
- Interactivité:
  - Tap court: ouvre détails (WeekDetailPanel, voir US 11.3)
  - Long-press (1 sec): affiche menu contextuel (Verrouiller / Éditer / Supprimer)
  - Swipe droit: ouvre menu d'actions (optionnel)
  - Double-tap: toggle verrouillage (confirmation biométrique optionnelle)
- Badge couleur texte adapté au fond (blanc sur vert, noir sur jaune)
- Animation hover (desktop): légère ombre ou scale 1.05

---

### US 11.3 : Afficher 3 Panels Détail : WeekDetailPanel, MonthDetailPanel, YearDetailPanel
**En tant que** utilisateur,
**Je veux** voir des informations détaillées pour chaque niveau temporel,
**Afin de** auditer et ajuster la configuration ou résultats.

**Acceptance Criteria:**

#### WeekDetailPanel (ouvert par tap WeekCell):
- Affiche en bottom sheet (mobile) ou side panel (web) pour semaine sélectionnée
- En-tête: "Semaine 10-16 février 2025" + grade badge
- 6 sections:
  1. **KPI 4 Cartes**: Total Dépensé, Transactions, Postes Impactés, Solde Restant (voir EPIC 7)
  2. **Waterfall Distribution**: P1/P2/P3/P4 montants + %ges (voir EPIC 8)
  3. **Tableau Transactions**: top 5 transactions semaine (date, libellé, montant, poste)
  4. **Comparaison Semaine Précédente**: KPI vs sem-1 (+/- %), tendance flèches
  5. **Bloc Recommandations**: 1-3 suggestions basées sur données (ex: "Réduire Variable de 15%")
  6. **Boutons Actions**: Éditer, Exporter PDF, Dupliquer (pour semaine suivante)
- Bouton close (X) ou swipe down ferme le panel
- Scrollable vertical si contenu dépasse écran

#### MonthDetailPanel (ouvert par tap mois):
- Affiche en modal ou side panel pour mois sélectionné
- En-tête: "Février 2025"
- 5 sections:
  1. **KPI 4 Cartes**: Total Dépensé Mois, Transactions Mois, Postes Distincts, Solde Mois
  2. **Tableau 9 Colonnes** (voir US 10.6): chaque semaine du mois
  3. **Graphique Tendance EPR**: courbe X=semaines, Y=EPR€
  4. **Distribution Waterfall Mensuelle**: P1/P2/P3/P4 totalisés mois
  5. **Analyse Top 3 Postes**: ranking COICOP par EPR mois

#### YearDetailPanel (ouvert par tap année):
- Affiche en modal pour année sélectionnée
- En-tête: "2025"
- 4 sections:
  1. **KPI 4 Cartes**: Total Dépensé Année, Transactions Année, Postes Distincts, Solde Année
  2. **Grille 12 Mois**: mini-statistiques pour chaque mois (montant, grade, courbe micro)
  3. **Graphique Tendance Annuelle**: courbe éparpillée ou lissée X=mois, Y=EPR€
  4. **Synthèse Annuelle**: "EPR total: 5240€", "Grade moyen: A", "Économies potentielles non réalisées: XX%"

---

### US 11.4 : Afficher WaterfallValidationBadge (Pas RatioValidationBadge 33/67)
**En tant que** système PFM,
**Je veux** remplacer le badge 33/67 du HCM par un badge spécifique validation waterfall,
**Afin de** indiquer la conformité de la distribution sans imposer ratios fiés.

**Acceptance Criteria:**
- Badge WaterfallValidationBadge affiche en haut-droit de chaque panel détail (week/month/year)
- Contenu du badge:
  - Si valide (validateWaterfallConformity=true): icône ✓ vert + "Conforme"
  - Si invalide: icône ⚠ orange ou ✗ rouge + "À corriger"
  - Couleur texte adapté au fond (blanc sur vert, noir sur orange)
  - Petit texte optionnel: "(P1 30% | P2 35% | P3 20% | P4 15%)" montrant distribution appliquée
- Tap sur badge affiche tooltip: "Distribution conforme aux règles de validation."
  ou "Distribution invalide: P1+P2+P3+P4 dépasse 100%. Corriger dans Configuration."
- Badge grisé si données insuffisantes (totalEPR=0)
- RatioValidationBadge du HCM n'apparaît JAMAIS dans PFM

---

### US 11.5 : FilterWidget Multi-Dimensionnel : COICOP × Type × Nature
**En tant que** utilisateur,
**Je veux** filtrer les données du calendrier selon 3 dimensions (poste, type transaction, nature dépense),
**Afin de** analyser des sous-ensembles de dépenses/économies.

**Acceptance Criteria:**
- FilterWidget affiche en haut du calendrier (bar horizontale mobile, sidebar web)
- 3 sections de filtre indépendantes:
  1. **selectedCOICOP**: checkbox list 8 postes (sélection multiple, défaut: tous)
     - Affiche icônes poste + libellé
     - Badge compteur: "3/8" si 3 sélectionnés
     - Bouton "Tous" / "Aucun" pour toggle rapide
  2. **selectedTransactionTypes**: checkbox list 4 types (Fixe / Variable / Imprévue / Épargne-Dette)
     - Badges colorés (bleu/orange/rouge/vert)
     - Défaut: tous
  3. **selectedNature**: radio buttons (Essentielle / Discrétionnaire / Les deux)
     - Défaut: "Les deux"
- Interactions:
  - Changement filtre aplique immédiatement (pas bouton appliquer)
  - Paramètres de filtre dans URL (searchParams) pour bookmarkabilité
  - Badge rouge "3 filtres actifs" au-dessus filtres si non-défaut
  - Bouton "Réinitialiser" nettoie tous les filtres
- Les données calendrier se mettent à jour en temps réel (rechargement optimisé)
- Combinaison logique: AND entre dimensions, OR au sein d'une dimension

---

### US 11.6 : BudgetSettings Sans EKH (Diviser par 4, Pas par 5)
**En tant que** utilisateur,
**Je veux** que le calcul budgétaire du calendrier omette EKH de la division,
**Afin de** que les distributions P1-P4 soient exactes sans sur-allocation.

**Acceptance Criteria:**
- Fonction de calcul budget hebdo pour affichage calendrier:
  ```
  budget_par_semaine = budget_mensuel / 4  (pas /5)
  ```
  Au lieu du HCM qui fait: `somme / 5` (incluant EKH comme ligne 5)
- BudgetSettings accessible via icône ⚙️ en haut PerformanceCalendarPage
- Options configurables:
  - Budget mensuel initial (ex: "2000€")
  - Nombre de semaines par mois (défaut: 4, permet ajustement 3-5 selon année bissextile)
  - Affichage budget en comparaison (budget initial vs dépenses réelles)
- Logique: EKH reste métrique de performance (scorecard), pas ligne comptable
- Sauvegarde settings en DB, persistance session

---

### US 11.7 : Dimensions Orthogonales : QUOI (4 types) × OÙ (8 COICOP) × COMMENT (2 natures)
**En tant que** analyste de mes finances,
**Je veux** croiser les données selon 3 dimensions indépendantes,
**Afin de** détecter les patterns de dépenses multi-critères.

**Acceptance Criteria:**
- Le système supporte le croisement de 3 dimensions:
  - **QUOI**: 4 types transactions (Fixe / Variable / Imprévue / Épargne-Dette)
  - **OÙ**: 8 postes COICOP (Alimentation / Loisirs / Transport / etc.)
  - **COMMENT**: 2 natures (Essentielle / Discrétionnaire)
  - Matrice potentielle: 4 × 8 × 2 = 64 combinaisons possibles
- Interface permet au moins 2 croisements visibles:
  1. Heatmap QUOI × OÙ: grille 4×8 avec cellules colorées par montant EPR
     - Chaque cellule affiche montant et %ge
     - Hover affiche détail
  2. Stacked Bar QUOI segmenté par COMMENT: barre pour chaque poste COICOP
     - Segments bleu (Essentielle) et rose (Discrétionnaire)
     - Légende en bas
- Filtrage par COMMENT affecte les deux visualisations
- Export croisement en CSV: table 3 colonnes (Type | COICOP | Nature) + montants

---

### US 11.8 : CalendarEventBus, Framer-Motion, Multi-Devise, WCAG
**En tant que** système,
**Je veux** que PerformanceCalendarPage supporte les éléments avancés (événements, animations, i18n, accessibility),
**Afin de** offrir une expérience moderne et inclusive.

**Acceptance Criteria:**

#### CalendarEventBus:
- Abonnement aux événements de transaction/performance via EventBus
- Quand semaine modifiée (US 5.7 TransactionUpdatedEvent), calendrier se rafraîchit automatiquement
- Badge et couleur WeekCell mises à jour sans reload page
- Latence max 300ms entre événement et UI refresh

#### Framer-Motion:
- Transition smooth entre niveaux drill-down: fade-out niveau N, fade-in niveau N+1 (300ms)
- WeekCell rotation/scale au hover (desktop)
- Panel détail slide-in depuis bas (mobile) ou droite (web), 250ms
- Waterfall chart bars s'animent lors de l'apparition (grow from 0 to value, 500ms)
- Transitions respectent préférence utilisateur `prefers-reduced-motion` (accessibility)

#### Multi-Devise:
- Sélecteur devise en haut (EUR / USD / GBP / CHF / JPY, optionnel)
- Taux de change mis à jour quotidiennement (cache locale)
- Tous les montants € convertis et formatés selon devise
- Symboles devise respectent convention (€ avant/après selon locale)

#### WCAG (Web Content Accessibility Guidelines):
- Tous les éléments interactifs ont focus visible (outline ou custom style)
- Labels explicites ou aria-labels pour icônes
- Contraste texte ≥ 4.5:1 (light/dark modes)
- Couleurs pas seule indication (ajouter icônes, texte, patterns)
- Clavier navigation complète (tab, enter, arrow keys)
- Screen reader announcements pour changements dynamiques (aria-live)
- Texte alternatif pour graphiques (description courte ou tableau de données)
- Structure heading cohérente (H1 > H2 > H3, pas saut)

---

## RÈGLES TRANSVERSALES POUR TOUS LES EPICS

### Principes de Design Mobile-First
- **Breakpoints**: xs (<360px), sm (360-600px), md (600-900px), lg (900-1200px), xl (>1200px)
- **Touch interactions**: tap (single), long-press (>500ms), swipe (4 directions), double-tap
- **Orientations**: portrait (primaire), landscape support (optionnel mais recommandé)
- **Clavier**: clavier numérique pour montants, textuel pour descriptions

### Formules Validées
- **Score Flexibilité**: (F1 + F2 + F3) / 63 × 100, toujours calculé de même façon
- **EPR Transaction**: montant × (1 - taux_incompressibilité/100) × (score_flexibilité/100)
- **EPR Poste**: Σ(EPR_transaction) par poste pour la période donnée
- **Distribution P1-P4**: totalEPR × (P1_% / 100), idem pour P2/P3/P4
- **Taux Réduction**: (totalEPR / totalDépenses) × 100 par poste
- **EKH**: (EPR_total / (budgetInit - fixesMandat)) × 100 capped 100%

### Structure de Données Clé
- **Transactions**: transactionId, date, montant, type, poste_N1, sous_poste_N2, nature, moyen_paiement, description, EPR_calculé, timestamp
- **Performance Recap**: semaine_id, totalDépenses, totalEPR, P1/P2/P3/P4 montants, note_score, grade, validated_at
- **Configuration**: poste_N1_id, N2_id, N3_id, F1/F2/F3 values, taux_incompressibilité, type_F_V, essentialité

### Sécurité & Audit
- Aucune modification possible semaine verrouillée (sauf admin)
- Historique tous changements (audit log) avec timestamp + utilisateur
- Montants jamais modifiables sans trace (versioning ou archivage transactions)
- Données sensibles chiffrées en transit et au repos (HTTPS TLS 1.2+, DB encryption)

### Performance
- Chargement page <2s (3G slow)
- Requêtes API temps réponse <500ms
- Images/assets optimisées (WebP, lazy-load)
- Infinite scroll avec virtualisation pour listes >100 items
- Caching côté client (localStorage, indexedDB) pour offline-first

### Localization (Français)
- **Tous les textes** en français (Canada ou France, à confirmer)
- Noms poste COICOP français standards
- Devise €, formats nombres européens (ex: 1.234,56€)
- Dates format: "Lun 10 février 2025" ou "10/02/2025"

### Responsive Design Tokens
- **Couleurs primaires**: Bleu accent, Orange warning, Vert success, Rouge error
- **Typography**: Body 14-16px, Headlines 18-28px, Mobile scaling 1.125x factor
- **Spacing**: 4px base unit (4, 8, 12, 16, 24, 32, 48px)
- **Radius**: 8px défaut, 4px compact, 12px spacious
- **Shadows**: subtle (0 2px 4px rgba), medium (0 4px 8px rgba)

---

## ÉPILOGUE: PRIORITÉS D'IMPLÉMENTATION MODULE 3

### MVP (Minimum Viable Product)
1. EPIC 4: Configuration postes COICOP (US 4.1-4.2, optionnel 4.3)
2. EPIC 5: Saisie transactions 3 étapes (US 5.1-5.6)
3. EPIC 7: Journal transactions + EPR (US 7.1-7.5)
4. EPIC 8: Recap performance + distribution (US 8.1-8.5, 8.6 optionnel)

### Phase 2 (Post-MVP)
5. EPIC 6: Vue d'ensemble configuration (US 6.1-6.3)
6. EPIC 9: Reporting 5 blocs (US 9.1-9.7)
7. EPIC 10: Centre performance (US 10.1-10.8)

### Phase 3 (Long-Term)
8. EPIC 11: Calendrier performances (US 11.1-11.8, largest scope)

---

## DOCUMENT FIN
**Auteur**: John, Product Manager BMAD
**Version**: 1.0
**Date**: Février 2025
**Statut**: Prêt pour spécification technique

---

# PARTIE IV — TIMELINE & QUESTIONS OUVERTES

## 9. CONSIDÉRATIONS TIMELINE

### Sprints (21 semaines, 10 sprints)

| Sprint | Durée | Focus | Dépendances |
|--------|-------|-------|-------------|
| S0 | 2 sem | Auth + Profil utilisateur (12 personas) | Stack decision (RN/Expo) |
| S1 | 2 sem | Personal Dashboard + Budget Calendar + Widget | S0 |
| S2 | 3 sem | Module 3 PFM : Savings Engine (EPIC 4-5) | S1 |
| S3 | 2 sem | Module 1 PFM : Financial Planner (EPIC 1-3) | S2 |
| S4 | 2 sem | Module 4 PFM : Health Cards + 5 KPIs | S3 |
| S5 | 2 sem | DataScanner PFM (OCR receipts) | OCR provider decision |
| S6 | 2 sem | Risk Engine (VaR 95%, Stress Testing) | S3 |
| S7 | 2 sem | Multi-user (Partner, Advisor, Member) | S4 |
| S8 | 2 sem | Subscriptions + Notifications + PDF export | S7 |
| S9 | 2 sem | Tests E2E + Documentation + Store submission | S8 |

### Jalons Clés
- **Semaine 4** : Alpha interne (S0-S1 complétés)
- **Semaine 10** : Beta fermée (50 users, S0-S4)
- **Semaine 16** : Release Candidate (S0-S7 stables)
- **Semaine 21** : General Availability (App Store + Google Play)

---

## 10. QUESTIONS OUVERTES

| # | Question | Tag | Propriétaire |
|---|---------|-----|-------------|
| Q1 | React Native managed (Expo) vs bare workflow ? | [Engineering] | Lead Engineer |
| Q2 | Nombre d'écrans onboarding (1 vs 5 vs progressive) ? | [Design] | Product Designer |
| Q3 | Implications RGPD pour données financières en Supabase EU ? | [Legal] | Legal + Compliance |
| Q4 | Modèle freemium : quelles features en free tier ? | [Product] | VP Product + Finance |
| Q5 | OCR receipt scanning : build vs buy (Veryfi, Mindee) ? | [Data] | Data Lead + Engineering |
| Q6 | Architecture offline-first : WatermelonDB vs SQLite ? | [Engineering] | Backend + Mobile Lead |
| Q7 | Lancement simultané iOS + Android ou séquentiel ? | [Business] | VP Growth + PM |

---

## ANNEXE — DÉCISIONS VALIDÉES (référence)

Ce PRD s'appuie sur les **38 sections** du document `PFM_CONTEXTE_DECISIONS.md` validées par le Project Owner :

- **Sections 1-9** : Vision, 5D/10I, 12 profils, Module 1 vue d'ensemble, architecture, rôles, roadmap
- **Sections 10-24** : Deep dive 18 pages Module 1 (Pages 1-17 HCM → 16 pages PFM)
- **Section 25** : Transition Phase Analyste → Phase PM
- **Sections 26-29** : Module 3 vue d'ensemble, Phase 1/2, décision granularité hebdomadaire
- **Sections 30-37** : Module 3 Phase 3 (7 pages analysées avec 19 erreurs corrigées)
- **Section 38** : Décision stratégique Mobile-First (iOS + Android Phase 1, Desktop Phase 2)

### 4 Erreurs Systémiques Documentées et Corrigées

| Erreur | Sections | Correction |
|--------|----------|------------|
| Prime/Trésorerie 33/67 → Waterfall | 35, 36, 37 | validateWaterfallConformity() |
| BL → Employees → Temporel/COICOP | 35, 36, 37 | Mois→Semaines + byCOICOP |
| EKH budgété → calculé | 36, 37 | Score séparé, jamais dans budgetSettings |
| 5 indicateurs HCM → 4 types PFM | 31, 35, 36, 37 | typeBreakdown + EPR par type |

### Formules Clés Préservées

| Formule | Usage |
|---------|-------|
| `(F1+F2+F3)/63 × 100` | Score Flexibilité |
| `(économies/objectif) × 10` | Note /10 |
| `Math.min(réalisé, prévu)` | capRealToPrevu() |
| `UL = Revenu × (Proba × Impact)` | Unexpected Loss |
| `EPR_hebdo = objectif_annuel / 52` | Économies Potentiellement Réalisables |

---

**Document rédigé par:** John, Product Manager (Phase PM — BMAD v6.0.0-alpha.22)
**Validé par:** Project Owner — 7 février 2026
**Référence:** PFM_CONTEXTE_DECISIONS.md (3,087 lignes, 38 sections)
