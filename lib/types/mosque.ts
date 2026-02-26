import { Mosque } from "@/constants/mockData";

export interface SupabaseMosque {
  id: string;
  name: string;
  address: string;
  city: string;
  image_url: string;
  maps_url: string;
  latitude: number;
  longitude: number;
  description: string | null;
  imam: string | null;
  capacity: string | null;
  services: string | null;
}

export function mapSupabaseMosqueToMosque(row: SupabaseMosque): Mosque {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    city: row.city ?? "",
    distance: 0,
    imageUrl: row.image_url ?? "",
    mapsUrl: row.maps_url ?? "",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    description: row.description ?? undefined,
    imam: row.imam ?? undefined,
    capacity: row.capacity ?? undefined,
    services: row.services ?? undefined,
  };
}
