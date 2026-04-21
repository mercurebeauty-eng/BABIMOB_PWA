// Types générés à la main depuis le schéma Supabase (à régénérer avec
// `supabase gen types typescript` plus tard quand tu utiliseras la CLI).

export type Stop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  commune: string | null;
};

export type Route = {
  route_id: string;
  route_long_name: string | null;
  route_short_name: string | null;
  agency_id: string | null;
  route_color: string | null;
};

export type LigneParArret = {
  route_id: string;
  route_long_name: string | null;
  agency_id: string | null;
  direction_id: number | null;
  trip_headsign: string | null;
};

export type ArretProche = {
  stop_id: string;
  stop_name: string;
  commune: string | null;
  distance_m: number;
  stop_lat: number;
  stop_lon: number;
};

export type UserQuota = {
  requetes_restantes: number;
  requetes_bonus: number;
  essai_premium_active: boolean;
  essai_premium_expire: string | null;
  premium_active: boolean;
};
