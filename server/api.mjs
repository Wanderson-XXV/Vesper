import crypto from 'node:crypto';
import argon2 from 'argon2';
import { createDatabase } from './db.mjs';
import { ContentRepository } from './content-repository.mjs';
import { inputMatchesGenerator, validateSubmission } from './oracle.mjs';

const SESSION_COOKIE = 'vesper_session';
const SESSION_SECONDS = 60 * 60 * 24 * 14;
const RUN_ENVELOPE_VERSION = 1;
const SNAPSHOT_VERSION = 1;

const unavailableDatabaseCodes = new Set([
  '08000', '08001', '08003', '08004', '08006', '57P01', '57P02', '57P03',
  '53300', '53400', 'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'
]);

const json = (res, status, value, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(value));
};

function apiRequestId(req) {
  const requested = String(req.headers['x-vesper-request-id'] || '');
  return /^[a-zA-Z0-9._:-]{1,100}$/.test(requested) ? requested : crypto.randomUUID();
}

const parseCookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
  const index = part.indexOf('=');
  return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
}));

const readBody = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw Object.assign(new Error('Payload excede 1 MB'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('JSON inválido'), { status: 400 }); }
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const SYNC_EVENT_TYPES = new Set(['story_choice', 'clue_found', 'ritual_attempt', 'hint_used']);

function requestProtocol(req) {
  const forwarded = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return forwarded || (req.socket?.encrypted ? 'https' : 'http');
}
function requestIsLocal(req) {
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

function shouldUseSecureCookie(req) {
  if (requestProtocol(req) === 'https') return true;
  if (String(process.env.COOKIE_SECURE || '').trim().toLowerCase() === 'true') return true;
  if (String(process.env.COOKIE_SECURE || '').trim().toLowerCase() === 'false' && requestIsLocal(req)) return false;
  return !requestIsLocal(req);
}

const sessionCookie = (req, token = '', maxAge = SESSION_SECONDS) => `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${shouldUseSecureCookie(req) ? '; Secure' : ''}`;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const stableJson = (value) => Array.isArray(value)
  ? `[${value.map(stableJson).join(',')}]`
  : isPlainObject(value)
    ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const fail = (message, status = 400, extra = {}) => { throw Object.assign(new Error(message), { status, ...extra }); };
const contentVersionOf = (content) => String(content.campaign.contentVersion || content.campaign.version || '1');
const usernamePattern = /^[a-z0-9._-]{3,32}$/;

function normalizedUsername(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!usernamePattern.test(username)) fail('Usuário deve ter 3–32 caracteres simples');
  return username;
}

function validateRevision(value) {
  const revision = Number(value);
  if (!Number.isSafeInteger(revision) || revision < 0) fail('Revisão inválida');
  return revision;
}

function validateCursor(cursor) {
  if (!isPlainObject(cursor)) fail('Cursor narrativo inválido');
  if (!['explore', 'scene', 'choice', 'challenge', 'ending'].includes(cursor.mode)) fail('Modo do cursor inválido');
  if (cursor.sceneId !== null && cursor.sceneId !== undefined && typeof cursor.sceneId !== 'string') fail('Cena do cursor inválida');
  if (!Number.isSafeInteger(Number(cursor.nextEventIndex)) || Number(cursor.nextEventIndex) < 0) fail('Índice do cursor inválido');
  if (cursor.sceneStack !== undefined && !Array.isArray(cursor.sceneStack)) fail('Pilha de cenas inválida');
  if (cursor.pendingChallenge !== undefined && cursor.pendingChallenge !== null && !isPlainObject(cursor.pendingChallenge)) fail('Desafio pendente inválido');
}

