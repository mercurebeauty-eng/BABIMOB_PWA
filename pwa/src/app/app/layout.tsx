import { DataStoreProvider } from '@/context/DataStoreContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataStoreProvider>
      <div className="flex-1 flex flex-col overflow-hidden bg-white text-gray-900">
        {children}
      </div>
    </DataStoreProvider>
  );
}
