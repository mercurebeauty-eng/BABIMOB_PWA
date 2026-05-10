-- Migration: Voice Rooms System
-- Description: Create tables for voice rooms with 5-speaker limit

-- 1. Table des salons vocaux
CREATE TABLE IF NOT EXISTS voice_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  host_id UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  commune_id TEXT
);

-- 2. Table des participants
CREATE TABLE IF NOT EXISTS voice_room_participants (
  room_id UUID REFERENCES voice_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('host', 'speaker', 'listener')) DEFAULT 'listener',
  is_muted BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- 3. Fonction pour vérifier la limite de 5 speakers
CREATE OR REPLACE FUNCTION check_speaker_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IN ('host', 'speaker')) THEN
    IF (
      SELECT count(*) 
      FROM voice_room_participants 
      WHERE room_id = NEW.room_id AND role IN ('host', 'speaker')
    ) >= 5 THEN
      RAISE EXCEPTION 'Limite de 5 speakers atteinte pour ce salon.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour appliquer la limite
DROP TRIGGER IF EXISTS enforce_speaker_limit ON voice_room_participants;
CREATE TRIGGER enforce_speaker_limit
BEFORE INSERT OR UPDATE ON voice_room_participants
FOR EACH ROW EXECUTE FUNCTION check_speaker_limit();

-- 5. Table des demandes de parole
CREATE TABLE IF NOT EXISTS voice_speaker_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES voice_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RLS (Row Level Security)
ALTER TABLE voice_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_speaker_requests ENABLE ROW LEVEL SECURITY;

-- Politiques
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Tout le monde peut voir les salons actifs') THEN
        CREATE POLICY "Tout le monde peut voir les salons actifs" ON voice_rooms FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Les hôtes peuvent créer des salons') THEN
        CREATE POLICY "Les hôtes peuvent créer des salons" ON voice_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Tout le monde peut rejoindre comme participant') THEN
        CREATE POLICY "Tout le monde peut rejoindre comme participant" ON voice_room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