function normalizeSnapshot(snapshot, context, { fallback = {} } = {}) {
  if (snapshot === undefined || snapshot === null) snapshot = fallback;
  if (!isPlainObject(snapshot)) fail('Snapshot inválido');
  const value = { ...snapshot };
  const versioned = value.snapshotVersion !== undefined;
  if (versioned && Number(value.snapshotVersion) !== SNAPSHOT_VERSION) fail('Versão de snapshot não suportada');
  if (versioned) {
    const required = ['caseId', 'routeId', 'languageId', 'contentVersion', 'currentRoom', 'flags', 'knownCharacters', 'visitedRooms', 'completedInteractions', 'completedChallenges', 'clues', 'inventory', 'challengeAttempts', 'challengeSeeds', 'hintUsage', 'relationships', 'presence', 'player', 'endingId', 'caseCompleted', 'startedAt', 'updatedAt', 'cursor'];
    if (required.some((field) => value[field] === undefined)) fail('Snapshot versionado incompleto');
  }

  const expected = {
    caseId: context.caseId,
    routeId: context.routeId,
    languageId: context.languageId,
    contentVersion: context.contentVersion
  };
  const providedRoute = value.routeId ?? value.learningTrack;
  const providedLanguage = value.languageId ?? value.language;
  for (const [key, provided] of Object.entries({
    caseId: value.caseId,
    routeId: providedRoute,
    languageId: providedLanguage,
    contentVersion: value.contentVersion
  })) {
    if (provided !== undefined && String(provided) !== String(expected[key])) fail(`Snapshot incompatível: ${key}`);
  }
  if (value.runId !== undefined && value.runId !== null && String(value.runId) !== String(context.runId || '')) fail('Snapshot incompatível: runId');

  const arrayFields = ['knownCharacters', 'visitedRooms', 'completedInteractions', 'completedChallenges', 'clues', 'inventory', 'storyEvents'];
  for (const field of arrayFields) if (value[field] !== undefined && !Array.isArray(value[field])) fail(`Snapshot inválido: ${field}`);
  const objectFields = ['flags', 'challengeAttempts', 'challengeSeeds', 'hintUsage', 'relationships', 'player'];
  for (const field of objectFields) if (value[field] !== undefined && !isPlainObject(value[field])) fail(`Snapshot inválido: ${field}`);
  if (value.currentRoom !== undefined && typeof value.currentRoom !== 'string') fail('Snapshot inválido: currentRoom');
  if (value.presence !== undefined && (!Number.isFinite(Number(value.presence)) || Number(value.presence) < 0 || Number(value.presence) > 100)) fail('Snapshot inválido: presence');
  if (value.player && value.player.name !== undefined && typeof value.player.name !== 'string') fail('Snapshot inválido: player.name');

  if (value.cursor !== undefined) validateCursor(value.cursor);
  const cursor = value.cursor || {
    mode: 'explore',
    sceneId: null,
    nextEventIndex: 0,
    sceneStack: [],
    pendingChallenge: null
  };
  return {
    ...value,
    snapshotVersion: SNAPSHOT_VERSION,
    caseId: expected.caseId,
    routeId: expected.routeId,
    learningTrack: expected.routeId,
    languageId: expected.languageId,
    language: expected.languageId,
    contentVersion: expected.contentVersion,
    runId: context.runId ?? value.runId ?? null,
    currentRoom: value.currentRoom || context.startRoom,
    flags: value.flags || {},
    knownCharacters: Array.isArray(value.knownCharacters) ? value.knownCharacters : [],
    visitedRooms: Array.isArray(value.visitedRooms) ? value.visitedRooms : [],
    completedInteractions: Array.isArray(value.completedInteractions) ? value.completedInteractions : [],
    completedChallenges: Array.isArray(value.completedChallenges) ? value.completedChallenges : [],
    clues: Array.isArray(value.clues) ? value.clues : [],
    inventory: Array.isArray(value.inventory) ? value.inventory : [],
    challengeAttempts: value.challengeAttempts || {},
    hintUsage: value.hintUsage || {},
    relationships: value.relationships || {},
    player: value.player || { name: '' },
    presence: Number(value.presence || 0),
    // Generic sync never has authority to conclude a run. The completion
    // endpoint writes these fields after validating the ending and revision.
    endingId: null,
    caseCompleted: false,
    cursor,
    startedAt: value.startedAt || Date.now(),
    updatedAt: Date.now(),
    // Client reward fields are deliberately non-authoritative. The ledger/profile tables decide rewards.
    rewardsEarned: { xp: 0, fieldMarks: 0 },
    rewardLedger: []
  };
}

function eventIdentity(event) {
  switch (event.type) {
    case 'story_choice': return `story_choice:${String(event.choiceId || '')}`;
    case 'clue_found': return `clue_found:${String(event.clueId || '')}`;
    case 'ritual_attempt': return `ritual_attempt:${String(event.challengeId || '')}:${Number(event.attempt)}`;
    case 'hint_used': return `hint_used:${String(event.challengeId || '')}:${Number(event.level)}`;
    default: return '';
  }
}

function comparableEvent(event) {
  const copy = { ...event };
  delete copy.eventId;
  delete copy.eventKey;
  delete copy.at;
  return stableJson(copy);
}

function sceneEvent(content, sceneId, eventIndex) {
  if (typeof sceneId !== 'string' || !Number.isSafeInteger(Number(eventIndex))) return null;
  return content.scenes[sceneId]?.events?.[Number(eventIndex)] || null;
}

async function validateClientEventV1(client, run, content, event, snapshot) {
  if (!SYNC_EVENT_TYPES.has(event.type)) fail('Tipo de evento não permitido');
  if (!Number.isSafeInteger(Number(event.sequence)) || Number(event.sequence) < 1) fail('Ordem de evento inválida');
  const identity = eventIdentity(event);
  if (!identity || (event.eventKey !== undefined && event.eventKey !== identity)) fail('Identidade de evento inválida');

  if (event.type === 'story_choice') {
    const declared = sceneEvent(content, event.sceneId, event.eventIndex);
    if (declared?.type !== 'choice' || declared.id !== event.choiceId) fail('Escolha incompatível com a cena');
    if (!declared.options?.some((option) => option.id === event.optionId)) fail('Opção de escolha inválida');
    const cursor = run.snapshot?.cursor || {};
    if (cursor.mode !== 'choice' || cursor.sceneId !== event.sceneId || Number(cursor.nextEventIndex) !== Number(event.eventIndex)) {
      fail('Escolha fora de ordem', 409);
    }
    return;
  }

  if (event.type === 'clue_found') {
    const clue = content.clueMap[event.clueId];
    if (!clue || !snapshot.clues?.some((item) => item?.id === clue.id)) fail('Evidência forjada ou incompatível');
    const declared = sceneEvent(content, event.sceneId, event.eventIndex);
    if (declared?.type === 'addClue' && declared.clue?.id === clue.id) return;
    const challenge = content.challengeMap[event.challengeId];
    if (!challenge || challenge.clueOnSuccess?.id !== clue.id) fail('Origem da evidência inválida');
    const completed = await client.query('SELECT 1 FROM ritual_attempts WHERE run_id=$1 AND challenge_id=$2 AND correct=true LIMIT 1', [run.id, challenge.id]);
    if (!completed.rowCount) fail('Ritual da evidência ainda não confirmado', 409);
    return;
  }

  const challenge = content.challengeMap[event.challengeId];
  if (!challenge) fail('Ritual de evento inexistente');
  if (event.type === 'ritual_attempt') {
    if (!Number.isSafeInteger(Number(event.attempt)) || Number(event.attempt) < 1) fail('Tentativa de ritual inválida');
    const attempt = await client.query('SELECT correct,hint_level FROM ritual_attempts WHERE run_id=$1 AND challenge_id=$2 AND attempt_no=$3', [run.id, challenge.id, Number(event.attempt)]);
    if (!attempt.rowCount || Boolean(attempt.rows[0].correct) !== Boolean(event.correct)) fail('Tentativa de ritual não confirmada');
  } else if (!Number.isSafeInteger(Number(event.level)) || Number(event.level) < 1) {
    fail('Nível de dica inválido');
  }
}

