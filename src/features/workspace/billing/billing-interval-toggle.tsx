import { cn } from "@/lib/utils";
import type { BillingInterval } from "./plan-pricing";

export function BillingIntervalToggle({
  value,
  onChange,
  disabled,
}: {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1"
      role="group"
      aria-label="Billing interval"
    >
      {(["monthly", "yearly"] as const).map((interval) => (
        <button
          key={interval}
          className={cn(
            "cursor-pointer rounded-lg px-4 py-2 text-[13px] font-[900!important] capitalize transition",
            value === interval
              ? "bg-lime-300 text-neutral-950"
              : "text-neutral-400 hover:text-white",
          )}
          disabled={disabled}
          type="button"
          onClick={() => onChange(interval)}
        >
          {interval}
        </button>
      ))}
    </div>
  );
}
