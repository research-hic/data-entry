import { useCallback, useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import EntryForm from "./components/EntryForm";
import Registry from "./components/Registry";
import {
  IconAlert,
  IconCheck,
  IconClipboard,
  IconGrid,
  IconPulse,
  LogoMark,
  cx,
} from "./components/ui";
import type { Patient } from "./lib/store";
import { generateDemoData, loadPatients, nextStudyId, savePatients } from "./lib/store";

type Tab = "entry" | "registry" | "dashboard";

interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  msg: string;
}

let toastSeq = 1;

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => loadPatients());
  const [tab, setTab] = useState<Tab>("entry");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    savePatients(patients);
  }, [patients]);

  const toast = useCallback((kind: Toast["kind"], msg: string) => {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, kind, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const handleSave = useCallback(
    (p: Patient, secs: number) => {
      setPatients((prev) => [p, ...prev]);
      toast(
        "success",
        `${p.studyId} saved in ${secs}s ${secs <= 60 ? "· under target" : "· over 60s target"}`,
      );
    },
    [toast],
  );

  const handleFail = useCallback(
    (n: number) => toast("error", `${n} required field${n > 1 ? "s" : ""} missing — check the highlights`),
    [toast],
  );

  const handleDelete = useCallback(
    (studyId: string) => {
      setPatients((prev) => prev.filter((p) => p.studyId !== studyId));
      toast("info", `${studyId} removed from registry`);
    },
    [toast],
  );

  const handleDemo = useCallback(() => {
    setPatients(generateDemoData());
    toast("success", "Demo ward loaded — 36 patients, 6 months of activity");
  }, [toast]);

  const nextId = nextStudyId(patients);

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "entry", label: "New Entry", icon: <IconPulse size={14} /> },
    { id: "registry", label: "Registry", icon: <IconClipboard size={14} />, badge: patients.length },
    { id: "dashboard", label: "Dashboard", icon: <IconGrid size={14} /> },
  ];

  return (
    <div className="min-h-screen">
      {/* ambient wash */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-gradient-to-b from-moss-100/70 via-moss-50/30 to-transparent" />

      {/* ---------------- header ---------------- */}
      <header className="sticky top-0 z-40 border-b border-pine-800 bg-pine-900/95 shadow-[0_6px_24px_-12px_rgba(10,21,18,0.6)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <div className="leading-none">
              <p className="font-display text-[17px] font-extrabold tracking-tight text-paper">
                Onco<span className="text-moss-500">Trak</span>
              </p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-400">
                1-min ward surveillance
              </p>
            </div>
          </div>

          <nav className="order-3 flex w-full items-center gap-1 sm:order-none sm:ml-6 sm:w-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cx(
                  "relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition-all duration-150 sm:flex-none",
                  tab === t.id
                    ? "bg-moss-600 text-paper shadow-[0_2px_12px_-3px_rgba(23,162,119,0.6)]"
                    : "text-ink-300 hover:bg-pine-800 hover:text-paper",
                )}
              >
                {t.icon}
                {t.label}
                {typeof t.badge === "number" && t.badge > 0 && (
                  <span
                    className={cx(
                      "rounded-full px-1.5 py-px font-mono text-[10px] font-bold",
                      tab === t.id ? "bg-pine-900/40 text-paper" : "bg-pine-800 text-moss-500",
                    )}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <span className="flex items-center gap-1.5 rounded-full border border-pine-700 bg-pine-800/70 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-moss-500">
              <span className="h-1.5 w-1.5 rounded-full bg-moss-500 anim-pulse-soft" />
              next {nextId}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              local store
            </span>
          </div>
        </div>
      </header>

      {/* ---------------- main ---------------- */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6">
        {tab !== "entry" && (
          <div className="mb-4">
            <h1 className="font-display text-[24px] font-extrabold tracking-tight text-pine-900">
              {tab === "registry" ? "Patient Registry" : "Stewardship Dashboard"}
            </h1>
            <p className="text-[12.5px] text-ink-400">
              {tab === "registry"
                ? "Every saved admission with its antibiotic and culture trail — click a row for the full record."
                : "Demographics, AWaRe consumption and ESKAPE isolation — recomputed live from the registry."}
            </p>
          </div>
        )}

        {tab === "entry" && <EntryForm nextId={nextId} onSave={handleSave} onFail={handleFail} />}
        {tab === "registry" && (
          <Registry
            patients={patients}
            onDelete={handleDelete}
            onGoEntry={() => setTab("entry")}
            onLoadDemo={handleDemo}
          />
        )}
        {tab === "dashboard" && (
          <Dashboard patients={patients} onLoadDemo={handleDemo} onGoEntry={() => setTab("entry")} />
        )}
      </main>

      {/* ---------------- footer ---------------- */}
      <footer className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-2 lg:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-wider text-ink-300">
          <span>OncoTrak · oncology AMR surveillance</span>
          <span className="hidden h-1 w-1 rounded-full bg-linedark sm:block" />
          <span>WHO AWaRe 2023 · ESKAPE panel</span>
          <span className="hidden h-1 w-1 rounded-full bg-linedark sm:block" />
          <span>data persists in this browser</span>
        </div>
      </footer>

      {/* ---------------- toasts ---------------- */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "anim-toast pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-[0_14px_36px_-10px_rgba(12,22,19,0.4)]",
              t.kind === "success" && "border-moss-500/40 bg-pine-900 text-paper",
              t.kind === "error" && "border-res-500/50 bg-res-700 text-paper",
              t.kind === "info" && "border-line bg-panel text-ink-900",
            )}
          >
            <span
              className={cx(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                t.kind === "success" && "bg-moss-600 text-paper",
                t.kind === "error" && "bg-res-500 text-paper",
                t.kind === "info" && "bg-paper text-ink-500 ring-1 ring-inset ring-line",
              )}
            >
              {t.kind === "error" ? <IconAlert size={11} /> : <IconCheck size={11} />}
            </span>
            <p className="text-[12.5px] font-medium leading-snug">{t.msg}</p>
            <button
              type="button"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="ml-auto shrink-0 rounded p-0.5 opacity-50 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
