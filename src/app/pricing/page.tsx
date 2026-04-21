'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: 'price_1TO92kKzAxeqVLKn5eQREGy5' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Simple Pricing</h1>
        <p className="text-center text-gray-500 mb-8">Start free, upgrade when ready</p>

        <div className="grid gap-6">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-1">Free</h2>
            <p className="text-gray-500 text-sm mb-4">Perfect for trying it out</p>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li>✅ 3 free listings</li>
              <li>✅ 3 free rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ MLS, Instagram, Email & more</li>
            </ul>
            <button
              onClick={() => router.push('/signup')}
              className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Get started free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-green-600 rounded-2xl p-6 shadow text-white">
            <h2 className="text-xl font-semibold mb-1">Pro</h2>
            <p className="text-green-100 text-sm mb-4">For active agents</p>
            <p className="text-3xl font-bold mb-4">$29<span className="text-lg font-normal">/mo</span></p>
            <ul className="text-sm text-green-100 space-y-2 mb-6">
              <li>✅ Unlimited listings</li>
              <li>✅ Unlimited rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ MLS, Instagram, Email & more</li>
              <li>✅ Priority support</li>
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-white text-green-600 font-semibold hover:bg-green-50"
            >
              {loading ? 'Loading...' : 'Subscribe now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}