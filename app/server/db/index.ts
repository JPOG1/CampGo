import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/campgo';

const client = postgres(connectionString);
export const db = drizzle(client);
export { client as sql };

export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
