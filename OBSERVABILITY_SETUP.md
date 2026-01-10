# 🔍 Guide de Setup Observabilité - LELE HCM Portal

## État actuel: AVEUGLE EN PRODUCTION ❌

Vous avez répondu honnêtement à la question critique:
> "Si 1000 utilisateurs essaient de créer des comptes et que 20% échouent, comment saurez-vous quels utilisateurs sont impactés?"

**Réponse**: "Je ne saurais rien, je suis incapable de le voir"

**C'est INACCEPTABLE pour une application production, mais c'est la vérité. Corrigeons ça.**

---

## Ce qui a été implémenté (30 minutes de travail)

### 1. Sentry Error Tracking ✅
- **Fichiers créés**:
  - `src/lib/sentry.ts` - Configuration Sentry
  - `src/main.tsx` - Initialisation avant React
  - `src/hooks/useAuth.tsx` - Capture des erreurs auth

- **Ce que ça apporte**:
  - ✅ Toutes les erreurs signup/signin sont envoyées vers Sentry
  - ✅ Contexte enrichi: email, rôle, action
  - ✅ Stack traces complètes
  - ✅ Session replay vidéo (optionnel)

### 2. Analytics Auth Supabase ✅
- **Fichiers créés**:
  - `supabase/migrations/20251108000000_auth_analytics.sql` - Table + fonctions
  - `src/lib/authAnalytics.ts` - Helpers de logging
  - `src/hooks/useAuth.tsx` - Logging des événements

- **Ce que ça apporte**:
  - ✅ Chaque signup/signin est loggé dans `auth_events` table
  - ✅ Fonction SQL `get_signup_success_rate()` pour voir le taux de succès
  - ✅ Fonction SQL `get_top_signup_errors()` pour voir les erreurs fréquentes
  - ✅ Dashboard analytics possible

---

## Setup Étape par Étape

### ÉTAPE 1: Déployer la migration Supabase (5 min)

**Option A: Supabase CLI** (recommandé)
```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref yhidlozgpvzsroetjxqb

# Appliquer la migration
supabase db push

# Vérifier que c'est bien déployé
supabase db diff
```

**Option B: Supabase Dashboard** (manuel)
1. Aller sur https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/sql/new
2. Copier tout le contenu de `supabase/migrations/20251108000000_auth_analytics.sql`
3. Coller dans l'éditeur SQL
4. Cliquer "Run"
5. Vérifier qu'il n'y a pas d'erreurs

**Vérification**:
```sql
-- Dans Supabase SQL Editor
SELECT * FROM public.auth_events LIMIT 1;
-- Doit retourner 0 rows (table vide mais elle existe)

SELECT * FROM public.get_signup_success_rate();
-- Doit retourner une ligne avec des 0
```

---

### ÉTAPE 2: Setup Sentry (15 min)

Suivre le guide: **[SENTRY_SETUP_GUIDE.md](./SENTRY_SETUP_GUIDE.md)**

**TL;DR**:
1. Créer compte Sentry (free): https://sentry.io/signup/
2. Créer projet "React"
3. Copier le DSN
4. Ajouter au `.env`:
   ```env
   VITE_SENTRY_DSN=https://VOTRE_DSN@xxx.ingest.sentry.io/xxx
   ```
5. Redémarrer `npm run dev`

**Test immédiat**:
```bash
npm run dev
# Console devrait montrer: "✅ Sentry initialized: development"

# Pour forcer Sentry en dev:
# Ajouter dans .env: VITE_SENTRY_FORCE_DEV=true
```

---

### ÉTAPE 3: Reproduire le bug CEO avec observabilité (10 min)

Maintenant refaites le test:

```bash
npm run dev
# Ouvrir http://localhost:5173

# Console navigateur (F12)
# Créer compte CEO avec ceo7@gmail.com
```

**Vous devriez voir**:
1. **Console logs** (comme avant):
   ```
   🔍 [DIAGNOSTIC] Supabase signUp() Called
   📧 Email: ceo7@gmail.com
   ...
   ❌ ERROR DETECTED:
   Message: Email address is invalid
   ```

2. **Sentry dashboard** (NOUVEAU!):
   - Aller sur https://sentry.io/organizations/VOTRE_ORG/issues/
   - Vous devriez voir l'erreur apparaître en < 30 secondes
   - Cliquer dessus → Voir tous les détails:
     - Tags: `errorType: auth`, `authAction: signup`, `role: CEO`
     - Context → auth: `email: ceo7@gmail.com`, `emailDomain: gmail.com`
     - Stack trace pointant vers `useAuth.tsx:115`

