import pg from 'pg';

const { Pool } = pg;

export function createDatabase() {
  if (!process.env.DATABASE_URL) return null;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_SIZE || 10),
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : undefined
  });
  return {
    pool,
    query: (text, params) => pool.query(text, params),
    async transaction(userId, callback) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (userId) await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  };
}
