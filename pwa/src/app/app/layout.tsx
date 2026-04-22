import Header from '@/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="scope-light flex-1 flex flex-col bg-babimob-paper text-babimob-ink">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
