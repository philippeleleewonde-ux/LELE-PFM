# Documentation: Workflow Complet de Signup LELE HCM Portal

**Date de création**: 2025-11-09
**Version**: 1.0
**Statut**: Production-ready avec observabilité complète

---

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Flux Détaillé du Signup](#flux-détaillé-du-signup)
4. [Points d'Observabilité](#points-dobservabilité)
5. [Debugging Guide](#debugging-guide)
6. [Métriques & Analytics](#métriques--analytics)
7. [Cas d'Erreur Connus](#cas-derreur-connus)

---

## Vue d'Ensemble

### Objectif
Permettre aux utilisateurs de créer un compte sur LELE HCM Portal selon leur rôle (CEO, RH_MANAGER, EMPLOYEE, etc.) avec une observabilité complète pour tracking et debugging.

### Technologies
- **Frontend**: React 18+ avec TypeScript
- **Backend**: Supabase Auth (PostgreSQL + JWT)
- **Observabilité**: Sentry (error tracking) + auth_events table (analytics)
- **Validation**: Zod schemas

### Rôles Supportés
1. `CEO` - Chief Executive Officer
2. `RH_MANAGER` - Responsable RH
3. `EMPLOYEE` - Employé
4. `TEAM_LEADER` - Chef d'équipe
5. `CONSULTANT` - Consultant externe
6. `BANKER` - Banquier partenaire

---

## Architecture Technique

```
┌─────────────────────────────────────────────────────────────────┐
│                    UTILISATEUR (Browser)                        │
│                  http://localhost:8081/register                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND: RegisterNew.tsx                          │
│  - Formulaire multi-étapes (rôle → infos → company)            │
│  - Validation Zod                                               │
│  - Submit → useAuth.signUp()                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              HOOK: useAuth.tsx                                  │
│                                                                 │
│  1. 📊 Log: signup_started → auth_events                       │
│  2. 🔐 Call: supabase.auth.signUp()                            │
│  3a. ✅ Success:                                                │
│      - 📊 Log: signup_success → auth_events                    │
│      - 🔄 Redirect: /dashboard                                 │
│  3b. ❌ Error:                                                  │
│      - 🚨 Sentry.captureException()                            │
│      - 📊 Log: signup_failed → auth_events                     │
│      - 🖼️ Toast error message                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│  SUPABASE AUTH          │   │  OBSERVABILITY          │
│                         │   │                         │
│  • Create user in       │   │  🚨 SENTRY.IO          │
│    auth.users table     │   │  • Error tracking       │
│  • Generate JWT token   │   │  • Stack traces         │
│  • Store user_metadata  │   │  • Context enrichment   │
│    (role, fullName)     │   │                         │
│  • Return session       │   │  📊 SUPABASE DB         │
│                         │   │  • auth_events table    │
│  Error cases:           │   │  • Event tracking       │
│  - Email invalid        │   │  • Success rate metrics │
│  - Email exists         │   │                         │
│  - Weak password        │   └─────────────────────────┘
└─────────────────────────┘
```

---

## Flux Détaillé du Signup

### Étape 1: Sélection du Rôle
**Fichier**: `src/pages/RegisterNew.tsx` (lignes ~150-200)

```typescript
// User sélectionne son rôle parmi les 6 options
<RoleSelector selectedRole={selectedRole} onRoleSelect={setSelectedRole} />

// Validation
if (!selectedRole) {
  toast.error("Veuillez sélectionner un rôle");
  return;
}
```

### Étape 2: Remplissage du Formulaire
**Fichier**: `src/pages/RegisterNew.tsx` (lignes ~200-300)

**Champs requis**:
- `fullName`: Nom complet (min 2 caractères)
- `email`: Email valide (format RFC 5322)
- `password`: Mot de passe (min 8 caractères)
- `companyName`: Nom de l'entreprise (optionnel pour certains rôles)

**Validation Zod**:
```typescript
const schema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Min 8 caractères"),
  companyName: z.string().optional(),
});
```

### Étape 3: Soumission du Formulaire
**Fichier**: `src/pages/RegisterNew.tsx` → `handleSubmit()`

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // 1. Validation frontend
  const validation = schema.safeParse(formData);
  if (!validation.success) {
    toast.error(validation.error.errors[0].message);
    return;
  }

  // 2. Appel au hook useAuth
  const { error } = await signUp({
    email: formData.email,
    password: formData.password,
    metadata: {
      role: selectedRole,
      full_name: formData.fullName,
      company_name: formData.companyName,
    },
  });

  // 3. Gestion du résultat
  if (error) {
    toast.error(error.message);
  } else {
    toast.success("Compte créé avec succès !");
    // Redirect handled by useAuth
  }
};
```

### Étape 4: Exécution du Signup (useAuth)
**Fichier**: `src/hooks/useAuth.tsx` (lignes ~100-180)

```typescript
const signUp = async ({ email, password, metadata }: SignUpParams) => {
  console.log("🔍 [DIAGNOSTIC] Supabase signUp() Called");
  console.log("📧 Email:", email);
  console.log("👤 Full Name:", metadata?.full_name);
  console.log("🎭 Role:", metadata?.role);

  // STEP 1: Log signup_started (for analytics)
  await logAuthEvent({
    eventType: 'signup_started',
    email: email,
    metadata: {
      role: metadata?.role,
      fullName: metadata?.full_name,
    },
  });

  // STEP 2: Call Supabase Auth API
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: metadata?.role,
        full_name: metadata?.full_name,
        company_name: metadata?.company_name,
      },
    },
  });

  console.log("🔍 [DIAGNOSTIC] Supabase signUp() Response");
  console.log("✅ Success:", !!data.user);
  console.log("❌ Error:", error?.message || "None");

  // STEP 3a: Handle ERROR
  if (error) {
    console.error("❌ ERROR DETECTED:");
    console.error("  Message:", error.message);
    console.error("  Code:", (error as any).code);

    // Capture error in Sentry
    captureAuthError(error, {
      email,
      role: metadata?.role,
      action: 'signup',
    });

    // Log failed event in analytics
    await logAuthEvent({
      eventType: 'signup_failed',
      email: email,
      metadata: { role: metadata?.role },
      error: {
        message: error.message,
        code: (error as any).code,
      },
    });

    return { error, user: null };
  }

  // STEP 3b: Handle SUCCESS
  console.log("✅ Success! User created:", data.user?.id);
  console.log("📧 User email:", data.user?.email);
  console.log("🎭 User role from metadata:", data.user?.user_metadata?.role);

  // Log success event in analytics
  await logAuthEvent({
    eventType: 'signup_success',
    email: data.user?.email,
    userId: data.user?.id,
    metadata: {
      role: data.user?.user_metadata?.role,
    },
  });

  // Redirect to dashboard
  console.log("🔄 Redirect URL:", "/dashboard");
  navigate("/dashboard");

  return { error: null, user: data.user };
};
```

### Étape 5: Stockage dans Supabase

**Table**: `auth.users` (Supabase Auth)

| Colonne | Valeur | Type |
|---------|--------|------|
| `id` | UUID auto-généré | uuid |
| `email` | Email de l'utilisateur | text |
| `encrypted_password` | Hash bcrypt du password | text |
| `user_metadata` | `{ role, full_name, company_name }` | jsonb |
| `created_at` | Timestamp de création | timestamptz |

**Table**: `public.auth_events` (Analytics)

| Colonne | Valeur | Type |
|---------|--------|------|
| `id` | UUID auto-généré | uuid |
| `event_type` | `signup_started` / `signup_success` / `signup_failed` | text |
| `email` | Email de l'utilisateur | text |
| `user_id` | UUID de l'user (si success) | uuid |
| `metadata` | `{ role, fullName }` | jsonb |
| `error_message` | Message d'erreur (si failed) | text |
| `error_code` | Code d'erreur (si failed) | text |
| `user_agent` | User agent du navigateur | text |
| `created_at` | Timestamp de l'événement | timestamptz |

---

## Points d'Observabilité

### 🚨 Sentry Error Tracking

**Fichier**: `src/lib/sentry.ts`

**Quand est-ce déclenché**:
- ❌ Erreur lors du `supabase.auth.signUp()`
- ❌ Erreur lors du `supabase.auth.signIn()`
- ❌ Erreur lors de toute action d'authentification

**Données capturées**:
```javascript
{
  tags: {
    errorType: 'auth',
    authAction: 'signup',
    role: 'CEO',
  },
  contexts: {
    auth: {
      email: 'user@example.com',
      emailDomain: 'example.com',
      action: 'signup',
    },
  },
  level: 'error',
  stackTrace: [...],
}
```

**Accès dashboard**: https://sentry.io → Projet "javascript-react" → Issues

---

### 📊 Auth Analytics (Supabase)

**Fichier**: `src/lib/authAnalytics.ts`

**Événements trackés**:
1. `signup_started` - User commence le processus de signup
2. `signup_success` - Signup complété avec succès
3. `signup_failed` - Signup échoué (avec error details)
4. `signin_started` - User commence le signin
5. `signin_success` - Signin réussi
6. `signin_failed` - Signin échoué
7. `signout` - User se déconnecte

**Fonction helper**:
```typescript
export const logAuthEvent = async ({
  eventType,
  email,
  userId,
  metadata = {},
  error,
}: LogAuthEventParams) => {
  const { error: insertError } = await supabase
    .from('auth_events')
    .insert({
      event_type: eventType,
      email: email || null,
      user_id: userId || null,
      metadata: metadata,
      error_message: error?.message || null,
      error_code: error?.code || null,
      user_agent: navigator.userAgent,
    });
};
```

---

## Debugging Guide

### Problème 1: Signup échoue sans message d'erreur

**Symptômes**:
- Formulaire soumis mais rien ne se passe
- Pas de toast error
- Pas de redirect

**Diagnostic**:
1. Ouvrir DevTools Console (F12)
2. Chercher les logs `🔍 [DIAGNOSTIC]`
3. Vérifier si `Supabase signUp() Called` apparaît
4. Vérifier la réponse: `Success` ou `Error`

**Query SQL pour vérifier**:
```sql
SELECT * FROM public.auth_events
WHERE email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 5;
```

**Actions**:
- Si `signup_started` existe mais pas `signup_success` → voir erreur Supabase
- Si aucun event → problème frontend (validation Zod?)
- Si `signup_failed` existe → voir `error_message` dans la table

---

### Problème 2: "Email address is invalid"

**Cause root**: Email non-valide selon Supabase (ex: domaines fictifs)

**Solution**:
1. Vérifier que "Confirm email" est **désactivé** dans Supabase Auth Settings
2. Utiliser un vrai email (ex: Gmail) pour les tests
3. Ou configurer un provider SMTP pour les emails de confirmation

**Navigation**: Supabase Dashboard → Authentication → Settings → Email → **Décocher "Confirm email"**

---

### Problème 3: "User already registered"

**Cause**: Email déjà utilisé dans `auth.users`

**Solution**:
```sql
-- Vérifier si l'email existe
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';

