import { sql } from '@/lib/db';
import LandingPage from '@/components/LandingPage';

export const revalidate = 0; // Ensuring the count is always fresh

export default async function Page() {
  let dbCount = 0;
  
  try {
    const result = await sql`SELECT COUNT(*) as count FROM waitlist`;
    const count = parseInt(result[0].count, 10);
    dbCount = isNaN(count) ? 0 : count;
  } catch (error) {
    console.error("Error fetching waitlist count:", error);
    dbCount = 0; // Fallback to 0 if table doesn't exist yet or connection fails
  }

  // Business Logic: Base 1000 + actual DB count
  const totalCount = 1000 + dbCount;

  return <LandingPage initialCount={totalCount} />;
}
