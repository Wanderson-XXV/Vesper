import crypto from 'node:crypto';
import argon2 from 'argon2';
import { createDatabase } from './db.mjs';
import { ContentRepository } from './content-repository.mjs';
import { inputMatchesGenerator, validateSubmission } from './oracle.mjs';

const SESSION_COOKIE = 'vesper_session';
const SESSION_SECONDS = 60 * 60 * 24 * 14;

const json = (res, status, value, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(value));
};

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
const eventHash = (event) => event.eventId || crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex');
const sessionCookie = (token = '', maxAge = SESSION_SECONDS) => `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`;

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

function validateRunSelection(content, body) {
  const route = content.trackMap[body.routeId];
  if (!route) throw Object.assign(new Error('Rota inválida'), { status: 400 });
  const languages = route.supportedLanguages || content.campaign.supportedLanguages || [];
  if (!languages.includes(body.languageId)) throw Object.assign(new Error('Linguagem não suportada pela rota'), { status: 400 });
}

async function activeRun(client, userId, caseId, routeId) {
  const result = await client.query(
    "SELECT * FROM case_runs WHERE user_id=$1 AND case_id=$2 AND route_id=$3 AND status='active' ORDER BY attempt_number DESC LIMIT 1",
    [userId, caseId, routeId]
  );
  return result.rows[0] || null;
}

