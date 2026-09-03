import { migrateDatabase } from './db.mjs';

await migrateDatabase();
console.log('Schema PostgreSQL aplicado.');
