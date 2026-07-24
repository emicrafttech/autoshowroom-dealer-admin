import type {
  BillingInterval,
  Plan,
} from "@/features/workspace/types";

export type { BillingInterval } from "@/features/workspace/types";

export const ANNUAL_SAVINGS_COPY = "Pay 9 months, get 12 — save 25%";

export function planPriceForInterval(
  plan: Plan,
  interval: BillingInterval,
): number {
  if (interval === "yearly") {
    return plan.priceYearlyNgn ?? plan.priceNgn * 9;
  }
  return plan.priceNgn;
}

export function priceSuffix(interval: BillingInterval): string {
  return interval === "yearly" ? "/yr" : "/mo";
}

export function periodIsActive(periodEnd?: string): boolean {
  return Boolean(periodEnd && new Date(periodEnd) > new Date());
}

export function quotedUpgradeAmount(
  plan: Plan,
  interval: BillingInterval,
  currentPlan?: Plan,
  currentInterval: BillingInterval = "monthly",
  periodEnd?: string,
): number {
  const targetPrice = planPriceForInterval(plan, interval);
  const currentPrice = currentPlan
    ? planPriceForInterval(currentPlan, currentInterval)
    : 0;

  if (
    targetPrice > currentPrice &&
    periodIsActive(periodEnd) &&
    currentPrice > 0 &&
    interval === currentInterval
  ) {
    return Math.max(0, targetPrice - currentPrice);
  }

  return targetPrice;
}

export function isPlanUpgrade(
  plan: Plan,
  interval: BillingInterval,
  currentPlan?: Plan,
  currentInterval: BillingInterval = "monthly",
): boolean {
  const currentPrice = currentPlan
    ? planPriceForInterval(currentPlan, currentInterval)
    : 0;
  return planPriceForInterval(plan, interval) > currentPrice;
}

export function isPlanDowngrade(
  plan: Plan,
  interval: BillingInterval,
  currentPlan?: Plan,
  currentInterval: BillingInterval = "monthly",
): boolean {
  const currentPrice = currentPlan
    ? planPriceForInterval(currentPlan, currentInterval)
    : 0;
  return planPriceForInterval(plan, interval) < currentPrice;
}

export function isProratedUpgrade(
  plan: Plan,
  interval: BillingInterval,
  currentPlan: Plan | undefined,
  currentInterval: BillingInterval,
  periodEnd?: string,
): boolean {
  const dueToday = quotedUpgradeAmount(
    plan,
    interval,
    currentPlan,
    currentInterval,
    periodEnd,
  );
  const listPrice = planPriceForInterval(plan, interval);
  return (
    isPlanUpgrade(plan, interval, currentPlan, currentInterval) &&
    dueToday < listPrice &&
    dueToday > 0
  );
}
