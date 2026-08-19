import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AWARE_COLOR, ORGANISM_MASTER } from "../data/masters";
import type { Patient } from "../lib/store";
import { IconArrowRight, IconGrid, cx } from "./ui";
import { Btn } from "./ui";

const tooltipStyle = {
  background: "#fcfdfc",
  border: "1px solid #d9e2dd",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "'IBM Plex Mono', monospace",
  color: "#14231e",
  boxShadow: "0 10px 26px -10px rgba(12,22,19,0.25)",
} as const;

const axisTick = { fontSize: 10.5, fill: "#5b6f67", fontFamily: "'IBM Plex Mono', monospace" };

/* ------------------------------------------------------------------ */

function Tile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneCls = {
    default: "text-pine-900",
    good: "text-moss-700",
    warn: "text-wat-600",
    bad: "text-res-600",
  }[tone];
  return (
    <div className="rounded-lg border border-line bg-panel p-3.5 shadow-[0_1px_2px_rgba(12,22,19,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        {label}
      </p>
      <p className={cx("mt-1 font-display text-[26px] font-extrabold leading-none tracking-tight", toneCls)}>
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-ink-400">{sub}</p>
    </div>
  );
}

function Panel({
  title,
  desc,
  children,
  className,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-lg border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(12,22,19,0.05)]", className)}>
      <h3 className="font-display text-[15px] font-bold tracking-tight">{title}</h3>
      <p className="mb-3 text-[11px] text-ink-400">{desc}</p>
      {children}
    </section>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
      <span className="text-[11.5px] text-ink-500">{label}</span>
      <span className="ml-auto font-mono text-[11.5px] font-semibold text-ink-900">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function Dashboard({
  patients,
  onLoadDemo,
  onGoEntry,
}: {
  patients: Patient[];
  onLoadDemo: () => void;
  onGoEntry: () => void;
}) {
  const stats = useMemo(() => {
    const n = patients.length;
    const avgLos = n ? patients.reduce((s, p) => s + p.los, 0) / n : 0;
    const allRx = patients.flatMap((p) => p.antibiotics);
    const aware = { Access: 0, Watch: 0, Reserve: 0 };
    allRx.forEach((a) => (aware[a.category] += 1));
    const wr = allRx.length ? ((aware.Watch + aware.Reserve) / allRx.length) * 100 : 0;

    const cxSent = patients.flatMap((p) => p.cultures);
    const positives = cxSent.filter((c) => c.result === "Positive");
    const esk = positives.filter((c) => c.eskaape);
    const positivity = cxSent.length ? (positives.length / cxSent.length) * 100 : 0;
    const eskRate = positives.length ? (esk.length / positives.length) * 100 : 0;

    const male = patients.filter((p) => p.sex === "Male").length;

    const bins = [
      { label: "<30", min: 0, max: 29, count: 0 },
      { label: "30–44", min: 30, max: 44, count: 0 },
      { label: "45–59", min: 45, max: 59, count: 0 },
      { label: "60–74", min: 60, max: 74, count: 0 },
      { label: "75+", min: 75, max: 200, count: 0 },
    ];
    patients.forEach((p) => {
      const b = bins.find((x) => p.age >= x.min && p.age <= x.max);
      if (b) b.count += 1;
    });

    const now = new Date();
    const months: Array<{ key: string; label: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: dt.toLocaleDateString("en-GB", { month: "short" }), count: 0 });
    }
    patients.forEach((p) => {
      const key = p.admissionDate.slice(0, 7);
      const m = months.find((x) => x.key === key);
      if (m) m.count += 1;
    });

    const orgCounts = ORGANISM_MASTER.filter((o) => o.gram !== null)
      .map((o) => ({
        name: o.name,
        eskaape: o.eskaape,
        count: positives.filter((c) => c.organism === o.name).length,
      }))
      .filter((o) => o.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      n, avgLos, allRx, aware, wr, cxSent, positives, esk, positivity, eskRate,
      male, female: n - male, bins, months, orgCounts,
      avgRx: n ? allRx.length / n : 0,
      maxOrg: Math.max(1, ...orgCounts.map((o) => o.count)),
    };
  }, [patients]);

  if (patients.length === 0) {
    return (
      <div className="anim-fade mx-auto flex max-w-md flex-col items-center rounded-lg border border-dashed border-linedark bg-panel/70 px-8 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-moss-100 text-moss-700 ring-1 ring-inset ring-moss-500/25">
          <IconGrid size={26} />
        </span>
        <h2 className="font-display text-[20px] font-bold tracking-tight">Nothing to chart yet</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">
          Demographics, AWaRe consumption and ESKAPE isolation rates compute
          themselves the moment records enter the registry.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Btn onClick={onLoadDemo}>Load demo ward (36 pts)</Btn>
          <Btn variant="ghost" onClick={onGoEntry}>
            Open 1-minute form <IconArrowRight size={14} />
          </Btn>
        </div>
      </div>
    );
  }

  const s = stats;

  return (
    <div className="anim-fade mx-auto max-w-6xl">
      {/* ---------- tiles ---------- */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Tile label="Patients" value={String(s.n)} sub="on registry · live" />
        <Tile label="Avg LOS" value={s.avgLos.toFixed(1)} sub="days per admission" />
        <Tile label="ABx prescribed" value={String(s.allRx.length)} sub={`${s.avgRx.toFixed(1)} per patient`} />
        <Tile
          label="Watch + Reserve"
          value={`${s.wr.toFixed(0)}%`}
          sub="of all prescriptions"
          tone={s.wr > 60 ? "bad" : s.wr > 40 ? "warn" : "good"}
        />
        <Tile
          label="Culture positivity"
          value={`${s.positivity.toFixed(0)}%`}
          sub={`${s.positives.length}/${s.cxSent.length} sent`}
        />
        <Tile
          label="ESKAPE rate"
          value={`${s.eskRate.toFixed(0)}%`}
          sub={`${s.esk.length} of ${s.positives.length} positives`}
          tone={s.eskRate > 55 ? "bad" : s.eskRate > 35 ? "warn" : "good"}
        />
      </div>

      {/* ---------- charts row 1 ---------- */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Age distribution" desc="All registered patients, 5-year-ish bands" className="lg:col-span-1">
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.bins} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#e3eae6" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(14,138,100,0.06)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="patients" fill="#0e8a64" radius={[4, 4, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Gender split" desc="Male vs female admissions">
          <div className="flex items-center gap-4">
            <div className="relative h-[170px] w-[170px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Male", value: s.male },
                      { name: "Female", value: s.female },
                    ]}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    <Cell fill="#16332b" />
                    <Cell fill="#17a277" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[22px] font-extrabold leading-none text-pine-900">{s.n}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400">pts</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <LegendDot color="#16332b" label="Male" value={`${s.male} · ${((s.male / s.n) * 100).toFixed(0)}%`} />
              <LegendDot color="#17a277" label="Female" value={`${s.female} · ${((s.female / s.n) * 100).toFixed(0)}%`} />
            </div>
          </div>
        </Panel>

        <Panel title="AWaRe classification" desc="WHO Access · Watch · Reserve consumption">
          <div className="flex items-center gap-4">
            <div className="relative h-[170px] w-[170px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Access", value: s.aware.Access },
                      { name: "Watch", value: s.aware.Watch },
                      { name: "Reserve", value: s.aware.Reserve },
                    ]}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    <Cell fill={AWARE_COLOR.Access} />
                    <Cell fill={AWARE_COLOR.Watch} />
                    <Cell fill={AWARE_COLOR.Reserve} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[22px] font-extrabold leading-none text-pine-900">
                  {s.allRx.length}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400">Rx</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {(["Access", "Watch", "Reserve"] as const).map((c) => (
                <LegendDot
                  key={c}
                  color={AWARE_COLOR[c]}
                  label={c}
                  value={`${s.aware[c]} · ${s.allRx.length ? ((s.aware[c] / s.allRx.length) * 100).toFixed(0) : 0}%`}
                />
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* ---------- charts row 2 ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Monthly intake" desc="Admissions per month, trailing 6 months" className="lg:col-span-2">
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.months} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="intakeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0e8a64" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0e8a64" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e3eae6" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="admissions"
                  stroke="#0e8a64"
                  strokeWidth={2.4}
                  fill="url(#intakeFill)"
                  dot={{ r: 3.5, fill: "#0e8a64", strokeWidth: 2, stroke: "#fcfdfc" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="ESKAPE isolation" desc="Pathogens recovered from positive cultures">
          {s.positives.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-ink-300">No positive cultures yet.</p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {s.orgCounts.length === 0 && (
                <p className="py-8 text-center text-[12.5px] text-ink-300">No identified organisms.</p>
              )}
              {s.orgCounts.map((o) => (
                <div key={o.name}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className={cx(
                        "h-2 w-2 rounded-full",
                        o.eskaape ? "bg-res-500" : "bg-moss-500",
                      )}
                    />
                    <span className="truncate text-[12px] font-medium italic">{o.name}</span>
                    {o.eskaape && (
                      <span className="rounded-full bg-res-100 px-1.5 font-mono text-[9px] font-bold uppercase text-res-700">
                        ESKAPE
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[11.5px] font-semibold">{o.count}</span>
                  </div>
                  <div className="h-[7px] overflow-hidden rounded-full bg-paper ring-1 ring-inset ring-line">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(o.count / s.maxOrg) * 100}%`,
                        background: o.eskaape ? AWARE_COLOR.Reserve : AWARE_COLOR.Access,
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="pt-1 font-mono text-[10px] uppercase tracking-wider text-ink-300">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-res-500 align-middle" />ESKAPE
                <span className="ml-3 mr-2 inline-block h-2 w-2 rounded-full bg-moss-500 align-middle" />other
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
