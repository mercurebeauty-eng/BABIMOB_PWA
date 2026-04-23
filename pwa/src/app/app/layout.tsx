export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white text-gray-900">
      {children}
    </div>
  );
}