function endingIdOf(event) { return event?.endingId || 'completed'; }

function endingsReachableFromScene(content, sceneId, visited = new Set()) {
  if (!sceneId || visited.has(sceneId)) return new Set();
  visited.add(sceneId);
  const endings = new Set();
  for (const event of content.scenes[sceneId]?.events || []) {
    if (event.type === 'endCase') endings.add(endingIdOf(event));
    if (event.type === 'scene') for (const id of endingsReachableFromScene(content, event.scene, visited)) endings.add(id);
    if (event.type === 'conditionalScene') {
      for (const branch of [event.trueScene, event.falseScene]) {
        for (const id of endingsReachableFromScene(content, branch, new Set(visited))) endings.add(id);
      }
    }
  }
  return endings;
}

async function validateAuthoritativeEnding(client, run, content, snapshot, requestedEndingId) {
  const cursor = snapshot.cursor || {};
  const declared = sceneEvent(content, cursor.sceneId, cursor.nextEventIndex);
  if (cursor.mode !== 'ending' || declared?.type !== 'endCase' || endingIdOf(declared) !== requestedEndingId) {
    fail('Final incompatível com o cursor narrativo');
  }

  const gatingChoices = Object.values(content.choiceMap).filter((choice) =>
    choice.options?.some((option) => option.scene && endingsReachableFromScene(content, option.scene).size)
  );
  if (!gatingChoices.length) return;
  const savedChoices = await client.query("SELECT payload FROM story_events WHERE run_id=$1 AND event_type='story_choice' ORDER BY occurred_at,id", [run.id]);
  const selected = new Map(savedChoices.rows.map(({ payload }) => [payload.choiceId, payload.optionId]));
  const allowed = new Set();
  for (const choice of gatingChoices) {
    const option = choice.options.find((item) => item.id === selected.get(choice.id));
    if (option?.scene) for (const endingId of endingsReachableFromScene(content, option.scene)) allowed.add(endingId);
  }
  if (!allowed.has(requestedEndingId)) fail('Final não autorizado pelas escolhas registradas', 409);
}

function runEnvelope(row) {
  if (!row) return null;
  return {
    ...row,
    runId: row.id,
    envelopeVersion: Number(row.envelope_version || RUN_ENVELOPE_VERSION),
    runEnvelopeVersion: Number(row.envelope_version || RUN_ENVELOPE_VERSION),
    version: Number(row.envelope_version || RUN_ENVELOPE_VERSION),
    caseId: row.case_id,
    routeId: row.route_id,
    languageId: row.language_id,
    contentVersion: row.content_version,
    attemptNumber: Number(row.attempt_number),
    revision: Number(row.revision)
  };
}

function isDatabaseUnavailable(error) {
  return unavailableDatabaseCodes.has(error?.code) || /connect|connection|timeout|terminat|not available/i.test(String(error?.message || ''));
}

async function createSession(client, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await client.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+$3::interval)', [hashToken(token), userId, `${SESSION_SECONDS} seconds`]);
  return token;
}

async function grantReward(client, userId, sourceKey, { xp = 0, fieldMarks = 0 } = {}) {
  const inserted = await client.query(
    'INSERT INTO reward_transactions(user_id,source_key,xp,field_marks) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id',
    [userId, sourceKey, xp, fieldMarks]
  );
  if (!inserted.rowCount) return false;
  await client.query(
    'UPDATE investigator_profiles SET xp=xp+$2, field_marks=field_marks+$3, level=GREATEST(1,FLOOR((xp+$2)/250.0)::int+1), updated_at=now() WHERE user_id=$1',
    [userId, xp, fieldMarks]
  );
  return true;
}

async function activeRun(client, userId, caseId, routeId) {
  const result = await client.query(
    "SELECT * FROM case_runs WHERE user_id=$1 AND case_id=$2 AND route_id=$3 AND status='active' ORDER BY attempt_number DESC LIMIT 1",
    [userId, caseId, routeId]
  );
  return result.rows[0] || null;
}

async function lockRunSelection(client, userId, caseId, routeId) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`${userId}:${caseId}:${routeId}`]);
}

function validateRunSelectionV1(content, body) {
  const route = content.trackMap[body.routeId];
  if (!route) fail('Rota inválida');
  const languages = route.supportedLanguages || content.campaign.supportedLanguages || [];
  if (!languages.includes(body.languageId)) fail('Linguagem não suportada pela rota');
}

function runContextV1(content, body, runId = null) {
  return {
    runId,
    caseId: content.campaign.id,
    routeId: String(body.routeId),
    languageId: String(body.languageId),
    contentVersion: contentVersionOf(content),
    startRoom: content.campaign.startRoom
  };
}

