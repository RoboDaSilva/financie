#!/bin/sh
set -e

# ==============================================================================
# docker-entrypoint.sh • Inicializador de Produção Nginx + Node.js API
# financiesuaobra.com.br
# ==============================================================================

# Garantir permissões de escrita para persistência de dados
chmod -R 777 /usr/share/nginx/html 2>/dev/null || true

# Iniciar servidor Node.js API em background
echo "[FSO Entrypoint] Iniciando API Node.js na porta 3000..."
node /usr/share/nginx/html/server.js &

# Aguardar 1 segundo para o Node abrir a porta
sleep 1

# Iniciar Nginx em primeiro plano (PID 1)
echo "[FSO Entrypoint] Iniciando Nginx..."
exec nginx -g "daemon off;"
