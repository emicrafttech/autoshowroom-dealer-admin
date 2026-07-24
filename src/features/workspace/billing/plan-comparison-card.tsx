import { Check, CreditCard, Layers } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { Plan } from "@/features/workspace/types";
import { cn, formatNgn } from "@/lib/utils";
import { buildPlanComparisonRows } from "./plan-comparison";
import {
  ANNUAL_SAVINGS_COPY,
  type BillingInterval,
  isPlanDowngrade,
  isPlanUpgrade,
  isProratedUpgrade,
  planPriceForInterval,
  priceSuffix,
  quotedUpgradeAmount,
} from "./plan-pricing";

export function PlanComparisonCard({
  plan,
  current,
  pendingDowngrade,
  currentPlan,
  currentInterval = "monthly",
  billingInterval,
  periodEnd,
  actionPending,
  onUpgrade,
  onDowngrade,
}: {
  plan: Plan;
  current: boolean;
  pendingDowngrade?: boolean;
  currentPlan?: Plan;
  currentInterval?: BillingInterval;
  billingInterval: BillingInterval;
  periodEnd?: string;
  actionPending: boolean;
  onUpgrade: (planId: string) => void;
  onDowngrade: (planId: string) => void;
}) {
  const listPrice = planPriceForInterval(plan, billingInterval);
  const isUpgrade = isPlanUpgrade(
    plan,
    billingInterval,
    currentPlan,
    currentInterval,
  );
  const isDowngrade = isPlanDowngrade(
    plan,
    billingInterval,
    currentPlan,
    currentInterval,
  );
  const dueToday = quotedUpgradeAmount(
    plan,
    billingInterval,
    currentPlan,
    currentInterval,
    periodEnd,
  );
  const isProrated = isProratedUpgrade(
    plan,
    billingInterval,
    currentPlan,
    currentInterval,
    periodEnd,
  );
  const rows = buildPlanComparisonRows(plan);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[20px] border p-5 shadow-2xl shadow-black/20",
        current
          ? "border-lime-300/30 bg-lime-300/10"
          : "border-white/8 bg-[#101014]/80",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/15 text-lime-200">
          <Layers className="h-5 w-5" />
        </div>
        {current ? (
          <Badge tone="lime">Current</Badge>
        ) : pendingDowngrade ? (
          <Badge tone="amber">Scheduled</Badge>
        ) : null}
      </div>
      <h2 className="mt-4 font-display text-[20px] font-semibold text-white">
        {plan.name}
      </h2>
      <div className="mt-2 font-display text-[30px] font-semibold text-white">
        {formatNgn(listPrice)}
        <span className="text-[13px] text-neutral-400">
          {priceSuffix(billingInterval)}
        </span>
      </div>
      {billingInterval === "yearly" ? (
        <p className="mt-1 text-[12px] font-semibold text-lime-200/80">
          {ANNUAL_SAVINGS_COPY}
        </p>
      ) : null}
      {isUpgrade && !current ? (
        <p className="mt-2 text-[12px] font-semibold text-lime-200">
          {isProrated
            ? `Pay ${formatNgn(dueToday)} today · current plan credit applied`
            : `Pay ${formatNgn(dueToday)} today`}
        </p>
      ) : null}
      {isDowngrade && !current ? (
        <p className="mt-2 text-[12px] font-semibold text-amber-200">
          Takes effect at your next billing cycle
        </p>
      ) : null}
      <div className="mt-4 flex flex-1 flex-col gap-2 text-[13px] font-semibold text-neutral-400">
        {rows.map((row) => (
          <div className="flex items-start gap-2" key={row.id}>
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />
            <span>
              <span className="text-neutral-500">{row.label}: </span>
              <span className="text-neutral-300">{row.value}</span>
            </span>
          </div>
        ))}
      </div>
      <Button
        className="mt-5 w-full shrink-0"
        disabled={current || pendingDowngrade || actionPending}
        type="button"
        variant={
          current || pendingDowngrade
            ? "secondary"
            : isDowngrade
              ? "secondary"
              : "primary"
        }
        onClick={() =>
          isDowngrade ? onDowngrade(plan.id) : onUpgrade(plan.id)
        }
      >
        <CreditCard className="h-4 w-4" />
        {current
          ? "Current plan"
          : pendingDowngrade
            ? "Downgrade scheduled"
            : actionPending
              ? "Processing..."
              : isDowngrade
                ? "Schedule downgrade"
                : isUpgrade
                  ? "Upgrade"
                  : "Subscribe"}
      </Button>
    </div>
  );
}
