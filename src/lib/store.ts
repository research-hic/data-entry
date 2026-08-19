import {
  ANTIBIOTIC_MASTER,
  ORGANISM_MASTER,
  cancersForType,
  ADMISSION_TYPES,
  COMORBIDITIES,
  CULTURE_TYPES,
  FREQUENCIES,
  INDICATIONS,
  NO_GROWTH,
  OUTCOMES,
  ROUTES,
  THERAPY_TYPES,
  TREATMENTS,
  WARDS,
} from "../data/masters";
import type {
  AWaRe,
  AdmissionType,
  CancerType,
  CultureResult,
  CultureType,
  Frequency,
  Gram,
  Indication,
  Outcome,
  Route,
  Sex,
  TherapyType,
  Ward,
} from "../data/masters";

/* ------------------------------------------------------------------ */
/*  Records (Patients + child tables)                                  */
/* ------------------------------------------------------------------ */

export interface AbxRecord {
  id: string;
  name: string;
  cls: string;
  category: AWaRe;
  route: Route;
  dose: string;
  frequency: Frequency;
  duration: number;
  dot: number; // auto = duration (days of therapy)
  indication: Indication;
  therapyType: TherapyType;
}

export interface CultureRecord {
  id: string;
  cultureSent: boolean;
  date: string;
  type: CultureType;
  result: CultureResult;
  organism: string;
  gram: Gram | "";
  eskaape: boolean;
  astDone: boolean;
  mdr: boolean;
  xdr: boolean;
}

