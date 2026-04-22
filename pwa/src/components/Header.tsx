import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="bg-babimob-blue text-white shadow-md sticky top-0 z-[500]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">
            🧭
          </div>
          <span className="font-bold text-lg tracking-tight">BABIMOB</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-babimob-orange-br transition hidden sm:inline">
            Accueil
          </Link>
          <Link href="/app/itineraire" className="hover:text-babimob-orange-br transition">
            Itinéraire
          </Link>
          {user ? (
            <Link href="/app/compte" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition">
              Mon compte
            </Link>
          ) : (
            <Link href="/app/auth/signin" className="bg-babimob-orange hover:bg-babimob-orange-br px-3 py-1.5 rounded-full transition font-medium">
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
