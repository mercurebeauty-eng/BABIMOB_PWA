export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="scope-dark flex-1 flex flex-col bg-bm-bg text-bm-text font-sans">
      {children}
    </div>
  );
}
