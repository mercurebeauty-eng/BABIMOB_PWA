import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Callback appelé par Supabase après que l'utilisateur clique le magic link
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Validate `next` — must be a relative path starting with /
  const rawNext = searchParams.get('next') ?? '/app/compte';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/app/compte';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/app/auth/signin?error=callback_failed`);
}
