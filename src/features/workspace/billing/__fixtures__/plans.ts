import type { Plan } from "@/features/workspace/types";

export const starterPlan: Plan = {
  id: "starter",
  name: "Starter",
  priceNgn: 20_000,
  priceYearlyNgn: 180_000,
  listingLimit: 20,
  standLimit: null,
  staffLimit: 1,
  featuredSlotsPerMonth: 0,
  bulkUpload: false,
  followUpReminders: false,
  analyticsTier: "basic",
  features: [
    "verified_badge",
    "dealer_profile",
    "video_listings",
    "lead_capture",
    "inspection_booking",
    "whatsapp_handoff",
  ],
};

export const growthPlan: Plan = {
  id: "growth",
  name: "Growth",
  priceNgn: 50_000,
  priceYearlyNgn: 450_000,
  listingLimit: 75,
  standLimit: null,
  staffLimit: 5,
  featuredSlotsPerMonth: 3,
  bulkUpload: true,
  followUpReminders: true,
  analyticsTier: "full",
  features: [
    "verified_badge",
    "dealer_profile",
    "video_listings",
    "lead_capture",
    "inspection_booking",
    "whatsapp_handoff",
    "bulk_upload",
    "follow_up_reminders",
    "performance_analytics",
    "featured_slots",
  ],
};

export const prestigePlan: Plan = {
  id: "prestige",
  name: "Prestige",
  priceNgn: 150_000,
  listingLimit: null,
  standLimit: null,
  staffLimit: null,
  featuredSlotsPerMonth: 15,
  bulkUpload: true,
  followUpReminders: true,
  analyticsTier: "full",
  features: [
    "verified_badge",
    "dealer_profile",
    "video_listings",
    "lead_capture",
    "inspection_booking",
    "whatsapp_handoff",
    "bulk_upload",
    "follow_up_reminders",
    "performance_analytics",
    "featured_slots",
    "monthly_report",
    "video_production_support",
    "dedicated_account_manager",
    "priority_support",
  ],
};

export const planWithoutYearlyPrice: Plan = {
  ...starterPlan,
  id: "starter-no-yearly",
  priceYearlyNgn: undefined,
};