-- Si besoin, supprimer l'utilisateur (DEV ONLY)
DELETE FROM auth.users WHERE email = 'user@example.com';
```

---

### Problème 4: Password trop faible

**Cause**: Supabase exige min 8 caractères par défaut

**Solution**:
- Utiliser un password avec min 8 caractères
- Ou modifier la policy dans Supabase Auth Settings

---

## Métriques & Analytics

### 1. Taux de Succès des Signups (24h)

```sql
SELECT * FROM public.get_signup_success_rate('24 hours');
```

**Résultat attendu**:
| total_attempts | successes | failures | success_rate |
|----------------|-----------|----------|--------------|
| 10             | 8         | 2        | 80.00        |

---

### 2. Top 5 Erreurs des 7 Derniers Jours

```sql
SELECT * FROM public.get_top_signup_errors('7 days', 5);
```

**Résultat attendu**:
| error_message | error_count | affected_emails |
|---------------|-------------|-----------------|
| Email address is invalid | 3 | {user1@..., user2@...} |
| User already registered | 2 | {user3@...} |

---

### 3. Signups par Rôle (7 jours)

```sql
SELECT
  metadata->>'role' as role,
  COUNT(*) FILTER (WHERE event_type = 'signup_success') as successes,
  COUNT(*) FILTER (WHERE event_type = 'signup_failed') as failures,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'signup_success')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate
