export type Paginated<T> = { results: T[]; count?: number }

export type DealerLocation = {
  id: string
  name: string
  area?: string
  citySlug?: string
  districtSlug?: string
  address?: string
  isPrimary: boolean
  premisesVerificationStatus: string
  premisesVerifiedAt?: string
  premisesRejectedAt?: string
  premisesRejectionReason?: string
  evidenceFiles?: string[]
  pendingChanges?: Record<string, unknown> | null
  pendingChangesSubmittedAt?: string
  pendingChangesReviewedAt?: string
  pendingChangesRejectionReason?: string
  listingCount?: number
  createdAt?: string
  updatedAt?: string
}

export type BillingSummary = {
  subscription?: {
    id: string
    plan: Plan
    status: string
    currentPeriodEnd?: string
    pendingPlan?: Plan
    pendingPlanEffectiveAt?: string
  } | null
  pendingDowngrade?: {
    planId: string
    planName: string
    effectiveAt: string
  } | null
  paymentMethod?: {
    brand: string
    last4: string
    expMonth: string
    expYear: string
  } | null
  listingLimit: number
  activeListings: number
  canPublish: boolean
  standLimit: number
  standCount: number
  canAddStand: boolean
  vehicleCount: number
}

export type Vehicle = {
  id: string
  slug?: string
  make: string
  model: string
  year: number
  trim?: string
  priceNgn: number
  mileageKm?: number
  status: string
  transmission?: string
  fuel?: string
  colour?: string
  bodyType?: string
  negotiable?: boolean
  notes?: string
  vin?: string
  chassisNumber?: string
  importType?: string
  yearOfManufacture?: number | null
  engineCapacityCc?: number | null
  registrationPlate?: string
  registrationState?: string
  registrationLga?: string
  customsDutyStatus?: string
  customsReference?: string
  customsClearedAt?: string | null
  bodyHistory?: string
  papersStatus?: string
  dutyPaidClaim?: string
  listingTrust?: string
  locationId?: string
  dealer?: { id: string; slug?: string; name: string; area?: string }
  location?: DealerLocation
  reviewStatus?: string
  listingVerificationStatus?: string
  reviewIssues?: VehicleReviewIssue[]
  openReviewIssueCount?: number
  coverMedia?: { url?: string }
  media?: { url?: string; kind?: string; status?: string }[]
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
}

export type VehicleReviewIssue = {
  id: string
  vehicleId: string
  reviewerId?: string
  reviewerName?: string
  status: 'open' | 'resolved' | 'approved' | 'dismissed'
  category: string
  message: string
  dealerResponse?: string
  vehicleSnapshot?: Record<string, unknown>
  vehicleChanges?: Record<string, { before: unknown; after: unknown }>
  resolvedAt?: string
  reviewedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type DealerNotification = {
  id: string
  vehicleId?: string
  reviewIssueId?: string
  reviewIssueStatus?: string
  vehicleTitle?: string
  type: string
  title: string
  body: string
  readAt?: string
  createdAt?: string
}

export type Lead = {
  id: string
  name?: string
  phone?: string
  email?: string
  message?: string
  source?: string
  vehicleId?: string
  locationId?: string
  buyerName?: string
  buyerPhone?: string
  vehicleTitle?: string
  stage?: string
  followUpAt?: string | null
  notes?: LeadNote[]
  createdAt?: string
}

export type LeadNote = {
  id: string
  lead?: string
  authorName?: string
  body: string
  sharedWithTeam?: boolean
  createdAt?: string
}

export type BookingDayHours = {
  enabled: boolean
  open: string
  close: string
}

export type BookingAvailability = {
  locationId?: string | null
  timezone: string
  slotLengthMinutes: number
  maxBookingsPerDay: number
  weeklyHours: Record<string, BookingDayHours>
  blockedDates: string[]
}

export type Appointment = {
  id: string
  bookingId?: string
  buyerName?: string
  buyerPhone?: string
  locationId?: string
  locationName?: string
  locationArea?: string
  vehicleId?: string
  vehicleTitle?: string
  conversationId?: string
  scheduledAt?: string
  status: string
  attendanceStatus?: 'unknown' | 'show' | 'no_show'
  attendedAt?: string | null
  title?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type Plan = {
  id: string
  name: string
  priceNgn: number
  listingLimit: number
  standLimit: number
  features: string[]
}

export type Invoice = {
  id: string
  amountNgn: number
  status: string
  issuedAt: string
  pdfUrl?: string
}

export type Staff = {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  mustChangePassword?: boolean
  invitePending: boolean
  inviteToken?: string
  createdAt?: string
  updatedAt?: string
}

export type DealerProfile = {
  id: string
  slug?: string
  name: string
  verificationStatus: string
  operationalStatus: string
  phone: string
  whatsapp?: string
  logoUrl?: string
  description?: string
  locations: DealerLocation[]
}

export type DealerVerificationDocument = {
  id: string
  kind: 'cac' | 'tax' | 'identity' | 'premises' | 'other'
  title: string
  fileUrl: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  reviewedAt?: string
  createdAt?: string
}

export type DealerVerification = DealerProfile & {
  documents: DealerVerificationDocument[]
}

export type ChatMessage = {
  id: string
  senderType: string
  body: string
  attachmentUrl?: string
  createdAt: string
}

export type Conversation = {
  id: string
  buyer?: {
    id: string
    phone: string
    email?: string
    name?: string
    photoUrl?: string
  }
  lastMessageAt?: string
  dealerLastReadAt?: string
  messages: ChatMessage[]
  bookingId?: string
  vehicle?: Vehicle
}
