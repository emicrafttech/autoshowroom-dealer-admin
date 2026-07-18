import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Car,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Share2,
  TrendingUp,
} from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { Badge, Button, Input } from "@/components/ui";
import { ChatConversationList } from "@/features/workspace/components/chats/chat-conversation-list";
import { uploadChatAttachment } from "@/features/workspace/components/chats/chat-attachments";
import { BuyerAvatar, buyerDisplayName } from "@/features/workspace/components/chats/buyer-avatar";
import { ChatMessagePanel } from "@/features/workspace/components/chats/chat-message-panel";
import {
  isUnreadConversation,
  useDealerChats,
} from "@/features/workspace/components/chats/use-dealer-chats";
import type {
  ChatMessage,
  Conversation,
  Paginated,
  Vehicle,
} from "@/features/workspace/types";
import { vehicleImageUrl, vehicleTitle } from "@/features/workspace/utils";
import { API_BASE_URL, api, patch, post } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { queryClient } from "@/lib/query";
import { routes } from "@/lib/routes";
import { cn, formatCompactNgn, formatDate, unwrapList } from "@/lib/utils";

type ChatFilter = "all" | "unread" | "booked";

type DealerMessageThread = {
  id: string
  subject: string
  dealerName?: string
  status: string
  messages: Array<{ id: string; senderName?: string; senderType: 'platform' | 'dealer'; body: string; createdAt?: string }>
  updatedAt?: string
}

function buyerName(conversation?: Conversation) {
  return buyerDisplayName(conversation?.buyer) === "Buyer"
    ? "Select a buyer"
    : buyerDisplayName(conversation?.buyer);
}

function EmptyInboxSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      {[0, 1].map((item) => (
        <div
          className="flex gap-3 rounded-[16px] bg-white/2.5 px-3 py-3"
          key={item}
        >
          <div className="h-11 w-11 rounded-full bg-white/[0.035]" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-3 w-3/5 rounded-full bg-white/[0.035]" />
            <div className="h-2.5 w-4/5 rounded-full bg-white/2.5" />
            <div className="h-2.5 w-2/3 rounded-full bg-white/2.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChatState() {
  const featureCards = [
    {
      icon: MessageCircle,
      title: "Buyers reach you",
      body: "Straight from your live car listings.",
      tone: "text-blue-300 bg-blue-400/10",
    },
    {
      icon: Calendar,
      title: "Book inspections",
      body: "Turn a chat into a booking in one tap.",
      tone: "text-lime-300 bg-lime-300/10",
    },
    {
      icon: TrendingUp,
      title: "Close faster",
      body: "Every chat is tracked as a lead.",
      tone: "text-amber-300 bg-amber-300/10",
    },
  ];

  return (
    <section className="grid min-h-0 place-items-center overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-[640px] text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] border border-lime-300/20 bg-lime-300/10 text-lime-300 shadow-2xl shadow-lime-950/20">
          <MessageCircle className="h-10 w-10" />
        </div>
        <h2 className="mt-7 font-display text-[27px] font-semibold tracking-[-0.035em] text-white">
          No conversations yet
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] font-medium leading-7 text-neutral-400">
          When a buyer messages you about a car, the chat opens here. Reply fast
          because listings that get a response within 10 minutes are more likely
          to sell.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 text-[14px] font-[900!important] text-neutral-950 transition hover:bg-lime-200"
            to={routes.stock}
          >
            <Share2 className="h-4 w-4" />
            Share a listing
          </Link>
          <Link
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/8 px-5 text-[14px] font-[900!important] text-neutral-100 ring-1 ring-white/10 transition hover:bg-white/12"
            to={routes.stock}
          >
            <Car className="h-4 w-4" />
            View my cars
          </Link>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                className="rounded-[18px] border border-white/8 bg-white/[0.035] p-4 text-left"
                key={feature.title}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-xl ${feature.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-4 text-[13px] font-[900!important] text-white">
                  {feature.title}
                </div>
                <p className="mt-1 text-[12px] font-medium leading-5 text-neutral-500">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ChatsPage() {
  const [filter, setFilter] = useState<ChatFilter>("all");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [mobilePane, setMobilePane] = useState<"inbox" | "thread">("inbox");
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
  const [selectedAdminThreadId, setSelectedAdminThreadId] = useState("");
  const [adminReply, setAdminReply] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const paramConversationId = searchParams.get("conversation");
  const chats = useDealerChats();
  const adminThreads = useQuery({
    queryKey: ["dealer-admin-message-threads"],
    queryFn: () => api<DealerMessageThread[]>("/v1/dealers/me/messages"),
  });
  const selectedAdminThread =
    adminThreads.data?.find((thread) => thread.id === selectedAdminThreadId) ?? adminThreads.data?.[0];
  const sendAdminReply = useMutation({
    mutationFn: () =>
      post<DealerMessageThread>("/v1/dealers/me/messages", {
        threadId: selectedAdminThread?.id,
        body: adminReply,
      }),
    onSuccess: (thread) => {
      setSelectedAdminThreadId(thread.id);
      setAdminReply("");
      queryClient.invalidateQueries({ queryKey: ["dealer-admin-message-threads"] });
      toast.success("Reply sent");
    },
    onError: (error) => toast.error(error.message),
  });
  const markRead = useMutation({
    mutationFn: (conversationId: string) =>
      post<Conversation>(`/v1/dealers/me/chats/${conversationId}/read`),
    onSuccess: (conversation) => {
      queryClient.setQueryData(
        ["dealer-chats"],
        (current?: Conversation[] | Paginated<Conversation>) => {
          if (!current) return current;
          const updateConversation = (items: Conversation[]) =>
            items.map((item) =>
              item.id === conversation.id ? conversation : item,
            );
          if (Array.isArray(current)) return updateConversation(current);
          return {
            ...current,
            results: updateConversation(current.results),
          };
        },
      );
    },
  });
  const sendMessage = useMutation({
    mutationFn: async () => {
      let attachmentUrl = "";
      if (pendingAttachment) {
        setUploadingAttachment(true);
        attachmentUrl = await uploadChatAttachment(
          selectedChatId,
          pendingAttachment,
        );
      }
      return post<Conversation>(`/v1/dealers/me/chats/${selectedChatId}/respond`, {
        message: draft,
        ...(attachmentUrl ? { attachmentUrl } : {}),
      });
    },
    onSuccess: (conversation) => {
      setDraft("");
      setPendingAttachment(null);
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
      setAttachmentPreview(null);
      setUploadingAttachment(false);
      setLiveMessages(conversation.messages);
      queryClient.invalidateQueries({ queryKey: ["dealer-chats"] });
    },
    onError: (error) => {
      setUploadingAttachment(false);
      toast.error(error.message);
    },
  });
  const updateVehicleStatus = useMutation({
    mutationFn: ({
      vehicleId,
      status,
    }: {
      vehicleId: string;
      status: "available" | "sold";
    }) =>
      patch<Vehicle>(`/v1/vehicles/${vehicleId}/status`, {
        status,
        ...(status === "available" ? { attestationAccepted: true } : {}),
      }),
    onSuccess: (updatedVehicle) => {
      toast.success(
        updatedVehicle.status === "sold"
          ? "Vehicle marked as sold"
          : "Vehicle marked as available",
      );
      queryClient.setQueryData(
        ["dealer-chats"],
        (current?: Conversation[] | Paginated<Conversation>) => {
          if (!current) return current;
          const updateConversation = (conversation: Conversation) =>
            conversation.vehicle?.id === updatedVehicle.id
              ? {
                  ...conversation,
                  vehicle: {
                    ...conversation.vehicle,
                    status: updatedVehicle.status,
                  },
                }
              : conversation;
          if (Array.isArray(current)) {
            return current.map(updateConversation);
          }
          return {
            ...current,
            results: current.results.map(updateConversation),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["dealer-chats"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const conversations = unwrapList(chats.data);
  const filteredConversations = conversations.filter((conversation) => {
    const query = search.trim().toLowerCase();
    const vehicle = conversation.vehicle
      ? vehicleTitle(conversation.vehicle).toLowerCase()
      : "";
    const buyer =
      `${conversation.buyer?.name ?? ""} ${conversation.buyer?.phone ?? ""}`.toLowerCase();
    const matchesSearch = !query || `${vehicle} ${buyer}`.includes(query);
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && isUnreadConversation(conversation)) ||
      (filter === "booked" && Boolean(conversation.bookingId));
    return matchesSearch && matchesFilter;
  });
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedChatId) ??
    filteredConversations[0];
  const selectedVehicle = selectedConversation?.vehicle;
  const isVehicleSold = selectedVehicle?.status === "sold";
  const unreadCount = conversations.filter(isUnreadConversation).length;
  const bookedCount = conversations.filter(
    (conversation) => conversation.bookingId,
  ).length;
  const hasConversations = conversations.length > 0;

  useEffect(() => {
    if (paramConversationId) {
      const exists = conversations.some(
        (conversation) => conversation.id === paramConversationId,
      );
      if (exists && selectedChatId !== paramConversationId) {
        setSelectedChatId(paramConversationId);
        setMobilePane("thread");
      }
      return;
    }
    if (!selectedChatId && filteredConversations[0]) {
      setSelectedChatId(filteredConversations[0].id);
    }
  }, [filteredConversations, selectedChatId, paramConversationId, conversations]);

  function selectChat(chatId: string) {
    setSelectedChatId(chatId);
    setMobilePane("thread");
  }

  useEffect(() => {
    setLiveMessages(selectedConversation?.messages ?? []);
  }, [selectedConversation?.messages]);

  useEffect(() => {
    if (!selectedChatId) return;
    const conversation = conversations.find((item) => item.id === selectedChatId);
    if (!conversation || !isUnreadConversation(conversation)) return;
    markRead.mutate(selectedChatId);
  }, [selectedChatId, conversations]);

  useEffect(() => {
    if (!selectedConversation?.vehicle?.id || !selectedConversation.id) return;
    const token = getAccessToken();
    if (!token) return;
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `/ws/vehicles/${selectedConversation.vehicle.id}/chats/${selectedConversation.id}/`;
    url.searchParams.set("token", token);
    const socket = new WebSocket(url.toString());
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { message?: ChatMessage };
      const nextMessage = payload.message;
      if (nextMessage) {
        setLiveMessages((current) =>
          current.some((message) => message.id === nextMessage.id)
            ? current
            : [...current, nextMessage],
        );
        if (nextMessage.senderType === "buyer") {
          markRead.mutate(selectedConversation.id);
        }
        queryClient.invalidateQueries({ queryKey: ["dealer-chats"] });
      }
    };
    return () => socket.close();
  }, [selectedConversation?.id, selectedConversation?.vehicle?.id]);

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image attachments are supported in chat.");
      return;
    }
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setPendingAttachment(file);
    setAttachmentPreview(URL.createObjectURL(file));
  }

  const canSend =
    Boolean(selectedConversation) &&
    !sendMessage.isPending &&
    !uploadingAttachment &&
    (draft.trim().length > 0 || pendingAttachment != null);

  const showInbox = hasConversations && mobilePane === "inbox";
  const showThread = hasConversations && mobilePane === "thread";

  return (
    <div
      className={cn(
        "grid h-full min-h-0 grid-rows-1 overflow-hidden",
        hasConversations
          ? "xl:grid-cols-[330px_minmax(420px,1fr)_300px]"
          : "xl:grid-cols-[330px_minmax(520px,1fr)]",
      )}
    >
      <aside
        className={cn(
          "min-h-0 flex-col border-r border-white/8 p-4",
          hasConversations
            ? showInbox
              ? "flex"
              : "hidden xl:flex"
            : "hidden xl:flex",
        )}
      >
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.035em] text-white">
          Chats
        </h1>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
          <Input
            className="h-11 rounded-[14px] bg-black/25 pl-10 text-[13px]"
            placeholder="Search buyers or cars..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "All", value: "all", count: conversations.length },
            { label: "Unread", value: "unread", count: unreadCount },
            { label: "Booked", value: "booked", count: bookedCount },
          ].map((item) => (
            <button
              className={cn(
                "h-9 cursor-pointer rounded-full px-4 text-[12px] font-[900!important] transition",
                filter === item.value
                  ? "bg-lime-300 text-neutral-950"
                  : "bg-white/8 text-neutral-300 hover:bg-white/12",
              )}
              key={item.value}
              type="button"
              onClick={() => {
                setFilter(item.value as ChatFilter);
                setSelectedChatId("");
                setMobilePane("inbox");
              }}
            >
              {item.label} {item.count}
            </button>
          ))}
        </div>
        <section className="mt-4 shrink-0 rounded-2xl border border-white/8 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[14px] font-semibold text-white">Admin messages</h2>
            <Badge tone="slate">{adminThreads.data?.length ?? 0}</Badge>
          </div>
          {selectedAdminThread ? (
            <div className="mt-3 space-y-3">
              <select
                className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-[#17171a] px-3 text-[12px] font-semibold text-white outline-none"
                value={selectedAdminThread.id}
                onChange={(event) => setSelectedAdminThreadId(event.target.value)}
              >
                {adminThreads.data?.map((thread) => (
                  <option key={thread.id} value={thread.id}>{thread.subject}</option>
                ))}
              </select>
              <div className="max-h-28 space-y-2 overflow-y-auto xl:max-h-36">
                {selectedAdminThread.messages.slice(-3).map((message) => (
                  <div className={cn('rounded-xl p-2 text-[12px] font-medium leading-5', message.senderType === 'dealer' ? 'bg-lime-300/10 text-lime-100' : 'bg-white/8 text-neutral-200')} key={message.id}>
                    {message.body}
                  </div>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (adminReply.trim() && selectedAdminThread) sendAdminReply.mutate()
                }}
              >
                <Input className="h-10 text-[12px]" placeholder="Reply..." value={adminReply} onChange={(event) => setAdminReply(event.target.value)} />
                <Button disabled={sendAdminReply.isPending || !adminReply.trim()} size="sm" type="submit">
                  Send
                </Button>
              </form>
            </div>
          ) : (
            <p className="mt-2 text-[12px] font-medium text-neutral-500">No admin threads yet.</p>
          )}
        </section>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {hasConversations ? (
            <ChatConversationList
              conversations={filteredConversations}
              selectedChatId={selectedConversation?.id ?? ""}
              onSelectChat={selectChat}
            />
          ) : (
            <EmptyInboxSkeleton />
          )}
        </div>
        {!hasConversations ? (
          <p className="px-4 pb-1 text-center text-[12.5px] font-medium leading-5 text-neutral-500 xl:block">
            Buyer chats from your listings will appear here, grouped by car.
          </p>
        ) : null}
      </aside>

      {!hasConversations ? <EmptyChatState /> : null}

      {hasConversations ? (
      <section
        className={cn(
          "min-h-0 flex-col overflow-hidden border-r border-white/8",
          showThread ? "flex" : "hidden xl:flex",
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <button
            aria-label="Back to inbox"
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/8 text-white transition hover:bg-white/12 xl:hidden"
            type="button"
            onClick={() => setMobilePane("inbox")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BuyerAvatar buyer={selectedConversation?.buyer} />
            <div className="min-w-0">
              <div className="truncate font-display text-[16px] font-semibold tracking-[-0.02em] text-white sm:text-[17px]">
                {buyerName(selectedConversation)}
              </div>
              <div className="mt-0.5 truncate text-[12px] font-semibold text-lime-300">
                Online · enquiring about{" "}
                {selectedVehicle ? vehicleTitle(selectedVehicle) : "a listing"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
          <ChatMessagePanel
            conversation={selectedConversation}
            messages={liveMessages}
            selectedChatId={selectedConversation?.id ?? ""}
            onQuickReply={setDraft}
          />
        </div>

        <form
          className="mx-3 mb-3 flex shrink-0 flex-col gap-3 rounded-[16px] border border-white/8 bg-black/25 p-2 sm:mx-5 sm:mb-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) sendMessage.mutate();
          }}
        >
          {attachmentPreview ? (
            <div className="flex items-center gap-3 px-2 pt-2">
              <div className="h-16 w-16 overflow-hidden rounded-[12px] bg-black/40">
                <img
                  alt="Attachment preview"
                  className="h-full w-full object-cover"
                  src={attachmentPreview}
                />
              </div>
              <div className="min-w-0 flex-1 text-[12px] font-medium text-neutral-400">
                Image ready to send
              </div>
              <Button
                className="h-8 px-3"
                type="button"
                variant="ghost"
                onClick={() => {
                  setPendingAttachment(null);
                  if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
                  setAttachmentPreview(null);
                }}
              >
                Remove
              </Button>
            </div>
          ) : null}
          <div className="flex gap-2 sm:gap-3">
          <input
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            type="file"
            onChange={handleAttachmentChange}
          />
          <Button
            aria-label="Attach image"
            className="h-11 w-11 shrink-0 px-0"
            disabled={!selectedConversation || uploadingAttachment}
            type="button"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            className="h-11 min-w-0 border-transparent bg-transparent focus:border-transparent focus:ring-0"
            disabled={!selectedConversation || uploadingAttachment}
            placeholder="Type a reply..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button className="h-11 shrink-0" disabled={!canSend} type="submit">
            <span className="hidden sm:inline">{uploadingAttachment ? "Uploading..." : "Send"}</span>
            <Send className="h-4 w-4" />
          </Button>
          </div>
        </form>
      </section>
      ) : null}

      {hasConversations ? (
      <aside className="hidden min-h-0 flex-col overflow-y-auto p-4 xl:flex">
        <div>
          <div className="text-[11px] font-[900!important] uppercase tracking-[0.16em] text-neutral-500">
            Listing
          </div>
          {selectedVehicle ? (
            <div className="mt-3 overflow-hidden rounded-[18px] border border-white/8 bg-white/5">
              <div className="relative aspect-[1.45] bg-black/40">
                {vehicleImageUrl(selectedVehicle) ? (
                  <BlurImage
                    alt={vehicleTitle(selectedVehicle)}
                    className="h-full w-full object-cover"
                    src={vehicleImageUrl(selectedVehicle)}
                  />
                ) : null}
                <Badge
                  className="absolute left-3 top-3"
                  tone={isVehicleSold ? "amber" : "lime"}
                >
                  {selectedVehicle.status}
                </Badge>
              </div>
              <div className="p-4">
                <div className="font-display text-[15px] font-semibold text-white">
                  {vehicleTitle(selectedVehicle)}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-neutral-500">
                  {selectedVehicle.year} ·{" "}
                  {selectedVehicle.mileageKm?.toLocaleString() ??
                    "Mileage not set"}{" "}
                  km · {selectedVehicle.bodyType ?? "Car"}
                </div>
                <div className="mt-2 font-display text-[20px] font-semibold text-lime-300">
                  {formatCompactNgn(selectedVehicle.priceNgn)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-[18px] border border-white/8 bg-white/5 p-6 text-center text-[13px] font-semibold text-neutral-500">
              Select a conversation to see listing context.
            </div>
          )}

          <div className="mt-5 text-[11px] font-[900!important] uppercase tracking-[0.16em] text-neutral-500">
            Buyer
          </div>
          <div className="mt-3 space-y-3 text-[13px]">
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-neutral-500">Phone</span>
              <span className="font-[900!important] text-white">
                {selectedConversation?.buyer?.phone ?? "Not set"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-neutral-500">Location</span>
              <span className="font-[900!important] text-white">
                {selectedVehicle?.location?.area ??
                  selectedVehicle?.dealer?.area ??
                  "Not set"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-neutral-500">
                First contact
              </span>
              <span className="font-[900!important] text-white">
                {formatDate(selectedConversation?.messages[0]?.createdAt)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-neutral-500">Lead stage</span>
              <Badge tone="amber">Negotiating</Badge>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="w-full"
            disabled={!selectedVehicle || updateVehicleStatus.isPending}
            type="button"
            variant="secondary"
            onClick={() =>
              selectedVehicle &&
              updateVehicleStatus.mutate({
                vehicleId: selectedVehicle.id,
                status: isVehicleSold ? "available" : "sold",
              })
            }
          >
            {updateVehicleStatus.isPending
              ? "Updating..."
              : isVehicleSold
                ? "Mark as available"
                : "Mark as sold"}
          </Button>
        </div>
      </aside>
      ) : null}
    </div>
  );
}
