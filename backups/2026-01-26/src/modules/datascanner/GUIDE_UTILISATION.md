# 📘 Guide d'Utilisation - HCM Data Scanner Universel

## 🎯 Vue d'Ensemble

Le **HCM Data Scanner** est maintenant une application professionnelle complète capable d'extraire automatiquement les données de **tous vos rapports financiers, bancaires, d'assurance et RH**.

---

## 🚀 Démarrage Rapide

### Accès au Module
1. Connectez-vous à la plateforme HCM
2. Dans la sidebar, cliquez sur **"Financial Department"**
3. Sélectionnez **"HCM Data Scanner"**

### Upload de Fichiers
L'application accepte :
- ✅ **Excel** (.xlsx, .xls) - Multi-feuilles illimité
- ✅ **PDF** (.pdf) - Multi-pages illimité

---

## 📊 Types de Rapports Supportés

### 1️⃣ Rapports Comptables Standards
**Fichiers :** Bilan, Compte de résultat, Flux de trésorerie, Annexes

**Données extraites :**
- 💰 Revenus : Chiffre d'affaires, CA, Ventes, Produits
- 💸 Charges : Dépenses, Coûts, Frais, Charges d'exploitation

**Exemple de détection :**
```
Tableau Excel :
| Année | Chiffre d'affaires | Charges |
|-------|-------------------|---------|
| 2023  | 150 000 000       | 95 000 000 |

✅ Extraction :
- Revenue: 150 000 000 € (2023)
- Expenses: 95 000 000 € (2023)
```

---

### 2️⃣ Rapports Bancaires (Bâle III)

#### 📈 Pilier 3 - Discipline de Marché
**Données extraites :**
- 🏦 **Risque de Crédit** : UL, EL, PD, LGD, EAD, RWA, NPL
- 📊 **Risque de Marché** : VaR, stressed VaR, risque de taux, FX risk
- ⚙️ **Risque Opérationnel** : Pertes opérationnelles, AMA, BIA

**Exemple de détection :**
```
Document PDF Pilier 3 :
"La VaR au 31/12/2023 s'élève à 25 millions d'euros"

✅ Extraction :
- Market Risk - VaR: 25 000 000 € (2023)
```

#### 💧 ICAAP / COREP
**Données extraites :**
- **Liquidité** : LCR, NSFR, HQLA, ASF, RSF
- **Ratios prudentiels** : CET1, Tier 1, Total Capital

**Exemple de détection :**
```
Rapport ICAAP :
"Le LCR de la banque est de 145% au 31/12/2023"

✅ Extraction :
- Liquidity Risk - LCR: 145 (2023)
```

---

### 3️⃣ Rapports Assurance (Solvabilité II)

#### 🛡️ SFCR - Rapport sur la Solvabilité
**Données extraites :**
- **Solvabilité** : SCR, MCR, Fonds propres, Ratio de solvabilité
- **Souscription** : Risque vie, mortalité, longévité, lapse

**Exemple de détection :**
```
SFCR Page 25 :
"Le SCR s'établit à 450 millions d'euros au 31/12/2023"

✅ Extraction :
- Solvency Risk - SCR: 450 000 000 € (2023)
```

#### 📋 QRT - Templates Quantitatifs
**Données extraites :**
- Risques de mortalité
- Risques de longévité
- Risques catastrophes
- Primes souscrites

---

### 4️⃣ Rapports RH

#### 👥 Bilan Social
**Données extraites :**
- **Effectifs** : ETP, FTE, Headcount
- **Absentéisme** : Taux d'absentéisme, jours d'absence
- **Turnover** : Rotation du personnel, taux d'attrition
- **Formation** : Heures de formation, budget formation

**Exemple de détection :**
```
Bilan Social 2023 :
"L'effectif total est de 1250 ETP en 2023"
"Le taux d'absentéisme s'élève à 4.2%"

✅ Extraction :
- HR Indicators - ETP: 1250 (2023)
- HR Indicators - Absentéisme: 4.2 (2023)
```

#### 🌱 Rapport RSE
**Données extraites :**
- Heures travaillées
- Masse salariale
- Embauches / Départs

---

### 5️⃣ Risques Organisationnels

#### 🏢 Rapports de Gestion des Risques
**Données extraites :**
- **Risques IT** : Cyber risques, incidents informatiques
- **Risques de conformité** : Violations, sanctions
- **Risques de réputation**
- **Business Continuity**

**Exemple de détection :**
```
Risk Management Report :
"15 incidents cyber détectés en 2023"

✅ Extraction :
- Organizational Risk - Cyber Risk: 15 (2023)
```

---

## 🎨 Interface Utilisateur

### Étapes du Workflow

#### 1. Upload
- Glissez-déposez vos fichiers ou cliquez pour sélectionner
- Plusieurs fichiers possibles simultanément
- Taille max recommandée : 50 MB par fichier

#### 2. Scanning
- L'algorithme analyse automatiquement avec 4 modes :
  - 📊 **TABLE MODE** (confiance 90%)
  - 🔄 **TRANSPOSED MODE** (confiance 85%)
  - 🔍 **SCATTERED MODE** (confiance 70%)
  - 📍 **PROXIMITY MODE** (confiance 60%)

#### 3. Validation
- Chaque donnée extraite est présentée individuellement
- Vous pouvez **Accepter**, **Rejeter** ou **Modifier**
- Badge de confiance affiché pour chaque extraction
- Badge violet indique la feuille/page d'origine

#### 4. Résultats
- Tableau récapitulatif avec toutes les données validées
- Filtrage par catégorie
- Export possible
- Sauvegarde dans votre profil

---

## 🔍 Système de Catégories

### Badges de Couleur par Catégorie

