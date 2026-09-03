/**
 * Queue Cue domain data + models.
 *
 * BACKEND HOOKUP: everything exported here is plain data / pure functions.
 * To connect a real backend, replace the SEED_* constants with API fetches
 * inside src/lib/qc/store.tsx (see the marked TODOs there) — the components
 * never touch these constants directly.
 */

export type Role = "patient" | "ambulance" | "hospital" | "central";

export type Lang = "en" | "hi";

export interface Hospital {
  id: string;
  name: string;
  sector: "private" | "govt";
  specialty: { en: string; hi: string };
  lat: number;
  lng: number;
  bedsTotal: number;
  bedsOccupied: number;
  staffTotal: number;
  staffPresent: number;
  stockPct: number;
  roadStatus: "clear" | "congested" | "blocked";
  arrivalsNormal: number;
  arrivalsCurrent: number;
  dischargesPerHr: number;
  queueLength: number;
  queueNormal: number;
  delayHrs: number;
  expectedDelayHrs: number;
}

export type AmbulanceStatus = "available" | "dispatched" | "en_route" | "at_hospital" | "offline";

export interface Ambulance {
  id: string;
  code: string;
  driver: string;
  lat: number;
  lng: number;
  status: AmbulanceStatus;
  requestId: string | null;
}

export type RequestStatus = "pending" | "assigned" | "accepted" | "completed";

export interface AmbulanceRequest {
  id: string;
  patientName: string;
  patientLoc: { lat: number; lng: number };
  note: string;
  hospitalId: string;
  ambulanceId: string | null;
  status: RequestStatus;
  createdAt: number;
}

export interface Account {
  username: string;
  password: string;
  role: Role;
  name: string;
  /** hospital admins are scoped to one hospital */
  hospitalId?: string;
  /** ambulance accounts are scoped to one unit */
  ambulanceId?: string;
}

export const FALLBACK_CENTER = { lat: 28.6139, lng: 77.209 };
export const OVERCROWD_THRESHOLD_PCT = 90;
export const REQUIRED_STAFF_RATIO = 0.85;
export const WEIGHTS = { arrival: 0.3, occupancy: 0.25, staffing: 0.2, queue: 0.15, delay: 0.1 };

const occ = (total: number, pct: number) => Math.round((total * pct) / 100);