export interface Patient {
  studyId: string; // "P-ID-0001"
  dateOfEntry: string;
  age: number;
  sex: Sex;
  admissionDate: string;
  dischargeDate: string;
  los: number; // auto: discharge - admission
  admissionType: AdmissionType;
  ward: Ward;
  diagnosis: string;
  cancerType: CancerType;
  cancerName: string;
  treatments: string[];
  comorbidities: string[];
  outcome: Outcome;
  readmission30d: boolean;
  deescalation: boolean;
  antibiotics: AbxRecord[];
  cultureSent: boolean;
  cultures: CultureRecord[];
  entrySeconds: number; // how fast this record was typed
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export const todayISO = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const toISO = (d: Date) => {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** LOS = Discharge_Date − Admission_Date (days), or null if invalid. */
export const computeLos = (admission: string, discharge: string): number | null => {
  if (!admission || !discharge) return null;
  const a = new Date(admission).getTime();
  const d = new Date(discharge).getTime();
  if (Number.isNaN(a) || Number.isNaN(d) || d < a) return null;
  return Math.round((d - a) / 86_400_000);
};

export const nextStudyId = (patients: Patient[]): string => {
  const max = patients.reduce((mx, p) => {
    const n = parseInt(p.studyId.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(mx, n) : mx;
  }, 0);
  return `P-ID-${String(max + 1).padStart(4, "0")}`;
};

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

const KEY = "oncotrak.patients.v1";

export const loadPatients = (): Patient[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Patient[]) : [];
  } catch {
    return [];
  }
};

export const savePatients = (patients: Patient[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(patients));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
};

/* ------------------------------------------------------------------ */
/*  Demo data (seeded, reproducible)                                   */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickW = <T,>(rnd: () => number, entries: Array<[T, number]>): T => {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = rnd() * total;
  for (const [value, w] of entries) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
};

const DOSES = ["250 mg", "500 mg", "750 mg", "1 g", "1.5 g", "2 g", "400 mg", "600 mg", "4.5 g", "200 mg"];

export const generateDemoData = (): Patient[] => {
  const rnd = mulberry32(20260212);
  const patients: Patient[] = [];
  const today = new Date();
  const N = 36;

  for (let i = 1; i <= N; i++) {
    const daysAgo = Math.floor(rnd() * 175);
    const admission = new Date(today.getTime() - daysAgo * 86_400_000);
    const los = pickW(rnd, [[2, 3], [4, 6], [6, 8], [8, 8], [12, 6], [16, 4], [22, 3], [30, 2]]);
    const discharge = new Date(admission.getTime() + los * 86_400_000);
    const age = 18 + Math.floor(Math.pow(rnd(), 0.62) * 68);
    const cancerType = pickW<CancerType>(rnd, [["Solid", 11], ["Haematological", 6], ["None / Non-Oncology", 5]]);
    const cancerName = cancerType === "None / Non-Oncology" ? "" : pickW(rnd, cancersForType(cancerType).map((c): [string, number] => [c, 1]));
    const ward = pickW<Ward>(rnd, [["Oncology", 10], ["Surgical", 6], ["ICU", 3], ["Pallative and Supportive Care", 3], ["OPD", 2]]);

    const treatments: string[] = [];
    if (cancerType !== "None / Non-Oncology") {
      const n = 1 + Math.floor(rnd() * 3);
      const pool = [...TREATMENTS];
      for (let k = 0; k < n && pool.length; k++) {
        treatments.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
      }
    }

    const comorbidities: string[] = [];
    if (rnd() < 0.42) {
      comorbidities.push("None");
    } else {
      const pool = COMORBIDITIES.filter((c) => c !== "None");
      const n = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < n && pool.length; k++) {
        comorbidities.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
      }
    }

    /* antibiotics — 0..3 prescriptions */
    const antibiotics: AbxRecord[] = [];
    const nAbx = pickW(rnd, [[0, 4], [1, 9], [2, 7], [3, 3]]);
    const abxPool = [...ANTIBIOTIC_MASTER];
    for (let k = 0; k < nAbx && abxPool.length; k++) {
      const idx = Math.floor(rnd() * abxPool.length);
      const a = abxPool.splice(idx, 1)[0];
      const duration = 3 + Math.floor(rnd() * 11);
      antibiotics.push({
        id: uid(),
        name: a.name,
        cls: a.cls,
        category: a.category,
        route: pickW<Route>(rnd, [["IV", 11], ["Oral", 7], ["IM", 2]]),
        dose: DOSES[Math.floor(rnd() * DOSES.length)],
        frequency: pickW<Frequency>(rnd, [["OD", 5], ["BD", 9], ["TDS", 5], ["QID", 2]]),
        duration,
        dot: duration,
        indication: pickW<Indication>(rnd, [["Empiric", 10], ["Targeted", 5], ["Prophylactic", 4]]),
        therapyType: nAbx > 1 && rnd() < 0.6 ? "Combination" : pickW<TherapyType>(rnd, [["Monotherapy", 7], ["Combination", 3]]),
      });
    }

    /* cultures */
    const cultureSent = rnd() < 0.48;
    const cultures: CultureRecord[] = [];
    if (cultureSent) {
      const nCx = rnd() < 0.72 ? 1 : 2;
      for (let k = 0; k < nCx; k++) {
        const result = pickW<CultureResult>(rnd, [["Positive", 11], ["Negative", 9]]);
        const organism =
          result === "Negative"
            ? NO_GROWTH
            : pickW(rnd, ORGANISM_MASTER.filter((o) => o.name !== NO_GROWTH).map((o): [string, number] => [o.name, o.eskaape ? 3 : 2]));
        const org = ORGANISM_MASTER.find((o) => o.name === organism)!;
        const positive = result === "Positive";
        const astDone = positive && rnd() < 0.82;
        cultures.push({
          id: uid(),
          cultureSent: true,
          date: toISO(new Date(admission.getTime() + Math.floor(rnd() * Math.max(1, los)) * 86_400_000)),
          type: pickW<CultureType>(rnd, [["Blood", 7], ["Urine", 5], ["Sputum", 3], ["Wound", 2], ["Pus", 2], ["BAL", 1], ["Body Fluid", 1], ["Bile", 1]]),
          result,
          organism,
          gram: org.gram ?? "",
          eskaape: positive && org.eskaape,
          astDone,
          mdr: astDone && rnd() < 0.38,
          xdr: astDone && rnd() < 0.14,
        });
      }
    }

    const outcome =
      ward === "Pallative and Supportive Care" && rnd() < 0.4
        ? "Death"
        : pickW<Outcome>(rnd, [["Improved", 13], ["Death", 2], ["DAMA", 1], ["Referred", 1], ["Transferred", 2]]);

    patients.push({
      studyId: `P-ID-${String(i).padStart(4, "0")}`,
      dateOfEntry: toISO(discharge <= today ? discharge : today),
      age,
      sex: rnd() < 0.54 ? "Male" : "Female",
      admissionDate: toISO(admission),
      dischargeDate: toISO(discharge),
      los,
      admissionType: pickW(rnd, [...ADMISSION_TYPES.map((t): [AdmissionType, number] => [t, t === "Emergency" ? 7 : t === "Elective" ? 6 : 3])]),
      ward,
      diagnosis: cancerName
        ? `${cancerName} ${cancerType === "Solid" ? "carcinoma" : ""}`.trim()
        : pickW(rnd, [["Febrile neutropenia", 3], ["Surgical site infection", 2], ["Cellulitis", 2], ["UTI", 2], ["Pneumonia", 2], ["Anaemia workup", 1]]) as string,
      cancerType,
      cancerName,
      treatments,
      comorbidities,
      outcome,
      readmission30d: rnd() < 0.16,
      deescalation: antibiotics.length > 0 && rnd() < 0.34,
      antibiotics,
      cultureSent,
      cultures,
      entrySeconds: 22 + Math.floor(rnd() * 55),
    });
  }
  return patients.reverse(); // newest first
};
