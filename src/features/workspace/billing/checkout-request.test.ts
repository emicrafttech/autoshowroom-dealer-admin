import { describe, expect, it } from "vitest";
import { checkoutRequest } from "./checkout-request";

describe("checkout billingInterval payload", () => {
  it("builds the checkout request with billingInterval", () => {
    expect(checkoutRequest("growth", "yearly")).toEqual({
      planId: "growth",
      billingInterval: "yearly",
    });
  });
});
