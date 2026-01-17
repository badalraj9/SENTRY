import 'dotenv/config';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

import dotenv from 'dotenv';
dotenv.config({ path: envPath });

console.log('--- DB DEBUG SCRIPT (REPRODUCING FAILURE) ---');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL Removed to match pool.ts
  connectionTimeoutMillis: 2000, // Reduced to match pool.ts
});

async function test() {
  try {
    console.log('Attempting to connect with NO explicit SSL config...');
    const client = await pool.connect();
    console.log('Connected!'); // Should not reach here if hypothesis is correct
    client.release();
  } catch (err: any) {
    console.error('CONNECTION ERROR:', err.message);
    // console.error(err);
  } finally {
    await pool.end();
  }
}

test();
