import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AWaRe } from "../data/masters";

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/*  Icons — hand-drawn inline SVG                                      */
/* ------------------------------------------------------------------ */

type IconProps = { size?: number; className?: string; strokeWidth?: number };
const svgProps = (size: number, className?: string, strokeWidth = 1.9) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const IconPulse = ({ size = 18, className }: IconProps) => (
  <svg {...svgProps(size, className, 2.2)}>
    <path d="M2.5 12h4l2.2-5.5 3.4 11 2.6-7.5 1.6 2h5.2" />
  </svg>
);
export const IconPlus = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className, 2.4)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconTrash = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M4 7h16M9.5 7V4.8A1 1 0 0 1 10.5 4h3a1 1 0 0 1 1 .8V7M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v5.5M14 11v5.5" />
  </svg>
);
export const IconX = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className, 2.2)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconCheck = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className, 2.4)}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);
export const IconChevronDown = ({ size = 14, className }: IconProps) => (
  <svg {...svgProps(size, className, 2.2)}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);
export const IconSearch = ({ size = 15, className }: IconProps) => (
  <svg {...svgProps(size, className, 2)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);
export const IconDownload = ({ size = 15, className }: IconProps) => (
  <svg {...svgProps(size, className, 2)}>
    <path d="M12 3.5v11m0 0l-4.2-4.2M12 14.5l4.2-4.2M4 17.5v1.8A1.7 1.7 0 0 0 5.7 21h12.6a1.7 1.7 0 0 0 1.7-1.7v-1.8" />
  </svg>
);
export const IconAlert = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className, 2)}>
    <path d="M12 3.6L2.7 19.5a1 1 0 0 0 .9 1.5h16.8a1 1 0 0 0 .9-1.5L12 3.6zM12 10v4.5M12 17.6v.4" />
  </svg>
);
export const IconFlask = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M9.5 3.5h5M10.5 3.5v5.2L4.9 18.4A1.8 1.8 0 0 0 6.5 21h11a1.8 1.8 0 0 0 1.6-2.6L13.5 8.7V3.5M7.5 14.5h9" />
  </svg>
);
export const IconCapsule = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-35 12 12)" />
    <path d="M8.6 8.4l6.8 7.2" />
  </svg>
);
export const IconGrid = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
  </svg>
);
export const IconClipboard = ({ size = 16, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <rect x="5" y="4.5" width="14" height="16.5" rx="1.8" />
    <path d="M9 4.5V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2v1.3M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
  </svg>
);
export const IconArrowRight = ({ size = 15, className }: IconProps) => (
  <svg {...svgProps(size, className, 2.1)}>
    <path d="M4 12h15m0 0l-5.5-5.5M19 12l-5.5 5.5" />
  </svg>
);
export const IconTimer = ({ size = 15, className }: IconProps) => (
  <svg {...svgProps(size, className, 2)}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 13.5V9.8M9.5 2.5h5M12 2.5v2" />
  </svg>
);

export const LogoMark = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
    <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#0e8a64" />
    <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="#17a277" strokeOpacity="0.6" />
    <path
      d="M5.5 16.5h4.4l2.4-6.2 3.7 12 2.9-8.3 1.7 2.5h5.9"
      stroke="#f2f5f3"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Field chrome                                                       */
/* ------------------------------------------------------------------ */

export const inputCls =
  "h-9 w-full rounded-md border border-line bg-panel px-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-[border-color,box-shadow] duration-150 focus:border-moss-600 focus:outline-none focus:ring-2 focus:ring-moss-600/20 disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-400";

export const inputErrCls =
  "border-res-500 focus:border-res-500 focus:ring-res-500/20 bg-res-50";

export function Field({
  label,
  required,
  error,
  children,
  className,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cx("min-w-0", className)} data-err={error ? "1" : undefined}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="font-mono text-[10.5px] font-medium uppercase tracking-[0.09em] text-ink-500">
          {label}
          {required && <span className="ml-0.5 text-res-600">*</span>}
        </label>
        {hint && <span className="text-[10px] text-ink-300">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="anim-slide-down mt-1 flex items-center gap-1 text-[11px] font-medium text-res-600">
          <IconAlert size={11} /> {error}
        </p>
      )}
    </div>
  );
}