3. **Supabase `auth_events` table** (NOUVEAU!):
   ```sql
   -- Dans Supabase SQL Editor
   SELECT * FROM public.auth_events
   WHERE email = 'ceo7@gmail.com'
   ORDER BY created_at DESC;
   ```

   Devrait montrer:
   - `signup_started` - 10:30:15
   - `signup_failed` - 10:30:16 (1 seconde après)
   - error_message: "Email address is invalid"

---

## Nouveaux Superpowers Débloqués 🚀

### 1. Visibilité Temps Réel

**Avant**:
- Utilisateur: "Le signup ne marche pas!"
- Vous: "Peux-tu reproduire avec DevTools ouvert et m'envoyer les logs?"
- Utilisateur: "Euh comment on fait ça?"
- **= 2 heures perdues en back-and-forth**

**Maintenant**:
- Utilisateur: "Le signup ne marche pas!"
- Vous: *Ouvre Sentry dashboard* → Voit l'erreur exacte en 10 secondes
- Vous: "Je vois le problème, c'est réglé dans 30 minutes"
- **= 10 minutes de diagnostic**

### 2. Métriques de Santé

**Query SQL pour le taux de succès signup (dernières 24h)**:
```sql
SELECT * FROM public.get_signup_success_rate('24 hours');

-- Résultat exemple:
-- total_attempts | successes | failures | success_rate
-- 142            | 138       | 4        | 97.18%
```

**Query pour les top erreurs**:
```sql
SELECT * FROM public.get_top_signup_errors('7 days', 5);

-- Résultat exemple:
-- error_message                  | error_count | affected_emails
-- "Email address is invalid"     | 12          | {ceo7@gmail.com, test@...}
-- "Password too weak"            | 8           | {...}
-- "Rate limit exceeded"          | 3           | {...}
```

### 3. Alerting Automatique

Une fois Sentry configuré avec Slack (voir SENTRY_SETUP_GUIDE.md):

**Chaque erreur auth vous pingue sur Slack**:
```
🚨 [SENTRY] New error: AuthApiError
Message: Email address is invalid
User: ceo7@gmail.com (CEO)
Correlation: abc-123-def
Link: https://sentry.io/issues/xxx
```

---

## Dashboard Recommandé (Créer dans Supabase)

### Vue "Auth Health" (5 min)

1. Aller sur Supabase Dashboard → SQL Editor
2. Créer une nouvelle query nommée "Auth Health Dashboard"
3. Coller ce SQL:

```sql
-- 📊 AUTH HEALTH DASHBOARD

-- 1. Signup Success Rate (Last 24h)
SELECT
  'Signup Success Rate (24h)' as metric,
  success_rate || '%' as value,
  total_attempts as total,
  successes,
  failures
FROM public.get_signup_success_rate('24 hours');

-- 2. Top 5 Signup Errors (Last 7 days)
SELECT
  'Top Signup Errors' as section,
  error_message,
  error_count,
  ARRAY_LENGTH(affected_emails, 1) as unique_users
FROM public.get_top_signup_errors('7 days', 5);

-- 3. Signups by Role (Last 7 days)
SELECT
  metadata->>'role' as role,
  COUNT(*) FILTER (WHERE event_type = 'signup_success') as successes,
  COUNT(*) FILTER (WHERE event_type = 'signup_failed') as failures,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'signup_success')::numeric /
    NULLIF(COUNT(*), 0)::numeric * 100,
    2
  ) as success_rate_pct
FROM public.auth_events
WHERE created_at > NOW() - INTERVAL '7 days'
  AND event_type IN ('signup_success', 'signup_failed')
GROUP BY metadata->>'role'
ORDER BY successes DESC;

-- 4. Hourly Signup Trend (Last 24h)
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE event_type = 'signup_success') as successes,
  COUNT(*) FILTER (WHERE event_type = 'signup_failed') as failures
FROM public.auth_events
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND event_type IN ('signup_success', 'signup_failed')
GROUP BY hour
ORDER BY hour DESC;
```

4. Cliquer "Run"
5. Sauvegarder et épingler ce query

**Consultez ce dashboard chaque jour pour voir la santé de votre auth.**

---

## Checklist de Validation

Cochez quand c'est fait:

