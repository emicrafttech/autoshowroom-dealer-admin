import PaystackPop from '@paystack/inline-js'

export type PaystackCheckoutResult = {
  id: number
  reference: string
  message: string
}

export type PaystackCheckoutOptions = {
  publicKey: string
  email: string
  amountKobo: number
  reference: string
  currency?: string
  metadata?: Record<string, unknown>
}

export function startPaystackCheckout(options: PaystackCheckoutOptions): Promise<PaystackCheckoutResult> {
  return new Promise((resolve, reject) => {
    const popup = new PaystackPop()
    popup.newTransaction({
      key: options.publicKey,
      email: options.email,
      amount: options.amountKobo,
      currency: options.currency ?? 'NGN',
      reference: options.reference,
      metadata: options.metadata,
      onSuccess: (transaction) => resolve(transaction),
      onCancel: () => reject(new Error('Payment cancelled')),
      onError: (error) => reject(new Error(error.message || 'Payment failed')),
    })
  })
}
