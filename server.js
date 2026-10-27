// ==============================================================================
// server.js • Backend API de Persistência e Sincronização em Tempo Real
// financiesuaobra.com.br (Grupo Geminadas.com & Level Construtora)
// Executado em background via Node.js nativo (Zero Dependências Externas)
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'content-data.json');

// Dados iniciais padrão de fallback
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

// Carregar dados existentes ou criar arquivo inicial
let inMemoryData = null;

function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      inMemoryData = JSON.parse(raw);
    } else {
      inMemoryData = initialDefaultData;
      fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('[API FSO] Erro ao carregar content-data.json:', err);
    inMemoryData = initialDefaultData;
  }
}

function saveDataToFile(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    inMemoryData = data;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[API FSO] Erro ao salvar content-data.json:', err);
    return false;
  }
}

// Inicializar armazenamento
loadDataFromFile();

// Servidor HTTP Nativo
const server = http.createServer((req, res) => {
  // CORS & Anti-Cache Estrito Obrigatório
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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

  // 2. GET /api/content - Obter dados em tempo real (Mobile & Desktop)
  if (urlPath === '/api/content' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(inMemoryData || initialDefaultData));
    return;
  }

  // 3. POST /api/content - Salvar dados a partir do Painel Administrativo
  if (urlPath === '/api/content' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Prevenir payload excessivo (limite de 15MB para fotos em base64)
      if (body.length > 15 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Payload muito grande' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.siteConfig && !Array.isArray(payload.projects)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Payload inválido. Esperado siteConfig e/ou projects.' }));
          return;
        }

        const updatedData = {
          siteConfig: payload.siteConfig || inMemoryData.siteConfig,
          projects: Array.isArray(payload.projects) ? payload.projects : inMemoryData.projects,
          lastUpdated: new Date().toISOString()
        };

        const success = saveDataToFile(updatedData);
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, updated: updatedData.lastUpdated }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Falha ao persistir em disco' }));
        }
      } catch (err) {
        console.error('[API FSO] Erro no parsing JSON do POST:', err);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'JSON malformado' }));
      }
    });
    return;
  }

  // 404 para outras rotas de API
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
});

// Tratamento de erros globais para evitar crash do container
process.on('uncaughtException', err => {
  console.error('[API FSO] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[API FSO] Unhandled Rejection:', reason);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[API FSO] Servidor de sincronização ativo na porta ${PORT} (127.0.0.1)`);
});
