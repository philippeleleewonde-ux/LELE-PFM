#!/bin/bash

# ============================================
# LELE HCM - Script de lancement
# ============================================
# Usage: ./start.sh [port]
# Exemple: ./start.sh 8080
# ============================================

# Couleurs pour les messages
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Port par défaut
PORT=${1:-8080}

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ██╗     ███████╗██╗     ███████╗    ██╗  ██╗ ██████╗   ║"
echo "║   ██║     ██╔════╝██║     ██╔════╝    ██║  ██║██╔════╝   ║"
echo "║   ██║     █████╗  ██║     █████╗      ███████║██║        ║"
echo "║   ██║     ██╔══╝  ██║     ██╔══╝      ██╔══██║██║        ║"
echo "║   ███████╗███████╗███████╗███████╗    ██║  ██║╚██████╗   ║"
echo "║   ╚══════╝╚══════╝╚══════╝╚══════╝    ╚═╝  ╚═╝ ╚═════╝   ║"
echo "║                                                           ║"
echo "║          Internal Loss Mitigation Platform                ║"
echo "║          Carrying Value Accounts                          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
fi

# Vérifier si le port est disponible
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Le port $PORT est déjà utilisé.${NC}"
    echo -e "${YELLOW}   Fermeture du processus existant...${NC}"
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 1
fi

echo -e "${GREEN}🚀 Démarrage du serveur de développement...${NC}"
echo -e "${CYAN}   Port: $PORT${NC}"
echo ""

# Lancer le serveur et ouvrir le navigateur
npm run dev -- --port $PORT &
SERVER_PID=$!

# Attendre que le serveur soit prêt
sleep 3

# Ouvrir le navigateur (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}🌐 Ouverture du navigateur...${NC}"
    open "http://localhost:$PORT"
# Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:$PORT" 2>/dev/null || echo "Ouvrez http://localhost:$PORT dans votre navigateur"
# Windows (Git Bash)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    start "http://localhost:$PORT"
fi

echo ""
echo -e "${GREEN}✅ LELE HCM est prêt !${NC}"
echo -e "${CYAN}   URL: http://localhost:$PORT${NC}"
echo ""
echo -e "${YELLOW}   Appuyez sur Ctrl+C pour arrêter le serveur${NC}"
echo ""

# Attendre que le serveur se termine
wait $SERVER_PID
