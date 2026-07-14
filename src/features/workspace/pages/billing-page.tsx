import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Download, Layers, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Dialog } from "@/components/ui";
import type {
  BillingSummary,
  Invoice,
  Paginated,
  Plan,
} from "@/features/workspace/types";
import { api, apiBlob, post } from "@/lib/api";
import { startPaystackCheckout } from "@/lib/paystack-checkout";
import { cn, formatDate, formatNgn, unwrapList } from "@/lib/utils";

type CheckoutInitResponse = {
  planId: string;
  reference: string;
  fullyCovered: boolean;
  publicKey?: string;
  email?: string;
  amountNgn?: number;
  amountKobo?: number;
  listPriceNgn?: number;
  creditAppliedNgn?: number;
  checkoutKind?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
};

type DowngradeResponse = {
  planId: string;
  planName: string;
  currentPlanId: string;
  currentPlanName: string;
  effectiveAt: string;
  status: string;
};

type PaymentMethodInitResponse = {
  reference: string;
  publicKey: string;
  email: string;
  amountNgn: number;
  amountKobo: number;
  verificationAmountNgn: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

type PaymentMethodCompleteResponse = {
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: string;
    expYear: string;
  };
};

function periodIsActive(periodEnd?: string) {
  return Boolean(periodEnd && new Date(periodEnd) > new Date());
}

function quotedUpgradeAmount(plan: Plan, currentPlan?: Plan, periodEnd?: string) {
  const currentPrice = currentPlan?.priceNgn ?? 0;
  if (
    plan.priceNgn > currentPrice &&
    periodIsActive(periodEnd) &&
    currentPrice > 0
  ) {
    return Math.max(0, plan.priceNgn - currentPrice);
  }
  return plan.priceNgn;
}

function usagePercent(used?: number, limit?: number | null) {
  if (limit == null || !limit) return 0;
  return Math.min(100, Math.round(((used ?? 0) / limit) * 100));
}

function limitLabel(used?: number, limit?: number | null) {
  if (limit == null) return `${used ?? 0} / Unlimited`;
  return `${used ?? 0}/${limit}`;
}

const DEALER_CAPABILITIES: Record<string, string> = {
  featured_slots: "Featured slots",
  video_walkarounds: "Video walkarounds",
  performance_analytics: "Performance analytics",
  multiple_stands: "Multiple stands",
  finance_offers: "Finance offers",
  priority_support: "Priority support",
  verified_badge: "Verified badge",
  inventory_api: "Inventory API",
};

function planFeatureLabel(feature: string) {
  return DEALER_CAPABILITIES[feature] ?? feature;
}

