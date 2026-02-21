# LELE PFM - Configuration Projet Claude Code

## Projet
Application mobile de gestion financiere personnelle (Personal Finance Management).
Nom commercial : **LELE PFM**
Dossier principal : `~/Documents/Projet Modules HCM ACCOUNTING/HCM-PORTAL V3-individuel/lele-pfm/`

> **IMPORTANT** : Ce projet est 100% independant de LELE HCM. Aucun lien, aucun code partage, aucune dependance commune. Instances Supabase separees.

---

## Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Framework** | Expo ~52.0.0 + React Native 0.76.0 |
| **Langage** | TypeScript (strict mode) |
| **Routing** | Expo Router (file-based) |
| **State** | Zustand 5 + persist middleware (AsyncStorage) |
| **Auth** | Supabase Auth (email/password) |
| **BDD** | Supabase (PostgreSQL) |
| **Storage local** | expo-secure-store (tokens natif), localStorage (web) |
| **SQLite** | expo-sqlite (prevu pour offline) |
| **Charts** | victory-native |
| **i18n** | i18next + react-i18next (FR par defaut) |
| **Icons** | lucide-react-native |
| **Validation** | Zod |
| **Animations** | RN core `Animated` API (`useNativeDriver: false`) |
| **Gradients** | expo-linear-gradient |
| **Biometrie** | expo-local-authentication |
| **Notifications** | expo-notifications |

---

## Commandes de developpement

```bash
npx expo start --clear --web    # Dev web (port 8081)
npx expo start --clear          # Dev natif (iOS/Android)
npx expo start --clear --ios    # Dev iOS specifique
```

---

## Architecture fichiers

```
lele-pfm/
├── src/
│   ├── app/                    # Expo Router (file-based routing)
│   │   ├── _layout.tsx         # Root layout (auth + onboarding redirects)
│   │   ├── onboarding.tsx      # Ecran onboarding
│   │   ├── (auth)/             # Groupe auth
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   └── (tabs)/             # Groupe tabs (app principale)
│   │       ├── _layout.tsx     # Tab bar (4 onglets)
│   │       ├── index.tsx       # Dashboard
│   │       ├── transactions.tsx
│   │       ├── performance.tsx
│   │       └── settings.tsx
│   ├── components/
│   │   ├── onboarding/         # 7 slides animees + shared utils
│   │   ├── charts/             # Composants graphiques
│   │   ├── forms/              # Composants formulaires
│   │   └── ui/                 # Composants UI reutilisables
│   ├── domain/                 # Logique metier pure (pas de dependances UI)
│   │   ├── engine/             # PersonalFinanceEngine (10 etapes calcul)
│   │   ├── calculators/        # EPR, flexibilite, score, waterfall
│   │   ├── validators/         # Regles metier
│   │   └── utils/              # Math utils, validation
│   ├── infrastructure/         # Couche infrastructure
│   │   ├── supabase/           # Client + config Supabase
│   │   ├── sqlite/             # SQLite local (prevu)
│   │   ├── events/             # Event bus (calendrier)
│   │   └── sync/               # Sync offline (prevu)
│   ├── stores/                 # Zustand stores
│   │   ├── app.store.ts        # Theme, langue, isOnboarded (persiste)
│   │   ├── auth.store.ts       # User, session, tokens
│   │   ├── transaction.store.ts
│   │   ├── performance-store.ts
│   │   ├── profile-store.ts
│   │   └── engine-store.ts
│   ├── services/               # Services API
│   │   ├── auth.service.ts
│   │   └── profile.service.ts
│   ├── hooks/                  # Custom hooks
│   │   ├── useBiometric.ts
│   │   └── useTheme.ts
│   ├── theme/                  # Light/dark colors, typography
│   ├── i18n/                   # Traductions (fr, en)
│   ├── types/                  # Types TypeScript (database, engine)
│   ├── constants/
│   ├── screens/
│   └── utils/
├── app.json                    # Config Expo (scheme: lele-pfm, bundle: com.lele.pfm)
├── tsconfig.json               # Strict mode, @/* alias → src/*
└── .env                        # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## Flux de navigation

```
App Launch → isOnboarded=false → Onboarding (7 slides)
                                      ↓ "Je me lance!"
                              setOnboarded(true) + persist AsyncStorage
                                      ↓
                              Redirect → /(auth)/login

