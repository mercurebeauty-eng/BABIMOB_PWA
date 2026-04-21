import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Next.js 15+ : cookies() retourne maintenant une Promise, donc la factory est async.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignoré en contexte server-action / RSC pur
          }
        }
      }
    }
  );
}