async function createRunV1(client, userId, content, body) {
  validateRunSelectionV1(content, body);
  const initialSnapshot = normalizeSnapshot(body.newSnapshot ?? body.initialSnapshot ?? body.snapshot, runContextV1(content, body), {});
  const next = await client.query(
    'SELECT COALESCE(MAX(attempt_number),0)+1 AS attempt FROM case_runs WHERE user_id=$1 AND case_id=$2 AND route_id=$3',
    [userId, content.campaign.id, body.routeId]
  );
  const result = await client.query(
    `INSERT INTO case_runs(user_id,case_id,content_version,route_id,language_id,snapshot,attempt_number,envelope_version)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [userId, content.campaign.id, contentVersionOf(content), body.routeId, body.languageId, initialSnapshot, next.rows[0].attempt, RUN_ENVELOPE_VERSION]
  );
  return result.rows[0];
}

async function requireRunV1(client, userId, content, body, { statuses = ['active'] } = {}) {
  validateRunSelectionV1(content, body);
  const result = body.runId
    ? await client.query('SELECT * FROM case_runs WHERE id=$1 AND user_id=$2 AND status=ANY($3::text[])', [body.runId, userId, statuses])
    : { rows: [await activeRun(client, userId, content.campaign.id, body.routeId)].filter(Boolean) };
  if (!result.rows[0]) fail('Execução ativa não encontrada', 404);
  const run = result.rows[0];
  const expected = { runId: run.id, caseId: run.case_id, routeId: run.route_id, languageId: run.language_id, contentVersion: run.content_version };
  for (const key of ['runId', 'caseId', 'routeId', 'languageId']) {
    const value = key === 'runId' ? body.runId : body[key];
    if (value === undefined || value === null || String(value) !== String(expected[key])) fail(`Execução incompatível: ${key}`);
  }
  if (body.contentVersion !== undefined && String(body.contentVersion) !== String(expected.contentVersion)) fail('Execução incompatível: contentVersion');
  if (body.revision !== undefined) validateRevision(body.revision);
  return migrateRunSnapshotV1(client, run, content);
}

async function appendEventsV1(client, userId, run, content, events = []) {
  if (!Array.isArray(events)) fail('Eventos inválidos');
  if (events.length > 500) fail('Número de eventos excede o limite');
  const persisted = await client.query('SELECT client_event_id,event_type,payload FROM story_events WHERE run_id=$1 ORDER BY id', [run.id]);
  const existingByKey = new Map(persisted.rows.map((row) => [row.client_event_id, row]));
  let nextSequence = Math.max(
    persisted.rows.length,
    persisted.rows.reduce((highest, row) => Math.max(highest, Number(row.payload?.sequence) || 0), 0)
  ) + 1;
  let lastPresentedSequence = 0;
  for (const event of events) {
    if (!isPlainObject(event)) fail('Evento inválido');
    const presentedSequence = Number(event.sequence);
    if (!Number.isSafeInteger(presentedSequence) || presentedSequence < 1 || (lastPresentedSequence && presentedSequence <= lastPresentedSequence)) fail('Ordem de evento inválida');
    lastPresentedSequence = presentedSequence;
    const eventType = String(event.type || '');
    const clientEventId = eventIdentity({ ...event, type: eventType });
    const legacyId = typeof event.eventId === 'string' ? event.eventId.trim() : '';
    const existing = existingByKey.get(clientEventId) || (legacyId ? existingByKey.get(legacyId) : null);
    if (existing) {
      if (existing.event_type !== eventType || comparableEvent(existing.payload) !== comparableEvent(event)) fail('Evento idempotente diverge do evento já salvo', 409);
      continue;
    }
    if (Number(event.sequence) !== nextSequence) fail('Evento fora de ordem', 409);
    await validateClientEventV1(client, run, content, { ...event, type: eventType }, run.pendingSnapshot || run.snapshot || {});
    const occurredAt = Number(event.at);
    const inserted = await client.query(
      'INSERT INTO story_events(run_id,client_event_id,event_type,payload,occurred_at) VALUES($1,$2,$3,$4,to_timestamp($5/1000.0)) ON CONFLICT (run_id,client_event_id) DO NOTHING RETURNING id',
      [run.id, clientEventId, eventType, event, Number.isFinite(occurredAt) ? occurredAt : Date.now()]
    );
    if (!inserted.rowCount) fail('Evento concorrente já registrado', 409);
    existingByKey.set(clientEventId, { event_type: eventType, payload: event });
    nextSequence += 1;
    // Only a choice proven to be the pending scene event may affect the
    // persistent relationship. Clues remain audit data; generic sync never
    // grants their rewards.
    if (eventType === 'story_choice') {
      const choice = content.choiceMap[event.choiceId];
      const option = choice?.options?.find((item) => item.id === event.optionId);
      if (option?.relation?.character) {
        await client.query(
          `UPDATE investigator_profiles SET relationships=jsonb_set(
            relationships, ARRAY[$2], to_jsonb(COALESCE((relationships->>$2)::int,0)+$3), true
          ),updated_at=now() WHERE user_id=$1`,
          [userId, option.relation.character, Number(option.relation.amount || 0)]
        );
      }
    }
  }
}

async function migrateRunSnapshotV1(client, run, content) {
  if (Number(run.snapshot?.snapshotVersion) === SNAPSHOT_VERSION) return run;
  const snapshot = normalizeSnapshot(run.snapshot, {
    caseId: run.case_id,
    routeId: run.route_id,
    languageId: run.language_id,
    contentVersion: run.content_version,
    runId: run.id,
    startRoom: content.campaign.startRoom
  });
  const updated = await client.query('UPDATE case_runs SET snapshot=$2,envelope_version=$3,updated_at=now() WHERE id=$1 RETURNING *', [run.id, snapshot, RUN_ENVELOPE_VERSION]);
  return updated.rows[0] || { ...run, snapshot, envelope_version: RUN_ENVELOPE_VERSION };
}

function csvCell(value) {
  const printable = value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  return `"${printable.replace(/"/g, '""')}"`;
}

