import { readFile } from 'node:fs/promises';
import { createDatabase } from './db.mjs';

const db = createDatabase();
if (!db) throw new Error('DATABASE_URL é obrigatório para executar migrações.');
const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
await db.query(schema);
await db.pool.end();
console.log('Schema PostgreSQL aplicado.');
