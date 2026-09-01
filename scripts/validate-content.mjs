import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const catalog = await readJson(path.join(root, 'content/catalog.json'));
const errors = [];
const seenCaseIds = new Set();
const totals = { rooms: 0, characters: 0, scenes: 0, challenges: 0, tracks: 0, grimoire: 0 };
const contractFields = ['phenomenon', 'instrument', 'dataSource', 'inputMeaning', 'dependentAction', 'risk', 'logicalOperation', 'output', 'physicalConsequence', 'grimoireKnowledge'];

if (!catalog.cases?.length) errors.push('Catálogo: nenhum caso registrado');
if (!catalog.cases?.some((entry) => entry.id === catalog.defaultCase)) errors.push(`Catálogo: defaultCase inválido -> ${catalog.defaultCase}`);

for (const entry of catalog.cases || []) {
  if (seenCaseIds.has(entry.id)) errors.push(`Catálogo: caseId duplicado -> ${entry.id}`);
  seenCaseIds.add(entry.id);
  const caseDir = path.resolve(root, entry.contentPath.replace(/^\.\//, ''));
  const load = (name) => readJson(path.join(caseDir, `${name}.json`));
  let campaign, rooms, characters, scenes, challenges, objectives, tracks, grimoire;
  try {
    [campaign, rooms, characters, scenes, challenges, objectives, tracks, grimoire] = await Promise.all(
      ['campaign', 'rooms', 'characters', 'scenes', 'challenges', 'objectives', 'tracks', 'grimoire'].map(load)
    );
  } catch (error) {
    errors.push(`${entry.id}: falha ao carregar pacote -> ${error.message}`);
    continue;
  }

  const prefix = `[${entry.id}]`;
  if (campaign.id !== entry.id) errors.push(`${prefix} campaign.id difere do catálogo -> ${campaign.id}`);
  const roomIds = new Set(rooms.map((item) => item.id));
  const characterIds = new Set(characters.map((item) => item.id));
  const challengeIds = new Set(challenges.map((item) => item.id));
  const sceneIds = new Set(Object.keys(scenes));
  const trackMap = Object.fromEntries(tracks.map((track) => [track.id, track]));
  if (!trackMap[campaign.learningTrack]) errors.push(`${prefix} learningTrack inválida -> ${campaign.learningTrack}`);
  if (!roomIds.has(campaign.startRoom)) errors.push(`${prefix} startRoom inválida -> ${campaign.startRoom}`);
  if (!sceneIds.has(campaign.startScene)) errors.push(`${prefix} startScene inválida -> ${campaign.startScene}`);

  for (const room of rooms) {
    for (const connection of room.connections || []) if (!roomIds.has(connection.to)) errors.push(`${prefix} sala ${room.id}: conexão inválida -> ${connection.to}`);
    for (const npc of room.npcs || []) if (!characterIds.has(npc)) errors.push(`${prefix} sala ${room.id}: NPC inválido -> ${npc}`);
    if (room.firstEnterScene && !sceneIds.has(room.firstEnterScene)) errors.push(`${prefix} sala ${room.id}: firstEnterScene inválida -> ${room.firstEnterScene}`);
    for (const interaction of room.interactions || []) {
      if (interaction.scene && !sceneIds.has(interaction.scene)) errors.push(`${prefix} sala ${room.id}: cena inválida -> ${interaction.scene}`);
      if (interaction.fallbackScene && !sceneIds.has(interaction.fallbackScene)) errors.push(`${prefix} sala ${room.id}: fallback inválido -> ${interaction.fallbackScene}`);
      if (interaction.sceneSlot) for (const track of tracks) {
        const target = track.sceneSlots?.[interaction.sceneSlot] || interaction.fallbackScene;
        if (!target) errors.push(`${prefix} track ${track.id}: sceneSlot sem destino -> ${interaction.sceneSlot}`);
        else if (!sceneIds.has(target)) errors.push(`${prefix} track ${track.id}: sceneSlot ${interaction.sceneSlot} aponta para cena inválida -> ${target}`);
      }
    }
  }

  for (const character of characters) for (const topic of character.topics || []) {
    if (!sceneIds.has(topic.scene)) errors.push(`${prefix} NPC ${character.id}: cena inválida -> ${topic.scene}`);
  }

  for (const [sceneId, scene] of Object.entries(scenes)) for (const event of scene.events || []) {
    if (event.type === 'scene' && !sceneIds.has(event.scene)) errors.push(`${prefix} cena ${sceneId}: destino inválido -> ${event.scene}`);
    if (event.type === 'conditionalScene') {
      if (!sceneIds.has(event.trueScene)) errors.push(`${prefix} cena ${sceneId}: trueScene inválida -> ${event.trueScene}`);
      if (!sceneIds.has(event.falseScene)) errors.push(`${prefix} cena ${sceneId}: falseScene inválida -> ${event.falseScene}`);
    }
    if (event.type === 'choice') for (const option of event.options || []) {
      if (!option.id || !option.label) errors.push(`${prefix} cena ${sceneId}: escolha sem id/label`);
      if (option.scene && !sceneIds.has(option.scene)) errors.push(`${prefix} cena ${sceneId}: escolha ${option.id} aponta para cena inválida -> ${option.scene}`);
    }
    if (event.type === 'startChallenge' && event.challenge && !challengeIds.has(event.challenge)) errors.push(`${prefix} cena ${sceneId}: desafio inválido -> ${event.challenge}`);
    if (event.type === 'startChallenge' && event.challengeSlot) for (const track of tracks) {
      const target = track.ritualSlots?.[event.challengeSlot];
      if (!target) errors.push(`${prefix} track ${track.id}: slot não mapeado -> ${event.challengeSlot}`);
      else if (!challengeIds.has(target)) errors.push(`${prefix} track ${track.id}: slot ${event.challengeSlot} aponta para desafio inválido -> ${target}`);
    }
    if (event.type === 'discoverCharacter' && !characterIds.has(event.character)) errors.push(`${prefix} cena ${sceneId}: personagem inválido -> ${event.character}`);
  }

  for (const track of tracks) {
    for (const [slot, target] of Object.entries(track.ritualSlots || {})) if (!challengeIds.has(target)) errors.push(`${prefix} track ${track.id}: ${slot} -> ${target} inválido`);
    if (!track.supportedLanguages?.length) errors.push(`${prefix} track ${track.id}: supportedLanguages ausente`);
  }
  for (const challenge of challenges) {
    if (challenge.successScene && !sceneIds.has(challenge.successScene)) errors.push(`${prefix} desafio ${challenge.id}: successScene inválida -> ${challenge.successScene}`);
    if (campaign.ritualContractVersion && (challenge.hints || []).length !== 3) errors.push(`${prefix} desafio ${challenge.id}: deve possuir exatamente 3 dicas progressivas`);
    if (campaign.ritualContractVersion) for (const field of contractFields) {
      if (challenge.ritualContract?.[field] === undefined) errors.push(`${prefix} desafio ${challenge.id}: ritualContract.${field} ausente`);
    }
  }
  for (const objective of objectives) if (objective.targetRoom && !roomIds.has(objective.targetRoom)) errors.push(`${prefix} objetivo ${objective.id}: sala inválida -> ${objective.targetRoom}`);
  for (const entry of grimoire) if (!entry.id || !entry.title) errors.push(`${prefix} Grimório: entrada sem id/título`);

  totals.rooms += rooms.length;
  totals.characters += characters.length;
  totals.scenes += sceneIds.size;
  totals.challenges += challenges.length;
  totals.tracks += tracks.length;
  totals.grimoire += grimoire.length;
}

if (errors.length) {
  console.error(`Validação de conteúdo falhou:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Conteúdo multicase válido: ${catalog.cases.length} casos, ${totals.rooms} salas, ${totals.characters} personagens, ${totals.scenes} cenas, ${totals.challenges} rituais, ${totals.tracks} tracks, ${totals.grimoire} anotações.`);
