import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

export async function runMigrations() {
  const migrationsFolder = resolve(process.cwd(), 'server/db/migrations');

  if (!existsSync(migrationsFolder)) {
    console.error(`Migrations folder not found: ${migrationsFolder}`);
    console.error('Skipping automatic migration (will rely on tables already existing)');
    return;
  }

  console.log(`Running database migrations from ${migrationsFolder}...`);
  try {
    await migrate(db, {
      migrationsFolder,
    });
    console.log('Database migrations applied successfully');
  } catch (err: any) {
    if (err?.message?.includes('already exists')) {
      console.warn('Migration warning (non-fatal):', err.message);
    } else {
      console.error('Migration failed:', err);
      throw err;
    }
  }
}