export function SelectShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      {children}
      <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Segmented control                                                  */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  activeCls = "bg-pine-800 text-paper shadow-sm",
  error,
  full,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  activeCls?: string;
  error?: boolean;
  full?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={cx(
        "inline-flex gap-0.5 rounded-md border bg-paper p-0.5",
        error ? "border-res-500" : "border-line",
        full && "flex w-full",
      )}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={cx(
              "h-7 flex-1 whitespace-nowrap rounded-[5px] px-2 text-[12px] font-semibold transition-all duration-150",
              active ? activeCls : "text-ink-500 hover:bg-panel hover:text-ink-900",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Multi-select chips                                                 */
/* ------------------------------------------------------------------ */

export function ChipGroup({
  options,
  values,
  onChange,
  noneExclusive,
}: {
  options: readonly string[];
  values: string[];
  onChange: (v: string[]) => void;
  noneExclusive?: boolean;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
      return;
    }
    if (noneExclusive) {
      if (opt === "None") onChange(["None"]);
      else onChange([...values.filter((v) => v !== "None"), opt]);
    } else {
      onChange([...values, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(opt)}
            className={cx(
              "flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] font-medium transition-all duration-150 active:scale-95",
              active
                ? "border-pine-800 bg-pine-800 text-paper shadow-sm"
                : "border-line bg-panel text-ink-500 hover:border-pine-700 hover:text-ink-900",
            )}
          >
            {active && <IconCheck size={10} />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle switch                                                      */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2"
    >
      <span
        className={cx(
          "relative h-[20px] w-[36px] rounded-full transition-colors duration-200",
          checked ? "bg-moss-600" : "bg-linedark group-hover:bg-ink-300",
        )}
      >
        <span
          className={cx(
            "absolute top-[2px] h-4 w-4 rounded-full bg-panel shadow transition-transform duration-200",
            checked ? "translate-x-[18px]" : "translate-x-[2px]",
          )}
        />
      </span>
      {label && (
        <span
          className={cx(
            "text-[13px] font-semibold transition-colors",
            checked ? "text-moss-700" : "text-ink-500",
          )}
        >
          {label}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Searchable combobox                                                */
/* ------------------------------------------------------------------ */

export interface ComboOption {
  value: string;
  meta?: ReactNode;
}

export function Combobox({
  options,
  value,
  onValue,
  placeholder = "Type to search…",
  error,
  flashKey,
}: {
  options: ComboOption[];
  value: string;
  onValue: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  flashKey?: number;
}) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setText(value), [value]);

  const filtered = text.trim()
    ? options.filter((o) => o.value.toLowerCase().includes(text.trim().toLowerCase()))
    : options;

  const commit = (v: string) => {
    onValue(v);
    setText(v);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative" data-err={error ? "1" : undefined}>
      <div className="relative">
        <input
          value={text}
          placeholder={placeholder}
          spellCheck={false}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 130);
            if (!value) setText("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              if (open && filtered.length) {
                e.preventDefault();
                commit(filtered[Math.min(active, filtered.length - 1)].value);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cx(
            inputCls,
            "pr-8 font-medium",
            error && !value && inputErrCls,
            flashKey !== undefined && value && "anim-flash",
          )}
        />
        <IconSearch className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
      </div>
      {open && (
        <div className="anim-slide-down absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-panel py-1 shadow-[0_12px_32px_-8px_rgba(12,22,19,0.28)] scroll-thin">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-ink-400">No match in master list</p>
          )}
          {filtered.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commit(opt.value);
              }}
              onMouseEnter={() => setActive(i)}
              className={cx(
                "flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[13px] transition-colors",
                i === active ? "bg-moss-50" : "",
                opt.value === value ? "font-semibold text-moss-700" : "text-ink-900",
              )}
            >
              <span className="min-w-0 truncate">{opt.value}</span>
              {opt.meta}
            </button>
          ))}
          {filtered.length > 0 && (
            <p className="mt-0.5 border-t border-line px-3 pb-0.5 pt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-300">
              ↵ select · ↑↓ navigate
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AWaRe category pill                                                */
/* ------------------------------------------------------------------ */

export const AWARE_PILL: Record<AWaRe, string> = {
  Access: "bg-acc-100 text-acc-700 ring-1 ring-inset ring-acc-500/30",
  Watch: "bg-wat-100 text-wat-700 ring-1 ring-inset ring-wat-500/30",
  Reserve: "bg-res-100 text-res-700 ring-1 ring-inset ring-res-500/30",
};

export function CategoryPill({ category }: { category: AWaRe | "" }) {
  if (!category) {
    return (
      <span className="inline-flex h-[22px] items-center rounded-full border border-dashed border-linedark px-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-300">
        auto
      </span>
    );
  }
  return (
    <span
      key={category}
      className={cx(
        "anim-pop inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide",
        AWARE_PILL[category],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {category}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "dark";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  title?: string;
}) {
  const styles = {
    primary:
      "bg-moss-600 text-paper hover:bg-moss-700 active:scale-[0.98] shadow-[0_2px_10px_-2px_rgba(14,138,100,0.5)]",
    dark: "bg-pine-800 text-paper hover:bg-pine-700 active:scale-[0.98]",
    ghost:
      "border border-line bg-panel text-ink-700 hover:border-pine-700 hover:text-ink-900 active:scale-[0.98]",
    danger:
      "border border-res-500/40 bg-panel text-res-600 hover:bg-res-50 active:scale-[0.98]",
  }[variant];
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-[13px] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}
