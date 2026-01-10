# Documentation LELE HCM Portal

**Version** : 1.0.1
**Dernière mise à jour** : 2025-11-12
**Maintenu par** : Claude (lele-hcm-knowledge-base skill)

---

## 🆕 Dernière session de travail (2025-11-12)

**📖 Documentation complète de la session d'optimisation Landing Page disponible !**

### 🚀 Démarrage rapide
- **[INDEX Session 2025-11-12](INDEX-SESSION-2025-11-12.md)** ⭐ Commencer ici
- **[Résumé Exécutif](RESUME-EXECUTIF-2025-11-12.md)** (2 min) - TL;DR
- **[Carte Documentation](CARTE-DOCUMENTATION.md)** - Navigation visuelle
- **[CHANGELOG Complet](CHANGELOG-2025-11-12.md)** (10 min) - Détails

### Par rôle
- 👨‍💻 **Developers** → [Session Travail Technique](architecture/session-travail-2025-11-12.md)
- 🏢 **Admins** → [Améliorations Landing (simple)](workflows/ameliorations-landing-page-2025-11-12.md)
- 👥 **Employees** → [FAQ Employees](workflows/ameliorations-landing-page-2025-11-12.md#pour-les-employees-)
- 🏦 **Bankers** → [FAQ Bankers](workflows/ameliorations-landing-page-2025-11-12.md#pour-les-bankers-)

### Documents techniques
- [ADR-002 : Lazy Loading Landing Page](adr/ADR-002-lazy-loading-landing-page.md)
- [Pattern-001 : Créer Section Lazy-Loaded](patterns/creer-section-lazy-loaded.md)
- [TODO : 9 Optimisations Frontend](TODO-FRONTEND-OPTIMIZATIONS.md)

**Résumé** : Landing page refactorée (performance +60%), SEO ajouté, analytics préparées. 10 fichiers créés, 8 docs. Validation à faire après intégration modules (25h).

---

## 📚 Vue d'ensemble

Cette documentation complète couvre **tous les aspects** de la plateforme LELE HCM Portal :
- Architecture technique et stack
- Workflows utilisateurs et processus métier
- Décisions techniques (ADR)
- Modules business (Paie, Congés, Formation, ESG)
- Patterns de code réutilisables
- Sécurité et permissions
- Troubleshooting et FAQ

**Objectif principal** : Servir de base de connaissances pour l'Agent IA LELE-HCM futur qui guidera tous les types d'utilisateurs (devs, admins, employees, bankers).

---

## 🗂️ Structure de la documentation

```
/docs
├── README.md                        # Ce fichier
├── knowledge-index.json             # Index pour Agent IA (recherche rapide)
├── TODO-FRONTEND-OPTIMIZATIONS.md   # Correctifs audit frontend (post-intégration modules)
│
├── architecture/                    # Stack, structure, config
│   ├── stack-technique.md
│   ├── structure-projet.md
│   └── patterns-code.md
│
├── workflows/                       # User journeys, processus
│   ├── onboarding-user.md
│   ├── activation-module.md
│   └── gestion-paie.md
│
├── adr/                             # Architecture Decision Records
│   ├── ADR-001-choix-supabase.md
│   ├── ADR-002-lazy-loading-landing-page.md (✅ créé)
│   └── ADR-003-react-query.md
│
├── modules/                         # Documentation par module
│   ├── module1-paie.md
│   ├── module2-conges.md
│   ├── module3-formation.md
│   └── module4-esg.md
│
├── patterns/                        # Code samples & how-to
│   ├── creer-section-lazy-loaded.md (✅ créé)
│   ├── ajouter-page-protegee.md
│   └── tracker-evenement-analytics.md
│
├── security/                        # Permissions & sécurité
│   ├── matrice-permissions.md
│   ├── rls-policies.md
│   └── routes-protegees.md
│
└── troubleshooting/                 # FAQ & résolution problèmes
    ├── erreurs-courantes.md
    ├── faq-admins.md
    ├── faq-employees.md
    └── faq-devs.md
```

---

## 🎯 Pour qui est cette documentation ?

### 👨‍💻 Developers
**Sections pertinentes** :
- `/architecture` : Comprendre le stack et la structure
- `/adr` : Comprendre POURQUOI les décisions techniques ont été prises
- `/patterns` : Réutiliser des patterns de code éprouvés
- `/troubleshooting/faq-devs.md` : Résoudre problèmes courants

**Exemple** : "Comment créer une nouvelle section lazy-loaded ?"
→ `/patterns/creer-section-lazy-loaded.md`

### 🏢 Company Admins
**Sections pertinentes** :
- `/workflows` : Comprendre les processus métier
- `/modules` : Configurer et gérer les modules
- `/security/matrice-permissions.md` : Comprendre qui peut faire quoi
- `/troubleshooting/faq-admins.md` : Résoudre problèmes de gestion

**Exemple** : "Comment inviter un nouvel employé ?"
→ `/workflows/invitation-employee.md` (à créer)

### 👥 Employees
**Sections pertinentes** :
- `/workflows` : Utiliser les fonctionnalités quotidiennes
- `/modules` : Guides d'utilisation des modules
- `/troubleshooting/faq-employees.md` : Résoudre problèmes courants

**Exemple** : "Comment demander un congé ?"
→ `/workflows/demande-conges.md` (à créer)

### 🏦 Bankers
**Sections pertinentes** :
- `/workflows/acces-banker.md` : Accéder aux données clients
- `/modules/module4-esg.md` : Comprendre les rapports ESG
- `/troubleshooting/faq-bankers.md` : Questions fréquentes

**Exemple** : "Comment accéder aux rapports d'une entreprise ?"
→ `/workflows/acces-banker.md` (à créer)

---

## 🚀 Quick Start

### Pour un développeur qui rejoint le projet

1. **Lire le stack technique** (quand créé)
   ```
   /docs/architecture/stack-technique.md
   ```

2. **Comprendre la structure du projet**
   ```
   /docs/architecture/structure-projet.md
   ```

3. **Lire les ADRs critiques** (décisions majeures)
   ```
   /docs/adr/ADR-002-lazy-loading-landing-page.md
   ```

4. **Explorer les patterns réutilisables**
   ```
   /docs/patterns/creer-section-lazy-loaded.md
   ```

5. **Setup local et premier commit**
   ```bash
   npm install
   npm run dev
   # Lire /docs/architecture/git-workflow.md (quand créé)
   ```

### Pour un admin qui découvre la plateforme

1. **Comprendre les workflows de base**
   ```
   /docs/workflows/onboarding-user.md (à créer)
   ```

2. **Activer les modules**
   ```
   /docs/workflows/activation-module.md (à créer)
   ```

3. **Gérer les permissions**
   ```
   /docs/security/matrice-permissions.md (à créer)
   ```

---

## 📖 Types de documentation

### 1. ADR (Architecture Decision Record)
**Format** : Décision structurée avec contexte, options, justification, conséquences.

**Quand créer un ADR** :
- Choix de stack/technologie majeur
- Pattern architectural nouveau
- Décision impactant plusieurs composants
- Trade-off performance vs maintenabilité

**Template** : Voir `ADR-002-lazy-loading-landing-page.md`

### 2. Pattern de Code
**Format** : Guide étape par étape avec exemples de code réels.

**Quand créer un pattern** :
- Code réutilisable dans plusieurs endroits
- Best practice à suivre systématiquement
- Comment faire X (ex: créer composant, ajouter route, etc.)

**Template** : Voir `creer-section-lazy-loaded.md`

### 3. Workflow Utilisateur
**Format** : Parcours étape par étape d'un processus métier.

**Quand créer un workflow** :
- Processus multi-étapes
- Interaction entre plusieurs rôles
- Feature complexe nécessitant un guide

**Template** : (à créer dans skill)

### 4. Module Métier
**Format** : Documentation complète d'un module (fonctionnalités, architecture, données).

**Quand créer une doc module** :
- Nouveau module ajouté
- Mise à jour majeure d'un module existant

**Template** : (à créer dans skill)

### 5. Troubleshooting
**Format** : Problème → Cause → Solution.

**Quand créer un troubleshooting** :
- Erreur récurrente
- Question fréquente d'utilisateurs
- Bug résolu qui pourrait revenir

**Template** : (à créer dans skill)

---

## 🔍 Comment rechercher dans la documentation ?

### Méthode 1 : Index de connaissances (Agent IA futur)
```json
// knowledge-index.json contient tous les docs avec keywords
{
  "documents": [
    {
      "id": "adr-002",
      "title": "Lazy Loading Landing Page",
      "keywords": ["lazy-loading", "performance", "react"],
      "path": "/docs/adr/ADR-002-lazy-loading-landing-page.md"
    }
  ]
}
```

**Recherche par keyword** → L'Agent IA trouve les docs pertinents.

### Méthode 2 : Grep (en attendant l'Agent IA)
```bash
# Rechercher "lazy loading" dans tous les docs
grep -r "lazy loading" docs/

# Rechercher dans un type spécifique
grep -r "permissions" docs/security/
```

### Méthode 3 : Navigation par type
- Problème technique → `/troubleshooting/`
- Comprendre une décision → `/adr/`
- Apprendre à coder X → `/patterns/`
- Comprendre un processus → `/workflows/`

---

## ✅ Documentation existante

### ✅ Créées (2025-11-12)
- ✅ `ADR-002-lazy-loading-landing-page.md` - Décision lazy loading
- ✅ `creer-section-lazy-loaded.md` - Pattern réutilisable
- ✅ `TODO-FRONTEND-OPTIMIZATIONS.md` - Correctifs audit frontend
- ✅ `knowledge-index.json` - Index pour Agent IA

### 📝 À créer (priorité HAUTE)
Après intégration des modules :
- [ ] `architecture/stack-technique.md` - Vue d'ensemble complète du stack
- [ ] `modules/module1-paie.md` - Documentation Module Paie
- [ ] `modules/module2-conges.md` - Documentation Module Congés
- [ ] `modules/module3-formation.md` - Documentation Module Formation
- [ ] `modules/module4-esg.md` - Documentation Module ESG
- [ ] `security/matrice-permissions.md` - Permissions par rôle

### 📝 À créer (priorité MOYENNE)
- [ ] `workflows/onboarding-user.md` - Parcours inscription
- [ ] `workflows/activation-module.md` - Activer un module
- [ ] `adr/ADR-001-choix-supabase.md` - Pourquoi Supabase
- [ ] `patterns/ajouter-page-protegee.md` - Route protégée
- [ ] `troubleshooting/erreurs-courantes.md` - Top 10 erreurs

---

## 🤖 Pour l'Agent IA LELE-HCM (futur)

### Comment l'Agent IA utilisera cette documentation

1. **User pose une question**
   ```
   User : "Comment activer Module 2 ?"
   ```

2. **Agent IA recherche dans knowledge-index.json**
   ```json
   {
     "keywords": ["module2", "activer", "activation"],
     "matching_docs": [
       "/docs/workflows/activation-module.md",
       "/docs/modules/module2-conges.md"
     ]
   }
   ```

3. **Agent IA extrait la section "Pour l'Agent IA"**
   ```markdown
   **Réponse courte** : Settings → Modules → Toggle Module 2 → Sauvegarder

   **Réponse détaillée** : [Paragraphe complet]

   **Actions suggérées** :
   1. Connectez-vous en Company Admin
   2. Menu → Settings → Modules
   3. Activez "Module 2"
   ```

4. **Agent IA répond à l'utilisateur**
   ```
   Agent : 📚 Trouvé dans : /docs/workflows/activation-module.md

   **Réponse courte** :
   Settings → Modules → Toggle "Module 2" ON → Sauvegarder

   **Étapes détaillées** :
   1. Connectez-vous en Company Admin
   2. Menu → "Settings"
   3. Section "Modules"
   4. Activez le toggle "Module 2"
   5. Cliquez "Sauvegarder"

   **Docs connexes** :
   - Configuration Module 2 : /docs/modules/module2-conges.md
   ```

### Format requis dans chaque doc

Chaque documentation DOIT contenir une section finale :

```markdown
## Pour l'Agent IA

**Réponse courte** : [1 phrase ultra-concise]

**Réponse détaillée** : [1-2 paragraphes complets]

**Actions suggérées** :
- Action 1
- Action 2

**Keywords** : keyword1, keyword2, keyword3
```

Cela permet à l'Agent IA de :
- Répondre rapidement aux questions simples
- Approfondir pour les questions complexes
- Guider l'utilisateur avec des actions concrètes

---

## 📊 Métriques de qualité

### Couverture documentation
- [ ] 100% des fonctionnalités majeures documentées
- [ ] Tous les modules (1-4) documentés
- [ ] Top 20 questions FAQ couvertes
- [ ] Tous les ADRs critiques sauvegardés

**Statut actuel** : 2/50 docs créés (4%)

### Qualité documentation
- [x] Chaque doc a un frontmatter complet
- [x] Section "Pour l'Agent IA" présente
- [x] Code samples testés et fonctionnels
- [x] Liens entre docs fonctionnels

**Statut actuel** : 100% des docs existants respectent les standards

### Utilité (future, avec Agent IA)
- [ ] Agent IA répond correctement à 90%+ des questions
- [ ] Temps de résolution problème < 2 min
- [ ] Utilisateurs satisfaits de la précision

---

## 🛠️ Contribuer à la documentation

### Ajouter une nouvelle doc

1. **Utiliser le skill lele-hcm-knowledge-base**
   ```
   /lele-doc
   # OU
   "documente [ce que tu viens de faire]"
   ```

2. **Choisir le type** : ADR / Pattern / Workflow / Module / Troubleshooting

3. **Suivre le template** du type choisi

4. **Mettre à jour knowledge-index.json**
   - Ajouter le doc dans `documents[]`
   - Ajouter les keywords dans `tags_index`
   - Ajouter dans `personas_index`

### Standards de qualité

- ✅ **Clair et concis** : Aller à l'essentiel
- ✅ **Structuré** : Titres, listes, tableaux
- ✅ **Actionnable** : Toujours des étapes concrètes
- ✅ **Bilingue** : Français prioritaire, termes techniques en anglais OK
- ✅ **Section "Pour l'Agent IA"** : Obligatoire
- ✅ **Keywords pertinents** : 5-10 minimum
- ✅ **Code samples testés** : Jamais de code qui ne compile pas

---

## 🔗 Liens utiles

### Documentation externe
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### Projet LELE HCM
- Repository : (URL GitHub si publique)
- Figma : (URL designs)
- Notion : (URL product docs si existe)
- Slack/Discord : (URL communication équipe)

---

## 📝 Changelog documentation

### 2025-11-12
- **Création de la structure** : Dossiers architecture, workflows, adr, modules, patterns, security, troubleshooting
- **ADR-002** : Lazy loading Landing page
- **Pattern-001** : Créer section lazy-loaded
- **TODO-FRONTEND** : Correctifs audit frontend sauvegardés
- **knowledge-index.json** : Index pour Agent IA initialisé

### Prochaines étapes
- Après intégration modules : Documenter architecture complète
- Après intégration modules : Documenter les 4 modules
- Après intégration modules : Créer matrice de permissions
- Après tests utilisateurs : Compléter troubleshooting FAQ

---

## 🎯 Vision long terme

Cette documentation est la **mémoire institutionnelle** de LELE HCM Portal.

**Objectifs 6 mois** :
- 100% des fonctionnalités documentées
- Agent IA opérationnel et performant
- Nouveau dev onboard en < 1 jour (grâce à la doc)
- 0 questions récurrentes (toutes dans FAQ)

**Objectifs 1 an** :
- Documentation multilingue (FR + EN)
- Vidéos tutoriels intégrées
- Diagrammes interactifs (mermaid)
- Feedback loop utilisateurs → amélioration docs

---

**Maintenu avec ❤️ par Claude (lele-hcm-knowledge-base skill)**

*Pour toute question sur la documentation : utiliser le skill `/lele-doc`*
