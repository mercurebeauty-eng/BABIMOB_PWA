import { DataStoreProvider } from '@/context/DataStoreContext';
import { VoiceRoomProvider } from '@/context/VoiceRoomContext';
import { VoiceMiniPlayer } from '@/components/voice/VoiceMiniPlayer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataStoreProvider>
      <VoiceRoomProvider>
        <div className="flex-1 flex flex-col overflow-hidden bg-white text-gray-900">
          {children}
        </div>
        <VoiceMiniPlayer />
      </VoiceRoomProvider>
    </DataStoreProvider>
  );
}
