import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function main() {
  console.log('Migration started');
  console.log('Database URL:', databaseUrl.replace(/:\/\/[^@]+@/, '://****:****@'));
  try {
    console.log('Attempting to connect to the database...');
    await pool.query('SELECT NOW()');
    console.log('Successfully connected to the database.');

    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});