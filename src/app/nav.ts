import {
  BarChart3,
  CalendarDays,
  CarFront,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { routes } from '@/lib/routes'

export const nav = [
  { to: routes.dashboard, label: 'Dashboard', icon: BarChart3 },
  { to: routes.stock, label: 'Listings', icon: CarFront },
  { to: routes.leads, label: 'Leads', icon: Users },
  { to: routes.bookings, label: 'Bookings', icon: CalendarDays },
  { to: routes.insights, label: 'Insights', icon: BarChart3 },
  { to: routes.chats, label: 'Chats', icon: MessageCircle },
  { to: routes.team, label: 'Team', icon: ShieldCheck },
]
