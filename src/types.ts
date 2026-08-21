export type StopCategory = 
  | 'sightseeing' 
  | 'hotel' 
  | 'restaurant' 
  | 'activity' 
  | 'nature' 
  | 'transit' 
  | 'shopping' 
  | 'viewpoint'
  | 'pass'
  | 'biker_spot';

export interface TripStop {
  id: string;
  title: string;
  category: StopCategory;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  rating?: number;
  time?: string; // e.g. "09:30"
  durationMinutes?: number; // e.g. 90
  cost?: number; // e.g. 25
  notes?: string;
  googleMapsUrl?: string;
  placeId?: string;
  completed?: boolean;
  bookingRef?: string;
  curvinessScore?: number; // 1-100 curve rating
  elevationMeters?: number;
}

export interface TripDay {
  id: string;
  dayNumber: number;
  date?: string; // YYYY-MM-DD
  title: string;
  theme?: string;
  notes?: string;
  accommodation?: string;
  stops: TripStop[];
}

export type TransportMode = 'motorcycle' | 'car' | 'camper' | 'transit' | 'bike' | 'walk';

export interface MotorcycleSettings {
  windingProfile: 'super_curvy' | 'curvy' | 'direct';
  avoidHighways: boolean;
  avoidTolls: boolean;
  fuelRangeKm: number;
  showBikerPOIs?: boolean;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  coverImage?: string;
  transportMode: TransportMode;
  motorcycleSettings?: MotorcycleSettings;
  currency: string;
  budgetGoal?: number;
  days: TripDay[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchPlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: StopCategory;
}