async function createRun(client, userId, content, body) {
  validateRunSelection(content, body);
  const next = await client.query(
    'SELECT COALESCE(MAX(attempt_number),0)+1 AS attempt FROM case_runs WHERE user_id=$1 AND case_id=$2 AND route_id=$3',
    [userId, content.campaign.id, body.routeId]
  );
  const result = await client.query(
    `INSERT INTO case_runs(user_id,case_id,content_version,route_id,language_id,snapshot,attempt_number)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, content.campaign.id, content.campaign.contentVersion || content.campaign.version, body.routeId, body.languageId, body.snapshot || {}, next.rows[0].attempt]
  );
  return result.rows[0];
}

async function requireRun(client, userId, content, body) {
  validateRunSelection(content, body);
  const result = body.runId
    ? await client.query("SELECT * FROM case_runs WHERE id=$1 AND user_id=$2 AND status='active'", [body.runId, userId])
    : { rows: [await activeRun(client, userId, content.campaign.id, body.routeId)].filter(Boolean) };
  if (!result.rows[0]) throw Object.assign(new Error('Execução ativa não encontrada'), { status: 404 });
  return result.rows[0];
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
        const username = String(body.username || '').trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw Object.assign(new Error('Usuário deve ter 3–32 caracteres simples'), { status: 400 });
        if (String(body.password || '').length < 8) throw Object.assign(new Error('Senha deve ter ao menos 8 caracteres'), { status: 400 });
        const displayName = username;
        const teamCode = String(body.teamCode || '').trim();
        if (!teamCode) throw Object.assign(new Error('Código de turma obrigatório'), { status: 400 });
        const passwordHash = await argon2.hash(String(body.password), { type: argon2.argon2id });
        const result = await db.transaction(null, async (client) => {
          const team = await client.query('SELECT id FROM teams WHERE upper(code)=upper($1)', [teamCode]);
          if (!team.rowCount) throw Object.assign(new Error('Equipe não encontrada'), { status: 404 });
          const created = await client.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,'student') RETURNING id,username,role", [username, passwordHash]);
          const user = created.rows[0];
          await client.query("SELECT set_config('app.user_id', $1, true)", [user.id]);
          await client.query('INSERT INTO investigator_profiles(user_id,display_name,preferred_language) VALUES($1,$2,$3)', [user.id, displayName, body.preferredLanguage || 'java']);
          await client.query("INSERT INTO team_members(team_id,user_id,member_role) VALUES($1,$2,'student')", [team.rows[0].id, user.id]);
          const token = await createSession(client, user.id);
          return { user, token };
        });
        return json(res, 201, { user: result.user }, { 'Set-Cookie': sessionCookie(result.token) });
      }

      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await readBody(req);
        const found = await db.query('SELECT id,username,role,password_hash FROM users WHERE username=$1', [String(body.username || '').trim().toLowerCase()]);
        if (!found.rowCount || !(await argon2.verify(found.rows[0].password_hash, String(body.password || '')))) {
          throw Object.assign(new Error('Usuário ou senha inválidos'), { status: 401 });
        }
        const token = await db.transaction(null, (client) => createSession(client, found.rows[0].id));
        const { password_hash, ...user } = found.rows[0];
        return json(res, 200, { user }, { 'Set-Cookie': sessionCookie(token) });
      }

      if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
        const token = parseCookies(req)[SESSION_COOKIE];
        if (token) await db.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
        return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
      }

      if (url.pathname === '/api/auth/change-password' && req.method === 'POST') {
        const user = await requireUser(req);
        const body = await readBody(req);
        if (String(body.password || '').length < 8) throw Object.assign(new Error('Senha deve ter ao menos 8 caracteres'), { status: 400 });
        const passwordHash = await argon2.hash(String(body.password), { type: argon2.argon2id });
        const token = parseCookies(req)[SESSION_COOKIE];
        await db.transaction(user.id, async (client) => {
          await client.query('UPDATE users SET password_hash=$2,must_change_password=false WHERE id=$1', [user.id, passwordHash]);
          await client.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2', [user.id, hashToken(token)]);
        });
        return json(res, 200, { ok: true });
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
        const run = await db.transaction(user.id, (client) => activeRun(client, user.id, caseId, routeId));
        return json(res, 200, { run });
      }

      if (url.pathname === '/api/runs/start' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) throw Object.assign(new Error('Caso inexistente'), { status: 404 });
        const run = await db.transaction(user.id, async (client) => {
          const current = await activeRun(client, user.id, body.caseId, body.routeId);
          return current || createRun(client, user.id, content, body);
        });
        return json(res, 201, { run });
      }

      if (url.pathname === '/api/runs/restart' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) throw Object.assign(new Error('Caso inexistente'), { status: 404 });
        const run = await db.transaction(user.id, async (client) => {
          const current = await requireRun(client, user.id, content, body);
          await client.query("UPDATE case_runs SET status='abandoned',archived_at=now(),updated_at=now() WHERE id=$1", [current.id]);
          return createRun(client, user.id, content, body);
        });
        return json(res, 201, { run });
      }

      if (url.pathname === '/api/runs/sync' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) throw Object.assign(new Error('Caso inexistente'), { status: 404 });
        const run = await db.transaction(user.id, async (client) => {
          const current = await requireRun(client, user.id, content, body);
          const updated = await client.query('UPDATE case_runs SET snapshot=$2,revision=revision+1,language_id=$4,updated_at=now() WHERE id=$1 AND revision=$3 RETURNING *', [current.id, body.snapshot || {}, Number(body.revision), body.languageId]);
          if (!updated.rowCount) {
            const latest = await client.query('SELECT * FROM case_runs WHERE id=$1', [current.id]);
            throw Object.assign(new Error('Save atualizado em outro dispositivo'), { status: 409, current: latest.rows[0] });
          }
          for (const event of body.events || []) {
            const inserted = await client.query(
              'INSERT INTO story_events(run_id,client_event_id,event_type,payload,occurred_at) VALUES($1,$2,$3,$4,to_timestamp($5/1000.0)) ON CONFLICT DO NOTHING',
              [current.id, eventHash(event), event.type || 'unknown', event, Number(event.at || Date.now())]
            );
            if (!inserted.rowCount) continue;
            if (event.type === 'story_choice') {
              const choice = content.choiceMap[event.choiceId];
              const option = choice?.options?.find((item) => item.id === event.optionId);
              if (option?.relation?.character) {
                await client.query(
                  `UPDATE investigator_profiles SET relationships=jsonb_set(
                    relationships, ARRAY[$2], to_jsonb(COALESCE((relationships->>$2)::int,0)+$3), true
                  ),updated_at=now() WHERE user_id=$1`,
                  [user.id, option.relation.character, Number(option.relation.amount || 0)]
                );
              }
            }
            if (event.type === 'clue_found') {
              const clue = content.clueMap[event.clueId];
              if (clue?.optional) await grantReward(client, user.id, `clue:${body.caseId}:${clue.id}`, clue.rewards || { xp: 10, fieldMarks: 1 });
            }
          }
          return updated.rows[0];
        });
        return json(res, 200, { runId: run.id, revision: Number(run.revision), syncedAt: Date.now() });
      }

      if (url.pathname === '/api/submissions' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        const challenge = content?.challengeMap[body.challengeId];
        if (!challenge) throw Object.assign(new Error('Ritual inexistente'), { status: 404 });
        if (!inputMatchesGenerator(challenge, body.input)) throw Object.assign(new Error('Entrada incompatível com o ritual'), { status: 400 });
        const correct = validateSubmission(challenge, body.input, body.submitted);
        const result = await db.transaction(user.id, async (client) => {
          const run = await requireRun(client, user.id, content, body);
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
            [run.id, challenge.id, body.input, String(body.submitted || ''), correct, Number(body.hintLevel || 0), attemptNo, body.clientAttemptId || null]
          );
          if (correct) {
            await grantReward(client, user.id, `challenge:${body.caseId}:${challenge.id}`, challenge.rewards || { xp: 25, fieldMarks: 0 });
            if (attemptNo <= 2 && Number(body.hintLevel || 0) < 3) await grantReward(client, user.id, `mastery:${body.caseId}:${challenge.id}`, challenge.masteryRewards || { xp: 10, fieldMarks: 0 });
          }
          const profile = await client.query('SELECT xp,level,field_marks FROM investigator_profiles WHERE user_id=$1', [user.id]);
          return { runId: run.id, correct, attemptNo, profile: profile.rows[0] };
        });
        return json(res, 200, result);
      }

      if (url.pathname === '/api/runs/complete' && req.method === 'POST') {
        const user = await requireReadyUser(req);
        const body = await readBody(req);
        const content = await repository.case(body.caseId);
        if (!content) throw Object.assign(new Error('Caso inexistente'), { status: 404 });
        const result = await db.transaction(user.id, async (client) => {
          const run = await requireRun(client, user.id, content, body);
          const required = Object.values(content.trackMap[body.routeId].ritualSlots || {});
          const completed = await client.query('SELECT DISTINCT challenge_id FROM ritual_attempts WHERE run_id=$1 AND correct=true', [run.id]);
          const completedIds = new Set(completed.rows.map((row) => row.challenge_id));
          if (required.some((id) => !completedIds.has(id))) throw Object.assign(new Error('Rituais obrigatórios ainda incompletos'), { status: 409 });
          await client.query("UPDATE case_runs SET status='completed',ending_id=COALESCE(ending_id,$2),completed_at=COALESCE(completed_at,now()),snapshot=$3,revision=revision+1,updated_at=now() WHERE id=$1", [run.id, body.endingId, body.snapshot || {}]);
          await grantReward(client, user.id, `case:${body.caseId}`, content.campaign.rewards?.caseCompletion || { xp: 100, fieldMarks: 10 });
          const profile = await client.query('SELECT xp,level,field_marks FROM investigator_profiles WHERE user_id=$1', [user.id]);
          return { runId: run.id, completed: true, profile: profile.rows[0] };
        });
        return json(res, 200, result);
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
        if (reportMatch[2]) {
          const columns = ['username','display_name','xp','level','field_marks','case_id','route_id','language_id','attempt_number','status','ending_id','attempts','correct_attempts','max_hint','optional_clues','duration_seconds','choices','responses'];
          const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n');
          res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="vesper-team-${teamId}.csv"` });
          return res.end(csv);
        }
        return json(res, 200, { teamId, students: rows });
      }

      const resetMatch = url.pathname.match(/^\/api\/mentor\/teams\/([0-9a-f-]+)\/students\/([0-9a-f-]+)\/reset-password$/i);
      if (resetMatch && req.method === 'POST') {
        const user = await requireReadyUser(req);
        if (!['mentor', 'admin'].includes(user.role)) throw Object.assign(new Error('Acesso reservado a mentores'), { status: 403 });
        const [teamId, studentId] = resetMatch.slice(1);
        const allowed = await db.query("SELECT 1 FROM team_members m JOIN team_members s ON s.team_id=m.team_id WHERE m.team_id=$1 AND m.user_id=$2 AND m.member_role='mentor' AND s.user_id=$3 AND s.member_role='student'", [teamId, user.id, studentId]);
        if (!allowed.rowCount) throw Object.assign(new Error('Aluno não autorizado'), { status: 403 });
        const temporaryPassword = crypto.randomBytes(12).toString('base64url');
        const passwordHash = await argon2.hash(temporaryPassword, { type: argon2.argon2id });
        await db.transaction(user.id, async (client) => {
          await client.query('UPDATE users SET password_hash=$2,must_change_password=true WHERE id=$1', [studentId, passwordHash]);
          await client.query('DELETE FROM sessions WHERE user_id=$1', [studentId]);
        });
        return json(res, 200, { temporaryPassword });
      }

      return json(res, 404, { error: 'Endpoint não encontrado' });
    } catch (error) {
      const status = error.status || (error.code === '23505' ? 409 : 500);
      if (status >= 500) console.error(error);
      return json(res, status, { error: status >= 500 ? 'Falha interna da API' : error.message, code: error.code, current: error.current });
    }
  };
}
