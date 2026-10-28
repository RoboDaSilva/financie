# ==============================================================================
# Dockerfile para Produção no Easypanel (Nginx Alpine + Node.js API Sync)
# financiesuaobra.com.br (Grupo Geminadas.com & Level Construtora)
# ==============================================================================

FROM nginx:alpine

LABEL maintainer="financiesuaobra.com.br"
LABEL description="Produção do site financiesuaobra.com.br no Easypanel com Nginx Alpine e Node.js API"

# Instalar curl para healthcheck interno e nodejs para API nativa de sincronização
RUN apk add --no-cache curl nodejs

# Limpar arquivos padrão do Nginx
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copiar configuração otimizada do Nginx (Gzip, Cache, Security Headers, API Proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar todos os ativos estáticos e páginas para o diretório web
COPY . /usr/share/nginx/html/

# Garantir que index.html exista a partir de codigo.html se ainda não existir
RUN if [ ! -f /usr/share/nginx/html/index.html ] && [ -f /usr/share/nginx/html/codigo.html ]; then \
        cp /usr/share/nginx/html/codigo.html /usr/share/nginx/html/index.html; \
    fi

# Configurar script de inicialização do container
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Remover arquivos desnecessários de dentro da imagem final
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/docker-entrypoint.sh \
          /usr/share/nginx/html/.dockerignore \
          /usr/share/nginx/html/*.bak

# Configurar permissões de leitura e escrita para o content-data.json
RUN chmod -R 777 /usr/share/nginx/html

# Porta exposta para o Traefik / Easypanel
EXPOSE 80

# Healthcheck nativo para monitoramento no Easypanel
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Ponto de entrada robusto que inicia Node.js e Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
