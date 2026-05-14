import { db, collection, setDoc, doc, serverTimestamp, Timestamp } from './firebase';
import { Incident } from '../types';

const DEMO_INCIDENTS: Partial<Incident>[] = [
  {
    type: 'Fire',
    severity: 'Critical',
    location: { lat: 6.5244, lng: 3.3792 }, // Lagos
    address: 'Tejuosho Market, Yaba, Lagos State',
    description: 'Massive fire breakout in the textile section. Multiple buildings affected.',
    status: 'RESPONDING',
    assignedUnit: 'LAGOS-FIRE-1'
  },
  {
    type: 'Crime',
    severity: 'High',
    location: { lat: 9.0765, lng: 7.3986 }, // Abuja
    address: 'Maitama District, Abuja, FCT',
    description: 'Armed robbery in progress at a residential complex. Suspects sighted on bikes.',
    status: 'PENDING'
  },
  {
    type: 'Accident',
    severity: 'Critical',
    location: { lat: 7.3775, lng: 3.9470 }, // Ibadan
    address: 'Lagos-Ibadan Expressway, near Iwo Road',
    description: 'Multiple vehicle collision involving a petroleum tanker and three passenger buses.',
    status: 'RESOLVED',
    assignedUnit: 'FRSC-IBADAN-4'
  },
  {
    type: 'Flood',
    severity: 'High',
    location: { lat: 4.8156, lng: 7.0498 }, // Port Harcourt
    address: 'Obio-Akpor, Port Harcourt, Rivers State',
    description: 'Heavy flash floods submerging residential areas. Residents trapped in houses.',
    status: 'RESPONDING',
    assignedUnit: 'NEMA-SOUTH-2'
  },
  {
    type: 'Medical',
    severity: 'Medium',
    location: { lat: 12.0022, lng: 8.5920 }, // Kano
    address: 'Kano Municipal, Sabon Gari, Kano State',
    description: 'Pregnant woman in critical labor needs emergency evacuation to Aminu Kano Hospital.',
    status: 'PENDING'
  },
  {
    type: 'Explosion',
    severity: 'Critical',
    location: { lat: 4.7500, lng: 6.9500 }, // Rivers State
    address: 'Pipeline Road, Eleme, Rivers State',
    description: 'Loud explosion heard near refinery perimeter. Thick smoke visible from 5km.',
    status: 'PENDING'
  },
  {
    type: 'Crime',
    severity: 'High',
    location: { lat: 6.3350, lng: 5.6037 }, // Benin City
    address: 'Ugbowo-Lagos Road, Benin City, Edo State',
    description: 'Kidnapping attempt foiled. Victims escaped; suspects fled into nearby bushes.',
    status: 'RESOLVED',
    assignedUnit: 'POLICE-EDO-DELTA'
  },
  {
    type: 'Accident',
    severity: 'Medium',
    location: { lat: 9.0579, lng: 7.4951 }, // Abuja
    address: 'Wuse II, Adetokunbo Ademola Crescent, Abuja',
    description: 'Car rammed into a utility pole. Power lines down. Driver injured.',
    status: 'RESPONDING',
    assignedUnit: 'FRSC-FCT-9'
  },
  {
    type: 'Flood',
    severity: 'High',
    location: { lat: 7.7337, lng: 8.5214 }, // Makurdi
    address: 'Benue River Bank, Makurdi, Benue State',
    description: 'River Benue overflowing its banks. Low-lying communities being evacuated.',
    status: 'PENDING'
  },
  {
    type: 'Medical',
    severity: 'Low',
    location: { lat: 6.4531, lng: 3.3958 }, // Lagos
    address: 'Lagos Island, CMS Bus Stop',
    description: 'Elderly man collapsed on the sidewalk. Conscious but confused.',
    status: 'RESOLVED',
    assignedUnit: 'LASAMBUS-02'
  },
  {
    type: 'Fire',
    severity: 'High',
    location: { lat: 10.5105, lng: 7.4165 }, // Kaduna
    address: 'Kaduna Central Market, Kaduna State',
    description: 'Fire spotted in the livestock section. Traders evacuating animals.',
    status: 'PENDING'
  },
  {
    type: 'Crime',
    severity: 'Medium',
    location: { lat: 5.4836, lng: 7.0332 }, // Owerri
    address: 'Douglas Road, Owerri, Imo State',
    description: 'Pickpockets apprehended by angry mob. Police needed for rescue.',
    status: 'RESPONDING',
    assignedUnit: 'POLICE-IMO-7'
  },
  {
    type: 'Accident',
    severity: 'Low',
    location: { lat: 8.4799, lng: 4.5418 }, // Ilorin
    address: 'Taiwo Road, Ilorin, Kwara State',
    description: 'Minor fender bender causing traffic gridlock.',
    status: 'RESOLVED',
    assignedUnit: 'KWARA-TRAFFIC'
  },
  {
    type: 'Flood',
    severity: 'Medium',
    location: { lat: 6.1367, lng: 6.7865 }, // Onitsha
    address: 'Onitsha Main Market, Anambra State',
    description: 'Drainage blocked causing localized flooding after 2 hours of rain.',
    status: 'PENDING'
  },
  {
    type: 'Explosion',
    severity: 'Critical',
    location: { lat: 11.8333, lng: 13.1500 }, // Maiduguri
    address: 'Baga Road, Maiduguri, Borno State',
    description: 'IED explosion at a checkpoint. Casualties reported.',
    status: 'RESPONDING',
    assignedUnit: 'ARMY-NA-01'
  }
];

export async function seedDemoData() {
  const timestamp = new Date();
  
  for (const incident of DEMO_INCIDENTS) {
    const id = `GS-${timestamp.getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
    const data = {
      ...incident,
      createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 86400000)), // Random time in last 24h
      updatedAt: serverTimestamp(),
      reporterId: 'demo-system'
    };
    
    await setDoc(doc(db, 'incidents', id), data);
  }
  
  console.log("Demo data seeded successfully");
}
