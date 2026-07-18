import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/AppShell'
import { ProtectedRoute } from '@/app/protected-route'
import { ForgotPasswordPage, RegisterPage, ResetPasswordPage, SignInPage, VerifyEmailPage } from '@/features/auth'
import {
  AccountPage,
  BillingPage,
  BookingsPage,
  ChatsPage,
  DashboardPage,
  InsightsPage,
  LeadsPage,
  StockPage,
  TeamPage,
} from '@/features/workspace'
import { routes } from '@/lib/routes'

export default function App() {
  return (
    <Routes>
      <Route path={routes.signIn} element={<SignInPage />} />
      <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
      <Route path={routes.register} element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
    </Routes>
  )
}
