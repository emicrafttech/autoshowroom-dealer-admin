export const VAT_INCLUSIVE_COPY = "All prices include VAT at 7.5%.";

export const FOUNDING_OFFER_HEADLINE = "90-day free Starter founding trial";

export function foundingOfferBannerCopy(options: {
  isTrialing: boolean;
  trialDays?: number;
}): string | null {
  if (!options.isTrialing) return null;
  const days = options.trialDays ?? 90;
  return `${days}-day free Starter founding trial — Starter renews after the trial ends. Add a payment card before then to enable auto-renewal.`;
}
