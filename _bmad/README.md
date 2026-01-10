# BMAD Method - Installation Manuelle

**Version**: 6.0.0-alpha.22
**Date d'installation**: 6 Janvier 2026
**Projet**: HCM-PORTAL V2

## Structure Installée

```
_bmad/
├── core/                    # BMAD Core Framework
│   ├── agents/              # Agents de base
│   ├── workflows/           # Workflows core (brainstorming, elicitation)
│   ├── resources/           # Ressources (excalidraw, etc.)
│   └── tasks/               # Tâches système
│
├── modules/
│   └── bmm/                 # BMad Method Module
│       ├── agents/          # 9 agents spécialisés
│       ├── workflows/       # 34+ workflows
│       ├── data/            # Templates de données
│       └── teams/           # Configurations d'équipes
│
└── docs/                    # Documentation complète
```

## Agents Disponibles

### Agent Superviseur LELE HCM (CRITIQUE)

| Agent | Commande | Rôle |
|-------|----------|------|
| **HCM Guardian** | `/hcm-guardian` | **SUPERVISEUR** - Expert cohérence plateforme LELE HCM |

> ⚠️ **RÈGLE OBLIGATOIRE**: Tous les autres agents DOIVENT consulter `/hcm-guardian`
> avant toute modification de code, développement ou debug sur la plateforme LELE HCM.

**Commandes du HCM Guardian**:
- `ARCH` - Afficher l'architecture complète
- `FORMULAS` - Afficher toutes les formules de calcul
- `CHECK` - Vérifier la cohérence d'une modification
- `KPI [code]` - Détailler un indicateur KPI (abs, qd, oa, ddp, ekh)
- `CALENDAR` - Expliquer la logique Smart Calendar
- `IMPACT [fichier]` - Analyser l'impact d'une modification
- `TEST` - Générer un plan de test
- `SYNC` - **NOUVEAU** Synchroniser la doc avec le code source
- `AUDIT` - **NOUVEAU** Lancer un audit de cohérence code/doc

### Agent Auditeur HCM (NOUVEAU)

| Agent | Commande | Rôle |
|-------|----------|------|
| **HCM Audit** | `/hcm-audit` | Détecte les drifts entre code et documentation |

**Commandes de l'Audit**:
- `AUDIT` ou `RUN` - Lancer l'audit complet
- `QUICK` - Audit rapide (constantes uniquement)
- `REPORT` - Générer le rapport

**Documentation de référence**: `/docs/hcm-calculation-formulas.md`

---

### Agents BMAD Standards

| Agent | Commande | Rôle |
|-------|----------|------|
| **Analyst** | `/analyst` | Business Analyst - Recherche marché, requirements |
| **PM** | `/pm` | Product Manager - PRDs, stratégie produit |
| **Architect** | `/architect` | Software Architect - Architecture, design patterns |
| **Dev** | `/dev` | Developer - Implémentation, coding |
| **UX Designer** | `/ux-designer` | UX/UI Designer - Wireframes, design systems |
| **Scrum Master** | `/sm` | Scrum Master - Agile, facilitation |
| **Tech Writer** | `/tech-writer` | Technical Writer - Documentation |
| **Test Architect** | `/tea` | Test Architect - QA, testing |
| **Quick Flow** | `/quick-flow-solo-dev` | Solo Dev pour fixes rapides |

## Comment Utiliser

### 1. Invoquer un Agent
Dans Claude Code, tapez:
```
/analyst
```

L'agent sera chargé avec sa persona, son menu et ses workflows.

### 2. Commandes de l'Agent
Une fois l'agent chargé, utilisez les triggers du menu:
- `WS` - Workflow Status
- `BP` - Brainstorm Project
- `RS` - Research
- `PB` - Product Brief

### 3. Workflow Recommandé (Nouveau Projet)

1. **Analyse**: `/analyst` → `BP` (Brainstorm Project)
2. **Planning**: `/pm` → Créer PRD
3. **Architecture**: `/architect` → Design système
4. **Implémentation**: `/dev` → Développement par stories

## Documentation

Consultez `_bmad/docs/` pour:
- Guide complet des workflows
- Personnalisation des agents
- Création de modules custom

## Mise à Jour

Pour mettre à jour BMAD vers la dernière version:
```bash
npx bmad-method@alpha install
```

---
*Installation effectuée par Claude Code*
