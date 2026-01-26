import fetch from 'node-fetch';

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

async function main() {
  const endpoint = env('SEARCH_API_ENDPOINT');
  const apiKey = env('SEARCH_API_KEY');
  const indexName = env('SEARCH_INDEX_NAME');

  if (!endpoint || !apiKey || !indexName) {
    console.error('Missing SEARCH_API_ENDPOINT, SEARCH_API_KEY or SEARCH_INDEX_NAME env vars');
    process.exit(1);
  }

  // TODO: substitui estes exemplos pelos URLs reais das agendas
  // Mantém pelo menos o campo "url" porque o upsertAgendaWithAi.mjs depende dele.
  const docs = [
    {
      '@search.action': 'upload',
      id: 'ansiao-agenda',
      region: 'ansiao',
      url: 'https://www.cm-ansiao.pt/',
      title: 'Agenda cultural - Município de Ansião',
    },
    {
      '@search.action': 'upload',
      id: 'povoa-agenda',
      region: 'povoa',
      url: 'https://www.cm-vfxira.pt/',
      title: 'Agenda cultural - Póvoa de Santa Iria',
    },
    {
      '@search.action': 'upload',
      id: 'lisboa-agenda',
      region: 'lisboa',
      url: 'https://www.agendalx.pt/',
      title: 'Agenda cultural - Lisboa',
    },
    {
      '@search.action': 'upload',
      id: 'porto-agenda',
      region: 'porto',
      url: 'https://www.porto.pt/pt/eventos',
      title: 'Agenda cultural - Porto',
    },
    {
      '@search.action': 'upload',
      id: 'sintra-agenda',
      region: 'sintra',
      url: 'https://cm-sintra.pt/',
      title: 'Agenda cultural - Sintra',
    },
  ];

  const url = `${endpoint.replace(/\/$/, '')}/indexes/${encodeURIComponent(indexName)}/docs/index?api-version=2023-11-01`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: docs }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('Indexing error:', resp.status, resp.statusText, text);
    process.exit(1);
  }

  const data = await resp.json().catch(() => ({}));
  console.log('Indexing result:', JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
