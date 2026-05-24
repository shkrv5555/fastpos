// Schema.sql-i bazaya tətbiq edir
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import 'dotenv/config';

const __dir = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const sql = readFileSync(join(__dir, 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    console.log('Migrasiya başlayır...');
    await client.query(sql);
    console.log('✅ Schema tətbiq edildi.');
  } catch (err) {
    console.error('❌ Migrasiya xətası:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
