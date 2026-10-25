export type Listing = {
  id: string; name: string; location: string; institution: string; price: number;
  nsfas: boolean; distanceKm: number; roomType: string; availableRooms: number;
  amenities: string[]; imageUrl: string; lat: number; lng: number; description: string;
};
