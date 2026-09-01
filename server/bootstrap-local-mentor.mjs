import argon2 from 'argon2';
import { createDatabase } from './db.mjs';

const username = 'wanderson';
const password = 'superposte1';
const db = createDatabase();
if (!db) throw new Error('DATABASE_URL é obrigatória.');

try {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await db.transaction(null, async (client) => {
    const result = await client.query(
      "INSERT INTO users(username,password_hash,role) VALUES($1,$2,'mentor') ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='mentor',must_change_password=false RETURNING id",
      [username, passwordHash]
    );
    await client.query(
      'INSERT INTO investigator_profiles(user_id,display_name) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING',
      [result.rows[0].id, username]
    );
  });
  console.log(`Conta local ${username} pronta.`);
} finally {
  await db.pool.end();
}
