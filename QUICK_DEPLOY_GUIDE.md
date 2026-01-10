# 🚀 Guide Rapide de Déploiement Dokploy

## ✅ Étapes à Suivre MAINTENANT

### 1️⃣ Se connecter à Dokploy
```
URL: http://82.29.190.250:3000/dashboard/projects
Mot de passe: XavdgsW3f$4Xh@1805ssh1OOO
```

### 2️⃣ Créer un Nouveau Projet
- Cliquer sur **"New Project"**
- Nom: `HCM Portal SaaS`
- Description: `Plateforme HCM Multi-tenant avec Supabase`

### 3️⃣ Créer une Application
- Cliquer sur **"New Application"** dans le projet
- Type: **Application** → **Docker** (GitHub)
- Nom: `hcm-portal-frontend`

### 4️⃣ Configuration Source GitHub
```
Repository: philippeleleewonde-ux/HCM-Portal
Branch: main
Build Context: /
Dockerfile Path: Dockerfile
GitHub App: Dokploy-2025-10-01-whak11
```

### 5️⃣ Build Arguments (IMPORTANT!)

Cliquez sur **"Build Args"** et ajoutez :

```bash
VITE_SUPABASE_PROJECT_ID=yhidlozgpvzsroetjxqb
VITE_SUPABASE_URL=https://yhidlozgpvzsroetjxqb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWRsb3pncHZ6c3JvZXRqeHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQzMzEsImV4cCI6MjA3NzQ4MDMzMX0.wwPm1EXQeHTwFIN7BeglwD2-QvTBSpwckazUvLEA4fg
VITE_SENTRY_DSN=https://5482e94090fb040f6804ee8f0e1f9db4@o4510334834638848.ingest.de.sentry.io/4510334907580496
VITE_API_URL=http://82.29.190.250:3000
```

**⚠️ CRITIQUE**: Ces variables doivent être dans **Build Args**, PAS dans Environment Variables!

### 6️⃣ Configuration Port
```
Container Port: 80
External Port: 3000 (ou votre choix)
```

### 7️⃣ Déployer
- Cliquer sur **"Deploy"** ou **"Déployer"**
- Attendre 2-5 minutes pour le build
- Surveiller les logs

### 8️⃣ Vérifier le Déploiement
```bash
# Health check
curl http://82.29.190.250:3000/health
# Devrait retourner: "healthy"

# Accéder à l'application
http://82.29.190.250:3000
```

---

## 🔍 Interface Dokploy - Où Trouver Quoi

### Build Args
1. Aller dans l'application `hcm-portal-frontend`
2. Tab **"Advanced"** ou **"Settings"**
3. Section **"Build Arguments"**
4. Ajouter chaque variable avec le bouton **"+"**

### Environment Variables (Runtime)
1. Tab **"Environment"** ou **"Variables"**
2. Ajouter les variables runtime (si besoin)
3. Note: Pour Vite, seules les **Build Args** sont nécessaires

### Logs
1. Tab **"Logs"** ou **"Journal"**
2. Sélectionner **"Build Logs"** pour voir le build Docker
3. Sélectionner **"Runtime Logs"** pour voir les logs Nginx

### Redéployer
1. Bouton **"Redeploy"** ou **"Rebuild"** en haut à droite
2. Ou activer **"Auto Deploy"** pour déployer automatiquement à chaque push GitHub

---

## ⚠️ Résolution de Problèmes

### Build échoue avec "VITE_SUPABASE_URL is not defined"
✅ **Solution**: Vérifier que les variables sont dans **Build Args**, pas dans Environment Variables

### Container ne démarre pas
✅ **Solution**:
1. Vérifier les logs runtime
2. S'assurer que le port 80 est bien exposé
3. Vérifier le health check endpoint

### Page blanche / 404
✅ **Solution**:
1. Vérifier que Nginx est bien configuré avec SPA fallback
2. Vérifier que les assets sont bien dans `/usr/share/nginx/html`
3. Consulter les logs Nginx

### Build très lent
✅ **Solution**:
1. Le premier build est toujours plus long (téléchargement des dépendances)
2. Les builds suivants utilisent le cache Docker
3. Temps normal: 3-5 minutes

---

## 📊 Checklist Post-Déploiement

- [ ] Health check retourne "healthy"
- [ ] Landing page accessible
- [ ] Connexion Supabase fonctionne
- [ ] Theme toggle fonctionne (light/dark)
- [ ] Navigation fonctionne
- [ ] Logs ne montrent pas d'erreurs

---

## 🔐 Sécurité Next Steps

Après le déploiement initial :

1. **Configurer HTTPS** (Traefik ou Nginx Proxy Manager)
2. **Configurer un domaine** personnalisé
3. **Activer CORS** pour l'API Supabase
4. **Configurer les backups** de la base de données
5. **Activer monitoring** (Sentry en production)

---

## 📞 Support

**Documentation complète**: Voir `DOKPLOY_DEPLOYMENT.md`

**Logs utiles**:
- Build logs: Erreurs de compilation
- Runtime logs: Erreurs Nginx
- Application logs: Erreurs JavaScript (dans Sentry)

---

**Créé le**: 2025-11-16
**Version**: 1.0.0
