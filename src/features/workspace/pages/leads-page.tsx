import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, MoreHorizontal, Phone, Plus, Share2, StickyNote, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { VehicleDetailsDialog } from "@/features/workspace/components/cars/vehicle-details-dialog";
import type {
  DealerProfile,
  Lead,
  LeadNote,
  Paginated,
  Vehicle,
} from "@/features/workspace/types";
import { api, patch, post } from "@/lib/api";
import { queryClient } from "@/lib/query";
import { routes } from "@/lib/routes";
import { cn, formatDate, unwrapList } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";

const stages = [
  { value: "new", label: "New", dot: "bg-red-400", ring: "ring-red-400/40" },
  { value: "contacted", label: "Contacted", dot: "bg-blue-400", ring: "ring-blue-400/40" },
  { value: "inspection", label: "Inspection", dot: "bg-lime-300", ring: "ring-lime-300/50" },
  { value: "reserved", label: "Reserved", dot: "bg-amber-300", ring: "ring-amber-300/50" },
  { value: "sold", label: "Sold", dot: "bg-emerald-400", ring: "ring-emerald-400/40" },
] as const;

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

function leadName(lead: Lead) {
  return lead.buyerName ?? lead.name ?? "Buyer";
}

function leadVehicle(lead: Lead) {
  return lead.vehicleTitle ?? lead.message ?? "Vehicle inquiry";
}

function leadPhone(lead: Lead) {
  return lead.buyerPhone ?? lead.phone ?? "No phone";
}

