import {
  Car,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Share2,
  Tag,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BlurImage } from "@/components/blur-image";
import { Badge, Button } from "@/components/ui";
import type { InventoryViewMode } from "@/features/workspace/components/cars/cars-status-tabs";
import { vehicleImageUrl, vehicleTitle } from "@/features/workspace/utils";
import type { Vehicle } from "@/features/workspace/types";
import { cn, formatCompactNgn, formatRelativeDate } from "@/lib/utils";

type CarsInventoryTableProps = {
  vehicles: Vehicle[];
  totalCount: number;
  inventoryCount: number;
  currentPage: number;
  pageCount: number;
  viewMode: InventoryViewMode;
  onAddVehicle: () => void;
  onDelete: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onPageChange: (page: number) => void;
  onShare: (vehicle: Vehicle) => void;
  onStatusChange: (
    vehicle: Vehicle,
    status: "available" | "hidden" | "reserved" | "sold",
  ) => void;
  onToggleFeature?: (vehicle: Vehicle) => void;
  onView: (vehicle: Vehicle) => void;
};

function VehicleActionsMenu({
  vehicle,
  onDelete,
  onEdit,
  onShare,
  onStatusChange,
  onToggleFeature,
  onView,
  triggerClassName,
  menuPlacement = "bottom",
}: {
  vehicle: Vehicle;
  onDelete: CarsInventoryTableProps["onDelete"];
  onEdit: CarsInventoryTableProps["onEdit"];
  onShare: CarsInventoryTableProps["onShare"];
  onStatusChange: CarsInventoryTableProps["onStatusChange"];
  onToggleFeature?: CarsInventoryTableProps["onToggleFeature"];
  onView: CarsInventoryTableProps["onView"];
  triggerClassName?: string;
  menuPlacement?: "bottom" | "top";
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [open]);

  function runAction(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div
      className="relative z-20 inline-flex shrink-0"
      ref={menuRef}
      onClick={(event) => event.stopPropagation()}
    >
      <Button
        aria-label={`Open actions for ${vehicleTitle(vehicle)}`}
        className={triggerClassName}
        size="sm"
        type="button"
        variant="ghost"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className={cn(
            "absolute right-0 z-50 w-[240px] rounded-[22px] border border-white/10 bg-[#18181d] p-4 text-left shadow-2xl shadow-black/50",
            menuPlacement === "top"
              ? "bottom-[calc(100%+8px)]"
              : "top-[calc(100%+8px)]",
          )}
        >
          <button
            className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-white transition hover:bg-white/8"
            type="button"
            onClick={() => runAction(() => onView(vehicle))}
          >
            <Eye className="h-6 w-6 text-lime-300" />
            View car
          </button>
          <button
            className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-white transition hover:bg-white/8"
            type="button"
            onClick={() => runAction(() => onEdit(vehicle))}
          >
            <Pencil className="h-6 w-6 text-neutral-400" />
            Edit details
          </button>
          <button
            className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-white transition hover:bg-white/8"
            type="button"
            onClick={() => runAction(() => onShare(vehicle))}
          >
            <Share2 className="h-6 w-6 text-neutral-400" />
            Share link
          </button>
          {onToggleFeature ? (
            <button
              className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-white transition hover:bg-white/8"
              type="button"
              onClick={() => runAction(() => onToggleFeature(vehicle))}
            >
              <Tag className="h-6 w-6 text-lime-300" />
              {vehicle.isFeatured ? "Remove featured" : "Feature listing"}
            </button>
          ) : null}
          <div className="my-3 h-px bg-white/10" />
          {vehicle.status !== "hidden" ? (
            <button
              className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-white transition hover:bg-white/8"
              type="button"
              onClick={() => runAction(() => onStatusChange(vehicle, "hidden"))}
            >
              <EyeOff className="h-6 w-6 text-neutral-400" />
              Hide car
            </button>
          ) : (
            <button
              className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-white transition hover:bg-white/8"
              type="button"
              onClick={() =>
                runAction(() => onStatusChange(vehicle, "available"))
              }
            >
              <Eye className="h-6 w-6 text-lime-300" />
              Show car
            </button>
          )}
          {vehicle.status !== "sold" ? (
            <button
              className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-amber-200 transition hover:bg-amber-300/10 hover:text-amber-100"
              type="button"
              onClick={() => runAction(() => onStatusChange(vehicle, "sold"))}
            >
              <Tag className="h-6 w-6" />
              Mark as sold
            </button>
          ) : (
            <button
              className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-lime-200 transition hover:bg-lime-300/10 hover:text-lime-100"
              type="button"
              onClick={() =>
                runAction(() => onStatusChange(vehicle, "available"))
              }
            >
              <Eye className="h-6 w-6" />
              Mark as available
            </button>
          )}
          <div className="my-3 h-px bg-white/10" />
          <button
            className="flex h-14 w-full cursor-pointer items-center gap-4 rounded-xl px-3 text-[20px] font-[900!important] text-red-300 transition hover:bg-red-400/10 hover:text-red-200"
            type="button"
            onClick={() => runAction(() => onDelete(vehicle))}
          >
            <Trash2 className="h-6 w-6" />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EmptyCarsState({
  isFiltered,
  onAddVehicle,
}: {
  isFiltered: boolean;
  onAddVehicle: () => void;
}) {
  return (
    <div className="grid min-h-[520px] place-items-center border-t border-white/8 px-6 py-12 text-center">
      <div className="max-w-[460px]">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] border border-lime-300/20 bg-lime-300/10 text-lime-300 shadow-2xl shadow-lime-950/20">
          {isFiltered ? (
            <Search className="h-10 w-10" />
          ) : (
            <Car className="h-10 w-10" />
          )}
        </div>
        <h2 className="mt-6 font-display text-[26px] font-semibold tracking-[-0.035em] text-white">
          {isFiltered ? "No cars match this view" : "No cars yet"}
        </h2>
        <p className="mt-3 text-[14px] font-medium leading-7 text-neutral-400">
          {isFiltered
            ? "Try changing the search or status filter to find a listing."
            : "Add your first vehicle with clean photos, videos, and pricing. It will go through admin review before buyers see it."}
        </p>
        {!isFiltered ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={onAddVehicle}>
              <Plus className="h-4 w-4" />
              Add vehicle
            </Button>
            <div className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/8 px-5 text-[14px] font-[900!important] text-neutral-300 ring-1 ring-white/10">
              <UploadCloud className="h-4 w-4" />6 media · 3 videos required
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ReviewBadgeTone = "lime" | "amber" | "red";

function vehicleReviewMeta(vehicle: Vehicle) {
  const reviewStatus = vehicle.openReviewIssueCount
    ? "issues_open"
    : (vehicle.listingVerificationStatus ?? vehicle.reviewStatus ?? "draft");
  const reviewTone: ReviewBadgeTone =
    reviewStatus === "approved"
      ? "lime"
      : reviewStatus === "rejected" || reviewStatus === "issues_open"
        ? "red"
        : "amber";
  const reviewLabel = reviewStatus.replaceAll("_", " ");
  return { reviewStatus, reviewTone, reviewLabel };
}

function InventoryPaginationFooter({
  currentPage,
  end,
  pageCount,
  start,
  totalCount,
  bordered = true,
  onPageChange,
}: {
  currentPage: number;
  end: number;
  pageCount: number;
  start: number;
  totalCount: number;
  bordered?: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 text-[13px] font-medium text-neutral-500",
        bordered
          ? "border-t border-white/8 px-4 py-4 sm:px-6 sm:py-5"
          : "pt-4",
      )}
    >
      <div>
        Showing {start}-{end} of {totalCount} vehicles
      </div>
      {pageCount > 1 ? (
        <div className="flex gap-2">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(
            (page) => (
              <button
                className={cn(
                  "h-9 w-9 cursor-pointer rounded-xl text-[13px] font-[900!important] transition",
                  page === currentPage
                    ? "bg-lime-300 text-neutral-950"
                    : "bg-white/8 text-neutral-300 ring-1 ring-white/8 hover:bg-white/12",
                )}
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function InventoryGridCard({
  vehicle,
  onDelete,
  onEdit,
  onShare,
  onStatusChange,
  onToggleFeature,
  onView,
}: {
  vehicle: Vehicle;
  onDelete: CarsInventoryTableProps["onDelete"];
  onEdit: CarsInventoryTableProps["onEdit"];
  onShare: CarsInventoryTableProps["onShare"];
  onStatusChange: CarsInventoryTableProps["onStatusChange"];
  onToggleFeature?: CarsInventoryTableProps["onToggleFeature"];
  onView: CarsInventoryTableProps["onView"];
}) {
  const imageUrl = vehicleImageUrl(vehicle);
  const sold = vehicle.status === "sold";
  const { reviewLabel, reviewTone } = vehicleReviewMeta(vehicle);

  return (
    <article
      className={cn(
        "group rounded-[18px] border border-white/8 bg-[#141419]/80",
        sold && "opacity-80",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[18px] bg-white/8">
        <button
          className="block h-full w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
          type="button"
          onClick={() => onView(vehicle)}
        >
          {imageUrl ? (
            <BlurImage
              alt={vehicleTitle(vehicle)}
              className={cn(
                "h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]",
                sold && "brightness-[0.75] grayscale-[0.45]",
              )}
              src={imageUrl}
            />
          ) : (
            <div className="grid h-full place-items-center text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-600">
              No image
            </div>
          )}
        </button>
        <span
          className={cn(
            "absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-[900!important] capitalize backdrop-blur-sm",
            vehicle.status === "available"
              ? "text-lime-300"
              : vehicle.status === "reserved"
                ? "text-amber-300"
                : "text-neutral-300",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              vehicle.status === "available"
                ? "bg-lime-300"
                : vehicle.status === "reserved"
                  ? "bg-amber-300"
                  : "bg-neutral-500",
            )}
          />
          {vehicle.status}
        </span>
        {vehicle.isFeatured ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-lime-300 px-2.5 py-1 text-[11px] font-[900!important] text-neutral-950">
            Featured
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <button
              className="font-display text-left text-[17px] font-semibold leading-tight tracking-[-0.02em] text-white transition hover:underline cursor-pointer appearance-none border-0 bg-transparent p-0"
              type="button"
              onClick={() => onView(vehicle)}
            >
              {vehicleTitle(vehicle)}
            </button>
            <p className="mt-1 text-[12.5px] font-medium text-neutral-500">
              {vehicle.year} ·{" "}
              {vehicle.mileageKm
                ? `${vehicle.mileageKm.toLocaleString()} km`
                : "Mileage not set"}{" "}
              · {vehicle.media?.length ?? 0} media
            </p>
          </div>
          <VehicleActionsMenu
            menuPlacement="top"
            triggerClassName="bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
            vehicle={vehicle}
            onDelete={onDelete}
            onEdit={onEdit}
            onShare={onShare}
            onStatusChange={onStatusChange}
            onToggleFeature={onToggleFeature}
            onView={onView}
          />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="font-display text-[20px] font-semibold tracking-[-0.02em] text-white">
            {formatCompactNgn(vehicle.priceNgn)}
          </div>
          <div className="text-right text-[12px] font-medium text-neutral-500">
            {formatRelativeDate(vehicle.publishedAt ?? vehicle.createdAt)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={reviewTone}>{reviewLabel}</Badge>
          {vehicle.isFeatured ? <Badge tone="lime">Featured</Badge> : null}
          {vehicle.openReviewIssueCount ? (
            <span className="text-[11px] font-bold text-red-300">
              {vehicle.openReviewIssueCount} issue
              {vehicle.openReviewIssueCount === 1 ? "" : "s"} to fix
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function InventoryGrid({
  vehicles,
  onDelete,
  onEdit,
  onShare,
  onStatusChange,
  onToggleFeature,
  onView,
}: {
  vehicles: Vehicle[];
  onDelete: CarsInventoryTableProps["onDelete"];
  onEdit: CarsInventoryTableProps["onEdit"];
  onShare: CarsInventoryTableProps["onShare"];
  onStatusChange: CarsInventoryTableProps["onStatusChange"];
  onToggleFeature?: CarsInventoryTableProps["onToggleFeature"];
  onView: CarsInventoryTableProps["onView"];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {vehicles.map((vehicle) => (
        <InventoryGridCard
          key={vehicle.id}
          vehicle={vehicle}
          onDelete={onDelete}
          onEdit={onEdit}
          onShare={onShare}
          onStatusChange={onStatusChange}
          onToggleFeature={onToggleFeature}
          onView={onView}
        />
      ))}
    </div>
  );
}

export function CarsInventoryTable({
  vehicles,
  totalCount,
  inventoryCount,
  currentPage,
  pageCount,
  viewMode,
  onAddVehicle,
  onDelete,
  onEdit,
  onPageChange,
  onShare,
  onStatusChange,
  onToggleFeature,
  onView,
}: CarsInventoryTableProps) {
  const isEmpty = vehicles.length === 0;
  const start = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const end = Math.min(currentPage * 10, totalCount);
  const paginationFooter = (bordered = true) =>
    vehicles.length ? (
      <InventoryPaginationFooter
        bordered={bordered}
        currentPage={currentPage}
        end={end}
        pageCount={pageCount}
        start={start}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    ) : null;

  if (viewMode === "grid") {
    if (!vehicles.length) {
      return (
        <EmptyCarsState
          isFiltered={inventoryCount > 0 && isEmpty}
          onAddVehicle={onAddVehicle}
        />
      );
    }
    return (
      <>
        <InventoryGrid
          vehicles={vehicles}
          onDelete={onDelete}
          onEdit={onEdit}
          onShare={onShare}
          onStatusChange={onStatusChange}
          onToggleFeature={onToggleFeature}
          onView={onView}
        />
        {paginationFooter(false)}
      </>
    );
  }

  const gridContent = vehicles.length ? (
    <>
      <InventoryGrid
        vehicles={vehicles}
        onDelete={onDelete}
        onEdit={onEdit}
        onShare={onShare}
        onStatusChange={onStatusChange}
        onToggleFeature={onToggleFeature}
        onView={onView}
      />
      {paginationFooter()}
    </>
  ) : (
    <EmptyCarsState
      isFiltered={inventoryCount > 0 && isEmpty}
      onAddVehicle={onAddVehicle}
    />
  );

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#111114]/90">
      <div className="md:hidden">{gridContent}</div>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-[13.5px]">
            <thead className="bg-white/3 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              <tr>
                <th className="px-6 py-5 font-bold">Vehicle</th>
                <th className="px-6 py-5 font-bold">Status</th>
                <th className="px-6 py-5 font-bold">Price</th>
                <th className="px-6 py-5 font-bold">Review</th>
                <th className="px-6 py-5 font-bold">Listed</th>
                <th className="px-6 py-5 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {vehicles.map((vehicle) => {
                const imageUrl = vehicleImageUrl(vehicle);
                const { reviewLabel, reviewTone } = vehicleReviewMeta(vehicle);
                return (
                  <tr className="text-neutral-300" key={vehicle.id}>
                    <td className="px-6 py-4">
                      <div
                        className={cn(
                          "flex items-center gap-4",
                          vehicle.status === "sold" ? "opacity-55" : "",
                        )}
                      >
                        <div className="h-[52px] w-[74px] overflow-hidden rounded-xl bg-white/8 ring-1 ring-white/8">
                          {imageUrl ? (
                            <BlurImage
                              alt={vehicleTitle(vehicle)}
                              className="h-full w-full object-cover"
                              src={imageUrl}
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-600">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            className="font-display text-[16px] font-semibold leading-tight tracking-[-0.02em] text-white transition hover:underline cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
                            type="button"
                            onClick={() => onView(vehicle)}
                          >
                            {vehicleTitle(vehicle)}
                          </button>
                          <div className="mt-1 text-[12.5px] font-medium text-neutral-500">
                            {vehicle.year} ·{" "}
                            {vehicle.mileageKm
                              ? `${vehicle.mileageKm.toLocaleString()} km`
                              : "Mileage not set"}{" "}
                            · {vehicle.media?.length ?? 0} media
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 text-[13px] font-[900!important]",
                          vehicle.status === "sold" ? "opacity-55" : "",
                          vehicle.status === "available"
                            ? "text-lime-300"
                            : vehicle.status === "reserved"
                              ? "text-amber-300"
                              : "text-neutral-500",
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            vehicle.status === "available"
                              ? "bg-lime-300"
                              : vehicle.status === "reserved"
                                ? "bg-amber-300"
                                : "bg-neutral-600",
                          )}
                        />
                        {vehicle.status}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-6 py-4 font-display text-[17px] font-semibold tracking-[-0.02em] text-white",
                        vehicle.status === "sold" ? "opacity-55" : "",
                      )}
                    >
                      {formatCompactNgn(vehicle.priceNgn)}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={cn(
                          "space-y-1",
                          vehicle.status === "sold" ? "opacity-55" : "",
                        )}
                      >
                        <Badge tone={reviewTone}>{reviewLabel}</Badge>
                        {vehicle.isFeatured ? (
                          <Badge tone="lime">Featured</Badge>
                        ) : null}
                        {vehicle.openReviewIssueCount ? (
                          <div className="text-[11px] font-bold text-red-300">
                            {vehicle.openReviewIssueCount} issue
                            {vehicle.openReviewIssueCount === 1 ? "" : "s"} to
                            fix
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td
                      className={cn(
                        "px-6 py-4 text-neutral-400",
                        vehicle.status === "sold" ? "opacity-55" : "",
                      )}
                    >
                      {formatRelativeDate(
                        vehicle.publishedAt ?? vehicle.createdAt,
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <VehicleActionsMenu
                        vehicle={vehicle}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onShare={onShare}
                        onStatusChange={onStatusChange}
                        onToggleFeature={onToggleFeature}
                        onView={onView}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {paginationFooter() ?? (
          <EmptyCarsState
            isFiltered={inventoryCount > 0 && isEmpty}
            onAddVehicle={onAddVehicle}
          />
        )}
      </div>
    </div>
  );
}
