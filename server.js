// ==============================================================================
// server.js • Backend API de Persistência e Sincronização em Tempo Real
// financiesuaobra.com.br (Grupo Geminadas.com & Level Construtora)
// Executado em background via Node.js nativo (Zero Dependências Externas)
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MAX_PAYLOAD_SIZE = 50 * 1024 * 1024; // 50MB para fotos e plantas baixas 9:16 em Base64

// Dados iniciais padrão de fallback caso o arquivo físico ainda não exista
const initialDefaultData = {
  siteConfig: {
    whatsapp: "5544999999999",
    phoneDisplay: "(44) 99999-9999",
    whatsappMsg: "Olá! Vim pelo site financiesuaobra.com.br e gostaria de conversar sobre financiamento de construção Caixa (Grupo Geminadas.com & Level Construtora).",
    instagram: "https://instagram.com/geminadas",
    facebook: "https://facebook.com/geminadas",
    youtube: "https://youtube.com/@geminadas",
    interestRate: 9.89,
    address: "Av. Advogado Horácio Raccanello Filho, 5570 - Novo Centro, Maringá - PR, 87020-035",
    email: "contato@financiesuaobra.com.br",
    heroTitle: "Financiamento Caixa Terreno e Construção em Maringá: <span class=\"text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-brand-greenLight\">Projetos Geminadas & Obra Level</span>",
    pageTitle: "Financiamento Caixa Terreno e Construção | Financie Sua Obra"
  },
  projects: [
    {
      id: "obra-1",
      title: "Residência Horizonte Contemporânea",
      modality: "Terreno + Construção",
      standard: "Alto Padrão",
      location: "Condomínio Fechado • Maringá/PR",
      timeline: "11 meses",
      area: 235,
      lotArea: 420,
      beds: "3 Suítes (1 Master)",
      garage: 2,
      cost: 920000,
      valuation: 1280000,
      photoUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
      photos: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80"
      ],
      floorplans: [
        { name: "Pavimento Térreo (Living, Gourmet & Piscina)", url: "" },
        { name: "Pavimento Superior (3 Suítes & Mezanino)", url: "" }
      ],
      description: "Sobrado de alto padrão executado 100% via financiamento Caixa na modalidade Aquisição de Terreno + Construção. Projeto arquitetônico autoral Geminadas.com com fachada imponente em concreto aparente e brises amadeirados. Pavimento térreo com living integrado em pé-direito duplo, espaço gourmet completo e piscina com prainha; pavimento superior reservado com mezanino panorâmico e 3 amplas suítes. Execução primorosa pela Level Construtora."
    },
    {
      id: "obra-2",
      title: "Casa Reserva Imperial",
      modality: "Construção em Terreno Próprio",
      standard: "Alto Padrão",
      location: "Condomínio Fechado • Maringá e Região",
      timeline: "10 meses",
      area: 192,
      lotArea: 360,
      beds: "3 Suítes",
      garage: 2,
      cost: 740000,
      valuation: 1020000,
      photoUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
      photos: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1000&q=80"
      ],
      floorplans: [
        { name: "Planta Baixa Térrea", url: "" }
      ],
      description: "O cliente já possuía o terreno quitado no condomínio e utilizou o próprio lote como entrada na operação Caixa. Planta baixa inteligente e funcional otimizando a insolação da tarde na piscina, esquadrias pretas em PVC e porcelanatos de grandes formatos."
    },
    {
      id: "obra-3",
      title: "Residência Bella Vista",
      modality: "Terreno + Construção",
      standard: "Médio Padrão",
      location: "Bairro Planejado • Alto da Boa Vista",
      timeline: "8 meses",
      area: 148,
      lotArea: 300,
      beds: "1 Suíte + 2 Demi",
      garage: 2,
      cost: 530000,
      valuation: 720000,
      photoUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80",
      photos: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80"
      ],
      floorplans: [
        { name: "Planta Baixa Humanizada", url: "" }
      ],
      description: "Projeto focado em altíssima liquidez e conforto. Compra do terreno e construção financiadas em contrato único pela Caixa com uso do FGTS na entrada. Entregue pela Level Construtora com área gourmet integrada e infraestrutura completa para energia solar e climatização."
    }
  ],
  lastUpdated: new Date().toISOString()
};