App Launch → isOnboarded=true, !authenticated → /(auth)/login
App Launch → isOnboarded=true, authenticated → /(tabs)
```

La logique de redirection est dans `src/app/_layout.tsx` :
- `!isOnboarded` → `/onboarding`
- `isOnboarded && !isAuthenticated` → `/(auth)/login`
- `isAuthenticated && inAuthGroup` → `/(tabs)`

---

## Stores Zustand

| Store | Persistence | Contenu |
|-------|-------------|---------|
| `app.store.ts` | AsyncStorage (lele-pfm-app-settings) | theme, language, isOnboarded, biometric, notifications |
| `auth.store.ts` | Non (en memoire) | user, session tokens, isAuthenticated |
| `transaction.store.ts` | - | Transactions |
| `performance-store.ts` | - | Performance/scores |
| `profile-store.ts` | - | Profil utilisateur |
| `engine-store.ts` | - | Etat du moteur de calcul |

---

## Moteur de calcul (PersonalFinanceEngine)

Le coeur metier est dans `src/domain/engine/personal-finance-engine.ts` :
- **10 etapes** de calcul financier personnel
- Calculs : potentiels, pertes attendues, volatilite, VaR, PRL, POB forecast, distribution, ventilation
- Types dans `src/types/engine.ts`
- Calculateurs specialises dans `src/domain/calculators/`

---

## Variables d'environnement

```env
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Prefix `EXPO_PUBLIC_` requis par Expo pour exposer les variables au client.

**REGLE SECURITE** : Ne JAMAIS stocker de tokens/cles dans des fichiers markdown ou code source. Utiliser uniquement `.env` (gitignored).

---

## Supabase Client

- **Natif** : `expo-secure-store` pour le stockage des tokens auth
- **Web** : `localStorage` comme fallback
- Config dans `src/infrastructure/supabase/config.ts`
- Client dans `src/infrastructure/supabase/client.ts`

---

## Bug critique connu : react-native-reanimated sur Web

**`react-native-reanimated` ~3.16 est casse sur web** :
1. `entering=` prop (FadeInUp, ZoomIn...) met `visibility: hidden` et ne lance jamais l'animation
2. `useAnimatedStyle` + `withTiming`/`withSpring` demarre mais gele a ~5-19% de progression

**Solution** : Utiliser l'API `Animated` native de React Native (`import { Animated } from 'react-native'`) avec `useNativeDriver: false`. Voir `src/components/onboarding/shared.tsx` pour les wrappers `FadeInView` et `ZoomInView`.

---

## Conventions de code

- TypeScript strict mode
- Composants React : PascalCase
- Hooks : use[Nom].ts
- Stores : [nom].store.ts ou [nom]-store.ts
- Imports absolus via alias `@/` → `src/`
- Animations : RN core `Animated` (PAS reanimated) pour le web
- i18n : cles de traduction en anglais, valeurs FR par defaut

---

## 4 onglets principaux

| Tab | Fichier | Icone | Description |
|-----|---------|-------|-------------|
| Dashboard | `(tabs)/index.tsx` | LayoutDashboard | Vue d'ensemble finances |
| Transactions | `(tabs)/transactions.tsx` | Receipt | Liste/ajout transactions |
| Performance | `(tabs)/performance.tsx` | TrendingUp | Score, grade, progression |
| Settings | `(tabs)/settings.tsx` | Settings | Parametres, profil, theme |
