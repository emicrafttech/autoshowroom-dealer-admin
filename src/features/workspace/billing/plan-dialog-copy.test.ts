import { describe, expect, it } from "vitest";
import {
  FOUNDING_OFFER_HEADLINE,
  VAT_INCLUSIVE_COPY,
  foundingOfferBannerCopy,
} from "./plan-dialog-copy";

describe("plan-dialog-copy", () => {
  it("exposes VAT-inclusive pricing copy", () => {
    expect(VAT_INCLUSIVE_COPY).toBe("All prices include VAT at 7.5%.");
  });

  it("returns founding-offer banner copy only while trialing", () => {
    expect(
      foundingOfferBannerCopy({ isTrialing: false, trialDays: 90 }),
    ).toBeNull();
    expect(
      foundingOfferBannerCopy({ isTrialing: true, trialDays: 90 }),
    ).toContain("90-day free Starter founding trial");
    expect(
      foundingOfferBannerCopy({ isTrialing: true, trialDays: 60 }),
    ).toContain("60-day free Starter founding trial");
    expect(foundingOfferBannerCopy({ isTrialing: true })).toContain(
      "90-day free Starter founding trial",
    );
    expect(FOUNDING_OFFER_HEADLINE).toBe("90-day free Starter founding trial");
  });
});
