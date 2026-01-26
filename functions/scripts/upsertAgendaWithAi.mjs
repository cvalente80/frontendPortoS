import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment');
  process.exit(1);
}
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in environment');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

// Tenta descobrir automaticamente o URL da agenda para a região/mês atuais.
// Prioridade:
// 1) URL explícito passado por argumento (sourceUrlArg)
// 2) Variável de ambiente AGENDA_URL_<REGIÃO>
// 3) Pesquisa Web (ex.: Bing Search API) se SEARCH_API_KEY estiver configurada
async function discoverAgendaUrl(region, monthLabel, explicitUrl) {
  if (explicitUrl) return explicitUrl;

  const envKey = `AGENDA_URL_${String(region || '').toUpperCase()}`;
  const configured = env(envKey, '');
  if (configured) return configured;

  const searchKey = env('SEARCH_API_KEY', '');
  const searchEndpoint = env('SEARCH_API_ENDPOINT', 'https://searchserviceansiaoseguros.search.windows.net');
  const indexName = env('SEARCH_INDEX_NAME', '');
  if (!searchKey || !searchEndpoint || !indexName) return '';

  const regionNames = {
    ansiao: 'Ansião',
    povoa: 'Póvoa de Santa Iria',
    lisboa: 'Lisboa',
    porto: 'Porto',
    sintra: 'Sintra',
  };
  const humanRegion = regionNames[region] || region;

  const query = `agenda de eventos ${monthLabel} ${humanRegion} Câmara Municipal`;

  try {
    const url = `${searchEndpoint.replace(/\/$/, '')}/indexes/${encodeURIComponent(indexName)}/docs?api-version=2023-11-01&search=${encodeURIComponent(query)}&$top=1`;
    const resp = await fetch(url, {
      headers: {
        'api-key': searchKey,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      return '';
    }
    const data = await resp.json().catch(() => ({}));
    const first = data && Array.isArray(data.value)
      ? data.value[0]
      : null;
    const foundUrl = first && typeof first.url === 'string' ? first.url : '';
    return foundUrl || '';
  } catch {
    return '';
  }
}

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  return `${year}-${String(month).padStart(2, '0')}`;
}

function monthLabelPt(date) {
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  return months[date.getMonth()];
}

async function fetchSourceText(url) {
  if (!url) return '';
  try {
    const resp = await fetch(url);
    if (!resp.ok) return '';
    const text = await resp.text();
    // Limitar tamanho para não explodir o prompt
    return text.slice(0, 15000);
  } catch {
    return '';
  }
}

async function main() {
  const [, , regionArg, sourceUrlArg, monthKeyArg] = process.argv;
  if (!regionArg) {
    console.error('Usage: node upsertAgendaWithAi.mjs "region" "sourceUrl" [monthKey]');
    process.exit(1);
  }
  const region = regionArg; // ansiao|povoa|lisboa|porto
  const monthKey = monthKeyArg || getCurrentMonthKey();

  const openaiKey = env('OPENAI_API_KEY');
  const openaiModel = env('OPENAI_MODEL', 'gpt-4o-mini');

  const now = new Date();
  const monthLabel = `${monthLabelPt(now)} de ${now.getFullYear()}`;

  // Determinar o URL efetivo a usar: argumento → env → pesquisa
  const sourceUrl = await discoverAgendaUrl(region, monthLabel, sourceUrlArg || '');

  let title = '';
  let intro = '';
  let events = [];

  if (openaiKey) {
    const srcText = await fetchSourceText(sourceUrl);
    const prompt = `Tens de responder apenas em JSON.\n\n` +
      `Quero que extraias uma agenda mensal de eventos para o concelho correspondente, a partir do texto/HTML fornecido.\n` +
      `A resposta deve ter o seguinte formato:\n` +
      `{"title": string, "intro": string, "events": [{"dateLabel": string, "title": string, "description": string, "sourceLabel": string}]}.\n` +
      `- "title": título geral da agenda (por exemplo: \"Eventos previstos em ${monthLabel}\").\n` +
      `- "intro": 1-2 frases de contexto em português de Portugal.\n` +
      `- "events": lista de eventos para o mês em causa.\n` +
      `  - "dateLabel": intervalo ou dia (ex.: \"16–17 Jan\", \"24 Jan\").\n` +
      `  - "title": nome do evento (ex.: \"Terra de Gigantes\").\n` +
      `  - "description": breve descrição (atividade, público-alvo, etc.).\n` +
      `  - "sourceLabel": origem/fonte (ex.: \"cm-ansiao.pt\").\n` +
      `Se não conseguires extrair eventos válidos, devolve "events": [].\n\n` +
      `Região (apenas para contexto): ${region}.\n` +
      `Mês de referência: ${monthLabel} (chave ${monthKey}).\n` +
      (sourceUrl ? `URL principal: ${sourceUrl}.\n` : '') +
      (srcText ? `Texto/HTML resumido:\n${srcText}` : 'Texto/HTML não disponível; se não tiveres dados, devolve apenas uma intro genérica e events vazio.');

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            {
              role: 'system',
              content:
                'Escreves sempre em português de Portugal e respondes apenas com JSON válido com propriedades "title", "intro" e "events".',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        console.error(`OpenAI error: ${resp.status} ${resp.statusText} ${txt}`);
      } else {
        const data = await resp.json().catch(() => ({}));
        const firstChoice = data && Array.isArray(data.choices) ? data.choices[0] : undefined;
        let content = firstChoice && firstChoice.message && typeof firstChoice.message.content === 'string'
          ? firstChoice.message.content
          : '';

        // Remover ```json ... ``` se o modelo devolver bloco de código
        const fenceMatch = content.match(/```[a-zA-Z]*[\s\S]*?```/);
        if (fenceMatch) {
          content = fenceMatch[0]
            .replace(/^```[a-zA-Z]*\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
        }

        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed.title === 'string') {
            title = parsed.title.trim();
          }
          if (parsed && typeof parsed.intro === 'string') {
            intro = parsed.intro.trim();
          }
          if (Array.isArray(parsed.events)) {
            events = parsed.events.map((e) => ({
              dateLabel: String(e.dateLabel || '').trim(),
              title: String(e.title || '').trim(),
              description: e.description ? String(e.description).trim() : '',
              sourceLabel: e.sourceLabel ? String(e.sourceLabel).trim() : '',
            })).filter((e) => e.dateLabel && e.title);
          }
        } catch {
          // Fallback: agenda vazia com intro genérica
          title = title || `Eventos previstos em ${monthLabel}`;
          intro = intro || `Agenda mensal de eventos em ${monthLabel}.`;
          events = [];
        }
      }
    } catch (err) {
      console.error('Erro ao chamar OpenAI:', err);
      // Mantém title/intro/events vazios para usar o fallback mais abaixo
    }
  }

  const docId = `${region}_${monthKey}`;
  const nowIso = new Date().toISOString();
  await db.collection('agenda').doc(docId).set({
    region,
    monthKey,
    title: title || `Eventos previstos em ${monthLabel}`,
    intro: intro || '',
    events: events || [],
    generatedAt: nowIso,
    sourceUrl: sourceUrl || null,
  }, { merge: true });

  console.log(JSON.stringify({ ok: true, id: docId, region, monthKey, totalEvents: events?.length || 0 }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
