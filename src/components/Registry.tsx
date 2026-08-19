import { useMemo, useState } from "react";
import { AWARE_COLOR, OUTCOMES, WARDS } from "../data/masters";
import type { Outcome, Ward } from "../data/masters";
import type { Patient } from "../lib/store";
import { fmtDate } from "../lib/store";
import {
  Btn,
  CategoryPill,
  IconArrowRight,
  IconClipboard,
  IconDownload,
  IconSearch,
  IconTrash,
  IconX,
  SelectShell,
  cx,
  inputCls,
} from "./ui";

const OUTCOME_TONE: Record<Outcome, string> = {
  Improved: "bg-acc-100 text-acc-700 ring-acc-500/30",
  Death: "bg-res-100 text-res-700 ring-res-500/30",
  DAMA: "bg-wat-100 text-wat-700 ring-wat-500/30",
  Referred: "bg-moss-100 text-moss-700 ring-moss-500/30",
  Transferred: "bg-paper text-ink-700 ring-linedark",
};

function AwaraBar({ p }: { p: Patient }) {
  const counts = { Access: 0, Watch: 0, Reserve: 0 };
  p.antibiotics.forEach((a) => {
    counts[a.category] += 1;
  });
  const total = p.antibiotics.length;
  if (total === 0) return <span className="text-[12px] text-ink-300">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-[9px] w-24 overflow-hidden rounded-full bg-paper ring-1 ring-inset ring-line">
        {(["Access", "Watch", "Reserve"] as const).map(
          (c) =>
            counts[c] > 0 && (
              <div
                key={c}
                style={{ width: `${(counts[c] / total) * 100}%`, background: AWARE_COLOR[c] }}
                title={`${c}: ${counts[c]}`}
              />
            ),
        )}
      </div>
      <span className="font-mono text-[11.5px] font-semibold text-ink-700">{total}</span>
    </div>
  );
}

