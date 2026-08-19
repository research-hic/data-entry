import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ADMISSION_TYPES,
  ANTIBIOTIC_BY_NAME,
  ANTIBIOTIC_MASTER,
  CANCER_TYPES,
  COMORBIDITIES,
  CULTURE_TYPES,
  FREQUENCIES,
  INDICATIONS,
  MAX_ANTIBIOTICS,
  MAX_CULTURES,
  NO_GROWTH,
  ORGANISM_BY_NAME,
  ORGANISM_MASTER,
  OUTCOMES,
  ROUTES,
  SEXES,
  THERAPY_TYPES,
  TREATMENTS,
  WARDS,
  cancersForType,
} from "../data/masters";
import type {
  AdmissionType,
  CancerType,
  CultureResult,
  CultureType,
  Frequency,
  Indication,
  Outcome,
  Route,
  Sex,
  TherapyType,
  Ward,
} from "../data/masters";
import type { Patient } from "../lib/store";
import { computeLos, fmtDate, todayISO, uid } from "../lib/store";
import {
  Btn,
  CategoryPill,
  ChipGroup,
  Combobox,
  Field,
  IconCapsule,
  IconCheck,
  IconFlask,
  IconPlus,
  IconTimer,
  IconTrash,
  Segmented,
  SelectShell,
  Toggle,
  cx,
  inputCls,
  inputErrCls,
} from "./ui";

/* ---------------- draft shapes ---------------- */

interface DraftAbx {
  id: string;
  name: string;
  route: Route;
  dose: string;
  frequency: Frequency;
  duration: string;
  indication: Indication;
  therapyType: TherapyType;
}

interface DraftCulture {
  id: string;
  date: string;
  type: CultureType;
  result: CultureResult;
  organism: string;
  astDone: boolean;
  mdr: boolean;
  xdr: boolean;
}

const newAbx = (): DraftAbx => ({
  id: uid(),
  name: "",
  route: "IV",
  dose: "",
  frequency: "BD",
  duration: "",
  indication: "Empiric",
  therapyType: "Monotherapy",
});

const newCulture = (): DraftCulture => ({
  id: uid(),
  date: todayISO(),
  type: "Blood",
  result: "Positive",
  organism: "",
  astDone: false,
  mdr: false,
  xdr: false,
});

const emptyDraft = () => ({
  age: "",
  sex: null as Sex | null,
  admissionDate: "",
  dischargeDate: "",
  admissionType: null as AdmissionType | null,
  ward: null as Ward | null,
  diagnosis: "",
  cancerType: null as CancerType | null,
  cancerName: "",
  treatments: [] as string[],
  comorbidities: [] as string[],
  outcome: null as Outcome | null,
  readmission30d: false,
  deescalation: false,
  abx: [] as DraftAbx[],
  cultureSent: false,
  cultures: [] as DraftCulture[],
});

/* ---------------- small pieces ---------------- */

