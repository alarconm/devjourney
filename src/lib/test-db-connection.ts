import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function testConnection() {
  try {
    console.log('Attempting to connect to the database...');
    await pool.query('SELECT NOW()');
    console.log('Successfully connected to the database.');

    console.log('Attempting to run migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();