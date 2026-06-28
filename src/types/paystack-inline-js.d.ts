declare module '@paystack/inline-js' {
  export type PaystackCheckoutResult = {
    id: number
    reference: string
    message: string
  }

  export type PaystackPopupCallbacks = {
    onSuccess?: (transaction: PaystackCheckoutResult) => void
    onCancel?: () => void
    onError?: (error: { message: string }) => void
    onLoad?: (response: {
      id: number
      accessCode: string
      customer: Record<string, unknown>
    }) => void
  }

  export type PaystackNewTransactionOptions = PaystackPopupCallbacks & {
    key: string
    email: string
    amount: number
    currency?: string
    reference?: string
    metadata?: Record<string, unknown>
  }

  export default class PaystackPop {
    newTransaction(options: PaystackNewTransactionOptions): unknown
    resumeTransaction(accessCode: string, callbacks?: PaystackPopupCallbacks): unknown
  }
}
