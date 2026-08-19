/* ------------------------------------------------------------------ */
/*  Master_Validations — lookup tables (Table 4 of the schema)         */
/* ------------------------------------------------------------------ */

export type AWaRe = "Access" | "Watch" | "Reserve";
export type Gram = "Gram Positive" | "Gram Negative";

export interface AntibioticMaster {
  name: string;
  cls: string;
  category: AWaRe;
}

export const ANTIBIOTIC_MASTER: AntibioticMaster[] = [
  // ---- ACCESS ----
  { name: "Amoxicillin", cls: "Penicillin", category: "Access" },
  { name: "Amoxicillin + Clavulanic acid", cls: "β-lactam combination", category: "Access" },
  { name: "Ampicillin", cls: "Penicillin", category: "Access" },
  { name: "Cefazolin", cls: "Cephalosporin · 1st gen", category: "Access" },
  { name: "Cefalexin", cls: "Cephalosporin · 1st gen", category: "Access" },
  { name: "Cefixime", cls: "Cephalosporin · 3rd gen", category: "Access" },
  { name: "Ceftriaxone", cls: "Cephalosporin · 3rd gen", category: "Access" },
  { name: "Cloxacillin", cls: "Penicillin · anti-staph", category: "Access" },
  { name: "Doxycycline", cls: "Tetracycline", category: "Access" },
  { name: "Metronidazole", cls: "Nitroimidazole", category: "Access" },
  { name: "Nitrofurantoin", cls: "Nitrofuran", category: "Access" },
  // ---- WATCH ----
  { name: "Azithromycin", cls: "Macrolide", category: "Watch" },
  { name: "Cefepime", cls: "Cephalosporin · 4th gen", category: "Watch" },
  { name: "Cefotaxime", cls: "Cephalosporin · 3rd gen", category: "Watch" },
  { name: "Cefoxitin", cls: "Cephamycin · 2nd gen", category: "Watch" },
  { name: "Cefpodoxime", cls: "Cephalosporin · 3rd gen", category: "Watch" },
  { name: "Ceftazidime", cls: "Cephalosporin · 3rd gen", category: "Watch" },
  { name: "Ciprofloxacin", cls: "Fluoroquinolone", category: "Watch" },
  { name: "Clarithromycin", cls: "Macrolide", category: "Watch" },
  { name: "Levofloxacin", cls: "Fluoroquinolone", category: "Watch" },
  { name: "Meropenem", cls: "Carbapenem", category: "Watch" },
  { name: "Imipenem + Cilastatin", cls: "Carbapenem", category: "Watch" },
  { name: "Piperacillin + Tazobactam", cls: "β-lactam combination", category: "Watch" },
  { name: "Vancomycin", cls: "Glycopeptide", category: "Watch" },
  { name: "Teicoplanin", cls: "Glycopeptide", category: "Watch" },
  { name: "Linezolid", cls: "Oxazolidinone", category: "Watch" },
  { name: "Amikacin", cls: "Aminoglycoside", category: "Watch" },
  // ---- RESERVE ----
  { name: "Aztreonam", cls: "Monobactam", category: "Reserve" },
  { name: "Colistin", cls: "Polymyxin", category: "Reserve" },
  { name: "Polymyxin B", cls: "Polymyxin", category: "Reserve" },
  { name: "Tigecycline", cls: "Glycylcycline", category: "Reserve" },
  { name: "Daptomycin", cls: "Lipopeptide", category: "Reserve" },
  { name: "Ceftazidime + Avibactam", cls: "Cephalosporin + BLI", category: "Reserve" },
  { name: "Ceftolozane + Tazobactam", cls: "Cephalosporin + BLI", category: "Reserve" },
];

export const ANTIBIOTIC_BY_NAME = new Map(
  ANTIBIOTIC_MASTER.map((a) => [a.name.toLowerCase(), a]),
);

/* ------------------------------------------------------------------ */

export interface OrganismMaster {
  name: string;
  gram: Gram | null;
  eskaape: boolean;
}

export const NO_GROWTH = "Negative / No growth";

