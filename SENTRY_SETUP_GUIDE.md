# 🚨 Sentry Setup Guide - Error Tracking MVP

## Pourquoi Sentry est CRITIQUE

Sans Sentry, vous êtes **aveugle en production**:
- ❌ Impossible de savoir quels utilisateurs rencontrent des erreurs
- ❌ Impossible de savoir quelles erreurs sont les plus fréquentes
- ❌ Impossible de debugger sans que l'utilisateur vous envoie des screenshots
- ❌ Impossible de mesurer le taux d'erreur signup/signin

**Avec Sentry**:
- ✅ Notification instantanée quand une erreur survient
- ✅ Stack trace complète + contexte utilisateur (email, rôle, action)
- ✅ Session replay vidéo pour voir exactement ce que l'utilisateur a fait
- ✅ Graphiques de tendance (erreurs en hausse/baisse)
- ✅ Alerting Slack/Email automatique

---

## Setup Rapide (15 minutes)

### Étape 1: Créer un compte Sentry (Free Tier)

1. Aller sur https://sentry.io/signup/
2. Créer un compte avec votre email
3. Choisir **Free plan** (5,000 events/mois - largement suffisant pour démarrer)

### Étape 2: Créer un projet

1. Cliquer sur "Create Project"
2. Sélectionner plateforme: **React**
3. Alert frequency: **On every new issue** (recommandé pour démarrer)
4. Nom du projet: `lele-hcm-portal` (ou votre nom)
5. Cliquer "Create Project"

### Étape 3: Copier le DSN

Vous verrez un code d'intégration. **Ne suivez PAS ces instructions**.

À la place:
1. Cherchez la ligne qui contient `dsn:`
2. Copiez l'URL complète (ex: `https://abc123@o123456.ingest.sentry.io/7654321`)

### Étape 4: Ajouter le DSN au .env

```bash
# Dans votre fichier .env
VITE_SENTRY_DSN=https://VOTRE_DSN_ICI
```

**IMPORTANT**: Ne commitez JAMAIS ce .env dans Git!

### Étape 5: Tester l'intégration

```bash
# Lancer l'app
npm run dev

# Aller dans la console navigateur (F12)
# Vous devriez voir: "✅ Sentry initialized: development"
```

Pour forcer le test en dev, ajoutez à votre .env:
```bash
VITE_SENTRY_FORCE_DEV=true
```

Puis reproduisez l'erreur CEO signup. Vous devriez voir l'erreur apparaître dans Sentry dashboard en < 10 secondes.

---

## Vérification du Setup

### Test 1: Erreur de signup

```bash
npm run dev
# Créer un compte CEO avec email invalide
# Aller sur Sentry dashboard → Issues
# Vous devriez voir: "AuthApiError: Email address is invalid"
```

### Test 2: Contexte enrichi

Cliquez sur l'erreur dans Sentry. Vous devriez voir:
- **Tags**: `errorType: auth`, `authAction: signup`, `role: CEO`
- **Context → auth**: `email`, `emailDomain`
- **Stack trace**: ligne exacte dans useAuth.tsx

### Test 3: Session Replay (si activé)

Certaines erreurs auront un bouton "Replay" → vous verrez une vidéo de ce que l'utilisateur a fait.

---

## Configuration Alerting (Recommandé)

### Slack Integration

1. Sentry → Settings → Integrations → Slack
2. "Add to Slack"
3. Choisir le canal (ex: #tech-alerts)
4. Settings → Alerts → New Alert Rule:
   - **Condition**: "An event is seen"
   - **Filter**: `errorType:auth`
   - **Action**: "Send a Slack notification"
   - **Channel**: #tech-alerts

Maintenant chaque erreur auth vous pinguera sur Slack.

### Email Alerts

1. Settings → Alerts → New Alert Rule
2. **Condition**: "An event is seen more than 5 times in 1 hour"
3. **Action**: "Send an email"
4. **Recipients**: votre email

---

## Dashboard Recommandé

Créez un dashboard custom:

1. Sentry → Dashboards → Create Dashboard
2. Nom: "Auth Health"
3. Ajouter widgets:
   - **Erreurs signup** (last 24h): `errorType:auth AND authAction:signup`
   - **Erreurs signin** (last 24h): `errorType:auth AND authAction:signin`
   - **Top erreurs par domaine email**: Group by `auth.emailDomain`
   - **Top erreurs par rôle**: Group by `role`

---

## Métriques à surveiller

### Signup Success Rate

```
Formule:
(Total signups tentés - Erreurs Sentry) / Total signups tentés * 100

Cible: > 95%
Alerte si: < 90%
```

### MTTR (Mean Time To Resolution)

```
Temps entre:
- Première erreur détectée dans Sentry
- Erreur marquée comme "Resolved"

Cible: < 2 heures
```

### Top 5 Error Messages

Chaque semaine, reviewez:
1. Les 5 erreurs les plus fréquentes
2. Créez des issues GitHub pour les fixer
3. Mesurez la réduction semaine après semaine

---

## Production Deployment

### Avant de déployer en prod:

```bash
# 1. Vérifier que VITE_SENTRY_DSN est configuré
echo $VITE_SENTRY_DSN

# 2. Build production
npm run build

# 3. Vérifier que Sentry est bien initialisé
# Ouvrir dist/index.html dans un navigateur
# Console devrait montrer: "✅ Sentry initialized: production"
```

### Sur Vercel/Netlify

Ajouter la variable d'environnement:
1. Dashboard → Settings → Environment Variables
2. Key: `VITE_SENTRY_DSN`
3. Value: Votre DSN
4. Redéployer

---

## Budget Free Tier

**5,000 events/mois = ~166 events/jour**

Répartition typique:
- Erreurs auth: ~50/jour (si 5% erreur sur 1000 signups)
- Erreurs frontend: ~50/jour
- Events info: ~50/jour
- **Total: ~150/jour = SAFE**

Si vous dépassez:
- **Option 1**: Upgrader vers Team plan ($26/mois pour 50k events)
- **Option 2**: Filtrer les erreurs non-critiques (voir beforeSend dans sentry.ts)

---

## Troubleshooting

### "Sentry not initialized"
- Vérifier que VITE_SENTRY_DSN est défini dans .env
- Redémarrer `npm run dev`

### "Events not appearing in Sentry"
- Vérifier network tab → doit voir POST vers `ingest.sentry.io`
- Vérifier que l'environnement est correct (dev vs prod)
- Attendre 10-30 secondes (léger délai)

### "Too many events"
- Ajouter des filtres dans `beforeSend()` (voir src/lib/sentry.ts)
- Réduire `tracesSampleRate` de 0.1 à 0.05

---

## Next Steps

Une fois Sentry fonctionnel:
1. ✅ **Reproduire le bug CEO** → Vous verrez l'erreur exacte dans Sentry
2. ✅ **Configurer alerting Slack** → Notification temps réel
3. ✅ **Créer dashboard "Auth Health"** → Visibilité continue
4. ✅ **Fixer les top 3 erreurs** → Amélioration mesurable

**L'observabilité n'est pas optionnelle. C'est la fondation de toute application production-ready.**
