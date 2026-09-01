const CASE_FILES = ['campaign', 'rooms', 'characters', 'scenes', 'challenges', 'grimoire', 'objectives', 'tracks'];

async function fetchJson(path, { optional = false } = {}) {
  const response = await fetch(path);
  if (!response.ok) {
    if (optional) return null;
    throw new Error(`Falha ao carregar ${path}`);
  }
  return response.json();
}

export async function loadCatalog() {
  return fetchJson('./content/catalog.json');
}

export async function loadContent({ caseId } = {}) {
  const catalog = await loadCatalog();
  const selectedId = caseId || catalog.defaultCase;
  const caseEntry = catalog.cases.find((entry) => entry.id === selectedId)
    || catalog.cases.find((entry) => entry.id === catalog.defaultCase)
    || catalog.cases[0];

  if (!caseEntry) throw new Error('Nenhum caso foi registrado em content/catalog.json');

  const basePath = caseEntry.contentPath.replace(/\/$/, '');
  const entries = await Promise.all(CASE_FILES.map(async (name) => {
    const value = await fetchJson(`${basePath}/${name}.json`, { optional: name === 'objectives' });
    return [name, value || []];
  }));

  const data = Object.fromEntries(entries);
  data.catalog = catalog;
  data.caseEntry = caseEntry;
  data.contentBasePath = basePath;
  data.roomMap = Object.fromEntries(data.rooms.map((room) => [room.id, room]));
  data.characterMap = Object.fromEntries(data.characters.map((character) => [character.id, character]));
  data.challengeMap = Object.fromEntries(data.challenges.map((challenge) => [challenge.id, challenge]));
  data.trackMap = Object.fromEntries((data.tracks || []).map((track) => [track.id, track]));
  data.campaign.id = data.campaign.id || caseEntry.id;
  data.campaign.title = data.campaign.title || caseEntry.title;
  data.campaign.subtitle = data.campaign.subtitle || caseEntry.subtitle;
  data.campaign.contentVersion = data.campaign.contentVersion || data.campaign.version || '1';
  data.activeTrack = data.trackMap[data.campaign.learningTrack] || data.tracks[0] || null;
  return data;
}
