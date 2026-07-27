export type ParseStatus = "parsed" | "needs-manual" | "error";

export interface TransitLeg {
  mode: "subway" | "bus";
  label: string;
  startName: string;
  endName: string;
  sectionTime: number;
  stationCount: number;
  walkBeforeMin: number;
}

export interface JobListing {
  id: string;
  url: string;
  companyName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  durationMin?: number;
  transitType?: string;
  transitLegs?: TransitLeg[];
  finalWalkMin?: number;
  status: ParseStatus;
  errorMessage?: string;
}