### Setup Initial
- [ ] Migration `20251108000000_auth_analytics.sql` déployée sur Supabase
- [ ] Table `auth_events` existe et est accessible
- [ ] Fonction `get_signup_success_rate()` fonctionne
- [ ] Fonction `get_top_signup_errors()` fonctionne
- [ ] Sentry account créé (free tier)
- [ ] Sentry DSN ajouté au `.env`
- [ ] App redémarrée avec `npm run dev`
- [ ] Console montre "✅ Sentry initialized"

### Test du Bug CEO
- [ ] Créer compte CEO avec `ceo-test@gmail.com`
- [ ] Erreur visible dans console logs
- [ ] Erreur visible dans Sentry dashboard (< 30 sec)
- [ ] Event visible dans `auth_events` table
- [ ] `signup_started` ET `signup_failed` tous les deux présents

### Dashboard & Monitoring
- [ ] Query "Auth Health Dashboard" créée dans Supabase
- [ ] Taux de succès signup visible (même si 0% pour l'instant)
- [ ] Top erreurs visibles
- [ ] Sentry Slack integration configurée (optionnel mais recommandé)

---

## Prochaines Étapes

### Immédiat (Aujourd'hui)
1. **Déployer cette observabilité** (30 min setup total)
2. **Reproduire le bug CEO** avec les nouveaux outils
3. **Poster les résultats** dans Sentry + `auth_events` table

### Cette Semaine
1. **Fixer le bug CEO** (vous aurez toutes les infos nécessaires)
2. **Configurer Slack alerting** dans Sentry
3. **Créer runbook** pour les erreurs auth fréquentes
4. **E2E tests** pour tous les rôles (CEO, RH_MANAGER, EMPLOYEE, etc.)

### Ce Mois
1. **Atteindre 95%+ signup success rate**
2. **Load testing** (k6) pour valider que ça scale
3. **Monitoring continu** du dashboard Auth Health
4. **Postmortems** pour chaque incident critique

---

## Budget & Coût

### Sentry Free Tier
- **5,000 events/mois** = ~166/jour
- **Performance monitoring** inclus
- **Session replay** inclus (10 sessions/mois)
- **Alerting** Slack/Email illimité
- **Coût**: 0€/mois

### Supabase
- `auth_events` table ajoute **~1KB par event**
- 1000 signups/jour = ~1MB/jour = 30MB/mois
- **Coût supplémentaire**: 0€ (inclus dans votre plan)

### Total
- **Setup**: 30 minutes de dev
- **Coût récurrent**: 0€/mois
- **ROI**: INFINI (passe de 0 visibilité → 100% visibilité)

---

## FAQ

### Q: Et si je dépasse 5,000 events/mois sur Sentry?
**R**: Sentry vous alertera à 80% du quota. Vous pouvez:
- Filtrer les erreurs non-critiques (voir `beforeSend` dans `sentry.ts`)
- Passer au plan Team ($26/mois pour 50k events)
- Désactiver le session replay (économise 30% des events)

### Q: Les données `auth_events` contiennent des PII (email)?
**R**: Oui. C'est GDPR-compliant si:
- Vous avez une mention dans votre Privacy Policy
- Les utilisateurs peuvent demander suppression (Art. 17)
- Les données sont chiffrées au repos (Supabase le fait par défaut)

**Pour être safe**, ajoutez cette migration:
```sql
-- Fonction pour supprimer les events d'un user (GDPR Right to Erasure)
CREATE OR REPLACE FUNCTION public.delete_user_auth_events(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.auth_events WHERE email = target_email;
END;
$$;
```

### Q: Pourquoi ne pas juste utiliser console.log?
**R**: console.log c'est pour le dev local. En production:
- Vous n'avez pas accès à la console des utilisateurs
- Impossible de chercher dans des millions de lignes de logs
- Pas d'alerting automatique
- Pas de contexte enrichi
- Pas de métriques agrégées

---

## Conclusion

**Vous venez de débloquer la vision en production.**

Avant: 🦗 Silence total quand un user a un problème
Maintenant: 🚨 Alert instantanée + Stack trace + Dashboard + Métriques

**C'est la différence entre un prototype et un produit production-ready.**

Déployez ça aujourd'hui. Reproduisez le bug CEO. Vous aurez ENFIN les réponses dont vous avez besoin.

---

**Questions? Besoin d'aide sur le setup?**

Envoyez-moi les logs d'erreur si le setup bloque. Mais normalement, 30 minutes chrono et vous êtes opérationnel.
