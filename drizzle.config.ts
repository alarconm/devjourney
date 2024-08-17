import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface Config {
  schema: string;
  out: string;
  driver: 'pg';
  dbCredentials: {
    connectionString: string;
  };
}

const config: Config = {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
};

export default config;