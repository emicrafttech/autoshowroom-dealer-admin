import type { Plan } from "@/features/workspace/types";

export type ComparisonRowId =
  | "live_listings"
  | "staff_accounts"
  | "featured_placements"
  | "bulk_upload"
  | "follow_up_reminders"
  | "analytics"
  | "inspection_booking"
  | "whatsapp_handoff"
  | "verified_badge"
  | "dealer_profile"
  | "video_listings"
  | "lead_capture"
  | "monthly_performance_report"
  | "video_production_support"
  | "dedicated_account_manager"
  | "priority_support";

export type PlanComparisonRow = {
  id: ComparisonRowId;
  label: string;
  value: string;
};

export const COMPARISON_ROW_ORDER: ComparisonRowId[] = [
  "live_listings",
  "staff_accounts",
  "featured_placements",
  "bulk_upload",
  "follow_up_reminders",
  "analytics",
  "inspection_booking",
  "whatsapp_handoff",
  "verified_badge",
  "dealer_profile",
  "video_listings",
  "lead_capture",
  "monthly_performance_report",
  "video_production_support",
  "dedicated_account_manager",
  "priority_support",
];

export const COMPARISON_ROW_LABELS: Record<ComparisonRowId, string> = {
  live_listings: "Live listings",
  staff_accounts: "Staff accounts",
  featured_placements: "Featured placements per month",
  bulk_upload: "Bulk upload",
  follow_up_reminders: "Follow-up reminders",
  analytics: "Analytics",
  inspection_booking: "Inspection booking",
  whatsapp_handoff: "WhatsApp handoff",
  verified_badge: "Verified badge",
  dealer_profile: "Dealer profile",
  video_listings: "Video listings",
  lead_capture: "Lead capture",
  monthly_performance_report: "Monthly performance report",
  video_production_support: "Video production support",
  dedicated_account_manager: "Dedicated account manager",
  priority_support: "Priority support",
};

export const STRUCTURED_FEATURE_KEYS = new Set([
  "featured_slots",
  "performance_analytics",
  "bulk_upload",
  "follow_up_reminders",
]);

export const FEATURE_KEY_LABELS: Record<string, string> = {
  verified_badge: "Verified badge",
  dealer_profile: "Dealer profile",
  video_listings: "Video listings",
  lead_capture: "Lead capture",
  inspection_booking: "Inspection booking",
  whatsapp_handoff: "WhatsApp handoff",
  monthly_report: "Monthly performance report",
  video_production_support: "Video production support",
  dedicated_account_manager: "Dedicated account manager",
  priority_support: "Priority support",
  featured_slots: "Featured slots",
  video_walkarounds: "Video walkarounds",
  performance_analytics: "Performance analytics",
  finance_offers: "Finance offers",
  inventory_api: "Inventory API",
};

const FEATURE_FLAG_KEYS: Record<ComparisonRowId, string> = {
  inspection_booking: "inspection_booking",
  whatsapp_handoff: "whatsapp_handoff",
  verified_badge: "verified_badge",
  dealer_profile: "dealer_profile",
  video_listings: "video_listings",
  lead_capture: "lead_capture",
  monthly_performance_report: "monthly_report",
  video_production_support: "video_production_support",
  dedicated_account_manager: "dedicated_account_manager",
  priority_support: "priority_support",
  live_listings: "",
  staff_accounts: "",
  featured_placements: "",
  bulk_upload: "",
  follow_up_reminders: "",
  analytics: "",
};

export const EM_DASH = "—";
export const INCLUDED_VALUE = "Included";
export const UNLIMITED_VALUE = "Unlimited";

export function featureKeyLabel(key: string): string {
  if (FEATURE_KEY_LABELS[key]) return FEATURE_KEY_LABELS[key];
  return key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function limitValue(limit: number | null | undefined): string {
  if (limit == null) return UNLIMITED_VALUE;
  return String(limit);
}

function quantityOrDash(value: number | null | undefined): string {
  if (value == null || value <= 0) return EM_DASH;
  return String(value);
}

function booleanValue(enabled?: boolean): string {
  return enabled ? INCLUDED_VALUE : EM_DASH;
}

function hasFeature(plan: Plan, featureKey: string): boolean {
  return plan.features.includes(featureKey);
}

function comparisonValueForRow(plan: Plan, rowId: ComparisonRowId): string {
  switch (rowId) {
    case "live_listings":
      return limitValue(plan.listingLimit);
    case "staff_accounts":
      return limitValue(plan.staffLimit ?? null);
    case "featured_placements":
      return quantityOrDash(plan.featuredSlotsPerMonth);
    case "bulk_upload":
      return booleanValue(plan.bulkUpload);
    case "follow_up_reminders":
      return booleanValue(plan.followUpReminders);
    case "analytics":
      if (plan.analyticsTier === "basic") return "Basic";
      if (plan.analyticsTier === "full") return "Full";
      return EM_DASH;
    default:
      return hasFeature(plan, FEATURE_FLAG_KEYS[rowId])
        ? INCLUDED_VALUE
        : EM_DASH;
  }
}

export function buildPlanComparisonRows(plan: Plan): PlanComparisonRow[] {
  return COMPARISON_ROW_ORDER.map((id) => ({
    id,
    label: COMPARISON_ROW_LABELS[id],
    value: comparisonValueForRow(plan, id),
  })).filter((row) => row.value !== EM_DASH);
}

export function comparisonRowsExposeRawKeys(rows: PlanComparisonRow[]): boolean {
  const snakeCasePattern = /[a-z]+_[a-z]+/;
  return rows.some(
    (row) =>
      snakeCasePattern.test(row.label) ||
      snakeCasePattern.test(row.value) ||
      STRUCTURED_FEATURE_KEYS.has(row.label) ||
      STRUCTURED_FEATURE_KEYS.has(row.value),
  );
}