function SectionHead({
  n,
  title,
  desc,
  right,
}: {
  n: string;
  title: string;
  desc: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex h-7 w-9 items-center justify-center rounded-md bg-pine-800 font-mono text-[11px] font-semibold text-paper">
        {n}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-[16px] font-bold leading-tight tracking-tight">
          {title}
        </h2>
        <p className="text-[11.5px] leading-tight text-ink-400">{desc}</p>
      </div>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cx(
        "rounded-lg border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(12,22,19,0.05)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

/* ================================================================== */

export default function EntryForm({
  nextId,
  onSave,
  onFail,
}: {
  nextId: string;
  onSave: (p: Patient, seconds: number) => void;
  onFail: (n: number) => void;
}) {
  const [d, setD] = useState(emptyDraft);
  const [attempted, setAttempted] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [seconds, setSeconds] = useState(0);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  /* entry timer */
  useEffect(() => {
    const t = window.setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      500,
    );
    return () => window.clearInterval(t);
  }, [startedAt]);

  const patch = (p: Partial<ReturnType<typeof emptyDraft>>) =>
    setD((prev) => ({ ...prev, ...p }));

  const los = computeLos(d.admissionDate, d.dischargeDate);

  /* ------------- antibiotics ------------- */
  const setAbx = (id: string, p: Partial<DraftAbx>) =>
    patch({ abx: d.abx.map((a) => (a.id === id ? { ...a, ...p } : a)) });

  const pickAbx = (id: string, name: string) => setAbx(id, { name });

  /* ------------- cultures ------------- */
  const setCx = (id: string, p: Partial<DraftCulture>) =>
    patch({ cultures: d.cultures.map((c) => (c.id === id ? { ...c, ...p } : c)) });

  const pickOrganism = (id: string, name: string) => setCx(id, { organism: name });

  const setResult = (id: string, result: CultureResult) => {
    if (result === "Negative") {
      setCx(id, { result, organism: NO_GROWTH, astDone: false, mdr: false, xdr: false });
    } else {
      setCx(id, { result, organism: "" });
    }
  };

  const toggleCultureSent = (on: boolean) => {
    patch({ cultureSent: on, cultures: on && d.cultures.length === 0 ? [newCulture()] : d.cultures });
  };

  /* ------------- validation ------------- */
  const errors = useMemo(() => {
    if (!attempted) return {} as Record<string, string>;
    const e: Record<string, string> = {};
    const age = Number(d.age);
    if (!d.age || !Number.isFinite(age) || age <= 0 || age > 120) e.age = "Valid age required";
    if (!d.sex) e.sex = "Required";
    if (!d.admissionDate) e.admissionDate = "Required";
    if (!d.dischargeDate) e.dischargeDate = "Required";
    else if (los === null) e.dischargeDate = "Must be ≥ admission date";
    if (!d.admissionType) e.admissionType = "Required";
    if (!d.ward) e.ward = "Required";
    if (!d.outcome) e.outcome = "Required";
    if (!d.cancerType) e.cancerType = "Required";
    if (d.cancerType && d.cancerType !== "None / Non-Oncology" && !d.cancerName)
      e.cancerName = "Pick the primary cancer";
    d.abx.forEach((a) => {
      if (!a.name) e[`abx:${a.id}`] = "Select an antibiotic";
      const dur = Number(a.duration);
      if (!a.duration || !Number.isFinite(dur) || dur <= 0) e[`abx:${a.id}:dur`] = "Days?";
    });
    if (d.cultureSent) {
      d.cultures.forEach((c) => {
        if (!c.date) e[`cx:${c.id}:date`] = "Required";
        if (c.result === "Positive" && !c.organism) e[`cx:${c.id}:org`] = "Select organism";
      });
    }
    return e;
  }, [attempted, d, los]);

  const err = (k: string) => errors[k];

  /* ------------- save / reset ------------- */
  const reset = (freshTimer: boolean) => {
    setD(emptyDraft());
    setAttempted(false);
    setJustSavedId(null);
    if (freshTimer) {
      setStartedAt(Date.now());
      setSeconds(0);
    }
    formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = () => {
    const e: Record<string, string> = {};
    setAttempted(true);
    const age = Number(d.age);
    if (!d.age || !Number.isFinite(age) || age <= 0 || age > 120) e.age = "Valid age required";
    if (!d.sex) e.sex = "Required";
    if (!d.admissionDate) e.admissionDate = "Required";
    if (!d.dischargeDate) e.dischargeDate = "Required";
    else if (los === null) e.dischargeDate = "Must be ≥ admission date";
    if (!d.admissionType) e.admissionType = "Required";
    if (!d.ward) e.ward = "Required";
    if (!d.outcome) e.outcome = "Required";
    if (!d.cancerType) e.cancerType = "Required";
    if (d.cancerType && d.cancerType !== "None / Non-Oncology" && !d.cancerName)
      e.cancerName = "Pick the primary cancer";
    d.abx.forEach((a) => {
      if (!a.name) e[`abx:${a.id}`] = "Select an antibiotic";
      const dur = Number(a.duration);
      if (!a.duration || !Number.isFinite(dur) || dur <= 0) e[`abx:${a.id}:dur`] = "Days?";
    });
    if (d.cultureSent) {
      d.cultures.forEach((c) => {
        if (!c.date) e[`cx:${c.id}:date`] = "Required";
        if (c.result === "Positive" && !c.organism) e[`cx:${c.id}:org`] = "Select organism";
      });
    }
    if (Object.keys(e).length > 0) {
      onFail(Object.keys(e).length);
      window.setTimeout(() => {
        document.querySelector('[data-err="1"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
      return;
    }

    const secs = Math.floor((Date.now() - startedAt) / 1000);
    const patient: Patient = {
      studyId: nextId,
      dateOfEntry: todayISO(),
      age,
      sex: d.sex!,
      admissionDate: d.admissionDate,
      dischargeDate: d.dischargeDate,
      los: los!,
      admissionType: d.admissionType!,
      ward: d.ward!,
      diagnosis: d.diagnosis.trim(),
      cancerType: d.cancerType!,
      cancerName: d.cancerType === "None / Non-Oncology" ? "" : d.cancerName,
      treatments: d.cancerType === "None / Non-Oncology" ? [] : d.treatments,
      comorbidities: d.comorbidities,
      outcome: d.outcome!,
      readmission30d: d.readmission30d,
      deescalation: d.deescalation,
      antibiotics: d.abx.map((a) => {
        const master = ANTIBIOTIC_BY_NAME.get(a.name.toLowerCase())!;
        const duration = Number(a.duration);
        return {
          id: a.id,
          name: master.name,
          cls: master.cls,
          category: master.category,
          route: a.route,
          dose: a.dose.trim() || "—",
          frequency: a.frequency,
          duration,
          dot: duration, // DOT auto = duration in days
          indication: a.indication,
          therapyType: a.therapyType,
        };
      }),
      cultureSent: d.cultureSent,
      cultures: d.cultureSent
        ? d.cultures.map((c) => {
            const org = ORGANISM_BY_NAME.get(c.organism.toLowerCase());
            return {
              id: c.id,
              cultureSent: true,
              date: c.date,
              type: c.type,
              result: c.result,
              organism: c.organism,
              gram: org?.gram ?? "",
              eskaape: c.result === "Positive" ? org?.eskaape ?? false : false,
              astDone: c.astDone,
              mdr: c.mdr,
              xdr: c.xdr,
            };
          })
        : [],
      entrySeconds: secs,
    };

    onSave(patient, secs);
    reset(true);
    setJustSavedId(nextId);
    if (secs <= 60) {
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({
          particleCount: 70,
          spread: 62,
          startVelocity: 26,
          gravity: 1.1,
          scalar: 0.85,
          origin: { x: 0.85, y: 0.85 },
          colors: ["#28b468", "#e09a24", "#0e8a64", "#f2f5f3"],
          disableForReducedMotion: true,
        });
      });
    }
  };

  /* Cmd/Ctrl + Enter saves */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const timerTone =
    seconds < 45 ? "text-moss-600" : seconds <= 60 ? "text-wat-600" : "text-res-600";

  const cancerOptions =
    d.cancerType && d.cancerType !== "None / Non-Oncology" ? cancersForType(d.cancerType) : [];

  return (
    <div ref={formRef} className="mx-auto max-w-5xl">
      {/* ---------- form header : next ID + timer ---------- */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-400">
            Next study ID · auto-assigned on save
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1
              key={justSavedId ?? nextId}
              className="anim-pop font-display text-[34px] font-extrabold leading-none tracking-tight text-pine-900"
            >
              {nextId}
            </h1>
            {justSavedId && (
              <span className="anim-slide-down inline-flex items-center gap-1 rounded-full bg-acc-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-acc-700 ring-1 ring-inset ring-acc-500/30">
                <IconCheck size={11} /> {justSavedId} filed
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] text-ink-400">
            Date of entry · <span className="font-semibold text-ink-700">{fmtDate(todayISO())}</span>
          </p>
        </div>

        <div
          className={cx(
            "flex items-center gap-2.5 rounded-lg border border-line bg-panel px-3.5 py-2 shadow-[0_1px_2px_rgba(12,22,19,0.05)]",
            seconds > 60 && "border-res-500/50",
          )}
        >
          <IconTimer size={17} className={timerTone} />
          <div>
            <p key={seconds} className={cx("anim-pop font-mono text-[19px] font-semibold leading-none tabular-nums", timerTone)}>
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </p>
            <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-400">
              target &lt; 60 s {seconds > 60 && <span className="font-bold text-res-600">· over</span>}
            </p>
          </div>
          <span
            className={cx(
              "ml-1 h-2 w-2 rounded-full",
              seconds > 60 ? "bg-res-500 anim-pulse-soft" : "bg-moss-500 anim-pulse-soft",
            )}
          />
        </div>
      </div>

      <div className="space-y-4 pb-4">
        {/* ================= 01 · DEMOGRAPHICS ================= */}
        <Card>
          <SectionHead
            n="01"
            title="Demographics & Admission"
            desc="LOS is computed the moment both dates are set"
            right={
              los !== null && (
                <span
                  key={los}
                  className="anim-pop inline-flex items-center gap-1.5 rounded-full bg-moss-100 px-3 py-1 font-mono text-[12px] font-semibold text-moss-700 ring-1 ring-inset ring-moss-500/30"
                >
                  LOS {los} day{los === 1 ? "" : "s"}
                </span>
              )
            }
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4">
            <Field label="Age (yrs)" required error={err("age")}>
              <input
                type="number"
                min={0}
                max={120}
                value={d.age}
                autoFocus
                onChange={(e) => patch({ age: e.target.value })}
                placeholder="58"
                className={cx(inputCls, "font-mono", err("age") && inputErrCls)}
              />
            </Field>
            <Field label="Sex" required error={err("sex")} className="col-span-1 md:col-span-2">
              <Segmented options={SEXES} value={d.sex} onChange={(sex) => patch({ sex })} error={!!err("sex")} full />
            </Field>
            <Field label="Outcome" required error={err("outcome")}>
              <SelectShell>
                <select
                  value={d.outcome ?? ""}
                  onChange={(e) => patch({ outcome: (e.target.value || null) as Outcome | null })}
                  className={cx(inputCls, "cursor-pointer", err("outcome") && inputErrCls)}
                >
                  <option value="" disabled>Select…</option>
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </SelectShell>
            </Field>

            <Field label="Admission date" required error={err("admissionDate")}>
              <input
                type="date"
                value={d.admissionDate}
                max={todayISO()}
                onChange={(e) => patch({ admissionDate: e.target.value })}
                className={cx(inputCls, "font-mono text-[13px]", err("admissionDate") && inputErrCls)}
              />
            </Field>
            <Field label="Discharge date" required error={err("dischargeDate")}>
              <input
                type="date"
                value={d.dischargeDate}
                min={d.admissionDate || undefined}
                onChange={(e) => patch({ dischargeDate: e.target.value })}
                className={cx(inputCls, "font-mono text-[13px]", err("dischargeDate") && inputErrCls)}
              />
            </Field>
            <Field label="Admission type" required error={err("admissionType")}>
              <Segmented options={ADMISSION_TYPES} value={d.admissionType} onChange={(admissionType) => patch({ admissionType })} error={!!err("admissionType")} full />
            </Field>
            <Field label="Ward" required error={err("ward")}>
              <SelectShell>
                <select
                  value={d.ward ?? ""}
                  onChange={(e) => patch({ ward: (e.target.value || null) as Ward | null })}
                  className={cx(inputCls, "cursor-pointer", err("ward") && inputErrCls)}
                >
                  <option value="" disabled>Select…</option>
                  {WARDS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </SelectShell>
            </Field>

            <Field label="Diagnosis (working)" className="col-span-2" hint="free text">
              <input
                value={d.diagnosis}
                onChange={(e) => patch({ diagnosis: e.target.value })}
                placeholder="e.g. Febrile neutropenia, SSI…"
                className={inputCls}
              />
            </Field>
            <Field label="Readmission ≤ 30 d" hint="yes / no">
              <div className="flex h-9 items-center">
                <Toggle checked={d.readmission30d} onChange={(readmission30d) => patch({ readmission30d })} label={d.readmission30d ? "Yes" : "No"} />
              </div>
            </Field>
            <Field label="ABx de-escalation" hint="IV→oral / narrowed">
              <div className="flex h-9 items-center">
                <Toggle checked={d.deescalation} onChange={(deescalation) => patch({ deescalation })} label={d.deescalation ? "Yes" : "No"} />
              </div>
            </Field>
          </div>
        </Card>

        {/* ================= 02 · ONCOLOGY PROFILE ================= */}
        <Card>
          <SectionHead
            n="02"
            title="Oncology Profile"
            desc="Cancer name list cascades from the selected type"
          />
          <div className="grid grid-cols-1 gap-x-3 gap-y-4 lg:grid-cols-2">
            <Field label="Cancer type" required error={err("cancerType")}>
              <Segmented
                options={CANCER_TYPES}
                value={d.cancerType}
                onChange={(cancerType) => patch({ cancerType, cancerName: "", treatments: cancerType === "None / Non-Oncology" ? [] : d.treatments })}
                error={!!err("cancerType")}
                full
              />
            </Field>
            <Field
              label="Cancer name"
              required={d.cancerType !== null && d.cancerType !== "None / Non-Oncology"}
              error={err("cancerName")}
              hint={d.cancerType === null ? "select type first" : d.cancerType === "None / Non-Oncology" ? "n/a" : `${cancerOptions.length} options`}
            >
              <SelectShell>
                <select
                  value={d.cancerName}
                  disabled={!d.cancerType || d.cancerType === "None / Non-Oncology"}
                  onChange={(e) => patch({ cancerName: e.target.value })}
                  className={cx(inputCls, "cursor-pointer disabled:cursor-not-allowed", err("cancerName") && inputErrCls)}
                >
                  <option value="" disabled>
                    {d.cancerType === null || d.cancerType === "None / Non-Oncology" ? "—" : "Select…"}
                  </option>
                  {cancerOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </SelectShell>
            </Field>
            <Field label="Treatment received" className="lg:col-span-2" hint={d.cancerType === "None / Non-Oncology" ? "locked — non-oncology" : "multi-select"}>
              <div className={cx(d.cancerType === "None / Non-Oncology" && "pointer-events-none opacity-40")}>
                <ChipGroup options={TREATMENTS} values={d.treatments} onChange={(treatments) => patch({ treatments })} />
              </div>
            </Field>
            <Field label="Comorbidities" className="lg:col-span-2" hint="“None” is exclusive">
              <ChipGroup options={COMORBIDITIES} values={d.comorbidities} onChange={(comorbidities) => patch({ comorbidities })} noneExclusive />
            </Field>
          </div>
        </Card>

        {/* ================= 03 · ANTIBIOTICS ================= */}
        <Card>
          <SectionHead
            n="03"
            title="Antibiotic Therapy"
            desc="Class & AWaRe category auto-fill from master and lock"
            right={
              <span className="font-mono text-[11px] font-semibold text-ink-400">
                {d.abx.length}/{MAX_ANTIBIOTICS} Rx
              </span>
            }
          />

          {d.abx.length === 0 && (
            <div className="mb-3 flex items-center gap-2.5 rounded-md border border-dashed border-linedark bg-paper px-3 py-2.5 text-[12.5px] text-ink-400">
              <IconCapsule size={16} className="text-ink-300" />
              No antibiotics prescribed — leave empty to skip this section.
            </div>
          )}

          <div className="space-y-3">
            {d.abx.map((a, idx) => {
              const master = a.name ? ANTIBIOTIC_BY_NAME.get(a.name.toLowerCase()) : undefined;
              return (
                <div key={a.id} className="anim-row-in rounded-md border border-line bg-paper/60 p-3">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pine-700">
                      Rx {idx + 1}
                    </span>
                    <CategoryPill category={master?.category ?? ""} />
                    <button
                      type="button"
                      onClick={() => patch({ abx: d.abx.filter((x) => x.id !== a.id) })}
                      className="ml-auto rounded p-1 text-ink-300 transition-colors hover:bg-res-50 hover:text-res-600"
                      title="Remove antibiotic"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-6">
                    <Field label="Antibiotic" required error={err(`abx:${a.id}`)} className="col-span-2 md:col-span-3">
                      <Combobox
                        options={ANTIBIOTIC_MASTER.map((m) => ({
                          value: m.name,
                          meta: (
                            <span className={cx("shrink-0 rounded-full px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase", m.category === "Access" ? "bg-acc-100 text-acc-700" : m.category === "Watch" ? "bg-wat-100 text-wat-700" : "bg-res-100 text-res-700")}>
                              {m.category}
                            </span>
                          ),
                        }))}
                        value={a.name}
                        onValue={(v) => pickAbx(a.id, v)}
                        error={!!err(`abx:${a.id}`)}
                        placeholder="Search 34 agents…"
                      />
                    </Field>
                    <Field label="Class (auto)" className="col-span-2 md:col-span-3">
                      <div
                        key={a.name || "empty"}
                        className={cx(
                          "flex h-9 items-center rounded-md border border-dashed border-linedark bg-panel px-2.5 text-[13px]",
                          master ? "anim-flash font-semibold text-pine-700" : "text-ink-300",
                        )}
                      >
                        {master ? master.cls : "fills on selection"}
                      </div>
                    </Field>

                    <Field label="Route">
                      <Segmented options={ROUTES} value={a.route} onChange={(route) => setAbx(a.id, { route })} full />
                    </Field>
                    <Field label="Dose">
                      <input
                        value={a.dose}
                        onChange={(e) => setAbx(a.id, { dose: e.target.value })}
                        placeholder="1 g"
                        className={cx(inputCls, "font-mono text-[13px]")}
                      />
                    </Field>
                    <Field label="Frequency">
                      <Segmented options={FREQUENCIES} value={a.frequency} onChange={(frequency) => setAbx(a.id, { frequency })} full />
                    </Field>
                    <Field label="Duration (d)" required error={err(`abx:${a.id}:dur`)}>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          value={a.duration}
                          onChange={(e) => setAbx(a.id, { duration: e.target.value })}
                          placeholder="7"
                          className={cx(inputCls, "font-mono", err(`abx:${a.id}:dur`) && inputErrCls)}
                        />
                      </div>
                    </Field>
                    <Field label="DOT (auto)" hint="= duration">
                      <div key={a.duration || "dot"} className="anim-pop flex h-9 items-center rounded-md bg-moss-50 px-2.5 font-mono text-[13px] font-semibold text-moss-700 ring-1 ring-inset ring-moss-500/25">
                        {a.duration && Number(a.duration) > 0 ? `${a.duration} d` : "—"}
                      </div>
                    </Field>
                    <Field label="Indication">
                      <Segmented options={INDICATIONS} value={a.indication} onChange={(indication) => setAbx(a.id, { indication })} full />
                    </Field>
                    <Field label="Therapy type" className="col-span-2 md:col-span-3">
                      <Segmented options={THERAPY_TYPES} value={a.therapyType} onChange={(therapyType) => setAbx(a.id, { therapyType })} full />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={d.abx.length >= MAX_ANTIBIOTICS}
            onClick={() => patch({ abx: [...d.abx, newAbx()] })}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-moss-600/50 px-3.5 text-[13px] font-semibold text-moss-700 transition-all hover:border-moss-600 hover:bg-moss-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconPlus size={14} /> Add antibiotic
            <span className="font-mono text-[11px] font-medium text-ink-400">
              {d.abx.length}/{MAX_ANTIBIOTICS}
            </span>
          </button>
        </Card>

        {/* ================= 04 · CULTURES ================= */}
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-7 w-9 items-center justify-center rounded-md bg-pine-800 font-mono text-[11px] font-semibold text-paper">
              04
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-[16px] font-bold leading-tight tracking-tight">
                Microbiology & Cultures
              </h2>
              <p className="text-[11.5px] leading-tight text-ink-400">
                Gram stain & ESKAPE flag auto-fill from the organism master
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2.5 rounded-md border border-line bg-paper px-3 py-1.5">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">
                Culture sent?
              </span>
              <Toggle checked={d.cultureSent} onChange={toggleCultureSent} label={d.cultureSent ? "Yes" : "No"} />
            </div>
          </div>

          {d.cultureSent && (
            <div className="anim-slide-down mt-4">
              <div className="space-y-3">
                {d.cultures.map((c, idx) => {
                  const org = c.organism ? ORGANISM_BY_NAME.get(c.organism.toLowerCase()) : undefined;
                  const positive = c.result === "Positive";
                  return (
                    <div key={c.id} className="anim-row-in rounded-md border border-line bg-paper/60 p-3">
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pine-700">
                          Culture {idx + 1}
                        </span>
                        <IconFlask size={13} className="text-ink-300" />
                        {positive && org && (
                          <span key={c.organism} className={cx("anim-pop inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide ring-1 ring-inset", org.eskaape ? "bg-res-100 text-res-700 ring-res-500/30" : "bg-acc-100 text-acc-700 ring-acc-500/30")}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {org.eskaape ? "ESKAPE" : "non-ESKAPE"}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => patch({ cultures: d.cultures.filter((x) => x.id !== c.id) })}
                          className="ml-auto rounded p-1 text-ink-300 transition-colors hover:bg-res-50 hover:text-res-600"
                          title="Remove culture"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-6">
                        <Field label="Date" required error={err(`cx:${c.id}:date`)}>
                          <input
                            type="date"
                            value={c.date}
                            max={todayISO()}
                            onChange={(e) => setCx(c.id, { date: e.target.value })}
                            className={cx(inputCls, "font-mono text-[13px]", err(`cx:${c.id}:date`) && inputErrCls)}
                          />
                        </Field>
                        <Field label="Specimen type">
                          <SelectShell>
                            <select
                              value={c.type}
                              onChange={(e) => setCx(c.id, { type: e.target.value as CultureType })}
                              className={cx(inputCls, "cursor-pointer")}
                            >
                              {CULTURE_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </SelectShell>
                        </Field>
                        <Field label="Result">
                          <Segmented
                            options={["Positive", "Negative"] as const}
                            value={c.result}
                            onChange={(r) => setResult(c.id, r)}
                            activeCls={positive ? "bg-res-600 text-paper shadow-sm" : "bg-acc-600 text-paper shadow-sm"}
                            full
                          />
                        </Field>
                        <Field label="Organism" required={positive} error={err(`cx:${c.id}:org`)} className="col-span-2 md:col-span-3">
                          {positive ? (
                            <Combobox
                              options={ORGANISM_MASTER.filter((o) => o.name !== NO_GROWTH).map((o) => ({
                                value: o.name,
                                meta: (
                                  <span className="flex shrink-0 items-center gap-1">
                                    <span className={cx("rounded-full px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase", o.gram === "Gram Negative" ? "bg-wat-100 text-wat-700" : "bg-moss-100 text-moss-700")}>
                                      {o.gram === "Gram Negative" ? "GN" : "GP"}
                                    </span>
                                    {o.eskaape && (
                                      <span className="rounded-full bg-res-100 px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase text-res-700">E</span>
                                    )}
                                  </span>
                                ),
                              }))}
                              value={c.organism}
                              onValue={(v) => pickOrganism(c.id, v)}
                              error={!!err(`cx:${c.id}:org`)}
                              placeholder="Search organisms…"
                            />
                          ) : (
                            <div className="flex h-9 items-center rounded-md border border-dashed border-linedark bg-panel px-2.5 text-[13px] font-semibold text-ink-400">
                              {NO_GROWTH}
                            </div>
                          )}
                        </Field>

                        <Field label="Gram stain (auto)">
                          <div key={c.organism || "gram"} className={cx("flex h-9 items-center rounded-md border border-dashed border-linedark bg-panel px-2.5 text-[12px]", org?.gram ? "anim-flash font-semibold text-pine-700" : "text-ink-300")}>
                            {positive ? org?.gram ?? "fills on selection" : "n/a"}
                          </div>
                        </Field>
                        <Field label="AST done?" hint="positives only">
                          <div className={cx("flex h-9 items-center", !positive && "pointer-events-none opacity-40")}>
                            <Toggle checked={c.astDone && positive} onChange={(astDone) => setCx(c.id, { astDone, mdr: astDone ? c.mdr : false, xdr: astDone ? c.xdr : false })} label={c.astDone && positive ? "Yes" : "No"} />
                          </div>
                        </Field>
                        <Field label="MDR" hint="needs AST">
                          <div className={cx("flex h-9 items-center", !(positive && c.astDone) && "pointer-events-none opacity-40")}>
                            <Toggle checked={c.mdr && positive && c.astDone} onChange={(mdr) => setCx(c.id, { mdr })} label={c.mdr && positive && c.astDone ? "Yes" : "No"} />
                          </div>
                        </Field>
                        <Field label="XDR" hint="needs AST">
                          <div className={cx("flex h-9 items-center", !(positive && c.astDone) && "pointer-events-none opacity-40")}>
                            <Toggle checked={c.xdr && positive && c.astDone} onChange={(xdr) => setCx(c.id, { xdr })} label={c.xdr && positive && c.astDone ? "Yes" : "No"} />
                          </div>
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={d.cultures.length >= MAX_CULTURES}
                onClick={() => patch({ cultures: [...d.cultures, newCulture()] })}
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-moss-600/50 px-3.5 text-[13px] font-semibold text-moss-700 transition-all hover:border-moss-600 hover:bg-moss-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconPlus size={14} /> Add culture
                <span className="font-mono text-[11px] font-medium text-ink-400">
                  {d.cultures.length}/{MAX_CULTURES}
                </span>
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* ---------- sticky save bar ---------- */}
      <div className="sticky bottom-3 z-30">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-pine-900 px-4 py-2.5 text-paper shadow-[0_14px_38px_-12px_rgba(10,21,18,0.55)]">
          <div className="flex items-center gap-2 text-[12px]">
            {attempted && Object.keys(errors).length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-res-600/20 px-2.5 py-1 font-mono text-[11px] font-semibold text-res-500 ring-1 ring-inset ring-res-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-res-500 anim-pulse-soft" />
                {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} to fix
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-600/20 px-2.5 py-1 font-mono text-[11px] font-semibold text-moss-500 ring-1 ring-inset ring-moss-500/40">
                <IconCheck size={11} /> ready
              </span>
            )}
          </div>
          <div className="hidden items-center gap-3 font-mono text-[11px] text-ink-300 sm:flex">
            <span>LOS <b className="text-paper">{los ?? "—"}</b>d</span>
            <span className="h-3 w-px bg-pine-700" />
            <span>Rx <b className="text-paper">{d.abx.length}</b>/{MAX_ANTIBIOTICS}</span>
            <span className="h-3 w-px bg-pine-700" />
            <span>Cx <b className="text-paper">{d.cultureSent ? d.cultures.length : 0}</b>/{MAX_CULTURES}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => reset(false)}
              className="h-9 rounded-md px-3 text-[12.5px] font-semibold text-ink-300 transition-colors hover:bg-pine-800 hover:text-paper"
            >
              Clear
            </button>
            <Btn onClick={save} className="h-10 px-5 text-[14px]">
              Save patient
              <kbd className="ml-1.5 rounded border border-paper/25 bg-pine-800 px-1.5 py-0.5 font-mono text-[10px] font-medium text-moss-200">
                ⌘↵
              </kbd>
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
