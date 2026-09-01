import argon2 from 'argon2';
import { createDatabase } from './db.mjs';

const username = String(process.env.MENTOR_USERNAME || '').trim().toLowerCase();
const password = String(process.env.MENTOR_PASSWORD || '');
if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('Defina MENTOR_USERNAME com 3–32 caracteres simples.');
if (password.length < 8) throw new Error('Defina MENTOR_PASSWORD com ao menos 8 caracteres.');

const db = createDatabase();
if (!db) throw new Error('DATABASE_URL é obrigatória.');
try {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await db.transaction(null, async (client) => {
    const created = await client.query(
      "INSERT INTO users(username,password_hash,role) VALUES($1,$2,'mentor') ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='mentor',must_change_password=false RETURNING id",
      [username, passwordHash]
    );
    const userId = created.rows[0].id;
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    await client.query('INSERT INTO investigator_profiles(user_id,display_name) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING', [userId, username]);
  });
  console.log(`Mentor ${username} criado/atualizado.`);
} finally {
  await db.pool.end();
}