export const SEED_HOSPITALS: Hospital[] = [
  {
    id: "apollo",
    name: "Indraprastha Apollo Hospital",
    sector: "private",
    specialty: { en: "Multi-specialty & Cardiac Sciences", hi: "बहु-विशेषज्ञता एवं हृदय विज्ञान" },
    lat: 28.5273,
    lng: 77.2909,
    bedsTotal: 710,
    bedsOccupied: occ(710, 67),
    staffTotal: 220,
    staffPresent: 200,
    stockPct: 78,
    roadStatus: "clear",
    arrivalsNormal: 20,
    arrivalsCurrent: 21,
    dischargesPerHr: 14,
    queueLength: 5,
    queueNormal: 5,
    delayHrs: 3,
    expectedDelayHrs: 3,
  },
  {
    id: "maxsaket",
    name: "Max Super Speciality Hospital",
    sector: "private",
    specialty: { en: "Oncology & Multi-specialty Care", hi: "ऑन्कोलॉजी एवं बहु-विशेषज्ञता देखभाल" },
    lat: 28.5245,
    lng: 77.2066,
    bedsTotal: 530,
    bedsOccupied: occ(530, 91),
    staffTotal: 180,
    staffPresent: 120,
    stockPct: 45,
    roadStatus: "congested",
    arrivalsNormal: 15,
    arrivalsCurrent: 20,
    dischargesPerHr: 9,
    queueLength: 12,
    queueNormal: 6,
    delayHrs: 7,
    expectedDelayHrs: 4,
  },
  {
    id: "manipal",
    name: "Manipal Hospital",
    sector: "private",
    specialty: { en: "Multi-specialty Care", hi: "बहु-विशेषज्ञता देखभाल" },
    lat: 28.5921,
    lng: 77.046,
    bedsTotal: 280,
    bedsOccupied: occ(280, 46),
    staffTotal: 95,
    staffPresent: 88,
    stockPct: 70,
    roadStatus: "clear",
    arrivalsNormal: 8,
    arrivalsCurrent: 8,
    dischargesPerHr: 6,
    queueLength: 2,
    queueNormal: 2,
    delayHrs: 2,
    expectedDelayHrs: 2,
  },
  {
    id: "fortisescorts",
    name: "Fortis Escorts Heart Institute",
    sector: "private",
    specialty: { en: "Cardiac Care & Cardiothoracic Surgery", hi: "हृदय देखभाल एवं हृदय शल्य चिकित्सा" },
    lat: 28.5641,
    lng: 77.283,
    bedsTotal: 310,
    bedsOccupied: occ(310, 94),
    staffTotal: 110,
    staffPresent: 70,
    stockPct: 38,
    roadStatus: "blocked",
    arrivalsNormal: 10,
    arrivalsCurrent: 14,
    dischargesPerHr: 6,
    queueLength: 9,
    queueNormal: 5,
    delayHrs: 8,
    expectedDelayHrs: 4,
  },
  {
    id: "blkmax",
    name: "BLK-Max Super Speciality Hospital",
    sector: "private",
    specialty: { en: "Oncology & Bone Marrow Transplant", hi: "ऑन्कोलॉजी एवं बोन मैरो प्रत्यारोपण" },
    lat: 28.6423,
    lng: 77.1876,
    bedsTotal: 650,
    bedsOccupied: occ(650, 76),
    staffTotal: 210,
    staffPresent: 190,
    stockPct: 66,
    roadStatus: "congested",
    arrivalsNormal: 16,
    arrivalsCurrent: 17,
    dischargesPerHr: 11,
    queueLength: 6,
    queueNormal: 5,
    delayHrs: 4,
    expectedDelayHrs: 4,
  },
  {
    id: "aiims",
    name: "All India Institute of Medical Sciences (AIIMS)",
    sector: "govt",
    specialty: { en: "Multi-specialty, Trauma & Research", hi: "बहु-विशेषज्ञता, आघात एवं अनुसंधान" },
    lat: 28.5672,
    lng: 77.21,
    bedsTotal: 2478,
    bedsOccupied: occ(2478, 88),
    staffTotal: 900,
    staffPresent: 770,
    stockPct: 60,
    roadStatus: "congested",
    arrivalsNormal: 60,
    arrivalsCurrent: 75,
    dischargesPerHr: 40,
    queueLength: 35,
    queueNormal: 20,
    delayHrs: 6,
    expectedDelayHrs: 4,
  },
  {
    id: "safdarjung",
    name: "Safdarjung Hospital",
    sector: "govt",
    specialty: { en: "Trauma & General Medicine", hi: "आघात एवं सामान्य चिकित्सा" },
    lat: 28.5686,
    lng: 77.2064,
    bedsTotal: 1531,
    bedsOccupied: occ(1531, 93),
    staffTotal: 600,
    staffPresent: 480,
    stockPct: 42,
    roadStatus: "congested",
    arrivalsNormal: 55,
    arrivalsCurrent: 68,
    dischargesPerHr: 35,
    queueLength: 30,
    queueNormal: 18,
    delayHrs: 7,
    expectedDelayHrs: 4,
  },
  {
    id: "rml",
    name: "Dr. Ram Manohar Lohia (RML) Hospital",
    sector: "govt",
    specialty: { en: "General Medicine & Trauma", hi: "सामान्य चिकित्सा एवं आघात" },
    lat: 28.6259,
    lng: 77.2004,
    bedsTotal: 1100,
    bedsOccupied: occ(1100, 75),
    staffTotal: 420,
    staffPresent: 360,
    stockPct: 55,
    roadStatus: "clear",
    arrivalsNormal: 35,
    arrivalsCurrent: 38,
    dischargesPerHr: 24,
    queueLength: 14,
    queueNormal: 10,
    delayHrs: 5,
    expectedDelayHrs: 4,
  },
  {
    id: "ddu",
    name: "Deen Dayal Upadhyay Hospital",
    sector: "govt",
    specialty: { en: "General Medicine", hi: "सामान्य चिकित्सा" },
    lat: 28.6304,
    lng: 77.1096,
    bedsTotal: 750,
    bedsOccupied: occ(750, 83),
    staffTotal: 280,
    staffPresent: 210,
    stockPct: 35,
    roadStatus: "clear",
    arrivalsNormal: 28,
    arrivalsCurrent: 33,
    dischargesPerHr: 18,
    queueLength: 16,
    queueNormal: 9,
    delayHrs: 6,
    expectedDelayHrs: 4,
  },
  {
    id: "gtb",
    name: "Guru Tegh Bahadur (GTB) Hospital",
    sector: "govt",
    specialty: { en: "Trauma & General Medicine", hi: "आघात एवं सामान्य चिकित्सा" },
    lat: 28.68,
    lng: 77.311,
    bedsTotal: 1500,
    bedsOccupied: occ(1500, 82),
    staffTotal: 520,
    staffPresent: 430,
    stockPct: 50,
    roadStatus: "congested",
    arrivalsNormal: 40,
    arrivalsCurrent: 44,
    dischargesPerHr: 27,
    queueLength: 18,
    queueNormal: 12,
    delayHrs: 5,
    expectedDelayHrs: 4,
  },
];

