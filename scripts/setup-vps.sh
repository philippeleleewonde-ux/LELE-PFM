#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# LELE PFM — Script de setup VPS (à exécuter UNE SEULE FOIS)
#
# Usage depuis ton Mac :
#   ssh root@<IP_VPS> 'bash -s' < scripts/setup-vps.sh
#
# Ou copier sur le serveur puis exécuter :
#   scp scripts/setup-vps.sh root@<IP_VPS>:/tmp/
#   ssh root@<IP_VPS> 'bash /tmp/setup-vps.sh'
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

DOMAIN="pfm.hcmtechhub.cloud"
WEB_ROOT="/var/www/pfm"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"

echo "═══ LELE PFM — Setup VPS ═══"

# ─── 1. Installer les paquets nécessaires ───
echo "→ Installation des paquets..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx rsync

# ─── 2. Créer le répertoire web ───
echo "→ Création de ${WEB_ROOT}..."
mkdir -p "${WEB_ROOT}"
chown -R www-data:www-data "${WEB_ROOT}"

# ─── 3. Configurer Nginx ───
echo "→ Configuration Nginx..."
cat > "${NGINX_CONF}" << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name pfm.hcmtechhub.cloud;
    root /var/www/pfm;
    index index.html;

    # SPA routing — toutes les routes renvoient vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache longue durée pour les assets statiques Expo
    location /_expo/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Compression gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/json
        application/javascript
        text/xml
        application/xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINX

# Activer le site
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester et recharger
nginx -t
systemctl reload nginx
echo "✅ Nginx configuré"

# ─── 4. Certificat SSL ───
echo "→ Certificat SSL..."
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    read -p "Email pour Let's Encrypt : " CERT_EMAIL
    certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email "${CERT_EMAIL}"
    echo "✅ SSL activé"
else
    echo "✅ SSL déjà configuré"
fi

# ─── 5. Page placeholder ───
if [ ! -f "${WEB_ROOT}/index.html" ]; then
    echo "<html><body><h1>LELE PFM — En cours de deploiement</h1></body></html>" > "${WEB_ROOT}/index.html"
    chown www-data:www-data "${WEB_ROOT}/index.html"
fi

# ─── 6. Résumé ───
echo ""
echo "═══════════════════════════════════════════"
echo "✅ VPS prêt pour LELE PFM !"
echo ""
echo "Domaine  : https://${DOMAIN}"
echo "Web root : ${WEB_ROOT}"
echo "Nginx    : ${NGINX_CONF}"
echo ""
echo "Prochaine étape : configurer les secrets GitHub"
echo "  → VPS_HOST, VPS_USER, VPS_SSH_PRIVATE_KEY"
echo "  → EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo "═══════════════════════════════════════════"
