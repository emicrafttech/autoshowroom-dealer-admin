import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BillingIntervalToggle } from "./billing-interval-toggle";
import { PlanComparisonCard } from "./plan-comparison-card";
import { growthPlan, starterPlan } from "./__fixtures__/plans";

describe("PlanComparisonCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders fixed comparison rows and yearly pricing copy", () => {
    render(
      <PlanComparisonCard
        actionPending={false}
        billingInterval="yearly"
        current={false}
        currentPlan={starterPlan}
        periodEnd={new Date(Date.now() + 86_400_000).toISOString()}
        plan={growthPlan}
        onDowngrade={vi.fn()}
        onUpgrade={vi.fn()}
      />,
    );

    expect(screen.getByText(/Growth/)).toBeInTheDocument();
    expect(screen.getByText(/\/yr/)).toBeInTheDocument();
    expect(
      screen.getByText("Pay 9 months, get 12 — save 25%"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Featured placements per month:/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText(/featured_slots/)).not.toBeInTheDocument();
  });

  it("shows monthly pricing without annual savings copy", () => {
    render(
      <PlanComparisonCard
        actionPending={false}
        billingInterval="monthly"
        current={false}
        currentPlan={starterPlan}
        plan={growthPlan}
        onDowngrade={vi.fn()}
        onUpgrade={vi.fn()}
      />,
    );

    expect(screen.getByText(/\/mo/)).toBeInTheDocument();
    expect(
      screen.queryByText("Pay 9 months, get 12 — save 25%"),
    ).not.toBeInTheDocument();
  });
});

describe("BillingIntervalToggle", () => {
  it("switches billing interval", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BillingIntervalToggle value="monthly" onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "yearly" }));
    expect(onChange).toHaveBeenCalledWith("yearly");
  });
});
