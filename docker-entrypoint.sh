#!/bin/sh
set -e

# ==============================================================================
# docker-entrypoint.sh • Inicializador de Produção Nginx + Node.js API
# financiesuaobra.com.br
# ==============================================================================

# 1. Se existir volume persistente /data (Easypanel), sincronizar content-data.json
if [ -d "/data" ]; then
    echo "[FSO Entrypoint] Diretório de volume persistente /data detectado."
    chmod 777 /data 2>/dev/null || true

    # Se já existir dados no volume persistente, restaurar para o webroot do Nginx
    if [ -f "/data/content-data.json" ]; then
        echo "[FSO Entrypoint] Restaurando content-data.json do volume persistente /data..."
        cp -f /data/content-data.json /usr/share/nginx/html/content-data.json 2>/dev/null || true
    elif [ -f "/usr/share/nginx/html/content-data.json" ]; then
        echo "[FSO Entrypoint] Inicializando volume persistente /data com content-data.json inicial..."
        cp -f /usr/share/nginx/html/content-data.json /data/content-data.json 2>/dev/null || true
    fi
    chmod 666 /data/content-data.json 2>/dev/null || true
fi

# 2. Garantir permissões de escrita em content-data.json e diretório web
if [ ! -f "/usr/share/nginx/html/content-data.json" ]; then
    echo "{}" > /usr/share/nginx/html/content-data.json
fi
chmod 666 /usr/share/nginx/html/content-data.json 2>/dev/null || true
chmod 777 /usr/share/nginx/html 2>/dev/null || true

# 3. Iniciar servidor Node.js API em background
echo "[FSO Entrypoint] Iniciando API Node.js de sincronização na porta 3000..."
API_PORT=3000 node /usr/share/nginx/html/server.js &

# 4. Aguardar 1 segundo para o Node abrir a porta
sleep 1

# 5. Iniciar Nginx em primeiro plano (PID 1)
echo "[FSO Entrypoint] Iniciando Nginx..."
exec nginx -g "daemon off;"