// Resolver caminhos de armazenamento físico (suporte a volume /data e web root Nginx)
function getDataFilePaths() {
  const targets = [];

  if (process.env.DATA_FILE_PATH) {
    targets.push(process.env.DATA_FILE_PATH);
  }

  // Volume persistente no Easypanel / Docker (/data/content-data.json)
  try {
    if (fs.existsSync('/data')) {
      targets.push('/data/content-data.json');
    }
  } catch (_) {}

  // Diretório web do Nginx no container
  const nginxHtmlFile = '/usr/share/nginx/html/content-data.json';
  targets.push(nginxHtmlFile);

  // Diretório relativo da aplicação
  const localFile = path.join(__dirname, 'content-data.json');
  if (!targets.includes(localFile)) {
    targets.push(localFile);
  }

  return targets;
}

// Ler dados diretamente do disco em tempo real (Sem cache em memória obsoleto)
function readDataFromDisk() {
  const paths = getDataFilePaths();
  
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.siteConfig || Array.isArray(parsed.projects))) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(`[FSO API] Aviso ao ler ${filePath}:`, err.message);
    }
  }

  // Se nenhum arquivo existir, criar com os dados padrão iniciais
  writeDataToDisk(initialDefaultData);
  return initialDefaultData;
}

// Gravar dados fisicamente no disco em todos os caminhos sincronizados
function writeDataToDisk(data) {
  data.lastUpdated = new Date().toISOString();
  const jsonStr = JSON.stringify(data, null, 2);
  const paths = getDataFilePaths();
  let savedAny = false;

  for (const filePath of paths) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, jsonStr, 'utf8');
      try { fs.chmodSync(filePath, 0o666); } catch (_) {}
      savedAny = true;
    } catch (err) {
      console.error(`[FSO API] Erro ao gravar em ${filePath}:`, err.message);
    }
  }

  if (savedAny) {
    console.log(`[FSO API] Dados salvos em content-data.json com sucesso em ${data.lastUpdated}`);
  }
  return savedAny;
}

// Garantir arquivo inicial no boot
readDataFromDisk();

// Servidor HTTP Nativo
const server = http.createServer((req, res) => {
  // CORS & Anti-Cache Estrito Obrigatório
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];

  // 1. Healthcheck
  if (urlPath === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString() }));
    return;
  }

  // 2. GET /api/content - Obter dados em tempo real direto do disco (Mobile & Desktop)
  if (urlPath === '/api/content' && req.method === 'GET') {
    try {
      const currentData = readDataFromDisk();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(currentData));
    } catch (err) {
      console.error('[FSO API] Erro no GET /api/content:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Erro ao ler dados do servidor' }));
    }
    return;
  }

  // 3. POST /api/content - Salvar dados do Painel Admin (Com suporte a payload de até 50MB)
  if (urlPath === '/api/content' && req.method === 'POST') {
    const chunks = [];
    let receivedBytes = 0;

    req.on('data', chunk => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_PAYLOAD_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Payload muito grande. O limite máximo permitido é 50MB.' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf8');
        const payload = JSON.parse(bodyStr);

        if (!payload || (!payload.siteConfig && !Array.isArray(payload.projects))) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Payload inválido. Esperado siteConfig e/ou projects.' }));
          return;
        }

        const currentData = readDataFromDisk();
        const updatedData = {
          siteConfig: payload.siteConfig || currentData.siteConfig || initialDefaultData.siteConfig,
          projects: Array.isArray(payload.projects) ? payload.projects : (currentData.projects || initialDefaultData.projects),
          lastUpdated: new Date().toISOString()
        };

        const success = writeDataToDisk(updatedData);
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, lastUpdated: updatedData.lastUpdated }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Falha ao persistir alterações em disco no servidor.' }));
        }
      } catch (err) {
        console.error('[FSO API] Erro no parsing JSON do POST:', err);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'JSON malformado ou corrompido.' }));
      }
    });
    return;
  }

  // 404 para outras rotas de API
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Endpoint de API não encontrado' }));
});

// Tratamento de erros globais para manter o serviço sempre operacional
process.on('uncaughtException', err => {
  console.error('[FSO API] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FSO API] Unhandled Rejection:', reason);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[FSO API] Servidor de persistência e sincronização ativo na porta ${PORT} (0.0.0.0)`);
});