function CultureBadges({ p }: { p: Patient }) {
  if (!p.cultureSent || p.cultures.length === 0)
    return <span className="text-[12px] text-ink-300">—</span>;
  const pos = p.cultures.filter((c) => c.result === "Positive");
  const esk = pos.filter((c) => c.eskaape);
  const mdr = p.cultures.filter((c) => c.mdr);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10.5px] font-semibold text-ink-700 ring-1 ring-inset ring-line">
        {pos.length}/{p.cultures.length} pos
      </span>
      {esk.length > 0 && (
        <span className="rounded-full bg-res-100 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-res-700 ring-1 ring-inset ring-res-500/30">
          ESKAPE {esk.length}
        </span>
      )}
      {mdr.length > 0 && (
        <span className="rounded-full bg-wat-100 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-wat-700 ring-1 ring-inset ring-wat-500/30">
          MDR {mdr.length}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function Registry({
  patients,
  onDelete,
  onGoEntry,
  onLoadDemo,
}: {
  patients: Patient[];
  onDelete: (studyId: string) => void;
  onGoEntry: () => void;
  onLoadDemo: () => void;
}) {
  const [q, setQ] = useState("");
  const [ward, setWard] = useState<"" | Ward>("");
  const [outcome, setOutcome] = useState<"" | Outcome>("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return patients.filter((p) => {
      if (ward && p.ward !== ward) return false;
      if (outcome && p.outcome !== outcome) return false;
      if (!needle) return true;
      return [p.studyId, p.diagnosis, p.cancerName, p.cancerType, String(p.age)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [patients, q, ward, outcome]);

  const open = patients.find((p) => p.studyId === openId) ?? null;

  const exportCsv = () => {
    const head = [
      "Study_ID", "Date_of_Entry", "Age", "Sex", "Admission_Date", "Discharge_Date",
      "LOS", "Admission_Type", "Ward", "Diagnosis", "Cancer_Type", "Cancer_Name",
      "Treatments", "Comorbidities", "Outcome", "Readmission_30d", "De_escalation",
      "Abx_Count", "Access_N", "Watch_N", "Reserve_N", "Culture_Sent", "Cultures_N",
      "Positive_N", "ESKAPE_N", "Entry_Seconds",
    ];
    const rows = filtered.map((p) => [
      p.studyId, p.dateOfEntry, p.age, p.sex, p.admissionDate, p.dischargeDate, p.los,
      p.admissionType, p.ward, `"${p.diagnosis.replace(/"/g, '""')}"`, p.cancerType, p.cancerName,
      `"${p.treatments.join("; ")}"`, `"${p.comorbidities.join("; ")}"`, p.outcome,
      p.readmission30d ? "Yes" : "No", p.deescalation ? "Yes" : "No",
      p.antibiotics.length,
      p.antibiotics.filter((a) => a.category === "Access").length,
      p.antibiotics.filter((a) => a.category === "Watch").length,
      p.antibiotics.filter((a) => a.category === "Reserve").length,
      p.cultureSent ? "Yes" : "No", p.cultures.length,
      p.cultures.filter((c) => c.result === "Positive").length,
      p.cultures.filter((c) => c.eskaape).length,
      p.entrySeconds,
    ]);
    const csv = [head.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oncotrak_registry_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- empty state ---------- */
  if (patients.length === 0) {
    return (
      <div className="anim-fade mx-auto flex max-w-md flex-col items-center rounded-lg border border-dashed border-linedark bg-panel/70 px-8 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-moss-100 text-moss-700 ring-1 ring-inset ring-moss-500/25">
          <IconClipboard size={26} />
        </span>
        <h2 className="font-display text-[20px] font-bold tracking-tight">Registry is empty</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">
          Every patient you save lands here with their antibiotic and culture record.
          Start a first entry, or load a realistic demo ward to explore.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Btn onClick={onGoEntry}>
            Open 1-minute form <IconArrowRight size={14} />
          </Btn>
          <Btn variant="ghost" onClick={onLoadDemo}>Load demo ward (36 pts)</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade mx-auto max-w-6xl">
      {/* toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ID, diagnosis, cancer…"
            className={cx(inputCls, "pl-8")}
          />
        </div>
        <SelectShell className="w-[170px]">
          <select value={ward} onChange={(e) => setWard(e.target.value as "" | Ward)} className={cx(inputCls, "cursor-pointer")}>
            <option value="">All wards</option>
            {WARDS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </SelectShell>
        <SelectShell className="w-[150px]">
          <select value={outcome} onChange={(e) => setOutcome(e.target.value as "" | Outcome)} className={cx(inputCls, "cursor-pointer")}>
            <option value="">All outcomes</option>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </SelectShell>
        <span className="ml-1 font-mono text-[11.5px] font-semibold text-ink-400">
          {filtered.length} of {patients.length}
        </span>
        <Btn variant="ghost" onClick={exportCsv} className="ml-auto">
          <IconDownload size={14} /> Export CSV
        </Btn>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-[0_1px_2px_rgba(12,22,19,0.05)]">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-paper/70 font-mono text-[10.5px] uppercase tracking-[0.09em] text-ink-400">
                <th className="px-3.5 py-2.5 font-semibold">Study ID</th>
                <th className="px-3.5 py-2.5 font-semibold">Admitted</th>
                <th className="px-3.5 py-2.5 font-semibold">Age/Sex</th>
                <th className="px-3.5 py-2.5 font-semibold">Cancer</th>
                <th className="px-3.5 py-2.5 font-semibold">Outcome</th>
                <th className="px-3.5 py-2.5 font-semibold">AWaRe Rx</th>
                <th className="px-3.5 py-2.5 font-semibold">Cultures</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">LOS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-ink-400">
                    No records match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.studyId}
                  onClick={() => {
                    setOpenId(p.studyId);
                    setConfirmDelete(false);
                  }}
                  className="cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-moss-50/60"
                >
                  <td className="px-3.5 py-2.5 font-mono text-[12.5px] font-semibold text-pine-800">
                    {p.studyId}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="text-[12.5px] font-medium text-ink-900">{fmtDate(p.admissionDate)}</div>
                    <div className="text-[11px] text-ink-400">{p.ward}</div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-mono text-[12.5px]">{p.age}</span>
                    <span className="text-ink-400"> · {p.sex === "Male" ? "M" : "F"}</span>
                  </td>
                  <td className="max-w-[180px] px-3.5 py-2.5">
                    <div className="truncate text-[12.5px] font-medium">
                      {p.cancerName || <span className="text-ink-300">Non-oncology</span>}
                    </div>
                    {p.diagnosis && <div className="truncate text-[11px] text-ink-400">{p.diagnosis}</div>}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={cx("rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold ring-1 ring-inset", OUTCOME_TONE[p.outcome])}>
                      {p.outcome}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5"><AwaraBar p={p} /></td>
                  <td className="px-3.5 py-2.5"><CultureBadges p={p} /></td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[12.5px] font-semibold">
                    {p.los}<span className="ml-0.5 text-[10.5px] font-medium text-ink-400">d</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- detail drawer ---------- */}
      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close"
            className="anim-fade absolute inset-0 bg-pine-950/45"
            onClick={() => setOpenId(null)}
          />
          <aside className="anim-drawer absolute bottom-0 right-0 top-0 flex w-full max-w-[440px] flex-col overflow-hidden border-l border-line bg-panel shadow-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-line bg-paper/70 px-5 py-4">
              <div>
                <p className="font-mono text-[22px] font-semibold leading-none text-pine-900">{open.studyId}</p>
                <p className="mt-1.5 text-[11.5px] text-ink-400">
                  Entered {fmtDate(open.dateOfEntry)} · typed in{" "}
                  <span className={cx("font-mono font-semibold", open.entrySeconds <= 60 ? "text-moss-700" : "text-wat-600")}>
                    {open.entrySeconds}s
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-paper hover:text-ink-900"
              >
                <IconX size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">
              <DrawerSection title="Demographics & admission">
                <DRow k="Age / Sex" v={`${open.age} yrs · ${open.sex}`} />
                <DRow k="Admission" v={`${fmtDate(open.admissionDate)} · ${open.admissionType}`} />
                <DRow k="Discharge" v={fmtDate(open.dischargeDate)} />
                <DRow k="LOS" v={`${open.los} days`} />
                <DRow k="Ward" v={open.ward} />
                <DRow k="Diagnosis" v={open.diagnosis || "—"} />
                <DRow k="Outcome" v={open.outcome} />
                <DRow k="Readmission ≤30d" v={open.readmission30d ? "Yes" : "No"} />
                <DRow k="De-escalation" v={open.deescalation ? "Yes" : "No"} />
              </DrawerSection>

              <DrawerSection title="Oncology">
                <DRow k="Cancer type" v={open.cancerType} />
                <DRow k="Cancer name" v={open.cancerName || "—"} />
                <DRow k="Treatment" v={open.treatments.length ? open.treatments.join(", ") : "—"} />
                <DRow k="Comorbidities" v={open.comorbidities.length ? open.comorbidities.join(", ") : "—"} />
              </DrawerSection>

              <DrawerSection title={`Antibiotics · ${open.antibiotics.length}`}>
                {open.antibiotics.length === 0 && <p className="text-[12.5px] text-ink-300">None prescribed.</p>}
                <div className="space-y-2">
                  {open.antibiotics.map((a, i) => (
                    <div key={a.id} className="rounded-md border border-line bg-paper/60 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] font-semibold uppercase text-pine-700">Rx {i + 1}</span>
                        <span className="text-[13px] font-semibold">{a.name}</span>
                        <span className="ml-auto"><CategoryPill category={a.category} /></span>
                      </div>
                      <p className="mt-1 text-[11.5px] text-ink-500">
                        {a.cls} · {a.route} {a.dose} · {a.frequency} · {a.duration}d (DOT {a.dot}) · {a.indication} · {a.therapyType}
                      </p>
                    </div>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection title={`Cultures · ${open.cultureSent ? open.cultures.length : 0}`}>
                {!open.cultureSent && <p className="text-[12.5px] text-ink-300">No culture sent.</p>}
                <div className="space-y-2">
                  {open.cultures.map((c, i) => (
                    <div key={c.id} className="rounded-md border border-line bg-paper/60 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] font-semibold uppercase text-pine-700">Cx {i + 1}</span>
                        <span className="text-[13px] font-semibold">{c.type}</span>
                        <span className={cx("rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ring-1 ring-inset", c.result === "Positive" ? "bg-res-100 text-res-700 ring-res-500/30" : "bg-acc-100 text-acc-700 ring-acc-500/30")}>
                          {c.result}
                        </span>
                        <span className="ml-auto font-mono text-[10.5px] text-ink-400">{fmtDate(c.date)}</span>
                      </div>
                      <p className="mt-1 text-[11.5px] text-ink-500">
                        {c.organism}
                        {c.gram ? ` · ${c.gram}` : ""}
                        {c.result === "Positive" ? ` · ${c.eskaape ? "ESKAPE" : "non-ESKAPE"}` : ""}
                      </p>
                      {(c.astDone || c.mdr || c.xdr) && (
                        <div className="mt-1.5 flex gap-1">
                          {c.astDone && <Flag>AST</Flag>}
                          {c.mdr && <Flag tone="wat">MDR</Flag>}
                          {c.xdr && <Flag tone="res">XDR</Flag>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DrawerSection>
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-line bg-paper/70 px-5 py-3">
              <Btn
                variant="danger"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  onDelete(open.studyId);
                  setOpenId(null);
                }}
              >
                <IconTrash size={13} />
                {confirmDelete ? "Click again to confirm" : "Delete record"}
              </Btn>
              <Btn variant="ghost" onClick={() => setOpenId(null)}>Close</Btn>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ---------- drawer helpers ---------- */

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1.5 last:border-0">
      <span className="text-[11.5px] text-ink-400">{k}</span>
      <span className="text-right text-[12.5px] font-semibold text-ink-900">{v}</span>
    </div>
  );
}

function Flag({ children, tone = "moss" }: { children: React.ReactNode; tone?: "moss" | "wat" | "res" }) {
  const tones = {
    moss: "bg-moss-100 text-moss-700 ring-moss-500/30",
    wat: "bg-wat-100 text-wat-700 ring-wat-500/30",
    res: "bg-res-100 text-res-700 ring-res-500/30",
  };
  return (
    <span className={cx("rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ring-1 ring-inset", tones[tone])}>
      {children}
    </span>
  );
}
