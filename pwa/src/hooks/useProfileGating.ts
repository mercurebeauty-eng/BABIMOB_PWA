import { useDataStore } from '@/context/DataStoreContext';

/**
 * Hook pour vérifier si l'utilisateur a rempli les informations
 * obligatoires (Nom et Téléphone) pour accéder aux fonctions sociales.
 */
export function useProfileGating() {
  const { profile, loading } = useDataStore();

  const isNameSet = !!profile?.display_name && profile.display_name.trim().length >= 2;
  const isPhoneSet = !!profile?.phone_number && profile.phone_number.trim().length >= 8;

  const isComplete = isNameSet && isPhoneSet;

  const missingFields = [];
  if (!isNameSet) missingFields.push('Nom');
  if (!isPhoneSet) missingFields.push('Téléphone');

  return {
    isComplete,
    missingFields,
    loading,
    profile
  };
}
