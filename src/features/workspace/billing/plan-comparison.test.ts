import { describe, expect, it } from "vitest";
import type { Plan } from "@/features/workspace/types";
import {
  COMPARISON_ROW_LABELS,
  COMPARISON_ROW_ORDER,
  buildPlanComparisonRows,
  comparisonRowsExposeRawKeys,
  featureKeyLabel,
} from "./plan-comparison";
import {
  growthPlan,
  prestigePlan,
  starterPlan,
} from "./__fixtures__/plans";

describe("plan-comparison", () => {
  it("returns available rows in canonical order", () => {
    const rows = buildPlanComparisonRows(starterPlan);
    expect(rows.map((row) => row.id)).toEqual([
      "live_listings",
      "staff_accounts",
      "analytics",
      "inspection_booking",
      "whatsapp_handoff",
      "verified_badge",
      "dealer_profile",
      "video_listings",
      "lead_capture",
    ]);
    expect(rows.map((row) => row.label)).toEqual(
      rows.map((row) => COMPARISON_ROW_LABELS[row.id]),
    );
    expect(rows.every((row) => COMPARISON_ROW_ORDER.includes(row.id))).toBe(true);
  });

  it("maps starter structured limits and included flags", () => {
    const rows = buildPlanComparisonRows(starterPlan);
    const byLabel = Object.fromEntries(rows.map((row) => [row.label, row.value]));

    expect(byLabel["Live listings"]).toBe("20");
    expect(byLabel["Staff accounts"]).toBe("1");
    expect(byLabel).not.toHaveProperty("Featured placements per month");
    expect(byLabel).not.toHaveProperty("Bulk upload");
    expect(byLabel).not.toHaveProperty("Follow-up reminders");
    expect(byLabel.Analytics).toBe("Basic");
    expect(byLabel["Inspection booking"]).toBe("Included");
    expect(byLabel["WhatsApp handoff"]).toBe("Included");
    expect(byLabel).not.toHaveProperty("Monthly performance report");
    expect(byLabel).not.toHaveProperty("Priority support");
  });

  it("maps growth and prestige values without duplicate structured feature rows", () => {
    const growthRows = buildPlanComparisonRows(growthPlan);
    const prestigeRows = buildPlanComparisonRows(prestigePlan);

    expect(
      growthRows.find((row) => row.label === "Featured placements per month")
        ?.value,
    ).toBe("3");
    expect(growthRows.find((row) => row.label === "Bulk upload")?.value).toBe(
      "Included",
    );
    expect(growthRows.find((row) => row.label === "Analytics")?.value).toBe(
      "Full",
    );
    expect(
      prestigeRows.find((row) => row.label === "Live listings")?.value,
    ).toBe("Unlimited");
    expect(
      prestigeRows.find((row) => row.label === "Staff accounts")?.value,
    ).toBe("Unlimited");
    expect(
      prestigeRows.find((row) => row.label === "Dedicated account manager")
        ?.value,
    ).toBe("Included");
    expect(
      prestigeRows.find((row) => row.label === "Priority support")?.value,
    ).toBe("Included");

    expect(comparisonRowsExposeRawKeys(growthRows)).toBe(false);
    expect(comparisonRowsExposeRawKeys(prestigeRows)).toBe(false);
    expect(growthRows.some((row) => row.label.includes("_"))).toBe(false);
    expect(growthRows.some((row) => row.value.includes("_"))).toBe(false);
  });

  it("labels known and unknown feature keys without snake_case leakage", () => {
    expect(featureKeyLabel("verified_badge")).toBe("Verified badge");
    expect(featureKeyLabel("performance_analytics")).toBe(
      "Performance analytics",
    );
    expect(featureKeyLabel("custom_feature_key")).toBe("Custom Feature Key");
  });

  it("detects raw key exposure in comparison rows", () => {
    const rows = buildPlanComparisonRows(starterPlan);
    expect(
      comparisonRowsExposeRawKeys([
        ...rows,
        {
          id: "priority_support",
          label: "performance_analytics",
          value: "Included",
        },
      ]),
    ).toBe(true);
  });

  it("omits analytics when its tier is absent", () => {
    const planWithoutAnalytics: Plan = {
      ...starterPlan,
      analyticsTier: undefined,
    };
    const rows = buildPlanComparisonRows(planWithoutAnalytics);
    expect(rows.find((row) => row.id === "analytics")).toBeUndefined();
  });
});