| Catégorie | Icône | Couleur | Description |
|-----------|-------|---------|-------------|
| Revenus | 💰 | Vert | Chiffre d'affaires, ventes |
| Charges | 📉 | Rouge | Dépenses, coûts |
| Risque Crédit | 🏦 | Bleu | EAD, PD, LGD, RWA |
| Risque Marché | 📊 | Violet | VaR, risques de taux |
| Risque Liquidité | 💧 | Cyan | LCR, NSFR, HQLA |
| Risque Opérationnel | ⚙️ | Orange | Pertes op, AMA, BIA |
| Solvabilité | 🛡️ | Indigo | SCR, MCR, fonds propres |
| Souscription | 📋 | Rose | Mortalité, longévité |
| RH | 👥 | Teal | ETP, absentéisme, formation |
| Organisationnel | 🏢 | Gris | Cyber, IT, conformité |

---

## 💡 Astuces d'Utilisation

### Pour Maximiser la Détection

#### ✅ Bonnes Pratiques
1. **Formats tabulaires** : L'algorithme fonctionne mieux avec des tableaux structurés
2. **Headers clairs** : Utilisez des termes standards (CA, Revenue, VaR, SCR...)
3. **Années explicites** : Indiquez clairement les années (2023, 2024...)
4. **Multi-feuilles** : Nommez vos feuilles Excel de manière descriptive

#### ⚠️ À Éviter
1. Images scannées dans les PDF (texte non sélectionnable)
2. Tableaux très complexes avec cellules fusionnées multiples
3. Données dispersées sans structure logique

### Plage d'Années Valide
L'application détecte automatiquement les années dans la plage **N-5 à N-1** :
- En 2025 : Détection de 2020 à 2024
- En 2026 : Détection de 2021 à 2025

---

## 📈 Exemples Concrets

### Exemple 1 : Compte de Résultat Excel

**Fichier :** `compte_resultat_2023.xlsx`

**Structure :**
```
| Indicateur           | 2021        | 2022        | 2023        |
|---------------------|-------------|-------------|-------------|
| Chiffre d'affaires  | 120 000 000 | 135 000 000 | 150 000 000 |
| Charges             | 80 000 000  | 90 000 000  | 95 000 000  |
```

**Résultat :**
- ✅ 6 data points extraits
- ✅ Mode : TABLE MODE (90% confiance)
- ✅ Feuille : Sheet1

---

### Exemple 2 : Rapport Pilier 3 PDF

**Fichier :** `pilier3_2023.pdf` (150 pages)

**Contenu Page 45 :**
```
3.2 Risque de Marché
La Value at Risk (VaR) moyenne sur l'année 2023 s'élève à 25 millions d'euros,
en hausse de 10% par rapport à 2022 (22.7 millions d'euros).
```

**Résultat :**
- ✅ 2 data points extraits
- ✅ Market Risk - VaR: 25 000 000 (2023)
- ✅ Market Risk - VaR: 22 700 000 (2022)
- ✅ Page : Page 45

---

### Exemple 3 : SFCR Assurance Multi-Feuilles

**Fichier :** `SFCR_2023.xlsx` (8 feuilles)

**Feuille "Solvabilité" :**
```
| Élément                    | 2023        |
|---------------------------|-------------|
| SCR                       | 450 000 000 |
| MCR                       | 180 000 000 |
| Fonds propres éligibles   | 520 000 000 |
```

**Résultat :**
- ✅ 3 data points extraits
- ✅ Catégorie : Solvency Risk
- ✅ Feuille : Solvabilité
- ✅ Confiance : 90%

---

## 🔧 Dépannage

### Aucune Donnée Détectée

**Causes possibles :**
1. ❌ Pas de mots-clés reconnus → Vérifiez la liste des 280+ mots-clés
2. ❌ Années hors plage N-5 à N-1
3. ❌ Montants < 1000 (filtre anti-bruit)
4. ❌ PDF scanné (image) au lieu de texte

**Solution :**
- Vérifiez la console du navigateur (F12)
- Regardez les logs de scanning détaillés
- Utilisez des termes standards

---

### Confiance Faible (<70%)

**Causes :**
- Format de tableau non standard
- Données dispersées
- Fuzzy matching imparfait

**Solution :**
- Validez manuellement les données
- Modifiez si nécessaire pendant la validation

---

## 📞 Support

### Ressources Documentation
- 📖 [README.md](./README.md) - Documentation technique complète
- 🚀 [EXTENSION_COMPLETE.md](./EXTENSION_COMPLETE.md) - Détails de l'extension

### Logs et Débogage
Ouvrez la console du navigateur (F12) pour voir :
- 🚀 Démarrage du scanner
- 📊 Résultats de chaque mode
- ✅ Données extraites en temps réel
- ⚠️ Avertissements éventuels

---

## 🎓 Formation Recommandée

### Pour les Utilisateurs Finaux
1. Tester avec un fichier simple (compte de résultat)
2. Explorer les 4 modes de scanning via les logs
3. Pratiquer la validation manuelle
4. Tester avec des fichiers multi-feuilles/pages

### Pour les Administrateurs
1. Comprendre l'architecture multi-mode
2. Maîtriser la base de données de mots-clés (280+)
3. Savoir ajouter de nouvelles catégories si nécessaire
4. Configurer les seuils de confiance

---

## ✅ Checklist de Vérification

Avant de scanner un fichier :
- [ ] Le fichier contient des données financières/RH/risques ?
- [ ] Les années sont dans la plage N-5 à N-1 ?
- [ ] Les montants sont > 1000 ?
- [ ] Le PDF contient du texte sélectionnable (pas une image) ?
- [ ] Les tableaux ont des headers clairs ?

---

**Le HCM Data Scanner est maintenant prêt à traiter l'ensemble de vos rapports réglementaires et de gestion !** 🎉
