# 🚀 Guide de Déploiement Dokploy - HCM Portal

## 📋 Prérequis

- ✅ Repository GitHub : `https://github.com/philippeleleewonde-ux/HCM-Portal`
- ✅ Dockerfile créé
- ✅ .dockerignore configuré
- ✅ Compte Dokploy configuré

---

## 🔐 Informations de Connexion

### Dokploy Platform
- **URL**: http://82.29.190.250:3000/dashboard/projects
- **Mot de passe admin**: `XavdgsW3f$4Xh@1805ssh1OOO`

### Base de Données PostgreSQL
- **Database Name**: `hcm_portal`
- **Database User**: `hcm_admin`
- **Password**: `HCM2024!SecureDB#Portal`
- **Internal Host**: `hcmportalsaas-hcmdatabase-6pas6c`
- **Internal Port**: `5432`

### GitHub App
- **App Name**: `Dokploy-2025-10-01-whak11`

---

## 📝 Variables d'Environnement à Configurer dans Dokploy

### Variables Vite (Build-time)

Ces variables sont nécessaires au moment du build Docker:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Sentry Configuration (optionnel)
VITE_SENTRY_DSN=your-sentry-dsn

# API URLs
VITE_API_URL=http://82.29.190.250:3000
VITE_MODULE1_URL=http://localhost:3004
```

### Variables Runtime (Backend/Database)

```bash
# Node Environment
NODE_ENV=production
PORT=80

# Database Connection
DATABASE_URL=postgresql://hcm_admin:HCM2024%21SecureDB%23Portal@hcmportalsaas-hcmdatabase-6pas6c:5432/hcm_portal

# NextAuth (si utilisé dans le backend)
NEXTAUTH_SECRET=votre_secret_aleatoire_32_caracteres_minimum
NEXTAUTH_URL=http://82.29.190.250

# Module URLs
MODULE1_URL=http://localhost:3004

# Portal Admin
PORTAL_ADMIN_EMAIL=admin@hcm-portal.com
PORTAL_ADMIN_PASSWORD=Admin2024!Secure
```

---

## 🛠️ Étapes de Déploiement sur Dokploy

### Étape 1 : Pousser les fichiers Docker sur GitHub

```bash
# Depuis votre machine locale
cd "/Users/onclephilbasket/Documents/Sauvergarde docs Macbookair15/Projet Modules HCM ACCOUNTING/HCM-PORTAL V2"

# Ajouter les nouveaux fichiers
git add Dockerfile .dockerignore DOKPLOY_DEPLOYMENT.md

# Commit
git commit -m "feat: Add Dockerfile and deployment configuration for Dokploy

- Add multi-stage Dockerfile with Nginx for production
- Add .dockerignore to optimize build
- Add deployment documentation

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push vers GitHub
git push philippe main
```

### Étape 2 : Se connecter à Dokploy

1. Ouvrir http://82.29.190.250:3000/dashboard/projects
2. Se connecter avec le mot de passe admin

### Étape 3 : Créer un Nouveau Projet

1. Cliquer sur **"New Project"** ou **"Nouveau Projet"**
2. Nom du projet : `HCM Portal`
3. Description : `HCM Portal - Plateforme SaaS Multi-tenant`

### Étape 4 : Créer une Application

1. Dans le projet, cliquer sur **"New Application"** / **"Nouvelle Application"**
2. Type : **Docker** (ou **GitHub**)
3. Nom : `hcm-portal-frontend`

### Étape 5 : Configurer la Source

**Si vous choisissez GitHub :**

1. **Repository** : Sélectionner `philippeleleewonde-ux/HCM-Portal`
2. **Branch** : `main`
3. **Build Context** : `/` (racine)
4. **Dockerfile Path** : `Dockerfile`
5. **GitHub App** : Sélectionner `Dokploy-2025-10-01-whak11`

### Étape 6 : Configurer les Build Args

Dans la section **Build Arguments** :

```
VITE_SUPABASE_URL=<votre-supabase-url>
VITE_SUPABASE_ANON_KEY=<votre-supabase-anon-key>
VITE_SENTRY_DSN=<votre-sentry-dsn>
```

### Étape 7 : Configurer le Port

1. **Container Port** : `80`
2. **External Port** : `3000` (ou le port de votre choix)

### Étape 8 : Configurer les Variables d'Environnement

Dans la section **Environment Variables** :

```bash
NODE_ENV=production
DATABASE_URL=postgresql://hcm_admin:HCM2024%21SecureDB%23Portal@hcmportalsaas-hcmdatabase-6pas6c:5432/hcm_portal
```

### Étape 9 : Configurer le Health Check

- **Health Check Path** : `/health`
- **Interval** : `30s`
- **Timeout** : `3s`
- **Retries** : `3`

### Étape 10 : Déployer

1. Cliquer sur **"Deploy"** / **"Déployer"**
2. Attendre que le build se termine (cela peut prendre quelques minutes)
3. Vérifier les logs pour s'assurer qu'il n'y a pas d'erreurs

---

## ✅ Vérification du Déploiement

Une fois déployé, testez :

1. **URL de l'application** : http://82.29.190.250:3000
2. **Health check** : http://82.29.190.250:3000/health (devrait retourner "healthy")
3. **Page d'accueil** : Vérifier que la landing page se charge
4. **Connexion** : Tester la connexion avec un compte

---

## 🔧 Dépannage

### Build échoue

1. Vérifier les logs de build dans Dokploy
2. S'assurer que toutes les variables `VITE_*` sont définies en Build Args
3. Vérifier que le Dockerfile est bien à la racine

### Container ne démarre pas

1. Vérifier les logs du container
2. S'assurer que le port 80 est bien exposé
3. Vérifier le health check

### Variables d'environnement non prises en compte

1. Les variables `VITE_*` doivent être en **Build Args** (pas en env vars)
2. Rebuilder l'application après modification des build args

---

## 📊 Monitoring

### Logs

- Accéder aux logs via l'interface Dokploy
- Surveiller les erreurs au démarrage

### Métriques

- CPU usage
- Memory usage
- Request count
- Response time

---

## 🔄 Mises à Jour

Pour déployer une nouvelle version :

1. Push les changements sur GitHub (branche `main`)
2. Dans Dokploy, cliquer sur **"Redeploy"** / **"Redéployer"**
3. Ou activer le **Auto Deploy** pour un déploiement automatique à chaque push

---

## 🔒 Sécurité

### Recommandations

1. **HTTPS** : Configurer un reverse proxy avec SSL (Nginx/Traefik)
2. **Firewall** : Limiter l'accès aux ports non nécessaires
3. **Secrets** : Ne jamais commiter les fichiers `.env`
4. **Backups** : Sauvegarder régulièrement la base de données

### Variables Sensibles

Les variables suivantes ne doivent JAMAIS être commitées :

- `VITE_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `PORTAL_ADMIN_PASSWORD`

---

## 📞 Support

En cas de problème :

1. Vérifier les logs Dokploy
2. Consulter la documentation : https://dokploy.com/docs
3. Vérifier le health check endpoint

---

**Dernière mise à jour** : 2025-11-16
**Version** : 1.0.0
