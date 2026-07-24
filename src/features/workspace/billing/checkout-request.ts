import type { CheckoutInitPayload } from "@/features/workspace/types";
import type { BillingInterval } from "./plan-pricing";

export function checkoutRequest(
  planId: string,
  billingInterval: BillingInterval,
): CheckoutInitPayload {
  return { planId, billingInterval };
}