function stageMeta(value?: string) {
  return (
    stages.find((stage) => stage.value === value) ?? {
      label: "New",
      dot: "bg-red-400",
      ring: "ring-red-400/40",
      value: "new" as const,
    }
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

function timeAgo(value?: string | null) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function nextStage(currentStage?: string) {
  const order = stages.map((stage) => stage.value);
  const currentIndex = order.indexOf(
    (currentStage ?? "new") as (typeof order)[number],
  );
  return order[Math.min(Math.max(currentIndex, 0) + 1, order.length - 1)];
}

function phoneHref(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : undefined;
}

function whatsappHref(phone: string) {
  const normalized = phone.replace(/[^\d]/g, "");
  return normalized ? `https://wa.me/${normalized}` : undefined;
}

function LeadVehicleLink({
  lead,
  className,
  onOpen,
}: {
  lead: Lead;
  className?: string;
  onOpen: (vehicleId: string) => void;
}) {
  const label = leadVehicle(lead);
  if (!lead.vehicleId) {
    return (
      <span
        className={cn(
          "block min-w-0 max-w-full truncate text-neutral-400",
          className,
        )}
        title={label}
      >
        {label}
      </span>
    );
  }
  return (
    <button
      className={cn(
        "block min-w-0 max-w-full cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap border-0 bg-transparent p-0 text-left font-medium text-lime-300 transition hover:underline",
        className,
      )}
      title={label}
      type="button"
      onClick={() => onOpen(lead.vehicleId as string)}
    >
      {label}
    </button>
  );
}

function LeadCard({
  lead,
  stage,
  onMoveForward,
  onOpenVehicle,
  onOpenNotes,
}: {
  lead: Lead;
  stage: (typeof stages)[number];
  onMoveForward: (lead: Lead) => void;
  onOpenVehicle: (vehicleId: string) => void;
  onOpenNotes: (lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { leadId: lead.id },
  });
  const promotedStage = nextStage(lead.stage);
  const phone = leadPhone(lead);
  const tel = phoneHref(phone);
  const whatsapp = whatsappHref(phone);

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-[16px] border border-white/8 bg-[#17171a]/90 p-3.5 shadow-xl shadow-black/15 ring-1 transition sm:p-4",
        stage.ring,
        isDragging && "opacity-70",
      )}
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-[12px] font-bold text-white ring-1 ring-white/10">
          {initials(leadName(lead))}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="truncate font-display text-[15px] font-semibold text-white"
            title={leadName(lead)}
          >
            {leadName(lead)}
          </div>
          <LeadVehicleLink
            className="mt-0.5 text-[12.5px]"
            lead={lead}
            onOpen={onOpenVehicle}
          />
        </div>
      </div>
      <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 truncate text-[12px] font-bold text-neutral-500" title={phone}>
          {phone}
        </div>
        <div className="shrink-0 text-[11px] font-bold text-neutral-500">
          {timeAgo(lead.createdAt)}
        </div>
      </div>
      {lead.followUpAt ? (
        <div className="mt-2 truncate rounded-lg bg-amber-300/10 px-2 py-1 text-[11px] font-bold text-amber-200">
          Follow up {formatDate(lead.followUpAt)}
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <a
          className="grid h-9 place-items-center rounded-xl bg-white/8 text-neutral-300 ring-1 ring-white/10 transition hover:bg-white/12"
          href={tel}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Phone className="h-4 w-4" />
        </a>
        <a
          className="grid h-9 place-items-center rounded-xl bg-white/8 text-neutral-300 ring-1 ring-white/10 transition hover:bg-white/12"
          href={whatsapp}
          rel="noreferrer"
          target="_blank"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MessageCircle className="h-4 w-4" />
        </a>
        <button
          className="grid h-9 cursor-pointer place-items-center rounded-xl bg-white/8 text-neutral-300 ring-1 ring-white/10 transition hover:bg-white/12"
          type="button"
          onClick={() => onOpenNotes(lead)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <StickyNote className="h-4 w-4" />
        </button>
      </div>
      {(lead.stage ?? "new") !== "sold" ? (
        <button
          className="mt-3 h-9 w-full cursor-pointer truncate rounded-xl bg-white/8 px-2 text-[12px] font-[900!important] text-neutral-300 ring-1 ring-white/10 transition hover:bg-lime-300 hover:text-neutral-950"
          type="button"
          onClick={() => onMoveForward(lead)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          Move to {stageMeta(promotedStage).label}
        </button>
      ) : null}
    </article>
  );
}

function PipelineColumn({
  stage,
  leads,
  onMoveForward,
  onOpenVehicle,
  onOpenNotes,
}: {
  stage: (typeof stages)[number];
  leads: Lead[];
  onMoveForward: (lead: Lead) => void;
  onOpenVehicle: (vehicleId: string) => void;
  onOpenNotes: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });

  return (
    <section
      className="flex w-[min(300px,85vw)] shrink-0 snap-center flex-col md:h-full md:min-h-0 md:w-auto md:min-w-0"
      key={stage.value}
    >
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", stage.dot)} />
        <h2 className="min-w-0 truncate font-display text-[14px] font-semibold tracking-[-0.02em] text-white">
          {stage.label}
        </h2>
        <span className="shrink-0 rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-bold text-neutral-400">
          {leads.length}
        </span>
      </div>
      <div
        className={cn(
          "min-h-[420px] min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-[18px] border border-dashed border-white/10 bg-transparent p-3 transition md:min-h-0",
          isOver && "border-lime-300/40 bg-lime-300/5",
        )}
        ref={setNodeRef}
      >
        <div className="min-w-0 space-y-3">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stage={stage}
              onMoveForward={onMoveForward}
              onOpenNotes={onOpenNotes}
              onOpenVehicle={onOpenVehicle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AddLeadDialog({
  open,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: LeadForm) => void;
}) {
  const [form, setForm] = useState<LeadForm>({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  function update<Key extends keyof LeadForm>(key: Key, value: LeadForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog open={open} title="Add a lead" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              required
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Interest</Label>
          <Textarea
            placeholder="What car is the buyer asking about?"
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
          />
        </div>
        <Button
          disabled={pending || !form.name.trim() || !form.phone.trim()}
          type="submit"
        >
          {pending ? "Adding..." : "Add lead"}
        </Button>
      </form>
    </Dialog>
  );
}

function LeadNotesDialog({
  lead,
  pending,
  onClose,
  onAddNote,
  onSetReminder,
}: {
  lead: Lead | null;
  pending: boolean;
  onClose: () => void;
  onAddNote: (lead: Lead, body: string) => void;
  onSetReminder: (lead: Lead, followUpAt: string | null) => void;
}) {
  const [body, setBody] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");

  useEffect(() => {
    setBody("");
    setFollowUpAt(lead?.followUpAt ? lead.followUpAt.slice(0, 16) : "");
  }, [lead]);

  return (
    <Dialog open={Boolean(lead)} title={lead ? `Notes · ${leadName(lead)}` : "Lead notes"} onClose={onClose}>
      {lead ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Follow-up reminder</Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={followUpAt}
                onChange={(event) => setFollowUpAt(event.target.value)}
              />
              <Button
                disabled={pending}
                type="button"
                variant="secondary"
                onClick={() => onSetReminder(lead, followUpAt ? new Date(followUpAt).toISOString() : null)}
              >
                Save
              </Button>
            </div>
          </div>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!body.trim()) return;
              onAddNote(lead, body.trim());
            }}
          >
            <Label>Add note</Label>
            <Textarea
              placeholder="Add conversation notes for your team..."
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
            <Button disabled={pending || !body.trim()} type="submit">
              {pending ? "Saving..." : "Save note"}
            </Button>
          </form>
          <div className="space-y-2">
            {(lead.notes ?? []).length ? (
              (lead.notes ?? []).map((note: LeadNote) => (
                <div className="rounded-2xl border border-white/8 bg-black/20 p-3" key={note.id}>
                  <p className="text-[13px] font-semibold leading-6 text-neutral-200">{note.body}</p>
                  <div className="mt-2 text-[11px] font-bold text-neutral-500">
                    {note.authorName || "Team"}{note.createdAt ? ` · ${formatDate(note.createdAt)}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-[13px] font-semibold text-neutral-500">
                No notes yet.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function EmptyLeadsState({ onAddLead }: { onAddLead: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="pointer-events-auto max-w-[420px] text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] border border-lime-300/20 bg-lime-300/10 text-lime-300 shadow-2xl shadow-lime-950/20">
          <Users className="h-10 w-10" />
        </div>
        <h2 className="mt-6 font-display text-[26px] font-semibold tracking-[-0.035em] text-white">
          No leads yet
        </h2>
        <p className="mt-3 text-[14px] font-medium leading-7 text-neutral-400">
          When a buyer enquires, books an inspection, or messages you about a
          car, they’ll land here as a lead. Drag them across the pipeline as the
          deal moves.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" onClick={onAddLead}>
            <Plus className="h-4 w-4" />
            Add a lead
          </Button>
          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/8 px-5 text-[14px] font-[900!important] text-white ring-1 ring-white/10 transition hover:bg-white/12"
            to={routes.stock}
          >
            <Share2 className="h-4 w-4" />
            Share my listings
          </Link>
        </div>
      </div>
    </div>
  );
}

function LeadActionsMenu({
  lead,
  onStageChange,
}: {
  lead: Lead;
  onStageChange: (stage: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentStage = lead.stage ?? "new";

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

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <button
        aria-label={`Open actions for ${leadName(lead)}`}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-neutral-300 transition hover:bg-neutral-500/15 hover:text-white"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[220px] rounded-[18px] border border-white/10 bg-[#17171a] p-3 text-left shadow-2xl shadow-black/50">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
            Move to stage
          </div>
          {stages.map((stage) => {
            const active = stage.value === currentStage;
            return (
              <button
                className={cn(
                  "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-[900!important] transition",
                  active
                    ? "cursor-default text-neutral-600"
                    : "cursor-pointer text-white hover:bg-neutral-500/15",
                )}
                disabled={active}
                key={stage.value}
                type="button"
                onClick={() => {
                  if (!active) {
                    onStageChange(stage.value);
                    setOpen(false);
                  }
                }}
              >
                <span className={cn("h-2 w-2 rounded-full", stage.dot)} />
                {stage.label}
                {active ? (
                  <span className="ml-auto text-[11px] font-bold text-neutral-600">
                    Current
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function LeadsListTable({
  leads,
  onOpenVehicle,
  onStageChange,
}: {
  leads: Lead[];
  onOpenVehicle: (vehicleId: string) => void;
  onStageChange: (lead: Lead, stage: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[#0f0f12]/70">
      <div className="space-y-3 p-3 md:hidden">
        {leads.map((lead) => {
          const meta = stageMeta(lead.stage);
          return (
            <article
              className="min-w-0 overflow-hidden rounded-[16px] border border-white/8 bg-[#17171a]/90 p-4"
              key={lead.id}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div
                    className="truncate font-display text-[15px] font-semibold text-white"
                    title={leadName(lead)}
                  >
                    {leadName(lead)}
                  </div>
                  <LeadVehicleLink
                    className="mt-0.5 text-[12.5px]"
                    lead={lead}
                    onOpen={onOpenVehicle}
                  />
                </div>
                <LeadActionsMenu
                  lead={lead}
                  onStageChange={(stage) => onStageChange(lead, stage)}
                />
              </div>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/8 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/10">
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
                <span className="min-w-0 truncate text-[12px] font-medium text-neutral-400">
                  {leadPhone(lead)}
                </span>
                <span className="text-[11px] font-bold text-neutral-500">
                  {formatDate(lead.createdAt)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
          <thead className="bg-white/3 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            <tr>
              <th className="px-5 py-4 font-bold">Buyer</th>
              <th className="px-5 py-4 font-bold">Vehicle</th>
              <th className="px-5 py-4 font-bold">Phone</th>
              <th className="px-5 py-4 font-bold">Stage</th>
              <th className="px-5 py-4 font-bold">Created</th>
              <th className="px-5 py-4 font-bold" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const meta = stageMeta(lead.stage);
              return (
                <tr className="border-b border-white/8 text-neutral-300 last:border-b-0" key={lead.id}>
                  <td className="max-w-[180px] px-5 py-4">
                    <span className="block truncate font-medium text-white" title={leadName(lead)}>
                      {leadName(lead)}
                    </span>
                  </td>
                  <td className="max-w-[220px] px-5 py-4">
                    <LeadVehicleLink lead={lead} onOpen={onOpenVehicle} />
                  </td>
                  <td className="max-w-[160px] px-5 py-4">
                    <span className="block truncate text-neutral-400" title={leadPhone(lead)}>
                      {leadPhone(lead)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/8 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/10">
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-neutral-400">
                      {formatDate(lead.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <LeadActionsMenu
                      lead={lead}
                      onStageChange={(stage) => onStageChange(lead, stage)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LeadsPage() {
  const [view, setView] = useState<"board" | "list">("board");
  const [addOpen, setAddOpen] = useState(false);
  const [notesLead, setNotesLead] = useState<Lead | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const navigate = useNavigate();
  const leads = useQuery({
    queryKey: ["leads"],
    queryFn: () => api<Paginated<Lead>>("/v1/leads"),
  });
  const profile = useQuery({
    queryKey: ["dealer-profile"],
    queryFn: () => api<DealerProfile>("/v1/dealers/me"),
  });
  const update = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      patch<Lead>(`/v1/leads/${id}`, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
  const fetchVehicle = useMutation({
    mutationFn: (vehicleId: string) => api<Vehicle>(`/v1/vehicles/${vehicleId}`),
    onSuccess: (vehicle) => setViewingVehicle(vehicle),
    onError: (error) => toast.error(error.message),
  });
  const updateReminder = useMutation({
    mutationFn: ({ lead, followUpAt }: { lead: Lead; followUpAt: string | null }) =>
      patch<Lead>(`/v1/leads/${lead.id}`, { followUpAt }),
    onSuccess: async (lead) => {
      toast.success("Reminder saved");
      setNotesLead((current) => (current?.id === lead.id ? lead : current));
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const addNote = useMutation({
    mutationFn: ({ lead, body }: { lead: Lead; body: string }) =>
      post<LeadNote>(`/v1/leads/${lead.id}/notes`, { body }),
    onSuccess: async (note, values) => {
      toast.success("Note added");
      setNotesLead((current) =>
        current?.id === values.lead.id
          ? { ...current, notes: [note, ...(current.notes ?? [])] }
          : current,
      );
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const create = useMutation({
    mutationFn: (values: LeadForm) =>
      post<Lead>("/v1/leads", {
        dealerSlug: profile.data?.slug,
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        message: values.message,
        source: "feed",
      }),
    onSuccess: () => {
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  function openVehicleDetail(vehicleId: string) {
    fetchVehicle.mutate(vehicleId);
  }

  function shareVehicle(vehicle: Vehicle) {
    const url = `${window.location.origin}/vehicles/${vehicle.slug ?? vehicle.id}`;
    if (navigator.share) {
      navigator
        .share({ title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, url })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success("Listing link copied"), () => toast.error("Unable to copy listing link"));
    }
  }

  const allLeads = unwrapList(leads.data);
  const activeLeads = allLeads.filter(
    (lead) => !["sold", "lost"].includes(lead.stage ?? "new"),
  );
  const needsFirstContact = allLeads.filter(
    (lead) => (lead.stage ?? "new") === "new",
  ).length;
  const hasLeads = allLeads.length > 0;

  function handleDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const stage = String(event.over?.id ?? "");
    if (!stage || !stages.some((item) => item.value === stage)) return;
    const lead = allLeads.find((item) => item.id === leadId);
    if (!lead || lead.stage === stage) return;
    update.mutate({ id: lead.id, stage });
  }

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">
            Leads
          </h1>
          <p className="mt-2 text-[14px] font-semibold text-neutral-400">
            {activeLeads.length} active · {needsFirstContact} need first contact
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button
            className="w-full sm:w-auto"
            type="button"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add a lead
          </Button>
          <div className="inline-flex w-full rounded-[14px] border border-white/10 bg-[#101014]/80 p-1 sm:w-auto">
            {(["board", "list"] as const).map((option) => (
              <button
                className={cn(
                  "h-10 flex-1 cursor-pointer rounded-xl px-4 text-[13px] font-[900!important] capitalize transition sm:flex-none",
                  view === option
                    ? "bg-lime-300 text-neutral-950"
                    : "text-neutral-400 hover:bg-neutral-500/15 hover:text-white",
                )}
                key={option}
                type="button"
                onClick={() => setView(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
      {view === "board" ? (
        <div className="relative pb-2">
          <DndContext onDragEnd={handleDragEnd}>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:h-[calc(100dvh-260px)] md:min-h-[610px] md:min-w-0 md:snap-none md:grid-cols-5 md:overflow-visible md:pb-0 md:[-ms-overflow-style:auto] md:[scrollbar-width:auto]">
              {stages.map((stage) => (
                <PipelineColumn
                  key={stage.value}
                  leads={allLeads.filter((lead) => (lead.stage ?? "new") === stage.value)}
                  stage={stage}
                  onMoveForward={(lead) => update.mutate({ id: lead.id, stage: nextStage(lead.stage) })}
                  onOpenNotes={setNotesLead}
                  onOpenVehicle={openVehicleDetail}
                />
              ))}
            </div>
          </DndContext>
          {!hasLeads ? (
            <EmptyLeadsState onAddLead={() => setAddOpen(true)} />
          ) : null}
        </div>
      ) : hasLeads ? (
        <LeadsListTable
          leads={allLeads}
          onOpenVehicle={openVehicleDetail}
          onStageChange={(lead, stage) =>
            update.mutate({ id: lead.id, stage })
          }
        />
      ) : (
        <div className="relative min-h-[560px] rounded-[18px] border border-dashed border-white/10">
          <EmptyLeadsState onAddLead={() => setAddOpen(true)} />
        </div>
      )}
      <AddLeadDialog
        open={addOpen}
        pending={create.isPending}
        onClose={() => setAddOpen(false)}
        onSubmit={(values) => create.mutate(values)}
      />
      <LeadNotesDialog
        lead={notesLead}
        pending={addNote.isPending || updateReminder.isPending}
        onAddNote={(lead, body) => addNote.mutate({ lead, body })}
        onClose={() => setNotesLead(null)}
        onSetReminder={(lead, followUpAt) => updateReminder.mutate({ lead, followUpAt })}
      />
      <VehicleDetailsDialog
        vehicle={viewingVehicle}
        onClose={() => setViewingVehicle(null)}
        onEdit={() => {
          setViewingVehicle(null);
          navigate(routes.stock);
        }}
        onShare={(vehicle) => shareVehicle(vehicle)}
      />
    </div>
  );
}
