export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="region"
      aria-label="Carte et navigation"
      className="flex-1 flex flex-col overflow-hidden bg-white text-gray-900"
    >
      {children}
    </div>
  );
}