export const SEED_AMBULANCES: Ambulance[] = [
  { id: "amb7", code: "DL-AMB-07", driver: "Ravi Sharma", lat: 28.6329, lng: 77.2195, status: "available", requestId: null },
  { id: "amb12", code: "DL-AMB-12", driver: "Neha Verma", lat: 28.5504, lng: 77.265, status: "available", requestId: null },
  { id: "amb18", code: "DL-AMB-18", driver: "Imran Khan", lat: 28.61, lng: 77.098, status: "en_route", requestId: null },
  { id: "amb21", code: "DL-AMB-21", driver: "Sunita Rao", lat: 28.6702, lng: 77.301, status: "offline", requestId: null },
];

export const SEED_REQUESTS: AmbulanceRequest[] = [
  {
    id: "req1",
    patientName: "Asha Kumar",
    patientLoc: { lat: 28.6329, lng: 77.2195 },
    note: "Chest pain, conscious",
    hospitalId: "rml",
    ambulanceId: null,
    status: "pending",
    createdAt: Date.now() - 6 * 60 * 1000,
  },
  {
    id: "req2",
    patientName: "Mohan Lal",
    patientLoc: { lat: 28.5504, lng: 77.265 },
    note: "Road accident, bleeding",
    hospitalId: "apollo",
    ambulanceId: null,
    status: "pending",
    createdAt: Date.now() - 12 * 60 * 1000,
  },
];

/** Demo accounts. BACKEND HOOKUP: replace signIn() in store.tsx with your API. */
export const ACCOUNTS: Account[] = [
  { username: "patient", password: "patient123", role: "patient", name: "Asha Kumar" },
  { username: "ambulance", password: "ambulance123", role: "ambulance", name: "Unit DL-AMB-07", ambulanceId: "amb7" },
  { username: "hospital", password: "hospital123", role: "hospital", name: "RML Hospital Admin", hospitalId: "rml" },
  { username: "aiimsadmin", password: "aiims123", role: "hospital", name: "AIIMS Admin", hospitalId: "aiims" },
  { username: "central", password: "central123", role: "central", name: "Central Command, Delhi" },
];

/* ------------------------------- models ------------------------------- */

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const occupancyPct = (h: Hospital) => Math.round((h.bedsOccupied / h.bedsTotal) * 100);
export const bedsAvailable = (h: Hospital) => Math.max(0, h.bedsTotal - h.bedsOccupied);

export interface RiskResult {
  riskScore: number;
  riskLevel: "green" | "amber" | "red";
  overcrowdingInHours: number | null;
  reasons: string[];
  bedForecast: { hour: number; beds: number }[];
  pressures: { arrival: number; occupancy: number; staffing: number; queue: number; delay: number };
}

