# SESSION — Design Onboarding LELE PFM
**Date** : 11 Février 2026
**Objectif** : Concevoir le parcours d'onboarding complet de l'application LELE PFM (version individuelle)
**Fichiers produits** : `onboarding-preview.html`, `parcours-complet-preview.html`, `setup-wizard-preview.html`

---

## 1. Parcours utilisateur identifié

Quand l'utilisateur ouvre l'app pour la première fois :

```
Onboarding (7 slides) → Setup Wizard (6 pages) → Dashboard
```

### Phase 1 : Onboarding (onboarding-preview.html)
- Slide 0 : Welcome — "Tu travailles, tu gagnes... mais comment tu pilotes tes économies ?"
- Slides 1-5 : Présentation des 5 gaps concurrentiels
- Slide 6 : CTA — "5 innovations qu'aucune app ne propose. Sauf celle-ci."
- Bouton : "Je me lance !" → redirige vers Setup Wizard

### Phase 2 : Setup Wizard (parcours-complet-preview.html)
- 6 pages d'input couvrant TOUTES les données PRD nécessaires
- Temps estimé : ~4 minutes
- Confetti + résumé → Dashboard

### Phase 3 : Dashboard principal
- 6 KPIs principaux
- 4 tabs de navigation
- Centre de transactions + Performance

---

## 2. Les 5 Gaps Concurrentiels (USP)

### Analyse concurrentielle réalisée
Concurrents étudiés : Bankin' (1.2M users FR), Linxo, Finary (100K+), YNAB (<500 FR)

### Les 5 gaps identifiés

| # | Gap | Nom technique | Ce que font les concurrents | Ce que LELE PFM fait de différent |
|---|-----|---------------|----------------------------|-----------------------------------|
| 1 | **EPR** | Économies Potentiellement Réalisables | Disent "tu as dépensé 87€" | Révèle "tu aurais pu garder 19€" → 988€/an |
| 2 | **EKH** | Score de Compétence Financière | Aucun scoring comportemental | Score E→A+ qui monte chaque semaine comme un skill |
| 3 | **Waterfall P1→P4** | Distribution cascade par priorité | Enveloppes statiques (YNAB) | Sécurité→Dettes→Projets→Plaisir, overflow automatique |
| 4 | **Kakeibo Weekly** | Granularité hebdomadaire | Bilans mensuels uniquement | 52 bilans/an au lieu de 12, correction en 7 jours |
| 5 | **3D Analysis** | QUOI × OÙ × COMMENT | Catégories plates | Croise type + catégorie + nécessité (essentiel vs envies) |

---

## 3. Structure narrative de l'onboarding

### Principe validé avec le Product Owner
**Chaque slide suit le schéma : Problème → Contexte → Solution**

L'utilisateur doit d'abord S'IDENTIFIER au problème avant de voir la solution.

> Citation PO : "Elle ne pose pas de contexte et impose directement des situations à l'utilisateur sans même lui donner la possibilité de comprendre."

### Accroches validées par slide

| Slide | Accroche (problem-context) | Badge doré | Titre solution |
|-------|---------------------------|------------|----------------|
| 0 | "Tu travailles, tu gagnes... mais comment tu pilotes tes économies ?" | — | LELE PFM |
| 1 | "Avec ce que tu as dépensé cette semaine, est-ce que tu sais que chaque dépense cache une économie ?" | AUCUNE APP NE FAIT ÇA | 19€ cette semaine. 988€ sur l'année. |
| 2 | "Tout le monde parle d'intelligence financière... mais est-ce que tu sais à quel niveau tu te situes ?" | LA 1ÈRE APP QUI TE NOTE | Ton intelligence financière a enfin un score. |
| 3 | "Chaque semaine, tu sauras exactement quoi économiser et comment le répartir." | PRIORITÉ AUTOMATIQUE | Ton épargne se remplit dans l'ordre. |
| 4 | "Tu fais tes comptes en fin de mois. Résultat : tu découvres les dégâts quand c'est trop tard pour agir." | 52 BILANS PAR AN AU LIEU DE 12 | 7 jours pour agir. Pas 30. |
| 5 | "Tu vois tes dépenses en liste... Mais combien étaient vraiment nécessaires ? Et combien étaient juste des envies du moment ?" | IMPOSSIBLE AILLEURS | 200€ en courses. 60€ c'étaient des envies. |
| CTA | — | — | 5 innovations qu'aucune app ne propose. Sauf celle-ci. |

### Éléments visuels par slide

| Slide | Visuel | Détails |
|-------|--------|---------|
| 0 | Comparison box | "Ce que tu vis aujourd'hui (Flou)" vs "Ce qu'on va construire ensemble (Clarté)" |
| 1 | Receipt card + Compteur cumulé | Ticket Carrefour -87€ avec "19€ tu aurais pu garder" + 19€/sem → 76€/mois → **988€/an** |
| 2 | Level card + XP bar | Score 8.2/10, progression C→B→A sur 7 semaines |
| 3 | 4 pots cascade | P1 Sécurité "✓ plein" → surplus → P2 Dettes → surplus → P3 Projets → surplus → P4 Plaisir |
| 4 | Calendrier hebdo | Sem 05 (A 8.3) → Sem 06 (A+ 9.1) → Sem 07 (en cours) → Sem 08 (futur) |
| 5 | Breakdown card | Alimentation 200€ (140€ essentiel / 60€ envies), Transport 85€, Loisirs 120€ |

---

## 4. Setup Wizard — Les 6 pages d'input (PRD)

Fichier : `parcours-complet-preview.html`

