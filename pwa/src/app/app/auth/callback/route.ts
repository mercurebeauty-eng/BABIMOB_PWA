import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Callback appelé par Supabase après que l'utilisateur clique le magic link
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/compte';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/app/auth/signin?error=callback_failed`);
}