export function riskModel(h: Hospital): RiskResult {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const currentOccPct = occupancyPct(h);
  const currentBeds = h.bedsOccupied;

  const arrival = clamp(((h.arrivalsCurrent - h.arrivalsNormal) / h.arrivalsNormal) * 100);
  const occupancy = clamp((currentOccPct / OVERCROWD_THRESHOLD_PCT) * 100);
  const staffRatio = h.staffPresent / h.staffTotal;
  const staffing = clamp(((REQUIRED_STAFF_RATIO - staffRatio) / REQUIRED_STAFF_RATIO) * 100);
  const queue = clamp(((h.queueLength - h.queueNormal) / h.queueNormal) * 100);
  const delay = clamp(((h.delayHrs - h.expectedDelayHrs) / h.expectedDelayHrs) * 100);

  const riskScore = Math.round(
    WEIGHTS.arrival * arrival +
      WEIGHTS.occupancy * occupancy +
      WEIGHTS.staffing * staffing +
      WEIGHTS.queue * queue +
      WEIGHTS.delay * delay,
  );
  const riskLevel = riskScore >= 70 ? "red" : riskScore >= 40 ? "amber" : "green";

  const netPerHour = h.arrivalsCurrent - h.dischargesPerHr;
  const bedForecast = [{ hour: 0, beds: currentBeds }];
  let running = currentBeds;
  for (let hr = 1; hr <= 4; hr++) {
    running = Math.max(0, Math.min(h.bedsTotal, running + netPerHour));
    bedForecast.push({ hour: hr, beds: running });
  }

  const thresholdBeds = Math.round((h.bedsTotal * OVERCROWD_THRESHOLD_PCT) / 100);
  let overcrowdingInHours: number | null = null;
  let probe = currentBeds;
  if (probe >= thresholdBeds) overcrowdingInHours = 0;
  else if (netPerHour > 0) {
    for (let hr = 1; hr <= 24; hr++) {
      probe = Math.min(h.bedsTotal, probe + netPerHour);
      if (probe >= thresholdBeds) {
        overcrowdingInHours = hr;
        break;
      }
    }
  }

  const reasons: string[] = [];
  if (arrival > 15)
    reasons.push(`Arrivals are ${Math.round((h.arrivalsCurrent / h.arrivalsNormal - 1) * 100)}% above normal`);
  if (occupancy >= 100) reasons.push(`Occupancy has already passed the ${OVERCROWD_THRESHOLD_PCT}% threshold`);
  else if (occupancy >= 85) reasons.push(`Occupancy is close to the ${OVERCROWD_THRESHOLD_PCT}% threshold`);
  if (staffing > 10) reasons.push(`Staffing is below target coverage (${Math.round(staffRatio * 100)}% of roster present)`);
  if (queue > 15) reasons.push("The admission queue is increasing");
  if (delay > 15) reasons.push("Discharges are taking longer than expected, slowing bed turnover");
  if (reasons.length === 0) reasons.push("No significant risk factors detected right now");

  return {
    riskScore,
    riskLevel,
    overcrowdingInHours,
    reasons,
    bedForecast,
    pressures: {
      arrival: Math.round(arrival),
      occupancy: Math.round(occupancy),
      staffing: Math.round(staffing),
      queue: Math.round(queue),
      delay: Math.round(delay),
    },
  };
}

export function hospitalSortScore(h: Hospital, dist: number) {
  const bedPenaltyKm = (occupancyPct(h) / 100) * 6;
  const roadPenaltyKm = h.roadStatus === "blocked" ? 999 : h.roadStatus === "congested" ? 2 : 0;
  return dist + bedPenaltyKm + roadPenaltyKm;
}

export function rankHospitals(hospitals: Hospital[], from: { lat: number; lng: number }) {
  return hospitals
    .map((h) => {
      const dist = haversine(from.lat, from.lng, h.lat, h.lng);
      return { hospital: h, dist, score: hospitalSortScore(h, dist) };
    })
    .sort((a, b) => a.score - b.score);
}

export const roleHome: Record<Role, string> = {
  patient: "/patient",
  ambulance: "/ambulance",
  hospital: "/hospital",
  central: "/control",
};