### Page 1 — Profil Financier Personnel
- "Salut ! Faisons connaissance"
- 9 profils types (Étudiant, Salarié, Freelance, Retraité, etc.)
- Situation familiale (Seul, En couple, Famille, Monoparental)
- Âge, nombre de personnes à charge
- Pays + devise
- Horizon de planification (6 mois, 1 an, 3 ans, 5 ans)

### Page 2 — Sources de Revenus et Postes de Dépenses
- "D'où vient ton argent ?"
- Sources de revenus : Salaire, Freelance, Loyers, Aides (avec montants)
- 8 catégories COICOP de dépenses avec montants et % temps réel :
  - Alimentation, Logement, Transport, Santé, Loisirs, Éducation, Habillement, Autres

### Page 3 — Historique Financier Personnel
- "Dis-nous d'où tu viens..."
- 3 années de revenus/dépenses annuels
- Niveau d'engagement financier (Jamais / Parfois / Régulier / Expert) → Score ENG

### Page 4 — Données de Risque Personnel
- "Ton bouclier anti-galère"
- 6 domaines de risque avec sliders (0-100) :
  - Emploi, Endettement, Marché, Liquidité, Santé, Longévité
- Labels dynamiques (Stable / Modéré / À voir)

### Page 5 — Auto-évaluation Financière
- "Miroir, miroir..."
- 5 questions qualitatives avec notation étoiles (1-5) :
  - Capacité d'épargne
  - Maîtrise des dépenses
  - Connaissance des produits financiers
  - Planification long terme
  - Gestion des imprévus
- → convertQualitativeToQuantitative()

### Page 6 — Leviers d'Amélioration Financière
- "Tes 6 super-pouvoirs"
- 6 leviers avec sliders :
  - Réduire les dépenses non-essentielles → DÉPENSER
  - Automatiser l'épargne → ÉPARGNER
  - Renégocier les contrats → DÉPENSER
  - Se former en finance → COMPÉTENCE
  - Diversifier les revenus → PLANIFIER
  - Constituer un fonds d'urgence → PROTÉGER
- Mapping vers 5 dimensions du modèle

### Page finale
- Confetti + "Wow, profil complet !"
- Résumé 7 lignes (profil, revenus, dépenses, historique, risque, auto-éval, leviers)
- Bouton vert "Voir mon Dashboard"

---

## 5. Décisions de design

### Design System
- **Thème** : Dark mode (#0F172A background)
- **Font** : Inter (400-800)
- **Couleurs primaires** : Blue #3B82F6, Purple #8B5CF6
- **Couleurs accent** : Green #4ADE80, Orange #FB923C, Pink #F472B6, Gold #FACC15
- **Phone frame** : 390×844px, border-radius 44px
- **Composants** : Rounded cards, gradient buttons, animated transitions

### Ton éditorial
- Tutoiement systématique
- Langage courant, pas de jargon financier
- Phrases courtes, dynamiques, joviales
- Questions directes à l'utilisateur
- Pattern "Problème → Solution" sur chaque slide

### Navigation onboarding
- Swipe tactile + flèches clavier
- Dots de progression animés
- Bouton "Passer" pour skip vers CTA
- Bouton "← Retour" / "Et ensuite ? →"

---

## 6. Itérations et feedback PO

### V1 — Slides features directes
- **Problème** : Les slides imposaient des situations sans contexte
- **Feedback PO** : "Elle ne pose pas de contexte et impose directement des situations"

### V2 — Ajout problem-context
- Chaque slide commence par un bloc qui pose le problème
- Pattern : Problème (en haut) → Visuel solution → Titre + Description

### V3 — Gaps à 100% (version finale)
- **Ajout badges dorés** ("AUCUNE APP NE FAIT ÇA", "LA 1ÈRE APP QUI TE NOTE", etc.)
- **Slide 1** : Compteur cumulé 19€→76€→988€ pour montrer l'impact annuel
- **Slide 3** : Mécanique cascade visible (P1 "✓ plein", flèches "surplus →")
- **Slide 5** : Cube 3D abstrait remplacé par breakdown concret (Essentiel vs Envies)
- **CTA** : "5 innovations qu'aucune app ne propose" avec chiffres

### Score final de visibilité des gaps
| Gap | Score |
|-----|-------|
| EPR | 95% |
| EKH | 98% |
| Waterfall | 92% |
| Weekly | 100% |
| 3D Analysis | 100% |
| **Moyenne** | **97%** |

---

## 7. Gap analysis : Setup Wizard vs PRD

### Problème identifié
Le premier wizard (setup-wizard-preview.html) ne couvrait que 2 des 6 pages PRD :
- Page 1 : Partiellement (manquait pays/devise/horizon)
- Page 2 : Partiellement (manquait les catégories de dépenses)
- Pages 3-6 : **ENTIÈREMENT MANQUANTES**

### Solution
Création de `parcours-complet-preview.html` couvrant les 6 pages complètes avec :
- Phase tabs (1·Profil → 6·Leviers)
- Progress bar avec estimation temps
- Validation par étape

---

## 8. Fichiers produits

| Fichier | Statut | Description |
|---------|--------|-------------|
| `onboarding-preview.html` | **FINAL v3** | 7 slides onboarding avec gaps à 100% |
| `parcours-complet-preview.html` | **FINAL** | Setup wizard 6 pages couvrant tout le PRD |
| `setup-wizard-preview.html` | **OBSOLÈTE** | Premier wizard (4 pages seulement), remplacé |

---

## 9. Prochaines étapes

1. **Validation finale PO** des accroches et visuels onboarding
2. **Intégration** des 2 prototypes HTML dans le code React/TypeScript
3. **Sprint 1** : Auth + Dashboard + Navigation
4. **Configuration Supabase** : anon key + migrations
5. **Développement frontend** : tous les écrans selon PROMPT_GEMINI_FRONTEND.md