export function createApi(root) {
  const db = createDatabase();
  const repository = new ContentRepository(root);

  async function currentUser(req) {
    if (!db) return null;
    const token = parseCookies(req)[SESSION_COOKIE];
    if (!token) return null;
    const result = await db.query(
      `SELECT u.id,u.username,u.role,u.must_change_password FROM sessions s JOIN users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at>now()`,
      [hashToken(token)]
    );
    return result.rows[0] || null;
  }

  async function requireUser(req) {
    const user = await currentUser(req);
    if (!user) throw Object.assign(new Error('Autenticação necessária'), { status: 401 });
    return user;
  }

  async function requireReadyUser(req) {
    const user = await requireUser(req);
    if (user.must_change_password) throw Object.assign(new Error('Troca de senha obrigatória'), { status: 403, code: 'PASSWORD_CHANGE_REQUIRED' });
    return user;
  }

  return async function handleApi(req, res) {
    const url = new URL(req.url, 'http://vesper.local');
    const requestId = apiRequestId(req);
    const startedAt = Date.now();
    let failure = null;
    res.setHeader('X-Vesper-Request-Id', requestId);
    res.once('finish', () => {
      if (res.statusCode < 400) return;
      const event = {
        event: 'api_error',
        requestId,
        method: req.method,
        path: url.pathname,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        ...(failure ? { error: failure } : {})
      };
      const line = `[Vesper] ${JSON.stringify(event)}`;
      if (res.statusCode >= 500) console.error(line);
      else console.warn(line);
    });
    try {
      if (url.pathname === '/api/health') {
        if (!db) return json(res, 503, { ok: false, mode: 'unavailable', database: false });
        await db.query('SELECT 1');
        return json(res, 200, { ok: true, mode: 'online', database: true });
      }
      if (url.pathname === '/api/catalog' && req.method === 'GET') return json(res, 200, await repository.catalog());
      if (!db) return json(res, 503, { error: 'API online desativada: configure DATABASE_URL.' });

      if (url.pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await readBody(req);
        const username = normalizedUsername(body.username);
        const password = String(body.password || '');
        if (password.length < 8) fail('Senha deve ter ao menos 8 caracteres');
        if (typeof body.confirmPassword !== 'string' || body.confirmPassword !== password) fail('Confirmação de senha não confere');
        const teamCode = String(body.teamCode || '').trim();
        if (!teamCode) fail('Código de turma obrigatório');
        const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
        const result = await db.transaction(null, async (client) => {
          const team = await client.query('SELECT id FROM teams WHERE upper(code)=upper($1)', [teamCode]);
          if (!team.rowCount) fail('Equipe não encontrada', 404);
          const created = await client.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,'student') RETURNING id,username,role,must_change_password", [username, passwordHash]);
          const user = created.rows[0];
          await client.query("SELECT set_config('app.user_id', $1, true)", [user.id]);
          await client.query('INSERT INTO investigator_profiles(user_id,display_name,preferred_language) VALUES($1,$2,$3)', [user.id, username, body.preferredLanguage || 'java']);
          await client.query("INSERT INTO team_members(team_id,user_id,member_role) VALUES($1,$2,'student')", [team.rows[0].id, user.id]);
          const token = await createSession(client, user.id);
          return { user, token };
        });
        return json(res, 201, { user: result.user }, { 'Set-Cookie': sessionCookie(req, result.token) });
      }

      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await readBody(req);
        const username = normalizedUsername(body.username);
        const found = await db.query('SELECT id,username,role,must_change_password,password_hash FROM users WHERE username=$1', [username]);
        if (!found.rowCount || !(await argon2.verify(found.rows[0].password_hash, String(body.password || '')))) fail('Usuário ou senha inválidos', 401);
        const token = await db.transaction(null, (client) => createSession(client, found.rows[0].id));
        const { password_hash: _passwordHash, ...user } = found.rows[0];
        return json(res, 200, { user }, { 'Set-Cookie': sessionCookie(req, token) });
      }

      if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
        const token = parseCookies(req)[SESSION_COOKIE];
        if (token) await db.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
        return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
      }

      if (url.pathname === '/api/auth/change-password' && req.method === 'POST') {
        const user = await requireUser(req);
        const body = await readBody(req);
        const newPassword = String(body.newPassword ?? body.password ?? '');
        const confirmation = body.confirmPassword ?? body.passwordConfirmation ?? body.newPasswordConfirmation;
        if (newPassword.length < 8) fail('Senha deve ter ao menos 8 caracteres');
        if (typeof confirmation !== 'string' || confirmation !== newPassword) fail('Confirmação de senha não confere');
        const token = parseCookies(req)[SESSION_COOKIE];
        await db.transaction(user.id, async (client) => {
          const current = await client.query('SELECT password_hash,must_change_password FROM users WHERE id=$1 FOR UPDATE', [user.id]);
          if (!current.rowCount) fail('Usuário não encontrado', 401);
          const currentPassword = body.currentPassword === undefined ? '' : String(body.currentPassword);
          if (!current.rows[0].must_change_password && (!currentPassword || !(await argon2.verify(current.rows[0].password_hash, currentPassword)))) fail('Senha atual inválida', 403);
          if (currentPassword && !(await argon2.verify(current.rows[0].password_hash, currentPassword))) fail('Senha atual inválida', 403);
          const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
          await client.query('UPDATE users SET password_hash=$2,must_change_password=false WHERE id=$1', [user.id, passwordHash]);
          await client.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2', [user.id, hashToken(token)]);
        });
        return json(res, 200, { ok: true });
      }

      if ((url.pathname === '/api/account/username' && req.method === 'POST')
        || (url.pathname === '/api/me/username' && req.method === 'PATCH')
        || (url.pathname === '/api/account' && req.method === 'PATCH')
        || (url.pathname === '/api/me' && req.method === 'PATCH')
        || (url.pathname === '/api/auth/change-username' && req.method === 'POST')) {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const username = normalizedUsername(body.username);
        const currentPassword = String(body.currentPassword ?? body.password ?? '');
        if (!currentPassword) fail('Senha atual obrigatória');
        if (body.confirmCurrentPassword !== undefined && String(body.confirmCurrentPassword) !== currentPassword) fail('Confirmação da senha atual não confere');
        const updated = await db.transaction(user.id, async (client) => {
          const current = await client.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE', [user.id]);
          if (!current.rowCount || !(await argon2.verify(current.rows[0].password_hash, currentPassword))) fail('Senha atual inválida', 403);
          const result = await client.query('UPDATE users SET username=$2 WHERE id=$1 RETURNING id,username,role,must_change_password', [user.id, username]);
          await client.query('UPDATE investigator_profiles SET display_name=$2,updated_at=now() WHERE user_id=$1', [user.id, username]);
          return result.rows[0];
        });
        return json(res, 200, { user: updated });
      }

      if (url.pathname === '/api/me' && req.method === 'GET') {
        const user = await currentUser(req);
        if (!user) return json(res, 200, { authenticated: false });
        const profile = await db.transaction(user.id, (client) => client.query('SELECT * FROM investigator_profiles WHERE user_id=$1', [user.id]));
        const teams = await db.query('SELECT t.id,t.name,t.code,tm.member_role FROM teams t JOIN team_members tm ON tm.team_id=t.id WHERE tm.user_id=$1 ORDER BY t.name', [user.id]);
        return json(res, 200, { authenticated: true, user, profile: profile.rows[0], teams: teams.rows });
      }

      if (url.pathname === '/api/teams' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        if (!['mentor', 'admin'].includes(user.role)) throw Object.assign(new Error('Apenas mentores criam equipes'), { status: 403 });
        const body = await readBody(req);
        const name = String(body.name || '').trim();
        if (name.length < 2) throw Object.assign(new Error('Nome de equipe inválido'), { status: 400 });
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const team = await db.transaction(user.id, async (client) => {
          const created = await client.query('INSERT INTO teams(name,code,created_by) VALUES($1,$2,$3) RETURNING *', [name, code, user.id]);
          await client.query("INSERT INTO team_members(team_id,user_id,member_role) VALUES($1,$2,'mentor')", [created.rows[0].id, user.id]);
          return created.rows[0];
        });
        return json(res, 201, { team });
      }

      if (url.pathname === '/api/runs/current' && req.method === 'GET') {
        const user = await requireReadyUser(req);
        const caseId = String(url.searchParams.get('caseId') || '');
        const routeId = String(url.searchParams.get('routeId') || '');
        const content = await repository.case(caseId);
        if (!content) fail('Caso inexistente', 404);
        if (!content.trackMap[routeId]) fail('Rota inválida');
        const run = await db.transaction(user.id, async (client) => {
          const current = await activeRun(client, user.id, caseId, routeId);
          return current ? migrateRunSnapshotV1(client, current, content) : null;
        });
        return json(res, 200, { run: runEnvelope(run) });
      }

      if (url.pathname === '/api/runs/start' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) fail('Caso inexistente', 404);
        validateRunSelectionV1(content, body);
        if (body.contentVersion !== undefined && String(body.contentVersion) !== contentVersionOf(content)) fail('Versão de conteúdo incompatível');
        if (body.snapshot !== undefined) normalizeSnapshot(body.snapshot, runContextV1(content, body), {});
        const result = await db.transaction(user.id, async (client) => {
          await lockRunSelection(client, user.id, body.caseId, body.routeId);
          const current = await activeRun(client, user.id, body.caseId, body.routeId);
          if (current) return { run: await migrateRunSnapshotV1(client, current, content), created: false };
          return { run: await createRunV1(client, user.id, content, body), created: true };
        });
        return json(res, result.created ? 201 : 200, { run: runEnvelope(result.run) });
      }

      if (url.pathname === '/api/runs/restart' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) fail('Caso inexistente', 404);
        const result = await db.transaction(user.id, async (client) => {
          await lockRunSelection(client, user.id, body.caseId, body.routeId);
          const current = await requireRunV1(client, user.id, content, body);
          const expectedRevision = Number(current.revision);
          if (body.revision !== undefined && validateRevision(body.revision) !== expectedRevision) {
            const latest = await client.query('SELECT * FROM case_runs WHERE id=$1', [current.id]);
            fail('Save atualizado em outro dispositivo', 409, { current: runEnvelope(latest.rows[0]) });
          }
          const hasCheckpoint = body.finalSnapshot !== undefined || body.snapshot !== undefined || (body.events && body.events.length);
          const finalSnapshot = hasCheckpoint
            ? normalizeSnapshot(body.finalSnapshot ?? body.snapshot, { ...runContextV1(content, body, current.id), contentVersion: current.content_version })
            : normalizeSnapshot(current.snapshot, { caseId: current.case_id, routeId: current.route_id, languageId: current.language_id, contentVersion: current.content_version, runId: current.id, startRoom: content.campaign.startRoom });
          await appendEventsV1(client, user.id, { ...current, pendingSnapshot: finalSnapshot }, content, body.events || []);
          const archived = await client.query(
            "UPDATE case_runs SET status='abandoned',archived_at=now(),snapshot=$2,revision=$3,updated_at=now() WHERE id=$1 AND status='active' AND revision=$4 RETURNING *",
            [current.id, finalSnapshot, hasCheckpoint ? expectedRevision + 1 : expectedRevision, expectedRevision]
          );
          if (!archived.rowCount) fail('Save atualizado em outro dispositivo', 409);
          const nextBody = { ...body, snapshot: body.newSnapshot ?? body.initialSnapshot };
          const next = await createRunV1(client, user.id, content, nextBody);
          return next;
        });
        return json(res, 201, { run: runEnvelope(result) });
      }

      if (url.pathname === '/api/runs/sync' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) fail('Caso inexistente', 404);
        const result = await db.transaction(user.id, async (client) => {
          const current = await requireRunV1(client, user.id, content, body);
          const revision = validateRevision(body.revision);
          const snapshot = normalizeSnapshot(body.snapshot, { ...runContextV1(content, body, current.id), contentVersion: current.content_version });
          const updated = await client.query(
            'UPDATE case_runs SET snapshot=$2,revision=revision+1,updated_at=now(),envelope_version=$4 WHERE id=$1 AND revision=$3 AND status=\'active\' RETURNING *',
            [current.id, snapshot, revision, RUN_ENVELOPE_VERSION]
          );
          if (!updated.rowCount) {
            const latest = await client.query('SELECT * FROM case_runs WHERE id=$1', [current.id]);
            fail('Save atualizado em outro dispositivo', 409, { current: runEnvelope(latest.rows[0]) });
          }
          await appendEventsV1(client, user.id, { ...current, pendingSnapshot: snapshot }, content, body.events || []);
          return updated.rows[0];
        });
        return json(res, 200, { runId: result.id, revision: Number(result.revision), syncedAt: Date.now() });
      }

      if (url.pathname === '/api/submissions' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) fail('Caso inexistente', 404);
        const challenge = content.challengeMap[body.challengeId];
        if (!challenge) fail('Ritual inexistente', 404);
        if (!inputMatchesGenerator(challenge, body.input)) fail('Entrada incompatível com o ritual');
        const correct = validateSubmission(challenge, body.input, body.submitted);
        const result = await db.transaction(user.id, async (client) => {
          const run = await requireRunV1(client, user.id, content, body);
          if (body.clientAttemptId) {
            const previous = await client.query('SELECT correct,attempt_no FROM ritual_attempts WHERE run_id=$1 AND client_attempt_id=$2', [run.id, body.clientAttemptId]);
            if (previous.rowCount) {
              const profile = await client.query('SELECT xp,level,field_marks FROM investigator_profiles WHERE user_id=$1', [user.id]);
              return { runId: run.id, correct: previous.rows[0].correct, attemptNo: previous.rows[0].attempt_no, profile: profile.rows[0], duplicate: true };
            }
          }
          const count = await client.query('SELECT count(*)::int AS total FROM ritual_attempts WHERE run_id=$1 AND challenge_id=$2', [run.id, challenge.id]);
          const attemptNo = count.rows[0].total + 1;
          await client.query(
            'INSERT INTO ritual_attempts(run_id,challenge_id,input,submitted,correct,hint_level,attempt_no,client_attempt_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
            [run.id, challenge.id, JSON.stringify(body.input), String(body.submitted || ''), correct, Number(body.hintLevel || 0), attemptNo, body.clientAttemptId || null]
          );
          if (correct) {
            await grantReward(client, user.id, `challenge:${run.case_id}:${challenge.id}`, challenge.rewards || { xp: 25, fieldMarks: 0 });
            if (attemptNo <= 2 && Number(body.hintLevel || 0) < 3) await grantReward(client, user.id, `mastery:${run.case_id}:${challenge.id}`, challenge.masteryRewards || { xp: 10, fieldMarks: 0 });
          }
          const profile = await client.query('SELECT xp,level,field_marks FROM investigator_profiles WHERE user_id=$1', [user.id]);
          return { runId: run.id, correct, attemptNo, profile: profile.rows[0] };
        });
        return json(res, 200, result);
      }

      if (url.pathname === '/api/runs/complete' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        for (const field of ['runId', 'caseId', 'routeId', 'languageId', 'contentVersion', 'revision']) {
          if (body[field] === undefined || body[field] === null || body[field] === '') fail(`Conclusão sem ${field}`);
        }
        const content = await repository.case(body.caseId);
        if (!content) fail('Caso inexistente', 404);
        const endingIds = new Set(Object.values(content.scenes).flatMap((scene) => (scene.events || []).filter((event) => event.type === 'endCase').map(endingIdOf)));
        if (!endingIds.has(body.endingId)) fail('Final inválido');
        const result = await db.transaction(user.id, async (client) => {
          const run = await requireRunV1(client, user.id, content, body, { statuses: ['active', 'completed'] });
          const revision = validateRevision(body.revision);
          if (run.status === 'completed') {
            if (run.ending_id !== body.endingId || (revision !== Number(run.revision) && revision + 1 !== Number(run.revision))) {
              fail('Conclusão diverge da execução já encerrada', 409, { current: runEnvelope(run) });
            }
            const profile = await client.query('SELECT xp,level,field_marks FROM investigator_profiles WHERE user_id=$1', [user.id]);
            return { run, completed: true, profile: profile.rows[0] };
          }
          if (revision !== Number(run.revision)) {
            const latest = await client.query('SELECT * FROM case_runs WHERE id=$1', [run.id]);
            fail('Save atualizado em outro dispositivo', 409, { current: runEnvelope(latest.rows[0]) });
          }
          const required = Object.values(content.trackMap[body.routeId].ritualSlots || {});
          const completed = await client.query('SELECT DISTINCT challenge_id FROM ritual_attempts WHERE run_id=$1 AND correct=true', [run.id]);
          if (required.some((id) => !new Set(completed.rows.map((row) => row.challenge_id)).has(id))) fail('Rituais obrigatórios ainda incompletos', 409);
          const snapshot = normalizeSnapshot(body.snapshot, { ...runContextV1(content, body, run.id), contentVersion: run.content_version });
          await validateAuthoritativeEnding(client, run, content, snapshot, body.endingId);
          snapshot.endingId = body.endingId;
          snapshot.caseCompleted = true;
          snapshot.cursor = { ...(snapshot.cursor || {}), mode: 'ending' };
          const updated = await client.query("UPDATE case_runs SET status='completed',ending_id=$2,completed_at=COALESCE(completed_at,now()),snapshot=$3,revision=revision+1,updated_at=now() WHERE id=$1 AND status='active' AND revision=$4 RETURNING *", [run.id, body.endingId, snapshot, revision]);
          if (!updated.rowCount) fail('Save atualizado em outro dispositivo', 409);
          await grantReward(client, user.id, `case:${run.case_id}`, content.campaign.rewards?.caseCompletion || { xp: 100, fieldMarks: 10 });
          const profile = await client.query('SELECT xp,level,field_marks FROM investigator_profiles WHERE user_id=$1', [user.id]);
          return { run: updated.rows[0], completed: true, profile: profile.rows[0] };
        });
        return json(res, 200, { runId: result.run.id, completed: result.completed, run: runEnvelope(result.run), profile: result.profile });
      }

      const reportMatch = url.pathname.match(/^\/api\/mentor\/teams\/([0-9a-f-]+)\/report(\.csv)?$/i);
      if (reportMatch && req.method === 'GET') {
        const user = await requireReadyUser(req);
        const teamId = reportMatch[1];
        const allowed = await db.query("SELECT 1 FROM team_members WHERE team_id=$1 AND user_id=$2 AND member_role='mentor'", [teamId, user.id]);
        if (!allowed.rowCount) throw Object.assign(new Error('Equipe não autorizada'), { status: 403 });
        const rows = await db.transaction(user.id, async (client) => (await client.query(
          `SELECT u.id AS user_id,u.username,p.display_name,p.xp,p.level,p.field_marks,r.id AS run_id,r.case_id,r.route_id,r.language_id,r.status,r.attempt_number,r.ending_id,r.started_at,r.completed_at,
             count(a.id)::int AS attempts,count(a.id) FILTER (WHERE a.correct)::int AS correct_attempts,COALESCE(max(a.hint_level),0)::int AS max_hint,
             COALESCE(ev.choices,'[]'::jsonb) AS choices,COALESCE(ev.optional_clues,0)::int AS optional_clues,COALESCE(resp.responses,'[]'::jsonb) AS responses,
             CASE WHEN COALESCE(r.completed_at,r.archived_at) IS NOT NULL THEN EXTRACT(EPOCH FROM (COALESCE(r.completed_at,r.archived_at)-r.started_at))::int END AS duration_seconds
           FROM team_members tm JOIN users u ON u.id=tm.user_id JOIN investigator_profiles p ON p.user_id=u.id
           LEFT JOIN case_runs r ON r.user_id=u.id LEFT JOIN ritual_attempts a ON a.run_id=r.id
           LEFT JOIN LATERAL (
             SELECT jsonb_agg(payload) FILTER (WHERE event_type='story_choice') AS choices,
               count(*) FILTER (WHERE event_type='clue_found' AND COALESCE((payload->>'optional')::boolean,false)) AS optional_clues
             FROM story_events WHERE run_id=r.id
           ) ev ON true
           LEFT JOIN LATERAL (
             SELECT jsonb_agg(jsonb_build_object('challengeId',challenge_id,'input',input,'submitted',submitted,'correct',correct,'attemptNo',attempt_no,'hintLevel',hint_level,'createdAt',created_at) ORDER BY created_at) AS responses
             FROM ritual_attempts WHERE run_id=r.id
           ) resp ON true
           WHERE tm.team_id=$1 AND tm.member_role='student'
           GROUP BY u.id,u.username,p.display_name,p.xp,p.level,p.field_marks,r.id,ev.choices,ev.optional_clues,resp.responses
           ORDER BY p.display_name,r.started_at`, [teamId]
        )).rows);
        const reportRows = await Promise.all(rows.map(async (row) => {
          if (!row.case_id) return row;
          const content = await repository.case(row.case_id);
          return {
            ...row,
            case_title: content?.entry?.title || content?.campaign?.title || row.case_id,
            case_subtitle: content?.entry?.subtitle || content?.campaign?.subtitle || '',
            route_name: content?.trackMap?.[row.route_id]?.name || row.route_id
          };
        }));
        if (reportMatch[2]) {
          const columns = ['username','display_name','xp','level','field_marks','case_id','case_title','route_id','route_name','language_id','attempt_number','status','ending_id','attempts','correct_attempts','max_hint','optional_clues','duration_seconds','choices','responses'];
          const csv = [columns.join(','), ...reportRows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n');
          res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="vesper-team-${teamId}.csv"` });
          return res.end(csv);
        }
        return json(res, 200, { teamId, students: reportRows });
      }

      const resetMatch = url.pathname.match(/^\/api\/mentor\/teams\/([0-9a-f-]+)\/students\/([0-9a-f-]+)\/reset-password$/i);
      if (resetMatch && req.method === 'POST') {
        const user = await requireReadyUser(req);
        if (!['mentor', 'admin'].includes(user.role)) throw Object.assign(new Error('Acesso reservado a mentores'), { status: 403 });
        const [teamId, studentId] = resetMatch.slice(1);
        const allowed = await db.query("SELECT 1 FROM team_members m JOIN team_members s ON s.team_id=m.team_id WHERE m.team_id=$1 AND m.user_id=$2 AND m.member_role='mentor' AND s.user_id=$3 AND s.member_role='student'", [teamId, user.id, studentId]);
        if (!allowed.rowCount) throw Object.assign(new Error('Aluno não autorizado'), { status: 403 });
        const body = await readBody(req);
        const requestedPassword = body.temporaryPassword ?? body.password;
        let temporaryPassword;
        if (requestedPassword === undefined) {
          temporaryPassword = crypto.randomBytes(12).toString('base64url');
        } else {
          temporaryPassword = String(requestedPassword);
          const confirmation = body.confirmPassword ?? body.passwordConfirmation;
          if (temporaryPassword.length < 8) fail('Senha temporária deve ter ao menos 8 caracteres');
          if (typeof confirmation !== 'string' || confirmation !== temporaryPassword) fail('Confirmação de senha não confere');
        }
        const passwordHash = await argon2.hash(temporaryPassword, { type: argon2.argon2id });
        await db.transaction(user.id, async (client) => {
          await client.query('UPDATE users SET password_hash=$2,must_change_password=true WHERE id=$1', [studentId, passwordHash]);
          await client.query('DELETE FROM sessions WHERE user_id=$1', [studentId]);
        });
        return json(res, 200, { temporaryPassword });
      }

      return json(res, 404, { error: 'Endpoint não encontrado' });
    } catch (error) {
      const unavailable = isDatabaseUnavailable(error);
      const status = error.status || (unavailable ? 503 : error.code === '23505' ? 409 : 500);
      failure = { name: error.name, code: error.code, message: error.message, stack: error.stack };
      return json(res, status, { error: status >= 500 ? (unavailable ? 'PostgreSQL indisponível' : 'Falha interna da API') : error.message, code: status === 503 ? 'DATABASE_UNAVAILABLE' : error.code, current: error.current, requestId });
    }
  };
}