function formatCardBrand(brand: string) {
  const normalized = brand.trim().toLowerCase()
  if (!normalized) return 'Card'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function invoiceDownloadName(invoice: Invoice, index: number) {
  return `autoshowroom-invoice-${invoice.issuedAt.slice(0, 10)}-${String(index + 1).padStart(3, "0")}.pdf`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatUsageCard({
  label,
  value,
  helper,
  percent,
  tone = "lime",
}: {
  label: string;
  value: string | number;
  helper: string;
  percent: number;
  tone?: "lime" | "amber" | "blue";
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
      <div className="text-[11px] font-[900!important] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-3 font-display text-[30px] font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "lime" && "bg-lime-300",
            tone === "amber" && "bg-amber-300",
            tone === "blue" && "bg-blue-300",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-[12px] font-medium text-neutral-500">{helper}</p>
    </div>
  );
}

function PlanCard({
  plan,
  current,
  pendingDowngrade,
  currentPlan,
  periodEnd,
  actionPending,
  onUpgrade,
  onDowngrade,
}: {
  plan: Plan;
  current: boolean;
  pendingDowngrade?: boolean;
  currentPlan?: Plan;
  periodEnd?: string;
  actionPending: boolean;
  onUpgrade: (planId: string) => void;
  onDowngrade: (planId: string) => void;
}) {
  const currentPrice = currentPlan?.priceNgn ?? 0;
  const isUpgrade = plan.priceNgn > currentPrice;
  const isDowngrade = plan.priceNgn < currentPrice;
  const dueToday = quotedUpgradeAmount(plan, currentPlan, periodEnd);
  const isProrated = isUpgrade && dueToday < plan.priceNgn && dueToday > 0;

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
        {formatNgn(plan.priceNgn)}
        <span className="text-[13px] text-neutral-400">/mo</span>
      </div>
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
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-lime-300" />{" "}
          {plan.listingLimit == null
            ? "Unlimited live listings"
            : `${plan.listingLimit} live listings`}
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-lime-300" />{" "}
          {plan.staffLimit == null
            ? "Unlimited staff seats"
            : `${plan.staffLimit} staff seats`}
        </div>
        {(plan.featuredSlotsPerMonth ?? 0) > 0 ? (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-lime-300" />{" "}
            {plan.featuredSlotsPerMonth} featured placements / month
          </div>
        ) : null}
        {plan.bulkUpload ? (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-lime-300" /> Bulk upload
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-lime-300" />{" "}
          {plan.analyticsTier === "full" ? "Full analytics" : "Basic analytics"}
        </div>
        {plan.features.slice(0, 3).map((feature) => (
          <div className="flex items-center gap-2" key={feature}>
            <Check className="h-4 w-4 shrink-0 text-lime-300" />{" "}
            {planFeatureLabel(feature)}
          </div>
        ))}
      </div>
      <Button
        className="mt-5 w-full shrink-0"
        disabled={current || pendingDowngrade || actionPending}
        type="button"
        variant={current || pendingDowngrade ? "secondary" : isDowngrade ? "secondary" : "primary"}
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

export function BillingPage() {
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const summary = useQuery({
    queryKey: ["billing-summary"],
    queryFn: () => api<BillingSummary>("/v1/billing/summary"),
  });
  const plans = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => api<Paginated<Plan> | Plan[]>("/v1/billing/plans"),
  });
  const invoices = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api<Paginated<Invoice>>("/v1/billing/invoices"),
  });
  const checkout = useMutation({
    mutationFn: async (planId: string) => {
      const init = await post<CheckoutInitResponse>("/v1/billing/checkout", {
        planId,
      });

      if (!init.fullyCovered) {
        if (!init.publicKey || !init.email || !init.amountKobo) {
          throw new Error("Paystack checkout could not be started.");
        }
        const payment = await startPaystackCheckout({
          publicKey: init.publicKey,
          email: init.email,
          amountKobo: init.amountKobo,
          reference: init.reference,
          currency: init.currency,
          metadata: init.metadata,
        });
        return post("/v1/billing/checkout/complete", {
          planId,
          reference: payment.reference || init.reference,
        });
      }

      return post("/v1/billing/checkout/complete", {
        planId,
        reference: init.reference,
      });
    },
    onSuccess: async () => {
      toast.success("Subscription updated");
      setPlansDialogOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
  const updatePaymentMethod = useMutation({
    mutationFn: async () => {
      const init = await post<PaymentMethodInitResponse>(
        "/v1/billing/payment-method/update",
      );
      if (!init.publicKey || !init.email || !init.amountKobo) {
        throw new Error("Paystack card update could not be started.");
      }
      const payment = await startPaystackCheckout({
        publicKey: init.publicKey,
        email: init.email,
        amountKobo: init.amountKobo,
        reference: init.reference,
        currency: init.currency,
        metadata: init.metadata,
      });
      return post<PaymentMethodCompleteResponse>(
        "/v1/billing/payment-method/complete",
        { reference: payment.reference || init.reference },
      );
    },
    onSuccess: async () => {
      toast.success("Payment method updated");
      await queryClient.invalidateQueries({ queryKey: ["billing-summary"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const downgrade = useMutation({
    mutationFn: (targetPlanId: string) =>
      post<DowngradeResponse>("/v1/billing/downgrade-request", { targetPlanId }),
    onSuccess: async (result) => {
      toast.success(
        `Downgrade to ${result.planName} scheduled for ${formatDate(result.effectiveAt)}`,
      );
      setPlansDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["billing-summary"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const invoiceItems = unwrapList(invoices.data);
  const downloadInvoice = useMutation({
    mutationFn: async ({ invoice, index }: { invoice: Invoice; index: number }) => {
      const blob = await apiBlob(`/v1/billing/invoices/${invoice.id}/pdf`);
      triggerDownload(blob, invoiceDownloadName(invoice, index));
    },
    onError: (error) => toast.error(error.message),
  });
  const downloadAllInvoices = useMutation({
    mutationFn: async () => {
      for (const [index, invoice] of invoiceItems.entries()) {
        const blob = await apiBlob(`/v1/billing/invoices/${invoice.id}/pdf`);
        triggerDownload(blob, invoiceDownloadName(invoice, index));
      }
    },
    onSuccess: () => toast.success("Invoices downloaded"),
    onError: (error) => toast.error(error.message),
  });
  const availablePlans = unwrapList(plans.data);
  const planId =
    summary.data?.subscription?.plan?.id ??
    summary.data?.planId ??
    undefined;
  const currentPlan =
    summary.data?.subscription?.plan ??
    availablePlans.find((plan) => plan.id === planId) ??
    availablePlans.find((plan) => plan.id === "starter") ??
    availablePlans[0];
  const pendingDowngrade = summary.data?.pendingDowngrade;
  const paymentMethod = summary.data?.paymentMethod;
  const billingActionPending = checkout.isPending || downgrade.isPending;
  const paymentMethodActionPending = updatePaymentMethod.isPending;
  const canChangePlan = availablePlans.length > 1 && !billingActionPending;
  const nextChargeDate = summary.data?.subscription?.currentPeriodEnd;
  const trial = summary.data?.trial;
  const isTrialing =
    Boolean(trial?.isTrialing) ||
    summary.data?.subscription?.status === "trialing";
  const renewAmount =
    trial?.renewPriceNgn ??
    currentPlan?.priceNgn ??
    summary.data?.subscription?.amountNgn ??
    0;
  const nextChargeAmount = isTrialing ? renewAmount : (currentPlan?.priceNgn ?? renewAmount);
  const autoRenewBlocked =
    isTrialing &&
    (trial?.autoRenewBlockedUntilCard !== false) &&
    !paymentMethod;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">
          Billing
        </h1>
        <p className="mt-2 text-[14px] font-medium text-neutral-400">
          Your plan, usage, payment method, and invoices.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-[20px] border border-lime-300/25 bg-lime-300/10 p-5 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[21px] font-semibold tracking-[-0.02em] text-white">
              {currentPlan?.name ?? "Starter"}
            </h2>
            {isTrialing ? (
              <Badge tone="amber">Free trial</Badge>
            ) : (
              <Badge tone="lime">Current plan</Badge>
            )}
          </div>
          {isTrialing ? (
            <p className="mt-2 text-[13px] font-medium text-lime-100/70">
              {trial?.trialDays ?? 90}-day founding trial
              {nextChargeDate ? ` · ends ${formatDate(nextChargeDate)}` : ""}
              . You will renew at {formatNgn(renewAmount)}/mo after the trial.
            </p>
          ) : (
            <p className="mt-2 text-[13px] font-medium text-lime-100/70">
              Renews{" "}
              {nextChargeDate
                ? formatDate(nextChargeDate)
                : "at the next billing cycle"}{" "}
              · Naira billing
            </p>
          )}
          {autoRenewBlocked ? (
            <p className="mt-2 text-[13px] font-semibold text-amber-200">
              Auto-renewal is blocked until you add a payment card.
            </p>
          ) : null}
          {pendingDowngrade ? (
            <p className="mt-2 text-[13px] font-semibold text-amber-200">
              Downgrading to {pendingDowngrade.planName} on{" "}
              {formatDate(pendingDowngrade.effectiveAt)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="font-display text-[28px] font-semibold text-white">
            {isTrialing ? (
              <>
                Free
                <span className="text-[13px] text-neutral-400">
                  {" "}
                  · then {formatNgn(renewAmount)}/mo
                </span>
              </>
            ) : (
              <>
                {formatNgn(currentPlan?.priceNgn ?? 0)}
                <span className="text-[13px] text-neutral-400">/mo</span>
              </>
            )}
          </div>
          <Button
            disabled={!canChangePlan}
            type="button"
            onClick={() => setPlansDialogOpen(true)}
          >
            Change plan
          </Button>
        </div>
      </section>

      <Dialog
        open={plansDialogOpen}
        panelClassName="max-h-[90vh] max-w-5xl overflow-y-auto"
        title="Choose a plan"
        onClose={() => {
          if (billingActionPending) return;
          setPlansDialogOpen(false);
        }}
      >
        <p className="mb-5 text-[14px] font-medium leading-6 text-neutral-400">
          Upgrades charge the price difference while your current billing cycle
          is active. Downgrades take effect at the next renewal date.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {availablePlans.map((plan) => (
            <PlanCard
              actionPending={billingActionPending}
              current={currentPlan?.id === plan.id}
              currentPlan={currentPlan}
              key={plan.id}
              pendingDowngrade={pendingDowngrade?.planId === plan.id}
              periodEnd={nextChargeDate}
              plan={plan}
              onDowngrade={(planId) => downgrade.mutate(planId)}
              onUpgrade={(planId) => checkout.mutate(planId)}
            />
          ))}
        </div>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <StatUsageCard
          helper={
            summary.data?.listingLimit == null
              ? "Unlimited listings on your plan"
              : "Active listings against plan limit"
          }
          label="Listing usage"
          percent={usagePercent(
            summary.data?.activeListings,
            summary.data?.listingLimit,
          )}
          value={limitLabel(
            summary.data?.activeListings,
            summary.data?.listingLimit,
          )}
        />
        <StatUsageCard
          helper={
            summary.data?.canInviteStaff
              ? "Staff seats available"
              : "At capacity — upgrade for more seats"
          }
          label="Staff seats"
          percent={usagePercent(
            summary.data?.staffCount,
            summary.data?.staffLimit,
          )}
          tone="amber"
          value={limitLabel(
            summary.data?.staffCount,
            summary.data?.staffLimit,
          )}
        />
        <StatUsageCard
          helper={
            summary.data?.canFeature
              ? "Featured placements this month"
              : "Upgrade to feature listings"
          }
          label="Featured"
          percent={usagePercent(
            summary.data?.featuredUsed,
            summary.data?.featuredLimit,
          )}
          tone="blue"
          value={`${summary.data?.featuredUsed ?? 0}/${summary.data?.featuredLimit ?? 0}`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="overflow-x-auto rounded-[20px] border border-white/8 bg-[#101014]/80 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <h2 className="font-display text-[19px] font-semibold text-white">
              Invoices
            </h2>
            <button
              className="cursor-pointer text-[12px] font-[900!important] text-lime-300"
              disabled={!invoiceItems.length || downloadAllInvoices.isPending}
              type="button"
              onClick={() => downloadAllInvoices.mutate()}
            >
              {downloadAllInvoices.isPending ? "Downloading..." : "Download all"}
            </button>
          </div>
          <div className="grid min-w-[720px] grid-cols-[1fr_130px_130px_150px_40px] border-b border-white/8 px-5 py-3 text-[11px] font-[900!important] uppercase tracking-[0.14em] text-neutral-500">
            <div>Invoice</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Issued</div>
            <div />
          </div>
          {invoiceItems.length ? (
            <div className="divide-y divide-white/8">
              {invoiceItems.map((invoice, index) => (
                <div
                  className="grid min-w-[720px] grid-cols-[1fr_130px_130px_150px_40px] items-center px-5 py-4 text-[13px] font-semibold text-neutral-300"
                  key={invoice.id}
                >
                  <div className="font-[900!important] text-white">
                    INV-{invoice.issuedAt.slice(0, 4)}-
                    {String(index + 1).padStart(3, "0")}
                  </div>
                  <div>{formatNgn(invoice.amountNgn)}</div>
                  <div className="inline-flex items-center gap-2 text-lime-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                    {invoice.status}
                  </div>
                  <div>{formatDate(invoice.issuedAt)}</div>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition hover:bg-white/8 hover:text-white"
                    aria-label="Download invoice"
                    disabled={downloadInvoice.isPending}
                    type="button"
                    onClick={() => downloadInvoice.mutate({ invoice, index })}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-[13px] font-semibold text-neutral-500">
              No invoices yet.
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[19px] font-semibold text-white">
              Payment method
            </h2>
            {paymentMethod ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/8 text-lime-200">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-[900!important] text-white">
                      {formatCardBrand(paymentMethod.brand)} ending in {paymentMethod.last4}
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-neutral-500">
                      Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
                <div className="text-[13px] font-[900!important] text-white">
                  No payment card added yet
                </div>
                <p className="mt-1 text-[12px] font-medium leading-5 text-neutral-500">
                  {autoRenewBlocked
                    ? "Auto-renewal cannot run without a card. Add one before your trial ends."
                    : "Pay a small verification charge to save your card for renewals."}
                </p>
              </div>
            )}
            <Button
              className="mt-4 w-full"
              disabled={paymentMethodActionPending || !summary.data?.subscription}
              type="button"
              variant="secondary"
              onClick={() => updatePaymentMethod.mutate()}
            >
              {paymentMethodActionPending
                ? "Opening Paystack..."
                : paymentMethod
                  ? "Update card"
                  : "Add card"}
            </Button>
          </section>

          <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[19px] font-semibold text-white">
              {isTrialing ? "After trial" : "Next charge"}
            </h2>
            <div className="mt-5 space-y-4 border-b border-white/8 pb-5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-neutral-500">
                  {isTrialing ? "Renewal amount" : "Amount"}
                </span>
                <span className="font-[900!important] text-white">
                  {formatNgn(nextChargeAmount)}
                  {isTrialing ? "/mo" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-neutral-500">
                  {isTrialing ? "Trial ends" : "Date"}
                </span>
                <span className="font-[900!important] text-white">
                  {nextChargeDate
                    ? formatDate(nextChargeDate)
                    : "Not scheduled"}
                </span>
              </div>
              {isTrialing ? (
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="font-semibold text-neutral-500">Auto-renewal</span>
                  <span
                    className={`font-[900!important] ${
                      autoRenewBlocked ? "text-amber-200" : "text-lime-200"
                    }`}
                  >
                    {autoRenewBlocked ? "Blocked — add a card" : "Enabled"}
                  </span>
                </div>
              ) : null}
            </div>
            <button
              className="mt-5 cursor-pointer text-[13px] font-[900!important] text-red-300"
              type="button"
              onClick={() => setPlansDialogOpen(true)}
            >
              Cancel or downgrade plan
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
