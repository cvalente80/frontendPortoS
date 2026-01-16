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
  'nacional',
];

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

async function generateTagsForDoc(openaiKey, model, doc) {
  const data = doc.data() || {};
  const title = data.title || '';
  const summary = data.summary || '';
  const region = data.region || '';

  if (!title && !summary) {
    console.warn(`Skipping doc ${doc.id} because it has no title/summary`);
    return null;
  }

  const prompt = `Tens de responder apenas em JSON.\n` +
    `Campos obrigatórios:\n` +
    `- tags: array com 2-4 etiquetas em minúsculas, escolhidas apenas de entre esta lista: ${ALLOWED_TAGS.join(', ')}.\n` +
    `Não inventes etiquetas fora desta lista.\n\n` +
    `Notícia para classificar:\n` +
    `Título: "${title}"\n` +
    `Resumo: "${summary}"\n` +
    (region ? `Região: "${region}"\n` : '');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Escreves sempre em português de Portugal e respondes apenas com JSON válido com uma propriedade "tags".',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: ${resp.status} ${resp.statusText} ${txt}`);
  }

  const dataResp = await resp.json().catch(() => ({}));
  const firstChoice = dataResp && Array.isArray(dataResp.choices) ? dataResp.choices[0] : undefined;
  let content =
    firstChoice && firstChoice.message && typeof firstChoice.message.content === 'string'
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

  let tags = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.tags)) {
      tags = parsed.tags
        .map((t) => String(t).toLowerCase().trim())
        .filter((t) => ALLOWED_TAGS.includes(t));
    }
  } catch {
    // Fallback: tentar limpar fences e prefixos e extrair algo semelhante a lista
    const cleaned = content
      .replace(/```[a-zA-Z]*?/g, '')
      .replace(/```/g, '')
      .replace(/^json\s*:/i, '')
      .trim();
    try {
      const parsedFallback = JSON.parse(cleaned);
      if (Array.isArray(parsedFallback)) {
        tags = parsedFallback
          .map((t) => String(t).toLowerCase().trim())
          .filter((t) => ALLOWED_TAGS.includes(t));
      }
    } catch {
      tags = [];
    }
  }

  if (!tags.length) {
    console.warn(`No valid tags generated for doc ${doc.id}`);
    return null;
  }

  return tags;
}

async function main() {
  const maxDocsArg = process.argv[2];
  const maxDocs = Number.isFinite(Number(maxDocsArg)) && Number(maxDocsArg) > 0 ? Number(maxDocsArg) : 20;

  const openaiKey = env('OPENAI_API_KEY');
  const openaiModel = env('OPENAI_MODEL', 'gpt-4o-mini');

  const snap = await db
    .collection('news')
    .orderBy('publishedAt', 'desc')
    .limit(maxDocs)
    .get();

  if (snap.empty) {
    console.log('No news documents found.');
    return;
  }

  let processed = 0;
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    if (Array.isArray(data.tags) && data.tags.length > 0) {
      continue;
    }

    processed += 1;
    console.log(`Processing doc ${doc.id} (${data.title || 'sem título'})...`);

    try {
      const tags = await generateTagsForDoc(openaiKey, openaiModel, doc);
      if (tags && tags.length) {
        await doc.ref.set({ tags }, { merge: true });
        updated += 1;
        console.log(`Updated doc ${doc.id} with tags: ${tags.join(', ')}`);
      }
    } catch (err) {
      console.error(`Error processing doc ${doc.id}:`, err);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checked: snap.size,
        processed,
        updated,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
