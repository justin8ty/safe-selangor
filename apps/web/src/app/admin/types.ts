export type QueueIncident = {
  id: string;
  type: string;
  time: string;
  title: string;
  description: string;
  trustScore: number;
  confidence: number;
  location: string;
  coordinates: { lat: number; lng: number };
};