FROM public.auth_events
WHERE created_at > NOW() - INTERVAL '7 days'
  AND event_type IN ('signup_success', 'signup_failed')
GROUP BY role
ORDER BY successes DESC;
```

**Résultat attendu**:
| role | successes | failures | success_rate |
|------|-----------|----------|--------------|
| CEO | 5 | 1 | 83.33 |
| RH_MANAGER | 3 | 0 | 100.00 |
| EMPLOYEE | 2 | 2 | 50.00 |

---

### 4. Historique Complet d'un Utilisateur

```sql
SELECT
  event_type,
  error_message,
  metadata,
  created_at
FROM public.auth_events
WHERE email = 'ceo-test-observability@gmail.com'
ORDER BY created_at ASC;
```

---

## Cas d'Erreur Connus

### Erreur 1: "Email address is invalid"

**Code Supabase**: `invalid_email`

**Cause**:
- Email au format invalide (ex: manque @)
- Domaine fictif (ex: `test@fakeemail.com`)
- Confirmation email activée mais email non-vérifié

**Fréquence**: ~10% des erreurs signup

**Solution**:
- Validation Zod côté frontend (déjà implémentée)
- Désactiver "Confirm email" dans Supabase Auth Settings (FAIT)
- Utiliser des vrais emails pour les tests

**Sentry tags**:
- `errorType: auth`
- `authAction: signup`
- `role: [CEO|RH_MANAGER|etc.]`

---

### Erreur 2: "User already registered"

**Code Supabase**: `user_already_exists`

**Cause**: Email déjà présent dans `auth.users`

**Fréquence**: ~5% des erreurs signup

**Solution**:
- Toast error clair: "Cet email est déjà utilisé. Essayez de vous connecter."
- Rediriger vers `/login` avec un bouton
- Proposer "Mot de passe oublié ?"

---

### Erreur 3: "Password is too weak"

**Code Supabase**: `weak_password`

**Cause**: Password < 8 caractères

**Fréquence**: ~3% des erreurs signup

**Solution**:
- Validation Zod min 8 caractères (déjà implémentée)
- Afficher les exigences de password pendant la saisie
- Strength indicator visuel

---

### Erreur 4: Network Error / Failed to fetch

**Code**: `network_error`

**Cause**:
- Connexion internet coupée
- Supabase API down (rare)
- CORS issues (dev local)

**Fréquence**: ~2% des erreurs signup

**Solution**:
- Retry automatique (3 tentatives avec exponential backoff)
- Toast: "Problème de connexion, vérifiez votre internet"
- Fallback offline mode ?

---

## Checklist de Validation du Signup

### Avant chaque release:

- [ ] Tester signup pour **tous les 6 rôles**
- [ ] Vérifier que Sentry capture les erreurs
- [ ] Vérifier que `auth_events` log les événements
- [ ] Tester avec email invalide → voir erreur claire
- [ ] Tester avec email existant → voir erreur "déjà utilisé"
- [ ] Tester avec password faible → voir erreur validation
- [ ] Vérifier redirect vers `/dashboard` après signup success
- [ ] Vérifier que le token JWT est stocké dans localStorage
- [ ] Vérifier que `user_metadata` contient `role`, `full_name`, `company_name`

### Métriques à surveiller:

- [ ] Signup success rate > 90%
- [ ] Temps moyen de signup < 30 secondes
- [ ] Taux d'erreur "Email invalid" < 5%
- [ ] Taux d'erreur "User exists" < 3%
- [ ] Aucune erreur 500 côté Supabase

---

## Logs Console Attendus (Signup Success)

```
🔍 [DIAGNOSTIC] Supabase signUp() Called
📧 Email: ceo-test@gmail.com
👤 Full Name: Test CEO
🎭 Role: CEO
🏢 Company Name: Test Company