export const ORGANISM_MASTER: OrganismMaster[] = [
  // ---- ESKAPE pathogens ----
  { name: "Escherichia coli", gram: "Gram Negative", eskaape: true },
  { name: "Klebsiella pneumoniae", gram: "Gram Negative", eskaape: true },
  { name: "Pseudomonas aeruginosa", gram: "Gram Negative", eskaape: true },
  { name: "Acinetobacter baumannii", gram: "Gram Negative", eskaape: true },
  { name: "Staphylococcus aureus", gram: "Gram Positive", eskaape: true },
  { name: "Enterococcus faecium", gram: "Gram Positive", eskaape: true },
  // ---- Non-ESKAPE ----
  { name: "Enterococcus faecalis", gram: "Gram Positive", eskaape: false },
  { name: "Citrobacter spp.", gram: "Gram Negative", eskaape: false },
  { name: "Streptococcus spp.", gram: "Gram Positive", eskaape: false },
  { name: NO_GROWTH, gram: null, eskaape: false },
];

export const ORGANISM_BY_NAME = new Map(
  ORGANISM_MASTER.map((o) => [o.name.toLowerCase(), o]),
);

/* ------------------------------------------------------------------ */

export interface CancerMaster {
  name: string;
  type: "Solid" | "Haematological";
}

export const CANCER_MASTER: CancerMaster[] = [
  ...[
    "Lung", "Breast", "Stomach", "Colon", "Cervix", "Ovarian", "Liver",
    "Pancreatic", "Oral cavity", "Thyroid", "Prostate", "Rectum",
    "Gallbladder", "Urothelial", "Brain", "Renal", "Esophagus",
  ].map((name) => ({ name, type: "Solid" as const })),
  ...[
    { name: "Leukemia", type: "Haematological" as const },
    { name: "Lymphoma", type: "Haematological" as const },
    { name: "Multiple myeloma", type: "Haematological" as const },
  ],
];

export const cancersForType = (type: string) =>
  CANCER_MASTER.filter((c) => c.type === type).map((c) => c.name);

/* ------------------------------------------------------------------ */
/*  Enum lists                                                         */
/* ------------------------------------------------------------------ */

export const SEXES = ["Male", "Female"] as const;
export const ADMISSION_TYPES = ["Elective", "Emergency", "OPD"] as const;
export const WARDS = [
  "Surgical",
  "Oncology",
  "Pallative and Supportive Care",
  "ICU",
  "OPD",
] as const;
export const OUTCOMES = ["Improved", "Death", "DAMA", "Referred", "Transferred"] as const;
export const ROUTES = ["IV", "Oral", "IM"] as const;
export const FREQUENCIES = ["OD", "BD", "TDS", "QID"] as const;
export const INDICATIONS = ["Empiric", "Targeted", "Prophylactic"] as const;
export const THERAPY_TYPES = ["Monotherapy", "Combination"] as const;
export const CULTURE_TYPES = [
  "Blood", "Urine", "Sputum", "Wound", "Pus", "Bile", "Body Fluid", "BAL",
] as const;
export const CULTURE_RESULTS = ["Positive", "Negative"] as const;
export const TREATMENTS = [
  "Surgery", "Chemotherapy", "Radiotherapy",
  "Targeted Therapy", "Immunotherapy", "Supportive Care",
] as const;
export const COMORBIDITIES = [
  "None", "Diabetes", "Hypertension", "COPD", "Hypothyroidism",
  "Dyslipidemia", "Hepatitis", "Stroke", "Depression",
] as const;
export const CANCER_TYPES = ["Solid", "Haematological", "None / Non-Oncology"] as const;

export type Sex = (typeof SEXES)[number];
export type AdmissionType = (typeof ADMISSION_TYPES)[number];
export type Ward = (typeof WARDS)[number];
export type Outcome = (typeof OUTCOMES)[number];
export type Route = (typeof ROUTES)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type Indication = (typeof INDICATIONS)[number];
export type TherapyType = (typeof THERAPY_TYPES)[number];
export type CultureType = (typeof CULTURE_TYPES)[number];
export type CultureResult = (typeof CULTURE_RESULTS)[number];
export type CancerType = (typeof CANCER_TYPES)[number];

/* AWaRe semantic colors — reused everywhere (pills, charts, bars) */
export const AWARE_COLOR: Record<AWaRe, string> = {
  Access: "#28b468",
  Watch: "#e09a24",
  Reserve: "#dd5c5c",
};

export const MAX_ANTIBIOTICS = 5;
export const MAX_CULTURES = 4;
