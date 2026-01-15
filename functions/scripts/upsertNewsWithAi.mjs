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
  if (openaiKey) {
    const prompt = `Redige um resumo curto (2-3 frases, em português de Portugal) para esta notícia, de forma neutra e informativa, sem copiar texto literal. Título: "${title}". URL: ${url}.`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: 'system', content: 'Escreves sempre em português de Portugal.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`OpenAI error: ${resp.status} ${resp.statusText} ${txt}`);
    }
    const data = await resp.json().catch(() => ({}));
    const firstChoice = data && Array.isArray(data.choices) ? data.choices[0] : undefined;
    const content = firstChoice && firstChoice.message && typeof firstChoice.message.content === 'string'
      ? firstChoice.message.content
      : '';
    summary = content.trim();
  }

  const newsRef = db.collection('news').doc();
  const nowIso = new Date().toISOString();
  await newsRef.set({
    title,
    url,
    source,
    region,
    summary,
    publishedAt: nowIso,
  }, { merge: true });

  console.log(JSON.stringify({ ok: true, id: newsRef.id, summary }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
