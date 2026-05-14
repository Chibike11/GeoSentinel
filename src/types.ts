export type IncidentType = 'Fire' | 'Crime' | 'Accident' | 'Flood' | 'Medical' | 'Explosion' | 'Other';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'PENDING' | 'RESPONDING' | 'RESOLVED';
export type AgencyType = 'Police' | 'Fire Service' | 'NEMA' | 'FRSC' | 'Medical';
export type UserRole = 'ADMIN' | 'RESPONDER';

export interface Location {
  lat: number;
  lng: number;
}

export interface Incident {
  id?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  location: Location;
  address: string;
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  reporterContact?: string;
  status: IncidentStatus;
  assignedUnit?: string;
  createdAt: any;
  updatedAt?: any;
  reporterId?: string;
}

export interface AuthorityUser {
  uid: string;
  email: string;
  agency: AgencyType;
  role: UserRole;
}

export interface FIRMSHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string;
  version: string;
  bright_t31: number;
  frp: number;
  daynight: string;
}
