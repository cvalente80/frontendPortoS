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

const ALLOWED_TAGS = [
  'auto',
  'vida',
  'saude',
  'habitacao',
  'empresas',
  'rc-profissional',
  'condominio',
  'multirriscos-empresarial',
  'frota',
  'acidentes-trabalho',
  'fiscalidade',
  'sinistros',
  'economia',
  'ambiente',
  'infraestruturas',
  'local',
  'nacional'
];

async function main() {
  const [,, title, url, source, regionArg] = process.argv;
  if (!title || !url || !source) {
    console.error('Usage: node upsertNewsWithAi.mjs "title" "url" "source" [region]');
    process.exit(1);
  }
  const region = (regionArg || 'nacional');

  const openaiKey = env('OPENAI_API_KEY');
  const openaiModel = env('OPENAI_MODEL', 'gpt-4o-mini');

  let summary = '';
  let tags = [];
  if (openaiKey) {
    const prompt = `Tens de responder apenas em JSON.
Campos obrigatórios:
- summary: resumo curto (3-4 frases, português de Portugal, neutro, sem copiar texto literal).
- tags: array com 2-4 etiquetas em minúsculas, escolhidas de entre esta lista: ${ALLOWED_TAGS.join(', ')}.

Notícia:
Título: "${title}"
URL: ${url}`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: 'system', content: 'Escreves sempre em português de Portugal e respondes apenas com JSON válido.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`OpenAI error: ${resp.status} ${resp.statusText} ${txt}`);
    }
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
      if (parsed && typeof parsed.summary === 'string') {
        summary = parsed.summary.trim();
      }
      if (Array.isArray(parsed.tags)) {
        tags = parsed.tags
          .map((t) => String(t).toLowerCase().trim())
          .filter((t) => ALLOWED_TAGS.includes(t));
      }
    } catch {
      // Fallback se não vier JSON válido: tentar extrair só o texto sem "json" ou fences
      summary = content
        .replace(/```[a-zA-Z]*?/g, '')
        .replace(/```/g, '')
        .replace(/^json\s*:/i, '')
        .trim();
      tags = [];
    }
  }

  const newsRef = db.collection('news').doc();
  const nowIso = new Date().toISOString();
  await newsRef.set({
    title,
    url,
    source,
    region,
    summary,
    tags,
    publishedAt: nowIso,
  }, { merge: true });

  console.log(JSON.stringify({ ok: true, id: newsRef.id, summary, tags }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