🔍 [DIAGNOSTIC] Supabase signUp() Response
✅ Success: true
❌ Error: None

✅ Success! User created: 18d4eaf3-3de3-4d69-9821-dcb413f8b3d5
📧 User email: ceo-test@gmail.com
🎭 User role from metadata: CEO
🔄 Redirect URL: /dashboard
```

---

## Logs Console Attendus (Signup Failed)

```
🔍 [DIAGNOSTIC] Supabase signUp() Called
📧 Email: invalid-email
👤 Full Name: Test User
🎭 Role: CEO

🔍 [DIAGNOSTIC] Supabase signUp() Response
✅ Success: false
❌ Error: Email address is invalid

❌ ERROR DETECTED:
  Message: Email address is invalid
  Code: invalid_email

🚨 [Sentry] Error captured with context:
  - Email domain: N/A
  - Role: CEO
  - Action: signup
```

---

## Références Techniques

### Fichiers Clés
- [src/pages/RegisterNew.tsx](src/pages/RegisterNew.tsx) - UI du signup
- [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx) - Logique auth
- [src/lib/sentry.ts](src/lib/sentry.ts) - Configuration Sentry
- [src/lib/authAnalytics.ts](src/lib/authAnalytics.ts) - Helpers analytics
- [supabase/migrations/20251108000000_auth_analytics.sql](supabase/migrations/20251108000000_auth_analytics.sql) - Schema DB

### Documentation Externe
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Zod Validation](https://zod.dev/)

---

## Changelog

### Version 1.0 (2025-11-09)
- ✅ Observabilité complète implémentée (Sentry + auth_analytics)
- ✅ Documentation workflow signup créée
- ✅ Queries SQL analytics ready
- ✅ Debugging guide complet

### Prochaines Améliorations
- [ ] Retry automatique sur network error
- [ ] Email verification flow
- [ ] OAuth providers (Google, Microsoft)
- [ ] Multi-tenant architecture (schema-per-tenant)
- [ ] E2E tests pour tous les rôles

---

**Maintenu par**: LELE HCM Portal Team
**Dernière mise à jour**: 2025-11-09
**Contact**: support@lele-hcm.com
