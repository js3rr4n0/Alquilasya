import { neon } from '@neondatabase/serverless';

// Ensures that the DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables.');
}

// We use the neon function to create a connection to the database.
// This uses the connection string provided in your .env.local file.
export const sql = neon(process.env.DATABASE_URL);
