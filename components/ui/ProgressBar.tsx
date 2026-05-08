"use client";

type Props = {
  /** 0–1 when known; omit for indeterminate */
  value?: number | null;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, label, className = "" }: Props) {
  const determinate =
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
  const pct = determinate
    ? Math.round(Math.min(100, Math.max(0, value * 100)))
    : undefined;

  return (
    <div className={className}>
      {label ? (
        <p className="mb-1 text-xs text-[#6B6B6B]">{label}</p>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[#E5E2DA]"
        role="progressbar"
        aria-busy={!determinate}
        aria-valuenow={determinate ? pct : undefined}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? 100 : undefined}
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-[#2F3437] transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="h-full w-full animate-pulse rounded-full bg-[#2F3437]/55" />
        )}
      </div>
    </div>
  );
}
