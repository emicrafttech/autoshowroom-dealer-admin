import { describe, expect, it } from "vitest";
import {
  ANNUAL_SAVINGS_COPY,
  isPlanDowngrade,
  isPlanUpgrade,
  isProratedUpgrade,
  periodIsActive,
  planPriceForInterval,
  priceSuffix,
  quotedUpgradeAmount,
} from "./plan-pricing";
import {
  growthPlan,
  planWithoutYearlyPrice,
  prestigePlan,
  starterPlan,
} from "./__fixtures__/plans";

describe("plan-pricing", () => {
  it("uses yearly catalogue price or monthly fallback times nine", () => {
    expect(planPriceForInterval(growthPlan, "monthly")).toBe(50_000);
    expect(planPriceForInterval(growthPlan, "yearly")).toBe(450_000);
    expect(planPriceForInterval(planWithoutYearlyPrice, "yearly")).toBe(
      180_000,
    );
  });

  it("formats interval suffixes and annual savings copy", () => {
    expect(priceSuffix("monthly")).toBe("/mo");
    expect(priceSuffix("yearly")).toBe("/yr");
    expect(ANNUAL_SAVINGS_COPY).toBe("Pay 9 months, get 12 — save 25%");
  });

  it("detects active billing periods", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(periodIsActive(future)).toBe(true);
    expect(periodIsActive(past)).toBe(false);
    expect(periodIsActive(undefined)).toBe(false);
  });

  it("quotes interval-aware upgrade amounts with proration on same interval", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      quotedUpgradeAmount(
        growthPlan,
        "monthly",
        starterPlan,
        "monthly",
        future,
      ),
    ).toBe(30_000);
    expect(
      quotedUpgradeAmount(
        growthPlan,
        "yearly",
        starterPlan,
        "yearly",
        future,
      ),
    ).toBe(270_000);
    expect(
      quotedUpgradeAmount(
        growthPlan,
        "yearly",
        starterPlan,
        "monthly",
        future,
      ),
    ).toBe(450_000);
  });

  it("returns full list price when period is inactive or no current plan", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(
      quotedUpgradeAmount(growthPlan, "monthly", starterPlan, "monthly", past),
    ).toBe(50_000);
    expect(quotedUpgradeAmount(growthPlan, "monthly", undefined, "monthly")).toBe(
      50_000,
    );
  });

  it("classifies upgrades and downgrades by interval price", () => {
    expect(isPlanUpgrade(growthPlan, "monthly", starterPlan, "monthly")).toBe(
      true,
    );
    expect(
      isPlanDowngrade(starterPlan, "monthly", growthPlan, "monthly"),
    ).toBe(true);
    expect(
      isPlanDowngrade(prestigePlan, "yearly", growthPlan, "yearly"),
    ).toBe(false);
    expect(isPlanDowngrade(growthPlan, "monthly", undefined, "monthly")).toBe(
      false,
    );
  });

  it("detects prorated upgrades", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      isProratedUpgrade(
        growthPlan,
        "monthly",
        starterPlan,
        "monthly",
        future,
      ),
    ).toBe(true);
    expect(
      isProratedUpgrade(
        growthPlan,
        "monthly",
        undefined,
        "monthly",
        future,
      ),
    ).toBe(false);
  });
});
